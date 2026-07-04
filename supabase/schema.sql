-- Buildkinship Supabase schema
-- Run this once in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
-- It creates the two data tables, secures them with Row Level Security so
-- each signed-in user only ever sees their own family tree, and sets up a
-- storage bucket for profile photos.

-- ─────────────────────────────────────────────────────────────────────────
-- 1. PERSONS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.persons (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  gender        text default 'unknown' check (gender in ('male', 'female', 'other', 'unknown')),
  "birthDate"   date,
  "birthPlace"  text,
  "deathDate"   date,
  "deathPlace"  text,
  "photoUrl"    text,
  biography     text,
  milestones    jsonb default '[]'::jsonb,
  "canvasX"     numeric default 0,
  "canvasY"     numeric default 0,
  created_date  timestamptz not null default now(),
  updated_date  timestamptz not null default now()
);

alter table public.persons enable row level security;

create policy "Users can view their own persons"
  on public.persons for select
  using (auth.uid() = user_id);

create policy "Users can insert their own persons"
  on public.persons for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own persons"
  on public.persons for update
  using (auth.uid() = user_id);

create policy "Users can delete their own persons"
  on public.persons for delete
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 2. RELATIONSHIPS
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.relationships (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  "fromPersonId"    uuid not null references public.persons(id) on delete cascade,
  "toPersonId"      uuid not null references public.persons(id) on delete cascade,
  type              text not null default 'parent'
                      check (type in ('parent', 'spouse', 'partner', 'sibling', 'step_parent', 'half_sibling', 'adopted_parent')),
  "marriageDate"    date,
  "separationDate"  date,
  notes             text,
  created_date      timestamptz not null default now(),
  updated_date      timestamptz not null default now()
);

alter table public.relationships enable row level security;

create policy "Users can view their own relationships"
  on public.relationships for select
  using (auth.uid() = user_id);

create policy "Users can insert their own relationships"
  on public.relationships for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own relationships"
  on public.relationships for update
  using (auth.uid() = user_id);

create policy "Users can delete their own relationships"
  on public.relationships for delete
  using (auth.uid() = user_id);

-- Helpful indexes for the lookups Home.jsx does when deleting a person
-- and when rendering the tree.
create index if not exists relationships_from_person_idx on public.relationships ("fromPersonId");
create index if not exists relationships_to_person_idx on public.relationships ("toPersonId");
create index if not exists persons_user_idx on public.persons (user_id);
create index if not exists relationships_user_idx on public.relationships (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. STORAGE (profile photos)
-- ─────────────────────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

-- Anyone can view photos (they're rendered in <img> tags), but only the
-- owning user can upload/replace/delete inside their own folder
-- (files are stored at "<user_id>/<uuid>.<ext>").
create policy "Public read access to photos"
  on storage.objects for select
  using (bucket_id = 'photos');

create policy "Users can upload their own photos"
  on storage.objects for insert
  with check (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own photos"
  on storage.objects for delete
  using (bucket_id = 'photos' and (storage.foldername(name))[1] = auth.uid()::text);
