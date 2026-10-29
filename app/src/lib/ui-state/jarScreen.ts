// 旅の壺's data, out of the page (round 8): the purse's treats, the paid-week count behind the three layer jars, the
// layers themselves and the last money moves. Pure functions of the view / reduced model.
import type { PersonId, WeekView } from '#lib/types.ts';
import { RULES, SEASONS } from '#lib/config/rules.ts';
import { dateMs } from '#lib/time/dates.ts';
import { moneyLog } from '#lib/model/history.ts';
import { provisionalMs } from '#lib/model/state.ts';
import type { ComposedModel } from '../client/view.ts';
import { t } from '#lib/i18n/index.ts';
import { weekRange } from '#lib/i18n/format.ts';

/** ごほうび財布's treats: price and sprite (Sprites.svelte). */
export const TREATS = [
  { key: 'cafe', yen: 2000, icon: 'i-cafe', vb: '0 0 48 48' },
  { key: 'movie', yen: 4000, icon: 'i-film', vb: '0 0 40 40' },
  { key: 'onsen', yen: 5000, icon: 'i-onsen', vb: '0 0 48 48' },
  { key: 'karaoke', yen: 3000, icon: 'i-mic', vb: '0 0 48 48' },
  { key: 'hike', yen: 4500, icon: 'i-hike', vb: '0 0 48 48' },
  { key: 'yakiniku', yen: 10000, icon: 'i-yakiniku', vb: '0 0 48 48' }
] as const;
export type Treat = (typeof TREATS)[number];
export const CHEAPEST_TREAT: Treat = TREATS.reduce<Treat>((a, b) => (b.yen < a.yen ? b : a), TREATS[0]);

/** The current pay rates. */
const pay = () => RULES[RULES.length - 1].money;

/** Weeks paid so far (incl. the 2 calibration weeks), for "against your own max" layer jars. The server may send it. */
export function paidWeeks(view: WeekView): number {
  const jar = view.jar;
  if (jar.weeks) return jar.weeks;
  const p = pay();
  const start = dateMs(SEASONS[0].from) - 14 * 86400000;
  const since = Math.floor((dateMs(view.weekKey) - start) / (7 * 86400000));
  const floor = Math.ceil(Math.max(jar.layers.A / p.yenPerFruit / 100, jar.layers.B / p.yenPerFruit / 100, jar.layers.team / p.teamYenPerFruit / 100));
  return Math.max(1, since, floor);
}

export interface JarLayer {
  key: PersonId | 'team';
  name: string;
  yen: number;
  /** Share of the most it could hold by now (every fruit ripe every week). */
  ratio: number;
  color: string;
}

/** Me, my partner, the team: each layer against its own max. */
export function jarLayers(view: WeekView): JarLayer[] {
  const weeks = paidWeeks(view);
  const p = pay();
  const jar = view.jar;
  const row = (who: PersonId): JarLayer => ({
    key: who,
    name: view.people[who].villagerName,
    yen: jar.layers[who],
    ratio: jar.layers[who] / (weeks * p.yenPerFruit * 100),
    color: who === 'A' ? 'var(--c-yuzu)' : 'var(--c-mint)'
  });
  const team = { key: 'team' as const, name: t('jar.teamShort'), yen: jar.layers.team, ratio: jar.layers.team / (weeks * p.teamYenPerFruit * 100), color: 'var(--c-leaf)' };
  return [row(view.me), row(view.partner), team];
}

export interface MoneyMove {
  key: string;
  at: number;
  label: string;
  yen: number;
  by: PersonId | null;
  /** Voided or refused: shown struck through. */
  off: boolean;
}

/** The last `n` money moves (paid weeks, treats), newest first (round 7 F11). */
export function recentMoves(m: ComposedModel, n = 3): MoneyMove[] {
  const log = moneyLog(m.state, m.now);
  const rows: MoneyMove[] = [
    ...log.months.flatMap((mo) => mo.weeks.map((w) => ({ key: `w${w.weekKey}`, at: provisionalMs(w.weekKey), label: weekRange(w.weekKey), yen: w.yen, by: null, off: false }))),
    ...log.months.flatMap((mo) => mo.spends.map((sp) => ({ key: `s${sp.spendId}`, at: sp.at, label: sp.label, yen: -sp.amountYen, by: sp.by, off: sp.status === 'voided' || sp.status === 'refused' })))
  ];
  return rows.sort((a, b) => b.at - a.at).slice(0, n);
}
