// The shared money on the relay (src/finance.ts, docs/finance.md): members only at two layers (the Worker's gate before
// the record parses a byte, the record's own rule), soft delete by `del` (never pruned), the append-only fin_log in the
// op's transaction, the money's own snapshot, pairing codes, the nightly check, the admin's import, the history read.
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { StoreCore } from '../src/store.ts';
import { apiRoute, finGate, type StoreRoom } from '../src/storeRoute.ts';
import { apiWithMeta, type ReqMeta } from '../src/reqMeta.ts';
import { roleOfKey } from '../src/auth.ts';
import { FIN_IMPORT_MAX, PAIR_TRIES_PER_MINUTE, PAIR_TTL_MS, sha256Hex } from '../src/finance.ts';
import { EVENT_TYPES } from '../../app/src/lib/contract/api.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';

const KEY_A = 'a'.repeat(64);
const KEY_B = 'b'.repeat(64);
const KEY_C = 'c'.repeat(64);
const KEYS = { KEY_A, KEY_B, KEY_C };
const T0 = Date.parse('2026-11-28T03:00:00.000Z');
const DAY = 86_400_000;
const FIN = EVENT_TYPES.filter((t) => t.startsWith('fin_'));

const entry = (id: string, o: object = {}) => ({ id, k: 'x', d: '2026-11-28', amt: 1000, payer: 'A', ps: 5000, desc: 'lunch', cat: 'Dining', ...o });
const tpl = { id: 'rent', desc: 'rent', cat: 'Rent', payer: 'B', amt: 90000, ps: 5000, months: [], day: 27, from: '2026-01', to: null };
const cfg = { id: 'cfg', cats: ['Dining', 'Rent'], split: { A: 8000, B: 5000 }, notes: [] };
const sample: Record<string, object> = { fin_e: entry('s1'), fin_t: tpl, fin_c: cfg };

let now: number;
let store: StoreCore;
let notices: [Notice, boolean | undefined][];
let db: ReturnType<typeof memSql>;
let logged: [string, Record<string, unknown>][];
beforeEach(() => {
  now = T0;
  notices = [];
  logged = [];
  db = memSql();
  store = new StoreCore({ sql: db.sql, tx: db.tx, keys: KEYS, now: () => now, notify: (n, g) => notices.push([n, g]), log: (e, d) => logged.push([e, d]) });
});
const call = (key: string | undefined, action: string, extra: object = {}) => store.handle({ ...(key ? { key } : {}), action, ...extra }, 100) as Record<string, any>;
const a = (action: string, extra: object = {}) => call(KEY_A, action, extra);
const b = (action: string, extra: object = {}) => call(KEY_B, action, extra);
const g = (action: string, extra: object = {}) => call(KEY_C, action, extra);
const ev = (id: string, type: string, data: object) => ({ id, type, data });
const finLog = () => db.sql.exec<{ who: string; type: string; id: string; before: string | null; after: string }>('SELECT who, type, id, before, after FROM fin_log ORDER BY seq').toArray();

