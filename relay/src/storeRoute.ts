// The record's HTTP side (docs/backend.md#the-record), free of the Workers runtime so it is unit-testable. The Worker
// checks the origin, the method, the size, that an `/api` body carries a person's key (a bounded scan, keyGate) and an
// `/admin` request a signature of the right shape and time, and hands the body on: the parsing, the key's and the
// signature's own checks and the JSON reply happen in the Durable Object, whose CPU budget is far larger than the Free
// plan's ~10 ms per Worker request.
// - `POST /api`: the app's and the Shortcut's requests, one body (`{key, action, ...}` as text/plain JSON, a simple
//   request: no preflight from a page, no key in a URL or a header); every reply is JSON with status 200 (`{ok:false,
//   error}` included), so a client tells a refusal from an outage.
// - `POST /admin`: the record tool's operations (relay/scripts/record.ts: counts, bookmarks, restore, a new epoch, a dump, a load, the log, the weather), signed (notify.ts): only who holds both keys can sign.
// Each `/api` request is timed here (the wall time of the record's answer: in a Worker the clock moves only across
// I/O, so this is the round trip to the object, its queue and its work) and handed to `onReq` with the record's meta
// (reqMeta.ts): the relay's `req` event in the log (docs/ops/observability.md).
import { corsOf, keyOwner, preflight, type Keys } from './auth.ts';
import { SIG_HEADER, TIME_HEADER, sigShaped, verifyNotify } from './notify.ts';
import { isRec, MAX_BODY_CHARS } from '../../app/src/lib/contract/api.ts';
import { isLogId, LOG_ACTIONS } from '../../app/src/lib/contract/log.ts';
import { errName } from './log.ts';
import type { ReqMeta } from './reqMeta.ts';

/** What the routes need from the store (the Durable Object's RPC methods). */
export interface StoreRoom {
  /** An `/api` body → its JSON reply, with the request's meta for the log (reqMeta.ts). */
  apiMeta(text: string): Promise<{ body: string; meta: ReqMeta }> | { body: string; meta: ReqMeta };
  /** A signed `/admin` body → the status and the JSON reply. */
  adminSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> | { status: number; body: string };
}

const ADMIN_MAX_CHARS = 4_000_000;

/** A `"key": "<hex>"` member of a body (a key is 32–128 hex characters: auth.ts). Inside a JSON string a quote is
 *  escaped, so this never matches text in a value; a nested object's `key` (a pref's: a name, never hex) doesn't
 *  either. */
const KEY_FIELD = /"key"\s*:\s*"([0-9a-fA-F]{32,128})"/g;
/** A body without a key at all that still goes on to the record: keyless `health`, or small junk it refuses. */
const KEYLESS_MAX = 512;

/**
 * Whether a body may go on to the record (the Worker's check, before it spends a Durable Object request): one of its
 * first 8 `"key"` members is a person's key, or it has none and is small (keyless `health`). A bounded scan, not a
 * parse: the record parses and checks the key again. Refused: `ok` false and the first key it presented, if any.
 */
function keyGate(text: string, keys: Keys): { ok: boolean; seen?: string } {
  let n = 0, seen: string | undefined;
  for (const m of text.matchAll(KEY_FIELD)) {
    if (keyOwner(m[1], keys)) return { ok: true };
    seen ??= m[1];
    if (++n >= 8) return { ok: false, seen };
  }
  return { ok: n === 0 && text.length <= KEYLESS_MAX, seen };
}

/** A presented key's hash as the log keeps it (`kh`): the first 4 hex of its SHA-256 (lower case, as keys compare), never
 *  the key. */
