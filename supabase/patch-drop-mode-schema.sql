-- Patch an existing Phase 1 database so Drop Mode uploads work.
-- Run this in Supabase SQL Editor.

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

alter table public.textbook_chunks
  alter column chapter_id drop not null;

alter table public.textbook_chunks
  add column if not exists upload_id uuid references public.student_uploads(id) on delete cascade;

create index if not exists textbook_chunks_upload_idx
  on public.textbook_chunks(upload_id);

alter table public.flashcards
  alter column chapter_id drop not null;

alter table public.flashcards
  add column if not exists upload_id uuid references public.student_uploads(id) on delete cascade;

create index if not exists flashcards_upload_idx
  on public.flashcards(upload_id);

alter table public.quizzes
  alter column chapter_id drop not null;

alter table public.quizzes
  add column if not exists upload_id uuid references public.student_uploads(id) on delete cascade;

create index if not exists quizzes_upload_idx
  on public.quizzes(upload_id);

alter table public.chat_messages
  add column if not exists upload_id uuid references public.student_uploads(id) on delete set null;

drop function if exists public.match_textbook_chunks(vector(768), uuid, int);
drop function if exists public.match_textbook_chunks(vector(768), uuid, uuid, int);

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

alter table public.student_uploads enable row level security;

drop policy if exists "uploads_self_read" on public.student_uploads;
create policy "uploads_self_read" on public.student_uploads
  for select using (auth.uid() = student_id);

drop policy if exists "uploads_self_insert" on public.student_uploads;
create policy "uploads_self_insert" on public.student_uploads
  for insert with check (auth.uid() = student_id);

drop policy if exists "uploads_self_update" on public.student_uploads;
create policy "uploads_self_update" on public.student_uploads
  for update using (auth.uid() = student_id) with check (auth.uid() = student_id);

drop policy if exists "uploads_self_delete" on public.student_uploads;
create policy "uploads_self_delete" on public.student_uploads
  for delete using (auth.uid() = student_id);

notify pgrst, 'reload schema';
