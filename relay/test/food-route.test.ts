// `GET /food/kalori` (src/foodRoute.ts, docs/backend.md "Kalori"): members only, CORS, the ETag from the version key
// (a revalidation never reads the value), and the empty namespace; against a fake KV.
import { beforeEach, describe, expect, it } from 'vitest';
import { foodRoute, KALORI_KEY, KALORI_V, type FoodEnv, type FoodKv } from '../src/foodRoute.ts';
import { keyOwner } from '../src/auth.ts';

const KEY_A = '3f9a'.repeat(16), KEY_B = 'b2'.repeat(32), KEY_C = 'c7'.repeat(32);
const keys = { KEY_A, KEY_B, KEY_C };
const ORIGIN = 'https://island-fund.pages.dev';
const BODY = JSON.stringify({ source: 'kalori', shops: { 'tako-ya': { name: 'たこ屋' } }, items: [{ id: 'kal:1', name: 'タコ丼', brand: 'たこ屋', shop: 'tako-ya', kcal: 500, sv: true }] });

/** A KV of strings and metadata that counts its reads by key. */
class FakeKv implements FoodKv {
  rows = new Map<string, { v: string; meta: unknown }>();
  reads: string[] = [];
  put(k: string, v: string, meta: unknown = null) {
    this.rows.set(k, { v, meta });
  }
  async get(k: string): Promise<string | null> {
    this.reads.push(k);
    return this.rows.get(k)?.v ?? null;
  }
  async getWithMetadata<M>(k: string): Promise<{ value: ReadableStream | null; metadata: M | null }> {
    this.reads.push(k);
    const r = this.rows.get(k);
    return { value: r ? new Response(r.v).body : null, metadata: (r?.meta ?? null) as M | null };
  }
}

let kv: FakeKv;
const env = (o: Partial<FoodEnv> = {}): FoodEnv => ({ allowed: ORIGIN, roleOf: (k) => keyOwner(k, keys), kv, ...o });
const get = (h: Record<string, string> = {}, method = 'GET') => new Request('https://relay/food/kalori', { method, headers: { Origin: ORIGIN, Authorization: `Bearer ${KEY_A}`, ...h } });

beforeEach(() => {
  kv = new FakeKv();
  kv.put(KALORI_KEY, BODY, { v: 'v1' });
  kv.put(KALORI_V, 'v1');
});

describe('GET /food/kalori', () => {
  it('a member gets the file, its ETag, private no-cache and CORS', async () => {
    for (const key of [KEY_A, KEY_B]) {
      const r = await foodRoute(get({ Authorization: `Bearer ${key}` }), env());
      expect(r.status).toBe(200);
      expect(await r.text()).toBe(BODY);
      expect(Object.fromEntries(['ETag', 'Cache-Control', 'Content-Type', 'Access-Control-Allow-Origin', 'Access-Control-Expose-Headers', 'Vary'].map((h) => [h, r.headers.get(h)]))).toEqual({
        ETag: '"v1"', 'Cache-Control': 'private, no-cache', 'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': ORIGIN, 'Access-Control-Expose-Headers': 'ETag', Vary: 'Origin'
      });
    }
  });

  it('If-None-Match on the version: 304 from the version key, the value never read', async () => {
    for (const inm of ['"v1"', 'W/"v1"', '"v0", "v1"', '*']) {
      kv.reads = [];
      const r = await foodRoute(get({ 'If-None-Match': inm }), env());
      expect([r.status, r.headers.get('ETag'), r.headers.get('Cache-Control'), await r.text()]).toEqual([304, '"v1"', 'private, no-cache', '']);
      expect(kv.reads).toEqual([KALORI_V]);
    }
    const stale = await foodRoute(get({ 'If-None-Match': '"v0"' }), env());
    expect([stale.status, stale.headers.get('ETag')]).toEqual([200, '"v1"']);
  });

  it("the ETag is the file's own version mid-upload", async () => {
    kv.put(KALORI_V, 'v2');
    expect((await foodRoute(get(), env())).headers.get('ETag')).toBe('"v1"');
  });

  it('no key, a wrong one: 401; the guest: 403', async () => {
    for (const h of [{ Authorization: '' }, { Authorization: `Bearer ${'0'.repeat(64)}` }, { Authorization: KEY_A }]) {
      const r = await foodRoute(get(h), env());
      expect([r.status, await r.json(), r.headers.get('Cache-Control')]).toEqual([401, { ok: false, error: 'unauthorized' }, 'no-store']);
    }
    const g = await foodRoute(get({ Authorization: `Bearer ${KEY_C}` }), env());
    expect([g.status, await g.json(), g.headers.get('Access-Control-Allow-Origin')]).toEqual([403, { ok: false, error: 'forbidden' }, ORIGIN]);
    expect(kv.reads).toEqual([]);
  });

  it('another origin: 403 with no CORS; no Origin (curl): served', async () => {
    const r = await foodRoute(get({ Origin: 'https://evil.example' }), env());
    expect([r.status, r.headers.get('Access-Control-Allow-Origin')]).toEqual([403, null]);
    const bare = new Request('https://relay/food/kalori', { headers: { Authorization: `Bearer ${KEY_B}` } });
    const ok = await foodRoute(bare, env());
    expect([ok.status, ok.headers.get('Access-Control-Allow-Origin')]).toEqual([200, null]);
    expect((await foodRoute(get({ Origin: 'http://localhost:5173' }), env())).status).toBe(200);
  });

  it('a preflight is answered; another method is refused', async () => {
    const pre = await foodRoute(new Request('https://relay/food/kalori', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env());
    expect([pre.status, pre.headers.get('Access-Control-Allow-Origin'), pre.headers.get('Access-Control-Allow-Methods'), pre.headers.get('Access-Control-Allow-Headers')])
      .toEqual([204, ORIGIN, 'GET', 'Authorization, If-None-Match']);
    const post = await foodRoute(get({}, 'POST'), env());
    expect([post.status, post.headers.get('Allow')]).toEqual([405, 'GET']);
  });

  it('nothing uploaded, or no binding: 404', async () => {
    for (const e of [env({ kv: new FakeKv() }), env({ kv: undefined })]) {
      const r = await foodRoute(get(), e);
      expect([r.status, await r.json()]).toEqual([404, { ok: false, error: 'no_data' }]);
    }
    kv.rows.delete(KALORI_KEY);
    expect((await foodRoute(get(), env())).status).toBe(404);
  });
});
