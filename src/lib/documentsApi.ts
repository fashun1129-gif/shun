import { supabase } from "./supabaseClient";
import { subjects } from "./mockData";

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
  extractedContent: string | null;
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
  extracted_content: string | null;
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
    extractedContent: row.extracted_content ?? null,
  };
}

export async function triggerAnalysis(documentId: string): Promise<void> {
  const res = await fetch("/api/analyze-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `analysis request failed (${res.status})`);
  }
}

const MAX_STEP_ATTEMPTS = 3;

export async function triggerWikiConsolidation(subjectId: string): Promise<void> {
  // Large subjects need many sequential Claude calls (per raw-document batch,
  // plus one or more merge passes) to build the wiki. The server bounds each
  // request to a single call and reduces the batch results via a queue-based
  // tree merge, so this drives that whole sequence across multiple requests
  // instead of letting one request run them all and risk a platform timeout.
  //
  // The model occasionally returns an empty section list for a merge (a
  // known failure the server guards against by leaving existing data
  // untouched) — retry the same step a few times before giving up, rather
  // than re-running the whole (expensive) sequence from scratch. By the
  // final merge, a group can carry nearly the whole subject's material, so
  // this isn't always transient: the last attempt asks the server to fall
  // back to a plain concatenation instead of an AI merge, trading a
  // possible duplicate heading for guaranteed forward progress.
  let rawIndex = 0;
  let queue: unknown[] = [];
  for (;;) {
    let lastError: string | undefined;
    let succeeded = false;
    for (let attempt = 0; attempt < MAX_STEP_ATTEMPTS; attempt++) {
      const fallback = attempt === MAX_STEP_ATTEMPTS - 1;
      const res = await fetch("/api/consolidate-wiki", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, rawIndex, queue, fallback }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.done) return;
        rawIndex = data.rawIndex;
        queue = data.queue;
        succeeded = true;
        break;
      }
      const body = await res.json().catch(() => ({}));
      lastError = body.error ?? `wiki consolidation failed (${res.status})`;
    }
    if (!succeeded) {
      throw new Error(lastError ?? "wiki consolidation failed");
    }
  }
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

export async function uploadPastExamForAllSubjects(params: {
  file: File;
  year?: number;
}): Promise<DocumentRecord[]> {
  const ext = params.file.name.split(".").pop();
  const path = `all-subjects/past_exam/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, params.file);
  if (uploadError) throw uploadError;

  const rows = subjects.map((s) => ({
    subject_id: s.id,
    doc_type: "past_exam" as const,
    title: params.file.name,
    textbook_name: null,
    year: params.year ?? null,
    file_path: path,
    file_size: params.file.size,
  }));

  const { data, error } = await supabase.from("documents").insert(rows).select();

  if (error || !data) {
    await supabase.storage.from(BUCKET).remove([path]);
    throw error ?? new Error("Failed to save document metadata");
  }
  return (data as DocumentRow[]).map(mapRow);
}

export async function deleteDocument(doc: DocumentRecord): Promise<void> {
  const { error } = await supabase.from("documents").delete().eq("id", doc.id);
  if (error) throw error;

  // Only remove the underlying file once no other subject's row still references it
  // (a past exam shared across all subjects has one storage object but many rows).
  const { count } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("file_path", doc.filePath);
  if (!count) {
    await supabase.storage.from(BUCKET).remove([doc.filePath]);
  }
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
