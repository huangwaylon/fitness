// The pots screen's last few ベル moves (round 11): days earned, weekly bonuses and spends, newest first.
import type { BellsLedger } from '#lib/model/history.ts';
import type { PersonId, PotKey } from '#lib/types.ts';

export interface Move {
  key: string;
  at: string | number;
  kind: 'day' | 'bonus' | 'spend';
  /** A day's date, a bonus's week (its Monday), or the spend's label. */
  label: string;
  bells: number;
  pot: PotKey | null;
  by: PersonId | null;
  /** A voided spend: struck through. */
  off: boolean;
}

/** Newest first; a day sorts at its end (23:59), a bonus at Sunday 19:30, a spend at its stamp. */
export function recentMoves(l: BellsLedger, n = 3): Move[] {
  const dayEnd = (d: string) => Date.parse(`${d}T23:59:00+09:00`);
  const rows: (Move & { t: number })[] = [
    ...l.days.filter((d) => d.bells > 0).slice(0, n).map((d) => ({ key: `d${d.date}`, at: d.date, t: dayEnd(d.date), kind: 'day' as const, label: d.date, bells: d.bells, pot: null, by: null, off: false })),
    ...l.bonuses.filter((b) => b.bells > 0).slice(0, n).map((b) => ({ key: `b${b.weekKey}`, at: b.at, t: b.at, kind: 'bonus' as const, label: b.weekKey, bells: b.bells, pot: null, by: null, off: false })),
    ...l.spends.slice(0, n).map((s) => ({ key: `s${s.spendId}`, at: s.at, t: s.at, kind: 'spend' as const, label: s.label, bells: -s.bells, pot: s.pot, by: s.by, off: s.voided }))
  ];
  return rows.sort((a, b) => b.t - a.t).slice(0, n).map(({ t: _t, ...m }) => m);
}
