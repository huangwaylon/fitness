// Who may connect: the person keys (Worker secrets KEY_A / KEY_B, the members', the same keys the phones use for Apps
// Script, and KEY_C, the guest's: docs/backend.md#the-guest) and the page origins a browser may open the socket from. The origin check only keeps other sites' pages out; the key is
// the authentication.
import type { Who } from '../../app/src/lib/sync/live-protocol.ts';

export interface Keys {
  KEY_A?: string;
  KEY_B?: string;
  /** The guest's key (role `guest`: who `G`). Unset: no guest. Never part of the notify secret (notify.ts). */
  KEY_C?: string;
}

/** Equal strings, in time independent of where they differ (the length is not secret: keys are 32–128 hex). */
export function sameKey(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** Whose key this is (`G`: the guest's), or null. An unset or empty secret matches nothing, so a relay without secrets lets nobody in. */
export function keyOwner(key: string, keys: Keys): Who | null {
  const k = key.toLowerCase();
  const a = keys.KEY_A?.trim().toLowerCase();
  const b = keys.KEY_B?.trim().toLowerCase();
  const c = keys.KEY_C?.trim().toLowerCase();
  if (a && sameKey(k, a)) return 'A';
  if (b && sameKey(k, b)) return 'B';
  if (c && sameKey(k, c)) return 'G';
  return null;
}

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d{1,5})?$/;

/** The page origins allowed to open the socket: the listed ones (ALLOWED_ORIGINS, comma-separated) and localhost. */
export function originAllowed(origin: string | null, allowed: string): boolean {
  if (!origin) return false;
  if (LOCAL.test(origin)) return true;
  return allowed.split(',').map((s) => s.trim()).filter(Boolean).includes(origin);
}
