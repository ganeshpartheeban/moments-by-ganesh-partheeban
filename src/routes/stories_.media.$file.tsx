import { createFileRoute } from "@tanstack/react-router";
import { MEDIA_FILE_RE } from "@/lib/stories-core";
import { getStore } from "@/server/stories-store";

const notFoundRes = () => new Response("Not found", { status: 404 });

export const Route = createFileRoute("/stories_/media/$file")({
  server: {
    handlers: {
      GET: async ({ params }: { params: { file: string } }) => {
        const file = params.file;
        if (!MEDIA_FILE_RE.test(file)) return notFoundRes();
        const store = await getStore();
        if (!store) return notFoundRes();
        const obj = await store.getObject(`media/${file}`);
        if (!obj) return notFoundRes();
        return new Response(obj.body, {
          headers: {
            "Content-Type": file.endsWith(".mp4") ? "video/mp4" : "image/jpeg",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
