// The record's admin tool (docs/ops/runbook.md#13-the-record), run from a Mac with the two person keys in the
// environment (never on the command line of a shared shell, never logged):
//   KEY_A=… KEY_B=… node scripts/record.ts <command> [--test]
// --test: the test relay (island-fund-relay-test) instead of production; KEYS_FILE=.smoke-keys for its keys.
//   counts              rows per table, the revision, the newest `at`
//   bookmark [ms]       point-in-time recovery: the bookmark now and `ms` ago (default 1 h)
//   restore <bookmark>  restore the record to a bookmark (then `rev`)
//   rev                 a new epoch: every phone refetches everything
//   export              the export to the sheet now (the cron does it every 15 minutes when the record changed)
//   dump                every row as JSON on stdout (a backup: `> island-record-YYYY-MM-DD.json`)
//   load <file>         a dump into the record (its rows by the record's rules, in chunks; what it has is skipped)
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

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

/** A signed POST to the record's /admin. */
async function signed(body: object): Promise<Record<string, unknown>> {
  const text = JSON.stringify(body);
  const t = String(Date.now());
  const res = await fetch(`${RELAY}/admin`, {
    method: 'POST', body: text,
    headers: { 'X-Island-Time': t, 'X-Island-Sig': createHmac('sha256', secret).update(`${t}.${text}`).digest('hex') }
  });
  if (!res.ok) throw new Error(`/admin: ${res.status} ${await res.text()}`);
  return (await res.json()) as Record<string, unknown>;
}

const CHUNK = 400;

/** Rows into the record in `at` order, CHUNK at a time (the object's CPU per request stays small). */
async function load(rows: { metrics?: unknown[][]; events?: unknown[][]; uploads?: unknown[][] }): Promise<void> {
  const all = (['metrics', 'events', 'uploads'] as const).flatMap((tab) => (rows[tab] ?? []).map((r) => ({ tab, r })));
  all.sort((x, y) => String(x.r[0]).localeCompare(String(y.r[0])));
  let sum = { metrics: 0, events: 0, uploads: 0, skipped: 0 };
  let last: unknown = null;
  for (let i = 0; i < all.length; i += CHUNK) {
    const part: Record<string, unknown[][]> = { metrics: [], events: [], uploads: [] };
    for (const { tab, r } of all.slice(i, i + CHUNK)) part[tab].push(r);
    const r = (await signed({ op: 'load', rows: part })) as typeof sum & { counts: unknown; ok: boolean };
    if (!r.ok) throw new Error(`load: ${JSON.stringify(r)}`);
    sum = { metrics: sum.metrics + r.metrics, events: sum.events + r.events, uploads: sum.uploads + r.uploads, skipped: sum.skipped + r.skipped };
    last = r.counts;
  }
  console.log('loaded', JSON.stringify(sum), 'record now', JSON.stringify(last));
}

const [cmd, arg] = args;
switch (cmd) {
  case 'counts':
  case 'rev':
  case 'export':
    console.log(JSON.stringify(await signed({ op: cmd })));
    break;
  case 'bookmark':
    console.log(JSON.stringify(await signed({ op: 'bookmark', ...(arg ? { ms: Number(arg) } : {}) })));
    break;
  case 'restore':
    console.log(JSON.stringify(await signed({ op: 'restore', bookmark: arg })));
    break;
  case 'dump':
    process.stdout.write(`${JSON.stringify(await signed({ op: 'dump' }))}\n`);
    break;
  case 'load':
    await load((JSON.parse(readFileSync(arg, 'utf8')) as { rows: Record<string, unknown[][]> }).rows);
    break;
  default:
    console.error('commands: counts | bookmark [ms] | restore <bookmark> | rev | export | dump | load <file>  [--test]');
    process.exit(1);
}
