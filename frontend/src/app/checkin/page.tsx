"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, Sparkles } from "lucide-react";

import { GuestNote } from "@/components/GuestNote";
import { PageHeader } from "@/components/PageHeader";
import { useMindsy } from "@/components/MindsyProvider";
import { extractErrorMessage } from "@/lib/format";
import { ENERGY_OPTIONS, MOODS, MOOD_MAP, TAGS, TAG_LABELS } from "@/lib/moods";
import type { Energy, MoodEntry, MoodKey } from "@/lib/types";

const STEPS = ["Feelings", "Energy", "Reflection", "Tags", "Plant"] as const;

export default function CheckInPage() {
  const { addEntry, isGuest } = useMindsy();

  const [step, setStep] = useState(0);
  const [emotions, setEmotions] = useState<MoodKey[]>([]);
  const [energy, setEnergy] = useState<Energy>("medium");
  const [note, setNote] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<MoodEntry | null>(null);

  function toggleEmotion(mood: MoodKey) {
    setError(null);
    setEmotions((previous) => {
      if (previous.includes(mood)) return previous.filter((item) => item !== mood);
      if (previous.length >= 8) {
        setError("You can pick up to eight feelings at once. That's plenty for one moment.");
        return previous;
      }
      return [...previous, mood];
    });
  }

  function toggleTag(tag: string) {
    setTags((previous) =>
      previous.includes(tag) ? previous.filter((item) => item !== tag) : [...previous, tag],
    );
  }

  function next() {
    if (step === 0 && emotions.length === 0) {
      setError("Pick at least one feeling — even a vague one counts.");
      return;
    }
    setError(null);
    setStep((value) => Math.min(value + 1, STEPS.length - 1));
  }

  function back() {
    setError(null);
    setStep((value) => Math.max(value - 1, 0));
  }

  async function save() {
    if (emotions.length === 0) {
      setStep(0);
      setError("Pick at least one feeling before planting this check-in.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const entry = await addEntry({
        primary_mood: emotions[0],
        emotions,
        energy,
        note: note.trim() ? note.trim() : null,
        tags,
      });
      setSaved(entry);
    } catch (caught) {
      setError(extractErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  function reset() {
    setSaved(null);
    setStep(0);
    setEmotions([]);
    setEnergy("medium");
    setNote("");
    setTags([]);
    setError(null);
  }

  if (saved) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="m-fade-up rounded-[2.5rem] border border-white/70 bg-gradient-to-b from-white via-mint-50 to-lavender-50 p-8 text-center shadow-lift sm:p-12">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-mint-100 via-blush-100 to-lavender-100 text-4xl shadow-soft">
            🌸
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-ink">
            Your feelings have been planted in your garden.
          </h1>
          <p className="mt-3 text-lg leading-relaxed text-muted">
            {MOOD_MAP[saved.primary_mood]?.emoji} {MOOD_MAP[saved.primary_mood]?.label}
            {saved.emotions.length > 1
              ? ` alongside ${saved.emotions.length - 1} other feeling${saved.emotions.length > 2 ? "s" : ""}`
              : ""}{" "}
            · {saved.energy} energy
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/garden" className="m-btn-primary">
              Visit my garden
            </Link>
            <button type="button" onClick={reset} className="m-btn-secondary">
              Another check-in
            </button>
            <Link href="/insights" className="m-btn-quiet">
              See insights
            </Link>
          </div>

          {isGuest ? (
            <p className="mt-6 text-sm text-muted">
              This plant lives in this browser.{" "}
              <Link href="/signup" className="m-link">
                Create an account
              </Link>{" "}
              to keep it for good.
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        eyebrow="emotional check-in"
        title="How are you feeling?"
        description="Five small steps. No scores, no judgement — just an honest snapshot of right now."
      />

      {isGuest ? <GuestNote context="this check-in" /> : null}

      <div className="m-card">
        <ol className="mb-7 flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.18em] text-muted">
          {STEPS.map((label, index) => (
            <li key={label} className="flex items-center gap-2">
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-full border text-[0.7rem] font-semibold ${
                  index < step
                    ? "border-mint-200 bg-mint-200 text-ink"
                    : index === step
                      ? "border-lavender-300 bg-lavender-200 text-ink shadow-soft"
                      : "border-white/80 bg-white/70 text-muted"
                }`}
                aria-hidden="true"
              >
                {index < step ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </span>
              <span className={index === step ? "font-semibold text-ink" : ""}>{label}</span>
            </li>
          ))}
        </ol>

        {step === 0 ? (
          <section aria-labelledby="step-feelings">
            <h2 id="step-feelings" className="text-2xl font-semibold text-ink">
              Which feelings are here?
            </h2>
            <p className="mt-1 text-muted">
              Choose as many as fit. The first one you pick becomes the flower&apos;s colour.
            </p>
            <div className="mt-5 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {MOODS.map((mood) => {
                const selected = emotions.includes(mood.key);
                const order = emotions.indexOf(mood.key);
                return (
                  <button
                    key={mood.key}
                    type="button"
                    onClick={() => toggleEmotion(mood.key)}
                    aria-pressed={selected}
                    className={`m-chip justify-start ${mood.chip} ${
                      selected
                        ? "scale-[1.02] border-ink/20 font-semibold text-ink shadow-lift ring-2 ring-lavender-300"
                        : "text-muted hover:-translate-y-0.5 hover:text-ink hover:shadow-soft"
                    }`}
                  >
                    <span className="text-xl" aria-hidden="true">
                      {mood.emoji}
                    </span>
                    {mood.label}
                    {selected ? (
                      <span className="ml-auto rounded-full bg-white/80 px-2 text-xs text-muted">
                        {order + 1}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
            {emotions.length > 0 ? (
              <p className="mt-4 text-sm text-muted">
                This check-in will grow a{" "}
                <strong className="text-ink">
                  {emotions.length > 2
                    ? "mixed blossom"
                    : MOOD_MAP[emotions[0]].label.toLowerCase() + " flower"}
                </strong>
                .
              </p>
            ) : null}
          </section>
        ) : null}

        {step === 1 ? (
          <section aria-labelledby="step-energy">
            <h2 id="step-energy" className="text-2xl font-semibold text-ink">
              How much energy do you have?
            </h2>
            <p className="mt-1 text-muted">Not how productive you were. Just what&apos;s available.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {ENERGY_OPTIONS.map((option) => {
                const selected = energy === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setEnergy(option.key)}
                    aria-pressed={selected}
                    className={`rounded-[1.75rem] border p-5 text-left transition-all duration-200 ${
                      selected
                        ? "border-lavender-300 bg-gradient-to-b from-lavender-100 to-white shadow-lift ring-2 ring-lavender-200"
                        : "border-white/80 bg-white/70 text-muted shadow-soft hover:-translate-y-0.5 hover:text-ink hover:shadow-lift"
                    }`}
                  >
                    <span className="text-2xl" aria-hidden="true">
                      {option.emoji}
                    </span>
                    <span className="mt-3 block text-xl font-semibold text-ink">{option.label}</span>
                    <span className="mt-1 block text-sm">{option.hint}</span>
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 2 ? (
          <section aria-labelledby="step-note">
            <h2 id="step-note" className="text-2xl font-semibold text-ink">
              What&apos;s on your mind?
            </h2>
            <p className="mt-1 text-muted">
              Entirely optional. A sentence, a list, or nothing at all.
            </p>
            <label htmlFor="checkin-note" className="m-label mt-5">
              Your words
            </label>
            <textarea
              id="checkin-note"
              value={note}
              onChange={(event) => setNote(event.target.value.slice(0, 4000))}
              rows={7}
              placeholder="Today felt like…"
              className="m-input resize-y leading-relaxed"
            />
            <p className="mt-2 text-right text-sm text-muted">{note.length}/4000</p>
          </section>
        ) : null}

        {step === 3 ? (
          <section aria-labelledby="step-tags">
            <h2 id="step-tags" className="text-2xl font-semibold text-ink">
              What is this connected to?
            </h2>
            <p className="mt-1 text-muted">Optional context, so patterns can show themselves later.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {TAGS.map((tag) => {
                const selected = tags.includes(tag.key);
                return (
                  <button
                    key={tag.key}
                    type="button"
                    onClick={() => toggleTag(tag.key)}
                    aria-pressed={selected}
                    className={`m-chip ${
                      selected
                        ? "border-lavender-300 bg-lavender-100 font-semibold text-ink shadow-soft ring-2 ring-lavender-200"
                        : "border-white/80 bg-white/70 text-muted hover:-translate-y-0.5 hover:text-ink"
                    }`}
                  >
                    {tag.label}
                  </button>
                );
              })}
            </div>
          </section>
        ) : null}

        {step === 4 ? (
          <section aria-labelledby="step-review">
            <h2 id="step-review" className="text-2xl font-semibold text-ink">
              Ready to plant this?
            </h2>
            <div className="mt-5 space-y-4 rounded-[1.75rem] border border-white/80 bg-gradient-to-b from-white/90 to-lavender-50/80 p-5">
              <div>
                <p className="m-label mb-1">Feelings</p>
                <ul className="flex flex-wrap gap-2">
                  {emotions.map((emotion) => (
                    <li key={emotion} className="rounded-full bg-white/90 px-3 py-1 text-sm shadow-soft">
                      {MOOD_MAP[emotion].emoji} {MOOD_MAP[emotion].label}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="m-label mb-1">Energy</p>
                <p className="capitalize">{energy}</p>
              </div>
              {tags.length > 0 ? (
                <div>
                  <p className="m-label mb-1">Context</p>
                  <p>{tags.map((tag) => TAG_LABELS[tag] ?? tag).join(" · ")}</p>
                </div>
              ) : null}
              <div>
                <p className="m-label mb-1">Note</p>
                <p className="whitespace-pre-line text-muted">
                  {note.trim() ? note.trim() : "No note — that's completely fine."}
                </p>
              </div>
              <p className="flex items-center gap-2 text-sm text-muted">
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {emotions.length > 2
                  ? "This will grow a mixed blossom."
                  : emotions.length > 0
                    ? `This will grow a ${MOOD_MAP[emotions[0]].label.toLowerCase()} flower.`
                    : "Pick a feeling first."}
              </p>
            </div>
          </section>
        ) : null}

        {error ? (
          <p
            role="alert"
            className="mt-5 rounded-2xl border border-blush-200 bg-blush-100/80 px-4 py-3 text-sm text-ink"
          >
            {error}
          </p>
        ) : null}

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="m-btn-quiet disabled:opacity-40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button type="button" onClick={next} className="m-btn-primary">
              Continue
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          ) : (
            <button type="button" onClick={() => void save()} disabled={saving} className="m-btn-primary">
              {saving ? "Planting…" : "Plant this feeling"}
            </button>
          )}
        </div>
      </div>

      <p className="mt-5 text-center text-sm text-muted">
        Mindsy never diagnoses. If you want human support, the{" "}
        <Link href="/support" className="m-link">
          Support page
        </Link>{" "}
        has grounding tools and crisis guidance.
      </p>
    </div>
  );
}
