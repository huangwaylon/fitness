// The server-to-server signature (docs/backend.md "Admin"): `/admin` requests are signed with a secret that the relay
// and the admin tools derive from the two person keys (each holds both; a phone holds only its own, so no phone can
// sign). Nothing to provision or store: rotating a key rotates the secret too.
// The signature covers the time and the body, so a logged request can't be replayed beyond the window or with another
// body; the secret itself never travels.
import type { Keys } from './auth.ts';
import { hmacHex, sameKey } from '../../app/src/lib/contract/ticket.ts';

/** What the derivation signs (bump the suffix to rotate the secret without touching the keys; `notify` is what it
 *  first signed: a new string would be a new secret). */
export const SIGN_LABEL = 'island-relay-notify/1';
/** A signature older or newer than this (ms) is refused. */
export const SIGN_WINDOW_MS = 5 * 60_000;
export const TIME_HEADER = 'X-Island-Time';
export const SIG_HEADER = 'X-Island-Sig';

/** The admin secret: HMAC-SHA256(key = "<keyA>:<keyB>" trimmed and lower-cased, SIGN_LABEL), hex. Null without both keys. */
export async function adminSecret(keys: Keys): Promise<string | null> {
  const a = keys.KEY_A?.trim().toLowerCase();
  const b = keys.KEY_B?.trim().toLowerCase();
  if (!a || !b) return null;
  return hmacHex(`${a}:${b}`, SIGN_LABEL);
}

/** A request's signature: HMAC-SHA256(key = secret, "<t>.<body>"), hex. */
export const adminSig = (secret: string, t: string, body: string): Promise<string> => hmacHex(secret, `${t}.${body}`);

/** Whether a signature's headers have its shape and its time is within the window around `now` (checked before a
 *  body is read: storeRoute.ts adminRoute). */
export const sigShaped = (t: string | null, sig: string | null, now: number): t is string =>
  !!t && !!sig && /^\d{13}$/.test(t) && /^[0-9a-f]{64}$/.test(sig) && Math.abs(now - Number(t)) <= SIGN_WINDOW_MS;

/** Whether `sig` signs `body` at `t` (ms since the epoch, as text) within the window around `now`. */
export async function verifyAdmin(keys: Keys, t: string | null, sig: string | null, body: string, now: number): Promise<boolean> {
  if (!sigShaped(t, sig, now)) return false;
  const secret = await adminSecret(keys);
  if (!secret) return false;
  return sameKey(sig!, await adminSig(secret, t, body));
}
