// The record's HTTP side (src/storeRoute.ts) in front of a real store (src/store.ts on node:sqlite): /api from a page,
// a Shortcut or a server, and the signed /import.
import { createHash } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { adminRoute, apiRoute, type StoreRoom } from '../src/storeRoute.ts';
import { adminSecret, adminSig } from '../src/sign.ts';
import { StoreCore } from '../src/store.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';
import { apiWithMeta, type ReqMeta } from '../src/reqMeta.ts';
import { roleOfKey } from '../src/auth.ts';

const KEY_A = 'a1'.repeat(16);
const KEY_B = 'b2'.repeat(16);
const ALLOWED = 'https://huangwaylon.github.io';
const NOW = Date.parse('2026-11-02T03:00:00.000Z');

let core: StoreCore;
let told: Notice[];
let room: StoreRoom;
beforeEach(() => {
  const db = memSql();
  told = [];
  core = new StoreCore({ sql: db.sql, tx: db.tx, keys: { KEY_A, KEY_B }, now: () => NOW, notify: (n) => told.push(n) });
  room = {
    apiMeta: (text) => apiWithMeta(core, text, (k) => roleOfKey(k, { KEY_A, KEY_B })),
    // the object's dispatch (storeObject.ts admin) for the one op the store does itself
    async adminSigned(text, t, sig) {
      const v = await core.signedOp(text, t, sig);
      if ('status' in v) return v;
      return { status: 200, body: JSON.stringify(v.op.op === 'load' ? core.load(v.op) : { ok: false, error: 'bad_request' }) };
    }
  };
});

const req = (body: string, headers: Record<string, string> = {}, method = 'POST') =>
  new Request('https://relay.example/api', { method, body: method === 'POST' ? body : undefined, headers: { 'Content-Type': 'text/plain', ...headers } });

