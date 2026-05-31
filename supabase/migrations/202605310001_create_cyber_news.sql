create extension if not exists pgcrypto;

create table if not exists public.cyber_news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  summary text not null,
  risk_note text,
  public_advice jsonb default '[]'::jsonb,
  category text,
  source_name text not null,
  source_url text unique not null,
  image_url text,
  published_at timestamptz,
  fetched_at timestamptz default now(),
  risk_level text,
  created_at timestamptz default now()
);

create index if not exists cyber_news_published_at_idx on public.cyber_news (published_at desc);
create index if not exists cyber_news_fetched_at_idx on public.cyber_news (fetched_at desc);
create index if not exists cyber_news_source_url_idx on public.cyber_news (source_url);

alter table public.cyber_news enable row level security;

drop policy if exists "cyber_news_public_read" on public.cyber_news;
create policy "cyber_news_public_read"
  on public.cyber_news
  for select
  to anon, authenticated
  using (true);

-- Write operations are intentionally not opened to anon/authenticated roles.
-- Supabase service_role bypasses RLS and should be used only from server-side code.
