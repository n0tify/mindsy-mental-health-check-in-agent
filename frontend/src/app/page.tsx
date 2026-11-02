import Link from "next/link";
import {
  BookHeart,
  Brain,
  CloudSun,
  Flower2,
  HeartHandshake,
  LifeBuoy,
  MessageCircleHeart,
  Sparkles,
  Wind,
} from "lucide-react";

import { Flower } from "@/components/Flower";
import { GuestNote } from "@/components/GuestNote";
import { buildGarden } from "@/lib/garden";
import type { MoodEntry } from "@/lib/types";

const SAMPLE_ENTRIES: MoodEntry[] = [
  { id: "sample-checkin-1", created_at: "2026-09-12T09:20:00Z", primary_mood: "happy", emotions: ["happy"], energy: "high", note: null, tags: [], source: "guest" },
  { id: "sample-checkin-2", created_at: "2026-09-18T18:05:00Z", primary_mood: "calm", emotions: ["calm", "hopeful"], energy: "medium", note: null, tags: [], source: "guest" },
  { id: "sample-checkin-3", created_at: "2026-09-24T20:40:00Z", primary_mood: "loved", emotions: ["loved"], energy: "medium", note: null, tags: [], source: "guest" },
  { id: "sample-checkin-4", created_at: "2026-10-02T08:15:00Z", primary_mood: "anxious", emotions: ["anxious", "confused"], energy: "low", note: null, tags: [], source: "guest" },
  { id: "sample-checkin-5", created_at: "2026-10-11T13:30:00Z", primary_mood: "hopeful", emotions: ["hopeful", "calm"], energy: "high", note: null, tags: [], source: "guest" },
];

const samplePlants = buildGarden(SAMPLE_ENTRIES);

const FEATURES = [
  {
    href: "/journal",
    title: "Journal",
    copy: "A private place for the longer thoughts, with search, editing and quiet reflection.",
    icon: BookHeart,
    tint: "bg-peach-100/80",
  },
  {
    href: "/joy-deck",
    title: "Joy Deck",
    copy: "Draw a small, kind, actually doable card when you need somewhere to start.",
    icon: Sparkles,
    tint: "bg-butter-100/80",
  },
  {
    href: "/breathe",
    title: "Breathe",
    copy: "A guided breathing shape that slows down with you. Reduced-motion friendly.",
    icon: Wind,
    tint: "bg-sky-100/80",
  },
  {
    href: "/weather",
    title: "Mood Weather",
    copy: "Your recent emotional atmosphere, described as weather instead of a score.",
    icon: CloudSun,
    tint: "bg-lavender-100/80",
  },
  {
    href: "/gratitude",
    title: "Gratitude Wall",
    copy: "Small good things, collected on soft notes you can pin up and revisit.",
    icon: HeartHandshake,
    tint: "bg-blush-100/80",
  },
  {
    href: "/companion",
    title: "Companion",
    copy: "A supportive listener with transparent limits and no pretend diagnosis.",
    icon: MessageCircleHeart,
    tint: "bg-mint-100/80",
  },
];

