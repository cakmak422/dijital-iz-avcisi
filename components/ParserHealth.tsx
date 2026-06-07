import { parserHealthItems } from "@/lib/content";

const statusStyles: Record<string, string> = {
  aktif: "bg-emerald-500",
  dikkat: "bg-amber-500",
  "bakımda": "bg-red-500",
  bakimda: "bg-red-500"
};

export function ParserHealth({ compact = false }: { compact?: boolean }) {
  return (
    <section className={compact ? "" : "border-b border-slate-200 bg-slate-50 px-4 py-10 dark:border-white/10 dark:bg-slate-950 sm:px-6 lg:px-8"}>
      <div className={compact ? "" : "mx-auto max-w-7xl"}>
        {!compact ? (
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-700 dark:text-cyan-200">Parser sağlık durumu</p>
            <h2 className="mt-2 text-3xl font-bold">Pazar yeri izleme kartları.</h2>
          </div>
        ) : null}
        <div className={compact ? "grid gap-3" : "mt-6 grid gap-3 md:grid-cols-3"}>
          {parserHealthItems.map((item) => (
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-white/5" key={item.platform}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold">{item.platform}</h3>
                <span className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-300">
                  <span className={`h-2.5 w-2.5 rounded-full ${statusStyles[item.status] ?? "bg-slate-400"}`} />
                  {item.status}
                </span>
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10">
                <div className="h-full rounded-full bg-cyan-500" style={{ width: `${item.successRate}%` }} />
              </div>
              <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">Başarı oranı: %{item.successRate}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Son test: {item.lastTest}</p>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.note}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
