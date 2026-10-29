// Gym / studio places for presence events. Override with PLACES='[{"key":…,"person":"A","name":…,"autoStrength":false}]'.
import { z } from 'zod';

export type { PlaceConfig } from '#lib/config/places.ts';
import { PLACES, type PlaceConfig } from '#lib/config/places.ts';

const DEFAULT_PLACES: PlaceConfig[] = PLACES;

const placeSchema = z.object({
  key: z.string().regex(/^[a-z0-9_-]{1,40}$/),
  person: z.enum(['A', 'B']),
  name: z.string().min(1).max(60),
  autoStrength: z.boolean().default(false)
});

export function loadPlaces(env = process.env.PLACES): PlaceConfig[] {
  if (!env) return DEFAULT_PLACES;
  return z.array(placeSchema).parse(JSON.parse(env));
}
