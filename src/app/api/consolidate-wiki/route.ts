import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// Consolidation can loop over many stored summaries per subject and
// routinely exceeds Vercel's default function timeout (10-15s).
export const maxDuration = 300;

const DOC_TYPE_LABEL: Record<string, string> = {
  past_exam: "過去問",
  resume: "授業レジュメ",
  textbook: "教科書",
};

type WikiSectionOut = {
  heading: string;
  content: string;
  sources: string[];
};

type DocRow = {
  title: string;
  doc_type: string;
  year: number | null;
  textbook_name: string | null;
  extracted_content: string;
};

function docLabel(d: DocRow): string {
  return d.doc_type === "past_exam"
    ? `${d.year ?? d.title}年度 ${DOC_TYPE_LABEL[d.doc_type]}`
    : `${d.textbook_name ?? d.title}（${DOC_TYPE_LABEL[d.doc_type] ?? d.doc_type}）`;
}

async function buildSections(
  materialBlock: string,
  subjectName: string,
  minSections: number
): Promise<WikiSectionOut[]> {
  const instructions = `科目「${subjectName}」について、以下は複数の資料（過去問・レジュメ・教科書、または既に整理済みのセクション）から抽出した内容の一覧です。これらすべてを読んだ上で、学習用のWikiを作成してください。

- 「分野・テーマ」ごとにセクションを分けてください（例:「バイオアベイラビリティ」「製剤設計」「薬物動態パラメータ」など）。年度や問題番号ではセクションを絶対に分けないでください。同じテーマの内容は複数の資料にまたがっていても1つのセクションに統合してください。
- headingには「第◯問」「◯年度」「問1〜4」などの年度・問題番号・大問番号を一切含めないでください。純粋な分野・テーマ名だけにしてください（悪い例:「第3問：天然物合成」「1. 酸・塩基の基礎」／良い例:「天然物合成」「酸・塩基の基礎」）。出典（年度・問題番号）はsourcesにのみ記載してください。
- 各セクションのcontentは **太字**, "- " の箇条書き, "| a | b |" 形式のテーブルを使った日本語のMarkdown風テキストにしてください。content内にも「第◯問」等の記述は含めないでください。
- 各セクションのsourcesには、そのテーマの根拠になった資料のラベルをすべて列挙してください（重複除去、資料一覧に実際にあるラベルのみ使用）。
- 重要: sectionsを空にすることは絶対に禁止です。目安として最低${minSections}個以上のセクションを作成してください。資料が多く複雑に感じても、必ず分野ごとに分類してsectionsを出力してください。空配列を返すことは失敗と見なされます。

資料一覧:
${materialBlock}`;

  const stream = anthropic.messages.stream({
    model: "claude-sonnet-5",
    max_tokens: 32000,
    tools: [
      {
        name: "build_wiki",
        description: "Organize study material summaries into topic-based wiki sections with source citations.",
        input_schema: {
          type: "object",
          properties: {
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  content: { type: "string" },
                  sources: { type: "array", items: { type: "string" } },
                },
                required: ["heading", "content", "sources"],
              },
            },
          },
          required: ["sections"],
        },
      },
    ],
    tool_choice: { type: "tool", name: "build_wiki" },
    messages: [{ role: "user", content: instructions }],
  });

  const message = await stream.finalMessage();

  if (message.stop_reason === "max_tokens") {
    throw new Error("response was truncated (max_tokens reached) — too much material to consolidate in one pass");
  }
  const toolUse = message.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("model did not return structured output");
  }
  const result = toolUse.input as { sections: WikiSectionOut[] };
  return Array.isArray(result.sections) ? result.sections : [];
}

const BATCH_SIZE = 6;
// Cap how many groups get merged in a single Claude call. Merging too many
// batches' worth of sections at once (e.g. all 6+ raw batches for a large
// subject) reliably makes the model give up and return zero sections, even
// though each individual batch call succeeds. Keeping every merge call down
// to a handful of groups — the same way raw documents are batched — avoids
// that regardless of how large the subject grows.
const MERGE_GROUP_SIZE = 3;

async function writeSections(subjectId: string, sections: WikiSectionOut[]) {
  await supabaseAdmin.from("wiki_sections").delete().eq("subject_id", subjectId);
  await supabaseAdmin.from("wiki_sections").insert(
    sections.map((s) => ({
      subject_id: subjectId,
      heading: s.heading,
      content: s.content,
      sources: Array.isArray(s.sources) ? s.sources : [],
    }))
  );
}

function materialBlockFromDocs(docs: DocRow[]): string {
  return docs.map((d) => `### 資料: ${docLabel(d)}\n${d.extracted_content}`).join("\n\n---\n\n");
}

