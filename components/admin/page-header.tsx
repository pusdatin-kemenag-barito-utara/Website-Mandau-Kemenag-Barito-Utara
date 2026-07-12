import type { ReactNode } from "react";
import { ExternalLink } from "lucide-react";

export function PageHeader({
  title,
  description,
  icon: Icon,
  actions,
  externalLink,
}: {
  title: string;
  description?: string;
  icon?: React.ElementType;
  actions?: ReactNode;
  externalLink?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#064e3b] to-[#059669] dark:from-[#064e3b]/80 dark:to-[#059669]/60 dark:border dark:border-emerald-800/40 px-4 sm:px-5 py-4 shadow-md shadow-emerald-900/20 relative group">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 border border-white/20 text-white shadow-md shadow-emerald-500/20">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-white tracking-tight leading-tight truncate">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-[10px] sm:text-sm text-emerald-100/80 leading-relaxed truncate">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {actions && <div className="flex items-center gap-2">{actions}</div>}

        {externalLink && (
          <a
            href={externalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-white/70 hover:text-white transition-all shadow-lg hover:shadow-emerald-500/20"
            title="Buka File Spreadsheet"
          >
            <ExternalLink className="h-5 w-5" />
          </a>
        )}
      </div>
    </div>
  );
}
