"use client";

import { useEffect, useRef, useState } from "react";
import type {
  PDFDocumentProxy,
  PDFDocumentLoadingTask,
} from "pdfjs-dist";
import {
  X,
  Maximize2,
  Minimize2,
  Download,
  ZoomIn,
  ZoomOut,
  Loader2,
} from "lucide-react";

interface PdfViewerModalProps {
  url: string | null;
  title?: string;
  onClose: () => void;
}

export function PdfViewerModal({ url, title, onClose }: PdfViewerModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isMaximized, setIsMaximized] = useState(false);
  const loadingTaskRef = useRef<PDFDocumentLoadingTask | null>(null);
  const pdfDocRef = useRef<PDFDocumentProxy | null>(null);
  const pdfBytesRef = useRef<ArrayBuffer | null>(null); // cached bytes for download

  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.4);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [docLoadedVersion, setDocLoadedVersion] = useState(0);
  const [hasPdfBytes, setHasPdfBytes] = useState(false);

  // ─── Load PDF document when URL changes ──────────────────────────────────
  useEffect(() => {
    if (!url) return;

    let cancelled = false;

    // Resolve full proxy URL if relative path / key was passed
    const getFullUrl = (src: string) => {
      if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("blob:")) {
        return src;
      }
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
      const cleanKey = src.startsWith("/") ? src.slice(1) : src;
      return `${apiBase}/lampiran/${cleanKey}`;
    };

    const fetchUrl = getFullUrl(url);

    (async () => {
      setIsLoading(true);
      setError(null);
      setRenderProgress(0);

      try {
        // Fetch PDF bytes (credentials:omit avoids 431, cache:no-store bypasses stale cache)
        const res = await fetch(fetchUrl, {
          credentials: "omit",
          cache: "no-store",
        });
        if (cancelled) return;
        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;

        if (arrayBuffer.byteLength === 0) {
          throw new Error("Server returned 0 bytes.");
        }

        // Store a COPY for download before handing arrayBuffer to PDF.js worker.
        // PDF.js transfers the ArrayBuffer via postMessage → original becomes 0 bytes (detached).
        pdfBytesRef.current = arrayBuffer.slice(0);
        setHasPdfBytes(true);

        const pdfjsLib = await import("pdfjs-dist");
        if (cancelled) return;

        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        if (loadingTaskRef.current) {
          await loadingTaskRef.current.destroy();
          loadingTaskRef.current = null;
          pdfDocRef.current = null;
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        loadingTaskRef.current = loadingTask;

        const doc = await loadingTask.promise;
        if (cancelled) {
          await loadingTask.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setIsLoading(false);
        setDocLoadedVersion((v) => v + 1);
      } catch (err) {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : String(err);
        console.error("[PdfViewer] load error:", msg);
        setError(`Gagal memuat PDF: ${msg}`);
        setIsLoading(false);
        pdfBytesRef.current = null;
        setHasPdfBytes(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [url]);

  // ─── Render ALL pages into the scroll container ───────────────────────────
  useEffect(() => {
    const doc = pdfDocRef.current;
    const container = scrollRef.current;
    if (!doc || !container || numPages === 0) return;

    let cancelled = false;

    // Clear previous pages
    container.innerHTML = "";
    setRenderProgress(0);
    setCurrentPage(1);

    (async () => {
      for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
        if (cancelled) break;

        try {
          const page = await doc.getPage(pageNum);
          if (cancelled) break;

          const viewport = page.getViewport({ scale });

          // Wrapper div for each page
          const wrapper = document.createElement("div");
          wrapper.style.cssText = `
            margin: 0 auto 16px auto;
            display: flex;
            justify-content: center;
            position: relative;
          `;
          wrapper.setAttribute("data-page", String(pageNum));

          const canvas = document.createElement("canvas");
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.cssText = `
            display: block;
            max-width: 100%;
            box-shadow: 0 2px 12px rgba(0,0,0,0.25);
            border-radius: 4px;
          `;

          wrapper.appendChild(canvas);
          container.appendChild(wrapper);

          const ctx = canvas.getContext("2d");
          if (!ctx) continue;

          const task = page.render({ canvasContext: ctx, viewport, canvas });
          await task.promise;

          if (!cancelled) setRenderProgress(pageNum);
        } catch (err: unknown) {
          const name = (err as { name?: string })?.name;
          if (name === "RenderingCancelledException") break;
          console.error(`[PdfViewer] render error page ${pageNum}:`, err);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docLoadedVersion, scale]);

  // ─── IntersectionObserver — track current page while scrolling ───────────
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || numPages === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const page = Number(
              (entry.target as HTMLElement).getAttribute("data-page")
            );
            if (page) setCurrentPage(page);
          }
        });
      },
      { root: container, threshold: 0.3 }
    );

    const wrappers = container.querySelectorAll("[data-page]");
    wrappers.forEach((w) => observer.observe(w));

    return () => observer.disconnect();
  }, [renderProgress, numPages]);

  // ─── Escape key ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!url) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [url, onClose]);

  // ─── Body scroll lock ────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = url ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [url]);

  if (!url) return null;

  const fileName = url.split("/").pop()?.split("?")[0] || "Lampiran.pdf";
  const displayTitle = title || fileName;

  const zoomIn = () => setScale((s) => Math.min(4, +(s + 0.25).toFixed(2)));
  const zoomOut = () => setScale((s) => Math.max(0.5, +(s - 0.25).toFixed(2)));

  // Download directly from cached bytes — no new network request, no new tab
  const handleDownload = () => {
    const bytes = pdfBytesRef.current;
    if (!bytes) return;
    const blob = new Blob([bytes], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    }, 100);
  };

  const isRendering = renderProgress < numPages && numPages > 0 && !isLoading;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-8"
      style={{
        backgroundColor: "rgba(0,0,0,0.72)",
        backdropFilter: "blur(6px)",
        animation: "pdfFadeIn 0.18s ease-out",
      }}
    >
      <div
        className={`relative flex flex-col rounded-2xl shadow-2xl overflow-hidden bg-white dark:bg-[#1a1d24] transition-all duration-300 ${
          isMaximized ? "w-full h-full rounded-none" : "w-full max-w-5xl h-[90vh]"
        }`}
        style={{ animation: "pdfScaleIn 0.2s cubic-bezier(0.34,1.56,0.64,1)" }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] shrink-0 gap-3">
          {/* Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center shrink-0">
              <svg
                className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M14 2H6C4.9 2 4 2.9 4 4v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800 dark:text-white truncate leading-snug">
                {displayTitle}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                {numPages > 0
                  ? `Hal. ${currentPage} / ${numPages} · Zoom ${Math.round(scale * 100)}%${isRendering ? ` · Merender ${renderProgress}/${numPages}...` : ""}`
                  : isLoading
                    ? "Memuat dokumen..."
                    : "Dokumen Lampiran PDF"}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Zoom */}
            <button
              onClick={zoomOut}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              title="Perkecil (−)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs text-slate-400 w-9 text-center tabular-nums hidden sm:inline-block">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all"
              title="Perbesar (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-0.5 sm:mx-1" />

            {/* Download */}
            <button
              onClick={handleDownload}
              disabled={!hasPdfBytes}
              className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              title="Unduh PDF"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* Open in new tab */}
            <a
              href={
                url.startsWith("http://") || url.startsWith("https://") || url.startsWith("blob:")
                  ? url
                  : `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1"}/lampiran/${url.startsWith("/") ? url.slice(1) : url}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all hidden sm:inline-flex"
              title="Buka di Tab Baru"
            >
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            {/* Maximize */}
            <button
              onClick={() => setIsMaximized((v) => !v)}
              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-all hidden sm:inline-flex"
              title={isMaximized ? "Kembalikan" : "Layar Penuh"}
            >
              {isMaximized ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-rose-500 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all ml-1"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Scrollable page area ─────────────────────────────────────── */}
        <div className="relative flex-1 overflow-hidden">
          {/* Loading overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10 bg-slate-100 dark:bg-[#13151a]">
              <Loader2 className="w-9 h-9 text-emerald-500 animate-spin" />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Memuat dokumen PDF...
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-slate-50 dark:bg-[#13151a]">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center">
                <X className="w-7 h-7 text-rose-500" />
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 text-center max-w-xs leading-relaxed px-4">
                {error}
              </p>
            </div>
          )}

          {/* Rendering progress bar */}
          {isRendering && (
            <div className="absolute top-0 left-0 right-0 z-20 h-0.5 bg-slate-200 dark:bg-white/10">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${(renderProgress / numPages) * 100}%` }}
              />
            </div>
          )}

          {/* Scroll container — all pages render here */}
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto overflow-x-auto bg-slate-300 dark:bg-[#0e1014] py-6 px-4"
            style={{ display: error ? "none" : undefined }}
          />
        </div>
      </div>

      <style>{`
        @keyframes pdfFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes pdfScaleIn { from{opacity:0;transform:scale(0.92) translateY(12px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>
    </div>
  );
}
