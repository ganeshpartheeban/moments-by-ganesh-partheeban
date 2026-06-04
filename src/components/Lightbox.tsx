import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GALLERY, formatExif, type Photo } from "@/lib/gallery";
import { PHOTO_META } from "@/lib/photo-meta";

const thumbUrl = (i: number) => `/gallery-thumbs/g${i + 1}-1000.jpg`;
const fullBase = (i: number) => `/gallery-full/g${i + 1}`;

export default function Lightbox({
  index,
  onClose,
  onChange,
  photoIndices,
}: {
  /** Gallery index of the open photo (0-based into GALLERY). */
  index: number | null;
  onClose: () => void;
  onChange: (i: number) => void;
  /**
   * Subset of gallery indices to cycle through. When provided, prev/next stay
   * within this list. When omitted, the viewer cycles through the entire
   * GALLERY (legacy behavior).
   */
  photoIndices?: number[];
}) {
  const open = index !== null;
  const touchStartX = useRef<number | null>(null);
  const [fullLoaded, setFullLoaded] = useState(false);

  // Reset load state whenever the index changes — new image needs to load.
  useEffect(() => {
    setFullLoaded(false);
  }, [index]);

  const scope = useMemo(
    () => photoIndices ?? GALLERY.map((_, i) => i),
    [photoIndices],
  );

  const position = index === null ? -1 : scope.indexOf(index);

  const go = useCallback(
    (delta: number) => {
      if (position < 0) return;
      const next = scope[(position + delta + scope.length) % scope.length];
      onChange(next);
    },
    [position, scope, onChange],
  );

  useEffect(() => {
    if (position < 0) return;
    const ids = [
      scope[(position - 1 + scope.length) % scope.length],
      scope[(position + 1) % scope.length],
    ];
    ids.forEach((i) => {
      const img = new window.Image();
      img.src = `${fullBase(i)}.jpg`;
    });
  }, [position, scope]);

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
  const meta = PHOTO_META[index + 1];
  const metaLine = meta
    ? [
        meta.featuring && `featuring ${meta.featuring}`,
        [meta.venue, meta.location].filter(Boolean).join(", "),
        meta.date,
      ]
        .filter(Boolean)
        .join(" · ")
    : "";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photograph ${Math.max(position, 0) + 1} of ${scope.length}`}
      className="fixed inset-0 z-50 flex flex-col bg-black/95 text-white backdrop-blur-sm"
      onClick={onClose}
      style={{
        willChange: "opacity",
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
        paddingLeft: "env(safe-area-inset-left, 0px)",
        paddingRight: "env(safe-area-inset-right, 0px)",
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-4 md:px-8">
        <span className="font-mono-label text-xs text-white/60">
          {Math.max(position, 0) + 1} / {scope.length}
        </span>
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
        {scope.length > 1 && (
          <button
            type="button"
            onClick={() => go(-1)}
            aria-label="Previous photograph"
            className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-lg text-white/90 transition-colors hover:border-white hover:text-white sm:left-3 sm:h-12 sm:w-12 md:left-6"
          >
            <span aria-hidden>←</span>
          </button>
        )}

        <picture key={index} style={{ display: "contents" }}>
          <source type="image/avif" srcSet={`${fullBase(index)}.avif`} />
          <source type="image/webp" srcSet={`${fullBase(index)}.webp`} />
          <img
            src={`${fullBase(index)}.jpg`}
            alt={p.alt}
            draggable={false}
            decoding="async"
            onLoad={() => setFullLoaded(true)}
            style={{
              backgroundImage: `url(${thumbUrl(index)})`,
              backgroundSize: "contain",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              willChange: "transform, filter",
              filter: fullLoaded ? "none" : "blur(14px)",
              transform: fullLoaded ? "scale(1)" : "scale(1.02)",
              transition: "filter 350ms ease-out, transform 350ms ease-out",
            }}
            className="block h-auto max-h-full w-auto max-w-full select-none object-contain"
          />
        </picture>

        {scope.length > 1 && (
          <button
            type="button"
            onClick={() => go(1)}
            aria-label="Next photograph"
            className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-black/50 text-lg text-white/90 transition-colors hover:border-white hover:text-white sm:right-3 sm:h-12 sm:w-12 md:right-6"
          >
            <span aria-hidden>→</span>
          </button>
        )}
      </div>

      <div
        className="flex flex-col gap-1 px-4 pb-6 font-mono-label text-xs text-white/70 md:px-8"
        onClick={(e) => e.stopPropagation()}
      >
        {meta && (
          <p className="font-display text-sm text-white sm:text-base">
            {meta.title}
            {meta.detail && (
              <span className="text-white/70"> — {meta.detail}</span>
            )}
          </p>
        )}
        {metaLine && <span className="text-white/70">{metaLine}</span>}
        {(exif || p.camera) && (
          <span className="text-white/50">
            {exif}
            {exif && p.camera ? " · " : ""}
            {p.camera}
          </span>
        )}
      </div>
    </div>
  );
}
