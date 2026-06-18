create extension if not exists pgcrypto;

create table if not exists public.awareness_banners (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  image_url text not null,
  alt_text text,
  format text default 'PNG',
  page_key text default 'home',
  status text default 'active',
  sort_order integer default 100,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists awareness_banners_status_page_order_idx
  on public.awareness_banners (status, page_key, sort_order);

alter table public.awareness_banners enable row level security;

create or replace function public.set_awareness_banners_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_awareness_banners_updated_at on public.awareness_banners;

create trigger set_awareness_banners_updated_at
before update on public.awareness_banners
for each row
execute function public.set_awareness_banners_updated_at();

insert into public.awareness_banners (
  id,
  title,
  description,
  category,
  image_url,
  alt_text,
  format,
  page_key,
  status,
  sort_order
)
values
  (
    '11111111-1111-4111-8111-111111111111',
    'Oltalama Uyarısı',
    'Marka taklidi yapan bağlantılara karşı adres çubuğunu ve alan adını kontrol edin.',
    'Oltalama',
    '/awareness/phishing-awareness.png',
    'Oltalama uyarısı farkındalık afişi',
    'PNG',
    'home',
    'active',
    10
  ),
  (
    '22222222-2222-4222-8222-222222222222',
    'Yasa Dışı Sanal Bahislere Karşı Farkındalık',
    'Yüksek kazanç vaadi, hızlı para baskısı ve kimlik bilgisi isteyen bahis bağlantılarına karşı dikkatli olun.',
    'Yasa Dışı Bahis',
    '/awareness/afistema.png',
    'Yasa dışı sanal bahis farkındalık afişi',
    'PNG',
    'home',
    'active',
    20
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    'Tarım Aletleri Dolandırıcılığı',
    'Piyasanın çok altında fiyat, kapora baskısı ve doğrulanamayan satıcı bilgileri dolandırıcılık sinyali olabilir.',
    'Alışveriş Güvenliği',
    '/awareness/genelarkaplantema.png',
    'Tarım aletleri dolandırıcılığı farkındalık afişi',
    'PNG',
    'home',
    'active',
    30
  )
on conflict (id) do update
set
  title = excluded.title,
  description = excluded.description,
  category = excluded.category,
  image_url = excluded.image_url,
  alt_text = excluded.alt_text,
  format = excluded.format,
  page_key = excluded.page_key,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();
