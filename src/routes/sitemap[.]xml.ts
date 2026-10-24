import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "@/lib/seo";
import { SERVICES } from "@/lib/services";
import { CITIES } from "@/lib/cities";
import { CASE_STUDIES } from "@/lib/case-studies";
import { GALLERY } from "@/lib/gallery";
import { localizedPath } from "@/lib/locale-path";

type Entry = {
  path: string;
  changefreq: string;
  priority: string;
  images?: Array<{ loc: string; title?: string }>;
};

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const abs = (p: string) => `${SITE_URL}${p}`;

function entries(): Entry[] {
  const list: Entry[] = [
    {
      path: "/",
      changefreq: "monthly",
      priority: "1.0",
      images: [{ loc: abs("/og-hero.jpg"), title: "Moments by Ganesh Partheeban, Candid Photographer" }],
    },
    { path: "/about", changefreq: "yearly", priority: "0.7" },
    { path: "/services", changefreq: "monthly", priority: "0.8" },
    { path: "/contact", changefreq: "yearly", priority: "0.9" },
    { path: "/press", changefreq: "monthly", priority: "0.6" },
  ];
  for (const s of SERVICES) {
    list.push({ path: `/services/${s.slug}`, changefreq: "monthly", priority: "0.8" });
  }
  for (const c of CITIES) {
    list.push({ path: `/photographer-in/${c.slug}`, changefreq: "monthly", priority: "0.7" });
  }
  for (const st of CASE_STUDIES) {
    const nums = Array.from(new Set([st.cover, ...st.sequence]));
    list.push({
      path: `/work/${st.slug}`,
      changefreq: "yearly",
      priority: "0.7",
      images: nums
        .filter((n) => GALLERY[n - 1])
        .map((n) => ({ loc: abs(`/gallery-full/g${n}.jpg`), title: st.title })),
    });
  }
  return list;
}

export function buildSitemap(): string {
  const urls: string[] = [];
  for (const e of entries()) {
    const en = abs(localizedPath("en", e.path));
    const ta = abs(localizedPath("ta", e.path));
    const alternates = [
      `    <xhtml:link rel="alternate" hreflang="en" href="${esc(en)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="ta" href="${esc(ta)}"/>`,
      `    <xhtml:link rel="alternate" hreflang="x-default" href="${esc(en)}"/>`,
    ].join("\n");
    const images = (e.images ?? [])
      .map(
        (i) =>
          `    <image:image>\n      <image:loc>${esc(i.loc)}</image:loc>${
            i.title ? `\n      <image:title>${esc(i.title)}</image:title>` : ""
          }\n    </image:image>`,
      )
      .join("\n");
    for (const loc of [en, ta]) {
      urls.push(
        [
          "  <url>",
          `    <loc>${esc(loc)}</loc>`,
          `    <changefreq>${e.changefreq}</changefreq>`,
          `    <priority>${e.priority}</priority>`,
          alternates,
          images,
          "  </url>",
        ]
          .filter(Boolean)
          .join("\n"),
      );
    }
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls.join("\n")}
</urlset>
`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () =>
        new Response(buildSitemap(), {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        }),
    },
  },
});
