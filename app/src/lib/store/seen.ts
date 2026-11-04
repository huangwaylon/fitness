// When this phone last had the app on screen (localStorage): on hiding, the relay sees the socket close too
// (sync/live.ts), so how long ago it was is how long this phone has been gone for the walk home (island/
// villagerSync.ts): the island opening long after puts my villager home at once, as every other phone has it.
import { localKV, readJson, writeJson } from '#lib/sync/storage.ts';

const KEY = 'island.seen';

export function markSeen(): void {
  writeJson(localKV(), KEY, Date.now());
}
/** How long ago (ms) this phone last hid the app, or null: never known. */
export function seenAgo(): number | null {
  const t = readJson<unknown>(localKV(), KEY);
  return typeof t === 'number' && Number.isFinite(t) ? Date.now() - t : null;
}
