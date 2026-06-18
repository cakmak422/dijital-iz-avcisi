create extension if not exists pgcrypto;

create table if not exists public.cyber_timeline_events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  date_label text not null,
  month_day text not null,
  year text not null,
  category text not null,
  threat_type text not null,
  severity text not null,
  summary text not null,
  impact text not null,
  details text not null,
  affected_groups jsonb default '[]'::jsonb,
  recommendations jsonb default '[]'::jsonb,
  source_name text not null,
  source_url text not null,
  visual_tone text not null,
  tags jsonb default '[]'::jsonb,
  status text default 'active',
  sort_order integer default 100,
  event_date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists cyber_timeline_events_status_idx on public.cyber_timeline_events (status);
create index if not exists cyber_timeline_events_sort_idx on public.cyber_timeline_events (sort_order, year desc, month_day);
create index if not exists cyber_timeline_events_month_day_idx on public.cyber_timeline_events (month_day);

alter table public.cyber_timeline_events enable row level security;

drop policy if exists "cyber_timeline_events_public_read" on public.cyber_timeline_events;
create policy "cyber_timeline_events_public_read"
  on public.cyber_timeline_events
  for select
  to anon, authenticated
  using (status = 'active');

create or replace function public.set_cyber_timeline_events_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_cyber_timeline_events_updated_at on public.cyber_timeline_events;
create trigger set_cyber_timeline_events_updated_at
  before update on public.cyber_timeline_events
  for each row
  execute function public.set_cyber_timeline_events_updated_at();

