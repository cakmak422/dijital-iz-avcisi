export type ToolStatus = "active" | "planned" | "research";
export type ToolRisk = "core" | "popular" | "advanced";

export type DigitalTool = {
  title: string;
  category: string;
  status: ToolStatus;
  priority: ToolRisk;
  description: string;
  checks: string[];
  href?: string;
};

export const primaryDigitalTools: DigitalTool[] = [
  {
    title: "Sahte Link Analizi",
    category: "Phishing kontrolu",
    status: "active",
    priority: "core",
    description: "URL icin phishing paterni, marka taklidi, kisa link ve alan adi suphelerini degerlendirir.",
    checks: ["Phishing sinyali", "Typo domain", "HTTPS", "Kisa link", "AI risk ozeti"],
    href: "/sorgu-paneli?module=phishing"
  },
  {
    title: "E-posta Veri Sizintisi Kontrolu",
    category: "Kimlik guvenligi",
    status: "planned",
    priority: "popular",
    description: "E-posta adresinin bilinen veri sizintilarinda gorunup gorunmedigini kontrol edecek.",
    checks: ["Sizinti gecmisi", "Parola riski", "Servis bilgisi", "Kullanici onerisi"]
  },
  {
    title: "QR Kod Analizi",
    category: "Mobil tehditler",
    status: "planned",
    priority: "popular",
    description: "Yuklenen QR kodun hedef URL'sini cozumleyip riskli yonlendirme paternlerini aciklayacak.",
    checks: ["QR hedefi", "Redirect", "Phishing", "Kisa link cozumleme"]
  },
  {
    title: "Domain Istihbarati",
    category: "OSINT",
    status: "planned",
    priority: "core",
    description: "Domain yasi, registrar, nameserver, SSL ve supheli alan adi yapisini tek raporda toplayacak.",
    checks: ["WHOIS", "SSL", "Nameserver", "Domain yasi", "Risk ozeti"],
    href: "/sorgu-paneli?module=site"
  },
  {
    title: "Metadata Temizleyici",
    category: "Mahremiyet",
    status: "planned",
    priority: "advanced",
    description: "Fotograf ve belge dosyalarindaki EXIF/metadata bilgisini kaldirmaya odaklanan mahremiyet araci.",
    checks: ["EXIF", "Konum bilgisi", "Cihaz bilgisi", "Temiz cikti"]
  }
];

export const roadmapDigitalTools: DigitalTool[] = [
  {
    title: "IP Adresi Analizi",
    category: "Ag istihbarati",
    status: "planned",
    priority: "core",
    description: "Ulke, ASN, VPN/proxy, blacklist ve abuse sinyallerini degerlendirecek.",
    checks: ["Ulke", "ASN", "VPN/proxy", "Abuse"],
    href: "/sorgu-paneli?module=ip"
  },
  {
    title: "Telefon Numarasi Risk Kontrolu",
    category: "Spam ve cagri riski",
    status: "research",
    priority: "popular",
    description: "Numaranin spam sikayeti, ulke/operator ve supheli davranis sinyallerini inceleyecek.",
    checks: ["Spam sikayeti", "Operator", "Ulke", "Risk sinyali"]
  },
  {
    title: "Guclu Sifre Olusturucu",
    category: "Hesap guvenligi",
    status: "planned",
    priority: "popular",
    description: "Entropy gostergesi ve tahmini kirilma suresiyle guclu parola uretimi saglayacak.",
    checks: ["Entropy", "Uzunluk", "Karakter cesitliligi", "Kirilma suresi"]
  },
  {
    title: "Dosya Hash Uretici",
    category: "Adli bilisim",
    status: "planned",
    priority: "advanced",
    description: "MD5, SHA1 ve SHA256 hash uretimiyle dosya butunlugu kontrolu yapacak.",
    checks: ["MD5", "SHA1", "SHA256", "Butunluk"]
  },
  {
    title: "Kisa Link Cozucu",
    category: "URL guvenligi",
    status: "planned",
    priority: "popular",
    description: "bit.ly ve benzeri kisaltilmis linklerin gercek hedefini guvenli sekilde gosterecek.",
    checks: ["Hedef URL", "Redirect", "Alan adi", "Risk ozeti"]
  },
  {
    title: "Tarayici Guvenlik Testi",
    category: "Mahremiyet testi",
    status: "research",
    priority: "advanced",
    description: "WebRTC, IP leak, canvas fingerprint ve browser exposure kontrollerini gosterecek.",
    checks: ["WebRTC", "IP leak", "Fingerprint", "Exposure"]
  }
];

export const statusLabels: Record<ToolStatus, string> = {
  active: "Aktif",
  planned: "Planlandi",
  research: "Arastirma"
};
