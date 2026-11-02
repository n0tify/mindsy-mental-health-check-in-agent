"use client";

import { useMemo, useState } from "react";

import { FlowerDetail } from "./FlowerDetail";
import { Flower } from "./Flower";
import { moodLabel } from "@/lib/moods";
import type { GardenPlant, MoodEntry } from "@/lib/types";

type Props = {
  plants: GardenPlant[];
  entries: MoodEntry[];
};

/**
 * The Living Garden scene.
 *
 * Plants are absolutely positioned inside a `relative overflow-hidden`
 * container, anchored to the ground by their derived y value. Nothing is
 * randomised at render time, so a refresh always reproduces the same garden.
 */
export function GardenScene({ plants, entries }: Props) {
  const [selected, setSelected] = useState<GardenPlant | null>(null);
  const entriesById = useMemo(
    () => new Map(entries.map((entry) => [entry.id, entry])),
    [entries],
  );
  const selectedEntry = selected ? entriesById.get(selected.entryId) ?? null : null;

  return (
    <>
      <div className="relative h-[520px] w-full overflow-hidden rounded-[2.5rem] border border-white/70 shadow-lift sm:h-[600px]">
        {/* sky */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#EFE8FF] via-[#FFF0F7] to-[#EAF8F1]" />
        <div className="absolute left-[8%] top-[8%] h-24 w-24 rounded-full bg-butter-200/70 blur-2xl" />
        <div className="absolute right-[14%] top-[16%] h-16 w-16 rounded-full bg-blush-200/60 blur-xl" />

        {/* sun */}
        <div className="absolute right-[10%] top-[8%] h-16 w-16 rounded-full bg-gradient-to-br from-butter-100 to-peach-200 shadow-[0_0_60px_rgba(255,236,168,0.9)]" />

        {/* drifting clouds */}
        <div className="pointer-events-none absolute left-[12%] top-[20%] h-10 w-32 animate-drift rounded-full bg-white/70 blur-[2px]" />
        <div className="pointer-events-none absolute left-[46%] top-[12%] h-8 w-24 animate-drift rounded-full bg-white/60 blur-[2px] [animation-delay:-7s]" />

        {/* hills */}
        <svg
          viewBox="0 0 800 320"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[52%] w-full"
        >
          <path
            d="M0 138 C 110 88 190 176 300 132 C 410 88 500 166 610 126 C 700 94 760 132 800 142 L800 320 L0 320 Z"
            fill="#D8EFE1"
          />
          <path
            d="M0 196 C 120 148 230 232 350 192 C 470 152 555 222 675 188 C 735 172 775 192 800 202 L800 320 L0 320 Z"
            fill="#BFE9D2"
          />
          <path
            d="M0 254 C 145 220 255 286 395 254 C 535 222 645 284 800 250 L800 320 L0 320 Z"
            fill="#A6DDBD"
          />
        </svg>

        {/* grass texture, purely decorative */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 h-[34%] w-full opacity-60"
          style={{
            backgroundImage:
              "radial-gradient(circle at 12% 78%, rgba(255,255,255,0.7) 0 3px, transparent 4px), radial-gradient(circle at 38% 62%, rgba(255,255,255,0.55) 0 2px, transparent 3px), radial-gradient(circle at 68% 84%, rgba(255,255,255,0.6) 0 3px, transparent 4px), radial-gradient(circle at 88% 58%, rgba(255,255,255,0.5) 0 2px, transparent 3px)",
            backgroundSize: "220px 140px",
          }}
        />

        {/* plants */}
        {plants.map((plant) => {
          const entry = entriesById.get(plant.entryId);
          return (
            <button
              key={plant.entryId}
              type="button"
              onClick={() => setSelected(plant)}
              aria-label={`Open details for the ${moodLabel(entry?.primary_mood)} check-in`}
              className="absolute origin-bottom rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-300 focus-visible:ring-offset-2"
              style={{
                left: `${plant.x}%`,
                bottom: `${100 - plant.y}%`,
                zIndex: 10 + plant.zIndex,
                transform: `translateX(-50%) scale(${plant.scale})`,
              }}
            >
              <span className="group relative block origin-bottom transition-transform duration-300 hover:-translate-y-1.5">
                <Flower plant={plant} />
                <span className="pointer-events-none absolute bottom-full left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full border border-white/80 bg-white/90 px-3 py-1 text-xs text-ink shadow-soft group-hover:block">
                  {moodLabel(entry?.primary_mood)}
                </span>
              </span>
            </button>
          );
        })}

        {/* foreground haze so plants sit inside the scene */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-mint-200/60 to-transparent" />
      </div>

      {selected && selectedEntry ? (
        <FlowerDetail plant={selected} entry={selectedEntry} onClose={() => setSelected(null)} />
      ) : null}
    </>
  );
}
