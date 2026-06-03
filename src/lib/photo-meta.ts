/**
 * Per-photo metadata for individual frames where the event/subject is
 * distinct from any case-study grouping. Used to:
 *   1. Generate richer alt text (boosts SEO + accessibility)
 *   2. Show per-frame captions on story pages
 *
 * Keys are 1-based gallery numbers (matching gallery-N.JPG file names).
 */

export type PhotoMeta = {
  /** Primary subject — event name, artist, brand. Always shown. */
  title: string;
  /** Additional context (e.g. occasion the event marked). */
  detail?: string;
  /** Venue. */
  venue?: string;
  /** City / place. */
  location?: string;
  /** When the photo was taken. */
  date?: string;
  /** Featured artist(s) / talent. */
  featuring?: string;
};

export const PHOTO_META: Record<number, PhotoMeta> = {
  3: {
    title: "Thrissur Pooram",
    location: "Thrissur",
    date: "2025",
  },
  7: {
    title: "Asha Makeup & Artistry",
  },
  29: {
    title: "Azhagi & Varatha",
    venue: "Coromandel Cafe",
    location: "Pondicherry",
  },
  30: {
    title: "Director Prem Kumar",
    detail: "Celebrating 1 year of Meiyazhagan",
    venue: "Zostel Anna Nagar",
    location: "Chennai",
  },
  32: {
    title: "Na. Muthukumar Concert",
    featuring: "GV Prakash & Saindhavi",
    venue: "Nehru Indoor Stadium",
    location: "Chennai",
    date: "July 2025",
  },
  33: {
    title: "The Indian Choral Ensemble",
    featuring: "Kalyani Nair",
    venue: "Victoria House",
    location: "Chennai",
    date: "2026",
  },
  34: {
    title: "The Indian Choral Ensemble",
    featuring: "Kalyani Nair",
    venue: "Victoria House",
    location: "Chennai",
    date: "2026",
  },
  35: {
    title: "Director Prem Kumar",
    detail: "Celebrating 1 year of Meiyazhagan",
    venue: "Zostel Anna Nagar",
    location: "Chennai",
  },
  44: {
    title: "Director Prem Kumar",
    detail: "Celebrating 1 year of Meiyazhagan",
    venue: "Zostel Anna Nagar",
    location: "Chennai",
  },
  13: {
    title: "Janani weds Natesa Maaran",
  },
  9: {
    title: "Swati weds Sushin",
    detail: "Haldi",
    location: "Kerala",
    date: "October 2024",
  },
  11: {
    title: "Bhavana weds Jayanth",
    detail: "Haldi",
    location: "Bengaluru",
    date: "April 2024",
  },
  22: {
    title: "Bhavana weds Jayanth",
    detail: "Haldi",
    location: "Bengaluru",
    date: "April 2024",
  },
  23: {
    title: "Bhavana weds Jayanth",
    detail: "Haldi",
    location: "Bengaluru",
    date: "April 2024",
  },
  24: {
    title: "Bhavana weds Jayanth",
    detail: "Haldi",
    location: "Bengaluru",
    date: "April 2024",
  },
  36: {
    title: "Lisha weds Ebby",
    location: "Kollam, Kerala",
  },
  40: {
    title: "Mevlin weds Nikhil",
    location: "Angamaly, Kerala",
    date: "August 2025",
  },
  38: {
    // Belongs to the Bhavana weds Jayanth story; this frame is a portrait of Manasa Gowda.
    title: "Bhavana weds Jayanth",
    detail: "Manasa Gowda",
    location: "Bengaluru",
    date: "April 2024",
  },
  43: {
    title: "Varatharajan",
    venue: "Goyo Korean Silent Restaurant",
  },
  46: {
    title: "Diwali Celebrations",
    location: "Chennai",
    date: "2024",
  },
  47: {
    title: "Seles weds Jalvin",
    venue: "Santhome Cathedral Basilica",
  },
  48: {
    title: "Seles weds Jalvin",
    venue: "Santhome Cathedral Basilica",
  },
};

/** Build an alt-text string from a PhotoMeta entry. */
export function formatPhotoMetaAlt(m: PhotoMeta): string {
  const parts: string[] = [m.title];
  if (m.detail) parts.push(m.detail);
  if (m.featuring) parts.push(`featuring ${m.featuring}`);
  const place = [m.venue, m.location].filter(Boolean).join(", ");
  if (place) parts.push(place);
  if (m.date) parts.push(m.date);
  return parts.join(" · ");
}
