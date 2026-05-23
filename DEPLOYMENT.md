# Public Demo Deployment

Bu dosya public demo icin Vercel + Render veya Vercel + Railway ortam degiskeni checklist'idir.

## Backend: Render

1. Render'da Blueprint deploy sec ve repoyu bagla.
2. `render.yaml` dosyasini kullan.
3. Backend servisinde su env degerlerini kontrol et:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2
DATABASE_URL=<Render Postgres connection string>
ENABLE_PLAYWRIGHT_FALLBACK=true
```

4. Build komutu:

```bash
pip install -r requirements.txt && playwright install --with-deps chromium
```

5. Start komutu:

```bash
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

6. Deploy sonrasi backend URL'i ile kontrol et:

```bash
GET https://YOUR_RENDER_URL/health
```

## Backend: Railway

1. Railway'de yeni proje olustur ve repoyu bagla.
2. PostgreSQL servisi ekle.
3. Backend servisine su env degerlerini gir:

```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2
DATABASE_URL=${{Postgres.DATABASE_URL}}
ENABLE_PLAYWRIGHT_FALLBACK=true
```

4. `railway.json` backend build/start komutlarini tanimlar.
5. Deploy sonrasi backend URL'i ile `/health` endpoint'ini kontrol et.

## Frontend: Vercel

1. Vercel'de repoyu import et.
2. Framework olarak Next.js secili olmali.
3. Env degeri:

```text
NEXT_PUBLIC_API_URL=https://YOUR_BACKEND_URL
```

4. Deploy et.
5. Vercel domaininde bir Trendyol, Hepsiburada ve N11 linkiyle analiz dene.

## Parser Success Measurement

Gercek linkleri `backend/parser_urls.txt` dosyasina koy:

```text
https://www.trendyol.com/...
https://www.hepsiburada.com/...
https://www.n11.com/...
```

Sonra:

```bash
cd backend
python scripts/measure_parser_success.py --file parser_urls.txt --csv parser_report.csv
```

Rapor:

- `average_success_score`: tum linklerde ortalama parser basari puani.
- `full_success_rate`: urun adi, satici, puan ve yorum sayisinin tamamini bulma orani.
- `has_reviews`: parser yorum metni ornegi yakaladi mi.

## AI Cost And Safety Logs

Backend her OpenAI ozet denemesinde log uretir:

```text
ai_usage provider=openai model=gpt-5.2 marketplace=Trendyol risk_level=caution total_tokens=1234 duration_ms=1800 fallback=false safety_flags=none
```

`DATABASE_URL` varsa ayni bilgi `ai_usage_logs` tablosuna da kaydedilir.

Kontrol edilecek alanlar:

- `total_tokens`: maliyet takibi.
- `duration_ms`: kullanici deneyimi.
- `used_fallback`: OpenAI cagrisi basarisiz mi.
- `safety_flags_json`: hukuki riskli kelime yakalandi mi.
