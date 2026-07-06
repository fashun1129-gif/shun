import { supabase } from "./supabaseClient";
import { Question } from "./mockData";

export type SharedQuizSet = {
  id: string;
  title: string;
  subjectId: string;
  createdBy: string;
  questions: Question[];
  createdAt: string;
};

function generateShareId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export async function createSharedQuizSet(params: {
  title: string;
  subjectId: string;
  createdBy: string;
  questions: Question[];
}): Promise<string> {
  const id = generateShareId();
  const { error } = await supabase.from("shared_quiz_sets").insert({
    id,
    title: params.title,
    subject_id: params.subjectId,
    created_by: params.createdBy,
    questions_snapshot: params.questions,
  });
  if (error) throw error;
  return id;
}

export async function getSharedQuizSet(id: string): Promise<SharedQuizSet | null> {
  const { data, error } = await supabase
    .from("shared_quiz_sets")
    .select("id, title, subject_id, created_by, questions_snapshot, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;

  return {
    id: data.id,
    title: data.title,
    subjectId: data.subject_id,
    createdBy: data.created_by,
    questions: data.questions_snapshot as Question[],
    createdAt: new Date(data.created_at).toLocaleDateString("ja-JP"),
  };
}
