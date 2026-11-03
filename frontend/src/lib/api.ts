import type {
  CompanionReply,
  Energy,
  GratitudeNote,
  JournalEntry,
  JournalPatch,
  MoodEntry,
  MoodKey,
  NewJournalEntry,
  NewMoodEntry,
} from "./types";

/**
 * Base URL for the API.
 *
 * An empty value means "same origin", in which case Next.js proxies /api/* to
 * the backend (see next.config.ts). A full URL means the browser calls the API
 * directly, which requires the backend to allow this origin via CORS.
 */
export const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
};

function extractDetail(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const detail = (payload as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  // FastAPI validation errors arrive as a list of {loc, msg, type}.
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0] as { msg?: unknown };
    if (typeof first?.msg === "string") return first.msg;
  }
  return null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, token, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Mindsy can't reach the API right now. Check that the backend is running.",
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      extractDetail(payload) ?? `Request failed with status ${response.status}.`,
      response.status,
    );
  }

  return payload as T;
}

/* ------------------------------------------------------------------ types */

type ApiUser = { id: string; name: string; email: string; created_at: string };

type TokenResponse = { access_token: string; token_type: string; user: ApiUser };

type ApiMoodEntry = {
  id: string;
  created_at: string;
  primary_mood: string;
  emotions: string[];
  energy: string;
  note: string | null;
  tags: string[];
};

type ApiJournalEntry = {
  id: string;
  title: string;
  body: string;
  mood: string | null;
  created_at: string;
  updated_at: string;
};

type ApiGratitudeNote = { id: string; text: string; created_at: string };

type ApiPlant = {
  entry_id: string;
  plant_type: string;
  variant: number;
  position_x: number;
  position_y: number;
  scale: number;
  growth: string;
  z_index: number;
};

type GuestMigrationPayload = {
  entries: Array<Omit<MoodEntry, "source">>;
  journal: Array<Omit<JournalEntry, "source">>;
  gratitude: Array<Omit<GratitudeNote, "source">>;
};

type GuestMigrationResult = {
  entries: number;
  journal: number;
  gratitude: number;
};

/* -------------------------------------------------------------- adapters */

export function toMoodEntry(entry: ApiMoodEntry): MoodEntry {
  return {
    id: entry.id,
    created_at: entry.created_at,
    primary_mood: entry.primary_mood as MoodKey,
    emotions: entry.emotions as MoodKey[],
    energy: entry.energy as Energy,
    note: entry.note,
    tags: entry.tags,
    source: "account",
  };
}

function toJournalEntry(entry: ApiJournalEntry): JournalEntry {
  return {
    id: entry.id,
    title: entry.title,
    body: entry.body,
    mood: (entry.mood as MoodKey | null) ?? null,
    created_at: entry.created_at,
    updated_at: entry.updated_at,
    source: "account",
  };
}

function toGratitudeNote(note: ApiGratitudeNote): GratitudeNote {
  return {
    id: note.id,
    text: note.text,
    created_at: note.created_at,
    source: "account",
  };
}

/* ------------------------------------------------------------------- api */

export const api = {
  signup: (payload: { name: string; email: string; password: string }) =>
    request<TokenResponse>("/api/auth/signup", { method: "POST", body: payload }),

  login: (payload: { email: string; password: string }) =>
    request<TokenResponse>("/api/auth/login", { method: "POST", body: payload }),

  me: (token: string) => request<ApiUser>("/api/auth/me", { token }),

  logout: (token: string) =>
    request<{ detail: string }>("/api/auth/logout", { method: "POST", token }),

  migrateGuestData: (token: string, payload: GuestMigrationPayload) =>
    request<GuestMigrationResult>("/api/guest-migrations", {
      method: "POST",
      token,
      body: payload,
    }),

  listEntries: async (token: string) => {
    const entries = await request<ApiMoodEntry[]>("/api/entries", { token });
    return entries.map(toMoodEntry);
  },

  createEntry: async (token: string, entry: NewMoodEntry) => {
    const created = await request<ApiMoodEntry>("/api/entries", {
      method: "POST",
      token,
      body: entry,
    });
    return toMoodEntry(created);
  },

  deleteEntry: (token: string, entryId: string) =>
    request<void>(`/api/entries/${entryId}`, { method: "DELETE", token }),

  garden: (token: string) =>
    request<{ plants: ApiPlant[]; count: number }>("/api/garden", { token }),

  listJournal: async (token: string) => {
    const entries = await request<ApiJournalEntry[]>("/api/journal", { token });
    return entries.map(toJournalEntry);
  },

  createJournal: async (token: string, entry: NewJournalEntry) => {
    const created = await request<ApiJournalEntry>("/api/journal", {
      method: "POST",
      token,
      body: entry,
    });
    return toJournalEntry(created);
  },

  updateJournal: async (token: string, entryId: string, patch: JournalPatch) => {
    const updated = await request<ApiJournalEntry>(`/api/journal/${entryId}`, {
      method: "PATCH",
      token,
      body: patch,
    });
    return toJournalEntry(updated);
  },

  deleteJournal: (token: string, entryId: string) =>
    request<void>(`/api/journal/${entryId}`, { method: "DELETE", token }),

  listGratitude: async (token: string) => {
    const notes = await request<ApiGratitudeNote[]>("/api/gratitude", { token });
    return notes.map(toGratitudeNote);
  },

  createGratitude: async (token: string, text: string) => {
    const created = await request<ApiGratitudeNote>("/api/gratitude", {
      method: "POST",
      token,
      body: { text },
    });
    return toGratitudeNote(created);
  },

  deleteGratitude: (token: string, noteId: string) =>
    request<void>(`/api/gratitude/${noteId}`, { method: "DELETE", token }),

  companion: (message: string) =>
    request<CompanionReply>("/api/companion", { method: "POST", body: { message } }),
};

export type { TokenResponse, ApiUser };
