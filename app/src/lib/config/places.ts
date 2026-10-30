// Gym / studio places for presence events (dependency-free; read by the browser model). An arrive at any of them is a
// strength day for its person on that date, with no question and no minimum stay (2026-10-30, user decision).
import type { PersonId } from '#lib/types.ts';

export interface PlaceConfig { key: string; person: PersonId; name: string }

export const PLACES: PlaceConfig[] = [
  { key: 'anytime', person: 'A', name: 'エニタイム' },
  { key: 'pt_studio', person: 'B', name: 'PTスタジオ' },
  { key: 'anytime_b', person: 'B', name: 'エニタイム' }
];
