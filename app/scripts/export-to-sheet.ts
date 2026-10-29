// Usage: npm run export:sheet   (DATABASE_PATH=… to point at another DB; default ./data/island.db)
// Runs on plain Node ≥ 24 (built-in `node:sqlite`, native TypeScript type stripping): no native modules needed.
//
// One-off migration from the Mac SQLite DB to the Island Fund sheet (ADR 0015). Opens the DB READ-ONLY and writes
// one header-less TSV per tab into ./data/export/ (gitignored): metrics, workouts, presence, events. Paste each into
// its tab at cell A2 (docs/ops/google-setup.md §8). Stop the Mac server first so nothing arrives after the export.
//
// Mapping (sheets-architecture.md §1): every row's `at` is the DB's own timestamp normalised to ISO UTC with ms.
//   daily_metric → metrics (one row per day value)        workout → workouts (ext_id kept: same workoutKey)
//   presence_event → presence (at = event_at)             checkin → checkin {date, habit, done:true}
//   workout.includes_strength → confirm {kind:'workout'}  purse_spend → spend (+ approve, at = the ledger entry's time)
//   visit_confirmation → confirm {kind:'visit', id:'<place>@<arrive ISO>'} (the model's visit id)
//   transfer → transfer {month}   harvest_confirm → harvest {week}   high_five → highfive {}
//   person_pref → pref {key, value}
// Not exported (warned about): ledger entries (compute-on-read replaces the ledger), raw payloads, devices, push
// subscriptions, and visibility_pref (both players see all data; the model ignores `share` rows).
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TABS } from '#lib/ingest/sheet-api.ts';

const dbPath = process.env.DATABASE_PATH ?? './data/island.db';
const outDir = resolve(process.env.EXPORT_DIR ?? './data/export');
if (!existsSync(dbPath)) throw new Error(`no database at ${dbPath}`);
const db = new DatabaseSync(dbPath, { readOnly: true });
const exportAt = new Date().toISOString();

type Row = Record<string, unknown>;
const all = (sql: string): Row[] => {
  try {
    return db.prepare(sql).all() as unknown as Row[];
  } catch (e) {
    console.warn(`skipped (${(e as Error).message}): ${sql}`);
    return [];
  }
};
const iso = (v: unknown) => (typeof v === 'string' && !Number.isNaN(Date.parse(v)) ? new Date(v).toISOString() : exportAt);
const cell = (v: unknown) => (v === null || v === undefined ? '' : String(v).replace(/[\t\r\n]+/g, ' '));

const metrics = all('select person, local_date, metric, value, updated_at from daily_metric order by updated_at, person, local_date, metric')
  .map((r) => [iso(r.updated_at), r.person, r.local_date, r.metric, r.value]);

const workoutRows = all('select * from workout order by updated_at, start_at');
const workouts = workoutRows.map((r) => [iso(r.updated_at), r.person, r.ext_id, r.local_date, r.type, r.start_at, r.end_at, r.duration_min, r.avg_hr]);

const presenceRows = all('select id, person, place_key, event, at from presence_event order by at, id');
const presence = presenceRows.map((r) => [iso(r.at), r.person, r.place_key, r.event, iso(r.at)]);

const events: unknown[][] = [];
const ev = (at: unknown, person: unknown, id: string, type: string, data: object) =>
  events.push([iso(at), person, `mig:${id}`, type, JSON.stringify(data)]);
for (const r of all('select * from checkin')) ev(r.created_at, r.person, `checkin:${r.id}`, 'checkin', { date: r.local_date, habit: r.habit_key, done: true });
for (const r of workoutRows) {
  if (r.includes_strength !== null && r.includes_strength !== undefined) {
    ev(r.updated_at, r.person, `confirm:${r.person}:${r.ext_id}`, 'confirm', { kind: 'workout', id: r.ext_id, yes: r.includes_strength === 1 });
  }
}
// A visit's id in the model is `<place>@<arrive ISO>` (lib/model/state.ts).
const arrives = new Map(presenceRows.map((r) => [Number(r.id), r]));
for (const r of all('select * from visit_confirmation')) {
  const a = arrives.get(Number(r.arrive_event_id));
  if (a) ev(r.answered_at, a.person, `visit:${r.arrive_event_id}`, 'confirm', { kind: 'visit', id: `${a.place_key}@${iso(a.at)}`, yes: r.confirmed === 1 });
}
// The money left the purse when the ledger entry was written: that's the approval time, not the request time.
// Small spends need no partner (approved_by = requester): the model approves them by itself.
const ledgerAt = new Map(all('select id, created_at from ledger_entry').map((r) => [Number(r.id), r.created_at]));
for (const r of all('select * from purse_spend')) {
  const spendId = `mig:${r.id}`;
  ev(r.created_at, r.requested_by, `spend:${r.id}`, 'spend', { spendId, label: r.label, amountYen: r.amount_yen });
  const approvedAt = r.ledger_entry_id === null ? undefined : ledgerAt.get(Number(r.ledger_entry_id));
  if (r.approved_by && r.approved_by !== r.requested_by && approvedAt) ev(approvedAt, r.approved_by, `approve:${r.id}`, 'approve', { spendId });
}
for (const r of all('select * from transfer')) ev(r.done_at, r.marked_by, `transfer:${r.month}`, 'transfer', { month: r.month });
for (const r of all('select * from harvest_confirm')) ev(r.at, r.person, `harvest:${r.week_key}:${r.person}`, 'harvest', { week: r.week_key });
for (const r of all('select * from high_five')) ev(r.at, r.from_person, `highfive:${r.id}`, 'highfive', {});
for (const r of all('select * from person_pref')) {
  for (const [key, col] of [['locale', 'locale'], ['villagerName', 'villager_name'], ['villager', 'villager']] as const) {
    if (r[col] !== null && r[col] !== undefined) ev(exportAt, r.person, `pref:${r.person}:${key}`, 'pref', { key, value: r[col] });
  }
}
events.sort((x, y) => String(x[0]).localeCompare(String(y[0])));

mkdirSync(outDir, { recursive: true });
const out: [keyof typeof TABS, unknown[][]][] = [['metrics', metrics], ['workouts', workouts], ['presence', presence], ['events', events]];
for (const [tab, rows] of out) {
  writeFileSync(resolve(outDir, `${tab}.tsv`), rows.map((r) => r.map(cell).join('\t')).join('\n') + (rows.length ? '\n' : ''));
  console.log(`${tab.padEnd(9)} ${String(rows.length).padStart(5)} rows → ${resolve(outDir, `${tab}.tsv`)}   columns: ${TABS[tab].join(', ')}`);
}

const count = (sql: string) => Number((all(sql)[0] as Row | undefined)?.n ?? 0);
const ledger = count('select count(*) as n from ledger_entry');
const adjusts = count("select count(*) as n from ledger_entry where kind = 'adjust'");
if (ledger) console.warn(`NOTE: ${ledger} ledger entries not exported: the app recomputes payouts from raw rows.${adjusts ? ` ${adjusts} manual 'adjust' entries will be LOST; note them down.` : ''}`);
db.close();
