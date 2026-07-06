import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const DOC_TYPE_LABEL: Record<string, string> = {
  past_exam: "過去問",
  resume: "授業レジュメ",
  textbook: "教科書",
};

type ExtractedQuestion = {
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  difficulty: "易" | "普" | "難";
  year?: number;
};

type ExtractedWikiSection = {
  heading: string;
  content: string;
};

type ExtractResult = {
  summary: string;
  wiki_sections: ExtractedWikiSection[];
  questions: ExtractedQuestion[];
};

export async function POST(req: NextRequest) {
  let documentId: string | undefined;
  try {
    ({ documentId } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }
  if (!documentId) {
    return NextResponse.json({ error: "documentId is required" }, { status: 400 });
  }

  const { data: doc, error: docError } = await supabaseAdmin
    .from("documents")
    .select("*")
    .eq("id", documentId)
    .single();

  if (docError || !doc) {
    return NextResponse.json({ error: "document not found" }, { status: 404 });
  }

  const { data: subject } = await supabaseAdmin
    .from("subjects")
    .select("name")
    .eq("id", doc.subject_id)
    .single();
  const subjectName = subject?.name ?? doc.subject_id;

  const { data: fileData, error: downloadError } = await supabaseAdmin.storage
    .from("documents")
    .download(doc.file_path);

  if (downloadError || !fileData) {
    return NextResponse.json({ error: "failed to download file" }, { status: 500 });
  }

  const base64 = Buffer.from(await fileData.arrayBuffer()).toString("base64");
  const docTypeLabel = DOC_TYPE_LABEL[doc.doc_type] ?? doc.doc_type;

  const instructions = `これは薬学大学院入試対策アプリの教材です。
科目: ${subjectName}
書類の種類: ${docTypeLabel}
ファイル名: ${doc.title}

このPDFを解析してください。全科目共通でまとめられた資料の可能性もあるので、その場合は「${subjectName}」に関係する部分だけを対象にしてください。

1. summary: この資料の要点を、AIチャットが参照できるよう日本語で数段落にまとめてください。
2. wiki_sections: 学習まとめとして1〜4セクション作成してください。各contentは **太字**, "- " の箇条書き, "| a | b |" 形式のテーブルを使った日本語のMarkdown風テキストにしてください。
3. questions: 書類の種類が「過去問」の場合のみ、実際に含まれる設問をもとに4択のクイズ問題を作成してください（選択肢が4択でない場合は、正解を保ったまま妥当な誤答を補って4択にしてください）。過去問以外の場合は空配列にしてください。`;

  let result: ExtractResult;
  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      tools: [
        {
          name: "extract_study_material",
          description: "Extract a study summary, wiki sections, and (for past exams) quiz questions from an academic PDF.",
          input_schema: {
            type: "object",
            properties: {
              summary: { type: "string" },
              wiki_sections: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    heading: { type: "string" },
                    content: { type: "string" },
                  },
                  required: ["heading", "content"],
                },
              },
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    question: { type: "string" },
                    choices: { type: "array", items: { type: "string" }, minItems: 4, maxItems: 4 },
                    answer: { type: "integer" },
                    explanation: { type: "string" },
                    difficulty: { type: "string", enum: ["易", "普", "難"] },
                    year: { type: "integer" },
                  },
                  required: ["question", "choices", "answer", "explanation", "difficulty"],
                },
              },
            },
            required: ["summary", "wiki_sections", "questions"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "extract_study_material" },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: { type: "base64", media_type: "application/pdf", data: base64 },
            },
            { type: "text", text: instructions },
          ],
        },
      ],
    });

    const toolUse = message.content.find((b) => b.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      throw new Error("model did not return structured output");
    }
    result = toolUse.input as ExtractResult;
  } catch (err) {
    console.error("Claude analysis failed", err);
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI analysis failed: ${reason}` }, { status: 502 });
  }

  const wikiSections = Array.isArray(result.wiki_sections) ? result.wiki_sections : [];
  const questions = Array.isArray(result.questions) ? result.questions : [];

  await supabaseAdmin
    .from("documents")
    .update({ extracted_content: result.summary })
    .eq("id", doc.id);

  if (wikiSections.length) {
    await supabaseAdmin.from("wiki_sections").insert(
      wikiSections.map((s) => ({
        subject_id: doc.subject_id,
        heading: s.heading,
        content: s.content,
        textbook: doc.textbook_name ?? doc.title,
        source_document_id: doc.id,
      }))
    );
  }

  let insertedQuestions = 0;
  if (questions.length) {
    const validDifficulties = new Set(["易", "普", "難"]);
    const rows = questions
      .filter((q) => Array.isArray(q.choices) && q.choices.length === 4)
      .map((q, i) => ({
        id: `${doc.id}-q${i}`,
        subject_id: doc.subject_id,
        question: q.question,
        choices: q.choices,
        answer: q.answer,
        explanation: q.explanation,
        textbook: doc.textbook_name ?? doc.title,
        year: q.year ?? doc.year ?? null,
        difficulty: validDifficulties.has(q.difficulty) ? q.difficulty : "普",
        source_document_id: doc.id,
      }));
    const { error: insertError, count } = await supabaseAdmin
      .from("questions")
      .upsert(rows, { onConflict: "id", count: "exact" });
    if (insertError) {
      console.error("Failed to insert generated questions", JSON.stringify(insertError));
    } else {
      insertedQuestions = count ?? rows.length;
    }
  }

  return NextResponse.json({
    ok: true,
    wikiSections: wikiSections.length,
    questions: insertedQuestions,
  });
}
