-- pharma-exam-app: shared quiz sets now store a full question snapshot
-- so a share link works without needing the `questions` table populated.
-- Run this once in Supabase Dashboard > SQL Editor > New query > Run

alter table shared_quiz_sets
  add column if not exists questions_snapshot jsonb not null default '[]'::jsonb;
