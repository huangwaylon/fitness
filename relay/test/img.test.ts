// A custom food's picture (src/img.ts, docs/backend.md `food_custom` `img`): the bytes' checks (magic, exactly 384 px
// square, no Exif/XMP/IPTC), `POST /img` (key, CORS, size, type, the day's cap, the id its hash, idempotent, a person's
// cap), `GET /img/<id>` (no key, long private cache), and the record's side: an op naming it (the guest's own, another's
// forbidden), the sweep, the dump and its load, the admin's img-set (as the owner, by foodAccept; a dry run first).
import { beforeEach, describe, expect, it } from 'vitest';
import { IMG_GC_MS, IMG_LIVE_MAX, IMG_MAX, imgCheck, imgGetRoute, imgPostRoute, imgRows, b64, type ImgEnv } from '../src/img.ts';
import { StoreCore } from '../src/store.ts';
import { keyOwner } from '../src/auth.ts';
import { LogCore, type RelayEvent } from '../src/log.ts';
import { foodCustomFold, foodCustomOp, type CustomOp } from '../../app/src/lib/contract/food.ts';
import type { Notice } from '../../app/src/lib/contract/live-protocol.ts';
import { memSql } from './sqlite.ts';
import { idOf, jpeg, webp } from './imgfix.ts';

const KEY_A = 'a'.repeat(64), KEY_B = 'b'.repeat(64), KEY_C = 'c'.repeat(64);
const keys = { KEY_A, KEY_B, KEY_C };
const ORIGIN = 'https://island-fund.pages.dev';
const T0 = Date.parse('2026-11-20T03:00:00.000Z');

describe('the bytes (imgCheck)', () => {
  it('takes a 384 px square JPEG (baseline or progressive) or WebP (lossy, lossless, VP8X without metadata)', () => {
    expect(imgCheck(jpeg())).toEqual({ type: 'image/jpeg' });
    expect(imgCheck(jpeg({ sof: 0xc2 }))).toEqual({ type: 'image/jpeg' });
    expect(imgCheck(webp())).toEqual({ type: 'image/webp' });
    expect(imgCheck(webp({ kind: 'VP8L' }))).toEqual({ type: 'image/webp' });
    expect(imgCheck(webp({ vp8x: 0x10 }))).toEqual({ type: 'image/webp' }); // (alpha)
  });
  it('refuses another size, Exif / XMP / IPTC, an animation, another format, and more than 64 KB', () => {
    expect(imgCheck(jpeg({ w: 512, h: 512 }))).toEqual({ err: 'bad_dims' });
    expect(imgCheck(jpeg({ w: 384, h: 383 }))).toEqual({ err: 'bad_dims' });
    expect(imgCheck(webp({ w: 400 }))).toEqual({ err: 'bad_dims' });
    expect(imgCheck(webp({ kind: 'VP8L', h: 200 }))).toEqual({ err: 'bad_dims' });
    expect(imgCheck(jpeg({ app1: true }))).toEqual({ err: 'exif' });
    expect(imgCheck(jpeg({ app13: true }))).toEqual({ err: 'exif' });
    expect(imgCheck(webp({ vp8x: 0x08 }))).toEqual({ err: 'exif' });
    expect(imgCheck(webp({ vp8x: 0x04 }))).toEqual({ err: 'exif' });
    expect(imgCheck(webp({ chunk: 'EXIF' }))).toEqual({ err: 'exif' });
    expect(imgCheck(webp({ chunk: 'XMP ' }))).toEqual({ err: 'exif' });
    expect(imgCheck(webp({ vp8x: 0x02 }))).toEqual({ err: 'bad_type' });
    expect(imgCheck(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]))).toEqual({ err: 'bad_type' });
    expect(imgCheck(jpeg().subarray(0, 30))).toEqual({ err: 'bad_type' });
    expect(imgCheck(jpeg({ pad: IMG_MAX }))).toEqual({ err: 'too_large' });
  });
});

