import { useEffect, useState } from "react";

/**
 * Returns the active masonry column count for the current viewport.
 * `max` caps the count (e.g. story pages use 3 max for a more focused flow).
 */
export function useColumnCount(max = 4): number {
  const compute = (): number => {
    if (typeof window === "undefined") return Math.min(3, max);
    const w = window.innerWidth;
    const target = w >= 1280 ? 4 : w >= 1024 ? 3 : w >= 640 ? 2 : 1;
    return Math.min(target, max);
  };

  const [cols, setCols] = useState<number>(compute);

  useEffect(() => {
    const queries: MediaQueryList[] = [
      window.matchMedia("(min-width: 1280px)"),
      window.matchMedia("(min-width: 1024px)"),
      window.matchMedia("(min-width: 640px)"),
    ];
    const update = () =>
      setCols(
        Math.min(
          queries[0].matches ? 4 : queries[1].matches ? 3 : queries[2].matches ? 2 : 1,
          max,
        ),
      );
    queries.forEach((q) => q.addEventListener("change", update));
    return () => queries.forEach((q) => q.removeEventListener("change", update));
  }, [max]);

  return cols;
}

/**
 * Distribute items into N columns using a shortest-column-first heuristic.
 * Each item must expose width/height — its aspect ratio determines column height.
 */
export function distribute<T extends { width: number; height: number }>(
  items: T[],
  cols: number,
): Array<Array<{ photo: T; index: number }>> {
  const buckets: Array<Array<{ photo: T; index: number }>> = Array.from(
    { length: cols },
    () => [],
  );
  const heights = new Array(cols).fill(0);
  items.forEach((photo, index) => {
    let shortest = 0;
    for (let c = 1; c < cols; c++) if (heights[c] < heights[shortest]) shortest = c;
    buckets[shortest].push({ photo, index });
    heights[shortest] += photo.height / photo.width;
  });
  return buckets;
}