describe('the gate (the Worker, before the record parses a byte)', () => {
  const req = (body: string) => new Request('https://relay.example/api', { method: 'POST', body, headers: { 'Content-Type': 'text/plain' } });
  let reached: string[];
  let metas: ReqMeta[];
  const room: StoreRoom = {
    apiMeta: (text) => (reached.push(text), apiWithMeta(store, text, (k) => roleOfKey(k, KEYS))),
    adminSigned: () => ({ status: 404, body: '' })
  };
  beforeEach(() => {
    reached = [];
    metas = [];
  });
  const send = async (body: object | string) => (await apiRoute(req(typeof body === 'string' ? body : JSON.stringify(body)), '', () => room, (m) => metas.push(m), KEYS)).json() as Promise<Record<string, any>>;

  it('refuses the guest’s key every fin_* op (each type of EVENT_TYPES), in a batch too, never reaching the record', async () => {
    expect(FIN.length).toBeGreaterThan(0);
    for (const t of FIN) {
      expect(await send({ key: KEY_C, action: 'event', id: `g-${t}`, type: t, data: sample[t] ?? {} }), t).toEqual({ ok: false, error: 'forbidden', detail: 'members only' });
      expect(await send({ key: KEY_C, action: 'events', events: [ev('ok1', 'find', { kind: 'fish', id: 'koi' }), ev(`g2-${t}`, t, sample[t] ?? {})] }), t).toMatchObject({ ok: false, error: 'forbidden' });
    }
    expect(reached).toEqual([]);
    expect(metas.at(-1)).toMatchObject({ action: 'events', st: 'forbidden', role: 'G', why: 'fin' });
    // (nothing of it in the record: the find of the refused batch neither)
    expect(a('snapshot').rows.events).toEqual([]);
  });

  it('every spelling: JSON escapes in the key or the value, spaces; the money’s snapshot, history and a pairing code', async () => {
    for (const body of [
      `{"key":"${KEY_C}","action":"event","id":"x1","\\u0074ype" : "\\u0066in_e","data":{}}`,
      `{"key":"${KEY_C}","action":"event","id":"x2","type":"fin\\u005Fc","data":{}}`,
      JSON.stringify({ key: KEY_C, action: 'snapshot', kinds: 'fin' }),
      JSON.stringify({ key: KEY_C, action: 'finlog' }),
      JSON.stringify({ key: KEY_C, action: 'paircode' })
    ]) expect(await send(body), body).toMatchObject({ ok: false, error: 'forbidden' });
    expect(reached).toEqual([]);
    expect(finGate('{"type":"food","t":"type fin_"}')).toBe(false);
  });

  it('lets the guest’s other bodies and a member’s money through', async () => {
    expect(await send({ key: KEY_C, action: 'event', id: 'gf', type: 'find', data: { kind: 'fish', id: 'koi' } })).toMatchObject({ ok: true });
    expect(await send({ key: KEY_A, action: 'event', id: 'af', type: 'fin_e', data: entry('e1') })).toMatchObject({ ok: true });
    expect(reached).toHaveLength(2);
  });
});

describe('the record: members only (the second layer, behind the gate)', () => {
  it('takes a member’s entry, template and config; refuses the guest each (forbidden) and never serves it them', () => {
    expect(a('event', ev('a1', 'fin_e', entry('e1')))).toMatchObject({ ok: true });
    expect(b('event', ev('b1', 'fin_t', tpl))).toMatchObject({ ok: true });
    expect(a('events', { events: [ev('a2', 'fin_c', cfg), ev('a3', 'find', { kind: 'fish', id: 'koi' })] }).results).toMatchObject([{ ok: true }, { ok: true }]);
    for (const t of FIN) expect(g('event', ev(`g-${t}`, t, sample[t] ?? {})), t).toEqual({ ok: false, error: 'forbidden' });
    expect(g('events', { events: [ev('g1', 'fin_e', entry('e9'))] }).results).toEqual([{ id: 'g1', ok: false, error: 'forbidden' }]);
    const types = (r: Record<string, any>) => r.rows.events.map((x: unknown[]) => x[3]);
    expect(types(a('snapshot'))).toEqual(['fin_e', 'fin_t', 'fin_c', 'find']);
    expect(types(g('snapshot'))).toEqual(['find']);
    expect(types(g('snapshot', { page: 10 }))).toEqual(['find']);
    expect(types(g('snapshot', { since: new Date(T0 - 1000).toISOString() }))).toEqual(['find']);
    expect(g('snapshot', { kinds: 'fin' })).toEqual({ ok: false, error: 'forbidden' });
    expect(g('finlog')).toEqual({ ok: false, error: 'forbidden' });
    expect(g('paircode')).toEqual({ ok: false, error: 'forbidden' });
  });

  it('the guest never hears of a write of the money alone; a batch with anything else, as before', () => {
    a('event', ev('a1', 'fin_e', entry('e1')));
    a('events', { events: [ev('a2', 'fin_e', entry('e2')), ev('a3', 'fin_c', cfg)] });
    a('events', { events: [ev('a4', 'fin_e', entry('e3')), ev('a5', 'find', { kind: 'fish', id: 'koi' })] });
    a('event', ev('a6', 'find', { kind: 'bug', id: 'ant' }));
    expect(notices.map(([, guest]) => guest)).toEqual([false, false, undefined, undefined]);
  });

  it('a phone never sets `imp` (the import’s alone), and its edit of an imported entry carries it on', () => {
    expect(a('event', ev('a1', 'fin_e', { ...entry('e1'), imp: 1 }))).toEqual({ ok: false, error: 'bad_request' });
    expect(store.fin.importRows({ rows: [{ type: 'fin_e', data: entry('old1') }] })).toMatchObject({ ok: true, added: 1 });
    expect(b('event', ev('b1', 'fin_e', entry('old1', { amt: 2000 })))).toMatchObject({ ok: true });
    const row = a('snapshot').rows.events.find((r: unknown[]) => r[2] === 'b1');
    expect(JSON.parse(row[4])).toEqual({ ...entry('old1', { amt: 2000 }), imp: 1 });
  });

  it('cleans the texts as the phone keeps them (one line each) and refuses what the contract doesn’t take', () => {
    expect(a('event', ev('a1', 'fin_e', entry('e1', { desc: '  two\nlines  ' })))).toMatchObject({ ok: true });
    expect(JSON.parse(a('snapshot').rows.events[0][4]).desc).not.toMatch(/\n/);
    expect(a('event', ev('a2', 'fin_e', entry('e2', { amt: 0 })))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('a3', 'fin_e', entry('e3', { k: 's', ps: 5000 })))).toEqual({ ok: false, error: 'bad_request' });
    expect(a('event', ev('a4', 'fin_c', { ...cfg, id: 'two' }))).toEqual({ ok: false, error: 'bad_request' });
  });
});

