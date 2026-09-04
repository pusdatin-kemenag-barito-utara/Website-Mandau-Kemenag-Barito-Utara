import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  ExternalLink,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
} from "lucide-react";

export interface PdfViewerModalProps {
  isOpen?: boolean;
  onClose: () => void;
  url: string | null;
  title?: string;
}

/**
 * Returns the public high-speed CDN URL for direct Cloudflare CDN loading.
 */
function getCdnUrl(rawUrl: string): string {
  if (!rawUrl) return "";
  if (rawUrl.startsWith("blob:")) return rawUrl;
  if (rawUrl.startsWith("https://files.kemenag-baritoutara.com/")) {
    return rawUrl;
  }
  const match = rawUrl.match(/(lampiran-[a-zA-Z0-9_\-\/]+\.pdf)/i);
  if (match) {
    return `https://files.kemenag-baritoutara.com/${match[1]}`;
  }
  if (rawUrl.startsWith("/api/v1/lampiran/")) {
    const sub = rawUrl.replace(/^\/api\/v1\/lampiran\//, "");
    return `https://files.kemenag-baritoutara.com/${sub}`;
  }
  if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://")) {
    return rawUrl;
  }
  const clean = rawUrl.replace(/^\/+/, "");
  return `https://files.kemenag-baritoutara.com/${clean}`;
}

/**
 * Resolves the optimal URL for loading the PDF in iframe.
 */
function getIframeUrl(rawUrl: string): string {
  return getCdnUrl(rawUrl);
}

/**
 * Individual Page Item for Continuous Vertical Scrolling in Canvas Mode.
 * Uses IntersectionObserver to lazily render pages as the user scrolls down.
 */
