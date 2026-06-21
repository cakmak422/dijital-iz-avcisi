export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
        <p className="text-sm font-semibold text-slate-400">Yükleniyor…</p>
      </div>
    </div>
  );
}
