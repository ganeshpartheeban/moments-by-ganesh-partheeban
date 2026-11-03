import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import StoryEditor from "@/components/StoryEditor";
import StoryTile from "@/components/StoryTile";
import { getAdminStories, rotateStory, runCollectorNow, updateStories, type AdminData } from "@/lib/stories.functions";
import { formatWeekLabel, groupByWeek, MAX_PLACE_LEN, type AdminItem, type Rotation, type StoryPatch } from "@/lib/stories-core";

export const Route = createFileRoute("/stories_/admin")({
  validateSearch: (s: Record<string, unknown>) => ({
    key: typeof s.key === "string" ? s.key : undefined,
  }),
  loaderDeps: ({ search }) => ({ key: search.key }),
  // Wrong or missing key throws notFound() inside the server function.
  loader: ({ deps }) => getAdminStories({ data: { key: deps.key } }),
  head: () => ({ meta: [{ title: "Stories admin" }, { name: "robots", content: "noindex, nofollow" }] }),
  component: AdminPage,
});

const WEEKS_PAGE = 6;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type View = "all" | "hidden" | "visible";
const fmt = (n: number) => n.toLocaleString("en-US");
const monthKey = (x: AdminItem) => x.ts.slice(0, 7);
const monthLabel = (mk: string) => (mk === "all" ? "all months" : `${MONTHS[Number(mk.slice(5)) - 1]} ${mk.slice(0, 4)}`);
const dateFmt = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeZone: "Asia/Kolkata" });

const chipCls = (on: boolean) =>
  "border px-2 py-1 font-mono-label text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent " +
  (on ? "border-accent bg-accent text-background" : "border-foreground/30 hover:border-accent hover:text-accent");
const btn =
  "border border-foreground/30 px-2 py-1 font-mono-label text-xs hover:border-accent hover:text-accent disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
const field =
  "min-w-0 flex-1 border border-foreground/30 bg-transparent px-2 py-1 text-sm placeholder:text-muted-foreground/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";
const lbl = "font-mono-label text-[10px] text-muted-foreground";
const noun = (n: number) => (n === 1 ? "story" : "stories");

