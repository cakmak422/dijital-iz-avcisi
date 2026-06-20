import Image from "next/image";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-cyan-300/15 bg-slate-950 py-10 text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.4fr_0.8fr_0.8fr_1fr] lg:px-8">
        <div>
          <Link className="flex items-center gap-3" href="/" aria-label="Dijital İz Avcısı">
            <span className="relative h-10 w-28 shrink-0 overflow-hidden rounded-md border border-white/10 bg-slate-900 shadow-sm">
              <Image
                alt="Dijital İz Avcısı logosu"
                className="h-full w-full object-cover object-left"
                height={44}
                src="/logo.png"
                sizes="144px"
                width={144}
              />
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-slate-300">
            AI destekli alışveriş güvenliği, siber farkındalık ve dijital risk analizi platformu.
          </p>
          <p className="mt-4 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
            Platform bilgilendirme amacıyla risk sinyalleri üretir; kesin hüküm veya suç isnadı oluşturmaz.
          </p>
        </div>

        <nav className="grid content-start gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">Hızlı Bağlantılar</p>
          <Link className="transition hover:text-cyan-200" href="/sorgu-paneli">Sorgu Paneli</Link>
          <Link className="transition hover:text-cyan-200" href="/dijital-arac-merkezi">Dijital Araç Merkezi</Link>
          <Link className="transition hover:text-cyan-200" href="/siber-arsiv">Siber Arşiv</Link>
          <Link className="transition hover:text-cyan-200" href="/haberler">Haberler</Link>
          <Link className="transition hover:text-cyan-200" href="/rehberler">Rehberler</Link>
          <Link className="transition hover:text-cyan-200" href="/bilinclendirme">Bilinçlendirme</Link>
        </nav>

        <nav className="grid content-start gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">Yasal</p>
          <Link className="transition hover:text-cyan-200" href="/kvkk">KVKK</Link>
          <Link className="transition hover:text-cyan-200" href="/gizlilik">Gizlilik</Link>
          <Link className="transition hover:text-cyan-200" href="/yasal-uyari">Yasal Uyarı</Link>
          <Link className="transition hover:text-cyan-200" href="/hakkimizda">Hakkımızda</Link>
          <Link className="transition hover:text-cyan-200" href="/iletisim">İletişim</Link>
        </nav>

        <div className="grid content-start gap-2 text-sm text-slate-300">
          <p className="font-bold text-white">İletişim</p>
          <p className="text-xs leading-6 text-slate-400">
            Soru, öneri veya bildirim için iletişim formunu kullanabilirsiniz.
          </p>
          <Link className="btn-secondary mt-1 min-h-10 px-4 text-center text-xs" href="/iletisim">
            İletişim Formu
          </Link>
          <p className="mt-3 text-xs text-slate-500">
            © {new Date().getFullYear()} Dijital İz Avcısı. Tüm hakları saklıdır.
          </p>
        </div>
      </div>
    </footer>
  );
}
