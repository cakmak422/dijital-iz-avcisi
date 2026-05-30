import Image from "next/image";
import Link from "next/link";

export function BrandLogo({ subtitle }: { subtitle?: string }) {
  return (
    <Link className="flex min-w-0 items-center gap-3" href="/" aria-label="Dijital Iz Avcisi">
      <span className="relative h-10 w-28 shrink-0 overflow-hidden rounded-md border border-slate-200 bg-slate-900 shadow-sm dark:border-white/10 sm:h-11 sm:w-36">
        <Image
          alt="Dijital Iz Avcisi logosu"
          className="h-full w-full object-cover object-left"
          height={44}
          src="/logo.png"
          priority
          sizes="144px"
          width={144}
        />
      </span>
      <span className="hidden min-w-0 sm:block">
        <span className="block text-sm font-bold leading-4">Dijital Iz Avcisi</span>
        {subtitle ? <span className="block text-xs text-slate-500 dark:text-slate-400">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