describe('fin_log: append-only, in the op’s transaction', () => {
  it('a row per op kept: who, type, id, the slot’s data before and after; a duplicate or a refusal writes none', () => {
    a('event', ev('a1', 'fin_e', entry('e1')));
    now += 1000;
    b('event', ev('b1', 'fin_e', entry('e1', { amt: 1500 })));
    b('event', ev('b1', 'fin_e', entry('e1', { amt: 1500 }))); // a retry: duplicate
    g('event', ev('g1', 'fin_e', entry('e1', { amt: 9 })));
    a('event', ev('a2', 'fin_c', cfg));
    const log = finLog();
    expect(log.map((r) => [r.who, r.type, r.id])).toEqual([['A', 'fin_e', 'e1'], ['B', 'fin_e', 'e1'], ['A', 'fin_c', 'cfg']]);
    expect(log[0].before).toBeNull();
    expect(JSON.parse(log[1].before!)).toEqual(entry('e1'));
    expect(JSON.parse(log[1].after)).toEqual(entry('e1', { amt: 1500 }));
    // (one slot, the latest kept)
    expect(a('snapshot').rows.events.filter((r: unknown[]) => r[3] === 'fin_e')).toHaveLength(1);
  });

  it('a write that throws rolls its log row back with it', () => {
    const put = (store as any).base.put.bind((store as any).base);
    (store as any).base.put = () => {
      throw new Error('disk');
    };
    expect(a('event', ev('a1', 'fin_e', entry('e1')))).toEqual({ ok: false, error: 'unavailable' });
    (store as any).base.put = put;
    expect(finLog()).toEqual([]);
  });

  it('is in the dump and the dump text, and a load of the dump into an empty record brings it back (idempotent)', () => {
    a('event', ev('a1', 'fin_e', entry('e1')));
    a('event', ev('a2', 'fin_e', entry('e1', { del: T0 })));
    const dump = store.dump().rows;
    expect(dump.fin_log).toHaveLength(2);
    expect(JSON.parse([...store.dumpText()].join('')).rows.fin_log).toEqual(dump.fin_log);
    expect((store.dumpPage({ limit: 1 }) as any).rows.fin_log).toEqual(dump.fin_log);
    const db2 = memSql();
    const s2 = new StoreCore({ sql: db2.sql, tx: db2.tx, keys: KEYS, now: () => now, notify: () => {} });
    expect(s2.load({ rows: dump })).toMatchObject({ ok: true, fin_log: 2, counts: expect.objectContaining({ fin_log: 2 }) });
    expect(s2.load({ rows: dump })).toMatchObject({ ok: true, fin_log: 0 });
    expect(s2.dump().rows.fin_log).toEqual(dump.fin_log);
    expect(s2.fin.check()).toMatchObject({ drift: false, n: 0 });
  });

  it('adds no index on events', () => {
    const idx = db.sql.exec<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'events' AND name NOT LIKE 'sqlite_%' ORDER BY name").toArray().map((r) => r.name);
    expect(idx).toEqual(['events_at', 'events_late', 'events_type_person']);
  });
});

