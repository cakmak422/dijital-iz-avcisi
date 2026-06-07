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
    category: "Phishing kontrolü",
    status: "active",
    priority: "core",
    description: "URL için phishing paterni, marka taklidi, kısa link ve alan adi suphelerini değerlendirir.",
    checks: ["Phishing sinyali", "Typo domain", "HTTPS", "Kısa link", "AI risk özeti"],
    href: "/sorgu-paneli?module=phishing"
  },
  {
    title: "E-posta Veri Sızıntısı Kontrolü",
    category: "Kimlik güvenliği",
    status: "planned",
    priority: "popular",
    description: "E-posta adresinin bilinen veri sizintilarinda görünup görünmedigini kontrol edecek.",
    checks: ["Sızıntı geçmişi", "Parola riski", "Servis bilgisi", "Kullanıcı Önerisi"]
  },
  {
    title: "QR Kod Analizi",
    category: "Mobil tehditler",
    status: "planned",
    priority: "popular",
    description: "Yüklenen QR kodun hedef URL'sini çözümleyip riskli yyönlendirme paternlerini açıklayacak.",
    checks: ["QR hedefi", "Redirect", "Phishing", "Kısa link çözümleme"]
  },
  {
    title: "Domain Istihbarati",
    category: "OSINT",
    status: "planned",
    priority: "core",
    description: "Domain yaşı, registrar, nameserver, SSL ve şüpheli alan adı yapısını tek raporda toplayacak.",
    checks: ["WHOIS", "SSL", "Nameserver", "Domain yasi", "Risk özeti"],
    href: "/sorgu-paneli?module=site"
  },
  {
    title: "Metadata Temizleyiçi",
    category: "Mahremiyet",
    status: "planned",
    priority: "advanced",
    description: "Fotoğraf ve belge dosyalarındaki EXIF/metadata bilgisini kaldırmaya odaklanan mahremiyet aracı.",
    checks: ["EXIF", "Konum bilgisi", "Cihaz bilgisi", "Temiz cikti"]
  }
];

export const roadmapDigitalTools: DigitalTool[] = [
  {
    title: "IP Adresi Analizi",
    category: "Ag istihbarati",
    status: "planned",
    priority: "core",
    description: "Ülke, ASN, VPN/proxy, blacklist ve abuse sinyallerini değerlendirecek.",
    checks: ["Ülke", "ASN", "VPN/proxy", "Abuse"],
    href: "/sorgu-paneli?module=ip"
  },
  {
    title: "Telefon Numarasi Risk Kontrolü",
    category: "Spam ve cagri riski",
    status: "research",
    priority: "popular",
    description: "Numaranın spam şikayeti, ülke/operatör ve şüpheli davranış sinyallerini inceleyecek.",
    checks: ["Spam şikayeti", "Operatör", "Ülke", "Risk sinyali"]
  },
  {
    title: "Guclu Şifre Olusturucu",
    category: "Hesap güvenliği",
    status: "planned",
    priority: "popular",
    description: "Entropy göstergesi ve tahmini kirilma süresiyle guclu parola üretimi saglayacak.",
    checks: ["Entropy", "Uzunluk", "Karakter cesitliligi", "Kirilma süresi"]
  },
  {
    title: "Dosya Hash Uretiçi",
    category: "Adli bilisim",
    status: "planned",
    priority: "advanced",
    description: "MD5, SHA1 ve SHA256 hash üretimiyle dosya butunlugu kontrolü yapacak.",
    checks: ["MD5", "SHA1", "SHA256", "Butunluk"]
  },
  {
    title: "Kısa Link Çözücü",
    category: "URL güvenliği",
    status: "planned",
    priority: "popular",
    description: "bit.ly ve benzeri kısaltilmis linklerin gerçek hedefini güvenli şekilde gösterecek.",
    checks: ["Hedef URL", "Redirect", "Alan adi", "Risk özeti"]
  },
  {
    title: "Tarayıcı Güvenlik Testi",
    category: "Mahremiyet testi",
    status: "research",
    priority: "advanced",
    description: "WebRTC, IP leak, canvas fingerprint ve browser exposure kontrollerini gösterecek.",
    checks: ["WebRTC", "IP leak", "Fingerprint", "Exposure"]
  }
];

export const statusLabels: Record<ToolStatus, string> = {
  active: "Aktif",
  planned: "Planlandi",
  research: "Arastirma"
};
