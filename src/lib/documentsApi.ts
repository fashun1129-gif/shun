import { supabase } from "./supabaseClient";

export type DocType = "past_exam" | "resume" | "textbook";

export type DocumentRecord = {
  id: string;
  subjectId: string;
  docType: DocType;
  title: string;
  textbookName: string | null;
  year: number | null;
  filePath: string;
  fileSize: number;
  uploadedAt: string;
};

const BUCKET = "documents";

type DocumentRow = {
  id: string;
  subject_id: string;
  doc_type: DocType;
  title: string;
  textbook_name: string | null;
  year: number | null;
  file_path: string;
  file_size: number;
  uploaded_at: string;
};

function mapRow(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    subjectId: row.subject_id,
    docType: row.doc_type,
    title: row.title,
    textbookName: row.textbook_name,
    year: row.year,
    filePath: row.file_path,
    fileSize: row.file_size,
    uploadedAt: row.uploaded_at,
  };
}

export async function listDocuments(): Promise<DocumentRecord[]> {
  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .order("uploaded_at", { ascending: false });
  if (error || !data) return [];
  return (data as DocumentRow[]).map(mapRow);
}

export async function uploadDocument(params: {
  file: File;
  subjectId: string;
  docType: DocType;
  textbookName?: string;
  year?: number;
}): Promise<DocumentRecord> {
  const ext = params.file.name.split(".").pop();
  const path = `${params.subjectId}/${params.docType}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, params.file);
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      subject_id: params.subjectId,
      doc_type: params.docType,
      title: params.file.name,
      textbook_name: params.textbookName ?? null,
      year: params.year ?? null,
      file_path: path,
      file_size: params.file.size,
    })
    .select()
    .single();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error ?? new Error("Failed to save document metadata");
  }
  return mapRow(data as DocumentRow);
}

export async function deleteDocument(doc: DocumentRecord): Promise<void> {
  await supabase.storage.from(BUCKET).remove([doc.filePath]);
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw error;
}

export async function updateDocument(
  id: string,
  updates: {
    subjectId?: string;
    docType?: DocType;
    textbookName?: string | null;
    year?: number | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from("documents")
    .update({
      subject_id: updates.subjectId,
      doc_type: updates.docType,
      textbook_name: updates.textbookName,
      year: updates.year,
    })
    .eq("id", id);
  if (error) throw error;
}