function PdfPageItem({
  pdfDoc,
  pageNumber,
  scale,
  rotation,
  onInView,
}: {
  pdfDoc: any;
  pageNumber: number;
  scale: number;
  rotation: number;
  onInView: (page: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [rendered, setRendered] = useState(false);
  const [isVisible, setIsVisible] = useState(pageNumber <= 2);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 320,
    height: 450,
  });
  const renderTaskRef = useRef<any>(null);

  // Observe when this page comes into view during scroll
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            onInView(pageNumber);
          }
        }
      },
      { rootMargin: "400px 0px" } // Preload 400px before scrolling into viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pageNumber, onInView]);

  // Render page onto canvas
  useEffect(() => {
    if (!pdfDoc || !isVisible) return;
    let active = true;

    (async () => {
      try {
        if (renderTaskRef.current) {
          try {
            renderTaskRef.current.cancel();
          } catch {}
        }

        const page = await pdfDoc.getPage(pageNumber);
        if (!active) return;

        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const containerWidth =
          canvas.parentElement?.parentElement?.clientWidth || window.innerWidth;
        const unscaledViewport = page.getViewport({ scale: 1, rotation });

        // On large screens (MacBook / Desktop), cap base width at 860px for comfortable reading
        const targetWidth = Math.min(containerWidth - 32, 860);
        const fitScale = Math.max(0.4, targetWidth / unscaledViewport.width);
        const effectiveScale = fitScale * scale;

        const viewport = page.getViewport({ scale: effectiveScale, rotation });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        setDimensions({
          width: Math.floor(viewport.width),
          height: Math.floor(viewport.height),
        });

        const transform =
          pixelRatio !== 1 ? [pixelRatio, 0, 0, pixelRatio, 0, 0] : undefined;

        const renderTask = page.render({
          canvasContext: ctx,
          viewport,
          transform,
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (active) setRendered(true);
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`Error rendering page ${pageNumber}:`, err);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [pdfDoc, pageNumber, scale, rotation, isVisible]);

  return (
    <div
      id={`pdf-page-${pageNumber}`}
      ref={containerRef}
      className="relative my-2.5 mx-auto bg-white shadow-xl rounded-lg overflow-hidden flex items-center justify-center transition-all shrink-0"
      style={{ minHeight: dimensions.height, width: dimensions.width }}
    >
      <canvas ref={canvasRef} className="block max-w-full" />
      {!rendered && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 text-zinc-300 text-xs font-semibold">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-emerald-500" />
          <span>Memuat Halaman {pageNumber}...</span>
        </div>
      )}
      <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/60 text-white text-[10px] font-mono pointer-events-none select-none backdrop-blur-xs">
        {pageNumber}
      </div>
    </div>
  );
}

export function PdfViewerModal({
  isOpen: propIsOpen,
  onClose,
  url,
  title = "Pratinjau Dokumen",
}: PdfViewerModalProps) {
  // Support both isOpen prop and url !== null
  const isOpen = propIsOpen !== undefined ? propIsOpen && Boolean(url) : Boolean(url);

  const [viewMode, setViewMode] = useState<"iframe" | "canvas">("iframe");
  const [loading, setLoading] = useState(true);

  // Canvas (PDF.js) continuous scroll states
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [activePage, setActivePage] = useState(1);
  const [numPages, setNumPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [canvasLoading, setCanvasLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // Detect device on open (Apple Mac / mobile defaults to canvas, desktop Windows to iframe)
  useEffect(() => {
    if (!isOpen) return;

    let shouldUseCanvas = false;
    if (typeof window !== "undefined") {
      const ua = navigator.userAgent || "";
      const isAppleMac =
        /Macintosh|Mac OS X|MacBook/i.test(ua) ||
        (navigator.platform && navigator.platform.toUpperCase().indexOf("MAC") >= 0);

      const isMobile =
        window.innerWidth < 768 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

      shouldUseCanvas = isAppleMac || isMobile;
    }

    if (shouldUseCanvas) {
      setViewMode("canvas");
    } else {
      setViewMode("iframe");
    }
    setLoading(true);
    setActivePage(1);
    setScale(1.0);
    setRotation(0);
  }, [isOpen, url]);

  // Load document via PDF.js when viewMode is 'canvas'
  useEffect(() => {
    if (!isOpen || !url || viewMode !== "canvas") return;
    let active = true;
    setCanvasLoading(true);

    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const targetPdfUrl = getCdnUrl(url);
        const loadingTask = pdfjs.getDocument({
          url: targetPdfUrl,
        });

        const loadedDoc = await loadingTask.promise;
        if (!active) return;
        setPdfDoc(loadedDoc);
        setNumPages(loadedDoc.numPages);
        setActivePage(1);
      } catch (err: any) {
        console.warn("Gagal memuat via PDF.js canvas, otomatis beralih ke native iframe:", err);
        if (active) {
          setViewMode("iframe");
        }
      } finally {
        if (active) setCanvasLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [isOpen, url, viewMode]);

  const handlePageInView = useCallback((page: number) => {
    setActivePage(page);
  }, []);

  const scrollToPage = (page: number) => {
    const target = Math.max(1, Math.min(numPages, page));
    const el = document.getElementById(`pdf-page-${target}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !url) return null;

  const iframeUrl = getIframeUrl(url);
  const cdnUrl = getCdnUrl(url);
  const fileName = url.split("/").pop()?.split("?")[0] ?? "dokumen.pdf";

  return (
    <div
      className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 md:p-8 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Modal Container: 90% width floating dialog */}
      <div className="bg-white dark:bg-[#1a1d24] border border-slate-200/90 dark:border-white/10 rounded-2xl md:rounded-3xl w-[90vw] max-w-[1200px] h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-white/[0.03] select-none shrink-0 gap-2">
          <h2 className="text-xs md:text-base font-bold text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-[200px] sm:max-w-md md:max-w-xl">
            {title || "Pratinjau Dokumen"}
          </h2>

          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Mode Switcher */}
            <button
              type="button"
              onClick={() => setViewMode(viewMode === "iframe" ? "canvas" : "iframe")}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title={
                viewMode === "iframe"
                  ? "Ganti ke mode lembar dokumen (Canvas)"
                  : "Ganti ke mode penampil standar (Native)"
              }
            >
              <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden md:inline">
                {viewMode === "iframe" ? "Mode Lembar" : "Mode Standar"}
              </span>
            </button>

            {/* Buka di Tab Baru */}
            <a
              href={cdnUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-[11px] sm:text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              title="Buka dokumen di tab baru"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="hidden sm:inline">Buka di Tab Baru</span>
            </a>

            {/* Tombol Tutup X Merah */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-colors cursor-pointer shadow-xs"
              title="Tutup (Esc)"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>

        {/* Floating Mobile/Canvas Control Toolbar */}
        {viewMode === "canvas" && (
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-950/90 text-white border-b border-zinc-800 select-none shrink-0 text-xs gap-2">
            {/* Pagination Controls with Smooth Scroll */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => scrollToPage(activePage - 1)}
                disabled={activePage <= 1 || canvasLoading}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-200 transition-colors"
                title="Gulir ke Halaman Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-zinc-300 text-[11px] whitespace-nowrap">
                {canvasLoading ? "Memuat..." : `Hal ${activePage} / ${numPages || 1}`}
              </span>
              <button
                type="button"
                onClick={() => scrollToPage(activePage + 1)}
                disabled={activePage >= numPages || canvasLoading}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-200 transition-colors"
                title="Gulir ke Halaman Selanjutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Zoom & Rotation Controls */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.5, Number((s - 0.2).toFixed(1))))}
                disabled={scale <= 0.5 || canvasLoading}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-200 transition-colors"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono text-zinc-400 min-w-[36px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(2.5, Number((s + 0.2).toFixed(1))))}
                disabled={scale >= 2.5 || canvasLoading}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 disabled:pointer-events-none text-zinc-200 transition-colors"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setRotation((r) => (r + 90) % 360)}
                disabled={canvasLoading}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                title="Putar Dokumen"
              >
                <RotateCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Viewer Body */}
        <div className="flex-1 bg-zinc-900 relative w-full h-full overflow-hidden flex flex-col">
          {viewMode === "iframe" ? (
            <>
              {loading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-900 text-white gap-3">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-semibold text-zinc-300">
                    Menyiapkan pratinjau dokumen PDF...
                  </span>
                </div>
              )}
              <iframe
                src={`${iframeUrl}#toolbar=1&navpanes=1`}
                onLoad={() => setLoading(false)}
                className="w-full h-full border-0 flex-1 bg-zinc-800"
                title={fileName}
              />
            </>
          ) : (
            <div
              ref={scrollContainerRef}
              className="w-full flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 bg-zinc-950 flex flex-col items-center scroll-smooth"
            >
              {canvasLoading ? (
                <div className="flex flex-col items-center justify-center text-white gap-3 py-20">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
                  <span className="text-xs font-semibold text-zinc-300">
                    Memuat lembar dokumen PDF...
                  </span>
                </div>
              ) : numPages > 0 ? (
                <div className="w-full flex flex-col items-center py-2">
                  {Array.from({ length: numPages }, (_, index) => (
                    <PdfPageItem
                      key={`page-${index + 1}`}
                      pdfDoc={pdfDoc}
                      pageNumber={index + 1}
                      scale={scale}
                      rotation={rotation}
                      onInView={handlePageInView}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 md:px-6 py-2.5 bg-slate-50/80 dark:bg-white/[0.03] border-t border-slate-200 dark:border-white/10 flex items-center justify-between shrink-0 select-none">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
            Dokumen resmi SI MANDAU Kemenag Barito Utara
          </p>

          {/* Tombol Tutup Merah */}
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-xs font-bold transition-colors cursor-pointer shadow-xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

export default PdfViewerModal;
