-- ============================================================
-- SmartQuizzer – Supabase Schema
-- Run this once in your Supabase project's SQL Editor
-- Dashboard: https://supabase.com → your project → SQL Editor
-- ============================================================

-- 1. Materials: stores uploaded study content
create table if not exists materials (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  title      text not null,
  content    text not null,
  file_type  text,
  created_at timestamptz default now()
);
alter table materials enable row level security;
create policy "Users manage own materials"
  on materials for all
  using (auth.uid() = user_id);

-- 2. Quizzes: stores generated quiz questions (jsonb array)
create table if not exists quizzes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users not null,
  material_id uuid references materials not null,
  title       text not null,
  questions   jsonb not null,
  created_at  timestamptz default now()
);
alter table quizzes enable row level security;
create policy "Users manage own quizzes"
  on quizzes for all
  using (auth.uid() = user_id);

-- 3. Quiz Attempts: stores user attempt results
create table if not exists quiz_attempts (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references auth.users not null,
  quiz_id                uuid references quizzes not null,
  answers                jsonb not null,
  score                  float not null,
  total_questions        int not null,
  difficulty_progression jsonb,
  completed_at           timestamptz,
  created_at             timestamptz default now()
);
alter table quiz_attempts enable row level security;
create policy "Users manage own attempts"
  on quiz_attempts for all
  using (auth.uid() = user_id);

-- 4. Analytics: per-attempt performance metrics
create table if not exists analytics (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users not null,
  attempt_id          uuid references quiz_attempts not null,
  topic_performance   jsonb,
  difficulty_breakdown jsonb,
  response_times      jsonb,
  recommendations     jsonb,
  created_at          timestamptz default now()
);
alter table analytics enable row level security;
create policy "Users manage own analytics"
  on analytics for all
  using (auth.uid() = user_id);
