// The record's admin tool (docs/ops/runbook.md#13-the-record), run from a Mac with the two person keys in the
// environment (never on the command line, never logged):
//   KEY_A=… KEY_B=… node scripts/record.ts <command> [--test]
// --test: the test relay (island-fund-relay-test) instead of production.
//   counts              rows per table, the revision, the newest `at`
//   import-sheet        the sheet's history (a full Apps Script snapshot) into the record, in chunks; idempotent:
//                       run it again to fill in a copy that didn't land (it skips what the record has)
//   bookmark [ms]       point-in-time recovery: the bookmark now and `ms` ago (default 1 h)
//   restore <bookmark>  restore the record to a bookmark (then `rev`)
//   rev                 a new epoch: every phone refetches everything
//   export              the export to the sheet now (the cron does it every 15 minutes when the record changed)
//   dump                every row as JSON on stdout (a backup: `> island-record-YYYY-MM-DD.json`)
//   load <file>         a dump back into an empty record (import of every row)
//   parity              the model's numbers per person from the sheet's snapshot and the record's: must be equal
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { parity } from './parity.ts';

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwAMHDa69-GmAEmhrO7WXiRhkQoJLzCImiBkwV7itHbSATMC_wtHFEgy4Tn5eXzKjGU/exec';
const args = process.argv.slice(2).filter((a: string) => a !== '--test');
const TEST = process.argv.includes('--test');
const RELAY = TEST ? 'https://island-fund-relay-test.island-fund-relay.workers.dev' : 'https://island-fund-relay.island-fund-relay.workers.dev';
// a KEY=value file instead (KEYS_FILE=relay/.smoke-keys for the test relay)
const fileKeys: Record<string, string> = process.env.KEYS_FILE
  ? Object.fromEntries(readFileSync(process.env.KEYS_FILE, 'utf8').trim().split('\n').map((l) => l.split('=') as [string, string]))
  : {};
const KEY_A = (process.env.KEY_A ?? fileKeys.KEY_A)?.trim().toLowerCase() ?? '';
const KEY_B = (process.env.KEY_B ?? fileKeys.KEY_B)?.trim().toLowerCase() ?? '';
if (!KEY_A || !KEY_B) {
  console.error('set KEY_A and KEY_B in the environment');
  process.exit(1);
}
const secret = createHmac('sha256', `${KEY_A}:${KEY_B}`).update('island-relay-notify/1').digest('hex');

/** A signed POST to the record's /import (rows, or an admin `op`). */
export async function signed(body: object): Promise<Record<string, unknown>> {
  const text = JSON.stringify(body);
  const t = String(Date.now());
  const res = await fetch(`${RELAY}/import`, {
    method: 'POST', body: text,
    headers: { 'X-Island-Time': t, 'X-Island-Sig': createHmac('sha256', secret).update(`${t}.${text}`).digest('hex') }
  });
  if (!res.ok) throw new Error(`/import: ${res.status} ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

/** POST {key, action, …} to the Apps Script web app or the record's /api. */
export async function api(where: 'gas' | 'record', action: string, body: object = {}, key = KEY_A): Promise<Record<string, any>> {
  const res = await fetch(where === 'gas' ? GAS_URL : `${RELAY}/api`, {
    method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ ...body, key, action }), redirect: 'follow'
  });
  return (await res.json()) as Record<string, any>;
}

const CHUNK = 400;

async function importRows(rows: { metrics?: unknown[][]; events?: unknown[][]; uploads?: unknown[][] }): Promise<void> {
  const all = (['metrics', 'events', 'uploads'] as const).flatMap((tab) => (rows[tab] ?? []).map((r) => ({ tab, r })));
  all.sort((x, y) => String(x.r[0]).localeCompare(String(y.r[0])));
  let sum = { metrics: 0, events: 0, uploads: 0, skipped: 0 };
  let last: unknown = null;
  for (let i = 0; i < all.length; i += CHUNK) {
    const part: Record<string, unknown[][]> = { metrics: [], events: [], uploads: [] };
    for (const { tab, r } of all.slice(i, i + CHUNK)) part[tab].push(r);
    const r = (await signed({ rows: part })) as typeof sum & { counts: unknown };
    sum = { metrics: sum.metrics + r.metrics, events: sum.events + r.events, uploads: sum.uploads + r.uploads, skipped: sum.skipped + r.skipped };
    last = r.counts;
  }
  console.log('imported', JSON.stringify(sum), 'record now', JSON.stringify(last));
}

const [cmd, arg] = args;
switch (cmd) {
  case 'counts':
    console.log(JSON.stringify(await signed({ op: 'counts' })));
    break;
  case 'import-sheet': {
    const t0 = Date.now();
    const snap = await api('gas', 'snapshot');
    if (!snap.ok) throw new Error(`snapshot: ${JSON.stringify(snap)}`);
    console.log(`sheet snapshot: ${snap.rows.metrics.length} metrics, ${snap.rows.events.length} events, ${JSON.stringify(snap).length} bytes, ${Date.now() - t0} ms`);
    await importRows(snap.rows);
    break;
  }
  case 'bookmark':
    console.log(JSON.stringify(await signed({ op: 'bookmark', ...(arg ? { ms: Number(arg) } : {}) })));
    break;
  case 'restore':
    console.log(JSON.stringify(await signed({ op: 'restore', bookmark: arg })));
    break;
  case 'export':
    console.log(JSON.stringify(await signed({ op: 'export' })));
    break;
  case 'rev':
    console.log(JSON.stringify(await signed({ op: 'rev' })));
    break;
  case 'dump':
    process.stdout.write(`${JSON.stringify(await signed({ op: 'dump' }))}\n`);
    break;
  case 'load':
    await importRows((JSON.parse(readFileSync(arg, 'utf8')) as { rows: Record<string, unknown[][]> }).rows);
    break;
  case 'parity': {
    const ok = await parity(
      await Promise.all(['gas', 'record'].map((w) => api(w as 'gas' | 'record', 'snapshot'))) as [Record<string, any>, Record<string, any>]
    );
    process.exit(ok ? 0 : 1);
    break;
  }
  default:
    console.error('commands: counts | import-sheet | bookmark [ms] | restore <bookmark> | rev | export | dump | load <file> | parity  [--test]');
    process.exit(1);
}
