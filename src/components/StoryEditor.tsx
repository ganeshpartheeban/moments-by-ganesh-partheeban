import { useEffect, useMemo, useState } from "react";
import {
  displaySize,
  fromIstLocal,
  MAX_NOTE_LEN,
  MAX_PLACE_LEN,
  rotatedFillStyle,
  storyThumbUrl,
  storyVideoUrl,
  toIstLocal,
  type AdminItem,
  type StoryPatch,
} from "@/lib/stories-core";

type Form = { place: string; note: string; cam: string; ts: string; shot: string };
const formOf = (x: AdminItem): Form => ({
  place: x.place ?? "",
  note: x.caption ?? "",
  cam: x.cam ?? "",
  ts: toIstLocal(x.ts),
  shot: x.shot ? toIstLocal(x.shot) : "",
});

const field =
  "w-full border border-white/20 bg-white/5 px-2 py-1.5 text-sm text-white placeholder:text-white/30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent [color-scheme:dark]";
const lbl = "font-mono-label text-[10px] text-white/50";
const ghost =
  "rounded-full border border-white/30 px-3 py-1.5 font-mono-label text-xs text-white/90 hover:border-white hover:text-white disabled:opacity-40";

/** The media, filling the available box; rotated videos are laid out swapped and turned. */
function Media({ item }: { item: AdminItem }) {
  const d = displaySize(item);
  const aspect = d.w / d.h;
  const still = storyThumbUrl(item);
  if (item.rot) {
    const style = rotatedFillStyle(item.rot, aspect);
    return (
      <div className="relative overflow-hidden" style={{ aspectRatio: `${d.w} / ${d.h}`, width: `min(100cqw, calc(100cqh * ${aspect.toFixed(5)}))` }}>
        {item.kind === "video" ? (
          // Native controls would turn with the element, so: autoplay muted, tap to pause.
          <video
            key={item.id}
            src={storyVideoUrl(item)}
            poster={still}
            autoPlay
            muted
            playsInline
            loop
            onClick={(e) => {
              const v = e.currentTarget;
              if (v.paused) void v.play();
              else v.pause();
            }}
            className="block cursor-pointer"
            style={style}
          />
        ) : (
          <img key={item.id + (item.v ?? 0)} src={still} alt="" draggable={false} className="block" style={style} />
        )}
      </div>
    );
  }
  return item.kind === "video" ? (
    <video key={item.id} src={storyVideoUrl(item)} poster={still} controls playsInline loop className="block h-auto max-h-full w-auto max-w-full" />
  ) : (
    <img key={item.id + (item.v ?? 0)} src={still} alt="" draggable={false} className="block h-auto max-h-full w-auto max-w-full select-none object-contain" />
  );
}

/**
 * Full-screen editor for one story: the media on the left, and on the right its
 * visibility, rotation, dates, device, place and note. Arrow keys move along the
 * wall, Esc closes. Save writes only the fields that changed.
 */
