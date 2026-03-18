-- Users table (mirrors auth.users, adds app fields)
create table public.users (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  stories_generated integer not null default 0,
  bonus_stories integer not null default 0,
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

-- ── Migration: run these against an existing database ──────────

-- alter table public.users add column if not exists bonus_stories integer not null default 0;

-- Promo codes table
create table public.promo_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  bonus_stories integer not null,
  max_uses integer not null,
  uses_so_far integer not null default 0,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.promo_codes enable row level security;
-- Only service role accesses this table

-- RPC: atomic promo code redemption (locks row to prevent race conditions)
create or replace function public.redeem_promo_code(p_code text, p_uid uuid)
returns jsonb as $$
declare
  v_promo record;
begin
  select * into v_promo from public.promo_codes
    where code = upper(p_code)
    for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'Invalid promo code');
  end if;

  if v_promo.expires_at is not null and v_promo.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'This promo code has expired');
  end if;

  if v_promo.uses_so_far >= v_promo.max_uses then
    return jsonb_build_object('ok', false, 'error', 'This promo code has reached its limit');
  end if;

  update public.promo_codes set uses_so_far = uses_so_far + 1 where id = v_promo.id;
  update public.users set bonus_stories = bonus_stories + v_promo.bonus_stories where id = p_uid;

  return jsonb_build_object('ok', true, 'bonus_stories', v_promo.bonus_stories);
end;
$$ language plpgsql security definer;

-- Seed: test promo code
-- insert into public.promo_codes (code, bonus_stories, max_uses) values ('SIPUR20', 20, 100);
