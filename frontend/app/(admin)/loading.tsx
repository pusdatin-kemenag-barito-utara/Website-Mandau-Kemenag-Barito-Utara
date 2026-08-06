export default function AdminLoading() {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header Skeleton */}
      <div className="h-16 w-full rounded-2xl bg-slate-200/70 dark:bg-white/5" />

      {/* Toolbar Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="h-10 w-full sm:w-80 rounded-2xl bg-slate-200/70 dark:bg-white/5" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-24 rounded-2xl bg-slate-200/70 dark:bg-white/5" />
          <div className="h-10 w-24 rounded-2xl bg-slate-200/70 dark:bg-white/5" />
          <div className="h-10 w-32 rounded-2xl bg-emerald-200/50 dark:bg-emerald-500/10" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#1a1d24] p-4 space-y-3 shadow-2xs">
        <div className="h-9 w-full rounded-xl bg-slate-100 dark:bg-white/5" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-slate-100 dark:border-white/5">
            <div className="h-5 w-8 rounded bg-slate-100 dark:bg-white/5" />
            <div className="h-6 w-36 rounded-lg bg-slate-100 dark:bg-white/5" />
            <div className="h-5 w-24 rounded bg-slate-100 dark:bg-white/5" />
            <div className="h-5 w-32 rounded bg-slate-100 dark:bg-white/5" />
            <div className="h-6 w-20 rounded-lg bg-emerald-100/60 dark:bg-emerald-500/10" />
            <div className="h-7 w-20 rounded-xl bg-slate-100 dark:bg-white/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