function materialBlockFromSections(sections: WikiSectionOut[]): string {
  return sections
    .map((s) => `### ${s.heading}\n${s.content}\n（出典: ${Array.isArray(s.sources) ? s.sources.join("、") : ""}）`)
    .join("\n\n---\n\n");
}

// Large subjects need many sequential Claude calls (one per raw-document
// batch, plus one or more merge passes) to build the wiki. Running all of
// those inside a single request reliably blows past the platform's function
// time limit. Each request now performs at most one Claude call; the caller
// drives the whole batch/merge sequence across multiple requests via a
// queue of section-groups it echoes back on each call:
//   1. While there are unprocessed raw-document batches, process the next
//      one and push its resulting sections as a new group onto the queue.
//   2. Once all raw batches are processed, repeatedly pop up to
//      MERGE_GROUP_SIZE groups off the front of the queue, merge them into
//      one group, and push the result to the back — a tree reduce that
//      keeps any single merge call's input small.
//   3. Once the queue holds exactly one group, that is the final result.
export async function POST(req: NextRequest) {
  let body: { subjectId?: string; rawIndex?: number; queue?: WikiSectionOut[][]; fallback?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  const { subjectId, fallback } = body;
  if (!subjectId) {
    return NextResponse.json({ error: "subjectId is required" }, { status: 400 });
  }
  const rawIndex = body.rawIndex ?? 0;
  const queue = Array.isArray(body.queue) ? [...body.queue] : [];

  const { data: subject } = await supabaseAdmin
    .from("subjects")
    .select("name")
    .eq("id", subjectId)
    .single();
  const subjectName = subject?.name ?? subjectId;

  const { data: docs } = await supabaseAdmin
    .from("documents")
    .select("title, doc_type, year, textbook_name, extracted_content")
    .eq("subject_id", subjectId)
    .not("extracted_content", "is", null);

  if (!docs || docs.length === 0) {
    return NextResponse.json({ ok: true, done: true, sections: 0, note: "no analyzed documents yet" });
  }

  const batches: DocRow[][] = [];
  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    batches.push(docs.slice(i, i + BATCH_SIZE));
  }

  try {
    if (batches.length <= 1) {
      // Small subject: everything fits in a single pass, same as before.
      const sections = await buildSections(materialBlockFromDocs(docs), subjectName, Math.min(6, Math.max(3, Math.floor(docs.length / 2))));
      if (sections.length === 0) {
        return NextResponse.json(
          { error: "model returned no sections; existing wiki left untouched" },
          { status: 502 }
        );
      }
      await writeSections(subjectId, sections);
      return NextResponse.json({ ok: true, done: true, sections: sections.length });
    }

    if (rawIndex < batches.length) {
      // One raw-document batch per request.
      const batchSections = await buildSections(materialBlockFromDocs(batches[rawIndex]), subjectName, 3);
      return NextResponse.json({ ok: true, done: false, rawIndex: rawIndex + 1, queue: [...queue, batchSections] });
    }

    if (queue.length > 1) {
      // One merge of up to MERGE_GROUP_SIZE groups per request.
      const group = queue.slice(0, MERGE_GROUP_SIZE);
      const rest = queue.slice(MERGE_GROUP_SIZE);
      // Tree-reducing shrinks the number of groups, but not the total amount
      // of material — by the last couple of merges, a group carries nearly
      // everything, and the model occasionally just gives up and returns no
      // sections instead of truncating. The caller retries a step a few
      // times before setting `fallback`; when set, skip the AI merge for
      // this step and concatenate the groups as-is (topic headings may
      // duplicate across groups) so consolidation always finishes rather
      // than getting stuck indefinitely on an oversized merge.
      const mergedSections = fallback
        ? group.flat()
        : await buildSections(materialBlockFromSections(group.flat()), subjectName, 3);
      if (mergedSections.length === 0) {
        return NextResponse.json(
          { error: "model returned no sections; existing wiki left untouched" },
          { status: 502 }
        );
      }
      return NextResponse.json({ ok: true, done: false, rawIndex, queue: [...rest, mergedSections] });
    }

    // Queue holds exactly one group: that is the final result.
    const sections = queue[0] ?? [];
    if (sections.length === 0) {
      return NextResponse.json(
        { error: "model returned no sections; existing wiki left untouched" },
        { status: 502 }
      );
    }
    await writeSections(subjectId, sections);
    return NextResponse.json({ ok: true, done: true, sections: sections.length });
  } catch (err) {
    console.error("Wiki consolidation failed", err);
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI consolidation failed: ${reason}` }, { status: 502 });
  }
}
