// けっこんしき's categories renamed once on the record (health plan C8; app/src/lib/contract/wedCats.ts): every task whose
// category is an old English starter name (Guests, Paperwork, …) and the category list, in Japanese (招待客, 手続き, …),
// sent as person A's ops through the phones' own path (`/api` events), so the record's rules take them and every
// phone syncs them as it syncs an edit. Idempotent: run again, it finds nothing to send.
// Take a bookmark first (`node scripts/record.ts bookmark`): this changes what the record holds.
//   node scripts/wedding-cats.ts [--test]           the plan: what it would send (nothing sent)
//   node scripts/wedding-cats.ts --apply [--test]   sent (a dry run's plan, then the record's answer per op)
// Keys as admin.ts reads them (KEY_A / KEY_B, else KEYS_FILE, else .smoke-keys with --test or ~/.config/island-fund/keys);
// never printed.
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { RELAY, TEST, signed } from './admin.ts';
import { WedBook, isWedType, wedRowOf, type WedRow } from '../../app/src/lib/contract/wedding.ts';
import { catsRenameOps } from '../../app/src/lib/contract/wedCats.ts';

const APPLY = process.argv.includes('--apply');

/** Person A's key (the ops are A's, as if A renamed them on a phone). */
function keyA(): string {
  if (process.env.KEY_A) return process.env.KEY_A.trim();
  const f = process.env.KEYS_FILE ?? (TEST ? `${import.meta.dirname}/../.smoke-keys` : `${homedir()}/.config/island-fund/keys`);
  const line = existsSync(f) ? readFileSync(f, 'utf8').split('\n').find((l) => l.startsWith('KEY_A=')) : undefined;
  if (!line) throw new Error('no KEY_A: set it in the environment, or KEYS_FILE');
  return line.slice('KEY_A='.length).trim();
}

/** The record's wedding rows, folded as the phones fold them (the dump's events, a page at a time, in `at` order). */
async function board(): Promise<WedBook> {
  const rows: WedRow[] = [];
  let after: unknown;
  do {
    const r = (await signed({ op: 'dump', limit: 5000, ...(after ? { after } : {}) })) as { ok: boolean; next?: string; rows: { events?: unknown[][] } };
    if (!r.ok) throw new Error(`dump: ${JSON.stringify(r)}`);
    for (const [, person, , type, data] of r.rows.events ?? []) {
      if (typeof type !== 'string' || !isWedType(type)) continue;
      const d = typeof data === 'string' ? JSON.parse(data) : data;
      const row = wedRowOf(type, d as Record<string, unknown>, person as 'A' | 'B');
      if (row) rows.push(row);
    }
    after = r.next;
  } while (after);
  return new WedBook().fold(rows);
}

const book = await board();
const now = Date.now();
const ops = catsRenameOps(book, now);
console.log(`${TEST ? 'test' : 'production'} relay: ${ops.length} op(s) to send`);
for (const o of ops) console.log(o.type === 'wtask' ? `  task ${o.data.id} 「${o.data.title}」 → ${o.data.cat}` : `  categories → ${(o.data.v as string[]).join(' · ')}`);
if (!APPLY || !ops.length) {
  if (ops.length) console.log('(a dry run: --apply sends them)');
  process.exit(0);
}

const events = ops.map((o, i) => ({ id: `wcats-${now.toString(36)}-${i}`, type: o.type, data: o.data }));
const res = await fetch(`${RELAY}/api`, {
  method: 'POST',
  headers: { 'Content-Type': 'text/plain;charset=utf-8' },
  body: JSON.stringify({ key: keyA(), action: 'events', events })
});
const reply = (await res.json()) as { ok: boolean; results?: { id: string; ok: boolean; error?: string }[] };
const bad = (reply.results ?? []).filter((r) => !r.ok);
console.log(`sent ${events.length}: ${events.length - bad.length} taken${bad.length ? `, refused: ${JSON.stringify(bad)}` : ''}`);
if (!reply.ok || bad.length) process.exit(1);
console.log(`left to rename: ${catsRenameOps(await board(), Date.now()).length}`);
