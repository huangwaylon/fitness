// The record's admin tool (docs/ops/runbook.md#9-the-record), run from a Mac with the two person keys in the
// environment (never on the command line of a shared shell, never logged):
//   KEY_A=… KEY_B=… node scripts/record.ts <command> [--test]
// --test: the test relay (island-fund-relay-test) instead of production. Keys: KEY_A / KEY_B, else KEYS_FILE, else
// .smoke-keys (--test) or ~/.config/island-fund/keys (admin.ts).
//   counts              rows per table, the revision, the newest `at`
//   bookmark [ms]       point-in-time recovery: the bookmark now and `ms` ago (default 1 h)
//   restore <bookmark>  restore the record to a bookmark (a new epoch follows by itself; `rev` only if its note says so)
//   rev                 a new epoch: every phone refetches everything
//   dump                every row as JSON on stdout (a backup: `> island-record-YYYY-MM-DD.json`), fetched in pages
//   compact --delete-health-history [max] [rev]
//                       the record's compaction now: it DELETES Health history rows (the locked weeks' superseded
//                       values; the user's rule is to keep them all: dump first). Refused without the flag. `rev`: a
//                       new epoch after it
//   load <file>         a dump into the record (its rows by the record's rules, in chunks; what it has is skipped)
//   held [A|B]          the values an ingest held back (a past day's 0 over a value above it), never served
//   promote <person> <date> <metric> [value]   a held value made a row of the day's history (its latest now)
// (the phones' and the relay's events: scripts/logs.ts, `npm run logs`)
import { readFileSync } from 'node:fs';
import { signed } from './admin.ts';

const args = process.argv.slice(2).filter((a: string) => a !== '--test');

const CHUNK = 400;
/** Rows a dump page (the record's SNAPSHOT_PAGE_MAX at most). */
const DUMP_PAGE = 5000;

/** The dump, a page at a time, as one `{ok, rev, rows}` (what `load` takes); started again if the epoch changes under it. */
async function dump(): Promise<Record<string, unknown>> {
  for (let tries = 0; tries < 3; tries++) {
    const rows = { metrics: [] as unknown[], events: [] as unknown[], uploads: [] as unknown[], held: [] as unknown[] };
    let after: unknown, rev: unknown = null, pages = 0;
    do {
      const r = (await signed({ op: 'dump', limit: DUMP_PAGE, ...(after ? { after } : {}) })) as { ok: boolean; rev: string; next?: string; rows: typeof rows };
      if (!r.ok) throw new Error(`dump: ${JSON.stringify(r)}`);
      if (rev !== null && r.rev !== rev) break;
      rev = r.rev;
      for (const k of ['metrics', 'events', 'uploads', 'held'] as const) rows[k].push(...(r.rows[k] ?? []));
      after = r.next;
      pages++;
    } while (after);
    if (!after) {
      console.error(`dump: ${pages} pages, ${rows.metrics.length} metrics, ${rows.events.length} events, ${rows.uploads.length} uploads, ${rows.held.length} held, rev ${String(rev)}`);
      return { ok: true, rev, rows };
    }
    console.error('dump: a new epoch under it, again');
  }
  throw new Error('dump: the epoch kept changing');
}

/** Rows into the record in `at` order, CHUNK at a time (the object's CPU per request stays small). */
async function load(rows: { metrics?: unknown[][]; events?: unknown[][]; uploads?: unknown[][]; held?: unknown[][] }): Promise<void> {
  const all = (['metrics', 'events', 'uploads', 'held'] as const).flatMap((tab) => (rows[tab] ?? []).map((r) => ({ tab, r })));
  all.sort((x, y) => String(x.r[0]).localeCompare(String(y.r[0])));
  let sum = { metrics: 0, events: 0, uploads: 0, skipped: 0 };
  let last: unknown = null;
  for (let i = 0; i < all.length; i += CHUNK) {
    const part: Record<string, unknown[][]> = { metrics: [], events: [], uploads: [], held: [] };
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
    console.log(JSON.stringify(await signed({ op: cmd })));
    break;
  case 'bookmark':
    console.log(JSON.stringify(await signed({ op: 'bookmark', ...(arg ? { ms: Number(arg) } : {}) })));
    break;
  case 'restore':
    console.log(JSON.stringify(await signed({ op: 'restore', bookmark: arg })));
    break;
  case 'dump':
    process.stdout.write(`${JSON.stringify(await dump())}\n`);
    break;
  case 'compact': {
    if (!process.argv.includes('--delete-health-history')) {
      console.error('compact DELETES Health history rows (the locked weeks\' superseded values; the user keeps them all). Dump first; then, only if the user decided so: compact --delete-health-history [max] [rev]');
      process.exit(1);
    }
    const rest = args.filter((x: string) => x !== '--delete-health-history');
    const max = rest.slice(1).find((x: string) => /^\d+$/.test(x));
    console.log(JSON.stringify(await signed({ op: 'compact', confirm: 'delete-health-history', ...(max ? { max: Number(max) } : {}), ...(rest.includes('rev') ? { rev: true } : {}) })));
    break;
  }
  case 'held':
    console.log(JSON.stringify(await signed({ op: 'held', ...(arg ? { person: arg } : {}) })));
    break;
  case 'promote': {
    const [, person, date, metric, value] = args;
    console.log(JSON.stringify(await signed({ op: 'promote', person, date, metric, ...(value !== undefined ? { value: Number(value) } : {}) })));
    break;
  }
  case 'load':
    await load((JSON.parse(readFileSync(arg, 'utf8')) as { rows: Record<string, unknown[][]> }).rows);
    break;
  default:
    console.error('commands: counts | bookmark [ms] | restore <bookmark> | rev | dump | compact --delete-health-history [max] [rev] | load <file> | held [person] | promote <person> <date> <metric> [value]  [--test]');
    process.exit(1);
}
