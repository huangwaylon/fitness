// iOS asking for the location again (docs/travel.md "Maps"). WebKit decides the location once per page load and keeps
// it while the page lives (hidden: the fixes pause, the answer stays), so a page never asks twice; but each launch, iOS
// ending the app, or a reload into a new build is a new page, and with Safari's 位置情報 at 確認 an earlier 許可 is
// kept only a while (a day, in a tab; home-screen apps less), so the prompt comes back. Only Safari's 位置情報 at 許可
// keeps it, and then the Permissions API reads 'granted' on a new page before any ask (Safari 26+; at 確認 'prompt').
// So: this phone had a fix once (DEVICE.geoAsked '1'), a map's new watch reads 'prompt' before it first asks, and
// after the fix that tap brings the maps say once where to make it stick (MS.again), then never again ('2'). Nothing
// else is kept: no position, no time.
import { DEVICE, type KV } from '#lib/sync/storage.ts';

type Perms = Pick<Permissions, 'query'> | undefined;

/** A fix came: remembered (unless the hint was already shown). */
export function sawFix(kv: KV | null): void {
  if (kv?.getItem(DEVICE.geoAsked) === null) put(kv, '1');
}

/** The hint not shown yet on this phone (another map may have shown it since this one's read). */
export const hintDue = (kv: KV | null): boolean => kv?.getItem(DEVICE.geoAsked) === '1';

/** Before a page's first ask: whether iOS will ask again (a fix before, the permission 'prompt' now, so not Safari's
 *  許可). False when the Permissions API can't tell. */
export async function askedAgain(kv: KV | null, perms: Perms): Promise<boolean> {
  if (!hintDue(kv) || !perms) return false;
  try {
    return (await perms.query({ name: 'geolocation' })).state === 'prompt';
  } catch {
    return false;
  }
}

/** The hint shown: never again on this phone. */
export function hintShown(kv: KV | null): void {
  if (kv) put(kv, '2');
}

function put(kv: KV, v: string): void {
  try {
    kv.setItem(DEVICE.geoAsked, v);
  } catch {
    // (storage full or refused: asked about again, at worst)
  }
}
