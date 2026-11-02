import { MOOD_PLANTS } from "./moods";
import type { GardenPlant, Growth, MoodEntry, PlantType } from "./types";

/**
 * Deterministic Living Garden geometry.
 *
 * This mirrors backend/app/services/garden.py exactly. The entry id decides the
 * species, variant, position and size, so a plant never moves or duplicates when
 * the page reloads. Guests use this locally; logged-in users get the same values
 * from GET /api/garden.
 */

const ROW_Y = [62, 72, 82];
const ROW_SCALE = [0.86, 0.96, 1.06];
const GROWTH_SCALE: Record<Growth, number> = {
  seedling: 0.62,
  growing: 0.82,
  bloom: 1,
};

/** 32-bit FNV-1a over UTF-16 code units, matching the Python implementation. */
export function fnv1a(value: string): number {
  let digest = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    digest ^= value.charCodeAt(index);
    digest = Math.imul(digest, 0x01000193) >>> 0;
  }
  return digest >>> 0;
}

export function plantTypeFor(entry: Pick<MoodEntry, "emotions" | "primary_mood">): PlantType {
  const unique = new Set(entry.emotions);
  if (unique.size > 2) return MOOD_PLANTS.mixed;
  return MOOD_PLANTS[entry.primary_mood] ?? MOOD_PLANTS.mixed;
}

export function growthFor(entry: Pick<MoodEntry, "created_at">, now = Date.now()): Growth {
  const created = new Date(entry.created_at).getTime();
  if (Number.isNaN(created)) return "seedling";
  const hours = Math.max((now - created) / 3_600_000, 0);
  if (hours < 24) return "seedling";
  if (hours < 24 * 7) return "growing";
  return "bloom";
}

export function buildPlant(entry: MoodEntry, now = Date.now()): GardenPlant {
  const digest = fnv1a(entry.id);
  const row = (digest >>> 8) % 3;
  const growth = growthFor(entry, now);
  const jitter = ((digest >>> 16) % 9) - 4;

  return {
    entryId: entry.id,
    plantType: plantTypeFor(entry),
    variant: (digest >>> 4) % 4,
    x: Math.round((8 + (digest % 85)) * 100) / 100,
    y: Math.round((ROW_Y[row] + ((digest >>> 12) % 5)) * 100) / 100,
    scale: Math.round(ROW_SCALE[row] * GROWTH_SCALE[growth] * (1 + jitter / 100) * 1000) / 1000,
    growth,
    zIndex: row,
  };
}

export function buildGarden(entries: MoodEntry[], now = Date.now()): GardenPlant[] {
  return entries
    .map((entry) => buildPlant(entry, now))
    .sort((a, b) => a.zIndex - b.zIndex || a.x - b.x);
}

/** Reduce the API payload to the same shape used by guest gardens. */
export function normaliseApiPlants(
  plants: {
    entry_id: string;
    plant_type: string;
    variant: number;
    position_x: number;
    position_y: number;
    scale: number;
    growth: string;
    z_index: number;
  }[],
): GardenPlant[] {
  return plants.map((plant) => ({
    entryId: plant.entry_id,
    plantType: plant.plant_type as PlantType,
    variant: plant.variant,
    x: plant.position_x,
    y: plant.position_y,
    scale: plant.scale,
    growth: plant.growth as Growth,
    zIndex: plant.z_index,
  }));
}
