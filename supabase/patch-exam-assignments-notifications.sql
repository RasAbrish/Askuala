-- Phase 4 patch: exam assignments + notifications

create table if not exists public.exam_assignments (
  id uuid primary key default uuid_generate_v4(),
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  unique(quiz_id, student_id)
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'general',
  title text not null,
  body text,
  link text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists exam_assignments_student_idx on public.exam_assignments(student_id, assigned_at desc);
create index if not exists notifications_user_idx on public.notifications(user_id, read, created_at desc);

alter table public.exam_assignments enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "exam_assignments_student_read" on public.exam_assignments;
create policy "exam_assignments_student_read" on public.exam_assignments
  for select using (auth.uid() = student_id);

drop policy if exists "exam_assignments_teacher_manage" on public.exam_assignments;
create policy "exam_assignments_teacher_manage" on public.exam_assignments
  for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

drop policy if exists "notifications_self_all" on public.notifications;
create policy "notifications_self_all" on public.notifications
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