describe('POST /img and GET /img/<id>', () => {
  let now: number, logged: RelayEvent[], db: ReturnType<typeof memSql>, store: StoreCore, log: LogCore;
  beforeEach(() => {
    now = T0;
    logged = [];
    db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys, now: () => now, notify: () => {} });
    const ldb = memSql();
    log = new LogCore({ sql: ldb.sql, tx: ldb.tx, keys, now: () => now });
  });
  const env = (o: Partial<ImgEnv> = {}): ImgEnv => ({
    allowed: ORIGIN, roleOf: (k) => keyOwner(k, keys), spend: async (r) => log.spend(`img:${r}`, 5),
    put: (r, id, b) => store.imgPut(r, id, b), log: (evs) => logged.push(...evs), now: () => now, ...o
  });
  const post = async (b: Uint8Array, o: { id?: string; key?: string; type?: string } = {}) => imgPostRoute(new Request(`https://relay/img?id=${o.id ?? (await idOf(b))}`, {
    method: 'POST', body: b as Uint8Array<ArrayBuffer>, headers: { Origin: ORIGIN, 'Content-Type': o.type ?? (b[0] === 0xff ? 'image/jpeg' : 'image/webp'), Authorization: `Bearer ${o.key ?? KEY_A}` }
  }), env());
  const get = (id: string) => imgGetRoute(new Request(`https://relay/img/${id}`, { headers: { Origin: ORIGIN } }), id, { allowed: ORIGIN, get: async (i) => store.imgGet(i) });

  it('keeps a picture once (a member\'s or the guest\'s), serves it with no key, a year\'s private cache', async () => {
    const b = jpeg(), id = await idOf(b);
    const r = await post(b);
    expect([r.status, await r.json(), r.headers.get('Access-Control-Allow-Origin')]).toEqual([200, { ok: true }, ORIGIN]);
    expect(await (await post(b)).json()).toEqual({ ok: true, dup: true });
    expect(await (await post(webp(), { key: KEY_C })).json()).toEqual({ ok: true });
    const g = await get(id);
    expect(g.status).toBe(200);
    expect(new Uint8Array(await g.arrayBuffer())).toEqual(b);
    expect(Object.fromEntries(['Content-Type', 'Cache-Control', 'Access-Control-Allow-Origin', 'X-Content-Type-Options'].map((h) => [h, g.headers.get(h)]))).toEqual({
      'Content-Type': 'image/jpeg', 'Cache-Control': 'private, max-age=31536000, immutable', 'Access-Control-Allow-Origin': ORIGIN, 'X-Content-Type-Options': 'nosniff'
    });
    expect((await get('0'.repeat(32))).status).toBe(404);
    expect((await get('../etc')).status).toBe(404);
    expect(store.counts().img).toBe(2);
    // the log: sizes, times, outcomes; never the id
    expect(logged.map((e) => [e.role, e.d])).toEqual([['A', { ms: 0, inB: b.length, ok: true }], ['A', { ms: 0, inB: b.length, ok: true, dup: true }], ['G', { ms: 0, inB: expect.any(Number), ok: true }]]);
    expect(JSON.stringify(logged)).not.toContain(id);
  });

  it('refuses a stranger, another origin, a malformed id, a wrong type, too many bytes, a hash that isn\'t its id', async () => {
    const b = jpeg();
    expect((await post(b, { key: 'd'.repeat(64) })).status).toBe(401);
    const other = await imgPostRoute(new Request(`https://relay/img?id=${await idOf(b)}`, { method: 'POST', body: b as Uint8Array<ArrayBuffer>, headers: { Origin: 'https://evil.example', Authorization: `Bearer ${KEY_A}` } }), env());
    expect(other.status).toBe(403);
    const pre = await imgPostRoute(new Request('https://relay/img', { method: 'OPTIONS', headers: { Origin: ORIGIN } }), env());
    expect([pre.status, pre.headers.get('Access-Control-Allow-Headers')]).toEqual([204, 'Authorization, Content-Type']);
    const cases: [Promise<Response>, number, string][] = [
      [post(b, { id: 'xyz' }), 400, 'bad_id'],
      [post(b, { type: 'image/png' }), 415, 'bad_type'],
      [post(b, { type: 'image/webp' }), 415, 'bad_type'],
      [post(jpeg({ pad: IMG_MAX })), 413, 'too_large'],
      [post(b, { id: '0'.repeat(32) }), 400, 'bad_id'],
      [post(jpeg({ app1: true })), 400, 'exif'],
      [post(jpeg({ w: 1024, h: 768 })), 400, 'bad_dims']
    ];
    for (const [r, st, error] of cases) {
      const res = await r;
      expect([res.status, await res.json()]).toEqual([st, { ok: false, error }]);
    }
    expect(store.counts().img).toBe(0);
  });

  it('a role\'s uploads a day are capped (the log object\'s caps), and a person keeps IMG_LIVE_MAX', async () => {
    for (let i = 0; i < 5; i++) expect((await post(jpeg({ seed: i }))).status).toBe(200);
    const r = await post(jpeg({ seed: 9 }));
    expect([r.status, await r.json()]).toEqual([429, { ok: false, error: 'cap' }]);
    expect((await post(jpeg({ seed: 9 }), { key: KEY_B })).status).toBe(200);
    for (let i = 0; i < IMG_LIVE_MAX - 5; i++) expect(await store.imgPut('A', await idOf(jpeg({ seed: 100 + i })), jpeg({ seed: 100 + i }))).toEqual({ ok: true });
    expect(await store.imgPut('A', await idOf(jpeg({ seed: 999 })), jpeg({ seed: 999 }))).toEqual({ ok: false, error: 'cap' });
  });
});

