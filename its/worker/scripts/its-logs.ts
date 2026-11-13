// One its-runner run, investigated (docs/ops/observability.md "ITS investigating"): the Worker's record of it (GET
// /its/status with a member's key: its events, bookings, and the runner shown if it's this run) and its private log
// (its/runner/scripts/fetch-logs.sh: downloaded, decrypted), merged into one timeline in Tokyo time.
//   npm run its:logs -- <run>[-<attempt>] [--out DIR] [--no-log]
// <run> alone matches every attempt (`<run>-<n>`); with -<attempt>, that one. --no-log: the Worker's record only.
// The key: KEY_A (or KEY_B) from the environment, else KEYS_FILE, else ~/.config/island-fund/keys. Never printed.
// ITS_URL overrides the Worker. The decrypted log holds credentials: delete it when done (the last line says how).
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { BookingEntry, ItsEvent, ItsStatus } from '../../../app/src/lib/its/contract.ts';

const ITS_URL = process.env.ITS_URL ?? 'https://its-bot.island-fund-relay.workers.dev';
const FETCH_LOGS = resolve(import.meta.dirname, '../../runner/scripts/fetch-logs.sh');

export interface RunArg { run: string; attempt: string | null }

/** `<run>` or `<run>-<attempt>` (both numbers, GitHub's), else null. */
export function parseRun(s: string | undefined): RunArg | null {
  const m = /^(\d+)(?:-(\d+))?$/.exec(s ?? '');
  return m ? { run: m[1], attempt: m[2] ?? null } : null;
}

/** A runId (the runner's `${GITHUB_RUN_ID}-${GITHUB_RUN_ATTEMPT}`) is this run's. */
export const isRun = (id: string | undefined, a: RunArg): boolean =>
  !!id && (a.attempt ? id === `${a.run}-${a.attempt}` : id === a.run || id.startsWith(`${a.run}-`));

/** One timeline row: the time (ms; null: before any timestamp), where it came from, the text. `order` keeps a source's
 *  own order among equal times (an event's seq, a log line's number). */
export interface Row { t: number | null; src: 'event' | 'booking' | 'runner' | 'log'; order: number; text: string }

const q = (s: string | undefined) => (s ? JSON.stringify(s) : '');

/** The Worker's rows for this run: its events (and a prev_unclean naming it), its bookings. */
export function workerRows(s: ItsStatus, a: RunArg): Row[] {
  const evs = s.events.filter((e: ItsEvent) => isRun(e.runId, a) || (e.kind === 'prev_unclean' && isRun(e.detail, a)));
  const books = s.bookings.filter((b: BookingEntry) => isRun(b.runId, a));
  return [
    ...evs.map((e): Row => ({ t: e.t, src: 'event', order: e.seq, text: `#${e.seq} ${e.kind} ${[e.runId, e.date, q(e.hotel), e.detail].filter(Boolean).join(' ')}` })),
    ...books.map((b): Row => ({ t: b.at, src: 'booking', order: 0, text: `${b.kind} ${b.date} ${q(b.hotel)}${b.number ? ' number=yes' : ''} id=${b.id}` })),
  ];
}

const ISO = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2}))\s?(.*)$/;
const CLOCK = /^(\d{2}):(\d{2}):(\d{2})\s(.*)$/;

/** The private log's lines with their times: an ISO timestamp with offset (the runner's current lines), or an older
 *  `HH:MM:SS` in Tokyo time (the runner runs with TZ=Asia/Tokyo) dated from `startMs`'s Tokyo day and rolled over at
 *  midnight; a line without one (a traceback, Chrome's output) takes the line before's. */
export function logRows(text: string, startMs: number | null): Row[] {
  const rows: Row[] = [];
  let t: number | null = null;
  let day = startMs === null ? null : Date.parse(`${new Date(startMs + 9 * 3600_000).toISOString().slice(0, 10)}T00:00:00+09:00`);
  let lastClock = -1;
  text.split('\n').forEach((line, i) => {
    if (!line.trim()) return;
    const iso = ISO.exec(line);
    const clock = iso ? null : CLOCK.exec(line);
    if (iso && !Number.isNaN(Date.parse(iso[1]))) {
      t = Date.parse(iso[1]);
      rows.push({ t, src: 'log', order: i, text: iso[2] });
      return;
    }
    if (clock && day !== null) {
      const secs = Number(clock[1]) * 3600 + Number(clock[2]) * 60 + Number(clock[3]);
      if (secs < lastClock) day += 86_400_000;
      lastClock = secs;
      t = day + secs * 1000;
      rows.push({ t, src: 'log', order: i, text: clock[4] });
      return;
    }
    rows.push({ t, src: 'log', order: i, text: line });
  });
  return rows;
}

