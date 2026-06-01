-- Run this in Supabase → SQL Editor → New Query

-- Community posts (all anonymous)
create table community_posts (
  id           uuid primary key default gen_random_uuid(),
  content      text        not null,
  category     text        not null default 'general',
  crisis_level int         not null default 0,
  upvotes      int         not null default 0,
  reply_count  int         not null default 0,
  is_flagged   boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- Community replies (all anonymous)
create table community_replies (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid        not null references community_posts(id) on delete cascade,
  content      text        not null,
  upvotes      int         not null default 0,
  is_volunteer boolean     not null default false,
  is_flagged   boolean     not null default false,
  created_at   timestamptz not null default now()
);

-- Indexes
create index posts_created    on community_posts  (created_at desc);
create index posts_category   on community_posts  (category, created_at desc);
create index replies_post_id  on community_replies (post_id, created_at asc);

-- RLS: anyone can read unflagged posts, anyone can insert
alter table community_posts   enable row level security;
alter table community_replies enable row level security;

create policy "anon read posts" on community_posts
  for select to anon using (is_flagged = false);

create policy "anon insert posts" on community_posts
  for insert to anon with check (true);

create policy "anon read replies" on community_replies
  for select to anon using (is_flagged = false);

create policy "anon insert replies" on community_replies
  for insert to anon with check (true);

-- Atomic increment functions
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
