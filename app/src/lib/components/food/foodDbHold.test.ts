// The catalog's residency (dbHold.svelte.ts holdFoodDb): kept while ごはん is open and FOOD_KEEP_MS after, let go then (or at
// once on its unmount), read again after.
import { afterEach, describe, expect, it, vi } from 'vitest';

let loads = 0;
/** each load's resolver, when held back (`slow`) */
let slow = false;
const pending: (() => void)[] = [];
vi.mock('#lib/food/index.ts', async (orig) => ({
  ...(await orig<object>()),
  loadFoodDb: () => {
    const db = { n: ++loads };
    return slow ? new Promise((ok) => pending.push(() => ok(db))) : Promise.resolve(db);
  }
}));
vi.mock('#lib/food/images.ts', async (orig) => ({ ...(await orig<object>()), loadFoodImages: async () => ({ v: loads }) }));
const { FOOD_KEEP_MS, foodDb, held, holdFoodDb, letGoFoodDb, wantImages } = await import('./dbHold.svelte.ts');
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
