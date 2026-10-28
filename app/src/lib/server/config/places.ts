// Gym / studio places for presence events. Override with PLACES='[{"key":…,"person":"A","name":…,"autoStrength":false}]'.
import { z } from 'zod';

export interface PlaceConfig { key: string; person: 'A' | 'B'; name: string; autoStrength: boolean }

const DEFAULT_PLACES: PlaceConfig[] = [
  { key: 'anytime', person: 'A', name: 'エニタイム', autoStrength: false },
  { key: 'pt_studio', person: 'B', name: 'PTスタジオ', autoStrength: true },
  { key: 'anytime_b', person: 'B', name: 'エニタイム', autoStrength: false }
];

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
