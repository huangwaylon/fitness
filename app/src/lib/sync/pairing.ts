// Pairing: the per-person key (from the `#key=…` link or typed in) and who it belongs to.
import type { PersonId } from '#lib/types.ts';
import { LIVE, getStoredMe, localKV, storeMe, writeRaw } from './storage.ts';
import { clearCache } from './cache.ts';
import { clearQueue } from './queue.ts';

/** Store the key for `me`. A different person than before drops that person's cache and unsent queue. */
export function setKey(key: string, me: PersonId): void {
  if (getStoredMe() !== me) {
    void clearCache();
    clearQueue();
  }
  writeRaw(localKV(), LIVE.key, key);
  storeMe(me);
}

/** The key from `#key=…` (first open from a shared link), or null. */
export function keyFromHash(hash: string): string | null {
  const m = /(?:^#|&)key=([0-9a-fA-F]{32,128})(?:&|$)/.exec(hash);
  return m ? m[1].toLowerCase() : null;
}