describe('the record\'s pictures', () => {
  let now: number, notices: Notice[], db: ReturnType<typeof memSql>, store: StoreCore;
  beforeEach(() => {
    now = T0;
    notices = [];
    db = memSql();
    store = new StoreCore({ sql: db.sql, tx: db.tx, keys, now: () => now, notify: (n) => notices.push(n) });
  });
  const keyOf = { A: KEY_A, B: KEY_B, G: KEY_C } as const;
  let n = 0;
  const custom = (who: 'A' | 'B' | 'G', id: string, extra: object = {}) =>
    store.handle({ key: keyOf[who], action: 'event', id: `e${++n}`, type: 'food_custom', data: { id, at: (now += 1000), n: 'しおこんぶ', u: '1つまみ', g: 2, k: 4, p: 0.4, fa: 0, c: 0.8, s: 0.4, ...extra } }, 100) as Record<string, any>;
  const customs = () => foodCustomFold(((store.handle({ key: KEY_A, action: 'snapshot' }, 50) as any).rows.events as string[][])
    .filter((r) => r[3] === 'food_custom').map((r) => ({ ...foodCustomOp(JSON.parse(r[4]))!, who: r[1] }) as CustomOp & { who: 'A' | 'B' | 'G' }));

  it('an op names a picture (the guest\'s own too); another person\'s edit is forbidden; one not uploaded yet is taken', async () => {
    const b = jpeg(), img = await idOf(b);
    expect(custom('G', 'mpic0001', { img })).toMatchObject({ ok: true });
    expect(customs()[0]).toMatchObject({ who: 'G', img });
    expect(custom('A', 'mpic0001', { img })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(custom('G', 'mpic0001')).toMatchObject({ ok: true });
    expect(customs()[0]).not.toHaveProperty('img');
    expect(custom('A', 'mpic0002', { img: 'nothex' })).toMatchObject({ ok: false, error: 'bad_request' });
  });

  it('the sweep drops a picture nothing names once it is an hour old, keeps a named one, counts names with no row', async () => {
    const named = jpeg({ seed: 1 }), loose = jpeg({ seed: 2 }), young = jpeg({ seed: 3 });
    await store.imgPut('A', await idOf(named), named);
    await store.imgPut('A', await idOf(loose), loose);
    custom('A', 'mpic0003', { img: await idOf(named) });
    custom('A', 'mpic0004', { img: '0'.repeat(32) });
    now += IMG_GC_MS + 1;
    await store.imgPut('B', await idOf(young), young);
    expect(store.imgGc()).toEqual({ imgDel: 1, imgLive: 2, imgDangling: 1 });
    expect(store.imgGet(await idOf(loose))).toBeNull();
    expect(store.imgGet(await idOf(named))?.bytes).toEqual(named);
    // a removed food lets its picture go
    store.handle({ key: KEY_A, action: 'event', id: `e${++n}`, type: 'food_custom', data: { id: 'mpic0003', at: (now += 1000), rm: true } }, 50);
    now += IMG_GC_MS + 1;
    expect(store.imgGc()).toMatchObject({ imgDel: 2, imgLive: 0 });
  });

  it('the dump carries them (base64), a load takes them back checked; the archive\'s text has them', async () => {
    const a = jpeg({ seed: 4 }), w = webp();
    await store.imgPut('A', await idOf(a), a);
    await store.imgPut('G', await idOf(w), w);
    const page = store.imgDump({});
    expect(page).toMatchObject({ ok: true, img: expect.any(Array) });
    expect((page.img as unknown[]).length).toBe(2);
    const text = JSON.parse([...store.dumpText()].join('')) as { rows: { img: unknown[][] } };
    expect(text.rows.img).toEqual(page.img);
    const db2 = memSql();
    const fresh = new StoreCore({ sql: db2.sql, tx: db2.tx, keys, now: () => now, notify: () => {} });
    const bad = [...(page.img as unknown[][])[0]];
    bad[4] = b64(jpeg({ seed: 77 })); // (bytes that aren't its id's)
    expect(await fresh.imgLoad({ img: [bad, ...(page.img as unknown[][]), 'x'] })).toMatchObject({ ok: true, added: 2, had: 0, skipped: 2 });
    expect(await fresh.imgLoad({ img: page.img })).toMatchObject({ added: 0, had: 2 });
    expect(imgRows(db2.sql)).toEqual(page.img);
    expect(fresh.imgGet(await idOf(w))?.type).toBe('image/webp');
  });

  it('img-set: a picture on a custom food as its owner would (its values kept, `ig`), a dry run writes nothing', async () => {
    custom('B', 'mpic0005', { jan: '4901234567894' });
    const b = jpeg({ seed: 5 }), img = await idOf(b), data = b64(b);
    const dry = await store.imgSet({ who: 'B', custom: 'mpic0005', data, ig: true, dry: true });
    expect(dry).toMatchObject({ ok: true, dry: true, bytes: b.length, type: 'image/jpeg' });
    expect(JSON.stringify(dry)).not.toContain(img);
    expect(store.counts().img).toBe(0);
    expect(await store.imgSet({ who: 'A', custom: 'mpic0005', data })).toMatchObject({ ok: false, error: 'forbidden' });
    expect(await store.imgSet({ who: 'B', custom: 'mnone001', data })).toMatchObject({ ok: false, error: 'bad_request' });
    expect(await store.imgSet({ who: 'B', custom: 'mpic0005', data: b64(jpeg({ app1: true })) })).toMatchObject({ ok: false, detail: 'exif' });
    notices = [];
    expect(await store.imgSet({ who: 'B', custom: 'mpic0005', data, ig: true })).toMatchObject({ ok: true, bytes: b.length });
    const c = customs().find((x) => x.id === 'mpic0005')!;
    expect(c).toMatchObject({ who: 'B', n: 'しおこんぶ', g: 2, jan: '4901234567894', img, ig: true });
    expect(store.imgGet(img)?.bytes).toEqual(b);
    expect(notices).toEqual([expect.objectContaining({ what: 'event', who: 'B', calm: true })]);
    // the owner's next edit is the owner's as ever (an older app's, leaving it out, drops it)
    expect(custom('B', 'mpic0005')).toMatchObject({ ok: true });
    expect(customs().find((x) => x.id === 'mpic0005')).not.toHaveProperty('img');
  });
});
