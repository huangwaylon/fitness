// The catalog's residency (foodUi.ts holdFoodDb): kept while ごはん is mounted, let go with it, read again after.
import { describe, expect, it, vi } from 'vitest';

let loads = 0;
vi.mock('#lib/food/index.ts', async (orig) => ({ ...(await orig<object>()), loadFoodDb: async () => ({ n: ++loads }) }));
const { foodDb, foodDbNow, holdFoodDb } = await import('./foodUi.ts');

describe('holdFoodDb', () => {
  it('kept while held; let go with the last holder; a load in flight at the release not kept', async () => {
    const off = holdFoodDb();
    await foodDb();
    expect(foodDbNow()).toEqual({ n: 1 });
    const off2 = holdFoodDb();
    off();
    expect(foodDbNow()).toEqual({ n: 1 });
    off2();
    expect(foodDbNow()).toBeNull();
    const again = holdFoodDb();
    const p = foodDb();
    again(); // let go before the load comes in
    expect(await p).toEqual({ n: 2 });
    expect(foodDbNow()).toBeNull();
    holdFoodDb();
    expect(await foodDb()).toEqual({ n: 3 });
    expect(foodDbNow()).toEqual({ n: 3 });
  });
});
