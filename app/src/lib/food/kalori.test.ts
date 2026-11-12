// The members' chain menus from the relay (kalori.ts, load.ts): fetched with the key, kept for offline and revalidated
// by ETag, dropped and never asked again on the relay's no, retried at the next chance after a network failure.
// Invented items only (no Kalori data).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchKalori, Refused } from './kalori.ts';
import { loadFoodDb } from './load.ts';
import { searchFoods } from './db.ts';

const HREF = 'https://relay.test/food/kalori';
const KEY = 'a1'.repeat(32);
const DATA = {
  source: 'kalori', label: 'kalori.jp', attribution: 'kalori.jp', license: 'terms', url: 'https://kalori.jp',
  shops: { tameshi: { name: 'ためし食堂' } },
  items: [{ id: 'kal:1', name: 'ためし丼 並盛', brand: 'ためし食堂', shop: 'tameshi', cat: '丼・定食', kcal: 1200, p: 30, f: 20, c: 150, sv: true, portions: [{ label: '1食', g: 100 }] }]
};

/** The Cache API as a map (its responses whole). */
function fakeCaches() {
  const kept = new Map<string, Response>();
  const cache = { match: async (h: string) => kept.get(h)?.clone(), put: async (h: string, r: Response) => void kept.set(h, r), delete: async (h: string) => kept.delete(h) };
  vi.stubGlobal('caches', { open: async () => cache });
  return kept;
}
type Reply = Response | 'offline';
/** fetch answering the relay with `replies` in turn (and the static index), recording each request's headers. */
function relay(replies: Reply[]) {
  const asked: Record<string, string>[] = [];
  vi.stubGlobal('fetch', async (href: string, init?: RequestInit) => {
    if (href.endsWith('/index.json')) return Response.json({ version: 'v1', datasets: [] });
    if (!href.startsWith(HREF)) return new Response(null, { status: 404 });
    asked.push({ ...(init?.headers as Record<string, string>) });
    const r = replies.shift() ?? 'offline';
    if (r === 'offline') throw new TypeError('Failed to fetch');
    return r;
  });
  return asked;
}
const ok = () => Response.json(DATA, { headers: { ETag: '"abc"' } });

afterEach(() => vi.unstubAllGlobals());

describe('fetchKalori', () => {
  it('fetches with the key, keeps it with its ETag, asks again with If-None-Match (304: the kept copy), offline the kept copy', async () => {
    const kept = fakeCaches();
    const asked = relay([ok(), new Response(null, { status: 304 }), 'offline']);
    const got = [await fetchKalori(HREF, KEY), await fetchKalori(HREF, KEY), await fetchKalori(HREF, KEY)];
    expect(got.map((d) => d.items[0].id)).toEqual(['kal:1', 'kal:1', 'kal:1']);
    expect(asked).toEqual([
      { Authorization: `Bearer ${KEY}` }, { Authorization: `Bearer ${KEY}`, 'If-None-Match': '"abc"' }, { Authorization: `Bearer ${KEY}`, 'If-None-Match': '"abc"' }
    ]);
    expect(kept.get(HREF)?.headers.get('ETag')).toBe('"abc"');
  });
  it('401, 403, 404: the kept copy dropped, Refused; offline with nothing kept, or a 5xx: an error', async () => {
    const kept = fakeCaches();
    relay([ok(), Response.json({ ok: false }, { status: 403 }), 'offline', new Response(null, { status: 503 }), new Response(null, { status: 401 }), new Response(null, { status: 404 })]);
    await fetchKalori(HREF, KEY);
    await expect(fetchKalori(HREF, KEY)).rejects.toBeInstanceOf(Refused);
    expect(kept.size).toBe(0);
    await expect(fetchKalori(HREF, KEY)).rejects.toThrow('Failed to fetch');
    await expect(fetchKalori(HREF, KEY)).rejects.not.toBeInstanceOf(Refused);
    await expect(fetchKalori(HREF, KEY)).rejects.toBeInstanceOf(Refused);
    await expect(fetchKalori(HREF, KEY)).rejects.toBeInstanceOf(Refused);
  });
  it('a 200 with no items is an error, never kept', async () => {
    const kept = fakeCaches();
    relay([Response.json({ ok: false })]);
    await expect(fetchKalori(HREF, KEY)).rejects.toThrow('not a dataset');
    expect(kept.size).toBe(0);
  });
});

describe('loadFoodDb with the chain menus', () => {
  it('asked for at wantMore only, searchable per serving with their shop; none without a source', async () => {
    fakeCaches();
    const asked = relay([ok()]);
    const db = await loadFoodDb(undefined, () => ({ href: HREF, key: KEY }));
    expect(asked).toEqual([]);
    await db.wantMore();
    const [hit] = searchFoods(db, 'ためし食堂 丼');
    expect([hit?.id, hit?.sv, hit?.brand, db.sets.map((s) => s.source)]).toEqual(['kal:1', true, 'ためし食堂', ['kalori']]);
    const none = await loadFoodDb(undefined, () => null);
    await none.wantMore();
    expect([asked.length, none.entries.length]).toEqual([1, 0]);
  });
  it('the relay’s no: never asked again; a network failure: again at the next chance', async () => {
    fakeCaches();
    const chance = vi.fn(async () => {});
    relay([Response.json({ ok: false }, { status: 403 })]);
    await (await loadFoodDb(chance, () => ({ href: HREF, key: KEY }))).wantMore();
    expect(chance).not.toHaveBeenCalled();
    const asked = relay(['offline', ok()]);
    const db = await loadFoodDb(chance, () => ({ href: HREF, key: KEY }));
    const added = new Promise<void>((done) => db.onAdd(done));
    await db.wantMore();
    await added;
    expect([chance.mock.calls.length, asked.length, db.entries.length]).toEqual([1, 2, 1]);
  });
});
