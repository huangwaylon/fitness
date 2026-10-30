// Gym / studio places for presence events (dependency-free; read by the browser model). autoStrength: a visit of
// STRENGTH.minVisitMin or more is a strength day with no question (all three since 2026-10-30, user decision).
import type { PersonId } from '#lib/types.ts';

export interface PlaceConfig { key: string; person: PersonId; name: string; autoStrength: boolean }

export const PLACES: PlaceConfig[] = [
  { key: 'anytime', person: 'A', name: 'エニタイム', autoStrength: true },
  { key: 'pt_studio', person: 'B', name: 'PTスタジオ', autoStrength: true },
  { key: 'anytime_b', person: 'B', name: 'エニタイム', autoStrength: true }
];
