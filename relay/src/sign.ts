// The server-to-server signature (docs/backend.md "Admin"): `/admin` requests are signed with a secret that the relay
// and the admin tools derive from the two person keys (each holds both; a phone holds only its own, so no phone can
// sign). Nothing to provision or store: rotating a key rotates the secret too.
// The signature covers the time and the body, so a logged request can't be replayed beyond the window or with another
// body; the secret itself never travels.
// A narrower secret beside it: PLACES_KEY (a Worker secret of its own; unset = off) signs only PLACES_OPS, what the
// places pull on GitHub's runners runs (.github/workflows/places-pull.yml), so the member keys never go to GitHub.
import type { Keys } from './auth.ts';
import { hmacHex, sameKey } from '../../app/src/lib/contract/ticket.ts';

/** What the derivation signs (bump the suffix to rotate the secret without touching the keys; `notify` is what it
 *  first signed: a new string would be a new secret). */
export const SIGN_LABEL = 'island-relay-notify/1';
/** A signature older or newer than this (ms) is refused. */
export const SIGN_WINDOW_MS = 5 * 60_000;
export const TIME_HEADER = 'X-Island-Time';
export const SIG_HEADER = 'X-Island-Sig';
/** The tool that sent a signed op (scripts/admin.ts: `record:dump`, `logs:report`, …): a label, unsigned, for the
 *  audit (the log's admin `via`). */
export const VIA_HEADER = 'X-Admin-Via';

/** The admin secret: HMAC-SHA256(key = "<keyA>:<keyB>" trimmed and lower-cased, SIGN_LABEL), hex. Null without both keys. */
export async function adminSecret(keys: Keys): Promise<string | null> {
  const a = keys.KEY_A?.trim().toLowerCase();
  const b = keys.KEY_B?.trim().toLowerCase();
  if (!a || !b) return null;
  return hmacHex(`${a}:${b}`, SIGN_LABEL);
}

/** The ops a PLACES_KEY signature may run (record.ts places-pull, places-ids, places-details); every other op refused (store.ts signedOp). */
export const PLACES_OPS: readonly string[] = ['places_status', 'places_ingest', 'places_ids', 'places_details'];
/** What the places secret signs (its own label: never the admin secret, whatever the key). */
export const PLACES_LABEL = 'island-relay-places/1';

/** The places secret: HMAC-SHA256(key = PLACES_KEY trimmed and lower-cased, PLACES_LABEL), hex. Null when it's unset
 *  or shorter than 32 characters (the path off). */
export async function placesSecret(keys: Keys): Promise<string | null> {
  const k = keys.PLACES_KEY?.trim().toLowerCase();
  return k && k.length >= 32 ? hmacHex(k, PLACES_LABEL) : null;
}

/** A request's signature: HMAC-SHA256(key = secret, "<t>.<body>"), hex. */
export const adminSig = (secret: string, t: string, body: string): Promise<string> => hmacHex(secret, `${t}.${body}`);

/** Whether a signature's headers have its shape and its time is within the window around `now` (checked before a
 *  body is read: storeRoute.ts adminRoute). */
export const sigShaped = (t: string | null, sig: string | null, now: number): t is string =>
  !!t && !!sig && /^\d{13}$/.test(t) && /^[0-9a-f]{64}$/.test(sig) && Math.abs(now - Number(t)) <= SIGN_WINDOW_MS;

/** Whose secret signs `body` at `t` (ms since the epoch, as text) within the window around `now`: `admin` (the
 *  member keys': every op), `places` (PLACES_KEY's: PLACES_OPS only), or null. */
export async function verifyAdmin(keys: Keys, t: string | null, sig: string | null, body: string, now: number): Promise<'admin' | 'places' | null> {
  if (!sigShaped(t, sig, now)) return null;
  const admin = await adminSecret(keys);
  if (admin && sameKey(sig!, await adminSig(admin, t, body))) return 'admin';
  const places = await placesSecret(keys);
  if (places && sameKey(sig!, await adminSig(places, t, body))) return 'places';
  return null;
}
