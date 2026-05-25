# Siber Kirilma Noktalari

Ana sayfadaki "Bugunun Siber Olayi" karti `lib/cyberArchive.ts` icindeki kaynakli arsivden beslenir. Kart takvim gunune gore gece 00:00 sonrasinda yeni olaya gecer. Eslesen gun yoksa arsiv icinde gun bazli rotasyon yapar.

## Otomatik guncelleme plani

Canli internetten guncel yaziyi almak icin `backend/scripts/update_cyber_archive.py` hazirlandi.

1. Guvenilir bir RSS/Atom/JSON kaynak URL'si sec.
2. Render/Railway cron job'a `CYBER_ARCHIVE_FEED_URL` env degerini ekle.
3. Cron'u Europe/Istanbul saatine gore her gun 00:00 civarina ayarla.
4. Script ciktisini sonraki iterasyonda PostgreSQL'de `cyber_archive_posts` tablosuna kaydet.

Script su anda guvenli bir ara katmandir: veri ceker, sade JSON uretir ve editor kontrolu icin hazirlar. Bu sayede site otomatik icerik akisi kazanirken yanlis veya abartili guvenlik dili yayinlanmadan once kontrol edilebilir.
