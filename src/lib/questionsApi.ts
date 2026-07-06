import { supabase } from "./supabaseClient";
import { Question, subjects } from "./mockData";

type QuestionRow = {
  id: string;
  subject_id: string;
  question: string;
  choices: string[];
  answer: number;
  explanation: string;
  textbook: string;
  year: number | null;
  difficulty: "易" | "普" | "難";
};

function mapRow(row: QuestionRow, subjectName: string): Question {
  return {
    id: row.id,
    subject: subjectName,
    question: row.question,
    choices: row.choices,
    answer: row.answer,
    explanation: row.explanation,
    textbook: row.textbook,
    year: row.year ?? undefined,
    difficulty: row.difficulty,
  };
}

export async function listQuestions(subjectId: string, subjectName: string): Promise<Question[]> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as QuestionRow[]).map((row) => mapRow(row, subjectName));
}

export async function listQuestionsBySubject(): Promise<Record<string, Question[]>> {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .order("created_at", { ascending: true });
  const grouped: Record<string, Question[]> = {};
  if (error || !data) return grouped;
  for (const row of data as QuestionRow[]) {
    const subjectName = subjects.find((s) => s.id === row.subject_id)?.name ?? row.subject_id;
    (grouped[row.subject_id] ??= []).push(mapRow(row, subjectName));
  }
  return grouped;
}
