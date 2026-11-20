// The datasets parsed in the worker (dataset.worker.ts, run here in-process behind a stand-in Worker) make the same
// catalog as parsed on the page: every item, its search keys (the products' built in the worker), its lookups; and so
// with the core's keys kept (keysCache.ts, fake-indexeddb): written on the first load, read back on the next.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { IDBFactory } from 'fake-indexeddb';
import { searchFoods, type FoodDb } from './db.ts';

const DIR = join(import.meta.dirname, '../../../static/food');
const fetchFile = async (href: string) => {
  const file = href.match(/\/food\/([\w-]+\.json)/)?.[1];
  return file ? new Response(readFileSync(join(DIR, file))) : new Response(null, { status: 404 });
};

/** Loads the catalog with fresh modules, `worker`: through the stand-in worker; `idb`: its keys kept there (a build's
 *  worker, not the dev server's). */
async function load(worker: boolean, idb?: IDBFactory): Promise<{ db: FoodDb; posts: number; workers: number; ended: number; keyless: number }> {
  vi.resetModules();
  let posts = 0, workers = 0, ended = 0, keyless = 0;
  if (worker) {
    let page: { onmessage: ((e: { data: unknown }) => void) | null } | null = null;
    const scope = { location: { pathname: '/_app/immutable/workers/dataset.worker-test.js' }, onmessage: null as ((e: { data: unknown }) => void) | null, postMessage: (m: unknown) => (posts++, (keyless += ((m as { items?: { keys?: unknown }[] }).items ?? []).filter((it) => typeof it.keys !== 'string').length), setTimeout(() => page?.onmessage?.({ data: structuredClone(m) }))) };
    vi.stubGlobal('self', scope);
    vi.stubGlobal('location', { href: 'http://127.0.0.1/' });
    vi.stubGlobal('Worker', class {
      onmessage = null;
      constructor() {
        page = this;
        workers++;
      }
      postMessage(m: unknown) {
        scope.onmessage?.({ data: m });
      }
      terminate() {
        ended++;
      }
    });
    if (idb) {
      vi.stubGlobal('indexedDB', idb);
      vi.stubEnv('DEV', false);
    }
    await import('./dataset.worker.ts');
  }
  const { loadFoodDb } = await import('./load.ts');
  const db = await loadFoodDb();
  await db.wantMore();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.stubGlobal('fetch', fetchFile);
  return { db, posts, workers, ended, keyless };
}

let here: FoodDb, there: FoodDb, posts = 0, workers = 0, ended = 0, keyless = -1;
const idb = new IDBFactory();
beforeAll(async () => {
  vi.stubGlobal('fetch', fetchFile);
  here = (await load(false)).db;
  ({ db: there, posts, workers, ended, keyless } = await load(true));
}, 60_000); // the catalog parsed twice: CPU-bound and deterministic, so a loaded Mac only slows it
afterAll(() => vi.unstubAllGlobals());

describe('the worker’s parse', () => {
  it('hands the items over in slices and makes the same catalog', () => {
    expect(posts).toBeGreaterThan(there.sets.length); // a file's items in more than one message
    expect(keyless).toBe(0); // every item with its keys, the lazy ones' too (none left for the page to build)
    expect(there.entries.length).toBe(here.entries.length);
    expect(there.entries.map((e) => e.h).sort()).toEqual(here.entries.map((e) => e.h).sort()); // (the files in the order they come)
    expect(there.byId.size).toBe(here.byId.size);
    expect(there.verify).toEqual(here.verify);
    for (const q of ['ごはん', '鶏むね', 'カップヌードル', '4901990']) expect(searchFoods(there, q, 1)[0]?.id).toBe(searchFoods(here, q, 1)[0]?.id);
  });
  it('lets the worker go once nothing is left to parse (the core datasets, then the products: one each)', () => {
    expect([workers, ended]).toEqual([2, 2]);
  });
  it('with the core’s keys kept: the same catalog when they are written and when read back (and read back they are)', async () => {
    const w = await load(true, idb);
    const wrote = w.db;
    expect(w.keyless).toBe(0);
    // (kept: the 10 core files, never a lazy one)
    const store = () => new Promise<IDBObjectStore>((ok) => (idb.open('island-food-keys').onsuccess = (e) => ok((e.target as IDBOpenDBRequest).result.transaction('keys', 'readwrite').objectStore('keys'))));
    const paths = await new Promise<string[]>((ok) => store().then((s) => (s.getAllKeys().onsuccess = (e) => ok(((e.target as IDBRequest).result as IDBValidKey[]).map(String)))));
    expect(paths.length).toBe(here.sets.length - 2);
    expect(paths.some((k) => /products|kalori/.test(k))).toBe(false);
    const r = await load(true, idb);
    const read = r.db;
    expect(r.keyless).toBe(0);
    for (const db of [wrote, read]) {
      expect(db.entries.map((e) => e.h).sort()).toEqual(here.entries.map((e) => e.h).sort());
      for (const q of ['ごはん', '鶏むね', 'カップヌードル', '4901990']) expect(searchFoods(db, q, 1)[0]?.id).toBe(searchFoods(here, q, 1)[0]?.id);
    }
    // foods.json's first item under a key of the test's own: found by it, so read back, not built
    const foods = paths.find((k) => k.endsWith('/food/foods.json'))!;
    const rec = await new Promise<{ keys: string }>((ok) => store().then((s) => (s.get(foods).onsuccess = (e) => ok((e.target as IDBRequest).result))));
    await new Promise((ok) => store().then((s) => (s.put({ ...rec, keys: rec.keys.replace(/^[^\n]*/, 'ぴよぴよ') }, foods).onsuccess = ok)));
    const first = (await load(true, idb)).db;
    const id = here.entries.find((e) => e.it.id.startsWith('mext:'))!.it.id;
    expect(searchFoods(first, 'ぴよぴよ', 1)[0]?.id).toBe(id);
    expect(searchFoods(here, 'ぴよぴよ', 1)[0]?.id).not.toBe(id);
  }, 60_000); // the catalog parsed three times (~1.5 s idle, 6.3 s at load 55): CPU-bound and deterministic, so a loaded Mac only slows it
});