describe('soft delete: the payload’s `del`, never the record’s removal', () => {
  it('a deleted entry 61 days on: the nightly prune leaves it, an edit (restore) is taken, not a late op', () => {
    a('event', ev('a1', 'fin_e', entry('e1')));
    a('event', ev('a2', 'fin_e', entry('e1', { del: T0 })));
    now = T0 + 61 * DAY;
    expect(store.tombPrune()).toMatchObject({ deleted: 0 });
    store.nightly(false, true, { fail: () => {}, done: () => {} });
    expect(a('snapshot').rows.events.filter((r: unknown[]) => r[3] === 'fin_e').map((r: unknown[]) => JSON.parse(r[4] as string))).toEqual([entry('e1', { del: T0 })]);
    // brought back: no `del`
    expect(a('event', ev('a3', 'fin_e', entry('e1')))).toEqual({ ok: true });
    expect(a('snapshot').rows.events.filter((r: unknown[]) => r[3] === 'fin_e').map((r: unknown[]) => r[2])).toEqual(['a3']);
    // (a cache from before 61 days still reads on: no removal was let go, so no new rev)
    expect(a('snapshot', { since: new Date(T0).toISOString() }).rev).toBe('e1');
  });
});

describe('the money’s own snapshot (`kinds: fin`, the /money app)', () => {
  it('only the fin_* rows, paged like the whole one, a poll since a time, never wallets or metrics', () => {
    a('ingest', { dates: 'Nov 27, 2026', steps: '5000' });
    for (let i = 0; i < 5; i++) {
      a('event', ev(`f${i}`, 'find', { kind: 'fish', id: `fish-${i}` }));
      a('event', ev(`e${i}`, 'fin_e', entry(`e${i}`)));
      now += 1000;
    }
    const whole = a('snapshot', { kinds: 'fin' });
    expect(whole).toMatchObject({ ok: true, me: 'A', rev: 'e1', rows: { metrics: [] } });
    expect(whole.wallets).toBeUndefined();
    expect(whole.ledgers).toBeUndefined();
    expect(whole.rows.events.map((r: unknown[]) => r[2])).toEqual(['e0', 'e1', 'e2', 'e3', 'e4']);
    const got: string[] = [];
    let after: string | undefined, pages = 0;
    do {
      const r = a('snapshot', { kinds: 'fin', page: 2, ...(after ? { after } : {}) });
      got.push(...r.rows.events.map((x: unknown[]) => x[2] as string));
      after = r.next;
      pages++;
    } while (after);
    expect(got).toEqual(['e0', 'e1', 'e2', 'e3', 'e4']);
    expect(pages).toBe(3);
    const since = whole.rows.events[2][0];
    expect(b('snapshot', { kinds: 'fin', since }).rows.events.map((r: unknown[]) => r[2])).toEqual(['e3', 'e4']);
    expect(b('snapshot', { kinds: 'fin', since, page: 1 }).rows.events.map((r: unknown[]) => r[2])).toEqual(['e3']);
    expect(a('snapshot', { kinds: 'all' })).toEqual({ ok: false, error: 'bad_request' });
  });
});

