# Dijital Iz Avcisi

AI destekli alisveris guvenlik analizi icin MVP demo.

> WARNING:
> Current mock authentication is NOT secure and MUST NOT be considered production authentication.
> Production release requires real backend validation, database-backed sessions, server-side authorization, and HttpOnly Secure cookies.

Kullanici Trendyol, Hepsiburada veya N11 urun linki yapistirir. Sistem urun, satici, yorum sinyalleri ve guven skorunu tek ekranda gosterir.

## MVP Kapsami

- Urun linki analizi
- Satici ve pazar yeri tanima
- Trendyol, Hepsiburada ve N11 icin gercek urun sayfasi parser'lari
- Negatif yorum yogunlugu demo skoru
- AI yorum ozeti icin hazir veri sozlesmesi
- Guven skoru: Guvenli, Dikkatli Ol, Riskli
- Hukuki olarak temkinli dil: "dolandirici" gibi kesin ifadeler yerine risk sinyali ve sikayet yogunlugu

## Teknoloji

- Frontend: Next.js, TypeScript, TailwindCSS
- Backend: Python FastAPI
- Planlanan veri toplama: Playwright, BeautifulSoup
- Planlanan AI: OpenAI API
- Planlanan veritabani: PostgreSQL

## Frontend Calistirma

```bash
npm install
npm run dev
```

Frontend varsayilan olarak `http://localhost:3000` adresinde calisir.

Backend acik degilse arayuz demo analiz sonucu dondurur. Bu, ilk sunumda deneyimin bos kalmamasini saglar.

## Backend Calistirma

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
playwright install chromium
uvicorn app.main:app --reload
```

Backend varsayilan olarak `http://127.0.0.1:8000` adresinde calisir.

Saglik kontrolu:

```bash
curl http://127.0.0.1:8000/health
```

Analiz endpoint'i:

```bash
POST http://127.0.0.1:8000/api/analyze
Content-Type: application/json

{
  "url": "https://www.trendyol.com/ornek-urun-p-123"
}
```

Gecmis endpoint'i:

```bash
GET http://127.0.0.1:8000/api/history?limit=20
```

## Ortam Degiskenleri

Frontend icin `.env.example`, backend icin `backend/.env.example` dosyalarini temel al.

Frontend:

```bash
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Backend:

```bash
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-5.2
DATABASE_URL=postgresql+psycopg://user:password@host:5432/dijital_iz_avcisi
ENABLE_PLAYWRIGHT_FALLBACK=true
```

`OPENAI_API_KEY` yoksa sistem deterministik fallback ozetini kullanir. `DATABASE_URL` yoksa analiz gecmisi kaydedilmez. `ENABLE_PLAYWRIGHT_FALLBACK=false` yapilirsa sadece statik HTML parser'lari calisir.

## Proje Yapisi

```text
app/
  globals.css
  layout.tsx
  page.tsx
lib/
  api.ts
backend/
  app/
    analyzers/
    main.py
    routes/
    services/
    models/
  requirements.txt
```

## Sonraki Adimlar

1. Gercek urun linkleriyle parser basari oranini olc.
2. Frontend'e analiz gecmisi paneli ekle.
3. OpenAI ciktisini maliyet ve guvenlik icin logla/olc.
4. Public demo yayini icin Vercel + Render veya Railway hesaplarinda env degerlerini gir.

## Parser Notlari

Backend once pazar yerini URL host'una gore secer, sonra ilgili analyzer ile HTML ve JSON-LD alanlarini tarar.

- `backend/app/analyzers/trendyol.py`
- `backend/app/analyzers/hepsiburada.py`
- `backend/app/analyzers/n11.py`

Bu parser'lar urun adi, satici adi, puan, yorum sayisi ve yorum metni orneklerini cikarmaya calisir. E-ticaret siteleri sik sik client-side render, A/B test ve bot korumasi kullandigi icin veri eksik gelebilir. Bu durumda API hata vermek yerine kontrollu fallback sonuc dondurur ve `parser_notes` alaninda bunu belirtir.

## AI Ozeti

Backend `OPENAI_API_KEY` varsa OpenAI Responses API ile JSON schema formatinda yorum ozeti uretir. Cikti su alanlari doldurur:

- `positive`
- `negative`
- `fake_review_pattern`
- `delivery_complaints`
- `return_issues`
- `recommendation`

Prompt hukuki olarak temkinli dil kullanir; kesin suclama yerine risk paterni ve sikayet yogunlugu anlatir.

## PostgreSQL

`DATABASE_URL` tanimliysa backend acilista `analysis_history` tablosunu olusturur ve her `/api/analyze` sonucunu kaydeder.

Render veya Railway uzerinde Postgres servisi olusturup connection string'i `DATABASE_URL` olarak backend'e ver.

## Deploy

Bu repo uc deploy dosyasi icerir:

- `vercel.json`: Next.js frontend icin.
- `render.yaml`: FastAPI backend + PostgreSQL blueprint icin.
- `railway.json`: FastAPI backend icin Railway config-as-code.

Detayli env checklist'i icin `DEPLOYMENT.md` dosyasina bak.

## Gunluk Siber Olay Otomasyonu

Ana sayfadaki "Bugunun Siber Olayi" karti `/api/cyber-event` endpoint'i uzerinden CISA Known Exploited Vulnerabilities katalog verisini kullanir. Endpoint sonucu 30-60 dakika araliginda cachelenir ve kaynak alinamazsa acikca etiketlenmis fallback bilgi dondurur.

Korunmus cron endpoint'i:

```bash
GET /api/cron/daily-cyber-event
Authorization: Bearer CRON_SECRET
```

GitHub Actions icin `.github/workflows/daily-cyber-event.yml` dosyasi eklendi. Her gece 00:00 Turkiye saati icin `21:00 UTC` cron kullanir. Repository secrets:

- `SITE_URL=https://dijitalizavcisi.com`
- `CRON_SECRET=hostingdeki-secret-ile-ayni`

Hostinger cron desteklemiyorsa alternatifler:

- GitHub Actions scheduled workflow
- Cloudflare Cron Trigger
- cron-job.org gibi dis cron servisleri

Kalici otomatik yayin icin veritabani gerekir. LocalStorage veya serverless bellek, gece otomatik haber yayinini guvenilir sekilde saklayamaz. Sonraki adim Supabase/PostgreSQL tablosunda `daily_cyber_events` kaydi tutmaktir.

Public demo icin pratik akıs:

1. Backend'i Render veya Railway'e deploy et.
2. Backend env degerlerini gir: `OPENAI_API_KEY`, `OPENAI_MODEL`, `DATABASE_URL`, `ENABLE_PLAYWRIGHT_FALLBACK`.
3. Backend URL'ini Vercel'de `NEXT_PUBLIC_API_URL` olarak gir.
4. Frontend'i Vercel'e deploy et.
5. Vercel domaininden gercek urun linkleriyle test et.

## Parser Basari Orani Olcumu

Gercek urun linklerini bir dosyaya koyup parser basari raporu alabilirsin:

```bash
cd backend
python scripts/measure_parser_success.py --file parser_urls.txt --csv parser_report.csv
```

Ornek dosya formati icin `backend/parser_urls.example.txt` dosyasina bak.

## Urun Ilkesi

MVP mukemmel olmak zorunda degil. Ilk hedef calisan demodur.
