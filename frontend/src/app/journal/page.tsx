"use client";

import { useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { GuestNote } from "@/components/GuestNote";
import { PageHeader } from "@/components/PageHeader";
import { useMindsy } from "@/components/MindsyProvider";
import { extractErrorMessage, formatDateTime } from "@/lib/format";
import { MOODS, moodEmoji, moodLabel } from "@/lib/moods";
import type { JournalEntry, MoodKey } from "@/lib/types";

const EMPTY_FORM = { title: "", body: "", mood: "" as MoodKey | "" };

export default function JournalPage() {
  const { journal, ready, isGuest, addJournal, updateJournal, deleteJournal } = useMindsy();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const filtered = journal.filter((entry) => {
    if (!query.trim()) return true;
    const needle = query.trim().toLowerCase();
    return (
      entry.title.toLowerCase().includes(needle) || entry.body.toLowerCase().includes(needle)
    );
  });

  function resetForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setError(null);
  }

  function startEdit(entry: JournalEntry) {
    setForm({ title: entry.title, body: entry.body, mood: entry.mood ?? "" });
    setEditingId(entry.id);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!form.title.trim()) {
      setError("Give your entry a title first.");
      return;
    }
    if (!form.body.trim()) {
      setError("Write a little something in the body.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        body: form.body.trim(),
        mood: form.mood ? form.mood : null,
      };
      if (editingId) {
        await updateJournal(editingId, payload);
      } else {
        await addJournal(payload);
      }
      resetForm();
    } catch (caught) {
      setError(extractErrorMessage(caught));
    } finally {
      setSaving(false);
    }
  }

  async function remove(entry: JournalEntry) {
    if (!window.confirm("Delete this journal entry? This cannot be undone.")) return;
    setError(null);
    try {
      await deleteJournal(entry.id);
      if (editingId === entry.id) resetForm();
    } catch (caught) {
      setError(extractErrorMessage(caught));
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="journal"
        title="A place for the longer thoughts"
        description="Check-ins capture a moment. The journal holds the rest — the paragraphs, the half-formed thoughts, the things worth coming back to."
      />

      {isGuest ? <GuestNote context="your journal" /> : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div ref={formRef} className="m-card h-fit lg:sticky lg:top-40">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-2xl font-semibold text-ink">
              {editingId ? "Edit entry" : "New entry"}
            </h2>
            {editingId ? (
              <button type="button" onClick={resetForm} className="m-btn-quiet">
                <X className="h-4 w-4" aria-hidden="true" />
                Cancel
              </button>
            ) : null}
          </div>

          <form onSubmit={submit} className="mt-4 space-y-4">
            <div>
              <label htmlFor="journal-title" className="m-label">
                Title
              </label>
              <input
                id="journal-title"
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value.slice(0, 120) })}
                className="m-input"
                placeholder="A quieter evening"
                maxLength={120}
              />
            </div>

            <div>
              <label htmlFor="journal-mood" className="m-label">
                Feeling (optional)
              </label>
              <select
                id="journal-mood"
                value={form.mood}
                onChange={(event) => setForm({ ...form, mood: event.target.value as MoodKey | "" })}
                className="m-input"
              >
                <option value="">No mood tagged</option>
                {MOODS.map((mood) => (
                  <option key={mood.key} value={mood.key}>
                    {mood.emoji} {mood.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="journal-body" className="m-label">
                Entry
              </label>
              <textarea
                id="journal-body"
                value={form.body}
                onChange={(event) => setForm({ ...form, body: event.target.value })}
                rows={9}
                className="m-input resize-y leading-relaxed"
                placeholder="Write freely. Nobody is grading this."
              />
              <p className="mt-1 text-right text-sm text-muted">{form.body.length}/8000</p>
            </div>

            {error ? (
              <p role="alert" className="rounded-2xl border border-blush-200 bg-blush-100/80 px-4 py-3 text-sm">
                {error}
              </p>
            ) : null}

            <button type="submit" disabled={saving} className="m-btn-primary w-full">
              {editingId ? <Pencil className="h-4 w-4" aria-hidden="true" /> : <Plus className="h-4 w-4" aria-hidden="true" />}
              {saving ? "Saving…" : editingId ? "Save changes" : "Add to journal"}
            </button>
          </form>
        </div>

        <div>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[12rem]">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                aria-hidden="true"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search your entries"
                aria-label="Search journal entries"
                className="m-input pl-11"
              />
            </div>
            <span className="text-sm text-muted">
              {filtered.length} of {journal.length}
            </span>
          </div>

          {!ready ? (
            <div className="m-card text-center text-muted">Opening your journal…</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-[2rem] border border-white/70 bg-white/65 p-8 text-center shadow-soft">
              <p className="text-4xl" aria-hidden="true">
                📖
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-ink">
                {journal.length === 0 ? "No entries yet" : "Nothing matches that search"}
              </h2>
              <p className="mt-2 text-muted">
                {journal.length === 0
                  ? "Start with one honest sentence. That's a real entry."
                  : "Try a different word, or clear the search."}
              </p>
              {journal.length === 0 ? (
                <button
                  type="button"
                  onClick={() => formRef.current?.scrollIntoView({ behavior: "smooth" })}
                  className="m-btn-secondary mt-5"
                >
                  Write the first one
                </button>
              ) : (
                <button type="button" onClick={() => setQuery("")} className="m-btn-secondary mt-5">
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((entry) => (
                <li key={entry.id} className="m-card">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-xl font-semibold text-ink">{entry.title}</h3>
                      <p className="mt-0.5 text-sm text-muted">
                        {formatDateTime(entry.created_at)}
                        {entry.updated_at !== entry.created_at ? " · edited" : ""}
                        {entry.source === "guest" ? " · guest" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(entry)}
                        className="rounded-full p-2 text-muted transition hover:bg-lavender-100 hover:text-ink"
                        aria-label={`Edit ${entry.title}`}
                      >
                        <Pencil className="h-4 w-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(entry)}
                        className="rounded-full p-2 text-muted transition hover:bg-blush-100 hover:text-ink"
                        aria-label={`Delete ${entry.title}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>

                  {entry.mood ? (
                    <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-lavender-100/80 px-3 py-1 text-sm text-ink">
                      {moodEmoji(entry.mood)} {moodLabel(entry.mood)}
                    </p>
                  ) : null}

                  <p className="mt-3 whitespace-pre-line leading-relaxed text-muted">{entry.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
