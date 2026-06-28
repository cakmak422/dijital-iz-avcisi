import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { CyberPageShell } from "@/components/CyberPageShell";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma ve Rıza Metni | Dijital İz Avcısı",
  description: "6698 sayılı KVKK kapsamında kişisel verilerinizin işlenmesine ilişkin aydınlatma metni.",
  alternates: { canonical: "/kvkk" },
};

// ── Stil yardımcıları ──────────────────────────────────────────────────────────

function Section({ title, id, children }: { title: string; id?: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-white/10 bg-white/5 p-6" id={id}>
      <h2 className="mb-4 text-lg font-bold text-slate-100">{title}</h2>
      <div className="space-y-3 text-sm leading-7 text-slate-300">{children}</div>
    </article>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-white/10">
            {headers.map(h => (
              <th key={h} className="pb-2 pr-4 text-left text-xs font-bold uppercase tracking-widest text-slate-400">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-white/5">
              {row.map((cell, j) => (
                <td key={j} className="py-2 pr-4 text-slate-300" dangerouslySetInnerHTML={{ __html: cell }} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-md border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm leading-6 text-amber-300">
      {children}
    </div>
  );
}

function Ul({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 pl-4">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
          <span dangerouslySetInnerHTML={{ __html: item }} />
        </li>
      ))}
    </ul>
  );
}

// ── Sayfa ─────────────────────────────────────────────────────────────────────

export default function KvkkPage() {
  return (
    <CyberPageShell variant="about">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="KVKK" />
          <Link className="btn-secondary px-4 py-2" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl space-y-5">

          {/* Sayfa başlığı */}
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-400">Bilgilendirme</p>
            <h1 className="mt-2 text-3xl font-bold text-slate-100">KVKK Aydınlatma ve Rıza Metni</h1>
          </div>

          {/* Taslak uyarısı — hukuki onay sonrası kaldırılacak */}
          <div className="rounded-md border border-sky-400/40 bg-sky-400/10 px-4 py-3 text-sm text-sky-300">
            <span className="font-bold">📋 Taslak:</span>{" "}
            Bu metin taslak niteliğindedir, hukuki inceleme sürecindedir.
          </div>

          {/* 1 — Veri Sorumlusu */}
          <Section title="1. Veri Sorumlusunun Kimliği">
            <p>
              6698 sayılı Kişisel Verilerin Korunması Kanunu ("<strong className="text-slate-100">KVKK</strong>" veya "<strong className="text-slate-100">Kanun</strong>") uyarınca, kişisel verileriniz; veri sorumlusu sıfatıyla <strong className="text-slate-100">[Şirket/Şahıs Unvanı]</strong> ("<strong className="text-slate-100">Dijital İz Avcısı</strong>" veya "<strong className="text-slate-100">Platform</strong>") tarafından aşağıda açıklanan kapsamda işlenebilecektir.
            </p>
            <Table
              headers={["Bilgi", "Değer"]}
              rows={[
                ["Unvan", "[Doldurulacak]"],
                ["MERSİS No / Vergi No", "[Doldurulacak]"],
                ["Adres", "[Doldurulacak]"],
                ["KEP Adresi", "[Doldurulacak]"],
                ["E-posta", "[Doldurulacak]"],
                ["Web Sitesi", "dijitalizavcisi.com"],
              ]}
            />
          </Section>

          {/* 2 — Kapsam */}
          <Section title="2. Bu Metnin Kapsamı">
            <p>
              Bu Aydınlatma Metni, Platform'a üye olan, giriş yapan, iletişim formunu kullanan veya sorgu/analiz modüllerini (Phishing Kontrolü, Site Güvenlik Kontrolü, IP İstihbaratı, Ürün Analizi, SMS/Mesaj Analizi, Fotoğraf EXIF Analizi) kullanan tüm gerçek kişileri kapsar.
            </p>
          </Section>

          {/* 3 — İşlenen Veriler */}
          <Section title="3. İşlenen Kişisel Veri Kategorileri">
            <Table
              headers={["Kategori", "Veriler", "Toplandığı Yer"]}
              rows={[
                ["<strong>Kimlik Bilgisi</strong>", "Ad, soyad, doğum tarihi", "Üyelik formu"],
                ["<strong>İletişim Bilgisi</strong>", "E-posta adresi, telefon numarası", "Üyelik formu, iletişim formu"],
                ["<strong>Müşteri İşlem Bilgisi</strong>", "Kullanıcı adı, hesap durumu, kayıt tarihi", "Üyelik sistemi"],
                ["<strong>İşlem Güvenliği Bilgisi</strong>", "IP adresi, oturum açma tarihi/saati, oturum açma sayısı, e-posta doğrulama durumu", "Giriş/kayıt sırasında otomatik"],
                ["<strong>Pazarlama/Kullanım Bilgisi (anonim olabilir)</strong>", "Yapılan sorgu türü (phishing/site/IP/ürün/SMS/EXIF), sorgu tarihi, risk sonucu", "Sorgu/analiz modülleri"],
                ["<strong>İşlem Güvenliği — Hassas Sorgu İçeriği</strong>", "Sorgulanan IP adresi, dosya adı, SMS/mesaj metni — bunlar <strong>tek yönlü şifreleme (hash) ile</strong> saklanır, geri okunabilir değildir", "Sorgu/analiz modülleri"],
                ["<strong>Rıza Kaydı</strong>", "KVKK onay durumu, onay tarihi/saati, onay anındaki IP adresi", "Üyelik formu (bu metnin onaylanması)"],
                ["<strong>İletişim İçeriği</strong>", "İletişim formundan gönderilen mesaj metni", "İletişim formu"],
              ]}
            />
          </Section>

          {/* 4 — Amaçlar */}
          <Section title="4. Kişisel Verilerin İşlenme Amaçları">
            <p>Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:</p>
            <Ul items={[
              "Üyelik kaydının oluşturulması ve yönetilmesi,",
              "Kimlik/e-posta doğrulamasının (OTP) yapılması,",
              "Sorgu/analiz hizmetlerinin (phishing, site güvenliği, IP istihbaratı, ürün analizi, SMS analizi, EXIF analizi) sunulması,",
              "Platform güvenliğinin sağlanması; yetkisiz erişim, kötüye kullanım ve sahte hesap oluşturmanın önlenmesi,",
              "Hesap güvenliği amacıyla giriş denemelerinin, IP adreslerinin ve oturum geçmişinin kayıt altına alınması,",
              "İletişim formu üzerinden gelen taleplerin yanıtlanması,",
              "Kanuni yükümlülüklerin yerine getirilmesi ve yetkili kurum/kuruluşlara karşı hukuki sorumlulukların ifası,",
              "İşbu rızanın varlığının ve kapsamının ispatı amacıyla rıza kaydının (tarih, saat, IP) tutulması.",
            ]} />
          </Section>

          {/* 5 — Hukuki Sebepler */}
          <Section title="5. Kişisel Veri İşlemenin Hukuki Sebepleri">
            <p>Kişisel verileriniz, KVKK'nın 5. maddesinde belirtilen aşağıdaki hukuki sebeplere dayanılarak işlenmektedir:</p>
            <Ul items={[
              "<strong>Açık rızanızın bulunması</strong> (üyelik formundaki KVKK onay kutusu ile),",
              "Bir sözleşmenin kurulması veya ifasıyla doğrudan doğruya ilgili olması (üyelik sözleşmesi/kullanım şartları),",
              "Veri sorumlusunun meşru menfaati için veri işlenmesinin zorunlu olması (platform güvenliği, kötüye kullanımın önlenmesi),",
              "Kanunlarda açıkça öngörülmesi (örneğin elektronik ticaret/elektronik haberleşme mevzuatı kapsamındaki saklama yükümlülükleri).",
            ]} />
          </Section>

          {/* 6 — Aktarım */}
          <Section title="6. Kişisel Verilerin Aktarılması">
            <p>Kişisel verileriniz, yukarıda belirtilen amaçların gerçekleştirilmesi ile sınırlı olarak:</p>
            <Ul items={[
              "Platform'un teknik altyapı hizmeti aldığı barındırma/veritabanı sağlayıcılarına (Supabase),",
              "E-posta doğrulama (OTP) ve bildirim gönderimi için kullanılan e-posta servis sağlayıcısına (Resend),",
              "Yetkili kamu kurum ve kuruluşlarına, kanunen yetkili özel hukuk kişilerine (talep halinde, mevzuatın gerektirdiği ölçüde),",
            ]} />
            <p>aktarılabilir.</p>
            <Note>
              <strong>Avukatınızın özellikle kontrol etmesi gereken nokta:</strong> Yukarıda sayılan hizmet sağlayıcılarından bir veya birden fazlasının sunucuları <strong>Türkiye dışında</strong> bulunabilir. KVKK'nın 9. maddesi, kişisel verilerin yurt dışına aktarımı için ek şartlar (yeterli korumanın bulunduğu ülkeler listesi, Kişisel Verileri Koruma Kurulu'nun izni veya taahhütname gibi) öngörmektedir. Bu metnin "yurt dışı aktarım" bölümünün, kullandığınız servis sağlayıcıların gerçek sunucu konumlarına göre bir uzman tarafından netleştirilmesi gerekmektedir.
            </Note>
          </Section>

          {/* 7 — Saklama */}
          <Section title="7. Kişisel Verilerin Saklama Süresi">
            <p>
              Kişisel verileriniz, işleme amaçlarının gerektirdiği süre boyunca ve ilgili mevzuatta öngörülen zamanaşımı süreleri dikkate alınarak saklanır. Hesabınızı sildiğinizde, yasal saklama yükümlülüklerimiz dışındaki verileriniz silinir veya anonim hale getirilir.
            </p>
            <Note>
              Net saklama süreleri (örn. "X yıl") burada belirtilmemiştir — bunu, hesap silme/kullanıcı talebi süreciniz netleşince bir uzmanla birlikte ekleyin.
            </Note>
          </Section>

          {/* 8 — Haklar */}
          <Section title="8. Kişisel Veri Sahibinin Hakları (KVKK m. 11)">
            <p>KVKK'nın 11. maddesi uyarınca, Platform'a başvurarak:</p>
            <Ul items={[
              "Kişisel verinizin işlenip işlenmediğini öğrenme,",
              "İşlenmişse buna ilişkin bilgi talep etme,",
              "İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme,",
              "Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme,",
              "Eksik/yanlış işlenmişse düzeltilmesini isteme,",
              "KVKK'nın 7. maddesindeki şartlar oluştuğunda silinmesini/yok edilmesini isteme,",
              "Düzeltme/silme işlemlerinin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme,",
              "İşlenen verilerin münhasıran otomatik sistemler ile analiz edilmesi sonucu aleyhinize bir sonuç ortaya çıkmasına itiraz etme,",
              "Kanuna aykırı işleme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme",
            ]} />
            <p>haklarına sahipsiniz.</p>
          </Section>

          {/* 9 — Başvuru */}
          <Section title="9. Başvuru Yöntemi">
            <p>
              Yukarıdaki haklarınızı kullanmak için taleplerinizi{" "}
              <strong className="text-slate-100">[başvuru e-postası/adres bilgisi doldurulacak]</strong>{" "}
              üzerinden, kimliğinizi tevsik edici belgelerle birlikte iletebilirsiniz. Başvurularınız, KVKK'nın 13. maddesi uyarınca en geç 30 gün içinde sonuçlandırılır.
            </p>
          </Section>

          {/* 10 — Güvenlik */}
          <Section title="10. Veri Güvenliği">
            <p>Platform, kişisel verilerinizin güvenliğini sağlamak amacıyla teknik ve idari tedbirler almaktadır. Bu kapsamda:</p>
            <Ul items={[
              "Şifreleriniz, geri okunamaz şekilde (tuzlu hash, scrypt algoritması) saklanır; Platform çalışanları dahi şifrenizi göremez,",
              "Hassas nitelikteki sorgu içerikleri (IP adresi sorguları, dosya adları, SMS metinleri) tek yönlü şifreleme ile saklanır,",
              "Yönetim paneline erişim, sunucu taraflı kimlik doğrulama ve imzalı oturum mekanizmalarıyla korunmaktadır.",
            ]} />
          </Section>

          {/* 11 — Çerezler */}
          <Section title="11. Çerezler (Cookies)">
            <p>
              Platform, oturum yönetimi ve güvenlik amacıyla zorunlu çerezler kullanmaktadır. [Pazarlama/analitik çerez kullanıyorsanız bu bölüm genişletilmeli, kullanmıyorsanız bunu açıkça belirtin.]
            </p>
          </Section>

          {/* 12 — Açık Rıza */}
          <Section title="12. Üyelik Formu için Açık Rıza Beyanı">
            <p className="text-slate-400 text-xs">
              Bu bölüm, kayıt formundaki onay kutusunun yanında veya bu sayfanın en altında, kullanıcının "okudum, onaylıyorum" dediği asıl rıza cümlesi olarak kullanılabilir:
            </p>
            <blockquote className="border-l-2 border-cyan-400 pl-4 italic text-slate-200">
              "Yukarıda yer alan KVKK Aydınlatma Metni'ni okudum; ad, soyad, e-posta, telefon numarası, doğum tarihi ve IP adresi gibi kişisel verilerimin, belirtilen amaçlar ve hukuki sebepler doğrultusunda Dijital İz Avcısı tarafından işlenmesine, yukarıda belirtilen üçüncü taraflara aktarılmasına ve bu onayımın tarih, saat ve IP bilgimle birlikte kayıt altına alınmasına <strong>açıkça rıza gösteriyorum.</strong>"
            </blockquote>
          </Section>

          {/* 13 — Değişiklikler */}
          <Section title="13. Değişiklikler">
            <p>
              Platform, bu Aydınlatma Metni'nde gerekli gördüğü değişiklikleri yapma hakkını saklı tutar. Güncel metin her zaman bu sayfada yayınlanır.
            </p>
            <p className="text-slate-400">
              <strong>Son güncelleme tarihi:</strong> [28.06.2026]
            </p>
          </Section>

          {/* Alt not */}
          <p className="text-center text-xs text-slate-500">
            Bu metin [Şirket Unvanı] tarafından, KVKK'nın 10. ve 11. maddeleri çerçevesinde hazırlanmış bir taslaktır ve yayına alınmadan önce hukuki danışmanlık ile teyit edilmelidir.
          </p>

        </div>
      </section>

      <SiteFooter />
    </CyberPageShell>
  );
}
