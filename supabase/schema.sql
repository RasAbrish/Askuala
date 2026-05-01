-- Askuala — Phase 1 schema
-- Run in Supabase SQL editor (or via `supabase db push`).
-- Requires the pgvector extension.

create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- =========================================================================
-- USERS (mirrors auth.users with profile fields)
-- =========================================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'student' check (role in ('student','teacher','admin')),
  grade int check (grade between 9 and 12),
  language_pref text not null default 'en' check (language_pref in ('en','am','om','ti')),
  created_at timestamptz not null default now()
);

-- Auto-create profile when a new auth user is inserted.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, grade, language_pref)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'grade','')::int,
    coalesce(new.raw_user_meta_data->>'language_pref', 'en')
  );
  update public.profiles
    set role = case
      when coalesce(new.raw_user_meta_data->>'role', 'student') in ('student', 'teacher', 'admin')
        then (new.raw_user_meta_data->>'role')
      else 'student'
    end
  where id = new.id;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================================
-- CURRICULUM
-- =========================================================================
create table if not exists public.subjects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  grade int not null check (grade between 9 and 12),
  cover_image text,
  created_at timestamptz not null default now()
);

create table if not exists public.textbooks (
  id uuid primary key default uuid_generate_v4(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  pdf_url text,
  total_pages int,
  uploaded_at timestamptz not null default now()
);

create table if not exists public.chapters (
  id uuid primary key default uuid_generate_v4(),
  textbook_id uuid not null references public.textbooks(id) on delete cascade,
  chapter_number int not null,
  title text not null,
  start_page int,
  end_page int,
  summary text,
  created_at timestamptz not null default now()
);
create index if not exists chapters_textbook_idx on public.chapters(textbook_id);

-- =========================================================================
-- STUDENT UPLOADS (Drop Mode)
-- =========================================================================
create table if not exists public.student_uploads (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  source_type text not null check (source_type in ('pdf','text','image','url','audio')),
  language_detected text,
  saved boolean not null default false,
  word_count int,
  created_at timestamptz not null default now(),
  expires_at timestamptz default (now() + interval '30 days')
);
create index if not exists student_uploads_student_idx
  on public.student_uploads(student_id, created_at desc);

-- =========================================================================
-- CHUNKS — belong to either a chapter (curriculum) or an upload (drop mode)
-- =========================================================================
create table if not exists public.textbook_chunks (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid references public.chapters(id) on delete cascade,
  upload_id uuid references public.student_uploads(id) on delete cascade,
  content text not null,
  page_number int,
  embedding vector(768),
  created_at timestamptz not null default now(),
  constraint textbook_chunks_one_source check (
    (chapter_id is not null)::int + (upload_id is not null)::int = 1
  )
);
-- Backfill columns if the table already existed from an earlier migration.
alter table public.textbook_chunks
  alter column chapter_id drop not null;
alter table public.textbook_chunks
  add column if not exists upload_id uuid references public.student_uploads(id) on delete cascade;
create index if not exists textbook_chunks_chapter_idx on public.textbook_chunks(chapter_id);
create index if not exists textbook_chunks_upload_idx on public.textbook_chunks(upload_id);
-- Approximate-nearest-neighbour index for RAG search.
create index if not exists textbook_chunks_embedding_idx
  on public.textbook_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- =========================================================================
-- STUDY MATERIAL
-- =========================================================================
create table if not exists public.flashcards (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid references public.chapters(id) on delete cascade,
  upload_id uuid references public.student_uploads(id) on delete cascade,
  question text not null,
  answer text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy','medium','hard')),
  created_at timestamptz not null default now(),
  constraint flashcards_one_source check (
    (chapter_id is not null)::int + (upload_id is not null)::int = 1
  )
);
alter table public.flashcards
  alter column chapter_id drop not null;
alter table public.flashcards
  add column if not exists upload_id uuid references public.student_uploads(id) on delete cascade;
create index if not exists flashcards_chapter_idx on public.flashcards(chapter_id);
create index if not exists flashcards_upload_idx on public.flashcards(upload_id);

create table if not exists public.quizzes (
  id uuid primary key default uuid_generate_v4(),
  chapter_id uuid references public.chapters(id) on delete cascade,
  upload_id uuid references public.student_uploads(id) on delete cascade,
  title text not null,
  question_count int not null default 5,
  time_limit_seconds int,
  created_at timestamptz not null default now(),
  constraint quizzes_one_source check (
    (chapter_id is not null)::int + (upload_id is not null)::int = 1
  )
);
alter table public.quizzes
  alter column chapter_id drop not null;
alter table public.quizzes
  add column if not exists upload_id uuid references public.student_uploads(id) on delete cascade;
create index if not exists quizzes_chapter_idx on public.quizzes(chapter_id);
create index if not exists quizzes_upload_idx on public.quizzes(upload_id);

create table if not exists public.questions (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'mcq' check (question_type in ('mcq','short','true_false')),
  options jsonb,
  correct_answer text not null,
  explanation text,
  position int not null default 0
);
create index if not exists questions_quiz_idx on public.questions(quiz_id);

create table if not exists public.quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  score int not null default 0,
  total int not null default 0,
  answers jsonb,
  attempted_at timestamptz not null default now()
);

