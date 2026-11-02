"use client";

import Link from "next/link";

import { PageHeader } from "@/components/PageHeader";
import { useMindsy } from "@/components/MindsyProvider";
import { moodEmoji, moodLabel } from "@/lib/moods";
import { deriveWeather, type WeatherKind } from "@/lib/weather";

function WeatherArt({ kind }: { kind: WeatherKind }) {
  const showSun = kind === "sunny" || kind === "partly" || kind === "clearing";
  const showCloud = kind !== "sunny";
  const showRain = kind === "rainy" || kind === "cloudy";

  return (
    <svg viewBox="0 0 240 160" role="img" aria-label={`Illustration of ${kind} weather`} className="h-40 w-60">
      {showSun ? (
        <g>
          <circle cx={92} cy={62} r={30} fill="#FFE9A8" />
          <circle cx={92} cy={62} r={22} fill="#FFF4C9" />
          {Array.from({ length: 8 }).map((_, index) => {
            const angle = (Math.PI * 2 * index) / 8;
            return (
              <line
                key={index}
                x1={92 + Math.cos(angle) * 34}
                y1={62 + Math.sin(angle) * 34}
                x2={92 + Math.cos(angle) * 42}
                y2={62 + Math.sin(angle) * 42}
                stroke="#FFD98E"
                strokeWidth={3}
                strokeLinecap="round"
              />
            );
          })}
        </g>
      ) : null}

      {showCloud ? (
        <g>
          <ellipse cx={132} cy={92} rx={52} ry={26} fill="#FFFFFF" opacity={0.95} />
          <ellipse cx={106} cy={96} rx={28} ry={20} fill="#FFFFFF" opacity={0.95} />
          <ellipse cx={158} cy={98} rx={30} ry={20} fill="#FFFFFF" opacity={0.95} />
          <ellipse cx={132} cy={104} rx={54} ry={18} fill="#EDF3FF" opacity={0.9} />
        </g>
      ) : null}

      {showRain ? (
        <g stroke="#9FC6F2" strokeWidth={3} strokeLinecap="round">
          <line x1={112} y1={116} x2={106} y2={134} />
          <line x1={130} y1={118} x2={124} y2={138} />
          <line x1={148} y1={116} x2={142} y2={134} />
          <line x1={164} y1={114} x2={158} y2={130} />
        </g>
      ) : null}

      {kind === "clearing" ? (
        <g>
          <path d="M40 132 C 70 112 104 138 132 122" stroke="#B5E8CA" strokeWidth={5} fill="none" strokeLinecap="round" />
          <circle cx={44} cy={130} r={5} fill="#C7F0D8" />
        </g>
      ) : null}
    </svg>
  );
}

export default function WeatherPage() {
  const { entries, ready } = useMindsy();
  const weather = deriveWeather(entries);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="mood weather"
        title="Your emotional atmosphere"
        description="A metaphor for the last seven days, built from the feelings you named. Weather changes. So does this."
      />

      {!ready ? (
        <div className="m-card text-center text-muted">Reading the sky…</div>
      ) : (
        <>
          <div className={`overflow-hidden rounded-[2.5rem] border border-white/70 bg-gradient-to-br ${weather.sky} p-6 shadow-lift sm:p-10`}>
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="m-eyebrow">
                  {weather.sampleSize > 0
                    ? `${weather.sampleSize} check-in${weather.sampleSize === 1 ? "" : "s"} considered`
                    : "no recent check-ins"}
                </p>
                <h2 className="mt-4 text-4xl font-semibold leading-tight text-ink sm:text-5xl">
                  {weather.title}
                </h2>
                <p className="mt-4 text-lg leading-relaxed text-ink/80">{weather.message}</p>
              </div>
              <div className="rounded-[2rem] bg-white/50 p-4 shadow-soft backdrop-blur-sm">
                <WeatherArt kind={weather.kind} />
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/65 px-4 py-3 shadow-soft">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Dominant feeling</p>
                <p className="mt-1 text-lg text-ink">
                  {weather.dominant
                    ? `${moodEmoji(weather.dominant)} ${moodLabel(weather.dominant)}`
                    : "Not enough data yet"}
                </p>
              </div>
              <div className="rounded-2xl bg-white/65 px-4 py-3 shadow-soft">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Window</p>
                <p className="mt-1 text-lg text-ink">Last 7 days</p>
              </div>
              <div className="rounded-2xl bg-white/65 px-4 py-3 shadow-soft">
                <p className="text-xs uppercase tracking-[0.16em] text-muted">Forecast</p>
                <p className="mt-1 text-lg text-ink">Open, as always</p>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="m-card">
              <h2 className="text-xl font-semibold text-ink">How this is calculated</h2>
              <p className="mt-2 leading-relaxed text-muted">
                Mindsy looks at the dominant feeling of your most recent check-ins from the past week
                and groups them into lighter and heavier moods. No score, no grade, no prediction.
              </p>
            </div>
            <div className="m-card">
              <h2 className="text-xl font-semibold text-ink">Want a different view?</h2>
              <p className="mt-2 leading-relaxed text-muted">
                Insights shows the full distribution and timeline. The garden shows the same history
                one flower at a time.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href="/insights" className="m-btn-secondary">
                  Open insights
                </Link>
                <Link href="/garden" className="m-btn-quiet">
                  Visit garden
                </Link>
              </div>
            </div>
          </div>

          {weather.sampleSize === 0 ? (
            <div className="mt-6 rounded-3xl border border-white/70 bg-white/65 p-6 text-center shadow-soft">
              <p className="text-lg text-muted">
                There&apos;s no weather to read yet. One check-in and the sky starts to form.
              </p>
              <Link href="/checkin" className="m-btn-primary mt-4">
                Check in
              </Link>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
