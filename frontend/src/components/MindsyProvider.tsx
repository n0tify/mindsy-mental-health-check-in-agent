"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { api } from "@/lib/api";
import { buildGarden, normaliseApiPlants } from "@/lib/garden";
import { guestStore, newId, sessionStore } from "@/lib/storage";
import type {
  GardenPlant,
  GratitudeNote,
  JournalEntry,
  JournalPatch,
  MoodEntry,
  NewJournalEntry,
  NewMoodEntry,
  User,
} from "@/lib/types";

type MindsyContextValue = {
  ready: boolean;
  busy: boolean;
  user: User | null;
  isGuest: boolean;
  entries: MoodEntry[];
  plants: GardenPlant[];
  journal: JournalEntry[];
  gratitude: GratitudeNote[];
  notice: string | null;
  dismissNotice: () => void;
  signup: (input: { name: string; email: string; password: string }) => Promise<void>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  addEntry: (input: NewMoodEntry) => Promise<MoodEntry>;
  deleteEntry: (entryId: string) => Promise<void>;
  addJournal: (input: NewJournalEntry) => Promise<JournalEntry>;
  updateJournal: (entryId: string, patch: JournalPatch) => Promise<JournalEntry>;
  deleteJournal: (entryId: string) => Promise<void>;
  addGratitude: (text: string) => Promise<GratitudeNote>;
  deleteGratitude: (noteId: string) => Promise<void>;
  refresh: () => Promise<void>;
};

const MindsyContext = createContext<MindsyContextValue | null>(null);

function sortEntriesDesc(entries: MoodEntry[]): MoodEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function sortJournalDesc(entries: JournalEntry[]): JournalEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

