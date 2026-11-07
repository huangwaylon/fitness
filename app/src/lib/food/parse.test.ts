// The datasets parsed in the worker (dataset.worker.ts, run here in-process behind a stand-in Worker) make the same
// catalog as parsed on the page: every item, its search keys (the products' built in the worker), its lookups.
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { searchFoods, type FoodDb } from './db.ts';

const DIR = join(import.meta.dirname, '../../../static/food');
const fetchFile = async (href: string) => {
  const file = href.match(/\/food\/([\w-]+\.json)/)?.[1];
  return file ? new Response(readFileSync(join(DIR, file))) : new Response(null, { status: 404 });
};

/** Loads the catalog with fresh modules, `worker`: through the stand-in worker. */
async function load(worker: boolean): Promise<{ db: FoodDb; posts: number }> {
  vi.resetModules();
  let posts = 0;
  if (worker) {
    let page: { onmessage: ((e: { data: unknown }) => void) | null } | null = null;
    const scope = { onmessage: null as ((e: { data: unknown }) => void) | null, postMessage: (m: unknown) => (posts++, setTimeout(() => page?.onmessage?.({ data: structuredClone(m) }))) };
    vi.stubGlobal('self', scope);
    vi.stubGlobal('location', { href: 'http://127.0.0.1/' });
    vi.stubGlobal('Worker', class {
      onmessage = null;
      constructor() {
        page = this;
      }
      postMessage(m: unknown) {
        scope.onmessage?.({ data: m });
      }
      terminate() {}
    });
    await import('./dataset.worker.ts');
  }
  const { loadFoodDb } = await import('./load.ts');
  const db = await loadFoodDb();
  await db.more;
  vi.unstubAllGlobals();
  vi.stubGlobal('fetch', fetchFile);
  return { db, posts };
}

let here: FoodDb, there: FoodDb, posts = 0;
beforeAll(async () => {
  vi.stubGlobal('fetch', fetchFile);
  here = (await load(false)).db;
  ({ db: there, posts } = await load(true));
});
afterAll(() => vi.unstubAllGlobals());

describe('the worker’s parse', () => {
  it('hands the items over in slices and makes the same catalog', () => {
    expect(posts).toBeGreaterThan(there.sets.length); // a file's items in more than one message
    expect(there.entries.length).toBe(here.entries.length);
    expect(there.entries.map((e) => e.h).sort()).toEqual(here.entries.map((e) => e.h).sort()); // (the files in the order they come)
    expect(there.byId.size).toBe(here.byId.size);
    expect(there.verify).toEqual(here.verify);
    for (const q of ['ごはん', '鶏むね', 'カップヌードル', '4901990']) expect(searchFoods(there, q, 1)[0]?.id).toBe(searchFoods(here, q, 1)[0]?.id);
  });
});
