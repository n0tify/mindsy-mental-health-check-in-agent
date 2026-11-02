"use client";

import Link from "next/link";
import { useState } from "react";
import { Trash2 } from "lucide-react";

import { GuestNote } from "@/components/GuestNote";
import { PageHeader } from "@/components/PageHeader";
import { useMindsy } from "@/components/MindsyProvider";
import { extractErrorMessage, formatDate, relativeTime } from "@/lib/format";
import { buildInsights } from "@/lib/insights";
import { moodEmoji, moodLabel } from "@/lib/moods";

export default function InsightsPage() {
  const { entries, ready, isGuest, deleteEntry } = useMindsy();
  const [error, setError] = useState<string | null>(null);
  const insights = buildInsights(entries);
  const maxDay = Math.max(...insights.timeline.map((point) => point.count), 1);

  async function removeEntry(entryId: string) {
    if (!window.confirm("Remove this check-in? Its flower will leave the garden too.")) return;
    setError(null);
    try {
      await deleteEntry(entryId);
    } catch (caught) {
      setError(extractErrorMessage(caught));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="insights"
        title="Patterns, not verdicts"
        description="A gentle summary of what your check-ins have contained. Mindsy describes patterns — it never diagnoses."
      >
        <Link href="/checkin" className="m-btn-secondary">
          Add a check-in
        </Link>
      </PageHeader>

      {isGuest ? <GuestNote context="your history" /> : null}

      {!ready ? (
        <div className="m-card text-center text-muted">Reading your check-ins…</div>
      ) : entries.length === 0 ? (
        <div className="rounded-[2.5rem] border border-white/70 bg-white/65 p-10 text-center shadow-soft sm:p-14">
          <p className="text-5xl" aria-hidden="true">
            📊
          </p>
          <h2 className="mt-5 text-3xl font-semibold text-ink">Nothing to summarise yet</h2>
          <p className="mx-auto mt-3 max-w-xl text-lg text-muted">
            Insights appear after your first check-in. There is no minimum streak and no target to
            hit — one entry is enough to start.
          </p>
          <Link href="/checkin" className="m-btn-primary mt-6">
            Do a check-in
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: "Check-ins", value: String(insights.total), tone: "from-white/90 to-lavender-50" },
              { label: "This week", value: String(insights.checkInsThisWeek), tone: "from-white/90 to-mint-50" },
              { label: "Current streak", value: `${insights.streakDays} day${insights.streakDays === 1 ? "" : "s"}`, tone: "from-white/90 to-sky-50" },
              { label: "Energy", value: insights.averageEnergy ?? "—", tone: "from-white/90 to-blush-50" },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-3xl border border-white/70 bg-gradient-to-b ${stat.tone} p-5 shadow-soft`}
              >
                <p className="text-xs uppercase tracking-[0.18em] text-muted">{stat.label}</p>
                <p className="mt-2 text-2xl font-semibold text-ink">{stat.value}</p>
              </div>
            ))}
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className="m-card" aria-labelledby="mood-distribution">
              <h2 id="mood-distribution" className="text-2xl font-semibold text-ink">
                Mood distribution
              </h2>
              <p className="mt-1 text-sm text-muted">Based on the dominant feeling of each check-in.</p>
              <ul className="mt-5 space-y-3">
                {insights.moodCounts.map((mood) => (
                  <li key={mood.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-ink">
                        {moodEmoji(mood.key)} {mood.label}
                      </span>
                      <span className="text-muted">
                        {mood.count} · {mood.percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${Math.max(mood.percent, 3)}%`, backgroundColor: mood.color }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className="m-card" aria-labelledby="energy-split">
              <h2 id="energy-split" className="text-2xl font-semibold text-ink">
                Energy
              </h2>
              <p className="mt-1 text-sm text-muted">What you had available, not what you achieved.</p>
              <ul className="mt-5 space-y-3">
                {insights.energyCounts.map((energy) => (
                  <li key={energy.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-ink">{energy.label}</span>
                      <span className="text-muted">
                        {energy.count} · {energy.percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/70">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-200 to-lavender-200"
                        style={{ width: `${Math.max(energy.percent, 3)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 text-lg font-semibold text-ink">Top feeling</h3>
              <p className="mt-1 text-muted">
                {insights.topEmotion
                  ? `${insights.topEmotion.label} — ${insights.topEmotion.count} of ${insights.total} check-ins`
                  : "No dominant feeling yet — that's a pattern too."}
              </p>
            </section>
          </div>

          <section className="m-card" aria-labelledby="timeline">
            <h2 id="timeline" className="text-2xl font-semibold text-ink">
              The last fourteen days
            </h2>
            <p className="mt-1 text-sm text-muted">Each bar is a day. Empty days are information, not failure.</p>
            <div className="mt-6 flex items-end gap-1.5 sm:gap-2" role="img" aria-label="Check-ins per day over the last fourteen days">
              {insights.timeline.map((point) => (
                <div key={point.day} className="group flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-32 w-full items-end">
                    <div
                      className="w-full rounded-t-xl bg-gradient-to-t from-lavender-200 to-blush-100 transition-all duration-300 group-hover:from-lavender-300"
                      style={{ height: `${Math.max((point.count / maxDay) * 100, point.count > 0 ? 18 : 4)}%` }}
                      title={`${point.label}: ${point.count} check-in${point.count === 1 ? "" : "s"}`}
                    />
                  </div>
                  <span className="text-[0.65rem] text-muted">{point.label.split(" ")[1]}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] border border-mint-100 bg-gradient-to-b from-mint-50/90 to-white p-6 shadow-soft">
            <h2 className="text-2xl font-semibold text-ink">What this might mean</h2>
            <ul className="mt-4 space-y-3">
              {insights.observations.map((observation) => (
                <li key={observation} className="flex gap-3 leading-relaxed text-muted">
                  <span aria-hidden="true">🌿</span>
                  <span>{observation}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm italic text-muted">
              These are observations from your own words, not a clinical assessment.
            </p>
          </section>

          <section aria-labelledby="recent-checkins">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 id="recent-checkins" className="text-2xl font-semibold text-ink">
                Recent check-ins
              </h2>
              <Link href="/garden" className="m-btn-quiet">
                See them in the garden
              </Link>
            </div>

            {error ? (
              <p role="alert" className="mt-3 rounded-2xl border border-blush-200 bg-blush-100/80 px-4 py-3 text-sm">
                {error}
              </p>
            ) : null}

            <ul className="mt-4 space-y-2">
              {entries.slice(0, 12).map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/70 bg-white/65 px-4 py-3 shadow-soft"
                >
                  <span className="text-xl" aria-hidden="true">
                    {moodEmoji(entry.primary_mood)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {moodLabel(entry.primary_mood)}
                      {entry.emotions.length > 1 ? (
                        <span className="font-normal text-muted">
                          {" "}
                          + {entry.emotions.length - 1} more
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-muted">
                      {formatDate(entry.created_at)} · {relativeTime(entry.created_at)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void removeEntry(entry.id)}
                    className="rounded-full p-2 text-muted transition hover:bg-blush-100 hover:text-ink"
                    aria-label={`Delete check-in from ${formatDate(entry.created_at)}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </div>
  );
}
