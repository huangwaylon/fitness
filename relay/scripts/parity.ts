// Parity of the sheet and the record (docs/ops/runbook.md#13-the-record): the model's numbers computed from each one's
// full snapshot must be the same: each person's ベル by week (locked weeks fixed at their lock), the wallet and the
// ledger, the ずかん (first finds and the tallies' counts), the decorations, the tent and the goals in force each day.
// High-fives (relay-only now) and superseded cosmetic prefs are not in the record; nothing here reads them.
import { reduce, moveGoalOn, stepsGoalOn, type State } from '../../app/src/lib/model/state.ts';
import { bellsLedger, economyWeeks, walletAt, weekBells } from '../../app/src/lib/model/bells.ts';
import { finalMs } from '../../app/src/lib/model/state.ts';
import { findsView } from '../../app/src/lib/model/finds.ts';
import { latestByDay, tallyTotals } from '../../app/src/lib/model/tally.ts';
import { decorLayout, mergeDecor, type DecorEntry } from '../../app/src/lib/contract/decor.ts';
import { mergeTent, tentLayout, type TentEntry } from '../../app/src/lib/contract/tent.ts';
import { localDateAt } from '../../app/src/lib/time/dates.ts';

type Snap = Record<string, any>;

/** Canonical JSON: maps as sorted entries, object keys sorted (a pref set later in another order is the same prefs). */
const json = (v: unknown) => JSON.stringify(v, (_k, x) => {
  if (x instanceof Map) return [...x].sort();
  if (x && typeof x === 'object' && !Array.isArray(x)) return Object.fromEntries(Object.entries(x).sort(([a], [b]) => (a < b ? -1 : 1)));
  return x;
});

/** What the app shows from a State at `now`, per part. */
function views(s: State, now: number): Record<string, unknown> {
  const weeks = economyWeeks(s, now);
  const decor = new Map<string, DecorEntry>();
  for (const e of s.decor) mergeDecor(decor, e);
  const tent = new Map<string, TentEntry>();
  for (const e of s.tent) mergeTent(tent, e);
  const today = localDateAt(now);
  const days = Array.from({ length: 60 }, (_, i) => localDateAt(now - i * 86400_000));
  return {
    'locked weeks (ベル per person and day)': weeks.filter((wk) => now >= finalMs(wk)).map((wk) => {
      const w = weekBells(s, wk, now);
      return [wk, w.A.days.map((d) => d.bells), w.B.days.map((d) => d.bells), w.dayTotals];
    }),
    'this week': weeks.filter((wk) => now < finalMs(wk)).map((wk) => weekBells(s, wk, now).dayTotals),
    wallet: (({ weeks: _w, ...rest }) => rest)(walletAt(s, now) as unknown as Record<string, unknown>),
    ledger: bellsLedger(s, now),
    'ずかん (first finds)': findsView(s),
    'ずかん (tallies)': tallyTotals(latestByDay(s.tallies)),
    decor: decorLayout(decor.values()),
    tent: tentLayout(tent.values()),
    prefs: s.prefs,
    'goals by day': (['A', 'B'] as const).map((p) => days.map((d) => [d, moveGoalOn(s, p, d), stepsGoalOn(s, p, d)])),
    'island days': (['A', 'B'] as const).map((p) => s.islandDays.filter((r) => r.person === p && r.data.date === today).length > 0),
    'last sync': s.lastSync
  };
}

export async function parity([sheet, record]: [Snap, Snap]): Promise<boolean> {
  if (!sheet.ok || !record.ok) throw new Error(`snapshots: ${json({ sheet: sheet.error, record: record.error })}`);
  const now = Date.parse(sheet.now);
  const a = views(reduce(sheet.rows), now), b = views(reduce(record.rows), now);
  let ok = true;
  for (const k of Object.keys(a)) {
    const same = json(a[k]) === json(b[k]);
    ok &&= same;
    console.log(`${same ? 'same' : 'DIFFERENT'}  ${k}${same ? '' : `\n  sheet:  ${json(a[k]).slice(0, 400)}\n  record: ${json(b[k]).slice(0, 400)}`}`);
  }
  const size = (s: Snap) => `${s.rows.metrics.length} metrics, ${s.rows.events.length} events, ${JSON.stringify(s).length} bytes`;
  console.log(`sheet: ${size(sheet)}\nrecord: ${size(record)}`);
  const wallet = (s: Snap) => json(walletAt(reduce(s.rows), now).wallet);
  console.log(`wallet balance: sheet ${wallet(sheet)}, record ${wallet(record)}`);
  return ok;
}
