alter table public.cyber_news
  add column if not exists image_source text,
  add column if not exists image_checked_at timestamptz,
  add column if not exists image_alt_tr text;

