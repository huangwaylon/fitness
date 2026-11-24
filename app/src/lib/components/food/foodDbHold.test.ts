// The catalog's residency (dbHold.svelte.ts holdFoodDb): kept while ごはん is open and FOOD_KEEP_MS after, let go then (or at
// once on its unmount), read again after.
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FoodImageIndex } from '#lib/food/images.ts';

let loads = 0;
/** each load's resolver, when held back (`slow`) */
let slow = false;
const pending: (() => void)[] = [];
vi.mock('#lib/food/index.ts', async (orig) => ({
  ...(await orig<object>()),
  loadFoodDb: () => {
    // (close: a real catalog's, not enumerable so the toEquals below read { n } alone)
    const db = Object.defineProperty({ n: ++loads }, 'close', { value: () => {} });
    return slow ? new Promise((ok) => pending.push(() => ok(db))) : Promise.resolve(db);
  }
}));
/** The pictures' index the next loads give (none: a stand-in), and how many there were. */
let index: FoodImageIndex | null = null;
let indexLoads = 0;
vi.mock('#lib/food/images.ts', async (orig) => ({ ...(await orig<object>()), loadFoodImages: async () => (indexLoads++, index ?? { v: loads }) }));
const { FOOD_KEEP_MS, foodDb, held, holdFoodDb, letGoFoodDb, primeFoodPics, wantImages } = await import('./dbHold.svelte.ts');
const { forgetCells, imgOf } = await import('#lib/food/images.ts');
const foodDbNow = () => held.db;

afterEach(() => vi.useRealTimers());

describe('holdFoodDb', () => {
  it('kept while held and FOOD_KEEP_MS after the last holder; a reopen keeps it; a load in flight at the drop not kept', async () => {
    vi.useFakeTimers();
    const off = holdFoodDb();
    await foodDb();
    expect(foodDbNow()).toEqual({ n: 1 });
    const off2 = holdFoodDb();
    off();
    off2();
    vi.advanceTimersByTime(FOOD_KEEP_MS - 1);
    expect(foodDbNow()).toEqual({ n: 1 });
    const reopen = holdFoodDb(); // reopened in time: the drop cancelled
    vi.advanceTimersByTime(FOOD_KEEP_MS);
    expect(foodDbNow()).toEqual({ n: 1 });
    reopen();
    vi.advanceTimersByTime(FOOD_KEEP_MS);
    expect(foodDbNow()).toBeNull();
    const again = holdFoodDb();
    const p = foodDb();
    again();
    vi.advanceTimersByTime(FOOD_KEEP_MS); // let go before the load comes in
    expect(await p).toEqual({ n: 2 });
    expect(foodDbNow()).toBeNull();
    const last = holdFoodDb();
    expect(await foodDb()).toEqual({ n: 3 });
    expect(foodDbNow()).toEqual({ n: 3 });
    last();
  });

  it('let go mid-load: that load never lands, the next one does (one catalog at a time); the pictures as well', async () => {
    letGoFoodDb(); // (from none held)
    await Promise.resolve();
    slow = true;
    const off = holdFoodDb();
    const first = foodDb();
    wantImages();
    off();
    letGoFoodDb();
    await Promise.resolve();
    const second = foodDb();
    pending.shift()!();
    const a = await first;
    expect(foodDbNow()).toBeNull(); // the dropped one, never held
    pending.shift()!();
    const b = await second;
    expect([foodDbNow(), a === b]).toEqual([b, false]);
    expect(held.images).toBeNull(); // asked for before the drop: not kept
    wantImages();
    await vi.waitFor(() => expect(held.images).not.toBeNull());
    slow = false;
  });

  it('unmounted: let go at once once nobody holds it', async () => {
    const off = holdFoodDb();
    await foodDb();
    letGoFoodDb(); // the same teardown: the hold's cleanup may run after it
    off();
    await Promise.resolve();
    expect(foodDbNow()).toBeNull();
  });
});

const fixture: FoodImageIndex = { v: 1, t: 128, d: 384, sheets: ['t-a.webp', 'd-a.webp'], keys: [[0, 0, 128, 1, 0, 0]], ids: { 'mext:01088': 0 } };

describe('primeFoodPics and wantImages (ごはん’s opening made ready ahead: prime.ts)', () => {
  afterEach(() => {
    index = null;
    forgetCells();
    vi.unstubAllGlobals();
  });

  it('looks the day’s pictures up once, lets the index go (nobody holds it), fetches their sheets; known: no index', async () => {
    index = fixture;
    const fetch = vi.fn(async () => new Response(new Blob(['x'])));
    vi.stubGlobal('fetch', fetch);
    const n = indexLoads;
    await primeFoodPics(['mext:01088', 'mext:99999', 'custom:none']);
    expect(indexLoads - n).toBe(1);
    expect(held.images).toBeNull();
    expect(imgOf(null, 'mext:01088', 40)).toEqual({ url: '/food-img/t-a.webp', x: 0, y: 128, size: 128 });
    expect(fetch.mock.calls.map(([u]) => u)).toEqual(['/food-img/t-a.webp']);
    await primeFoodPics(['mext:01088', 'mext:99999']); // (all known: no index; the bytes kept: no fetch)
    expect([indexLoads - n, fetch.mock.calls.length]).toEqual([1, 1]);
  });

  it('every picture known: the index waits till after the open, and only while ごはん holds it; one unknown: at once', async () => {
    index = fixture;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new Blob(['x']))));
    await primeFoodPics(['mext:01088']);
    vi.useFakeTimers();
    vi.stubGlobal('requestIdleCallback', undefined);
    const n = indexLoads;
    const off = holdFoodDb();
    wantImages(['mext:01088']);
    await vi.advanceTimersByTimeAsync(599);
    expect(indexLoads - n).toBe(0);
    await vi.advanceTimersByTimeAsync(1);
    expect(indexLoads - n).toBe(1);
    await vi.waitFor(() => expect(held.images).toBe(fixture));
    off();
    letGoFoodDb();
    await Promise.resolve();
    expect(held.images).toBeNull();
    wantImages(['mext:01088']); // asked, then let go before the wait ends: never loaded
    letGoFoodDb();
    await Promise.resolve();
    await vi.advanceTimersByTimeAsync(1000);
    expect(indexLoads - n).toBe(1);
    const off2 = holdFoodDb();
    wantImages(['mext:01088', 'mext:02000']); // (one never seen)
    expect(indexLoads - n).toBe(2);
    off2();
  });
});
