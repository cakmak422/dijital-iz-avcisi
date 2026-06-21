"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CyberNewsCard } from "@/components/CyberNewsCard";
import { getLatestCyberNews, type CyberNewsItem } from "@/lib/newsStore";

export function CyberNewsCenter() {
  const [posts, setPosts] = useState<CyberNewsItem[]>(() => getLatestCyberNews(6));
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadNews() {
      try {
        const response = await fetch("/api/news/latest?limit=6");
        if (!response.ok) return;
        const data = (await response.json()) as { items?: CyberNewsItem[] };
        if (!cancelled && Array.isArray(data.items) && data.items.length) {
          setPosts(data.items);
        }
      } catch {
        // Fallback haberler ekranda kalır; production stabilitesi için sessiz geçilir.
      }
    }

    loadNews();
    return () => {
      cancelled = true;
    };
  }, []);

  function scrollCarousel(direction: "prev" | "next") {
    const target = scrollerRef.current;
    if (!target) return;
    const amount = direction === "next" ? target.clientWidth * 0.9 : -target.clientWidth * 0.9;
    target.scrollBy({ left: amount, behavior: "smooth" });
  }

  return (
    <section className="cyber-section cyber-pattern-dots border-b border-cyan-300/12 py-10">
      <div className="mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">Siber Gündem Merkezi</p>
            <h2 className="mt-2 text-3xl font-extrabold text-white">Güncel Siber Haberler</h2>
            <p className="mt-3 max-w-2xl leading-7 text-slate-300">
              Kaynak başlığı ve bağlantısı korunur; haber metni birebir kopyalanmadan vatandaş için kısa risk notuna dönüştürülür.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="hidden gap-2 md:flex">
              <button
                aria-label="Önceki haberler"
                className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-lg font-bold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15"
                onClick={() => scrollCarousel("prev")}
                type="button"
              >
                ‹
              </button>
              <button
                aria-label="Sonraki haberler"
                className="focus-ring grid h-11 w-11 place-items-center rounded-md border border-cyan-300/20 bg-cyan-300/10 text-lg font-bold text-cyan-100 transition hover:border-cyan-200 hover:bg-cyan-300/15"
                onClick={() => scrollCarousel("next")}
                type="button"
              >
                ›
              </button>
            </div>
            <Link className="btn-secondary min-h-11 px-4 text-center" href="/haberler">
              Tüm Haberler
            </Link>
          </div>
        </div>

        <div
          className="mt-6 flex snap-x gap-4 overflow-x-auto scroll-smooth pb-3 [scrollbar-color:rgba(34,211,238,0.5)_rgba(15,23,42,0.4)]"
          ref={scrollerRef}
        >
          {posts.map((post) => (
            <div className="min-w-[86%] snap-start sm:min-w-[48%] xl:min-w-[32%]" key={post.id}>
              <CyberNewsCard compact item={post} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
