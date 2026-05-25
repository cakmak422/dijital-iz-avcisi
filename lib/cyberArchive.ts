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
    title: "Volt Typhoon icin kritik altyapi uyarisi",
    dateLabel: "24 Mayis 2023",
    monthDay: "05-24",
    year: "2023",
    category: "Devlet destekli tehdit",
    summary:
      "ABD ve uluslararasi siber guvenlik kurumlari, Volt Typhoon olarak izlenen faaliyet kumesinin kritik altyapi aglarinda gizli kalmaya calisan teknikler kullandigini duyurdu.",
    impact:
      "Olay, kritik altyapi kurumlarinda log takibi, kimlik bilgisi guvenligi ve living-off-the-land tekniklerine karsi savunmanin onemini gosterdi.",
    sourceName: "CISA Advisory AA23-144A",
    sourceUrl: "https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-144a",
    visualTone: "infrastructure"
  },
  {
    slug: "wannacry-fidye-saldirisi",
    title: "WannaCry fidye yazilimi yayilmaya basladi",
    dateLabel: "12 Mayis 2017",
    monthDay: "05-12",
    year: "2017",
    category: "Fidye yazilimi",
    summary:
      "WannaCry, Windows sistemlerdeki bir aciktan yararlanarak kisa surede cok sayida ulke ve kurumu etkileyen kuresel bir fidye yazilimi dalgasina donustu.",
    impact:
      "Hastaneler, sirketler ve kamu kurumlari operasyonel kesinti yasadi; yamalarin zamaninda uygulanmasi ve ag segmentasyonu yeniden gundeme geldi.",
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
      "Edward Snowden tarafindan sizdirilan belgeler, kuresel gozetim programlari ve dijital mahremiyet hakkinda genis capli bir kamu tartismasi baslatti.",
    impact:
      "Sifreleme, veri minimizasyonu, ulusal guvenlik ve bireysel mahremiyet dengesi teknoloji dunyasinin kalici basliklarindan biri haline geldi.",
    sourceName: "Britannica",
    sourceUrl: "https://www.britannica.com/biography/Edward-Snowden",
    visualTone: "privacy"
  },
  {
    slug: "morris-worm",
    title: "Morris Worm internetin erken donemini sarsti",
    dateLabel: "2 Kasim 1988",
    monthDay: "11-02",
    year: "1988",
    category: "Zararli yazilim tarihi",
    summary:
      "Morris Worm, internet uzerinden yayilan ilk buyuk olcekli solucanlardan biri olarak kabul edilir ve erken internet altyapisinin kirilganligini gosterdi.",
    impact:
      "Olay, CERT/CC gibi koordineli mudahale yapilarinin onemini artirdi ve modern olay mudahalesi kulturune zemin hazirladi.",
    sourceName: "Lawrence Livermore National Laboratory",
    sourceUrl: "https://st.llnl.gov/news/look-back/1988-morris-worm-internets-first-cyberattack",
    visualTone: "worm"
  },
  {
    slug: "silk-road-kapatilmasi",
    title: "Silk Road pazaryeri kapatildi",
    dateLabel: "2 Ekim 2013",
    monthDay: "10-02",
    year: "2013",
    category: "Dark web ve kriminal ekosistem",
    summary:
      "Silk Road operasyonu, anonim aglar ve kripto para kullanimi etrafindaki yasa disi pazar yerlerinin guvenlik ve hukuk boyutunu gundeme tasidi.",
    impact:
      "Dark web takibi, zincir ustu analiz ve dijital delil toplama yontemleri kolluk ve siber istihbarat calismalarinda daha gorunur hale geldi.",
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
      "Stuxnet, endustriyel kontrol sistemlerini hedef alan gelismis bir zararlI yazilim olarak modern siber sabotaj ve devlet destekli operasyon tartismalarinda donum noktasi oldu.",
    impact:
      "ICS/OT guvenligi, tedarik zinciri riski ve fiziksel dunyaya etki eden siber operasyonlar kurumlar icin stratejik risk basligi haline geldi.",
    sourceName: "CISA ICS Advisory",
    sourceUrl: "https://www.cisa.gov/news-events/ics-advisories/icsa-10-272-01",
    visualTone: "sabotage"
  },
  {
    slug: "yahoo-veri-sizintisi",
    title: "Yahoo buyuk veri sizintisini duyurdu",
    dateLabel: "22 Eylul 2016",
    monthDay: "09-22",
    year: "2016",
    category: "Buyuk veri sizintisi",
    summary:
      "Yahoo, yuz milyonlarca kullanici hesabini etkileyen buyuk capli bir veri sizintisini kamuoyuna duyurdu.",
    impact:
      "Parola tekrar kullanimi, hesap ele gecirme riski ve kurumsal bildirim sureclerinin seffafligi hakkinda kalici dersler ortaya cikti.",
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
