"use client";

import { useEffect, useState } from "react";
import { awarenessBannersChangedEventName } from "@/lib/awarenessBanners";
import type { ManagedBanner, ManagedPageKey } from "@/types/pageManagement";

type AwarenessPoster = {
  id: string;
  title: string;
  category: string;
  warning: string;
  advice: string;
  accent: "amber" | "cyan" | "red";
  imageAlt: string;
  imageUrl?: string;
};

type AwarenessBannersResponse = {
  count?: number;
  error?: string;
  items?: ManagedBanner[];
  ok: boolean;
  source?: string;
};

const fallbackPosters: AwarenessPoster[] = [
  {
    id: "phishing-warning",
    title: "Oltalama Uyarısı",
    category: "Oltalama",
    warning: "Banka, kargo veya resmi kurum taklidi yapan bağlantılarda acele karar vermeyin.",
    advice: "Linke tıklamadan önce alan adını ve yönlendirme adresini kontrol edin.",
    accent: "cyan",
    imageAlt: "Oltalama uyarısı farkındalık afişi",
    imageUrl: "/awareness/phishing-awareness.png"
  },
  {
    id: "illegal-betting-awareness",
    title: "Yasa Dışı Sanal Bahislere Karşı Farkındalık",
    category: "Yasa Dışı Bahis",
    warning: "Yüksek kazanç vaadi ve hızlı para baskısı şüpheli davranış sinyali olabilir.",
    advice: "Kimlik, kart ve banka bilgilerinizi bilinmeyen platformlarda paylaşmayın.",
    accent: "red",
    imageAlt: "Yasa dışı sanal bahis farkındalık afişi",
    imageUrl: "/awareness/afistema.png"
  },
  {
    id: "agri-tools-fraud-awareness",
    title: "Tarım Aletleri Dolandırıcılığı",
    category: "Alışveriş Güvenliği",
    warning: "Piyasanın çok altında fiyat, kapora baskısı ve doğrulanamayan satıcı bilgileri dolandırıcılık sinyali olabilir.",
    advice: "Ödeme yapmadan önce satıcı bilgilerini, ilan geçmişini ve resmi ödeme kanallarını doğrulayın.",
    accent: "amber",
    imageAlt: "Tarım aletleri dolandırıcılığı farkındalık afişi",
    imageUrl: "/awareness/genelarkaplantema.png"
  }
];

const accentStyles = {
  amber: {
    border: "border-amber-300/40",
    glow: "bg-amber-300/30",
    marker: "bg-amber-300 text-amber-950",
    text: "text-amber-100"
  },
  cyan: {
    border: "border-cyan-300/40",
    glow: "bg-cyan-300/30",
    marker: "bg-cyan-300 text-cyan-950",
    text: "text-cyan-100"
  },
  red: {
    border: "border-red-300/35",
    glow: "bg-red-300/25",
    marker: "bg-red-300 text-red-950",
    text: "text-red-100"
  }
} satisfies Record<AwarenessPoster["accent"], { border: string; glow: string; marker: string; text: string }>;

