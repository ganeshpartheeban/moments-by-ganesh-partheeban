import type { Locale } from "@/lib/i18n";

/**
 * Content data files (services, cities, case studies) keep English in their
 * top-level fields and may carry a `ta` object with Tamil versions of any
 * text fields. `localize()` returns the item with Tamil merged over English
 * when the locale is Tamil, so routes never branch on locale themselves.
 */
export type WithTa<T extends object> = T & { ta?: Partial<T> };

function present(v: unknown): boolean {
  if (v === undefined || v === null || v === "") return false;
  if (Array.isArray(v) && v.length === 0) return false;
  return true;
}

export function localize<I extends { ta?: object }>(item: I, locale: Locale): Omit<I, "ta"> {
  const { ta, ...rest } = item;
  if (locale !== "ta" || !ta) return rest;
  const overrides = Object.fromEntries(Object.entries(ta).filter(([, v]) => present(v)));
  return { ...rest, ...overrides } as Omit<I, "ta">;
}

export function localizeAll<I extends { ta?: object }>(
  items: ReadonlyArray<I>,
  locale: Locale,
): Array<Omit<I, "ta">> {
  return items.map((i) => localize(i, locale));
}