-- =========================================================================
-- AI TUTOR HISTORY
-- =========================================================================
create table if not exists public.chat_messages (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  chapter_id uuid references public.chapters(id) on delete set null,
  upload_id uuid references public.student_uploads(id) on delete set null,
  role text not null check (role in ('user','ai')),
  content text not null,
  language text not null default 'en',
  created_at timestamptz not null default now()
);
alter table public.chat_messages
  add column if not exists upload_id uuid references public.student_uploads(id) on delete set null;
create index if not exists chat_messages_student_idx on public.chat_messages(student_id, created_at desc);

-- =========================================================================
-- RAG SEARCH RPC
-- =========================================================================
-- Cosine-similarity nearest-neighbour search constrained to a chapter,
-- an upload, or unconstrained.
create or replace function public.match_textbook_chunks(
  query_embedding vector(768),
  match_chapter_id uuid default null,
  match_upload_id uuid default null,
  match_count int default 5
)
returns table (
  id uuid,
  chapter_id uuid,
  upload_id uuid,
  content text,
  page_number int,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.chapter_id,
    c.upload_id,
    c.content,
    c.page_number,
    1 - (c.embedding <=> query_embedding) as similarity
  from public.textbook_chunks c
  where (match_chapter_id is null or c.chapter_id = match_chapter_id)
    and (match_upload_id is null or c.upload_id = match_upload_id)
  order by c.embedding <=> query_embedding
  limit match_count;
$$;

-- =========================================================================
-- ROW-LEVEL SECURITY
-- =========================================================================
alter table public.profiles enable row level security;
alter table public.chat_messages enable row level security;
alter table public.quiz_attempts enable row level security;

drop policy if exists "profiles_self_read" on public.profiles;
create policy "profiles_self_read" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on public.profiles;
create policy "profiles_self_update" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "chat_self_all" on public.chat_messages;
create policy "chat_self_all" on public.chat_messages
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

drop policy if exists "attempts_self_all" on public.quiz_attempts;
create policy "attempts_self_all" on public.quiz_attempts
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

alter table public.student_uploads enable row level security;
drop policy if exists "uploads_self_all" on public.student_uploads;
create policy "uploads_self_all" on public.student_uploads
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

-- Curriculum tables are world-readable (public textbooks).
alter table public.subjects enable row level security;
alter table public.textbooks enable row level security;
alter table public.chapters enable row level security;
alter table public.flashcards enable row level security;
alter table public.quizzes enable row level security;
alter table public.questions enable row level security;
alter table public.textbook_chunks enable row level security;

drop policy if exists "subjects_read" on public.subjects;
create policy "subjects_read" on public.subjects for select using (true);
drop policy if exists "textbooks_read" on public.textbooks;
create policy "textbooks_read" on public.textbooks for select using (true);
drop policy if exists "chapters_read" on public.chapters;
create policy "chapters_read" on public.chapters for select using (true);

-- Curriculum content is public; upload content is owner-only.
drop policy if exists "flashcards_read" on public.flashcards;
create policy "flashcards_read" on public.flashcards for select using (
  chapter_id is not null
  or upload_id in (select id from public.student_uploads where student_id = auth.uid())
);
drop policy if exists "quizzes_read" on public.quizzes;
create policy "quizzes_read" on public.quizzes for select using (
  chapter_id is not null
  or upload_id in (select id from public.student_uploads where student_id = auth.uid())
);
drop policy if exists "questions_read" on public.questions;
create policy "questions_read" on public.questions for select using (
  exists (
    select 1 from public.quizzes q
    where q.id = quiz_id
      and (
        q.chapter_id is not null
        or q.upload_id in (select id from public.student_uploads where student_id = auth.uid())
      )
  )
);
drop policy if exists "chunks_read" on public.textbook_chunks;
create policy "chunks_read" on public.textbook_chunks for select using (
  chapter_id is not null
  or upload_id in (select id from public.student_uploads where student_id = auth.uid())
);
