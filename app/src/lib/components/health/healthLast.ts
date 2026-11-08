import type { Group, Period } from '#lib/model/health.ts';

/** The sheet's tabs (HealthSheet: 健康 · ごはん). */
export type KenkouTab = 'health' | 'food';

/** けんこう's period and card group, kept while the panel stays open; the tab shown last, kept for the session (whose
 *  data: whose.svelte.ts). */
export const last: { period: Period; group: Group; tab: KenkouTab } = { period: 'week', group: 'activity', tab: 'health' };

/** The panel closed: the next opening starts at 1週 on かつどう. */
export function resetHealth(): void {
  last.period = 'week';
  last.group = 'activity';
}