export default function StoryEditor({
  item,
  position,
  places,
  cams,
  busy,
  onClose,
  onPrev,
  onNext,
  onSave,
  onRotate,
  onToggleHidden,
}: {
  item: AdminItem;
  /** "12 / 233" */
  position: string;
  places: string[];
  cams: string[];
  busy: boolean;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSave: (patch: StoryPatch) => Promise<boolean>;
  onRotate: (dir: "left" | "right") => Promise<void>;
  onToggleHidden: () => Promise<void>;
}) {
  const [form, setForm] = useState<Form>(() => formOf(item));
  const [err, setErr] = useState("");
  // A different story, or a save that came back: reset the fields.
  useEffect(() => {
    setForm(formOf(item));
    setErr("");
  }, [item]);

  const base = useMemo(() => formOf(item), [item]);
  const dirty = (Object.keys(form) as (keyof Form)[]).some((k) => form[k] !== base[k]);

  const save = async () => {
    const patch: StoryPatch = {};
    if (form.place !== base.place) patch.place = form.place;
    if (form.note !== base.note) patch.note = form.note;
    if (form.cam !== base.cam) patch.cam = form.cam;
    if (form.ts !== base.ts) {
      const iso = fromIstLocal(form.ts);
      if (!iso) return setErr("The date is not valid.");
      patch.ts = iso;
    }
    if (form.shot !== base.shot) {
      if (form.shot === "") patch.shot = "";
      else {
        const iso = fromIstLocal(form.shot);
        if (!iso) return setErr("The capture date is not valid.");
        patch.shot = iso;
      }
    }
    setErr("");
    await onSave(patch);
  };
  const leave = (go?: () => void) => {
    if (!go) return;
    if (dirty && !window.confirm("Discard the unsaved changes?")) return;
    go();
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT");
      if (e.key === "Escape") {
        if (typing) (t as HTMLElement).blur();
        else leave(onClose);
      } else if (!typing && e.key === "ArrowLeft") leave(onPrev);
      else if (!typing && e.key === "ArrowRight") leave(onNext);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose, onPrev, onNext, dirty]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Edit story ${position}`}
      className="fixed inset-0 z-50 grid grid-rows-[auto_42vh_minmax(0,1fr)] bg-black/95 text-white backdrop-blur-sm md:grid-cols-[minmax(0,1fr)_380px] md:grid-rows-[auto_minmax(0,1fr)]"
      style={{
        paddingTop: "env(safe-area-inset-top, 0px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:col-span-2 md:px-6">
        <span className="font-mono-label text-xs text-white/60">
          {position} · {item.id}
        </span>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => leave(onPrev)} disabled={!onPrev} aria-label="Previous story" className={ghost + " px-3"}>
            ←
          </button>
          <button type="button" onClick={() => leave(onNext)} disabled={!onNext} aria-label="Next story" className={ghost + " px-3"}>
            →
          </button>
          <button type="button" onClick={() => leave(onClose)} className={ghost}>
            Close · Esc
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 items-center justify-center overflow-hidden px-2 pb-2 md:px-6 md:pb-6" style={{ containerType: "size" }}>
        <Media item={item} />
        {item.hidden && (
          <span className="pointer-events-none absolute left-4 top-2 bg-black/60 px-2 py-1 font-mono-label text-[10px] text-white/80 md:left-8">
            hidden from the wall
          </span>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
        className="flex min-h-0 flex-col gap-4 overflow-y-auto border-t border-white/10 px-4 py-4 md:border-l md:border-t-0 md:px-6"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onToggleHidden()}
            disabled={busy}
            className={
              "rounded-full px-4 py-2 font-mono-label text-xs disabled:opacity-50 " +
              (item.hidden ? "bg-accent text-background" : "border border-white/30 text-white/90 hover:border-white")
            }
          >
            {item.hidden ? "Show on wall" : "Hide from wall"}
          </button>
          <span className="flex gap-1">
            <button type="button" onClick={() => void onRotate("left")} disabled={busy} aria-label="Rotate left" className={ghost}>
              ⟲
            </button>
            <button type="button" onClick={() => void onRotate("right")} disabled={busy} aria-label="Rotate right" className={ghost}>
              ⟳
            </button>
          </span>
          <span className="self-center font-mono-label text-[10px] text-white/50">
            {item.kind === "video" ? `video${item.rot ? ` · turned ${item.rot}°` : ""}` : `image · ${item.w}×${item.h}`}
          </span>
        </div>

        <label className="flex flex-col gap-1">
          <span className={lbl}>Location</span>
          <input type="text" list="story-places" value={form.place} maxLength={MAX_PLACE_LEN} onChange={set("place")} placeholder="e.g. Mahabalipuram, Tamil Nadu" className={field} />
          <datalist id="story-places">
            {places.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className={lbl}>
            Note · {form.note.length}/{MAX_NOTE_LEN}
          </span>
          <textarea value={form.note} maxLength={MAX_NOTE_LEN} rows={3} onChange={set("note")} placeholder="A line about this frame, shown under it in the viewer" className={field + " resize-none"} />
        </label>

        <label className="flex flex-col gap-1">
          <span className={lbl}>Device</span>
          <input type="text" list="story-cams" value={form.cam} maxLength={60} onChange={set("cam")} placeholder="e.g. Galaxy S24 Ultra" className={field} />
          <datalist id="story-cams">
            {cams.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>

        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
          <label className="flex flex-col gap-1">
            <span className={lbl}>Posted (IST) · sets the week on the wall</span>
            <input type="datetime-local" value={form.ts} onChange={set("ts")} required className={field} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={lbl}>Shot (IST) · optional, shown when it differs</span>
            <span className="flex gap-1">
              <input type="datetime-local" value={form.shot} onChange={set("shot")} className={field} />
              {form.shot && (
                <button type="button" onClick={() => setForm({ ...form, shot: "" })} aria-label="Clear capture date" className={ghost + " px-3"}>
                  ×
                </button>
              )}
            </span>
          </label>
        </div>

        {err && (
          <p role="alert" className="font-mono-label text-xs text-accent">
            {err}
          </p>
        )}
        <div className="mt-auto flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={busy || !dirty}
            className="rounded-full bg-accent px-5 py-2 font-mono-label text-xs text-background disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {busy ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
          {dirty && (
            <button type="button" onClick={() => setForm(base)} className={ghost}>
              Reset
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
