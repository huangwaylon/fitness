// The record's HTTP side (src/storeRoute.ts) in front of a real store (src/store.ts on node:sqlite): /api from a page,
// a Shortcut or a server, and the signed /import.
import { beforeEach, describe, expect, it } from 'vitest';
import { apiRoute, importRoute, type StoreRoom } from '../src/storeRoute.ts';
import { notifySecret, notifySig } from '../src/notify.ts';
import { StoreCore } from '../src/store.ts';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';
import { memSql } from './sqlite.ts';

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
    api: (text) => core.handleText(text),
    async importSigned(text, t, sig) {
      const r = await core.importSigned(text, t, sig);
      if (r.notice) told.push(r.notice);
      return { status: r.status, body: r.body };
    }
  };
});

const req = (body: string, headers: Record<string, string> = {}, method = 'POST') =>
  new Request('https://relay.example/api', { method, body: method === 'POST' ? body : undefined, headers: { 'Content-Type': 'text/plain', ...headers } });

describe('/api', () => {
  it('answers a page on an allowed origin with CORS, a request without an Origin (a Shortcut) without; another site 403', async () => {
    const page = await apiRoute(req(JSON.stringify({ key: KEY_A, action: 'whoami' }), { Origin: ALLOWED }), ALLOWED, () => room);
    expect(page.headers.get('Access-Control-Allow-Origin')).toBe(ALLOWED);
    expect(await page.json()).toEqual({ ok: true, me: 'A', build: expect.any(String) });
    const body = JSON.stringify({ key: KEY_B, action: 'ingest', dates: 'Oct 1, 2026', steps: '4000' });
    const shortcut = await apiRoute(req(body), ALLOWED, () => room);
    expect(shortcut.headers.get('Access-Control-Allow-Origin')).toBeNull();
    expect(await shortcut.json()).toEqual({ ok: true, metrics: 1 });
    expect(JSON.parse(core.handleText(JSON.stringify({ key: KEY_B, action: 'uploads' }))).rows[0].bytes).toBe(new TextEncoder().encode(body).length);
    expect((await apiRoute(req('{}', { Origin: 'https://evil.example' }), ALLOWED, () => room)).status).toBe(403);
    expect((await apiRoute(req('', { Origin: ALLOWED }, 'OPTIONS'), ALLOWED, () => room)).status).toBe(204);
  });

  it('garbage, an empty or an oversized body is a JSON refusal (status 200, as Apps Script answered)', async () => {
    for (const [body, error] of [['{oops', 'bad_request'], ['', 'bad_request'], ['[1]', 'bad_request'], ['x'.repeat(1_000_001), 'too_large']] as const) {
      const res = await apiRoute(req(body), ALLOWED, () => room);
      expect([res.status, await res.json()]).toEqual([200, { ok: false, error }]);
    }
  });
});

describe('/import', () => {
  const signed = async (body: string, t = NOW) => {
    const secret = (await notifySecret({ KEY_A, KEY_B }))!;
    return new Request('https://relay.example/import', { method: 'POST', body, headers: { 'X-Island-Time': String(t), 'X-Island-Sig': await notifySig(secret, String(t), body) } });
  };

  it('takes rows signed by a server holding both keys, and tells the room; refuses an unsigned, stale or tampered one', async () => {
    const notice = { what: 'ingest', who: 'A', at: '2026-11-01T00:00:00.000Z', rev: 'x' };
    const body = JSON.stringify({ rows: { metrics: [['2026-11-01T00:00:00.000Z', 'A', '2026-11-01', 'steps', 1]] }, notice });
    const ok = await importRoute(await signed(body), () => room);
    expect(await ok.json()).toEqual({ ok: true, metrics: 1, events: 0, uploads: 0, skipped: 0, counts: { metrics: 1, events: 0, ids: 0, uploads: 0 } });
    expect(told).toEqual([notice]);
    expect(await (await importRoute(await signed(body), () => room)).json()).toMatchObject({ metrics: 0 }); // again: nothing new, no notice
    expect(told).toHaveLength(1);
    expect((await importRoute(new Request('https://relay.example/import', { method: 'POST', body }), () => room)).status).toBe(401);
    expect((await importRoute(await signed(body, NOW - 10 * 60_000), () => room)).status).toBe(401);
    const s = await signed(body);
    const tampered = new Request(s.url, { method: 'POST', body: body.replace('"steps",1', '"steps",9'), headers: s.headers });
    expect((await importRoute(tampered, () => room)).status).toBe(401);
    expect((await importRoute(await signed('{"rows":{"metrics":5}}'), () => room)).status).toBe(400);
    expect(core.counts().metrics).toBe(1);
  });
});
