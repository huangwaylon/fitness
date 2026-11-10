// The server-to-server signature (docs/backend.md#push): a Notice POSTed to /notify and `/admin` are
// signed with a server-to-server secret that both servers derive from the two person keys (each server holds both; a phone
// holds only its own, so no phone can sign). Nothing to provision or store: rotating a key rotates the secret too.
// The signature covers the time and the body, so a logged request can't be replayed beyond the window or with another
// body; the secret itself never travels.
import type { Keys } from './auth.ts';
import { hmacHex, sameKey } from '../../app/src/lib/contract/ticket.ts';

/** What the derivation signs (bump the suffix to rotate the secret without touching the keys). */
export const NOTIFY_LABEL = 'island-relay-notify/1';
/** A signature older or newer than this (ms) is refused. */
export const NOTIFY_WINDOW_MS = 5 * 60_000;
export const TIME_HEADER = 'X-Island-Time';
export const SIG_HEADER = 'X-Island-Sig';

/** The notify secret: HMAC-SHA256(key = "<keyA>:<keyB>" trimmed and lower-cased, NOTIFY_LABEL), hex. Null without both keys. */
export async function notifySecret(keys: Keys): Promise<string | null> {
  const a = keys.KEY_A?.trim().toLowerCase();
  const b = keys.KEY_B?.trim().toLowerCase();
  if (!a || !b) return null;
  return hmacHex(`${a}:${b}`, NOTIFY_LABEL);
}

/** A request's signature: HMAC-SHA256(key = secret, "<t>.<body>"), hex. */
export const notifySig = (secret: string, t: string, body: string): Promise<string> => hmacHex(secret, `${t}.${body}`);

/** A call, and once more if it fails (a reset between two objects: the room's `changed`); the second's error if both do. */
export async function twice<T>(f: () => Promise<T>): Promise<T> {
  try {
    return await f();
  } catch {
    return f();
  }
}

/** Whether a signature's headers have its shape and its time is within the window around `now` (checked before a
 *  body is read: storeRoute.ts adminRoute). */
export const sigShaped = (t: string | null, sig: string | null, now: number): t is string =>
  !!t && !!sig && /^\d{13}$/.test(t) && /^[0-9a-f]{64}$/.test(sig) && Math.abs(now - Number(t)) <= NOTIFY_WINDOW_MS;

/** Whether `sig` signs `body` at `t` (ms since the epoch, as text) within the window around `now`. */
export async function verifyNotify(keys: Keys, t: string | null, sig: string | null, body: string, now: number): Promise<boolean> {
  if (!sigShaped(t, sig, now)) return false;
  const secret = await notifySecret(keys);
  if (!secret) return false;
  return sameKey(sig!, await notifySig(secret, t, body));
}
