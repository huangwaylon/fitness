// Notifications are gone (2026-11-02, the user: "no one uses it… clean it up thoroughly"). A phone that once turned
// せってい's つうち on still holds a Web Push subscription for the relay's old VAPID key (iOS keeps it until the app
// lets it go): on the next open it is unsubscribed, and this phone's notification prefs are forgotten. Nothing is
// sent anywhere (the relay keeps no subscriptions any more). Once both phones have opened a build with this, the
// module can go (docs/ops/runbook.md "Notifications removed").
import { localKV, type KV } from './storage.ts';

/** What the old つうち switch kept (sync/push.ts, removed): its state, and the day my all-four goals were reported. */
export const OLD_PUSH_KEYS = ['island.push', 'island.goalSent'] as const;

interface Sub { unsubscribe(): Promise<boolean> }
interface Reg { pushManager?: { getSubscription(): Promise<Sub | null> } }
export interface DropDeps {
  sw?: { getRegistrations(): Promise<readonly Reg[]> };
  kv: KV | null;
}

const browser = (): DropDeps => ({
  sw: typeof navigator !== 'undefined' && 'serviceWorker' in navigator ? (navigator.serviceWorker as unknown as DropDeps['sw']) : undefined,
  kv: localKV()
});

/** Unsubscribe every Web Push subscription this app's service workers hold, and forget the old prefs. Never throws. */
export async function dropPush(d: DropDeps = browser()): Promise<number> {
  for (const k of OLD_PUSH_KEYS) {
    try {
      d.kv?.removeItem(k);
    } catch {
      /* storage blocked: nothing to forget */
    }
  }
  let dropped = 0;
  try {
    for (const reg of (await d.sw?.getRegistrations()) ?? []) {
      const sub = await reg.pushManager?.getSubscription();
      if (sub && (await sub.unsubscribe())) dropped++;
    }
  } catch (e) {
    console.warn('push: could not drop the old subscription', e);
  }
  return dropped;
}