describe('pairing codes', () => {
  it('a member mints one (5 min, once, bound to them); redeemed without a key for that member’s key; kept only hashed', () => {
    const m = a('paircode');
    expect(m).toMatchObject({ ok: true, exp: T0 + PAIR_TTL_MS });
    expect(m.code).toMatch(/^[2-9A-HJ-NP-Z]{4}-[2-9A-HJ-NP-Z]{4}$/);
    const rows = db.sql.exec<{ h: string; who: string }>('SELECT h, who FROM fin_pair').toArray();
    expect(rows).toHaveLength(1);
    expect(JSON.stringify(rows)).not.toContain(m.code.replace('-', ''));
    expect(call(undefined, 'pairredeem', { code: m.code.toLowerCase().replace('-', ' ') })).toEqual({ ok: true, me: 'A', key: KEY_A });
    expect(call(undefined, 'pairredeem', { code: m.code })).toEqual({ ok: false, error: 'forbidden', detail: 'code' });
    const mb = b('paircode');
    now += PAIR_TTL_MS;
    expect(call(undefined, 'pairredeem', { code: mb.code })).toEqual({ ok: false, error: 'forbidden', detail: 'code' });
    expect(logged.filter(([e]) => e === 'fin.pair').map(([, d]) => d)).toEqual([
      { op: 'mint', ok: true }, { op: 'redeem', ok: true }, { op: 'redeem', ok: false, why: 'code' }, { op: 'mint', ok: true }, { op: 'redeem', ok: false, why: 'code' }
    ]);
  });

  it('a few live a member; redeems rate-limited in all; junk refused', () => {
    for (let i = 0; i < 3; i++) expect(a('paircode')).toMatchObject({ ok: true });
    expect(a('paircode')).toMatchObject({ ok: false, error: 'busy' });
    expect(call(undefined, 'pairredeem', { code: 'x' })).toEqual({ ok: false, error: 'bad_request' });
    for (let i = 1; i < PAIR_TRIES_PER_MINUTE; i++) call(undefined, 'pairredeem', { code: 'ZZZZ-ZZZZ' });
    expect(call(undefined, 'pairredeem', { code: 'ZZZZ-ZZZZ' })).toEqual({ ok: false, error: 'busy' });
    now += 60_000;
    expect(call(undefined, 'pairredeem', { code: 'ZZZZ-ZZZZ' })).toMatchObject({ error: 'forbidden' });
  });

  it('the hash is SHA-256', () => {
    for (const s of ['', 'abc', 'x'.repeat(1000), 'ペア']) expect(sha256Hex(s)).toBe(createHash('sha256').update(s).digest('hex'));
  });
});

describe('the nightly check (fincheck)', () => {
  it('counts the live entries, the balance from the slots and from fin_log’s replay; a drift is an error and finDrift', () => {
    a('event', ev('a1', 'fin_e', entry('e1', { amt: 1000, ps: 5000 })));           // B owes A 500
    b('event', ev('b1', 'fin_e', entry('e2', { payer: 'B', amt: 300, ps: 0, k: 's' })));  // A owes B 300
    a('event', ev('a2', 'fin_e', entry('e3', { del: T0 })));
    expect(store.fin.check()).toEqual({ n: 2, logN: 2, net: 200, logNet: 200, drift: false, bad: 0 });
    expect(store.nightlyStatus().finDrift).toBe(0);
    // a slot changed behind the log's back
    db.sql.exec("UPDATE events SET data = ? WHERE id = 'a1'", JSON.stringify(entry('e1', { amt: 3000, ps: 5000 })));
    expect(store.fin.check()).toMatchObject({ net: 1200, logNet: 200, drift: true });
    expect(store.nightlyStatus().finDrift).toBe(1);
    expect(logged.filter(([e]) => e === 'fin.check').at(-1)?.[1]).toMatchObject({ n: 2, drift: true, logN: 2 });
    // (counts only: never an amount)
    expect(JSON.stringify(logged)).not.toMatch(/3000|1200|lunch|Dining/);
  });
});

