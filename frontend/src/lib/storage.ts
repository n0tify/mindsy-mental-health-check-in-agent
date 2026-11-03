import type { GratitudeNote, JournalEntry, MoodEntry } from "./types";

/**
 * Guest mode storage.
 *
 * Guests get the full experience without an account: check-ins, journal entries
 * and gratitude notes live in this browser profile's localStorage. They are
 * transferred to an account only after the user explicitly agrees.
 */

const KEYS = {
  entries: "mindsy.guest.entries",
  journal: "mindsy.guest.journal",
  gratitude: "mindsy.guest.gratitude",
  token: "mindsy.session.token",
  disclaimerDismissed: "mindsy.disclaimer.dismissed",
} as const;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Storage can fail in private mode or when the quota is exhausted. The app
    // stays usable; the caller surfaces a gentle warning.
    return false;
  }
}

export function newId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export const guestStore = {
  readEntries: () => readJson<MoodEntry[]>(KEYS.entries, []),
  writeEntries: (entries: MoodEntry[]) => writeJson(KEYS.entries, entries),

  readJournal: () => readJson<JournalEntry[]>(KEYS.journal, []),
  writeJournal: (entries: JournalEntry[]) => writeJson(KEYS.journal, entries),

  readGratitude: () => readJson<GratitudeNote[]>(KEYS.gratitude, []),
  writeGratitude: (notes: GratitudeNote[]) => writeJson(KEYS.gratitude, notes),

  hasAnyData: () => {
    const entries = readJson<MoodEntry[]>(KEYS.entries, []);
    const journal = readJson<JournalEntry[]>(KEYS.journal, []);
    const gratitude = readJson<GratitudeNote[]>(KEYS.gratitude, []);
    return entries.length + journal.length + gratitude.length > 0;
  },

  counts: () => ({
    entries: readJson<MoodEntry[]>(KEYS.entries, []).length,
    journal: readJson<JournalEntry[]>(KEYS.journal, []).length,
    gratitude: readJson<GratitudeNote[]>(KEYS.gratitude, []).length,
  }),

  clear: () => {
    if (typeof window === "undefined") return;
    for (const key of [KEYS.entries, KEYS.journal, KEYS.gratitude]) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
  },
};

export const sessionStore = {
  read: (): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(KEYS.token);
    } catch {
      return null;
    }
  },
  write: (token: string) => {
    try {
      window.localStorage.setItem(KEYS.token, token);
    } catch {
      // ignore: the session simply won't survive a reload
    }
  },
  clear: () => {
    try {
      window.localStorage.removeItem(KEYS.token);
    } catch {
      // ignore
    }
  },
};