async function keyHash(key: string): Promise<string> {
  const d = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(key.toLowerCase())));
  return Array.from(d.slice(0, 2), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** A refused body's action and ids for its `req` row (which caller a stale key is: a Shortcut's ingest, an old app),
 *  parsed only when small (the Worker's CPU: a refused body is a few hundred bytes). */
function callerOf(text: string): { action: string; rid: string | null; sid: string | null } {
  let b: unknown = null;
  try {
    b = text.length <= 8_192 ? JSON.parse(text) : null;
  } catch {
    b = null;
  }
  const o = isRec(b) ? b : {};
  return { action: (LOG_ACTIONS as readonly unknown[]).includes(o.action) ? String(o.action) : 'other', rid: isLogId(o.rid) ? o.rid : null, sid: isLogId(o.sid) ? o.sid : null };
}

/** A request's `req` event, with its wall time (ms). */
export type OnReq = (meta: ReqMeta, ms: number) => void;

export async function apiRoute(req: Request, allowed: string, store: () => StoreRoom, onReq?: OnReq, keys?: Keys): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), allowed);
  if (!cors) return new Response('forbidden', { status: 403 });
  const headers: Record<string, string> = { ...cors, 'Cache-Control': 'no-store' };
  // the request id echoed (the phone sent it in the body: its failure joins the relay's `req` row)
  const json = (body: string, rid?: string | null) => new Response(body, {
    headers: { ...headers, 'Content-Type': 'application/json', ...(rid ? { 'X-Request-Id': rid, ...(cors['Access-Control-Allow-Origin'] ? { 'Access-Control-Expose-Headers': 'X-Request-Id' } : {}) } : {}) }
  });
  if (req.method === 'OPTIONS') return preflight(headers, 'POST', 'Content-Type');
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { ...headers, Allow: 'POST' } });
  const t0 = Date.now();
  const bare = (st: string, inB: number, exc?: string): ReqMeta => ({ action: 'other', st, role: null, rid: null, sid: null, inB, outB: 0, ...(exc ? { exc } : {}) });
  if (Number(req.headers.get('Content-Length') ?? 0) > MAX_BODY_CHARS * 4) {
    onReq?.(bare('too_large', Number(req.headers.get('Content-Length'))), 0);
    return json('{"ok":false,"error":"too_large"}');
  }
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) {
    onReq?.(bare('too_large', text.length), Date.now() - t0);
    return json('{"ok":false,"error":"too_large"}');
  }
  // no person's key: refused here (a stranger's body never reaches the record), its key's hash in the log
  const gate = keys ? keyGate(text, keys) : { ok: true };
  if (!gate.ok) {
    onReq?.({ ...bare('unauthorized', text.length), ...callerOf(text), ...(gate.seen ? { kh: await keyHash(gate.seen) } : {}) }, Date.now() - t0);
    return json('{"ok":false,"error":"unauthorized"}');
  }
  try {
    const r = await store().apiMeta(text);
    onReq?.(r.meta, Date.now() - t0);
    return json(r.body, r.meta.rid);
  } catch (e) {
    // its class only: a message can quote the body
    console.error('api', errName(e));
    onReq?.(bare('unavailable', text.length, errName(e)), Date.now() - t0);
    return json('{"ok":false,"error":"unavailable"}');
  }
}

export async function adminRoute(req: Request, store: () => StoreRoom, keys: Keys, now: () => number = Date.now): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { Allow: 'POST' } });
  const unauthorized = () => new Response('unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } });
  const t = req.headers.get(TIME_HEADER), sig = req.headers.get(SIG_HEADER);
  if (!sigShaped(t, sig, now())) return unauthorized();
  if (Number(req.headers.get('Content-Length') ?? 0) > ADMIN_MAX_CHARS * 4) return new Response('too large', { status: 413 });
  const text = await req.text();
  if (text.length > ADMIN_MAX_CHARS) return new Response('too large', { status: 413 });
  // the signature itself, here too (the record checks it again): a forged one never spends a Durable Object request
  if (!(await verifyNotify(keys, t, sig, text, now()))) return unauthorized();
  const r = await store().adminSigned(text, t, sig);
  return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.status === 200 ? 'application/json' : 'text/plain', 'Cache-Control': 'no-store' } });
}
