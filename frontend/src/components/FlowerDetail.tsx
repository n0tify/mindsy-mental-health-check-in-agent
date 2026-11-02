"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { moodEmoji, moodLabel, PLANT_LABELS, TAG_LABELS } from "@/lib/moods";
import type { GardenPlant, MoodEntry } from "@/lib/types";

type Props = {
  plant: GardenPlant;
  entry: MoodEntry | null;
  onClose: () => void;
};

const GROWTH_COPY: Record<GardenPlant["growth"], string> = {
  seedling: "A new seedling — planted in the last day.",
  growing: "Growing steadily, a few days in.",
  bloom: "In full bloom, from a check-in over a week old.",
};

export function FlowerDetail({ plant, entry, onClose }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close flower details"
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-ink/25 backdrop-blur-sm"
        tabIndex={-1}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="flower-detail-title"
        className="relative z-10 w-full max-w-lg rounded-[2rem] border border-white/80 bg-gradient-to-b from-white via-lavender-50 to-blush-50 p-6 shadow-lift sm:p-8"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full border border-white/80 bg-white/80 p-2 text-muted transition hover:text-ink hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lavender-300"
          aria-label="Close"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <p className="m-eyebrow">{PLANT_LABELS[plant.plantType] ?? "Bloom"}</p>
        <h2 id="flower-detail-title" className="mt-3 text-3xl font-semibold leading-tight text-ink">
          {moodEmoji(entry.primary_mood)} {moodLabel(entry.primary_mood)}
        </h2>
        <p className="mt-1 text-sm text-muted">{formatDateTime(entry.created_at)}</p>
        <p className="mt-3 text-sm italic text-muted">{GROWTH_COPY[plant.growth]}</p>

        <div className="mt-5 space-y-4 text-base">
          <div>
            <p className="m-label mb-1">Feelings named</p>
            <ul className="flex flex-wrap gap-2">
              {entry.emotions.map((emotion) => (
                <li
                  key={emotion}
                  className="rounded-full border border-white/80 bg-white/80 px-3 py-1 text-sm text-ink shadow-soft"
                >
                  {moodEmoji(emotion)} {moodLabel(emotion)}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-wrap gap-6">
            <div>
              <p className="m-label mb-1">Energy</p>
              <p className="capitalize">{entry.energy}</p>
            </div>
            <div>
              <p className="m-label mb-1">Source</p>
              <p>{entry.source === "guest" ? "This browser (guest)" : "Your account"}</p>
            </div>
          </div>

          {entry.tags.length > 0 ? (
            <div>
              <p className="m-label mb-1">Tags</p>
              <ul className="flex flex-wrap gap-2">
                {entry.tags.map((tag) => (
                  <li
                    key={tag}
                    className="rounded-full bg-mint-100/90 px-3 py-1 text-sm text-ink"
                  >
                    {TAG_LABELS[tag] ?? tag}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div>
            <p className="m-label mb-1">What was on your mind</p>
            {entry.note ? (
              <p className="max-h-48 overflow-y-auto whitespace-pre-line rounded-2xl border border-white/80 bg-white/70 p-4 text-base leading-relaxed text-ink">
                {entry.note}
              </p>
            ) : (
              <p className="text-muted">No note was written with this check-in.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
