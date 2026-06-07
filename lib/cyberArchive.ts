export type CyberVisualTone =
  | "infrastructure"
  | "ransomware"
  | "privacy"
  | "worm"
  | "darkweb"
  | "sabotage"
  | "breach";

export type CyberArchiveEvent = {
  slug: string;
  title: string;
  dateLabel: string;
  monthDay: string;
  year: string;
  category: string;
  summary: string;
  impact: string;
  sourceName: string;
  sourceUrl: string;
  visualTone: CyberVisualTone;
};

export const cyberArchiveEvents: CyberArchiveEvent[] = [
  {
    slug: "volt-typhoon-cisa-uyarisi",
    title: "Volt Typhoon için kritik altyapı uyarisi",
    dateLabel: "24 Mayis 2023",
    monthDay: "05-24",
    year: "2023",
    category: "Devlet destekli tehdit",
    summary:
      "ABD ve uluslararası siber güvenlik kurumları, Volt Typhoon olarak izlenen faaliyet kümesinin kritik altyapı ağlarında gizli kalmaya çalışan teknikler kullandığını duyurdu.",
    impact:
      "Olay, kritik altyapı kurumlarında log takibi, kimlik bilgisi güvenliği ve living-off-the-land tekniklerine karşı savunmanın önemini gösterdi.",
    sourceName: "CISA Advisory AA23-144A",
    sourceUrl: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-144a",
    visualTone: "infrastructure"
  },
  {
    slug: "wannacry-fidye-saldirisi",
    title: "WannaCry fidye yazılımı yayılmaya başladı",
    dateLabel: "12 Mayis 2017",
    monthDay: "05-12",
    year: "2017",
    category: "Fidye yazılımı",
    summary:
      "WannaCry, Windows sistemlerdeki bir açıktan yararlanarak kısa sürede çok sayıda ülke ve kurumu etkileyen küresel bir fidye yazılımı dalgasına dönüştü.",
    impact:
      "Hastaneler, sirketler ve kamu kurumlari operasyonel kesinti yasadi; yamalarin zamaninda uygulanmasi ve ag segmentasyonu yeniden gündeme geldi.",
    sourceName: "Cloudflare Learning Center",
    sourceUrl: "https://www.cloudflare.com/learning/security/ransomware/wannacry-ransomware/",
    visualTone: "ransomware"
  },
  {
    slug: "snowden-belgeleri",
    title: "Snowden belgeleri mahremiyet tartismasini buyuttu",
    dateLabel: "5 Haziran 2013",
    monthDay: "06-05",
    year: "2013",
    category: "Dijital mahremiyet",
    summary:
      "Edward Snowden tarafindan sizdirilan belgeler, küresel gözetim programlari ve dijital mahremiyet hakkinda genis capli bir kamu tartismasi baslatti.",
    impact:
      "Şifreleme, veri minimizasyonu, ulusal güvenlik ve bireysel mahremiyet dengesi teknoloji dünyasının kalıcı başlıklarından biri haline geldi.",
    sourceName: "Britannica",
    sourceUrl: "https://www.britannica.com/biography/Edward-Snowden",
    visualTone: "privacy"
  },
  {
    slug: "morris-worm",
    title: "Morris Worm internetin erken dönemini sarsti",
    dateLabel: "2 Kasim 1988",
    monthDay: "11-02",
    year: "1988",
    category: "Zararlı yazılım tarihi",
    summary:
      "Morris Worm, internet üzerinden yayılan ilk büyük ölçekli solucanlardan biri olarak kabul edilir ve erken internet altyapısının kırılganlığını gösterdi.",
    impact:
      "Olay, CERT/CC gibi koordineli müdahale yapılarının önemini artırdı ve modern olay müdahalesi kültürüne zemin hazırladı.",
    sourceName: "Lawrence Livermore National Laboratory",
    sourceUrl: "https://st.llnl.gov/news/look-back/1988-morris-worm-internets-first-cyberattack",
    visualTone: "worm"
  },
  {
    slug: "silk-road-kapatilmasi",
    title: "Silk Road pazaryeri kapatıldı",
    dateLabel: "2 Ekim 2013",
    monthDay: "10-02",
    year: "2013",
    category: "Dark web ve kriminal ekosistem",
    summary:
      "Silk Road operasyonu, anonim ağlar ve kripto para kullanımı etrafındaki yasa dışı pazar yerlerinin güvenlik ve hukuk boyutunu gündeme taşıdı.",
    impact:
      "Dark web takibi, zincir üstü analiz ve dijital delil toplama yöntemleri kolluk ve siber istihbarat çalışmalarında daha görünür hale geldi.",
    sourceName: "FBI",
    sourceUrl: "https://archives.fbi.gov/archives/newyork/press-releases/2013/manhattan-u.s.-attorney-announces-seizure-of-additional-28-million-worth-of-bitcoins-belonging-to-ross-william-ulbricht-alleged-owner-and-operator-of-silk-road-website",
    visualTone: "darkweb"
  },
  {
    slug: "stuxnet-operasyonu",
    title: "Stuxnet modern siber sabotaj tartismasini baslatti",
    dateLabel: "2010",
    monthDay: "06-17",
    year: "2010",
    category: "Siber savas",
    summary:
      "Stuxnet, endüstriyel kontrol sistemlerini hedef alan gelişmiş bir zararlı yazılım olarak modern siber sabotaj ve devlet destekli operasyon tartışmalarında dönüm noktası oldu.",
    impact:
      "ICS/OT güvenliği, tedarik zinciri riski ve fiziksel dünyaya etki eden siber operasyonlar kurumlar için stratejik risk başlığı haline geldi.",
    sourceName: "CISA ICS Advisory",
    sourceUrl: "https://www.cisa.gov/news-events/ics-advisories/icsa-10-272-01",
    visualTone: "sabotage"
  },
  {
    slug: "yahoo-veri-sizintisi",
    title: "Yahoo büyük veri sızıntısını duyurdu",
    dateLabel: "22 Eylul 2016",
    monthDay: "09-22",
    year: "2016",
    category: "Büyük veri sızıntısı",
    summary:
      "Yahoo, yüz milyonlarca kullanıcı hesabını etkileyen büyük çaplı bir veri sızıntısını kamuoyuna duyurdu.",
    impact:
      "Parola tekrar kullanımı, hesap ele geçirme riski ve kurumsal bildirim süreçlerinin şeffaflığı hakkında kalıcı dersler ortaya çıktı.",
    sourceName: "Yahoo Security Notice",
    sourceUrl: "https://help.yahoo.com/kb/account/SLN27925.html",
    visualTone: "breach"
  }
];

export function getCyberArchiveEvents() {
  return cyberArchiveEvents;
}

export function getTodayCyberEvent(date = new Date()) {
  const monthDay = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const exactEvent = cyberArchiveEvents.find((event) => event.monthDay === monthDay);

  if (exactEvent) {
    return exactEvent;
  }

  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return cyberArchiveEvents[dayOfYear % cyberArchiveEvents.length];
}
