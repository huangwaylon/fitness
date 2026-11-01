import type { Group, Period } from '#lib/model/health.ts';

/** けんこう's period, card group and whose data (null: this phone's person), kept while the panel stays open. */
export const last: { period: Period; group: Group; who: 'A' | 'B' | null } = { period: 'week', group: 'activity', who: null };

/** The panel closed: the next opening starts at 1週 on かつどう (whose data is kept for the session). */
export function resetHealth(): void {
  last.period = 'week';
  last.group = 'activity';
}