describe('the admin’s import (fin_import)', () => {
  const rows = [
    { type: 'fin_e', data: entry('i1') },
    { type: 'fin_e', data: entry('i2', { payer: 'B', ps: 8000 }) },
    { type: 'fin_t', data: tpl },
    { type: 'fin_c', data: cfg },
    { type: 'fin_e', data: entry('bad', { amt: -1 }) },
    { type: 'food', data: {} }
  ];
  it('marks entries imp: 1, writes fin_log (who imp), counts; a re-run is all duplicates; dry writes nothing', () => {
    expect(store.fin.importRows({ rows, dry: true })).toEqual({ ok: true, dry: true, added: 4, dup: 0, bad: 2 });
    expect(a('snapshot').rows.events).toEqual([]);
    expect(store.fin.importRows({ rows })).toEqual({ ok: true, dry: false, added: 4, dup: 0, bad: 2 });
    expect(store.fin.importRows({ rows })).toEqual({ ok: true, dry: false, added: 0, dup: 4, bad: 2 });
    const evs = a('snapshot').rows.events;
    expect(evs.map((r: unknown[]) => [r[1], r[2], r[3]])).toEqual([['A', 'fin-imp-fin_e|i1', 'fin_e'], ['B', 'fin-imp-fin_e|i2', 'fin_e'], ['B', 'fin-imp-fin_t|rent', 'fin_t'], ['A', 'fin-imp-fin_c|cfg', 'fin_c']]);
    expect(JSON.parse(evs[0][4])).toEqual({ ...entry('i1'), imp: 1 });
    expect(finLog().map((r) => r.who)).toEqual(['imp', 'imp', 'imp', 'imp']);
    expect(notices.at(-1)?.[1]).toBe(false);
    // a slot a phone has written since is never written over
    a('event', ev('a1', 'fin_e', entry('i3')));
    expect(store.fin.importRows({ rows: [{ type: 'fin_e', data: entry('i3', { amt: 5 }) }] })).toMatchObject({ added: 0, dup: 1 });
    expect(store.fin.check()).toMatchObject({ drift: false, n: 3 });
    expect(logged.filter(([e]) => e === 'fin.import').map(([, d]) => ({ ...d, ms: 0 }))).toEqual([
      { dry: true, added: 4, dup: 0, bad: 2, ms: 0 }, { dry: false, added: 4, dup: 0, bad: 2, ms: 0 }, { dry: false, added: 0, dup: 4, bad: 2, ms: 0 }, { dry: false, added: 0, dup: 1, bad: 0, ms: 0 }
    ]);
  });

  it('refuses a chunk past FIN_IMPORT_MAX rows', () => {
    expect(store.fin.importRows({ rows: Array.from({ length: FIN_IMPORT_MAX + 1 }, (_, i) => ({ type: 'fin_e', data: entry(`x${i}`) })) })).toEqual({ ok: false, error: 'bad_request' });
  });
});

describe('the history (finlog: the desktop’s)', () => {
  it('fin_log’s rows by seq, paged; one row’s history by id; newest first', () => {
    for (let i = 0; i < 3; i++) a('event', ev(`a${i}`, 'fin_e', entry('e1', { amt: 1000 + i })));
    b('event', ev('b1', 'fin_e', entry('e2')));
    const p1 = b('finlog', { limit: 2 });
    expect(p1.rows.map((r: unknown[]) => r[0])).toEqual([1, 2]);
    expect(p1.next).toBe(2);
    expect(b('finlog', { limit: 2, after: 2 })).toEqual({ ok: true, rows: expect.any(Array) });
    expect(a('finlog', { id: 'e1', desc: true }).rows.map((r: unknown[]) => [r[0], r[2], JSON.parse(r[6] as string).amt])).toEqual([[3, 'A', 1002], [2, 'A', 1001], [1, 'A', 1000]]);
    expect(a('finlog', { id: 'e1', desc: true, limit: 1, after: 3 }).rows.map((r: unknown[]) => r[0])).toEqual([2]);
    expect(a('finlog', { limit: 501 })).toEqual({ ok: false, error: 'bad_request' });
    expect(a('finlog', { type: 'food' })).toEqual({ ok: false, error: 'bad_request' });
  });
});
