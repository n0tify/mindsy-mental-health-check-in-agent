export type Energy = "low" | "medium" | "high";

export type MoodKey =
  | "happy"
  | "calm"
  | "loved"
  | "hopeful"
  | "sad"
  | "anxious"
  | "angry"
  | "exhausted"
  | "confused"
  | "overwhelmed";

export type Growth = "seedling" | "growing" | "bloom";

export type PlantType =
  | "sunflower"
  | "lavender"
  | "rose"
  | "sprout"
  | "bluebell"
  | "lotus"
  | "hibiscus"
  | "moonflower"
  | "iris"
  | "peony"
  | "blossom";

/** A check-in, whichever storage layer produced it. */
export type MoodEntry = {
  id: string;
  created_at: string;
  primary_mood: MoodKey;
  emotions: MoodKey[];
  energy: Energy;
  note: string | null;
  tags: string[];
  source: "account" | "guest";
};

export type JournalEntry = {
  id: string;
  title: string;
  body: string;
  mood: MoodKey | null;
  created_at: string;
  updated_at: string;
  source: "account" | "guest";
};

export type GratitudeNote = {
  id: string;
  text: string;
  created_at: string;
  source: "account" | "guest";
};

export type GardenPlant = {
  entryId: string;
  plantType: PlantType;
  variant: number;
  x: number;
  y: number;
  scale: number;
  growth: Growth;
  zIndex: number;
};

export type User = {
  id: string;
  name: string;
  email: string;
  created_at: string;
};

export type CompanionReply = {
  reply: string;
  tone: string;
  suggestions: string[];
  crisis: boolean;
  disclaimer: string;
};

export type NewMoodEntry = {
  primary_mood: MoodKey;
  emotions: MoodKey[];
  energy: Energy;
  note?: string | null;
  tags: string[];
  /** Only sent when migrating a guest check-in so its original date survives. */
  created_at?: string;
};

export type NewJournalEntry = {
  title: string;
  body: string;
  mood?: MoodKey | null;
};

export type JournalPatch = Partial<NewJournalEntry>;