insert into public.cyber_timeline_events (
  slug,
  title,
  date_label,
  month_day,
  year,
  category,
  threat_type,
  severity,
  summary,
  impact,
  details,
  affected_groups,
  recommendations,
  source_name,
  source_url,
  visual_tone,
  tags,
  status,
  sort_order,
  event_date
) values
  (
    'volt-typhoon-cisa-uyarisi',
    'Volt Typhoon için kritik altyapı uyarısı',
    '24 Mayıs 2023',
    '05-24',
    '2023',
    'Devlet destekli tehdit',
    'Kritik altyapı',
    'Kritik',
    'ABD ve uluslararası siber güvenlik kurumları, Volt Typhoon olarak izlenen faaliyet kümesinin kritik altyapı ağlarında gizli kalmaya çalışan teknikler kullandığını duyurdu.',
    'Olay, kritik altyapı kurumlarında log takibi, kimlik bilgisi güvenliği ve living-off-the-land tekniklerine karşı savunmanın önemini gösterdi.',
    'Uyarı, saldırganların sistem araçlarını kötüye kullanarak uzun süre fark edilmeden kalabileceğini vurguladı. Bu yaklaşım klasik zararlı yazılım imzalarına dayalı savunmaların tek başına yeterli olmayabileceğini gösterir.',
    '["Kritik altyapı işletmecileri", "Kamu kurumları", "Ağ ve SOC ekipleri"]'::jsonb,
    '["Ağ günlüklerini merkezi izleyin.", "Kimlik bilgisi kullanımını denetleyin.", "Uzak erişim ve yönetim araçlarını sıkılaştırın."]'::jsonb,
    'CISA Advisory AA23-144A',
    'https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-144a',
    'infrastructure',
    '["CISA", "kritik altyapı", "devlet destekli tehdit"]'::jsonb,
    'active',
    10,
    '2023-05-24'
  ),
  (
    'wannacry-fidye-saldirisi',
    'WannaCry fidye yazılımı yayılmaya başladı',
    '12 Mayıs 2017',
    '05-12',
    '2017',
    'Fidye yazılımı',
    'Zararlı yazılım',
    'Kritik',
    'WannaCry, Windows sistemlerdeki bir açıktan yararlanarak kısa sürede çok sayıda ülke ve kurumu etkileyen küresel bir fidye yazılımı dalgasına dönüştü.',
    'Hastaneler, şirketler ve kamu kurumları operasyonel kesinti yaşadı; yamaların zamanında uygulanması ve ağ segmentasyonu yeniden gündeme geldi.',
    'Saldırı, yamalanmamış sistemlerin küresel ölçekte zincirleme etki oluşturabileceğini gösterdi. Fidye yazılımı olaylarının yalnızca dosya şifreleme değil, hizmet sürekliliği sorunu olduğu daha net anlaşıldı.',
    '["Sağlık kurumları", "Kamu kurumları", "Yamalanmamış Windows sistemleri"]'::jsonb,
    '["Güvenlik yamalarını geciktirmeyin.", "Yedekleri çevrimdışı saklayın.", "Ağ segmentasyonu ve olay müdahale planı oluşturun."]'::jsonb,
    'Cloudflare Learning Center',
    'https://www.cloudflare.com/learning/security/ransomware/wannacry-ransomware/',
    'ransomware',
    '["fidye yazılımı", "WannaCry", "yama yönetimi"]'::jsonb,
    'active',
    20,
    '2017-05-12'
  ),
  (
    'snowden-belgeleri',
    'Snowden belgeleri mahremiyet tartışmasını büyüttü',
    '5 Haziran 2013',
    '06-05',
    '2013',
    'Dijital mahremiyet',
    'Gözetim ve mahremiyet',
    'Yüksek',
    'Edward Snowden tarafından sızdırılan belgeler, küresel gözetim programları ve dijital mahremiyet hakkındaki kamu tartışmasını büyüttü.',
    'Şifreleme, veri minimizasyonu, ulusal güvenlik ve bireysel mahremiyet dengesi teknoloji dünyasının kalıcı başlıklarından biri haline geldi.',
    'Belgeler, dijital iletişim altyapısında şeffaflık, denetim ve veri koruma tartışmalarını güçlendirdi. Kullanıcıların hangi verilerin kimler tarafından işlendiğini sorgulaması daha görünür hale geldi.',
    '["Bireysel kullanıcılar", "Teknoloji şirketleri", "Politika yapıcılar"]'::jsonb,
    '["Uçtan uca şifreleme kullanın.", "Veri paylaşım izinlerini düzenli gözden geçirin.", "Kurumlarda veri minimizasyonu prensibini uygulayın."]'::jsonb,
    'Britannica',
    'https://www.britannica.com/biography/Edward-Snowden',
    'privacy',
    '["mahremiyet", "gözetim", "şifreleme"]'::jsonb,
    'active',
    30,
    '2013-06-05'
  ),
  (
    'morris-worm',
    'Morris Worm internetin erken dönemini sarstı',
    '2 Kasım 1988',
    '11-02',
    '1988',
    'Zararlı yazılım tarihi',
    'Solucan',
    'Yüksek',
    'Morris Worm, internet üzerinden yayılan ilk büyük ölçekli solucanlardan biri olarak kabul edilir ve erken internet altyapısının kırılganlığını gösterdi.',
    'Olay, CERT/CC gibi koordineli müdahale yapılarının önemini artırdı ve modern olay müdahalesi kültürüne zemin hazırladı.',
    'Morris Worm, sistemlerin birbirine bağlı yapısının güvenlik hatalarını nasıl büyütebileceğini gösterdi. Olaydan sonra koordineli açıklama, olay müdahalesi ve akademik güvenlik araştırmaları daha fazla önem kazandı.',
    '["Akademik ağlar", "Erken internet altyapısı", "Sistem yöneticileri"]'::jsonb,
    '["Güvenlik araştırmalarında etik sınırlar belirleyin.", "Olay müdahale iletişim planı hazırlayın.", "Ağdaki beklenmeyen davranışları izleyin."]'::jsonb,
    'Lawrence Livermore National Laboratory',
    'https://st.llnl.gov/news/look-back/1988-morris-worm-internets-first-cyberattack',
    'worm',
    '["solucan", "CERT", "internet tarihi"]'::jsonb,
    'active',
    40,
    '1988-11-02'
  ),
  (
    'silk-road-kapatilmasi',
    'Silk Road pazaryeri kapatıldı',
    '2 Ekim 2013',
    '10-02',
    '2013',
    'Dark web ve kriminal ekosistem',
    'Kriminal pazar',
    'Yüksek',
    'Silk Road operasyonu, anonim ağlar ve kripto para kullanımı etrafındaki yasa dışı pazar yerlerinin güvenlik ve hukuk boyutunu gündeme taşıdı.',
    'Dark web takibi, zincir üstü analiz ve dijital delil toplama yöntemleri kolluk ve siber istihbarat çalışmalarında daha görünür hale geldi.',
    'Operasyon, anonimlik araçlarının kötüye kullanımını ve dijital delil zincirinin önemini ortaya koydu. Kripto para işlemlerinin izlenebilirliği ve platform güvenliği tartışmaları hızlandı.',
    '["Kolluk birimleri", "Kripto ekosistemi", "Siber istihbarat ekipleri"]'::jsonb,
    '["Kripto dolandırıcılık sinyallerini takip edin.", "Şüpheli pazar yeri bağlantılarını açmayın.", "Dijital delil süreçlerinde kayıt bütünlüğünü koruyun."]'::jsonb,
    'FBI',
    'https://archives.fbi.gov/archives/newyork/press-releases/2013/manhattan-u.s.-attorney-announces-seizure-of-additional-28-million-worth-of-bitcoins-belonging-to-ross-william-ulbricht-alleged-owner-and-operator-of-silk-road-website',
    'darkweb',
    '["dark web", "kripto", "dijital delil"]'::jsonb,
    'active',
    50,
    '2013-10-02'
  ),
  (
    'stuxnet-operasyonu',
    'Stuxnet modern siber sabotaj tartışmasını başlattı',
    '2010',
    '06-17',
    '2010',
    'Siber savaş',
    'ICS/OT sabotaj',
    'Kritik',
    'Stuxnet, endüstriyel kontrol sistemlerini hedef alan gelişmiş bir zararlı yazılım olarak modern siber sabotaj ve devlet destekli operasyon tartışmalarında dönüm noktası oldu.',
    'ICS/OT güvenliği, tedarik zinciri riski ve fiziksel dünyaya etki eden siber operasyonlar kurumlar için stratejik risk başlığı haline geldi.',
    'Olay, siber saldırıların yalnızca veri sistemlerini değil fiziksel süreçleri de etkileyebileceğini gösterdi. Endüstriyel ağlarda görünürlük, ayrıştırma ve tedarik zinciri güvenliği kritik hale geldi.',
    '["Endüstriyel tesisler", "Enerji ve üretim kurumları", "ICS/OT güvenlik ekipleri"]'::jsonb,
    '["OT ağlarını IT ağlarından ayrıştırın.", "Kontrol sistemlerinde değişiklik izleme uygulayın.", "Tedarik zinciri risklerini düzenli değerlendirin."]'::jsonb,
    'CISA ICS Advisory',
    'https://www.cisa.gov/news-events/ics-advisories/icsa-10-272-01',
    'sabotage',
    '["Stuxnet", "ICS", "siber sabotaj"]'::jsonb,
    'active',
    60,
    '2010-06-17'
  ),
  (
    'yahoo-veri-sizintisi',
    'Yahoo büyük veri sızıntısını duyurdu',
    '22 Eylül 2016',
    '09-22',
    '2016',
    'Büyük veri sızıntısı',
    'Veri ihlali',
    'Kritik',
    'Yahoo, yüz milyonlarca kullanıcı hesabını etkileyen büyük çaplı bir veri sızıntısını kamuoyuna duyurdu.',
    'Parola tekrar kullanımı, hesap ele geçirme riski ve kurumsal bildirim süreçlerinin şeffaflığı hakkında kalıcı dersler ortaya çıktı.',
    'Olay, büyük ölçekli veri ihlallerinde kullanıcı bilgilendirme, parola güvenliği ve çok faktörlü doğrulamanın önemini güçlendirdi.',
    '["E-posta kullanıcıları", "Kurumsal güvenlik ekipleri", "Parola tekrar kullanan kullanıcılar"]'::jsonb,
    '["Aynı parolayı farklı hesaplarda kullanmayın.", "Mümkünse çok faktörlü doğrulama açın.", "Veri ihlali bildirimlerini takip edin."]'::jsonb,
    'Yahoo Security Notice',
    'https://help.yahoo.com/kb/account/SLN27925.html',
    'breach',
    '["veri sızıntısı", "parola", "hesap güvenliği"]'::jsonb,
    'active',
    70,
    '2016-09-22'
  )
on conflict (slug) do update set
  title = excluded.title,
  date_label = excluded.date_label,
  month_day = excluded.month_day,
  year = excluded.year,
  category = excluded.category,
  threat_type = excluded.threat_type,
  severity = excluded.severity,
  summary = excluded.summary,
  impact = excluded.impact,
  details = excluded.details,
  affected_groups = excluded.affected_groups,
  recommendations = excluded.recommendations,
  source_name = excluded.source_name,
  source_url = excluded.source_url,
  visual_tone = excluded.visual_tone,
  tags = excluded.tags,
  status = excluded.status,
  sort_order = excluded.sort_order,
  event_date = excluded.event_date;
