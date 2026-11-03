import type { MouseEvent } from "react";
import { displaySize, rotatedFillStyle, storyThumbUrl, type Rotation } from "@/lib/stories-core";

export type TileStory = { id: string; ts: string; kind: "image" | "video"; w: number; h: number; v?: number; rot?: Rotation };

/**
 * One tile of the stories wall: the still (poster for videos), the date and place
 * in a bottom gradient, a play badge for videos. Shared by the public wall and the
 * admin, which adds `dim`, `badge` and `selected`.
 */
export default function StoryTile({
  story,
  alt,
  label,
  dateText,
  place,
  eager,
  dim,
  badge,
  selected,
  onClick,
}: {
  story: TileStory;
  alt: string;
  /** Accessible name of the tile button. */
  label: string;
  dateText: string;
  place?: string;
  eager?: boolean;
  /** Render faded (admin: hidden stories). */
  dim?: boolean;
  /** Small text badge at the top-left (admin: "hidden", "90°"). */
  badge?: string;
  /** When a boolean, a checkbox is drawn (admin select mode). */
  selected?: boolean;
  onClick: (e: MouseEvent<HTMLButtonElement>) => void;
}) {
  const d = displaySize(story);
  const wide = d.w > d.h;
  const rotStyle = rotatedFillStyle(story.rot, wide ? 9 / 8 : 9 / 16);
  return (
    <li className={wide ? "col-span-2" : undefined} style={{ contentVisibility: "auto", containIntrinsicSize: "auto 200px 356px" }}>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={selected}
        className={
          "group relative block w-full overflow-hidden bg-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent " +
          (wide ? "aspect-[9/8]" : "aspect-[9/16]") +
          (selected ? " ring-2 ring-inset ring-accent" : "")
        }
      >
        <img
          src={storyThumbUrl(story)}
          alt={alt}
          width={story.w}
          height={story.h}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          draggable={false}
          style={rotStyle}
          className={
            (rotStyle ? "" : "h-full w-full object-cover ") +
            "transition-[transform,opacity] duration-500 group-hover:scale-[1.03] motion-reduce:transition-none" +
            (dim ? " opacity-30" : "")
          }
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 flex items-baseline gap-1.5 bg-gradient-to-t from-black/60 via-black/25 to-transparent px-2 pb-1.5 pt-7 text-left"
        >
          <time dateTime={story.ts} className="shrink-0 font-mono-label text-[9px] leading-none tracking-wider text-white/85 sm:text-[10px]">
            {dateText}
          </time>
          {place && (
            <span className="truncate font-mono-label text-[9px] leading-none tracking-wider text-white/60 sm:text-[10px]">· {place}</span>
          )}
        </span>
        {story.kind === "video" && (
          <span aria-hidden className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/55 text-[10px] text-white">
            ▶
          </span>
        )}
        {badge && (
          <span aria-hidden className="absolute left-1.5 top-1.5 bg-black/60 px-1.5 py-0.5 font-mono-label text-[9px] text-white/90">
            {badge}
          </span>
        )}
        {selected !== undefined && (
          <span
            aria-hidden
            className={
              "absolute left-1.5 flex h-5 w-5 items-center justify-center border text-xs " +
              (badge ? "top-8 " : "top-1.5 ") +
              (selected ? "border-accent bg-accent text-background" : "border-white/80 bg-black/40 text-white")
            }
          >
            {selected ? "✓" : ""}
          </span>
        )}
      </button>
    </li>
  );
}
