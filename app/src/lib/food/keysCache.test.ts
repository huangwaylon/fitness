// keysCache.ts: a dataset's built search keys kept in IndexedDB (fake-indexeddb here), read back only when whole and
// of the same version; anything else, or no IndexedDB at all, reads as none (the worker builds them).
import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { configureKeysCache, readKeys, WAIT_MS, writeKeys } from './keysCache.ts';

const KEYS = ['ごはん せいはくまい', 'なっとう', '', 'らーめん 4901234567890'];

afterEach(() => {
  vi.useRealTimers();
  configureKeysCache({ indexedDB: new IDBFactory() });
});

describe('keysCache', () => {
  it('reads back what was written, for its path and version only', async () => {
    configureKeysCache({ indexedDB: new IDBFactory() });
    expect(await readKeys('/food/foods.json', 'v1', KEYS.length)).toBeNull();
    await writeKeys('/food/foods.json', 'v1', KEYS);
    expect(await readKeys('/food/foods.json', 'v1', KEYS.length)).toEqual(KEYS);
    // another version of the file (or of the worker), another file: none
    expect(await readKeys('/food/foods.json', 'v2', KEYS.length)).toBeNull();
    expect(await readKeys('/food/dishes.json', 'v1', KEYS.length)).toBeNull();
    // a new version written over the old: one record a file
    await writeKeys('/food/foods.json', 'v2', KEYS.slice(1));
    expect(await readKeys('/food/foods.json', 'v1', KEYS.length)).toBeNull();
    expect(await readKeys('/food/foods.json', 'v2', 3)).toEqual(KEYS.slice(1));
    // an empty file's
    await writeKeys('/food/none.json', 'v1', []);
    expect(await readKeys('/food/none.json', 'v1', 0)).toEqual([]);
  });

  it('a record not whole (its count off, a key with a newline, another shape) reads as none', async () => {
    const idb = new IDBFactory();
    configureKeysCache({ indexedDB: idb });
    await writeKeys('/food/foods.json', 'v1', KEYS);
    expect(await readKeys('/food/foods.json', 'v1', KEYS.length + 1)).toBeNull();
    await writeKeys('/food/foods.json', 'v1', ['a\nb', 'c']);
    expect(await readKeys('/food/foods.json', 'v1', 2)).toBeNull();
    // a record written by hand, half of it missing
    const db = await new Promise<IDBDatabase>((ok) => (idb.open('island-food-keys', 1).onsuccess = (e) => ok((e.target as IDBOpenDBRequest).result)));
    await new Promise<void>((ok) => {
      const t = db.transaction('keys', 'readwrite');
      t.objectStore('keys').put({ v: 'v1', n: 2 }, '/food/foods.json');
      t.oncomplete = () => ok();
    });
    expect(await readKeys('/food/foods.json', 'v1', 2)).toBeNull();
  });

  it('no IndexedDB, or one that throws: none read, a write that settles', async () => {
    configureKeysCache({ indexedDB: null });
    await writeKeys('/food/foods.json', 'v1', KEYS);
    expect(await readKeys('/food/foods.json', 'v1', KEYS.length)).toBeNull();
    configureKeysCache({ indexedDB: { open: () => { throw new Error('denied'); } } as unknown as IDBFactory });
    await writeKeys('/food/foods.json', 'v1', KEYS);
    expect(await readKeys('/food/foods.json', 'v1', KEYS.length)).toBeNull();
  });

  it('an IndexedDB that never answers: none after WAIT_MS, never a hang', async () => {
    vi.useFakeTimers();
    configureKeysCache({ indexedDB: { open: () => ({}) } as unknown as IDBFactory });
    const read = readKeys('/food/foods.json', 'v1', KEYS.length);
    const write = writeKeys('/food/foods.json', 'v1', KEYS);
    await vi.advanceTimersByTimeAsync(WAIT_MS);
    expect(await read).toBeNull();
    expect(await write).toBeUndefined();
  });
});
