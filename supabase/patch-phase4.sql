-- Askuala Phase 4 patch: analytics + premium tier data model

create table if not exists public.schools (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique,
  region text,
  created_at timestamptz not null default now()
);

create table if not exists public.school_memberships (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  school_id uuid not null references public.schools(id) on delete cascade,
  role text not null check (role in ('student','teacher','admin')),
  created_at timestamptz not null default now(),
  unique(user_id, school_id)
);

create table if not exists public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','premium_teacher','premium_school')),
  status text not null default 'active' check (status in ('active','paused','cancelled')),
  started_at timestamptz not null default now(),
  ends_at timestamptz,
  unique(owner_id)
);

alter table public.schools enable row level security;
alter table public.school_memberships enable row level security;
alter table public.subscriptions enable row level security;

drop policy if exists "schools_read_all" on public.schools;
create policy "schools_read_all" on public.schools for select using (true);

drop policy if exists "memberships_self_read" on public.school_memberships;
create policy "memberships_self_read" on public.school_memberships
  for select using (auth.uid() = user_id);

drop policy if exists "subscriptions_self_all" on public.subscriptions;
create policy "subscriptions_self_all" on public.subscriptions
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
