import { Link } from "@tanstack/react-router";
import { ArrowUpRight, MapPin } from "@/components/icons";
import { CITIES } from "@/lib/cities";
import { localizeAll } from "@/lib/localize";
import { useI18n } from "@/lib/i18n";
import type { Faq } from "@/lib/services";

/** Native-style FAQ list using <details>, so it works without JS. */
export function FaqList({ faqs }: { faqs: Faq[] }) {
  return (
    <div className="border-t border-border">
      {faqs.map((f) => (
        <details key={f.q} className="group border-b border-border py-5 md:py-6">
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 font-display text-xl leading-snug tracking-tight marker:content-none md:text-2xl [&::-webkit-details-marker]:hidden">
            <span>{f.q}</span>
            <span
              aria-hidden
              className="mt-1 shrink-0 font-mono-label text-accent transition-transform group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <p className="mt-4 max-w-3xl text-muted-foreground md:text-lg">{f.a}</p>
        </details>
      ))}
    </div>
  );
}

/** "Where I shoot" list of city links. */
export function CityLinks({ compact = false, title }: { compact?: boolean; title?: string }) {
  const { t, locale } = useI18n();
  const cities = localizeAll(CITIES, locale);
  return (
    <div>
      <p className="inline-flex items-center gap-2 font-mono-label text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 text-accent" />
        {title ?? t("seo.whereIShoot")}
      </p>
      <ul
        className={
          "mt-6 grid gap-px overflow-hidden border border-border bg-border sm:grid-cols-2 " +
          (compact ? "lg:grid-cols-3" : "lg:grid-cols-3")
        }
      >
        {cities.map((c) => (
          <li key={c.slug} className="bg-background">
            <Link
              to="/photographer-in/$city"
              params={{ city: c.slug }}
              className="group flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-accent/[0.05] sm:px-6 sm:py-5"
            >
              <span>
                <span className="block font-display text-lg leading-tight text-foreground sm:text-xl">
                  {c.name}
                </span>
                <span className="mt-0.5 block font-mono-label text-[10px] text-muted-foreground">
                  {c.state}
                </span>
              </span>
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-accent" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