describe('/api', () => {
  it('answers a page on an allowed origin with CORS, a request without an Origin (a Shortcut) without; another site 403', async () => {
    const page = await apiRoute(req(JSON.stringify({ key: KEY_A, action: 'whoami' }), { Origin: ALLOWED }), ALLOWED, () => room, () => NOW);
    expect(page.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED);
    expect(await page.json()).toEqual({ ok: true, me: 'A', build: expect.any(String) });
    const body = JSON.stringify({ key: KEY_B, action: 'ingest', dates: 'Oct 1, 2026', steps: '4000' });
    const shortcut = await apiRoute(req(body), ALLOWED, () => room, () => NOW);
    expect(shortcut.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(await shortcut.json()).toEqual({ ok: true, metrics: 1 });
    expect(JSON.parse(core.handleText(JSON.stringify({ key: KEY_B, action: 'uploads' }))).rows[0].bytes).toBe(new TextEncoder().encode(body).length);
    expect((await apiRoute(req('{}', { Origin: 'https://evil.example' }), ALLOWED, () => room, () => NOW)).status).toBe(403);
    expect((await apiRoute(req('', { Origin: ALLOWED }, 'OPTIONS'), ALLOWED, () => room, () => NOW)).status).toBe(204);
  });

  it('garbage, an empty or an oversized body is a JSON refusal (status 200)', async () => {
    for (const [body, error] of [['{oops', 'bad_request'], ['', 'bad_request'], ['[1]', 'bad_request'], ['x'.repeat(1_000_001), 'too_large']] as const) {
      const res = await apiRoute(req(body), ALLOWED, () => room, () => NOW);
      expect([res.status, await res.json()]).toEqual([200, { ok: false, error }]);
    }
  });
});

describe('/api before the record (the Worker)', () => {
  const keys = { KEY_A, KEY_B };
  it('refuses a body without a known key in the Worker: the record never hears it', async () => {
    // 2026-11-05 review: every body went to the record object, a stranger's 1 MB of junk included
    let heard = 0;
    const counting: StoreRoom = { ...room, apiMeta: (t) => (heard++, room.apiMeta(t)) };
    const refused = [
      JSON.stringify({ key: 'c3'.repeat(16), action: 'snapshot' }),
      JSON.stringify({ action: 'ingest', dates: 'x'.repeat(2000) }),
      'x'.repeat(5000)
    ];
    for (const body of refused) {
      expect(await (await apiRoute(req(body), ALLOWED, () => counting, undefined, keys)).json(), body.slice(0, 40)).toEqual({ ok: false, error: 'unauthorized' });
    }
    expect(heard).toBe(0);
    // a known key anywhere at the top (a Shortcut's dictionary may put it last), keyless health, small junk: on to the record
    const last = JSON.stringify({ action: 'ingest', dates: 'Oct 1, 2026', steps: '4000', key: KEY_B });
    expect(await (await apiRoute(req(last), ALLOWED, () => counting, undefined, keys)).json()).toEqual({ ok: true, metrics: 1 });
    expect(await (await apiRoute(req('{"action":"health"}'), ALLOWED, () => counting, undefined, keys)).json()).toMatchObject({ ok: true });
    expect(await (await apiRoute(req('{oops'), ALLOWED, () => counting, undefined, keys)).json()).toEqual({ ok: false, error: 'bad_request' });
    expect(heard).toBe(3);
  });

  it('logs a refused key by its hash (`kh`: 4 hex of its SHA-256, never the key), none for a body without one', async () => {
    const metas: ReqMeta[] = [];
    const fake = 'a1'.repeat(32);
    await apiRoute(req(JSON.stringify({ key: fake, action: 'whoami' })), ALLOWED, () => room, (m) => void metas.push(m), keys);
    await apiRoute(req(JSON.stringify({ key: fake.toUpperCase(), action: 'ingest', rid: 'r1abcdef', sid: 's1abcdef' })), ALLOWED, () => room, (m) => void metas.push(m), keys);
    await apiRoute(req('x'.repeat(5000)), ALLOWED, () => room, (m) => void metas.push(m), keys);
    const want = createHash('sha256').update(fake).digest('hex').slice(0, 4);
    expect(metas.map((m) => [m.st, m.kh])).toEqual([['unauthorized', want], ['unauthorized', want], ['unauthorized', undefined]]);
    // the caller named: its action and ids (the stale key's: a Shortcut's ingest, an old app)
    expect(metas.map((m) => [m.action, m.rid, m.sid])).toEqual([['whoami', null, null], ['ingest', 'r1abcdef', 's1abcdef'], ['other', null, null]]);
    expect(JSON.stringify(metas)).not.toContain(fake);
  });
});

describe('/admin', () => {
  const signed = async (body: string, t = NOW) => {
    const secret = (await adminSecret({ KEY_A, KEY_B }))!;
    return new Request('https://relay.example/admin', { method: 'POST', body, headers: { 'X-Island-Time': String(t), 'X-Island-Sig': await adminSig(secret, String(t), body) } });
  };

  it('takes an op signed by who holds both keys (a load: a dump’s rows, idempotent); refuses an unsigned, stale or tampered one', async () => {
    const body = JSON.stringify({ op: 'load', rows: { metrics: [['2026-11-01T00:00:00.000Z', 'A', '2026-11-01', 'steps', 1]] } });
    const ok = await adminRoute(await signed(body), () => room, { KEY_A, KEY_B }, () => NOW);
    expect(await ok.json()).toEqual({ ok: true, metrics: 1, events: 0, uploads: 0, skipped: 0, counts: { metrics: 1, events: 0, ids: 0, uploads: 0 } });
    expect(await (await adminRoute(await signed(body), () => room, { KEY_A, KEY_B }, () => NOW)).json()).toMatchObject({ metrics: 0 }); // again: nothing new
    // a load that added rows tells the phones (once: the second added nothing)
    expect(told).toEqual([{ what: 'ingest', who: 'A', at: '2026-11-01T00:00:00.000Z', rev: 'e1' }]);
    expect((await adminRoute(new Request('https://relay.example/admin', { method: 'POST', body }), () => room, { KEY_A, KEY_B }, () => NOW)).status).toBe(401);
    expect((await adminRoute(await signed(body, NOW - 10 * 60_000), () => room, { KEY_A, KEY_B }, () => NOW)).status).toBe(401);
    const s = await signed(body);
    const tampered = new Request(s.url, { method: 'POST', body: body.replace('"steps",1', '"steps",9'), headers: s.headers });
    expect((await adminRoute(tampered, () => room, { KEY_A, KEY_B }, () => NOW)).status).toBe(401);
    // a forged signature never reaches the record (no Durable Object request)
    let reached = 0;
    const counting: StoreRoom = { ...room, adminSigned: (...a) => (reached++, room.adminSigned(...a)) };
    expect((await adminRoute(new Request(s.url, { method: 'POST', body: body.replace('"steps",1', '"steps",9'), headers: s.headers }), () => counting, { KEY_A, KEY_B }, () => NOW)).status).toBe(401);
    expect(reached).toBe(0);
    expect((await adminRoute(await signed('{"rows":{}}'), () => room, { KEY_A, KEY_B }, () => NOW)).status).toBe(400); // no op
    expect(await (await adminRoute(await signed('{"op":"load","rows":{"metrics":5}}'), () => room, { KEY_A, KEY_B }, () => NOW)).json()).toEqual({ ok: false, error: 'bad_request' });
    expect(core.counts().metrics).toBe(1);
  });

  it('a signed restore, rev or logpurge is taken once: its replay within the window is refused (409)', async () => {
    // 2026-11-05 review: a logged signed request could be sent again for 5 minutes (a second restore, a second purge)
    for (const op of ['rev', 'restore', 'logpurge']) {
      const body = JSON.stringify({ op });
      const s = await signed(body);
      const again = new Request(s.url, { method: 'POST', body, headers: s.headers });
      expect((await adminRoute(s, () => room, { KEY_A, KEY_B }, () => NOW)).status, op).toBe(200);
      expect((await adminRoute(again, () => room, { KEY_A, KEY_B }, () => NOW)).status, op).toBe(409);
      // signed anew (a ms later): its own
      expect((await adminRoute(await signed(body, NOW + 1), () => room, { KEY_A, KEY_B }, () => NOW)).status, op).toBe(200);
    }
    // a read may be sent again
    const body = '{"op":"counts"}';
    const s = await signed(body);
    expect((await adminRoute(s, () => room, { KEY_A, KEY_B }, () => NOW)).status).toBe(200);
    expect((await adminRoute(new Request(s.url, { method: 'POST', body, headers: s.headers }), () => room, { KEY_A, KEY_B }, () => NOW)).status).toBe(200);
  });

  it('a missing, malformed or stale signature is refused in the Worker: the record never hears it', async () => {
    let heard = 0;
    const counting: StoreRoom = { ...room, adminSigned: (...x) => (heard++, room.adminSigned(...x)) };
    const body = '{"op":"counts"}';
    const s = await signed(body);
    const sig = s.headers.get('X-Island-Sig')!;
    for (const [t, g] of [[null, sig], [String(NOW), null], ['12', sig], [String(NOW), 'zz'], [String(NOW - 6 * 60_000), sig], [String(NOW + 6 * 60_000), sig]]) {
      const h: Record<string, string> = {};
      if (t) h['X-Island-Time'] = t;
      if (g) h['X-Island-Sig'] = g;
      expect((await adminRoute(new Request('https://relay.example/admin', { method: 'POST', body, headers: h }), () => counting, { KEY_A, KEY_B }, () => NOW)).status, `${t} ${g}`).toBe(401);
    }
    expect(heard).toBe(0);
    expect((await adminRoute(s, () => counting, { KEY_A, KEY_B }, () => NOW)).status).toBe(200);
    expect(heard).toBe(1);
  });
});
