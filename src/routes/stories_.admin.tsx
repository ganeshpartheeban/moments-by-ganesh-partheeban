import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  getAdminStories,
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
          </li>
        ))}
      </ul>
    </div>
  );
}