export function AwarenessSlider({
  backgroundImage,
  description = "Güncel dolandırıcılık yöntemlerine karşı hazırlanan kısa ve anlaşılır bilgilendirme afişleri.",
  scope = "home",
  title = "Siber Farkındalık Afişleri"
}: {
  backgroundImage?: string;
  description?: string;
  scope?: ManagedPageKey | "all";
  title?: string;
}) {
  const [managedBanners, setManagedBanners] = useState<ManagedBanner[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const posters = managedBanners ? getPostersFromBanners(managedBanners, scope) : fallbackPosters;
  const activePoster = posters[activeIndex] ?? fallbackPosters[0];
  const activeCategory = activePoster.category || "Bilinçlendirme";
  const activeTitle = activePoster.title || title;
  const activeDescription = activePoster.warning || description;

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? posters.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current === posters.length - 1 ? 0 : current + 1));
  }

  useEffect(() => {
    if (activeIndex >= posters.length) setActiveIndex(0);
  }, [activeIndex, posters.length]);

  useEffect(() => {
    let cancelled = false;

    async function refreshManagedBanners() {
      try {
        const response = await fetch(`/api/awareness/banners?page_key=${encodeURIComponent(scope)}`, {
          cache: "no-store"
        });
        const data = (await response.json()) as AwarenessBannersResponse;

        if (!cancelled && response.ok && data.ok && Array.isArray(data.items) && data.items.length > 0) {
          setManagedBanners(data.items);
        }
      } catch {
        if (!cancelled) setManagedBanners(null);
      }
    }

    refreshManagedBanners();
    window.addEventListener(awarenessBannersChangedEventName, refreshManagedBanners);

    return () => {
      cancelled = true;
      window.removeEventListener(awarenessBannersChangedEventName, refreshManagedBanners);
    };
  }, [scope]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setLightboxOpen(false);
      if (event.key === "ArrowLeft") showPrevious();
      if (event.key === "ArrowRight") showNext();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, posters.length]);

  return (
    <section
      aria-label={title}
      className={`relative overflow-hidden border-b border-cyan-300/10 bg-slate-950 px-4 py-8 text-white sm:px-6 sm:py-10 lg:px-8 ${backgroundImage ? "bg-no-repeat bg-[length:auto_100%] bg-[position:58%_center] sm:bg-cover sm:bg-center" : ""}`}
      style={
        backgroundImage
          ? {
              backgroundImage: `url(${backgroundImage})`
            }
          : undefined
      }
    >
      {backgroundImage ? (
        <>
          <div aria-hidden="true" className="absolute inset-0 bg-slate-950/38 sm:bg-slate-950/70 lg:bg-slate-950/72" />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-slate-950/78 via-slate-950/42 to-slate-950/80 sm:bg-gradient-to-r sm:from-slate-950 sm:via-slate-950/82 sm:to-slate-950/58" />
        </>
      ) : null}
      <div className="relative z-10 mx-auto w-full max-w-[1560px] px-4 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(360px,560px)_minmax(0,0.85fr)] lg:items-center">
          <div className="max-w-xl lg:max-w-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-200">{activeCategory}</p>
            <h2 className="mt-3 text-3xl font-bold tracking-normal sm:text-4xl">{activeTitle}</h2>
            <p className="mt-4 text-sm leading-6 text-slate-300">{activeDescription}</p>
          </div>

          <div className="relative mx-auto w-full max-w-[520px]">
            <PosterFrame poster={activePoster} onOpen={() => setLightboxOpen(true)} />
            <SliderButton ariaLabel="Önceki afiş" className="-left-3 sm:-left-5" onClick={showPrevious} direction="left" />
            <SliderButton ariaLabel="Sonraki afiş" className="-right-3 sm:-right-5" onClick={showNext} direction="right" />
          </div>

          <div className="grid gap-3 lg:justify-self-end">
            {posters.map((poster, index) => (
              <button
                className={`rounded-lg border px-4 py-3 text-left transition ${
                  activeIndex === index
                    ? "border-cyan-300/45 bg-cyan-300/10"
                    : "border-white/10 bg-white/5 hover:border-cyan-300/30 hover:bg-white/10"
                }`}
                key={poster.id}
                onClick={() => setActiveIndex(index)}
                type="button"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">{poster.category}</p>
                <p className="mt-1 font-bold text-white">{poster.title}</p>
                {poster.warning ? <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400">{poster.warning}</p> : null}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2">
          {posters.map((poster, index) => (
            <button
              aria-label={`${poster.title} afişini göster`}
              className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-8 bg-cyan-300" : "w-2.5 bg-slate-700 hover:bg-slate-500"}`}
              key={poster.id}
              onClick={() => setActiveIndex(index)}
              type="button"
            />
          ))}
        </div>
      </div>

      {lightboxOpen ? (
        <div aria-modal="true" className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/94 backdrop-blur-sm" role="dialog">
          <button
            aria-label="Afişi kapat"
            className="absolute right-4 top-4 z-10 rounded-md border border-white/15 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/20"
            onClick={() => setLightboxOpen(false)}
            type="button"
          >
            Kapat
          </button>
          <button
            aria-label="Önceki afiş"
            className="absolute left-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-3 text-2xl font-bold text-white transition hover:bg-white/20 sm:block"
            onClick={showPrevious}
            type="button"
          >
            ‹
          </button>
          <div className="grid h-screen w-screen place-items-center px-2 py-4">
            <PosterFrame poster={activePoster} modal onOpen={() => {}} />
          </div>
          <button
            aria-label="Sonraki afiş"
            className="absolute right-3 top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/15 bg-white/10 p-3 text-2xl font-bold text-white transition hover:bg-white/20 sm:block"
            onClick={showNext}
            type="button"
          >
            ›
          </button>
        </div>
      ) : null}
    </section>
  );
}

function PosterFrame({ modal = false, onOpen, poster }: { modal?: boolean; onOpen: () => void; poster: AwarenessPoster }) {
  const styles = accentStyles[poster.accent];
  const [imageFailed, setImageFailed] = useState(false);
  const shouldShowImage = Boolean(poster.imageUrl && !imageFailed);

  useEffect(() => {
    setImageFailed(false);
  }, [poster.id, poster.imageUrl]);

  return (
    <article className={`${modal ? "relative grid h-screen w-screen place-items-center" : "relative mx-auto w-full max-w-[520px]"}`}>
      <button
        aria-label={`${poster.title} afişini tam ekran incele`}
        className={`group relative overflow-hidden border ${styles.border} bg-slate-900 shadow-2xl shadow-cyan-950/30 ${modal ? "block max-h-[96vh] max-w-[98vw] rounded-md" : "block aspect-[2/3] w-full rounded-lg"}`}
        onClick={modal ? undefined : onOpen}
        type="button"
      >
        {shouldShowImage ? (
          <img
            alt={poster.imageAlt}
            className={modal ? "block h-auto max-h-[96vh] w-auto max-w-[98vw] bg-slate-950 object-contain" : "block h-full w-full bg-slate-950 object-contain"}
            loading="lazy"
            onError={() => setImageFailed(true)}
            src={poster.imageUrl}
          />
        ) : (
          <PosterPlaceholder modal={modal} poster={poster} />
        )}
        {!modal ? (
          <span className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-md bg-white px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg transition group-hover:bg-cyan-100">
            Tam ekran incele
          </span>
        ) : null}
      </button>
    </article>
  );
}

function PosterPlaceholder({ modal, poster }: { modal: boolean; poster: AwarenessPoster }) {
  const styles = accentStyles[poster.accent];

  return (
    <div className={`relative flex flex-col justify-between overflow-hidden bg-[radial-gradient(circle_at_50%_10%,rgba(34,211,238,0.18),transparent_34%),linear-gradient(180deg,#020617,#0f172a_48%,#020617)] p-6 text-white sm:p-8 ${modal ? "aspect-[2/3] max-h-[96vh] max-w-[98vw]" : "h-full w-full"}`}>
      <div className={`absolute -right-20 -top-20 h-56 w-56 rounded-full ${styles.glow} blur-3xl`} />
      <div className={`absolute -bottom-24 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full ${styles.glow} blur-3xl`} />

      <div className="relative z-10 flex items-center justify-between gap-3">
        <span className={`rounded-md px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] ${styles.marker}`}>
          {poster.category}
        </span>
        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Dijital İz Avcısı</span>
      </div>

      <div className="relative z-10 grid place-items-center py-8">
        <div className={`${modal ? "h-48 w-48 sm:h-60 sm:w-60" : "h-36 w-36 sm:h-44 sm:w-44"} rounded-full border border-cyan-200/50 p-5`}>
          <div className="grid h-full w-full place-items-center rounded-full border border-white/20 bg-white/5">
            <div className={`h-16 w-16 rounded-full ${styles.marker} opacity-95`} />
          </div>
        </div>
      </div>

      <div className="relative z-10">
        <p className={`text-sm font-semibold uppercase tracking-[0.16em] ${styles.text}`}>Risk sinyali</p>
        <h3 className={`${modal ? "text-4xl sm:text-6xl" : "text-3xl sm:text-4xl"} mt-3 font-bold tracking-normal`}>
          {poster.title}
        </h3>
        <p className={`${modal ? "text-lg sm:text-xl" : "text-base sm:text-lg"} mt-5 leading-7 text-slate-200`}>
          {poster.warning || "Bu afiş için açıklama admin panelinden yönetilir."}
        </p>
        <div className="mt-6 rounded-lg border border-white/10 bg-white/10 p-4 text-left text-sm leading-6 text-slate-100">
          <span className="font-bold">Öneri: </span>
          {poster.advice}
        </div>
      </div>
    </div>
  );
}

function SliderButton({
  ariaLabel,
  className,
  direction,
  onClick
}: {
  ariaLabel: string;
  className: string;
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={`absolute top-1/2 z-10 hidden -translate-y-1/2 rounded-full border border-white/15 bg-slate-950/80 px-3 py-2 text-2xl font-bold text-white shadow-lg transition hover:border-cyan-300/40 hover:bg-cyan-300/15 sm:block ${className}`}
      onClick={onClick}
      type="button"
    >
      {direction === "left" ? "‹" : "›"}
    </button>
  );
}

function getPostersFromBanners(banners: ManagedBanner[], scope: ManagedPageKey | "all") {
  const managedPosters = banners
    .filter((banner) => banner.status === "active")
    .filter((banner) => scope === "all" || banner.pageKey === scope)
    .sort((first, second) => first.order - second.order)
    .map(mapBannerToPoster);

  return managedPosters.length ? managedPosters : fallbackPosters;
}

function mapBannerToPoster(banner: ManagedBanner): AwarenessPoster {
  return {
    id: banner.id,
    title: banner.title,
    category: banner.category || "Farkındalık",
    warning: banner.description,
    advice: "Afişi büyüterek detayları inceleyin ve şüpheli durumlarda resmi kaynaklardan doğrulama yapın.",
    accent: inferBannerAccent(`${banner.title} ${banner.category} ${banner.description}`),
    imageAlt: banner.altText || `${banner.title} afişi`,
    imageUrl: banner.imageUrl || undefined
  };
}

function inferBannerAccent(value: string): AwarenessPoster["accent"] {
  const normalized = value.toLocaleLowerCase("tr-TR");
  if (normalized.includes("bahis") || normalized.includes("risk") || normalized.includes("dolandır")) return "red";
  if (normalized.includes("sms") || normalized.includes("kargo") || normalized.includes("uyarı")) return "amber";
  return "cyan";
}