function AdminPage() {
  const { key } = Route.useSearch();
  const initial = Route.useLoaderData() as AdminData;
  const [data, setData] = useState<AdminData>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [view, setView] = useState<View>("all");
  const [month, setMonth] = useState("all");
  const [selectMode, setSelectMode] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  /** Last tile picked in select mode; shift-click selects the run from here to the next pick. */
  const lastPick = useRef<string | null>(null);
  const [placeIn, setPlaceIn] = useState("");
  const [camIn, setCamIn] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [weeksShown, setWeeksShown] = useState(WEEKS_PAGE);
  const sentinel = useRef<HTMLDivElement>(null);

  const totalVisible = data.items.reduce((n, x) => n + (x.hidden ? 0 : 1), 0);

  const months = useMemo(() => {
    const m = new Map<string, { v: number; h: number }>();
    for (const x of data.items) {
      const c = m.get(monthKey(x)) ?? { v: 0, h: 0 };
      if (x.hidden) c.h++;
      else c.v++;
      m.set(monthKey(x), c);
    }
    return [...m.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [data.items]);
  const years = useMemo(() => {
    const y = new Map<string, [string, { v: number; h: number }][]>();
    for (const e of months) y.set(e[0].slice(0, 4), [...(y.get(e[0].slice(0, 4)) ?? []), e]);
    return [...y.entries()];
  }, [months]);

  const filtered = useMemo(
    () => data.items.filter((x) => (month === "all" || monthKey(x) === month) && (view === "all" || (view === "hidden") === x.hidden)),
    [data.items, month, view],
  );
  const weeks = useMemo(() => groupByWeek(filtered).map((w) => ({ ...w, label: formatWeekLabel(w.key, "en-IN") })), [filtered]);
  const places = useMemo(() => [...new Set(data.items.map((x) => x.place).filter((p): p is string => !!p))].sort(), [data.items]);
  const cams = useMemo(() => [...new Set(data.items.map((x) => x.cam).filter((c): c is string => !!c))].sort(), [data.items]);

  // More weeks as the sentinel scrolls into view.
  useEffect(() => {
    const el = sentinel.current;
    if (!el || weeksShown >= weeks.length) return;
    const io = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) setWeeksShown((n) => n + WEEKS_PAGE);
    }, { rootMargin: "1200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [weeksShown, weeks.length]);
  const resetView = () => {
    setWeeksShown(WEEKS_PAGE);
    setSel(new Set());
    lastPick.current = null;
  };

  const run = async <T,>(label: string, fn: () => Promise<T>, done?: (r: T) => string) => {
    setBusy(true);
    setMsg("");
    try {
      const r = await fn();
      if (done) setMsg(done(r));
      return r;
    } catch (e) {
      setMsg(`${label} failed: ${String((e as Error).message)}`);
      return undefined;
    } finally {
      setBusy(false);
    }
  };
  const update = (ids: string[], patch: StoryPatch, label: string) =>
    run(label, async () => {
      const r = await updateStories({ data: { key, ids, patch } });
      setData({ items: r.items, storage: r.storage });
      return r;
    });

  /** Pixel-rotate one image in the browser and upload the result; resolves to the refreshed admin data. */
  const rotateImage = async (item: AdminItem, dir: "left" | "right") => {
    const res = await fetch(`/stories/media/${item.id}.jpg?v=${item.v ?? 0}`, { cache: "reload" });
    if (!res.ok) throw new Error("could not load the image");
    const bmp = await createImageBitmap(await res.blob());
    const canvas = document.createElement("canvas");
    canvas.width = bmp.height;
    canvas.height = bmp.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(((dir === "left" ? -90 : 90) * Math.PI) / 180);
    ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
    bmp.close();
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
    if (!blob) throw new Error("could not encode the image");
    const fd = new FormData();
    fd.set("key", key ?? "");
    fd.set("id", item.id);
    fd.set("dir", dir);
    fd.set("file", blob, `${item.id}.jpg`);
    return rotateStory({ data: fd });
  };
  const turned = (item: AdminItem, dir: "left" | "right") => (((item.rot ?? 0) + (dir === "left" ? 270 : 90)) % 360) as Rotation;
  /** Rotate one story: images are re-encoded in place, videos store a visual rotation. */
  const rotate = async (item: AdminItem, dir: "left" | "right") => {
    if (item.kind === "video") {
      await update([item.id], { rot: turned(item, dir) }, "Rotate");
      return;
    }
    await run("Rotate", async () => setData(await rotateImage(item, dir)));
  };
  const collect = () =>
    run("Collector", async () => {
      const r = await runCollectorNow({ data: { key } });
      setData({ items: r.items, storage: r.storage });
      return r;
    }, (r) => r.message);

  // ---- editor navigation along the filtered wall ----
  const openIndex = openId ? filtered.findIndex((x) => x.id === openId) : -1;
  const openItem = openIndex >= 0 ? filtered[openIndex] : null;
  const closeEditor = useCallback(() => setOpenId(null), []);
  const goPrev = useMemo(() => (openIndex > 0 ? () => setOpenId(filtered[openIndex - 1].id) : undefined), [openIndex, filtered]);
  const goNext = useMemo(
    () => (openIndex >= 0 && openIndex < filtered.length - 1 ? () => setOpenId(filtered[openIndex + 1].id) : undefined),
    [openIndex, filtered],
  );

  const onTile = (x: AdminItem, e: MouseEvent) => {
    if (!selectMode) return setOpenId(x.id);
    const next = new Set(sel);
    const li = e.shiftKey && lastPick.current ? filtered.findIndex((y) => y.id === lastPick.current) : -1;
    if (li >= 0) {
      // Shift-click: pick the whole run between the previous pick and this tile.
      const ci = filtered.findIndex((y) => y.id === x.id);
      for (let i = Math.min(li, ci); i <= Math.max(li, ci); i++) next.add(filtered[i].id);
    } else if (next.has(x.id)) next.delete(x.id);
    else next.add(x.id);
    lastPick.current = x.id;
    setSel(next);
  };
  const toggleWeek = (ids: string[]) => {
    const next = new Set(sel);
    const all = ids.every((id) => next.has(id));
    for (const id of ids) {
      if (all) next.delete(id);
      else next.add(id);
    }
    setSel(next);
  };
  const bulkHidden = (ids: string[], hidden: boolean) =>
    update(ids, { hidden }, hidden ? "Hide" : "Show").then((r) => {
      if (r) {
        setSel(new Set());
        setMsg(`${hidden ? "Hid" : "Showed"} ${fmt(r.changed)} ${r.changed === 1 ? "story" : "stories"}.`);
      }
    });
  // ---- bulk edits on the selection (it stays selected so several fields can be set in a row) ----
  const selected = useMemo(() => (sel.size ? data.items.filter((x) => sel.has(x.id)) : []), [data.items, sel]);
  /** What the selection currently holds in a field, for the hint next to its input. */
  const summary = (k: "place" | "cam") => {
    const vals = new Set(selected.map((x) => x[k] ?? ""));
    if (vals.size === 1) return [...vals][0] || "none yet";
    return `mixed · ${fmt(selected.filter((x) => x[k]).length)} of ${fmt(selected.length)} have one`;
  };
  const bulkField = async (k: "place" | "cam", value: string) => {
    const what = k === "place" ? "location" : "device";
    const v = value.replace(/\s+/g, " ").trim();
    if (!v && !window.confirm(`Clear the ${what} on ${fmt(sel.size)} ${noun(sel.size)}?`)) return;
    const r = await update([...sel], k === "place" ? { place: v } : { cam: v }, v ? "Set" : "Clear");
    if (!r) return;
    const rest = r.changed < sel.size ? ` (the other ${fmt(sel.size - r.changed)} already ${v ? "had it" : "had none"})` : "";
    setMsg(`${v ? "Set" : "Cleared"} the ${what} on ${fmt(r.changed)} ${noun(r.changed)}${rest}.`);
  };
  const bulkRotate = (dir: "left" | "right") => {
    const videos = selected.filter((x) => x.kind === "video");
    const images = selected.filter((x) => x.kind === "image");
    const parts = [images.length ? `${fmt(images.length)} ${images.length === 1 ? "image" : "images"} (re-encoded one by one)` : "", videos.length ? `${fmt(videos.length)} ${videos.length === 1 ? "video" : "videos"}` : ""];
    if (!window.confirm(`Rotate ${parts.filter(Boolean).join(" and ")} 90° ${dir}?`)) return;
    return run(
      "Rotate",
      async () => {
        // Videos keep a visual rotation: one index write per resulting angle (at most four).
        const byRot = new Map<Rotation, string[]>();
        for (const v of videos) byRot.set(turned(v, dir), [...(byRot.get(turned(v, dir)) ?? []), v.id]);
        for (const [rot, ids] of byRot) {
          const r = await updateStories({ data: { key, ids, patch: { rot } } });
          setData({ items: r.items, storage: r.storage });
        }
        let n = 0;
        for (const img of images) {
          setMsg(`Rotating image ${fmt(++n)} of ${fmt(images.length)}…`);
          try {
            setData(await rotateImage(img, dir));
          } catch (e) {
            throw new Error(`${(e as Error).message} on image ${n} of ${images.length}; ${n - 1} done, the rest untouched`);
          }
        }
        return `Rotated ${fmt(selected.length)} ${noun(selected.length)} ${dir}.`;
      },
      (s) => s,
    );
  };
  const bulkMonth = (hidden: boolean) => {
    const ids = filtered.filter((x) => x.hidden !== hidden).map((x) => x.id);
    if (!ids.length) return setMsg(`Everything in ${monthLabel(month)} is already ${hidden ? "hidden" : "visible"}.`);
    if (!window.confirm(`${hidden ? "Hide" : "Show"} ${fmt(ids.length)} stories in ${monthLabel(month)}?`)) return;
    void bulkHidden(ids, hidden);
  };

  let tileNo = 0;
  return (
    <div>
      <section className="mx-auto max-w-[1800px] px-4 pt-10 pb-6 sm:px-6 md:px-10">
        <p className="font-mono-label text-muted-foreground">Stories admin · storage: {data.storage}</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-3xl tracking-tight sm:text-4xl" aria-live="polite">
            <span className="text-accent">{fmt(totalVisible)}</span> visible of {fmt(data.items.length)}
          </h1>
          <button
            type="button"
            onClick={() => void collect()}
            disabled={busy}
            className="rounded-full bg-accent px-4 py-2 font-mono-label text-xs text-background disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {busy ? "Working…" : "Run collector now"}
          </button>
        </div>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          Click any story to open it and change its visibility, rotation, dates, device, location and note. Hidden stories are faded.
          Use <strong className="font-medium text-foreground">Select many</strong> to set the location, device or rotation of several stories at once.
        </p>

        <nav aria-label="Month" className="mt-6 flex flex-col gap-2">
          <button type="button" onClick={() => { setMonth("all"); resetView(); }} className={chipCls(month === "all") + " self-start"}>
            All months · {fmt(data.items.length)}
          </button>
          {years.map(([year, list]) => (
            <div key={year} className="flex flex-wrap items-center gap-1.5">
              <span className="w-10 font-mono-label text-xs text-muted-foreground">{year}</span>
              {list.map(([mk, c]) => (
                <button
                  key={mk}
                  type="button"
                  aria-pressed={month === mk}
                  title={`${c.v} visible, ${c.h} hidden`}
                  onClick={() => { setMonth(mk); resetView(); }}
                  className={chipCls(month === mk)}
                >
                  {MONTHS[Number(mk.slice(5)) - 1]} · {fmt(c.v + c.h)}
                  <span className="ml-1 opacity-70">({c.v}/{c.h})</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <div role="group" aria-label="Status" className="flex gap-1">
            {(["all", "visible", "hidden"] as const).map((v) => (
              <button key={v} type="button" aria-pressed={view === v} onClick={() => { setView(v); resetView(); }} className={chipCls(view === v)}>
                {v === "all" ? "All" : v === "visible" ? "Visible only" : "Hidden only"}
              </button>
            ))}
          </div>
          <span className="font-mono-label text-xs text-muted-foreground">{fmt(filtered.length)} in view</span>
          <button
            type="button"
            aria-pressed={selectMode}
            onClick={() => { setSelectMode(!selectMode); setSel(new Set()); lastPick.current = null; }}
            className={chipCls(selectMode) + " ml-auto"}
          >
            {selectMode ? "Done selecting" : "Select many"}
          </button>
          {month !== "all" && !selectMode && (
            <>
              <button type="button" className={btn} disabled={busy} onClick={() => bulkMonth(false)}>
                Show all in {monthLabel(month)}
              </button>
              <button type="button" className={btn} disabled={busy} onClick={() => bulkMonth(true)}>
                Hide all in {monthLabel(month)}
              </button>
            </>
          )}
        </div>
        {selectMode && (
          <div className="sticky top-0 z-10 mt-3 flex flex-wrap items-center gap-2 border-b border-border bg-background py-3">
            <span className="font-mono-label text-xs text-muted-foreground" aria-live="polite">
              {fmt(sel.size)} selected · tap tiles to pick, shift-click for a run, or use Select week
            </span>
            <button type="button" className={btn} disabled={busy || !filtered.length} onClick={() => setSel(new Set(filtered.map((x) => x.id)))}>
              Select all {fmt(filtered.length)}
            </button>
            <button type="button" className={btn} disabled={busy || !sel.size} onClick={() => setSel(new Set())}>
              Clear
            </button>
            <button type="button" className={btn} disabled={busy || !sel.size} onClick={() => void bulkHidden([...sel], false)}>
              Show selected
            </button>
            <button type="button" className={btn} disabled={busy || !sel.size} onClick={() => void bulkHidden([...sel], true)}>
              Hide selected
            </button>
            {sel.size > 0 && (
              <div className="flex w-full flex-wrap items-end gap-x-5 gap-y-2 pt-1">
                <form
                  className="flex min-w-[16rem] flex-1 flex-col gap-1"
                  onSubmit={(e) => { e.preventDefault(); void bulkField("place", placeIn); }}
                >
                  <label htmlFor="bulk-place" className={lbl}>Location · {summary("place")}</label>
                  <div className="flex gap-1">
                    <input id="bulk-place" type="text" list="bulk-places" value={placeIn} maxLength={MAX_PLACE_LEN} onChange={(e) => setPlaceIn(e.target.value)} placeholder="e.g. Mahabalipuram, Tamil Nadu" className={field} />
                    <datalist id="bulk-places">
                      {places.map((p) => <option key={p} value={p} />)}
                    </datalist>
                    <button type="submit" className={btn} disabled={busy || !placeIn.trim()}>Set</button>
                    <button type="button" className={btn} disabled={busy} onClick={() => void bulkField("place", "")}>Clear</button>
                  </div>
                </form>
                <form
                  className="flex min-w-[16rem] flex-1 flex-col gap-1"
                  onSubmit={(e) => { e.preventDefault(); void bulkField("cam", camIn); }}
                >
                  <label htmlFor="bulk-cam" className={lbl}>Device · {summary("cam")}</label>
                  <div className="flex gap-1">
                    <input id="bulk-cam" type="text" list="bulk-cams" value={camIn} maxLength={60} onChange={(e) => setCamIn(e.target.value)} placeholder="e.g. Galaxy S24 Ultra" className={field} />
                    <datalist id="bulk-cams">
                      {cams.map((c) => <option key={c} value={c} />)}
                    </datalist>
                    <button type="submit" className={btn} disabled={busy || !camIn.trim()}>Set</button>
                    <button type="button" className={btn} disabled={busy} onClick={() => void bulkField("cam", "")}>Clear</button>
                  </div>
                </form>
                <div className="flex flex-col gap-1">
                  <span className={lbl}>Rotation · images are re-encoded, videos turned on screen</span>
                  <div className="flex gap-1">
                    <button type="button" className={btn} disabled={busy} onClick={() => void bulkRotate("left")}>⟲ 90° left</button>
                    <button type="button" className={btn} disabled={busy} onClick={() => void bulkRotate("right")}>⟳ 90° right</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        {msg && (
          <p className="mt-3 font-mono-label text-xs text-muted-foreground" role="status">
            {msg}
          </p>
        )}
      </section>

      <section className="mx-auto max-w-[1800px] px-1 pb-10 sm:px-2 md:px-4">
        {!filtered.length && <p className="px-3 py-16 text-center text-muted-foreground">Nothing matches this filter.</p>}
        {weeks.slice(0, weeksShown).map((w) => (
          <section key={w.key} aria-labelledby={`aweek-${w.key}`} className="mb-8 sm:mb-10">
            <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-2 pb-2 pt-2 sm:px-3">
              <h2 id={`aweek-${w.key}`} className="font-display text-lg text-foreground sm:text-xl">
                {w.label}
              </h2>
              <span className="flex items-center gap-2 font-mono-label text-muted-foreground">
                {w.idx.length} stories · {w.idx.filter((i) => filtered[i].hidden).length} hidden
                {selectMode && (() => {
                  const ids = w.idx.map((i) => filtered[i].id);
                  const all = ids.every((id) => sel.has(id));
                  return (
                    <button type="button" className={btn} aria-pressed={all} onClick={() => toggleWeek(ids)}>
                      {all ? "Deselect week" : "Select week"}
                    </button>
                  );
                })()}
              </span>
            </header>
            <ul className="grid grid-flow-dense grid-cols-3 gap-0.5 sm:grid-cols-4 sm:gap-1 lg:grid-cols-5 xl:grid-cols-6">
              {w.idx.map((i) => {
                const x = filtered[i];
                const n = tileNo++;
                return (
                  <StoryTile
                    key={x.id}
                    story={x}
                    alt=""
                    label={`${selectMode ? "Select" : "Edit"} story from ${dateFmt.format(new Date(x.ts))}`}
                    dateText={dateFmt.format(new Date(x.ts))}
                    place={x.place}
                    eager={n < 6}
                    dim={x.hidden}
                    badge={[x.hidden ? "hidden" : "", x.rot ? `${x.rot}°` : "", x.caption ? "✎" : ""].filter(Boolean).join(" · ") || undefined}
                    selected={selectMode ? sel.has(x.id) : undefined}
                    onClick={(e) => onTile(x, e)}
                  />
                );
              })}
            </ul>
          </section>
        ))}
        {weeksShown < weeks.length && (
          <div ref={sentinel} className="flex justify-center py-6">
            <button type="button" className={btn + " px-4 py-2"} onClick={() => setWeeksShown((n) => n + WEEKS_PAGE)}>
              More weeks ({fmt(weeks.length - weeksShown)} left)
            </button>
          </div>
        )}
      </section>

      {openItem && (
        <StoryEditor
          item={openItem}
          position={`${openIndex + 1} / ${fmt(filtered.length)}`}
          places={places}
          cams={cams}
          busy={busy}
          onClose={closeEditor}
          onPrev={goPrev}
          onNext={goNext}
          onSave={async (patch) => {
            const r = await update([openItem.id], patch, "Save");
            if (r) setMsg(r.changed ? "Saved." : "Nothing changed.");
            return !!r;
          }}
          onRotate={(dir) => rotate(openItem, dir)}
          onToggleHidden={async () => {
            await update([openItem.id], { hidden: !openItem.hidden }, "Visibility");
          }}
        />
      )}
    </div>
  );
}
