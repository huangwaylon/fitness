// The catalog's residency (dbHold.ts holdFoodDb): kept while ごはん is open and FOOD_KEEP_MS after, let go then (or at
// once on its unmount), read again after.
import { afterEach, describe, expect, it, vi } from 'vitest';

let loads = 0;
vi.mock('#lib/food/index.ts', async (orig) => ({ ...(await orig<object>()), loadFoodDb: async () => ({ n: ++loads }) }));
const { FOOD_KEEP_MS, foodDb, foodDbNow, holdFoodDb, letGoFoodDb, onFoodDbDrop } = await import('./dbHold.ts');

afterEach(() => vi.useRealTimers());

describe('holdFoodDb', () => {
  it('kept while held and FOOD_KEEP_MS after the last holder; a reopen keeps it; a load in flight at the drop not kept', async () => {
    vi.useFakeTimers();
    let dropped = 0;
    const unwatch = onFoodDbDrop(() => dropped++);
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
    expect(dropped).toBe(1);
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
    unwatch();
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
