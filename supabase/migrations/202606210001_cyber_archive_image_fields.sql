-- FAZ 1: cyber_timeline_events tablosuna görsel alanları ekle
-- Bu migration mevcut verileri korur, sadece yeni kolonlar ekler.

ALTER TABLE public.cyber_timeline_events
  ADD COLUMN IF NOT EXISTS image_url          text,
  ADD COLUMN IF NOT EXISTS image_source       text DEFAULT 'none'
    CHECK (image_source IN ('ai-generated', 'admin-upload', 'none')),
  ADD COLUMN IF NOT EXISTS image_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS news_item_id       text;

-- news_item_id: Faz 2'de haber → arşiv bağlantısı için kullanılır.
-- Aynı haberin iki kez eklenmesini önler.

CREATE INDEX IF NOT EXISTS cyber_timeline_events_news_item_id_idx
  ON public.cyber_timeline_events (news_item_id)
  WHERE news_item_id IS NOT NULL;

-- Supabase Storage: cyber-archive bucket'ı oluşturulması gerekiyor.
-- Supabase Dashboard > Storage > New Bucket > "cyber-archive" > Public: true
-- Bu SQL ile bucket oluşturulamaz; Dashboard veya API üzerinden yapılmalı.
