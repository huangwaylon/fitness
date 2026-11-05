// The record's HTTP side (docs/backend.md#the-record), free of the Workers runtime so it is unit-testable. The Worker
// only checks the origin, the method and the size and hands the body on: the parsing, the signature and the JSON reply
// happen in the Durable Object, whose CPU budget is far larger than the Free plan's ~10 ms per Worker request.
// - `POST /api`: the app's and the Shortcut's requests, one body (`{key, action, ...}` as text/plain JSON, a simple
//   request: no preflight from a page, no key in a URL or a header); every reply is JSON with status 200 (`{ok:false,
//   error}` included), so a client tells a refusal from an outage.
// - `POST /admin`: the record tool's operations (relay/scripts/record.ts: counts, bookmarks, restore, a new epoch, a dump, a load, the log, the weather), signed like `/notify` (notify.ts): only who holds both keys can sign.
// Each `/api` request is timed here (the wall time of the record's answer: in a Worker the clock moves only across
// I/O, so this is the round trip to the object, its queue and its work) and handed to `onReq` with the record's meta
// (reqMeta.ts): the relay's `req` event in the log (docs/ops/observability.md).
import { originAllowed } from './auth.ts';
import { SIG_HEADER, TIME_HEADER } from './notify.ts';
import { MAX_BODY_CHARS } from './store.ts';
import { errName } from './log.ts';
import type { ReqMeta } from './reqMeta.ts';

/** What the routes need from the store (the Durable Object's RPC methods). */
export interface StoreRoom {
  /** An `/api` body → its JSON reply. */
  api(text: string): Promise<string> | string;
  /** The same, with the request's meta for the log (reqMeta.ts). */
  apiMeta?(text: string): Promise<{ body: string; meta: ReqMeta }> | { body: string; meta: ReqMeta };
  /** A signed `/admin` body → the status and the JSON reply. */
  adminSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> | { status: number; body: string };
}

const ADMIN_MAX_CHARS = 4_000_000;

/** CORS for a page on an allowed origin (a request without an Origin, a Shortcut's or a server's, needs none). */
function corsOf(origin: string | null, allowed: string): Record<string, string> | null {
  if (!origin) return {};
  return originAllowed(origin, allowed) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : null;
}

/** A request's `req` event, with its wall time (ms). */
export type OnReq = (meta: ReqMeta, ms: number) => void;

export async function apiRoute(req: Request, allowed: string, store: () => StoreRoom, onReq?: OnReq): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), allowed);
  if (!cors) return new Response('forbidden', { status: 403 });
  const headers: Record<string, string> = { ...cors, 'Cache-Control': 'no-store' };
  // the request id echoed (the phone sent it in the body: its failure joins the relay's `req` row)
  const json = (body: string, rid?: string | null) => new Response(body, {
    headers: { ...headers, 'Content-Type': 'application/json', ...(rid ? { 'X-Request-Id': rid, ...(cors['Access-Control-Allow-Origin'] ? { 'Access-Control-Expose-Headers': 'X-Request-Id' } : {}) } : {}) }
  });
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
  }
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
  try {
    const room = store();
    if (onReq && room.apiMeta) {
      let r: { body: string; meta: ReqMeta } | null = null;
      try {
        r = await room.apiMeta(text);
      } catch (e) {
        // an object still on the code before apiMeta (the seconds after a deploy, until it restarts) has no such
        // method: the plain call, unlogged (2026-11-05: ~25 s of `unavailable` without this)
        if (!(e instanceof TypeError)) throw e;
      }
      if (r) {
        onReq(r.meta, Date.now() - t0);
        return json(r.body, r.meta.rid);
      }
    }
    return json(await room.api(text));
  } catch (e) {
    // its class only: a message can quote the body
    console.error('api', errName(e));
    onReq?.(bare('unavailable', text.length, errName(e)), Date.now() - t0);
    return json('{"ok":false,"error":"unavailable"}');
  }
}

export async function adminRoute(req: Request, store: () => StoreRoom): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > ADMIN_MAX_CHARS * 4) return new Response('too large', { status: 413 });
  const text = await req.text();
  if (text.length > ADMIN_MAX_CHARS) return new Response('too large', { status: 413 });
  const r = await store().adminSigned(text, req.headers.get(TIME_HEADER), req.headers.get(SIG_HEADER));
  return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.status === 200 ? 'application/json' : 'text/plain', 'Cache-Control': 'no-store' } });
}
