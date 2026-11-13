// The room's admission ticket (docs/backend.md#live-relay "Admission", relay review O3): a phone proves it holds a
// person's key before its socket reaches the room, so a stranger past the origin check can't hold sockets open there.
// It rides in the WebSocket's subprotocols (`new WebSocket(url, [ROOM_PROTOCOL, ticket])`: the only header a page may
// set on one), the key itself never: `tk.<who>.<exp>.<sig>`, `exp` when it stops counting (ms since the epoch, base
// 36), `sig` the hex HMAC-SHA256 under the person's key (lower case, as keys compare) of `island-room.<who>.<exp>`.
// The relay answers with ROOM_PROTOCOL (a browser drops a socket whose answer names none it offered). Shared by the
// relay (relay/src/auth.ts admission) and the phones; Web Crypto only.

type Who = 'A' | 'B' | 'G';

/** The subprotocol a ticketed phone offers beside its ticket, and the relay answers with. @public (relay/src/auth.ts) */
export const ROOM_PROTOCOL = 'island-v1';
/** A ticket counts until its `exp`, at most this far ahead of the relay's clock (a phone's clock a little off).
 *  @public (relay/test/ticket.test.ts) */
export const TICKET_MAX_MS = 10 * 60_000;
/** How long a phone makes its ticket for. @public (the phones' half: sync/live.ts) */
export const TICKET_TTL_MS = 5 * 60_000;

const TICKET_RE = /^tk\.([ABG])\.([0-9a-z]{1,12})\.([0-9a-f]{64})$/;
const enc = new TextEncoder();

/** HMAC-SHA256 of `msg` under `key`, hex. @public (relay/src/sign.ts: the server-to-server signature) */
export async function hmacHex(key: string, msg: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return Array.from(new Uint8Array(await crypto.subtle.sign('HMAC', k, enc.encode(msg))), (b) => b.toString(16).padStart(2, '0')).join('');
}
/** Under a person's key (lower case, as keys compare). */
const sign = (key: string, msg: string): Promise<string> => hmacHex(key.trim().toLowerCase(), msg);

/** Equal strings, in time independent of where they differ (the length is not secret: keys are 32–128 hex).
 *  @public (relay/src/auth.ts) */
export function sameKey(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

/** `who`'s ticket under `key`, counting until `exp` (ms). @public (the phones' half: sync/live.ts) */
export async function makeTicket(key: string, who: Who, exp: number): Promise<string> {
  const e = Math.floor(exp).toString(36);
  return `tk.${who}.${e}.${await sign(key, `island-room.${who}.${e}`)}`;
}

/** The ticket among a `Sec-WebSocket-Protocol` header's subprotocols (the first that looks like one), or null.
 *  @public (relay/src/auth.ts) */
export function ticketIn(header: string | null): string | null {
  if (!header || header.length > 1024) return null;
  for (const p of header.split(',')) {
    const t = p.trim();
    if (t.startsWith('tk.')) return t;
  }
  return null;
}

/**
 * Whose ticket this is, checked against the person keys at `now` (the relay's clock), or null: well-formed, not past
 * its `exp` nor more than TICKET_MAX_MS ahead, and signed under the key of the person it names (compared in constant
 * time). @public (relay/src/auth.ts)
 */
export async function ticketOwner(ticket: string, keys: { KEY_A?: string; KEY_B?: string; KEY_C?: string }, now: number): Promise<Who | null> {
  const m = TICKET_RE.exec(ticket);
  if (!m) return null;
  const who = m[1] as Who;
  const exp = parseInt(m[2], 36);
  if (!(exp > now) || exp > now + TICKET_MAX_MS) return null;
  const key = who === 'A' ? keys.KEY_A : who === 'B' ? keys.KEY_B : keys.KEY_C;
  if (!key?.trim()) return null;
  return sameKey(await sign(key, `island-room.${who}.${m[2]}`), m[3]) ? who : null;
}
