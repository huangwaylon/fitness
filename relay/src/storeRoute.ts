// The record's HTTP side (docs/backend.md#the-record), free of the Workers runtime so it is unit-testable. The Worker
// only checks the origin, the method and the size and hands the body on: the parsing, the signature and the JSON reply
// happen in the Durable Object, whose CPU budget is far larger than the Free plan's ~10 ms per Worker request.
// - `POST /api`: the app's and the Shortcut's requests, the same body as Apps Script's web app took (`{key, action, ...}`
//   as text/plain JSON, a simple request: no preflight from a page, no key in a URL or a header); every reply is
//   JSON with status 200, as Apps Script's were (`{ok:false, error}` included), so a client tells a refusal from an outage.
// - `POST /import`: rows that already have their `at` (Apps Script's copy of each write while it is still the record,
//   and the one-time import of the sheet's history), signed like `/notify` (notify.ts) since only the two servers
//   hold both keys.
import { originAllowed } from './auth.ts';
import { SIG_HEADER, TIME_HEADER } from './notify.ts';
import { MAX_BODY_CHARS, type Via } from './store.ts';

/** Set by Apps Script's forward. */
export const VIA_HEADER = 'X-Island-Via';

/** What the routes need from the store (the Durable Object's RPC methods). */
export interface StoreRoom {
  /** An `/api` body → its JSON reply. */
  api(text: string, via: Via): Promise<string> | string;
  /** A signed `/import` body → the status and the JSON reply. */
  importSigned(text: string, t: string | null, sig: string | null): Promise<{ status: number; body: string }> | { status: number; body: string };
}

export const IMPORT_MAX_CHARS = 4_000_000;

/** CORS for a page on an allowed origin (a request without an Origin, a Shortcut's or a server's, needs none). */
function corsOf(origin: string | null, allowed: string): Record<string, string> | null {
  if (!origin) return {};
  return originAllowed(origin, allowed) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : null;
}

export async function apiRoute(req: Request, allowed: string, store: () => StoreRoom): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), allowed);
  if (!cors) return new Response('forbidden', { status: 403 });
  const headers = { ...cors, 'Cache-Control': 'no-store' };
  const json = (body: string) => new Response(body, { headers: { ...headers, 'Content-Type': 'application/json' } });
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { ...headers, Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > MAX_BODY_CHARS * 4) return json('{"ok":false,"error":"too_large"}');
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) return json('{"ok":false,"error":"too_large"}');
  try {
    // Apps Script's forward says so (gas/main.ts): counted apart, so its retirement waits for a day without any
    return json(await store().api(text, req.headers.get(VIA_HEADER) === 'gas' ? 'gas' : 'direct'));
  } catch (e) {
    console.error('api', e);
    return json('{"ok":false,"error":"unavailable"}');
  }
}

export async function importRoute(req: Request, store: () => StoreRoom): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > IMPORT_MAX_CHARS * 4) return new Response('too large', { status: 413 });
  const text = await req.text();
  if (text.length > IMPORT_MAX_CHARS) return new Response('too large', { status: 413 });
  const r = await store().importSigned(text, req.headers.get(TIME_HEADER), req.headers.get(SIG_HEADER));
  return new Response(r.body, { status: r.status, headers: { 'Content-Type': r.status === 200 ? 'application/json' : 'text/plain', 'Cache-Control': 'no-store' } });
}
