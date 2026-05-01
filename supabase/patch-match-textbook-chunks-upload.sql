-- Patch existing Supabase projects so RAG search works for both textbook
-- chapters and Drop Mode uploads.

drop function if exists public.match_textbook_chunks(vector(768), uuid, int);

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

notify pgrst, 'reload schema';
