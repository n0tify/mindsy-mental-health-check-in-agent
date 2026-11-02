import { MOODS, MOOD_MAP } from "./moods";
import type { Energy, MoodEntry, MoodKey } from "./types";

/** Read-only summaries for the Insights page, computed from check-ins. */

export type MoodCount = { key: MoodKey; label: string; count: number; percent: number; color: string };

export type DayPoint = { day: string; label: string; count: number };

export type Insights = {
  total: number;
  checkInsThisWeek: number;
  moodCounts: MoodCount[];
  topEmotion: MoodCount | null;
  energyCounts: { key: Energy; label: string; count: number; percent: number }[];
  timeline: DayPoint[];
  streakDays: number;
  averageEnergy: string | null;
  observations: string[];
};

const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function buildInsights(entries: MoodEntry[], now = new Date()): Insights {
  const total = entries.length;
  const sorted = [...entries].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const counts = new Map<MoodKey, number>();
  for (const entry of entries) {
    counts.set(entry.primary_mood, (counts.get(entry.primary_mood) ?? 0) + 1);
  }

  const moodCounts: MoodCount[] = MOODS.map((mood) => {
    const count = counts.get(mood.key) ?? 0;
    return {
      key: mood.key,
      label: mood.label,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
      color: mood.color,
    };
  })
    .filter((mood) => mood.count > 0)
    .sort((a, b) => b.count - a.count);

  const energyMap = new Map<Energy, number>();
  for (const entry of entries) {
    energyMap.set(entry.energy, (energyMap.get(entry.energy) ?? 0) + 1);
  }
  const energyCounts = (["low", "medium", "high"] as Energy[]).map((key) => {
    const count = energyMap.get(key) ?? 0;
    return {
      key,
      label: key[0].toUpperCase() + key.slice(1),
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
    };
  });

  const timeline: DayPoint[] = [];
  const today = startOfDay(now);
  for (let offset = 13; offset >= 0; offset -= 1) {
    const date = new Date(today.getTime() - offset * DAY_MS);
    const key = dayKey(date);
    const count = entries.filter((entry) => {
      const created = new Date(entry.created_at);
      return !Number.isNaN(created.getTime()) && dayKey(created) === key;
    }).length;
    timeline.push({
      day: key,
      label: date.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      count,
    });
  }

  const weekAgo = now.getTime() - 7 * DAY_MS;
  const checkInsThisWeek = entries.filter(
    (entry) => new Date(entry.created_at).getTime() >= weekAgo,
  ).length;

  // Streak: consecutive days with at least one check-in, counting back from
  // today (or yesterday, so a check-in streak isn't broken mid-morning).
  const daysWithEntries = new Set(
    entries
      .map((entry) => {
        const created = new Date(entry.created_at);
        return Number.isNaN(created.getTime()) ? null : dayKey(created);
      })
      .filter((value): value is string => value !== null),
  );
  let streakDays = 0;
  let cursor = today;
  if (!daysWithEntries.has(dayKey(cursor))) {
    cursor = new Date(cursor.getTime() - DAY_MS);
  }
  while (daysWithEntries.has(dayKey(cursor))) {
    streakDays += 1;
    cursor = new Date(cursor.getTime() - DAY_MS);
  }

  const energyScore = { low: 1, medium: 2, high: 3 };
  const averageEnergyValue =
    total === 0
      ? null
      : entries.reduce((sum, entry) => sum + (energyScore[entry.energy] ?? 2), 0) / total;
  const averageEnergy =
    averageEnergyValue === null
      ? null
      : averageEnergyValue < 1.7
        ? "Mostly low"
        : averageEnergyValue < 2.4
          ? "Mostly steady"
          : "Mostly high";

  const observations: string[] = [];
  const topEmotion = moodCounts[0] ?? null;

  if (total === 0) {
    observations.push(
      "Your insights will appear after your first check-in. Nothing is diagnosed here — just patterns you can notice.",
    );
  } else {
    if (topEmotion) {
      observations.push(
        `${topEmotion.label} has shown up most often (${topEmotion.count} of ${total} check-ins). That may be worth being gentle with.`,
      );
    }
    if (checkInsThisWeek >= 4) {
      observations.push(
        `You checked in ${checkInsThisWeek} times this week, which is a lot of self-awareness in a short space of time.`,
      );
    } else if (checkInsThisWeek === 0 && sorted.length > 0) {
      observations.push(
        "No check-ins in the last seven days. If you'd like to reconnect, even one line counts.",
      );
    }
    if (energyCounts[0] && energyCounts[0].percent >= 50) {
      observations.push(
        `Your energy was ${energyCounts[0].label.toLowerCase()} in ${energyCounts[0].percent}% of check-ins. Rest might be the most useful experiment this week.`,
      );
    }
    if (new Set(entries.flatMap((entry) => entry.tags)).size > 0) {
      const tagCounts = new Map<string, number>();
      for (const entry of entries) {
        for (const tag of entry.tags) tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
      }
      const [topTag] = [...tagCounts.entries()].sort((a, b) => b[1] - a[1]);
      if (topTag && topTag[1] >= 2) {
        observations.push(
          `"${topTag[0]}" is the theme you tag most often. Patterns are information, not verdicts.`,
        );
      }
    }
  }

  return {
    total,
    checkInsThisWeek,
    moodCounts,
    topEmotion,
    energyCounts,
    timeline,
    streakDays,
    averageEnergy,
    observations,
  };
}

export function moodColour(key: string): string {
  return MOOD_MAP[key as MoodKey]?.color ?? "#C8B6FF";
}
