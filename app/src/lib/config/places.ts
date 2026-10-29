// Gym / studio places for presence events (dependency-free; read by the browser model).
import type { PersonId } from '#lib/types.ts';

export interface PlaceConfig { key: string; person: PersonId; name: string; autoStrength: boolean }

export const PLACES: PlaceConfig[] = [
  { key: 'anytime', person: 'A', name: 'エニタイム', autoStrength: false },
  { key: 'pt_studio', person: 'B', name: 'PTスタジオ', autoStrength: true },
  { key: 'anytime_b', person: 'B', name: 'エニタイム', autoStrength: false }
];
