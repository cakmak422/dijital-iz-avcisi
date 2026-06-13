export type CyberVisualTone =
  | "infrastructure"
  | "ransomware"
  | "privacy"
  | "worm"
  | "darkweb"
  | "sabotage"
  | "breach";

export type CyberArchiveSeverity = "Orta" | "Yüksek" | "Kritik";

export type CyberArchiveEvent = {
  slug: string;
  title: string;
  dateLabel: string;
  monthDay: string;
  year: string;
  category: string;
  threatType: string;
  severity: CyberArchiveSeverity;
  summary: string;
  impact: string;
  details: string;
  affectedGroups: string[];
  recommendations: string[];
  sourceName: string;
  sourceUrl: string;
  visualTone: CyberVisualTone;
  tags: string[];
};

export const cyberArchiveEvents: CyberArchiveEvent[] = [
  {
    slug: "volt-typhoon-cisa-uyarisi",
    title: "Volt Typhoon için kritik altyapı uyarısı",
    dateLabel: "24 Mayıs 2023",
    monthDay: "05-24",
    year: "2023",
    category: "Devlet destekli tehdit",
    threatType: "Kritik altyapı",
    severity: "Kritik",
    summary:
      "ABD ve uluslararası siber güvenlik kurumları, Volt Typhoon olarak izlenen faaliyet kümesinin kritik altyapı ağlarında gizli kalmaya çalışan teknikler kullandığını duyurdu.",
    impact:
      "Olay, kritik altyapı kurumlarında log takibi, kimlik bilgisi güvenliği ve living-off-the-land tekniklerine karşı savunmanın önemini gösterdi.",
    details:
      "Uyarı, saldırganların sistem araçlarını kötüye kullanarak uzun süre fark edilmeden kalabileceğini vurguladı. Bu yaklaşım klasik zararlı yazılım imzalarına dayalı savunmaların tek başına yeterli olmayabileceğini gösterir.",
    affectedGroups: ["Kritik altyapı işletmecileri", "Kamu kurumları", "Ağ ve SOC ekipleri"],
    recommendations: ["Ağ günlüklerini merkezi izleyin.", "Kimlik bilgisi kullanımını denetleyin.", "Uzak erişim ve yönetim araçlarını sıkılaştırın."],
    sourceName: "CISA Advisory AA23-144A",
    sourceUrl: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-144a",
    visualTone: "infrastructure",
    tags: ["CISA", "kritik altyapı", "devlet destekli tehdit"]
  },
  {
    slug: "wannacry-fidye-saldirisi",
    title: "WannaCry fidye yazılımı yayılmaya başladı",
    dateLabel: "12 Mayıs 2017",
    monthDay: "05-12",
    year: "2017",
    category: "Fidye yazılımı",
    threatType: "Zararlı yazılım",
    severity: "Kritik",
    summary:
      "WannaCry, Windows sistemlerdeki bir açıktan yararlanarak kısa sürede çok sayıda ülke ve kurumu etkileyen küresel bir fidye yazılımı dalgasına dönüştü.",
    impact:
      "Hastaneler, şirketler ve kamu kurumları operasyonel kesinti yaşadı; yamaların zamanında uygulanması ve ağ segmentasyonu yeniden gündeme geldi.",
    details:
      "Saldırı, yamalanmamış sistemlerin küresel ölçekte zincirleme etki oluşturabileceğini gösterdi. Fidye yazılımı olaylarının yalnızca dosya şifreleme değil, hizmet sürekliliği sorunu olduğu daha net anlaşıldı.",
    affectedGroups: ["Sağlık kurumları", "Kamu kurumları", "Yamalanmamış Windows sistemleri"],
    recommendations: ["Güvenlik yamalarını geciktirmeyin.", "Yedekleri çevrimdışı saklayın.", "Ağ segmentasyonu ve olay müdahale planı oluşturun."],
    sourceName: "Cloudflare Learning Center",
    sourceUrl: "https://www.cloudflare.com/learning/security/ransomware/wannacry-ransomware/",
    visualTone: "ransomware",
    tags: ["fidye yazılımı", "WannaCry", "yama yönetimi"]
  },
  {
    slug: "snowden-belgeleri",
    title: "Snowden belgeleri mahremiyet tartışmasını büyüttü",
    dateLabel: "5 Haziran 2013",
    monthDay: "06-05",
    year: "2013",
    category: "Dijital mahremiyet",
    threatType: "Gözetim ve mahremiyet",
    severity: "Yüksek",
    summary:
      "Edward Snowden tarafından sızdırılan belgeler, küresel gözetim programları ve dijital mahremiyet hakkında geniş çaplı bir kamu tartışması başlattı.",
    impact:
      "Şifreleme, veri minimizasyonu, ulusal güvenlik ve bireysel mahremiyet dengesi teknoloji dünyasının kalıcı başlıklarından biri haline geldi.",
    details:
      "Belgeler, dijital iletişim altyapısında şeffaflık, denetim ve veri koruma tartışmalarını güçlendirdi. Kullanıcıların hangi verilerin kimler tarafından işlendiğini sorgulaması daha görünür hale geldi.",
    affectedGroups: ["Bireysel kullanıcılar", "Teknoloji şirketleri", "Politika yapıcılar"],
    recommendations: ["Uçtan uca şifreleme kullanın.", "Veri paylaşım izinlerini düzenli gözden geçirin.", "Kurumlarda veri minimizasyonu prensibini uygulayın."],
    sourceName: "Britannica",
    sourceUrl: "https://www.britannica.com/biography/Edward-Snowden",
    visualTone: "privacy",
    tags: ["mahremiyet", "gözetim", "şifreleme"]
  },
  {
    slug: "morris-worm",
    title: "Morris Worm internetin erken dönemini sarstı",
    dateLabel: "2 Kasım 1988",
    monthDay: "11-02",
    year: "1988",
    category: "Zararlı yazılım tarihi",
    threatType: "Solucan",
    severity: "Yüksek",
    summary:
      "Morris Worm, internet üzerinden yayılan ilk büyük ölçekli solucanlardan biri olarak kabul edilir ve erken internet altyapısının kırılganlığını gösterdi.",
    impact:
      "Olay, CERT/CC gibi koordineli müdahale yapılarının önemini artırdı ve modern olay müdahalesi kültürüne zemin hazırladı.",
    details:
      "Morris Worm, sistemlerin birbirine bağlı yapısının güvenlik hatalarını nasıl büyütebileceğini gösterdi. Olaydan sonra koordineli açıklama, olay müdahalesi ve akademik güvenlik araştırmaları daha fazla önem kazandı.",
    affectedGroups: ["Akademik ağlar", "Erken internet altyapısı", "Sistem yöneticileri"],
    recommendations: ["Güvenlik araştırmalarında etik sınırlar belirleyin.", "Olay müdahale iletişim planı hazırlayın.", "Ağdaki beklenmeyen davranışları izleyin."],
    sourceName: "Lawrence Livermore National Laboratory",
    sourceUrl: "https://st.llnl.gov/news/look-back/1988-morris-worm-internets-first-cyberattack",
    visualTone: "worm",
    tags: ["solucan", "CERT", "internet tarihi"]
  },
  {
    slug: "silk-road-kapatilmasi",
    title: "Silk Road pazaryeri kapatıldı",
    dateLabel: "2 Ekim 2013",
    monthDay: "10-02",
    year: "2013",
    category: "Dark web ve kriminal ekosistem",
    threatType: "Kriminal pazar",
    severity: "Yüksek",
    summary:
      "Silk Road operasyonu, anonim ağlar ve kripto para kullanımı etrafındaki yasa dışı pazar yerlerinin güvenlik ve hukuk boyutunu gündeme taşıdı.",
    impact:
      "Dark web takibi, zincir üstü analiz ve dijital delil toplama yöntemleri kolluk ve siber istihbarat çalışmalarında daha görünür hale geldi.",
    details:
      "Operasyon, anonimlik araçlarının kötüye kullanımını ve dijital delil zincirinin önemini ortaya koydu. Kripto para işlemlerinin izlenebilirliği ve platform güvenliği tartışmaları hızlandı.",
    affectedGroups: ["Kolluk birimleri", "Kripto ekosistemi", "Siber istihbarat ekipleri"],
    recommendations: ["Kripto dolandırıcılık sinyallerini takip edin.", "Şüpheli pazar yeri bağlantılarını açmayın.", "Dijital delil süreçlerinde kayıt bütünlüğünü koruyun."],
    sourceName: "FBI",
    sourceUrl: "https://archives.fbi.gov/archives/newyork/press-releases/2013/manhattan-u.s.-attorney-announces-seizure-of-additional-28-million-worth-of-bitcoins-belonging-to-ross-william-ulbricht-alleged-owner-and-operator-of-silk-road-website",
    visualTone: "darkweb",
    tags: ["dark web", "kripto", "dijital delil"]
  },
  {
    slug: "stuxnet-operasyonu",
    title: "Stuxnet modern siber sabotaj tartışmasını başlattı",
    dateLabel: "2010",
    monthDay: "06-17",
    year: "2010",
    category: "Siber savaş",
    threatType: "ICS/OT sabotaj",
    severity: "Kritik",
    summary:
      "Stuxnet, endüstriyel kontrol sistemlerini hedef alan gelişmiş bir zararlı yazılım olarak modern siber sabotaj ve devlet destekli operasyon tartışmalarında dönüm noktası oldu.",
    impact:
      "ICS/OT güvenliği, tedarik zinciri riski ve fiziksel dünyaya etki eden siber operasyonlar kurumlar için stratejik risk başlığı haline geldi.",
    details:
      "Olay, siber saldırıların yalnızca veri sistemlerini değil fiziksel süreçleri de etkileyebileceğini gösterdi. Endüstriyel ağlarda görünürlük, ayrıştırma ve tedarik zinciri güvenliği kritik hale geldi.",
    affectedGroups: ["Endüstriyel tesisler", "Enerji ve üretim kurumları", "ICS/OT güvenlik ekipleri"],
    recommendations: ["OT ağlarını IT ağlarından ayrıştırın.", "Kontrol sistemlerinde değişiklik izleme uygulayın.", "Tedarik zinciri risklerini düzenli değerlendirin."],
    sourceName: "CISA ICS Advisory",
    sourceUrl: "https://www.cisa.gov/news-events/ics-advisories/icsa-10-272-01",
    visualTone: "sabotage",
    tags: ["Stuxnet", "ICS", "siber sabotaj"]
  },
  {
    slug: "yahoo-veri-sizintisi",
    title: "Yahoo büyük veri sızıntısını duyurdu",
    dateLabel: "22 Eylül 2016",
    monthDay: "09-22",
    year: "2016",
    category: "Büyük veri sızıntısı",
    threatType: "Veri ihlali",
    severity: "Kritik",
    summary:
      "Yahoo, yüz milyonlarca kullanıcı hesabını etkileyen büyük çaplı bir veri sızıntısını kamuoyuna duyurdu.",
    impact:
      "Parola tekrar kullanımı, hesap ele geçirme riski ve kurumsal bildirim süreçlerinin şeffaflığı hakkında kalıcı dersler ortaya çıktı.",
    details:
      "Olay, büyük ölçekli veri ihlallerinde kullanıcı bilgilendirme, parola güvenliği ve çok faktörlü doğrulamanın önemini güçlendirdi.",
    affectedGroups: ["E-posta kullanıcıları", "Kurumsal güvenlik ekipleri", "Parola tekrar kullanan kullanıcılar"],
    recommendations: ["Aynı parolayı farklı hesaplarda kullanmayın.", "Mümkünse çok faktörlü doğrulama açın.", "Veri ihlali bildirimlerini takip edin."],
    sourceName: "Yahoo Security Notice",
    sourceUrl: "https://help.yahoo.com/kb/account/SLN27925.html",
    visualTone: "breach",
    tags: ["veri sızıntısı", "parola", "hesap güvenliği"]
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
