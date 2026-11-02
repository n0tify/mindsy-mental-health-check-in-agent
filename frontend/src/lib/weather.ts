import type { MoodEntry, MoodKey } from "./types";

/**
 * Mood Weather: a metaphorical read on the recent atmosphere.
 * Deliberately poetic, never diagnostic.
 */

export type WeatherKind = "sunny" | "partly" | "mixed" | "cloudy" | "rainy" | "clearing";

export type Weather = {
  kind: WeatherKind;
  title: string;
  sky: string;
  message: string;
  dominant: MoodKey | null;
  sampleSize: number;
};

const LIGHT_MOODS: MoodKey[] = ["happy", "calm", "loved", "hopeful"];
const HEAVY_MOODS: MoodKey[] = ["sad", "anxious", "angry", "exhausted", "overwhelmed", "confused"];

const PRESETS: Record<WeatherKind, Pick<Weather, "title" | "sky" | "message">> = {
  sunny: {
    title: "Sunny skies",
    sky: "from-butter-100 via-peach-100 to-sky-100",
    message:
      "Your recent check-ins lean light. Worth noticing what is supporting you right now, and letting it count.",
  },
  partly: {
    title: "Soft sun with drifting clouds",
    sky: "from-butter-50 via-lavender-100 to-sky-100",
    message:
      "A mixed but mostly gentle stretch. There's room for both the ease and the small worries you named.",
  },
  mixed: {
    title: "Mixed weather",
    sky: "from-lavender-100 via-blush-100 to-sky-100",
    message:
      "Your feelings have been pulling in different directions lately. That's not confusion — it's a full emotional life.",
  },
  cloudy: {
    title: "Cloudy, with patience",
    sky: "from-sky-100 via-lavender-100 to-mint-100",
    message:
      "Lower, slower weather lately. Nothing needs fixing immediately; small comforts are legitimate care.",
  },
  rainy: {
    title: "Rainy season",
    sky: "from-sky-200 via-lavender-200 to-blush-100",
    message:
      "It has been heavy. You don't have to perform being okay here. Support is one tap away if you want it.",
  },
  clearing: {
    title: "Clearing skies",
    sky: "from-mint-100 via-sky-100 to-butter-100",
    message:
      "Something has been shifting toward lighter check-ins. Growth rarely looks dramatic — this counts.",
  },
};

export function deriveWeather(entries: MoodEntry[], now = new Date()): Weather {
  const weekAgo = now.getTime() - 7 * 86_400_000;
  const recent = entries.filter((entry) => {
    const created = new Date(entry.created_at).getTime();
    return !Number.isNaN(created) && created >= weekAgo;
  });
  const pool = recent.length > 0 ? recent : entries.slice(0, 7);

  if (pool.length === 0) {
    return {
      kind: "partly",
      title: "No forecast yet",
      sky: PRESETS.partly.sky,
      message:
        "Check in a few times and your emotional weather will start to take shape here.",
      dominant: null,
      sampleSize: 0,
    };
  }

  const counts = new Map<MoodKey, number>();
  for (const entry of pool) {
    counts.set(entry.primary_mood, (counts.get(entry.primary_mood) ?? 0) + 1);
  }
  const [dominant, dominantCount] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];

  const light = pool.filter((entry) => LIGHT_MOODS.includes(entry.primary_mood)).length;
  const heavy = pool.filter((entry) => HEAVY_MOODS.includes(entry.primary_mood)).length;
  const lightRatio = light / pool.length;
  const heavyRatio = heavy / pool.length;

  let kind: WeatherKind;
  if (lightRatio >= 0.7) {
    kind = "sunny";
  } else if (heavyRatio >= 0.7) {
    kind = "rainy";
  } else if (heavyRatio >= 0.45 && lightRatio < 0.3) {
    kind = "cloudy";
  } else if (lightRatio >= 0.45 && heavyRatio < 0.3) {
    kind = "clearing";
  } else if (dominantCount === 1) {
    kind = "mixed";
  } else {
    kind = "partly";
  }

  return {
    kind,
    ...PRESETS[kind],
    dominant,
    sampleSize: pool.length,
  };
}
