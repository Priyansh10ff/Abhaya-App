-- ═══════════════════════════════════════════════════════════
-- Abhaya — Supabase Setup
-- Run this entire file in: Supabase → SQL Editor → New Query
-- ═══════════════════════════════════════════════════════════

-- ── 1. Safety Reports (Safety Map) ──────────────────────────
create table if not exists safety_reports (
  id           uuid primary key default gen_random_uuid(),
  lat          float       not null,
  lng          float       not null,
  category     text        not null,
  time_of_day  text        not null default 'any',
  description  text,
  reported_at  timestamptz not null default now(),
  upvotes      int         not null default 0
);

create index if not exists safety_reports_location on safety_reports (lat, lng);
create index if not exists safety_reports_time     on safety_reports (reported_at desc);

alter table safety_reports enable row level security;
create policy "anon insert reports" on safety_reports for insert to anon with check (true);
create policy "anon read reports"   on safety_reports for select to anon using (true);

create or replace function increment_upvote(report_id uuid)
returns void as $$
  update safety_reports set upvotes = upvotes + 1 where id = report_id;
$$ language sql security definer;

-- ── 2. Community Posts ───────────────────────────────────────
create table if not exists community_posts (
  id           uuid primary key default gen_random_uuid(),
  content      text        not null,
  category     text        not null default 'general',
  crisis_level int         not null default 0,
  upvotes      int         not null default 0,
  reply_count  int         not null default 0,
  is_flagged   boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists posts_created  on community_posts (created_at desc);
create index if not exists posts_category on community_posts (category, created_at desc);

alter table community_posts enable row level security;
create policy "anon read posts"   on community_posts for select to anon using (is_flagged = false);
create policy "anon insert posts" on community_posts for insert to anon with check (true);

-- ── 3. Community Replies ─────────────────────────────────────
create table if not exists community_replies (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid        not null references community_posts(id) on delete cascade,
  content      text        not null,
  upvotes      int         not null default 0,
  is_volunteer boolean     not null default false,
  is_flagged   boolean     not null default false,
  created_at   timestamptz not null default now()
);

create index if not exists replies_post on community_replies (post_id, created_at asc);

alter table community_replies enable row level security;
create policy "anon read replies"   on community_replies for select to anon using (is_flagged = false);
create policy "anon insert replies" on community_replies for insert to anon with check (true);

-- ── 4. Helper Functions ──────────────────────────────────────
create or replace function increment_post_upvote(post_id uuid)
returns void as $$
  update community_posts set upvotes = upvotes + 1 where id = post_id;
$$ language sql security definer;

create or replace function increment_reply_upvote(reply_id uuid)
returns void as $$
  update community_replies set upvotes = upvotes + 1 where id = reply_id;
$$ language sql security definer;

create or replace function increment_reply_count(post_id uuid)
returns void as $$
  update community_posts set reply_count = reply_count + 1 where id = post_id;
$$ language sql security definer;

-- ── 5. Waitlist (optional — for marketing site) ──────────────
create table if not exists waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        text unique not null,
  source       text,
  signed_up_at timestamptz default now()
);

alter table waitlist enable row level security;
create policy "service insert waitlist" on waitlist for insert to service_role with check (true);
create policy "service select waitlist" on waitlist for select to service_role using (true);
