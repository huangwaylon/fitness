// Usage: npm run export:sheet   (DATABASE_PATH=… to point at another DB; default ./data/island.db)
//
// One-off migration from the Mac SQLite DB to the Island Fund sheet (ADR 0015). Opens the DB READ-ONLY and writes
// one header-less TSV per tab into ./data/export/ (gitignored): metrics, workouts, presence, events. Paste each into
// its tab at cell A2 (docs/ops/google-setup.md §8). Stop the Mac server first so nothing arrives after the export.
//
// Mapping (sheets-architecture.md §1): every row's `at` is the DB's own timestamp normalised to ISO UTC with ms.
//   daily_metric → metrics (one row per day value)        workout → workouts (ext_id kept: same workoutKey)
//   presence_event → presence (at = event_at)             checkin → checkin {date, habit, done:true}
//   workout.includes_strength → confirm {kind:'workout'}  purse_spend → spend (+ approve)
//   transfer → transfer {month}   harvest_confirm → harvest {week}   high_five → highfive {}
//   person_pref → pref {key, value}                       visibility_pref → share {metric, on}
// Not exported (warned about): ledger entries (compute-on-read replaces the ledger), visit confirmations (the model
// owns visit ids), raw payloads, devices, push subscriptions.
import Database from 'better-sqlite3';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TABS } from '#lib/ingest/sheet-api.ts';

const dbPath = process.env.DATABASE_PATH ?? './data/island.db';
const outDir = resolve(process.env.EXPORT_DIR ?? './data/export');
const db = new Database(dbPath, { readonly: true, fileMustExist: true });
const exportAt = new Date().toISOString();

type Row = Record<string, unknown>;
const all = (sql: string): Row[] => {
  try {
    return db.prepare(sql).all() as Row[];
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

const presence = all('select person, place_key, event, at from presence_event order by at, id')
  .map((r) => [iso(r.at), r.person, r.place_key, r.event, iso(r.at)]);

const events: unknown[][] = [];
const ev = (at: unknown, person: unknown, id: string, type: string, data: object) =>
  events.push([iso(at), person, `mig:${id}`, type, JSON.stringify(data)]);
for (const r of all('select * from checkin')) ev(r.created_at, r.person, `checkin:${r.id}`, 'checkin', { date: r.local_date, habit: r.habit_key, done: true });
for (const r of workoutRows) {
  if (r.includes_strength !== null && r.includes_strength !== undefined) {
    ev(r.updated_at, r.person, `confirm:${r.person}:${r.ext_id}`, 'confirm', { kind: 'workout', id: r.ext_id, yes: r.includes_strength === 1 });
  }
}
for (const r of all('select * from purse_spend')) {
  const spendId = `mig:${r.id}`;
  ev(r.created_at, r.requested_by, `spend:${r.id}`, 'spend', { spendId, label: r.label, amountYen: r.amount_yen });
  if (r.approved_by) ev(r.created_at, r.approved_by, `approve:${r.id}`, 'approve', { spendId });
}
for (const r of all('select * from transfer')) ev(r.done_at, r.marked_by, `transfer:${r.month}`, 'transfer', { month: r.month });
for (const r of all('select * from harvest_confirm')) ev(r.at, r.person, `harvest:${r.week_key}:${r.person}`, 'harvest', { week: r.week_key });
for (const r of all('select * from high_five')) ev(r.at, r.from_person, `highfive:${r.id}`, 'highfive', {});
for (const r of all('select * from person_pref')) {
  for (const [key, col] of [['locale', 'locale'], ['villagerName', 'villager_name'], ['villager', 'villager']] as const) {
    if (r[col] !== null && r[col] !== undefined) ev(exportAt, r.person, `pref:${r.person}:${key}`, 'pref', { key, value: r[col] });
  }
}
for (const r of all('select * from visibility_pref')) ev(exportAt, r.person, `share:${r.person}:${r.metric}`, 'share', { metric: r.metric, on: r.share_raw === 1 });
events.sort((x, y) => String(x[0]).localeCompare(String(y[0])));

mkdirSync(outDir, { recursive: true });
const out: [keyof typeof TABS, unknown[][]][] = [['metrics', metrics], ['workouts', workouts], ['presence', presence], ['events', events]];
for (const [tab, rows] of out) {
  writeFileSync(resolve(outDir, `${tab}.tsv`), rows.map((r) => r.map(cell).join('\t')).join('\n') + (rows.length ? '\n' : ''));
  console.log(`${tab.padEnd(9)} ${String(rows.length).padStart(5)} rows → ${resolve(outDir, `${tab}.tsv`)}   columns: ${TABS[tab].join(', ')}`);
}

const count = (sql: string) => Number((all(sql)[0] as Row | undefined)?.n ?? 0);
const visitConfs = count('select count(*) as n from visit_confirmation');
const ledger = count('select count(*) as n from ledger_entry');
const adjusts = count("select count(*) as n from ledger_entry where kind = 'adjust'");
if (visitConfs) console.warn(`WARNING: ${visitConfs} visit confirmations not exported (visit ids belong to the model); re-answer them in the app.`);
if (ledger) console.warn(`NOTE: ${ledger} ledger entries not exported: the app recomputes payouts from raw rows.${adjusts ? ` ${adjusts} manual 'adjust' entries will be LOST; note them down.` : ''}`);
db.close();
