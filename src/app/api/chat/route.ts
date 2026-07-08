import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

// RAG-backed chat replies can take a while to generate and can otherwise
// exceed Vercel's default function timeout (10-15s).
export const maxDuration = 60;

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: NextRequest) {
  let body: { subjectId?: string; subjectName?: string; question?: string; history?: ChatMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid request body" }, { status: 400 });
  }

  const { subjectId, subjectName, question, history = [] } = body;
  if (!question) {
    return NextResponse.json({ error: "question is required" }, { status: 400 });
  }

  let contextBlock = "";
  const sources: string[] = [];
  if (subjectId) {
    const { data: docs } = await supabaseAdmin
      .from("documents")
      .select("title, extracted_content")
      .eq("subject_id", subjectId)
      .not("extracted_content", "is", null);

    if (docs && docs.length > 0) {
      contextBlock = docs.map((d) => `### ${d.title}\n${d.extracted_content}`).join("\n\n");
      sources.push(...docs.map((d) => d.title));
    }
  }

  const systemPrompt = `あなたは薬学大学院入試対策アプリ「PharmStudy」のAIアシスタントです。${subjectName ? `現在の学習科目は「${subjectName}」です。` : ""}
以下はユーザーがアップロードした過去問・レジュメ・教科書から抽出した内容です。回答の際はこの内容を最優先で参照し、関連する資料がある場合は資料名を明示してください。資料に無い内容は一般的な薬学知識で補って構いませんが、その場合は資料からの情報ではないことが分かるようにしてください。日本語で、簡潔かつ分かりやすく回答してください。

${contextBlock || "（この科目にはまだアップロードされた資料がありません。一般的な知識で回答してください。）"}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1500,
      system: systemPrompt,
      messages: [
        ...history.slice(-10).map((h) => ({ role: h.role, content: h.content })),
        { role: "user" as const, content: question },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const answer = textBlock && textBlock.type === "text" ? textBlock.text : "回答を生成できませんでした。";

    return NextResponse.json({ answer, sources });
  } catch (err) {
    console.error("Chat generation failed", err);
    const reason = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `AI応答の生成に失敗しました（${reason}）` }, { status: 502 });
  }
}
