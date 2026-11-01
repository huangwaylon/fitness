import type { Period } from '#lib/model/health.ts';

/** けんこう's period and whose data (null: this phone's person), kept while the panel stays open. */
export const last: { period: Period; who: 'A' | 'B' | null } = { period: 'week', who: null };

/** The panel closed: the next opening starts at 1週 (whose data is kept for the session). */
export function resetHealth(): void {
  last.period = 'week';
}
