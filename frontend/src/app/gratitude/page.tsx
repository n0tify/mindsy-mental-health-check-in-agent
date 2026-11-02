"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { GuestNote } from "@/components/GuestNote";
import { PageHeader } from "@/components/PageHeader";
import { useMindsy } from "@/components/MindsyProvider";
import { extractErrorMessage, formatDate } from "@/lib/format";

const NOTE_TINTS = [
  "from-butter-100/90 to-white",
  "from-blush-100/90 to-white",
  "from-mint-100/90 to-white",
  "from-sky-100/90 to-white",
  "from-lavender-100/90 to-white",
  "from-peach-100/90 to-white",
];

const PROMPTS = [
  "A small thing that went right",
  "Someone who made today easier",
  "Something my body did for me",
  "A moment of quiet",
];

export default function GratitudePage() {
  const { gratitude, ready, isGuest, addGratitude, deleteGratitude } = useMindsy();
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await addGratitude(text);
      setText("");
    } catch (caught) {
      setError(extractErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function remove(noteId: string) {
    setError(null);
    try {
      await deleteGratitude(noteId);
    } catch (caught) {
      setError(extractErrorMessage(caught));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="gratitude wall"
        title="Small good things"
        description="Not positivity homework. Just a place to pin the small things that were genuinely okay, so future-you can find them."
      />

      {isGuest ? <GuestNote context="this wall" /> : null}

      <form onSubmit={submit} className="m-card">
        <label htmlFor="gratitude-text" className="m-label">
          One good thing
        </label>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            id="gratitude-text"
            value={text}
            onChange={(event) => setText(event.target.value.slice(0, 280))}
            placeholder="Warm socks on a cold morning."
            className="m-input flex-1"
            maxLength={280}
          />
          <button type="submit" disabled={saving || !text.trim()} className="m-btn-primary">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {saving ? "Pinning…" : "Pin it"}
          </button>
        </div>
        <p className="mt-2 text-right text-sm text-muted">{text.length}/280</p>

        <div className="mt-3 flex flex-wrap gap-2">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => setText((value) => (value.trim() ? value : prompt + ": "))}
              className="rounded-full border border-white/80 bg-white/70 px-3 py-1 text-sm text-muted transition hover:-translate-y-0.5 hover:text-ink"
            >
              {prompt}
            </button>
          ))}
        </div>

        {error ? (
          <p role="alert" className="mt-4 rounded-2xl border border-blush-200 bg-blush-100/80 px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}
      </form>

      <section aria-labelledby="wall" className="mt-8">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="wall" className="text-2xl font-semibold text-ink">
            The wall
          </h2>
          <span className="text-sm text-muted">
            {gratitude.length} note{gratitude.length === 1 ? "" : "s"}
          </span>
        </div>

        {!ready ? (
          <div className="m-card mt-4 text-center text-muted">Unfolding the notes…</div>
        ) : gratitude.length === 0 ? (
          <div className="mt-4 rounded-[2rem] border border-white/70 bg-white/60 p-8 text-center shadow-soft">
            <p className="text-4xl" aria-hidden="true">
              💌
            </p>
            <h3 className="mt-4 text-2xl font-semibold text-ink">The wall is empty and ready</h3>
            <p className="mt-2 text-muted">
              One note is enough. &ldquo;The tea was good&rdquo; counts.
            </p>
          </div>
        ) : (
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {gratitude.map((note, index) => (
              <li
                key={note.id}
                className={`relative rounded-[1.75rem] border border-white/80 bg-gradient-to-br ${
                  NOTE_TINTS[index % NOTE_TINTS.length]
                } p-5 shadow-soft transition-transform duration-200 hover:-translate-y-1 hover:shadow-lift`}
                style={{ transform: `rotate(${index % 2 === 0 ? -1.1 : 1.1}deg)` }}
              >
                <span aria-hidden="true" className="text-xl">
                  🌼
                </span>
                <p className="mt-2 text-lg leading-relaxed text-ink">{note.text}</p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs uppercase tracking-[0.12em] text-muted">
                    {formatDate(note.created_at)}
                  </p>
                  <button
                    type="button"
                    onClick={() => void remove(note.id)}
                    className="rounded-full p-1.5 text-muted transition hover:bg-white/80 hover:text-ink"
                    aria-label="Remove this gratitude note"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
