-- pharma-exam-app: AI-generated content (question generation, wiki summaries)
-- Run this once in Supabase Dashboard > SQL Editor > New query > Run

-- Store the AI's extracted/summarized study content per uploaded document
alter table documents add column if not exists extracted_content text;

-- Track which uploaded document a generated question came from (optional, for traceability)
alter table questions add column if not exists source_document_id uuid references documents(id) on delete set null;

-- AI-generated wiki knowledge sections, additive to the static ones shipped in the app
create table if not exists wiki_sections (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references subjects(id) on delete cascade,
  heading text not null,
  content text not null,
  textbook text,
  source_document_id uuid references documents(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists wiki_sections_subject_id_idx on wiki_sections(subject_id);

alter table wiki_sections enable row level security;

-- Read is public like everything else in this app; writes only happen server-side
-- via the service role key (from the AI analysis routes), so no public write policies here.
create policy "public read wiki_sections" on wiki_sections for select using (true);
