import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getAdminStories,
  rotateStory,
  runCollectorNow,
  setRotation,
  setStoryDetails,
  setVisibility,
  type AdminData,
} from "@/lib/stories.functions";
import { MAX_NOTE_LEN, MAX_PLACE_LEN, rotatedFillStyle, storyThumbUrl, type AdminItem, type Rotation } from "@/lib/stories-core";

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

const PAGE = 120;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
type View = "hidden" | "visible" | "all";
/** The bottom sheet for place + note. `ids` may hold many stories (place applies to all). */
type Editor = { ids: string[]; place: string; note: string };
const fmt = (n: number) => n.toLocaleString("en-US");
const monthKey = (x: AdminItem) => x.ts.slice(0, 7);

const btn =
  "border border-foreground/30 px-2 py-1 font-mono-label text-xs hover:border-accent hover:text-accent disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

function AdminPage() {
  const { key } = Route.useSearch();
  const initial = Route.useLoaderData() as AdminData;
  const [data, setData] = useState<AdminData>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  // Default view: hidden items of the newest month that has any (else everything of the newest month).
  const [view, setView] = useState<View>(() => (initial.items.some((x) => x.hidden) ? "hidden" : "all"));
  const [month, setMonth] = useState<string>(() => {
    const hasHidden = initial.items.some((x) => x.hidden);
    const pool = hasHidden ? initial.items.filter((x) => x.hidden) : initial.items;
    return pool.reduce((m, x) => (monthKey(x) > m ? monthKey(x) : m), "") || "all";
  });
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const anchor = useRef<string | null>(null);

  const resetView = () => {
    setLimit(PAGE);
    setSel(new Set());
    anchor.current = null;
  };

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

  const needle = q.trim().toLowerCase();
  const filtered = useMemo(
    () =>
      data.items.filter(
        (x) =>
          (month === "all" || monthKey(x) === month) &&
          (view === "all" || (view === "hidden") === x.hidden) &&
          (!needle || x.id.toLowerCase().includes(needle)),
      ),
    [data.items, month, view, needle],
  );
  const rendered = filtered.slice(0, limit);
  const inMonth = useMemo(() => (month === "all" ? data.items : data.items.filter((x) => monthKey(x) === month)), [data.items, month]);
  const totalVisible = data.items.reduce((n, x) => n + (x.hidden ? 0 : 1), 0);

  const applyLocal = (ids: string[], hidden: boolean) => {
    const set = new Set(ids);
    setData((d) => ({ ...d, items: d.items.map((x) => (set.has(x.id) ? { ...x, hidden } : x)) }));
  };
  const setHidden = async (ids: string[], hidden: boolean, label: string) => {
    if (!ids.length) return;
    setBusy(label);
    setMsg("");
    try {
      const r = await setVisibility({ data: { key, ids, hidden } });
      applyLocal(ids, hidden);
      setSel(new Set());
      setMsg(`${hidden ? "Hid" : "Showed"} ${fmt(r.changed)} ${r.changed === 1 ? "story" : "stories"}.`);
    } catch (e) {
      setMsg(String((e as Error).message));
    }
    setBusy(null);
  };
  const bulkMonth = (hidden: boolean) => {
    const ids = inMonth.filter((x) => x.hidden !== hidden).map((x) => x.id);
    if (!ids.length) return setMsg(`Everything in ${monthLabel(month)} is already ${hidden ? "hidden" : "visible"}.`);
    if (!window.confirm(`${hidden ? "Hide" : "Show"} ${fmt(ids.length)} stories in ${monthLabel(month)}?`)) return;
    void setHidden(ids, hidden, "bulk");
  };

  const pick = (id: string, shift: boolean) => {
    const next = new Set(sel);
    if (shift && anchor.current && anchor.current !== id) {
      const a = rendered.findIndex((x) => x.id === anchor.current);
      const b = rendered.findIndex((x) => x.id === id);
      if (a >= 0 && b >= 0) {
        const want = sel.has(anchor.current);
        for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
          if (want) next.add(rendered[i].id);
          else next.delete(rendered[i].id);
        }
        setSel(next);
        anchor.current = id;
        return;
      }
    }
    if (next.has(id)) next.delete(id);
    else next.add(id);
    anchor.current = id;
    setSel(next);
  };

  const rotate = async (id: string, dir: "left" | "right") => {
    setBusy("rot:" + id);
    setMsg("");
    try {
      const item = data.items.find((x) => x.id === id);
      if (item?.kind === "video") {
        // Videos can't be re-encoded in the browser: store a visual rotation instead.
        const rot = (((item.rot ?? 0) + (dir === "left" ? 270 : 90)) % 360) as Rotation;
        setData(await setRotation({ data: { key, id, rot } }));
        setBusy(null);
        return;
      }
      const res = await fetch(`/stories/media/${id}.jpg?v=${item?.v ?? 0}`, { cache: "reload" });
      if (!res.ok) throw new Error("Could not load the image");
      const bmp = await createImageBitmap(await res.blob());
      const canvas = document.createElement("canvas");
      canvas.width = bmp.height;
      canvas.height = bmp.width;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(((dir === "left" ? -90 : 90) * Math.PI) / 180);
      ctx.drawImage(bmp, -bmp.width / 2, -bmp.height / 2);
      bmp.close();
      const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.92));
      if (!blob) throw new Error("Could not encode the image");
      const fd = new FormData();
      fd.set("key", key ?? "");
      fd.set("id", id);
      fd.set("dir", dir);
      fd.set("file", blob, `${id}.jpg`);
      setData(await rotateStory({ data: fd }));
    } catch (e) {
      setMsg(String((e as Error).message));
    }
    setBusy(null);
  };
  const [editor, setEditor] = useState<Editor | null>(null);
  const placeRef = useRef<HTMLInputElement>(null);
  const openEditor = (ids: string[]) => {
    if (!ids.length) return;
    const picked = ids.map((id) => data.items.find((x) => x.id === id)).filter((x): x is AdminItem => !!x);
    const same = (f: (x: AdminItem) => string) => {
      const vals = new Set(picked.map(f));
      return vals.size === 1 ? [...vals][0] : "";
    };
    setEditor({ ids, place: same((x) => x.place ?? ""), note: same((x) => x.caption ?? "") });
    setTimeout(() => placeRef.current?.focus(), 50);
  };
  const saveEditor = async () => {
    if (!editor) return;
    setBusy("details");
    setMsg("");
    try {
      const many = editor.ids.length > 1;
      // With many stories an empty note keeps each story's own note; a single story is always written as shown.
      const r = await setStoryDetails({
        data: { key, ids: editor.ids, place: editor.place, note: many && !editor.note.trim() ? undefined : editor.note },
      });
      setData({ items: r.items, storage: r.storage });
      setEditor(null);
      setSel(new Set());
      setMsg(`Saved ${fmt(r.changed)} ${r.changed === 1 ? "story" : "stories"}.`);
    } catch (e) {
      setMsg(String((e as Error).message));
    }
    setBusy(null);
  };
  useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditor(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editor]);
  const places = useMemo(() => [...new Set(data.items.map((x) => x.place).filter((p): p is string => !!p))].sort(), [data.items]);
  const editing = editor ? editor.ids.map((id) => data.items.find((x) => x.id === id)).filter((x): x is AdminItem => !!x) : [];

  const run = async () => {
    setBusy("run");
    setMsg("");
    try {
      const r = await runCollectorNow({ data: { key } });
      setMsg(r.message);
      setData({ items: r.items, storage: r.storage });
    } catch (e) {
      setMsg(String((e as Error).message));
    }
    setBusy(null);
  };

  const chip = (on: boolean) =>
    "border px-2 py-1 font-mono-label text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent " +
    (on ? "border-accent bg-accent text-background" : "border-foreground/30 hover:border-accent hover:text-accent");
  const anyBusy = busy !== null;

  return (
    <div className={"mx-auto max-w-[1100px] px-4 py-12 sm:px-6 md:px-10 " + (editor ? "pb-72 sm:pb-56" : "")}>
      <p className="font-mono-label text-muted-foreground">Stories admin · storage: {data.storage}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl" aria-live="polite">
          <span className="text-accent">{fmt(totalVisible)}</span> visible of {fmt(data.items.length)}
        </h1>
        <button
          type="button"
          onClick={run}
          disabled={anyBusy}
          className="rounded-full bg-accent px-4 py-2 font-mono-label text-xs text-background disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {busy === "run" ? "Running..." : "Run collector now"}
        </button>
      </div>

      <nav aria-label="Month" className="mt-6 flex flex-col gap-3">
        <button type="button" onClick={() => { setMonth("all"); resetView(); }} className={chip(month === "all") + " self-start"}>
          All months · {fmt(data.items.length)}
        </button>
        {years.map(([year, list]) => (
          <div key={year} className="flex flex-wrap items-center gap-2">
            <span className="w-10 font-mono-label text-xs text-muted-foreground">{year}</span>
            {list.map(([mk, c]) => (
              <button
                key={mk}
                type="button"
                aria-pressed={month === mk}
                title={`${c.v} visible, ${c.h} hidden`}
                onClick={() => { setMonth(mk); resetView(); }}
                className={chip(month === mk)}
              >
                {MONTHS[Number(mk.slice(5)) - 1]} · {fmt(c.v + c.h)}
                <span className="ml-1 opacity-70">
                  ({c.v}/{c.h})
                </span>
              </button>
            ))}
          </div>
        ))}
        <p className="font-mono-label text-[10px] text-muted-foreground">Chip counts: total (visible/hidden)</p>
      </nav>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Status" className="flex gap-1">
          {(["hidden", "visible", "all"] as const).map((v) => (
            <button key={v} type="button" aria-pressed={view === v} onClick={() => { setView(v); resetView(); }} className={chip(view === v)}>
              {v === "hidden" ? "Hidden only" : v === "visible" ? "Visible only" : "All"}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={q}
          onChange={(e) => { setQ(e.target.value); resetView(); }}
          placeholder="Filter by id"
          aria-label="Filter by id"
          className="w-full min-w-0 border border-foreground/30 bg-transparent px-2 py-1 font-mono-label text-xs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent sm:w-64"
        />
      </div>

      <div className="mt-4 sm:sticky sm:top-0 sm:z-10 flex flex-wrap items-center gap-2 border-b border-border bg-background py-3">
        <span className="mr-2 font-mono-label text-xs text-muted-foreground" aria-live="polite">
          {fmt(filtered.length)} in view · {fmt(sel.size)} selected
        </span>
        <button type="button" className={btn} disabled={anyBusy || !filtered.length} onClick={() => setSel(new Set(filtered.map((x) => x.id)))}>
          Select all {fmt(filtered.length)} in view
        </button>
        <button type="button" className={btn} disabled={anyBusy || !sel.size} onClick={() => setSel(new Set())}>
          Clear
        </button>
        <button type="button" className={btn} disabled={anyBusy || !sel.size} onClick={() => setHidden([...sel], false, "bulk")}>
          Show selected
        </button>
        <button type="button" className={btn} disabled={anyBusy || !sel.size} onClick={() => setHidden([...sel], true, "bulk")}>
          Hide selected
        </button>
        <button type="button" className={btn} disabled={anyBusy || !sel.size} onClick={() => openEditor([...sel])}>
          Location / note for selected…
        </button>
        {month !== "all" && (
          <>
            <button type="button" className={btn} disabled={anyBusy} onClick={() => bulkMonth(false)}>
              Show all in {monthLabel(month)}
            </button>
            <button type="button" className={btn} disabled={anyBusy} onClick={() => bulkMonth(true)}>
              Hide all in {monthLabel(month)}
            </button>
          </>
        )}
      </div>
      {msg && <p className="mt-4 font-mono-label text-xs text-muted-foreground" role="status">{msg}</p>}

      {!filtered.length && <p className="mt-8 font-mono-label text-xs text-muted-foreground">Nothing matches this filter.</p>}
      <ul className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2">
        {rendered.map((s) => {
          const on = sel.has(s.id);
          return (
            <li key={s.id} className={"flex min-w-0 flex-col gap-1 border p-1 " + (on ? "border-accent" : "border-border")}>
              <button
                type="button"
                aria-pressed={on}
                aria-label={`Select ${s.id}`}
                onClick={(e) => pick(s.id, e.shiftKey)}
                className="relative block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
              >
                <span className={"relative block aspect-[9/16] w-full overflow-hidden " + (s.hidden ? "opacity-30" : "")}>
                  <img
                    src={storyThumbUrl(s)}
                    alt=""
                    width={s.w}
                    height={s.h}
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    style={rotatedFillStyle(s.rot, 9 / 16)}
                    className={s.rot ? undefined : "h-full w-full object-cover"}
                  />
                </span>
                <span
                  aria-hidden
                  className={
                    "absolute left-1 top-1 flex h-5 w-5 items-center justify-center border text-xs " +
                    (on ? "border-accent bg-accent text-background" : "border-foreground/60 bg-background/70")
                  }
                >
                  {on ? "✓" : ""}
                </span>
                {s.kind === "video" && (
                  <span className="absolute bottom-1 right-1 bg-background/80 px-1 font-mono-label text-[9px]">
                    video{s.rot ? ` · ${s.rot}°` : ""}
                  </span>
                )}
              </button>
              <p className="truncate font-mono-label text-[10px] text-muted-foreground" title={s.id}>
                {s.ts.slice(0, 10)} · {s.hidden ? "hidden" : "visible"}
              </p>
              <button
                type="button"
                disabled={anyBusy}
                onClick={() => openEditor([s.id])}
                title={[s.place && `Location: ${s.place}`, s.caption && `Note: ${s.caption}`].filter(Boolean).join("\n") || "Add a location and a note"}
                className={
                  "truncate text-left font-mono-label text-[10px] hover:text-accent disabled:opacity-50 " +
                  (s.place || s.caption ? "text-foreground" : "text-muted-foreground")
                }
              >
                {s.place || s.caption ? `${s.place ? `📍 ${s.place}` : ""}${s.place && s.caption ? " · " : ""}${s.caption ? `✎ ${s.caption}` : ""}` : "+ location · note"}
              </button>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={anyBusy}
                  onClick={() => setHidden([s.id], !s.hidden, "one:" + s.id)}
                  className={btn + " min-w-0 flex-[2] whitespace-nowrap px-1"}
                >
                  {s.hidden ? "Show" : "Hide"}
                </button>
                {(["left", "right"] as const).map((dir) => (
                  <button
                    key={dir}
                    type="button"
                    disabled={anyBusy}
                    title={s.kind === "video" ? "Turns the video on the wall (the file is left as is)" : undefined}
                    aria-label={dir === "left" ? "Rotate left" : "Rotate right"}
                    onClick={() => rotate(s.id, dir)}
                    className={btn + " min-w-0 flex-1 px-0"}
                  >
                    {dir === "left" ? "⟲" : "⟳"}
                  </button>
                ))}
              </div>
              {busy === "rot:" + s.id && <p className="font-mono-label text-[10px] text-muted-foreground">Rotating…</p>}
            </li>
          );
        })}
      </ul>
      {filtered.length > rendered.length && (
        <div className="mt-6 flex justify-center">
          <button type="button" className={btn + " px-4 py-2"} onClick={() => setLimit((l) => l + PAGE)}>
            Show {Math.min(PAGE, filtered.length - rendered.length)} more ({fmt(filtered.length - rendered.length)} left)
          </button>
        </div>
      )}

      {editor && (
        <section
          role="dialog"
          aria-label="Location and note"
          className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background shadow-[0_-12px_40px_rgba(0,0,0,0.15)]"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void saveEditor();
            }}
            className="mx-auto flex max-w-[1100px] flex-wrap items-start gap-4 px-4 py-4 sm:px-6 md:px-10"
          >
            <div className="flex shrink-0 gap-1">
              {editing.slice(0, 3).map((x) => (
                <span key={x.id} className="relative block h-24 w-[54px] overflow-hidden bg-secondary">
                  <img
                    src={storyThumbUrl(x)}
                    alt=""
                    style={rotatedFillStyle(x.rot, 9 / 16)}
                    className={x.rot ? undefined : "h-full w-full object-cover"}
                  />
                </span>
              ))}
              {editing.length > 3 && (
                <span className="flex h-24 w-[54px] items-center justify-center bg-secondary font-mono-label text-xs text-muted-foreground">
                  +{fmt(editing.length - 3)}
                </span>
              )}
            </div>
            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1">
                <span className="font-mono-label text-[10px] text-muted-foreground">
                  Location{editing.length > 1 ? ` · applies to all ${fmt(editing.length)}` : ""}
                </span>
                <input
                  ref={placeRef}
                  type="text"
                  list="story-places"
                  value={editor.place}
                  maxLength={MAX_PLACE_LEN}
                  placeholder="e.g. Mahabalipuram, Tamil Nadu"
                  onChange={(e) => setEditor({ ...editor, place: e.target.value })}
                  className="border border-foreground/30 bg-transparent px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                />
                <datalist id="story-places">
                  {places.map((p) => (
                    <option key={p} value={p} />
                  ))}
                </datalist>
              </label>
              <label className="flex flex-col gap-1">
                <span className="font-mono-label text-[10px] text-muted-foreground">
                  Note{editing.length > 1 ? " · leave empty to keep each story's own" : ""} · {editor.note.length}/{MAX_NOTE_LEN}
                </span>
                <textarea
                  value={editor.note}
                  maxLength={MAX_NOTE_LEN}
                  rows={2}
                  placeholder="A line about this frame, shown under it in the viewer"
                  onChange={(e) => setEditor({ ...editor, note: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void saveEditor();
                  }}
                  className="resize-none border border-foreground/30 bg-transparent px-2 py-1.5 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                />
              </label>
            </div>
            <div className="flex w-full gap-2 sm:w-auto sm:flex-col">
              <button
                type="submit"
                disabled={anyBusy}
                className="rounded-full bg-accent px-4 py-2 font-mono-label text-xs text-background disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              >
                {busy === "details" ? "Saving…" : "Save"}
              </button>
              <button type="button" onClick={() => setEditor(null)} disabled={anyBusy} className={btn + " rounded-full px-4 py-2"}>
                Cancel · Esc
              </button>
            </div>
            <p className="w-full font-mono-label text-[10px] text-muted-foreground">
              {editing.length === 1 ? `${editing[0].id} · ${editing[0].ts.slice(0, 10)}` : `${fmt(editing.length)} stories selected`} · Empty location clears it
            </p>
          </form>
        </section>
      )}
    </div>
  );
}

function monthLabel(mk: string) {
  return mk === "all" ? "all months" : `${MONTHS[Number(mk.slice(5)) - 1]} ${mk.slice(0, 4)}`;
}
