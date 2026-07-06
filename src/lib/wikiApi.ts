import { supabase } from "./supabaseClient";

export type WikiSection = {
  heading: string;
  content: string;
  textbook?: string;
};

type WikiSectionRow = {
  heading: string;
  content: string;
  textbook: string | null;
};

export async function listWikiSections(subjectId: string): Promise<WikiSection[]> {
  const { data, error } = await supabase
    .from("wiki_sections")
    .select("heading, content, textbook")
    .eq("subject_id", subjectId)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return (data as WikiSectionRow[]).map((row) => ({
    heading: row.heading,
    content: row.content,
    textbook: row.textbook ?? undefined,
  }));
}
