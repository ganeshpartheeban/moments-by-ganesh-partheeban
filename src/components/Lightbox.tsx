import { useCallback, useEffect, useRef } from "react";
import { GALLERY, formatExif, type Photo } from "@/lib/gallery";

const thumbUrl = (i: number) => `/gallery-thumbs/g${i + 1}-1000.jpg`;
const fullBase = (i: number) => `/gallery-full/g${i + 1}`;

export default function Lightbox({
  index,
  onClose,
  onChange,
}: {
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
}) {
  const open = index !== null;
  const touchStartX = useRef<number | null>(null);
  const go = useCallback(
    (delta: number) => {
      if (index === null) return;
      onChange((index + delta + GALLERY.length) % GALLERY.length);
    },
    [index, onChange],
  );

  useEffect(() => {
    if (index === null) return;
    const ids = [
      (index - 1 + GALLERY.length) % GALLERY.length,
      (index + 1) % GALLERY.length,
    ];
    ids.forEach((i) => {
      const img = new window.Image();
      img.src = `${fullBase(i)}.jpg`;
    });
  }, [index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, go, onClose]);

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  };

  if (!open || index === null) return null;
  const p: Photo = GALLERY[index];
  const exif = formatExif(p);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${index + 1} of ${GALLERY.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-sm"
      onClick={onClose}
      style={{ willChange: "opacity" }}
    >
      <div className="flex items-center justify-end px-4 py-4 md:px-8">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close viewer"
          className="rounded-full border border-white/30 px-3 py-1 font-mono-label text-xs text-white/90 hover:border-white hover:text-white"
        >
          Close · Esc
        </button>
      </div>

      <div
        className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-2 pb-4 sm:px-8 md:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <button
          type="button"
          onClick={() => go(-1)}
          aria-label="Previous photograph"
          className="absolute left-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-lg text-white/90 transition-colors hover:border-white hover:text-white sm:left-3 sm:h-12 sm:w-12 md:left-6"
        >
          <span aria-hidden>←</span>
        </button>

        <picture key={index}>
          <source type="image/avif" srcSet={`${fullBase(index)}.avif`} />
          <source type="image/webp" srcSet={`${fullBase(index)}.webp`} />
          <img
            src={`${fullBase(index)}.jpg`}
            alt={p.alt}
            draggable={false}
            decoding="async"
            style={{
              backgroundImage: `url(${thumbUrl(index)})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              willChange: "transform",
            }}
            className="block h-auto max-h-full w-auto max-w-full select-none object-contain"
          />
        </picture>

        <button
          type="button"
          onClick={() => go(1)}
          aria-label="Next photograph"
          className="absolute right-1 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-lg text-white/90 transition-colors hover:border-white hover:text-white sm:right-3 sm:h-12 sm:w-12 md:right-6"
        >
          <span aria-hidden>→</span>
        </button>
      </div>

      <div
        className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-4 pb-6 font-mono-label text-xs text-white/70 md:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        {(exif || p.camera) && (
          <span>
            {exif}
            {exif && p.camera ? " · " : ""}
            {p.camera}
          </span>
        )}
      </div>
    </div>
  );
}
