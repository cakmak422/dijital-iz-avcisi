import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer-premium border-t border-cyan-300/15 bg-slate-950 py-12 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1.5fr_0.8fr_0.8fr_1fr] lg:gap-8 lg:px-8">

        {/* Marka */}
        <div>
          <Link
            aria-label="Dijital İz Avcısı"
            className="inline-flex items-center gap-3 rounded-md border border-cyan-300/15 bg-slate-900/80 p-1.5 transition hover:border-cyan-300/35"
            href="/"
          >
            <span className="relative h-9 w-28 shrink-0 overflow-hidden rounded">
              <Image
                alt="Dijital İz Avcısı logosu"
                className="h-full w-full object-cover object-left"
                height={36}
                priority={false}
                sizes="144px"
                src="/logo.png"
                width={144}
              />
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-400">
            AI destekli alışveriş güvenliği, siber farkındalık ve dijital risk analizi platformu.
          </p>
          <p className="mt-4 rounded-lg border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-200">
            <span className="font-bold text-amber-100">Uyarı: </span>
            Platform risk sinyalleri üretir; kesin hüküm veya suç isnadı oluşturmaz.
          </p>
        </div>

        {/* Hızlı Bağlantılar */}
        <nav aria-label="Hızlı bağlantılar" className="grid content-start gap-1.5">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Hızlı Bağlantılar</p>
          {[
            { href: "/sorgu-paneli", label: "Sorgu Paneli" },
            { href: "/dijital-arac-merkezi", label: "Dijital Araç Merkezi" },
            { href: "/siber-arsiv", label: "Siber Arşiv" },
            { href: "/haberler", label: "Haberler" },
            { href: "/rehberler", label: "Rehberler" },
            { href: "/bilinclendirme", label: "Bilinçlendirme" }
          ].map(({ href, label }) => (
            <Link className="footer-link text-sm" href={href} key={href}>{label}</Link>
          ))}
        </nav>

        {/* Yasal */}
        <nav aria-label="Yasal sayfalar" className="grid content-start gap-1.5">
          <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">Yasal</p>
          {[
            { href: "/kvkk", label: "KVKK" },
            { href: "/gizlilik", label: "Gizlilik" },
            { href: "/yasal-uyari", label: "Yasal Uyarı" },
            { href: "/hakkimizda", label: "Hakkımızda" },
            { href: "/iletisim", label: "İletişim" }
          ].map(({ href, label }) => (
            <Link className="footer-link text-sm" href={href} key={href}>{label}</Link>
          ))}
        </nav>

        {/* İletişim */}
        <div className="grid content-start gap-3">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-300">İletişim</p>
          <p className="text-xs leading-5 text-slate-500">
            Soru, öneri veya şüpheli içerik bildirimi için iletişim formunu kullanabilirsiniz.
          </p>
          <Link
            className="inline-flex min-h-9 items-center justify-center rounded-md border border-cyan-300/22 bg-cyan-300/10 px-4 text-xs font-semibold text-cyan-100 transition hover:border-cyan-300/45 hover:bg-cyan-300/15"
            href="/iletisim"
          >
            İletişim Formu →
          </Link>
          <div className="mt-2 border-t border-white/8 pt-3">
            <p className="text-xs text-slate-600">
              © {new Date().getFullYear()} Dijital İz Avcısı
            </p>
            <p className="mt-0.5 text-xs text-slate-700">Tüm hakları saklıdır.</p>
          </div>
        </div>

      </div>
    </footer>
  );
}
