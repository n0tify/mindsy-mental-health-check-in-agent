"use client";

import { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

import { PageHeader } from "@/components/PageHeader";

type Phase = {
  key: string;
  label: string;
  seconds: number;
  scale: number;
  tone: string;
};

const PHASES: Phase[] = [
  { key: "inhale", label: "Breathe in", seconds: 4, scale: 1, tone: "from-lavender-100 to-sky-100" },
  { key: "hold", label: "Hold", seconds: 4, scale: 1, tone: "from-sky-100 to-mint-100" },
  { key: "exhale", label: "Breathe out", seconds: 6, scale: 0.62, tone: "from-mint-100 to-blush-100" },
  { key: "rest", label: "Rest", seconds: 2, scale: 0.62, tone: "from-blush-100 to-lavender-100" },
];

const CYCLE_SECONDS = PHASES.reduce((total, phase) => total + phase.seconds, 0);

export default function BreathePage() {
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(query.matches);
    const handler = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener("change", handler);
    return () => query.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setElapsed((value) => (value + 0.25) % CYCLE_SECONDS);
    }, 250);
    return () => window.clearInterval(timer);
  }, [running]);

  const { phase, remaining, cycle } = useMemo(() => {
    let accumulated = 0;
    let active = PHASES[0];
    let secondsLeft = PHASES[0].seconds;

    for (const candidate of PHASES) {
      if (elapsed < accumulated + candidate.seconds) {
        active = candidate;
        secondsLeft = Math.ceil(accumulated + candidate.seconds - elapsed);
        break;
      }
      accumulated += candidate.seconds;
    }

    return {
      phase: active,
      remaining: secondsLeft,
      cycle: Math.floor((elapsed + 0.001) / CYCLE_SECONDS) + 1,
    };
  }, [elapsed]);

  const scale = reducedMotion ? 1 : phase.scale;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="breathe"
        title="A slower rhythm, for a minute"
        description="Four in, four held, six out, two to rest. Follow the shape, or simply read the words and breathe however feels comfortable."
      />

      <div className="m-card">
        <div className="flex flex-col items-center">
          <div className="relative flex h-72 w-72 items-center justify-center sm:h-80 sm:w-80">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-lavender-100/70 via-blush-100/60 to-mint-100/70 blur-2xl" />
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                aria-hidden="true"
                className="absolute rounded-full border border-white/70"
                style={{
                  width: `${72 + ring * 9}%`,
                  height: `${72 + ring * 9}%`,
                  opacity: 0.6 - ring * 0.12,
                }}
              />
            ))}
            <div
              className={`flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br ${phase.tone} shadow-[0_20px_60px_-24px_rgba(120,96,160,0.65)] transition-transform ease-in-out sm:h-64 sm:w-64`}
              style={{
                transform: `scale(${scale})`,
                transitionDuration: reducedMotion ? "0ms" : `${phase.seconds}s`,
              }}
            >
              <div className="text-center">
                <p className="text-2xl font-semibold text-ink">{phase.label}</p>
                <p className="mt-1 text-5xl font-semibold text-ink/80">{remaining}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted">cycle {cycle}</p>
              </div>
            </div>
          </div>

          <p aria-live="polite" className="mt-6 text-lg text-muted">
            {running ? `${phase.label} · ${remaining} second${remaining === 1 ? "" : "s"}` : "Ready when you are."}
          </p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setRunning((value) => !value)}
              className="m-btn-primary"
            >
              {running ? <Pause className="h-4 w-4" aria-hidden="true" /> : <Play className="h-4 w-4" aria-hidden="true" />}
              {running ? "Pause" : elapsed > 0 ? "Resume" : "Start"}
            </button>
            <button
              type="button"
              onClick={() => {
                setRunning(false);
                setElapsed(0);
              }}
              className="m-btn-secondary"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Reset
            </button>
          </div>

          {reducedMotion ? (
            <p className="mt-4 text-center text-sm text-muted">
              Reduced motion is on, so the circle stays still. The words and countdown still guide
              each phase.
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">If breathing feels hard</h2>
          <p className="mt-2 leading-relaxed text-muted">
            You don&apos;t have to hold anything. Breathe naturally and let the shape be company.
            Longer exhales tend to feel easier than big inhales.
          </p>
        </div>
        <div className="rounded-3xl border border-white/70 bg-white/65 p-5 shadow-soft">
          <h2 className="text-xl font-semibold text-ink">A note on panic</h2>
          <p className="mt-2 leading-relaxed text-muted">
            Deliberate breathing is a comfort tool, not a treatment. If you feel faint or panicky,
            stop, sit down, and reach out to someone. The Support page has more.
          </p>
        </div>
      </div>
    </div>
  );
}
