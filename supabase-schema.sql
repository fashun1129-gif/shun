-- pharma-exam-app: initial schema
-- Run this once in Supabase Dashboard > SQL Editor > New query > Run

create extension if not exists "pgcrypto";

-- 科目マスタ
create table if not exists subjects (
  id text primary key,
  name text not null,
  icon text not null,
  color text not null,
  textbook text not null
);

-- 問題
create table if not exists questions (
  id text primary key,
  subject_id text not null references subjects(id) on delete cascade,
  question text not null,
  choices jsonb not null,
  answer int not null,
  explanation text not null,
  textbook text not null,
  year int,
  difficulty text not null check (difficulty in ('易', '普', '難')),
  created_at timestamptz not null default now()
);
create index if not exists questions_subject_id_idx on questions(subject_id);

-- 解答履歴（正誤の記録。ユーザー機能実装前は user_id は null で保存）
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  question_id text not null references questions(id) on delete cascade,
  subject_id text not null references subjects(id) on delete cascade,
  correct boolean not null,
  created_at timestamptz not null default now()
);
create index if not exists quiz_results_subject_id_idx on quiz_results(subject_id);
create index if not exists quiz_results_user_id_idx on quiz_results(user_id);

-- 共有問題セット（ShareModal / share/[id] 用）
create table if not exists shared_quiz_sets (
  id text primary key,
  title text not null,
  subject_id text not null references subjects(id) on delete cascade,
  created_by text not null,
  created_at timestamptz not null default now()
);

-- 共有セットに含まれる問題（順序付き）
create table if not exists shared_quiz_set_questions (
  set_id text not null references shared_quiz_sets(id) on delete cascade,
  question_id text not null references questions(id) on delete cascade,
  position int not null,
  primary key (set_id, question_id)
);

-- Row Level Security
alter table subjects enable row level security;
alter table questions enable row level security;
alter table quiz_results enable row level security;
alter table shared_quiz_sets enable row level security;
alter table shared_quiz_set_questions enable row level security;

-- 誰でも閲覧可能（コンテンツ系）
create policy "public read subjects" on subjects for select using (true);
create policy "public read questions" on questions for select using (true);
create policy "public read shared_quiz_sets" on shared_quiz_sets for select using (true);
create policy "public read shared_quiz_set_questions" on shared_quiz_set_questions for select using (true);

-- 解答履歴は誰でも記録・閲覧可能（未ログイン運用のため。認証機能導入時に見直し）
create policy "public read quiz_results" on quiz_results for select using (true);
create policy "public insert quiz_results" on quiz_results for insert with check (true);

-- 共有セットの作成も現状は誰でも可能（認証機能導入時に見直し）
create policy "public insert shared_quiz_sets" on shared_quiz_sets for insert with check (true);
create policy "public insert shared_quiz_set_questions" on shared_quiz_set_questions for insert with check (true);

-- 科目マスタの初期データ投入
insert into subjects (id, name, icon, color, textbook) values
  ('organic-chemistry', '有機化学', '⚗️', 'bg-purple-500', 'ボルハルト・ショアー現代有機化学(上)(下)'),
  ('pharmaceutics', '薬剤学', '💊', 'bg-blue-500', '薬剤学第5版'),
  ('physical-chemistry', '物理化学', '⚛️', 'bg-orange-500', 'アトキンス物理化学要論第7版'),
  ('analytical-chemistry', '分析化学', '🔬', 'bg-green-500', 'パートナー分析化学Ⅰ・Ⅱ'),
  ('biochemistry', '生化学', '🧬', 'bg-red-500', 'レーニンジャーの新生化学[上][下]第7版'),
  ('cell-biology', '細胞生物学', '🦠', 'bg-teal-500', 'Essential細胞生物学'),
  ('pharmacology', '薬理学', '💉', 'bg-pink-500', 'NEW薬理学改訂第7版'),
  ('pharmacokinetics', '薬物動態学', '📈', 'bg-indigo-500', 'コンパス薬物速度論演習 / 個別化医療を目指した臨床薬物動態学1')
on conflict (id) do nothing;
