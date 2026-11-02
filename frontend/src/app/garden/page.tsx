"use client";

import Link from "next/link";

import { GardenScene } from "@/components/GardenScene";
import { GuestNote } from "@/components/GuestNote";
import { PageHeader } from "@/components/PageHeader";
import { useMindsy } from "@/components/MindsyProvider";
import { MOOD_PLANTS, MOODS, PLANT_LABELS } from "@/lib/moods";

export default function GardenPage() {
  const { plants, entries, ready, isGuest } = useMindsy();

  const blooms = plants.filter((plant) => plant.growth === "bloom").length;
  const growing = plants.length - blooms;

  return (
    <div>
      <PageHeader
        eyebrow="living garden"
        title="Your feelings, growing"
        description="Every check-in becomes one plant. Its species comes from your dominant feeling, and its place in the garden never changes."
      >
        <Link href="/checkin" className="m-btn-primary">
          Plant a feeling
        </Link>
      </PageHeader>

      {isGuest ? <GuestNote context="your garden" /> : null}

      {!ready ? (
        <div className="m-card text-center text-muted">Gathering your garden…</div>
      ) : plants.length === 0 ? (
        <div className="rounded-[2.5rem] border border-white/70 bg-gradient-to-b from-white via-lavender-50 to-mint-50 p-10 text-center shadow-lift sm:p-16">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-mint-100 via-blush-100 to-lavender-100 text-4xl shadow-soft">
            🌱
          </div>
          <h2 className="mt-6 text-3xl font-semibold text-ink sm:text-4xl">
            Your garden is waiting for its first feeling.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-lg leading-relaxed text-muted">
            Every emotion you acknowledge can become part of your story. There is no right feeling
            to start with.
          </p>
          <Link href="/checkin" className="m-btn-primary mt-7">
            Plant your first feeling
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white/90 to-lavender-50 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Plants</p>
              <p className="mt-1 text-3xl font-semibold text-ink">{plants.length}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white/90 to-mint-50 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">In full bloom</p>
              <p className="mt-1 text-3xl font-semibold text-ink">{blooms}</p>
            </div>
            <div className="rounded-3xl border border-white/70 bg-gradient-to-b from-white/90 to-blush-50 p-4 shadow-soft">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">Still growing</p>
              <p className="mt-1 text-3xl font-semibold text-ink">{growing}</p>
            </div>
          </div>

          <GardenScene plants={plants} entries={entries} />

          <p className="mt-3 text-center text-sm text-muted">
            Tap any plant to revisit that check-in. Positions and species are derived from the
            check-in itself, so refreshing never reshuffles your garden.
          </p>
        </>
      )}

      <section aria-labelledby="garden-legend" className="mt-10">
        <h2 id="garden-legend" className="text-2xl font-semibold text-ink">
          Which feeling grows what
        </h2>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {MOODS.map((mood) => (
            <li
              key={mood.key}
              className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm shadow-soft"
            >
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: mood.color }}
                aria-hidden="true"
              />
              <span className="text-ink">{mood.label}</span>
              <span className="ml-auto text-muted">
                {PLANT_LABELS[MOOD_PLANTS[mood.key]]}
              </span>
            </li>
          ))}
          <li className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/60 px-4 py-2.5 text-sm shadow-soft">
            <span className="h-3.5 w-3.5 shrink-0 rounded-full bg-gradient-to-br from-blush-200 to-mint-200" aria-hidden="true" />
            <span className="text-ink">Three or more feelings</span>
            <span className="ml-auto text-muted">{PLANT_LABELS.blossom}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