/** Oldest first; rows without a time first, in their order. Stable among equal times (events by seq, lines by number). */
export function merge(rows: Row[]): Row[] {
  const rank = { runner: 0, event: 1, booking: 2, log: 3 };
  return [...rows].sort((a, b) => (a.t ?? -Infinity) - (b.t ?? -Infinity) || rank[a.src] - rank[b.src] || a.order - b.order);
}

/** Tokyo time, a date line when the day changes. */
export function format(rows: Row[]): string[] {
  const out: string[] = [];
  let day = '';
  for (const r of rows) {
    const jst = r.t === null ? null : new Date(r.t + 9 * 3600_000).toISOString();
    if (jst && jst.slice(0, 10) !== day) out.push(`── ${(day = jst.slice(0, 10))} (JST)`);
    out.push(`${jst ? jst.slice(11, 23) : '            '} ${r.src.padEnd(7)} ${r.text}`);
  }
  return out;
}

/** A member key: never printed. */
function keyOf(): string {
  const env = process.env.KEY_A ?? process.env.KEY_B;
  if (env?.trim()) return env.trim();
  const file = process.env.KEYS_FILE ?? join(homedir(), '.config/island-fund/keys');
  if (existsSync(file)) {
    const kv = Object.fromEntries(readFileSync(file, 'utf8').trim().split('\n').map((l) => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()]));
    if (kv.KEY_A || kv.KEY_B) return kv.KEY_A || kv.KEY_B;
  }
  throw new Error('no member key (KEY_A in the environment, KEYS_FILE, or ~/.config/island-fund/keys)');
}

async function fetchStatus(): Promise<ItsStatus> {
  const res = await fetch(`${ITS_URL}/its/status`, { headers: { Authorization: `Bearer ${keyOf()}`, 'X-Request-Id': `its-logs-${Date.now().toString(36)}` } });
  if (!res.ok) throw new Error(`GET /its/status: ${res.status}`);
  return (await res.json()) as ItsStatus;
}

/** fetch-logs.sh into `out`; an older script that takes only `<run>` is asked again with it (the latest attempt). */
function fetchLog(a: RunArg, out: string): boolean {
  const go = (id: string) => spawnSync(FETCH_LOGS, [id, out], { stdio: ['ignore', 'inherit', 'inherit'] }).status;
  let code = go(a.attempt ? `${a.run}-${a.attempt}` : a.run);
  if (code === 2 && a.attempt) code = go(a.run);
  return code === 0;
}

function findLog(dir: string): string | null {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (name === 'its_booking.log') return p;
    if (statSync(p).isDirectory()) {
      const f = findLog(p);
      if (f) return f;
    }
  }
  return null;
}

async function main(): Promise<void> {
  const argv: string[] = process.argv.slice(2);
  const a = parseRun(argv.find((x: string) => !x.startsWith('--') && argv[argv.indexOf(x) - 1] !== '--out'));
  if (!a) throw new Error('usage: npm run its:logs -- <run>[-<attempt>] [--out DIR] [--no-log]');
  const id = a.attempt ? `${a.run}-${a.attempt}` : a.run;
  const out = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : `/tmp/its-logs-${id}`;
  const s = await fetchStatus();
  const rows = workerRows(s, a);
  const r = s.runner && isRun(s.runner.runId, a) ? s.runner : null;
  if (r) {
    const err = r.lastError ? ` lastError=${r.lastError.step}/${r.lastError.status ?? '-'}/${r.lastError.cls}` : '';
    rows.push({ t: r.lastSeen, src: 'runner', order: 0, text: `last report ${r.runId} phase=${r.phase} scans=${r.scans} fail=${r.scanFailures} solves=${r.solves.ok}/${r.solves.failed} unsynced=${r.unsynced}${err}${r.runUrl ? ` ${r.runUrl}` : ''}` });
  }
  console.log(`Worker ${ITS_URL}: verdict=${s.verdict} reasons=${s.reasons.join(',') || '-'} lease=${s.lease ? `${s.lease.holder}` : '-'}; run ${id}: ${rows.filter((x) => x.src === 'event').length} events, ${rows.filter((x) => x.src === 'booking').length} bookings${r ? ', the runner shown' : ''} (the Worker keeps the last 40 of each class)`);
  let logged = false;
  if (!argv.includes('--no-log')) {
    if (fetchLog(a, out)) {
      const f = findLog(out);
      if (f) {
        const start = r?.startedAt ?? Math.min(...rows.map((x) => x.t ?? Infinity));
        rows.push(...logRows(readFileSync(f, 'utf8'), Number.isFinite(start) ? start : null));
        logged = true;
      } else console.error(`its-logs: no its_booking.log under ${out}`);
    } else console.error('its-logs: fetch-logs.sh failed (above); the Worker\'s record only');
  }
  for (const line of format(merge(rows))) console.log(line);
  if (logged || existsSync(out)) console.log(`\nThe decrypted log holds credentials. When done: rm -rf ${out}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(`its-logs: ${e instanceof Error ? e.message : e}`);
    process.exit(1);
  });
}
