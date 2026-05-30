import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { UserSessionBanner } from "@/components/UserSessionBanner";

const history = [
  { type: "Phishing Kontrolü", target: "ornek-bank-login.com", result: "Dikkat", date: "24.05.2026" },
  { type: "SMS Analizi", target: "Kargo ödeme mesajı", result: "Risk", date: "24.05.2026" },
  { type: "Ürün Analizi", target: "Trendyol ürün linki", result: "Güvenli", date: "23.05.2026" }
];

const favorites = ["Sahte Link Analizi", "SMS / Mesaj Analizi", "Siber Kırılma Noktaları"];

export default function UserPanelPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-cyan-900/10 bg-white dark:border-cyan-300/10 dark:bg-slate-950">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <BrandLogo subtitle="Kullanıcı Paneli" />
          <Link className="rounded-md border border-cyan-900/12 px-4 py-2 text-sm font-semibold transition hover:bg-cyan-50 dark:border-cyan-300/15 dark:hover:bg-cyan-300/10" href="/">
            Ana sayfa
          </Link>
        </nav>
      </header>

      <section className="border-b border-slate-200 bg-white px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Hesap vitrini</p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Kullanıcı paneli altyapısı hazır.</h1>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600 dark:text-slate-300">
            Gerçek auth entegrasyonu sonraki aşamada bağlanacak. Bu ekran analiz geçmişi, favoriler ve bildirim tercihleri için hazır vitrin sunar.
          </p>
        </div>
      </section>

      <section className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="lg:col-span-2">
            <UserSessionBanner />
          </div>
          <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
            <h2 className="text-xl font-bold">Analiz geçmişi</h2>
            <div className="mt-4 grid gap-3">
              {history.map((item) => (
                <div className="rounded-md border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5" key={`${item.type}-${item.target}`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-semibold">{item.type}</p>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{item.date}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{item.target}</p>
                  <p className="mt-2 text-sm font-semibold">Sonuç: {item.result}</p>
                </div>
              ))}
            </div>
          </article>

          <div className="grid gap-5">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-xl font-bold">Favori analizler</h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {favorites.map((favorite) => (
                  <span className="rounded-md border border-cyan-200 bg-cyan-50 px-3 py-2 text-sm font-semibold text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-400/10 dark:text-cyan-100" key={favorite}>
                    {favorite}
                  </span>
                ))}
              </div>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5">
              <h2 className="text-xl font-bold">Bildirim tercihleri</h2>
              <div className="mt-4 grid gap-3 text-sm">
                {["Riskli link uyarıları", "Siber gündem özeti", "Yeni araç duyuruları"].map((item) => (
                  <label className="flex items-center justify-between rounded-md border border-slate-200 bg-slate-50 px-3 py-3 dark:border-white/10 dark:bg-white/5" key={item}>
                    <span>{item}</span>
                    <span className="rounded-md bg-slate-900 px-2 py-1 text-xs font-bold text-white dark:bg-white dark:text-slate-950">Yakında</span>
                  </label>
                ))}
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}
