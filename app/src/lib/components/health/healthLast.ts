import type { Group, Period } from '#lib/model/health.ts';

/** The sheet's tabs (HealthSheet: 健康 · ごはん). */
export type KenkouTab = 'health' | 'food';

/** けんこう's period, card group and whose data (null: this phone's person), kept while the panel stays open; the tab
 *  shown last, kept for the session. */
export const last: { period: Period; group: Group; who: 'A' | 'B' | null; tab: KenkouTab } = { period: 'week', group: 'activity', who: null, tab: 'health' };

/** The panel closed: the next opening starts at 1週 on かつどう (whose data is kept for the session). */
export function resetHealth(): void {
  last.period = 'week';
  last.group = 'activity';
}
