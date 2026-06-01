-- Run this in Supabase → SQL Editor → New Query

-- Safety reports table (all anonymous)
create table safety_reports (
  id           uuid primary key default gen_random_uuid(),
  lat          float     not null,
  lng          float     not null,
  category     text      not null,
  time_of_day  text      not null default 'any',
  description  text,
  reported_at  timestamptz default now(),
  upvotes      int        default 0
);

-- Spatial index for fast bounding-box queries
create index safety_reports_location on safety_reports (lat, lng);
create index safety_reports_time     on safety_reports (reported_at desc);

-- RLS: anyone can insert (anonymous), anyone can read
alter table safety_reports enable row level security;

create policy "anon insert reports" on safety_reports
  for insert to anon with check (true);

create policy "anon read reports" on safety_reports
  for select to anon using (true);

-- Upvote function (atomic increment)
create or replace function increment_upvote(report_id uuid)
returns void as $$
  update safety_reports
  set upvotes = upvotes + 1
  where id = report_id;
$$ language sql security definer;
