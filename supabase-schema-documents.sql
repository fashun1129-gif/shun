-- pharma-exam-app: document management (past exams / resumes / textbooks)
-- Run this once in Supabase Dashboard > SQL Editor > New query > Run

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  subject_id text not null references subjects(id) on delete cascade,
  doc_type text not null check (doc_type in ('past_exam', 'resume', 'textbook')),
  title text not null,
  textbook_name text,
  year int,
  file_path text not null,
  file_size bigint not null,
  uploaded_at timestamptz not null default now()
);
create index if not exists documents_subject_id_idx on documents(subject_id);

alter table documents enable row level security;

-- 認証機能がまだ無いため、誰でも閲覧・登録・編集・削除可能（認証機能導入時に見直し）
create policy "public read documents" on documents for select using (true);
create policy "public insert documents" on documents for insert with check (true);
create policy "public update documents" on documents for update using (true);
create policy "public delete documents" on documents for delete using (true);

-- アップロードされたPDF/画像ファイルの保存先バケット
insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "public read documents bucket" on storage.objects
  for select using (bucket_id = 'documents');
create policy "public insert documents bucket" on storage.objects
  for insert with check (bucket_id = 'documents');
create policy "public update documents bucket" on storage.objects
  for update using (bucket_id = 'documents');
create policy "public delete documents bucket" on storage.objects
  for delete using (bucket_id = 'documents');
