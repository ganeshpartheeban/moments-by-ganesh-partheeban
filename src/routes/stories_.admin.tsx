import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getAdminStories,
  rotateStory,
  runCollectorNow,
  setStoryHidden,
  type AdminData,
} from "@/lib/stories.functions";
import { storyThumbUrl } from "@/lib/stories-core";

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

function AdminPage() {
  const { key } = Route.useSearch();
  const initial = Route.useLoaderData() as AdminData;
  const [data, setData] = useState<AdminData>(initial);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const toggle = async (id: string, hidden: boolean) => {
    setBusy(id);
    try {
      setData(await setStoryHidden({ data: { key, id, hidden } }));
    } catch (e) {
      setMsg(String((e as Error).message));
    }
    setBusy(null);
  };
  const rotate = async (id: string, dir: "left" | "right") => {
    setBusy("rot:" + id);
    setMsg("");
    try {
      const item = data.items.find((x) => x.id === id);
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

  const shown = data.items.filter((x) => !x.hidden).length;
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-12 sm:px-6 md:px-10">
      <p className="font-mono-label text-muted-foreground">Stories admin · storage: {data.storage}</p>
      <div className="mt-4 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
        <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
          <span className="text-accent">{shown}</span> visible of {data.items.length}
        </h1>
        <button
          type="button"
          onClick={run}
          disabled={busy !== null}
          className="rounded-full bg-accent px-4 py-2 font-mono-label text-xs text-background disabled:opacity-50"
        >
          {busy === "run" ? "Running..." : "Run collector now"}
        </button>
      </div>
      {msg && <p className="mt-4 font-mono-label text-xs text-muted-foreground">{msg}</p>}
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {data.items.map((s) => (
          <li key={s.id} className="flex flex-col gap-2 border border-border p-2">
            <img
              src={storyThumbUrl(s)}
              alt=""
              width={s.w}
              height={s.h}
              loading="lazy"
              className={"aspect-[9/16] w-full object-cover " + (s.hidden ? "opacity-30" : "")}
            />
            <p className="font-mono-label text-[10px] text-muted-foreground">
              {s.ts.slice(0, 10)} · {s.src}
              {s.kind === "video" ? " · video" : ""}
            </p>
            <button
              type="button"
              disabled={busy !== null}
              onClick={() => toggle(s.id, !s.hidden)}
              className="border border-foreground/30 px-2 py-1 font-mono-label text-xs hover:border-accent hover:text-accent disabled:opacity-50"
            >
              {s.hidden ? "Show" : "Hide"}
            </button>
            <div className="flex gap-2">
              {(["left", "right"] as const).map((dir) => (
                <button
                  key={dir}
                  type="button"
                  disabled={busy !== null || s.kind === "video"}
                  title={s.kind === "video" ? "Videos can't be rotated here" : undefined}
                  aria-label={dir === "left" ? "Rotate left" : "Rotate right"}
                  onClick={() => rotate(s.id, dir)}
                  className="flex-1 border border-foreground/30 px-2 py-1 font-mono-label text-xs hover:border-accent hover:text-accent disabled:opacity-50"
                >
                  {dir === "left" ? "⟲ 90°" : "⟳ 90°"}
                </button>
              ))}
            </div>
            {busy === "rot:" + s.id && <p className="font-mono-label text-[10px] text-muted-foreground">Rotating…</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}
