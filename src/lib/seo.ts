/**
 * SEO helpers — site-wide constants and JSON-LD builders.
 *
 * SITE_URL can be overridden at build time with `VITE_SITE_URL`. After
 * deploying to a final domain, set it in `.env.local` so canonical links
 * and OG images resolve to absolute URLs.
 */

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ??
  "https://ganeshpartheeban.in";

export const SITE_NAME = "Moments by Ganesh Partheeban";

export const PHOTOGRAPHER = {
  name: "Ganesh Partheeban",
  role: "Candid Photographer",
  email: "ganeshpartheeban@gmail.com",
  instagram: "https://www.instagram.com/ganeshpartheeban/",
  unsplash: "https://unsplash.com/@ganeshpartheeban",
  city: "Chennai",
  region: "Tamil Nadu",
  country: "India",
};

export const KEYWORDS = [
  "candid photographer",
  "candid wedding photographer",
  "wedding photographer Chennai",
  "wedding photographer Bengaluru",
  "wedding photographer India",
  "candid wedding photography",
  "event photographer India",
  "concert photographer India",
  "behind the scenes photographer",
  "engagement photography",
  "pre-wedding photographer",
  "Tamil Nadu wedding photographer",
  "South India wedding photographer",
  "documentary wedding photography",
  "destination wedding photographer India",
];

export const absoluteUrl = (path: string): string =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

export type StructuredData = Record<string, unknown>;

/** Top-level Person + ProfessionalService schema for the home page. */
export function buildOrganizationLD(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": ["ProfessionalService", "LocalBusiness"],
    "@id": `${SITE_URL}#org`,
    name: SITE_NAME,
    alternateName: PHOTOGRAPHER.name,
    url: SITE_URL,
    image: absoluteUrl("/og-hero.jpg"),
    logo: absoluteUrl("/favicon.svg"),
    email: PHOTOGRAPHER.email,
    priceRange: "₹₹",
    founder: {
      "@type": "Person",
      "@id": `${SITE_URL}#person`,
      name: PHOTOGRAPHER.name,
      jobTitle: PHOTOGRAPHER.role,
      sameAs: [PHOTOGRAPHER.instagram, PHOTOGRAPHER.unsplash],
    },
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "State", name: "Tamil Nadu" },
      { "@type": "City", name: "Chennai" },
      { "@type": "City", name: "Bengaluru" },
      { "@type": "City", name: "Coimbatore" },
      { "@type": "City", name: "Pondicherry" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: PHOTOGRAPHER.city,
      addressRegion: PHOTOGRAPHER.region,
      addressCountry: "IN",
    },
    serviceType: [
      "Candid Wedding Photography",
      "Reception Photography",
      "Engagement & Pre-Wedding Photography",
      "Family & Cultural Event Photography",
      "Concert & Live Event Photography",
      "Behind-the-Scenes Photography",
    ],
    sameAs: [PHOTOGRAPHER.instagram, PHOTOGRAPHER.unsplash],
    knowsLanguage: ["English", "Tamil"],
  };
}

export function buildPersonLD(): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}#person`,
    name: PHOTOGRAPHER.name,
    jobTitle: PHOTOGRAPHER.role,
    url: SITE_URL,
    email: PHOTOGRAPHER.email,
    image: absoluteUrl("/apple-touch-icon.png"),
    sameAs: [PHOTOGRAPHER.instagram, PHOTOGRAPHER.unsplash],
    worksFor: { "@id": `${SITE_URL}#org` },
    address: {
      "@type": "PostalAddress",
      addressLocality: PHOTOGRAPHER.city,
      addressRegion: PHOTOGRAPHER.region,
      addressCountry: "IN",
    },
  };
}

export function buildBreadcrumbLD(
  items: Array<{ name: string; url: string }>,
): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.url),
    })),
  };
}

export function buildServiceListLD(
  services: Array<{ name: string; description: string; slug?: string }>,
): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: services.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Service",
        name: s.name,
        description: s.description,
        provider: { "@id": `${SITE_URL}#org` },
        areaServed: { "@type": "Country", name: "India" },
        url: s.slug ? absoluteUrl(`/services${s.slug}`) : absoluteUrl("/services"),
      },
    })),
  };
}

export function buildFAQLD(faqs: Array<{ q: string; a: string }>): StructuredData {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/** Serializes one JSON-LD object as the body of a `<script>` tag. */
export const ldScriptBody = (data: StructuredData): string =>
  JSON.stringify(data).replace(/</g, "\\u003c");
