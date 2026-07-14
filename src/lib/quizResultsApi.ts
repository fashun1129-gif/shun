import { supabase } from "./supabaseClient";

export type QuizResult = {
  questionId: string;
  subject: string;
  correct: boolean;
  timestamp: number;
};

export async function listQuizResults(userId: string): Promise<QuizResult[]> {
  const { data, error } = await supabase
    .from("quiz_results")
    .select("question_id, subject_id, correct, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    questionId: row.question_id,
    subject: row.subject_id,
    correct: row.correct,
    timestamp: new Date(row.created_at).getTime(),
  }));
}

export async function saveQuizResults(
  userId: string,
  subjectId: string,
  results: { questionId: string; correct: boolean }[]
): Promise<void> {
  if (results.length === 0) return;
  const rows = results.map((r) => ({
    user_id: userId,
    question_id: r.questionId,
    subject_id: subjectId,
    correct: r.correct,
  }));
  const { error } = await supabase.from("quiz_results").insert(rows);
  if (error) console.error("Failed to save quiz results", error);
}