function sortNotesDesc(notes: GratitudeNote[]): GratitudeNote[] {
  return [...notes].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function MindsyProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [gratitude, setGratitude] = useState<GratitudeNote[]>([]);
  const [accountPlants, setAccountPlants] = useState<GardenPlant[]>([]);
  const [gardenFromApi, setGardenFromApi] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const dismissNotice = useCallback(() => setNotice(null), []);

  const loadGuest = useCallback(() => {
    setEntries(sortEntriesDesc(guestStore.readEntries()));
    setJournal(sortJournalDesc(guestStore.readJournal()));
    setGratitude(sortNotesDesc(guestStore.readGratitude()));
    setAccountPlants([]);
    setGardenFromApi(false);
  }, []);

  const loadAccount = useCallback(async (activeToken: string) => {
    const [remoteEntries, remoteJournal, remoteNotes, garden] = await Promise.all([
      api.listEntries(activeToken),
      api.listJournal(activeToken),
      api.listGratitude(activeToken),
      api.garden(activeToken).catch(() => null),
    ]);

    setEntries(sortEntriesDesc(remoteEntries));
    setJournal(sortJournalDesc(remoteJournal));
    setGratitude(sortNotesDesc(remoteNotes));

    if (garden) {
      setAccountPlants(normaliseApiPlants(garden.plants));
      setGardenFromApi(true);
    } else {
      setGardenFromApi(false);
    }
  }, []);

  const refreshGarden = useCallback(async (activeToken: string) => {
    try {
      const garden = await api.garden(activeToken);
      setAccountPlants(normaliseApiPlants(garden.plants));
      setGardenFromApi(true);
    } catch {
      // Keep rendering from the local mirror so the garden is never blank just
      // because one request failed.
      setGardenFromApi(false);
    }
  }, []);

  /** Move anything created as a guest into the freshly authenticated account. */
  const migrateGuestData = useCallback(async (activeToken: string) => {
    const guestEntries = guestStore.readEntries();
    const guestJournal = guestStore.readJournal();
    const guestNotes = guestStore.readGratitude();

    if (guestEntries.length + guestJournal.length + guestNotes.length === 0) return;

    try {
      for (const entry of guestEntries) {
        await api.createEntry(activeToken, {
          primary_mood: entry.primary_mood,
          emotions: entry.emotions,
          energy: entry.energy,
          note: entry.note,
          tags: entry.tags,
          created_at: entry.created_at,
        });
      }
      for (const entry of guestJournal) {
        await api.createJournal(activeToken, {
          title: entry.title,
          body: entry.body,
          mood: entry.mood,
        });
      }
      for (const note of guestNotes) {
        await api.createGratitude(activeToken, note.text);
      }
      guestStore.clear();
      setNotice("Your guest check-ins and notes moved into your account.");
    } catch {
      setNotice(
        "Some guest entries could not be moved, but they are still stored safely in this browser.",
      );
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const stored = sessionStore.read();

    if (!stored) {
      loadGuest();
      setReady(true);
      return;
    }

    (async () => {
      try {
        const profile = await api.me(stored);
        if (cancelled) return;
        setToken(stored);
        setUser(profile);
        await migrateGuestData(stored);
        if (cancelled) return;
        await loadAccount(stored);
      } catch {
        if (cancelled) return;
        // Expired or invalid token: fall back to guest mode instead of a
        // half-signed-in state.
        sessionStore.clear();
        setToken(null);
        setUser(null);
        loadGuest();
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadAccount, loadGuest, migrateGuestData]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 7000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const signup = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      setBusy(true);
      try {
        const response = await api.signup(input);
        sessionStore.write(response.access_token);
        setToken(response.access_token);
        setUser(response.user);
        await migrateGuestData(response.access_token);
        await loadAccount(response.access_token);
        setNotice(`Welcome, ${response.user.name.split(" ")[0]}. Your garden is ready.`);
      } finally {
        setBusy(false);
      }
    },
    [loadAccount, migrateGuestData],
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      setBusy(true);
      try {
        const response = await api.login(input);
        sessionStore.write(response.access_token);
        setToken(response.access_token);
        setUser(response.user);
        await migrateGuestData(response.access_token);
        await loadAccount(response.access_token);
        setNotice(`Welcome back, ${response.user.name.split(" ")[0]}.`);
      } finally {
        setBusy(false);
      }
    },
    [loadAccount, migrateGuestData],
  );

  const logout = useCallback(async () => {
    if (token) {
      try {
        await api.logout(token);
      } catch {
        // The token may already be invalid; local sign-out is what matters.
      }
    }
    sessionStore.clear();
    setToken(null);
    setUser(null);
    loadGuest();
    setNotice("Signed out. You're browsing as a guest again.");
  }, [loadGuest, token]);

  const addEntry = useCallback(
    async (input: NewMoodEntry) => {
      if (token && user) {
        const created = await api.createEntry(token, input);
        setEntries((previous) => sortEntriesDesc([created, ...previous]));
        await refreshGarden(token);
        return created;
      }

      const entry: MoodEntry = {
        id: newId(),
        created_at: new Date().toISOString(),
        primary_mood: input.primary_mood,
        emotions: input.emotions,
        energy: input.energy,
        note: input.note?.trim() ? input.note.trim() : null,
        tags: input.tags,
        source: "guest",
      };

      setEntries((previous) => {
        const next = sortEntriesDesc([entry, ...previous]);
        guestStore.writeEntries(next);
        return next;
      });
      return entry;
    },
    [refreshGarden, token, user],
  );

  const deleteEntry = useCallback(
    async (entryId: string) => {
      if (token && user) {
        await api.deleteEntry(token, entryId);
        setEntries((previous) => previous.filter((entry) => entry.id !== entryId));
        await refreshGarden(token);
        return;
      }

      setEntries((previous) => {
        const next = previous.filter((entry) => entry.id !== entryId);
        guestStore.writeEntries(next);
        return next;
      });
    },
    [refreshGarden, token, user],
  );

  const addJournal = useCallback(
    async (input: NewJournalEntry) => {
      if (token && user) {
        const created = await api.createJournal(token, input);
        setJournal((previous) => sortJournalDesc([created, ...previous]));
        return created;
      }

      const now = new Date().toISOString();
      const entry: JournalEntry = {
        id: newId(),
        title: input.title,
        body: input.body,
        mood: input.mood ?? null,
        created_at: now,
        updated_at: now,
        source: "guest",
      };
      setJournal((previous) => {
        const next = sortJournalDesc([entry, ...previous]);
        guestStore.writeJournal(next);
        return next;
      });
      return entry;
    },
    [token, user],
  );

  const updateJournal = useCallback(
    async (entryId: string, patch: JournalPatch) => {
      if (token && user) {
        const updated = await api.updateJournal(token, entryId, patch);
        setJournal((previous) =>
          sortJournalDesc(previous.map((entry) => (entry.id === entryId ? updated : entry))),
        );
        return updated;
      }

      const current = journal.find((entry) => entry.id === entryId);
      if (!current) throw new Error("That journal entry no longer exists.");
      const updated: JournalEntry = {
        ...current,
        ...patch,
        mood: "mood" in patch ? patch.mood ?? null : current.mood,
        updated_at: new Date().toISOString(),
      };
      setJournal((previous) => {
        const next = previous.map((entry) => (entry.id === entryId ? updated : entry));
        guestStore.writeJournal(next);
        return next;
      });
      return updated;
    },
    [journal, token, user],
  );

  const deleteJournal = useCallback(
    async (entryId: string) => {
      if (token && user) {
        await api.deleteJournal(token, entryId);
        setJournal((previous) => previous.filter((entry) => entry.id !== entryId));
        return;
      }

      setJournal((previous) => {
        const next = previous.filter((entry) => entry.id !== entryId);
        guestStore.writeJournal(next);
        return next;
      });
    },
    [token, user],
  );

  const addGratitude = useCallback(
    async (text: string) => {
      const cleaned = text.trim();
      if (!cleaned) throw new Error("Write down one small good thing first.");

      if (token && user) {
        const created = await api.createGratitude(token, cleaned);
        setGratitude((previous) => sortNotesDesc([created, ...previous]));
        return created;
      }

      const note: GratitudeNote = {
        id: newId(),
        text: cleaned,
        created_at: new Date().toISOString(),
        source: "guest",
      };
      setGratitude((previous) => {
        const next = sortNotesDesc([note, ...previous]);
        guestStore.writeGratitude(next);
        return next;
      });
      return note;
    },
    [token, user],
  );

  const deleteGratitude = useCallback(
    async (noteId: string) => {
      if (token && user) {
        await api.deleteGratitude(token, noteId);
        setGratitude((previous) => previous.filter((note) => note.id !== noteId));
        return;
      }

      setGratitude((previous) => {
        const next = previous.filter((note) => note.id !== noteId);
        guestStore.writeGratitude(next);
        return next;
      });
    },
    [token, user],
  );

  const refresh = useCallback(async () => {
    if (token) {
      await loadAccount(token);
    } else {
      loadGuest();
    }
  }, [loadAccount, loadGuest, token]);

  const plants = useMemo(() => {
    if (user && gardenFromApi) return accountPlants;
    return buildGarden(entries);
  }, [accountPlants, entries, gardenFromApi, user]);

  const value: MindsyContextValue = {
    ready,
    busy,
    user,
    isGuest: !user,
    entries,
    plants,
    journal,
    gratitude,
    notice,
    dismissNotice,
    signup,
    login,
    logout,
    addEntry,
    deleteEntry,
    addJournal,
    updateJournal,
    deleteJournal,
    addGratitude,
    deleteGratitude,
    refresh,
  };

  return (
    <MindsyContext.Provider value={value}>
      {children}
      {notice ? (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 z-50 w-[min(92vw,32rem)] -translate-x-1/2 rounded-3xl border border-white/80 bg-white/90 px-5 py-4 text-center text-base text-ink shadow-lift backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            <span aria-hidden="true">🌸</span>
            <p className="flex-1 text-left">{notice}</p>
            <button
              type="button"
              onClick={dismissNotice}
              className="rounded-full px-2 text-lg leading-none text-muted transition hover:bg-lavender-100 hover:text-ink"
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        </div>
      ) : null}
    </MindsyContext.Provider>
  );
}

export function useMindsy(): MindsyContextValue {
  const context = useContext(MindsyContext);
  if (!context) {
    throw new Error("useMindsy must be used inside <MindsyProvider>.");
  }
  return context;
}
