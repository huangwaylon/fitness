// The worker's file stores (service-worker/blobCache.ts: IndexedDB `island-files`, a store a kind, rows by URL): the
// tiles, the photos, ごはん's pictures, 保存した場所's files, the room's and the art's, for the offline specs.
import type { Page } from './fixtures.ts';

export type FileStoreName = 'room' | 'art' | 'tiles' | 'photos' | 'foodImg' | 'place' | 'placePic';

/** A store's URLs (`clear`: emptied first, as a phone that never kept them), [] with no database yet. */
export const storeKeys = (page: Page, store: FileStoreName, clear = false) => page.evaluate(async ([s, c]) => {
  if (!(await indexedDB.databases()).some((d) => d.name === 'island-files')) return [] as string[];
  const d = await new Promise<IDBDatabase>((ok, no) => {
    const r = indexedDB.open('island-files');
    r.onsuccess = () => ok(r.result);
    r.onerror = () => no(r.error);
  });
  try {
    if (!d.objectStoreNames.contains(s as string)) return [] as string[];
    const t = d.transaction(s as string, c ? 'readwrite' : 'readonly'), os = t.objectStore(s as string);
    if (c) os.clear();
    const q = os.getAllKeys();
    return await new Promise<string[]>((ok, no) => ((q.onsuccess = () => ok(q.result as string[])), (q.onerror = () => no(q.error))));
  } finally {
    d.close();
  }
}, [store, clear] as const);
