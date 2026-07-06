-- pharma-exam-app: track wiki section citations as structured data instead of
-- relying on the AI reliably embedding them inline in the content text.
-- Run this once in Supabase Dashboard > SQL Editor > New query > Run

alter table wiki_sections add column if not exists sources jsonb not null default '[]'::jsonb;
