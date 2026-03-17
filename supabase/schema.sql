-- Users table (mirrors auth.users, adds app fields)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  stories_generated integer not null default 0,
  created_at timestamptz not null default now()
);
alter table public.users enable row level security;
create policy "select own" on public.users for select using (auth.uid() = id);
create policy "update own" on public.users for update using (auth.uid() = id);

-- Stories table
create table public.stories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  seed jsonb not null,
  daas_output jsonb not null,
  story_text text not null,
  audio_url text,   -- null: blob URLs are ephemeral
  created_at timestamptz not null default now()
);
alter table public.stories enable row level security;
create policy "select own" on public.stories for select using (auth.uid() = user_id);
create policy "insert own" on public.stories for insert with check (auth.uid() = user_id);

-- Trigger: auto-create user row when someone signs up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Error logs table
create table public.error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  route text not null,
  error_message text not null,
  user_id uuid references public.users(id) on delete set null,
  metadata jsonb
);
alter table public.error_logs enable row level security;
-- Only service role accesses this table

-- Story events table (all generations, incl. anonymous)
create table public.story_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete set null,
  seed jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.story_events enable row level security;
-- Only service role accesses this table; no user-facing policies needed

-- RPC: atomic increment (race-condition safe)
create or replace function public.increment_stories_generated(uid uuid)
returns void as $$
  update public.users set stories_generated = stories_generated + 1 where id = uid;
$$ language sql security definer;