export default function HomePage() {
  return (
    <div className="space-y-14">
      <section className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/45 px-5 py-10 shadow-soft backdrop-blur-md sm:px-9 sm:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="m-fade-up">
            <p className="m-eyebrow">
              <Flower2 className="h-4 w-4" aria-hidden="true" />
              emotional check-ins · living garden
            </p>
            <h1 className="mt-5 text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
              How are you feeling today?
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted sm:text-xl">
              Mindsy is a soft, colourful place to name what&apos;s going on. Every check-in plants
              something in your Living Garden, so your emotional history becomes something you can
              actually see growing.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/checkin" className="m-btn-primary">
                Begin your check-in
              </Link>
              <Link href="/garden" className="m-btn-secondary">
                Explore Mindsy
              </Link>
            </div>
            <p className="mt-4 text-sm text-muted">
              No account needed to start. Guest check-ins stay in this browser until you want to keep
              them.
            </p>
          </div>

          <div className="relative">
            <div className="relative h-[300px] overflow-hidden rounded-[2rem] border border-white/80 bg-gradient-to-b from-[#EFE8FF] via-[#FFF1F7] to-[#E9F8F0] shadow-lift">
              <div className="absolute right-6 top-5 h-12 w-12 rounded-full bg-gradient-to-br from-butter-100 to-peach-200 shadow-[0_0_40px_rgba(255,236,168,0.85)]" />
              <div className="pointer-events-none absolute left-6 top-10 h-8 w-24 rounded-full bg-white/70" />
              <div className="pointer-events-none absolute left-1/2 top-16 h-6 w-16 rounded-full bg-white/60" />
              <svg
                viewBox="0 0 800 320"
                preserveAspectRatio="none"
                aria-hidden="true"
                className="absolute bottom-0 left-0 h-[58%] w-full"
              >
                <path d="M0 150 C 110 96 190 184 300 140 C 410 96 500 174 610 134 C 700 102 760 140 800 150 L800 320 L0 320 Z" fill="#D8EFE1" />
                <path d="M0 210 C 120 162 230 246 350 206 C 470 166 555 236 675 202 C 735 186 775 206 800 214 L800 320 L0 320 Z" fill="#BFE9D2" />
                <path d="M0 262 C 145 228 255 292 395 262 C 535 230 645 290 800 258 L800 320 L0 320 Z" fill="#A6DDBD" />
              </svg>
              {samplePlants.map((plant) => (
                <div
                  key={plant.entryId}
                  className="absolute origin-bottom"
                  style={{
                    left: `${plant.x}%`,
                    bottom: `${100 - plant.y}%`,
                    zIndex: 10 + plant.zIndex,
                    transform: `translateX(-50%) scale(${plant.scale * 0.62})`,
                  }}
                >
                  <Flower plant={plant} />
                </div>
              ))}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full border border-white/80 bg-white/85 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-muted shadow-soft">
                a garden grown from five feelings
              </div>
            </div>

            <div className="pointer-events-none absolute -left-3 top-4 animate-bob rounded-full border border-white/80 bg-butter-100/95 px-3 py-1.5 text-sm shadow-soft">
              😊 happy
            </div>
            <div className="pointer-events-none absolute -right-2 bottom-16 animate-bob rounded-full border border-white/80 bg-blush-100/95 px-3 py-1.5 text-sm shadow-soft [animation-delay:-2s]">
              🥰 loved
            </div>
            <div className="pointer-events-none absolute -left-1 bottom-6 animate-bob rounded-full border border-white/80 bg-sky-100/95 px-3 py-1.5 text-sm shadow-soft [animation-delay:-4s]">
              😟 anxious
            </div>
          </div>
        </div>
      </section>

      <GuestNote context="anything you write here" />

      <section aria-labelledby="how-it-works">
        <h2 id="how-it-works" className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Three gentle steps
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              step: "01",
              title: "Check in honestly",
              copy: "Pick as many feelings as are actually there, set your energy, and write as little or as much as you want.",
              tone: "from-lavender-100/90 to-white",
              border: "border-lavender-100",
            },
            {
              step: "02",
              title: "Watch it grow",
              copy: "Each check-in becomes one stable flower in your Living Garden. It never duplicates and it never moves.",
              tone: "from-mint-100/90 to-white",
              border: "border-mint-100",
            },
            {
              step: "03",
              title: "Notice patterns",
              copy: "Insights and Mood Weather show themes without ever pretending to diagnose you.",
              tone: "from-sky-100/90 to-white",
              border: "border-sky-100",
            },
          ].map((item) => (
            <article
              key={item.step}
              className={`rounded-[2rem] border ${item.border} bg-gradient-to-b ${item.tone} p-6 shadow-soft`}
            >
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">{item.step}</p>
              <h3 className="mt-3 text-2xl font-semibold text-ink">{item.title}</h3>
              <p className="mt-2 leading-relaxed text-muted">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="garden-preview">
        <div className="rounded-[2.5rem] border border-white/70 bg-gradient-to-br from-white/80 via-lavender-50 to-blush-50 p-6 shadow-soft sm:p-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="m-eyebrow">signature feature</p>
              <h2 id="garden-preview" className="mt-3 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
                The Living Garden
              </h2>
              <p className="mt-3 text-lg leading-relaxed text-muted">
                A contained, pastel garden where each feeling becomes a plant. Every flower is drawn
                from your own check-ins, and every flower remembers exactly where it grew.
              </p>
            </div>
            <Link href="/garden" className="m-btn-secondary">
              Visit the garden
            </Link>
          </div>

          <ul className="mt-6 grid gap-3 text-sm text-muted sm:grid-cols-3">
            <li className="rounded-2xl bg-white/70 px-4 py-3 shadow-soft">
              🌻 Happy becomes a sunflower. Calm becomes lavender.
            </li>
            <li className="rounded-2xl bg-white/70 px-4 py-3 shadow-soft">
              🌱 New check-ins start as seedlings and open over time.
            </li>
            <li className="rounded-2xl bg-white/70 px-4 py-3 shadow-soft">
              🌸 Three or more feelings at once grow a mixed blossom.
            </li>
          </ul>
        </div>
      </section>

      <section aria-labelledby="explore">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="explore" className="text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Everything else in Mindsy
          </h2>
          <Link href="/support" className="m-btn-quiet">
            Need support instead? <LifeBuoy className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.href}
                href={feature.href}
                className="group rounded-[2rem] border border-white/70 bg-white/60 p-6 shadow-soft backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:bg-white/80 hover:shadow-lift"
              >
                <span className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl ${feature.tint} text-ink shadow-soft`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-2xl font-semibold text-ink">{feature.title}</h3>
                <p className="mt-2 leading-relaxed text-muted">{feature.copy}</p>
                <span className="mt-4 inline-block text-sm text-lavender-300 transition group-hover:translate-x-1 group-hover:text-ink">
                  Open →
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-[2.5rem] border border-white/70 bg-white/60 p-6 shadow-soft sm:p-9">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight text-ink">Guest first, always</h2>
            <p className="mt-3 leading-relaxed text-muted">
              Mindsy works immediately. Guests can check in, journal, breathe, draw Joy Deck cards and
              grow a garden. Nothing is locked behind an account — an account simply keeps your
              history safe and gives it a home beyond this browser.
            </p>
          </div>
          <div className="rounded-[1.75rem] border border-mint-100 bg-mint-50/80 p-5">
            <p className="flex items-start gap-3 text-base leading-relaxed text-ink">
              <Brain className="mt-1 h-5 w-5 shrink-0 text-mint-300" aria-hidden="true" />
              <span>
                Mindsy never diagnoses. It uses language like &ldquo;you may have noticed more
                anxious check-ins recently&rdquo;, never &ldquo;you have anxiety&rdquo;.
              </span>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
