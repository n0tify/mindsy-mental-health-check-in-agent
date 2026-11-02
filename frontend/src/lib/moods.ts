import type { Energy, MoodKey, PlantType } from "./types";

export type MoodOption = {
  key: MoodKey;
  label: string;
  emoji: string;
  /** Tailwind classes for the selectable chip. */
  tint: string;
  ring: string;
  chip: string;
  /** Colour used by the flower illustration. */
  color: string;
  accent: string;
};

/**
 * The emotion catalogue. Order matters: it is the order shown in the picker and
 * the sort order used by the insights charts.
 */
export const MOODS: MoodOption[] = [
  { key: "happy", label: "Happy", emoji: "😊", tint: "bg-butter-100", ring: "ring-butter-200", chip: "bg-butter-100/90 border-butter-200", color: "#F6C453", accent: "#B9772A" },
  { key: "calm", label: "Calm", emoji: "😌", tint: "bg-lavender-100", ring: "ring-lavender-200", chip: "bg-lavender-100/90 border-lavender-200", color: "#B9A4F0", accent: "#7A63B8" },
  { key: "loved", label: "Loved", emoji: "🥰", tint: "bg-blush-100", ring: "ring-blush-200", chip: "bg-blush-100/90 border-blush-200", color: "#F5A9C6", accent: "#C4577F" },
  { key: "hopeful", label: "Hopeful", emoji: "✨", tint: "bg-mint-100", ring: "ring-mint-200", chip: "bg-mint-100/90 border-mint-200", color: "#9BD9B0", accent: "#4E9C71" },
  { key: "sad", label: "Sad", emoji: "😔", tint: "bg-sky-100", ring: "ring-sky-200", chip: "bg-sky-100/90 border-sky-200", color: "#8FB8EC", accent: "#456CA6" },
  { key: "anxious", label: "Anxious", emoji: "😟", tint: "bg-lavender-100", ring: "ring-lavender-300", chip: "bg-sky-50 border-lavender-200", color: "#C7BDF0", accent: "#6D5AA8" },
  { key: "angry", label: "Angry", emoji: "😡", tint: "bg-peach-100", ring: "ring-peach-200", chip: "bg-peach-100/90 border-peach-200", color: "#F2917B", accent: "#B94A33" },
  { key: "exhausted", label: "Exhausted", emoji: "😴", tint: "bg-sky-50", ring: "ring-sky-200", chip: "bg-sky-50 border-sky-200", color: "#C7D2EA", accent: "#5F6E92" },
  { key: "confused", label: "Confused", emoji: "😕", tint: "bg-mint-50", ring: "ring-mint-200", chip: "bg-mint-50 border-mint-200", color: "#A9D7C6", accent: "#3F7F68" },
  { key: "overwhelmed", label: "Overwhelmed", emoji: "😣", tint: "bg-blush-50", ring: "ring-blush-200", chip: "bg-blush-50 border-blush-200", color: "#F0B8D2", accent: "#A34C74" },
];

export const MOOD_MAP: Record<MoodKey, MoodOption> = MOODS.reduce(
  (accumulator, mood) => ({ ...accumulator, [mood.key]: mood }),
  {} as Record<MoodKey, MoodOption>,
);

export const ENERGY_OPTIONS: { key: Energy; label: string; hint: string; emoji: string }[] = [
  { key: "low", label: "Low", hint: "Running on fumes", emoji: "🪫" },
  { key: "medium", label: "Medium", hint: "Steady enough", emoji: "🔋" },
  { key: "high", label: "High", hint: "Lots of spark", emoji: "⚡" },
];

export const TAGS: { key: string; label: string }[] = [
  { key: "work", label: "Work" },
  { key: "study", label: "Study" },
  { key: "family", label: "Family" },
  { key: "friends", label: "Friends" },
  { key: "health", label: "Health" },
  { key: "relationships", label: "Relationships" },
  { key: "self", label: "Self" },
  { key: "other", label: "Other" },
];

export const TAG_LABELS: Record<string, string> = TAGS.reduce(
  (accumulator, tag) => ({ ...accumulator, [tag.key]: tag.label }),
  {},
);

/** Emotion -> botanical species. Mirrors backend/app/constants.py. */
export const MOOD_PLANTS: Record<MoodKey | "mixed", PlantType> = {
  happy: "sunflower",
  calm: "lavender",
  loved: "rose",
  hopeful: "sprout",
  sad: "bluebell",
  anxious: "lotus",
  angry: "hibiscus",
  exhausted: "moonflower",
  confused: "iris",
  overwhelmed: "peony",
  mixed: "blossom",
};

export const PLANT_LABELS: Record<PlantType, string> = {
  sunflower: "Sunflower",
  lavender: "Lavender",
  rose: "Rose",
  sprout: "New sprout",
  bluebell: "Bluebell",
  lotus: "Lotus",
  hibiscus: "Hibiscus",
  moonflower: "Moonflower",
  iris: "Iris",
  peony: "Peony",
  blossom: "Mixed blossom",
};

export function moodLabel(key: string | null | undefined): string {
  if (!key) return "No mood tagged";
  return MOOD_MAP[key as MoodKey]?.label ?? key;
}

export function moodEmoji(key: string | null | undefined): string {
  if (!key) return "🌱";
  return MOOD_MAP[key as MoodKey]?.emoji ?? "🌱";
}
