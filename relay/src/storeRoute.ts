// The record's HTTP side (docs/backend.md#the-record), free of the Workers runtime so it is unit-testable:
// - `POST /api`: the app's and the Shortcut's requests, the same body as Apps Script's web app took (`{key, action, ...}`
//   as text/plain JSON, a simple request: no preflight from a page, no key in a URL or a header); every reply is
//   JSON with status 200, as Apps Script's were (`{ok:false, error}` included), so a client tells a refusal from an outage.
// - `POST /import`: rows that already have their `at` (Apps Script's copy of each write while it is still the record,
//   and the one-time import of the sheet's history), signed like `/notify` (notify.ts) since only the two servers
//   hold both keys.
import { originAllowed, type Keys } from './auth.ts';
import { SIG_HEADER, TIME_HEADER, verifyNotify } from './notify.ts';
import { MAX_BODY_CHARS, type ImportResult, type ImportRows } from './store.ts';
import type { Notice } from '../../app/src/lib/sync/live-protocol.ts';

/** What the routes need from the store (the Durable Object's RPC methods). */
export interface StoreRoom {
  api(body: unknown, bytes: number): Promise<Record<string, unknown>> | Record<string, unknown>;
  importRows(rows: ImportRows, notice: Notice | null): Promise<ImportResult & { counts: Record<string, number> }> | (ImportResult & { counts: Record<string, number> });
}

export const IMPORT_MAX_CHARS = 4_000_000;
const enc = new TextEncoder();

/** CORS for a page on an allowed origin (a request without an Origin, a Shortcut's or a server's, needs none). */
function corsOf(origin: string | null, allowed: string): Record<string, string> | null {
  if (!origin) return {};
  return originAllowed(origin, allowed) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : null;
}

export async function apiRoute(req: Request, allowed: string, store: () => StoreRoom): Promise<Response> {
  const cors = corsOf(req.headers.get('Origin'), allowed);
  if (!cors) return new Response('forbidden', { status: 403 });
  const headers = { ...cors, 'Cache-Control': 'no-store' };
  const json = (body: object) => Response.json(body, { headers });
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: { ...headers, 'Access-Control-Allow-Methods': 'POST', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' } });
  }
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { ...headers, Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > MAX_BODY_CHARS * 4) return json({ ok: false, error: 'too_large' });
  const text = await req.text();
  if (text.length > MAX_BODY_CHARS) return json({ ok: false, error: 'too_large' });
  if (!text) return json({ ok: false, error: 'bad_request' });
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: 'bad_request' });
  }
  try {
    return json(await store().api(body, enc.encode(text).length));
  } catch (e) {
    console.error('api', e);
    return json({ ok: false, error: 'unavailable' });
  }
}

export async function importRoute(req: Request, keys: Keys, store: () => StoreRoom, now: number): Promise<Response> {
  if (req.method !== 'POST') return new Response('method not allowed', { status: 405, headers: { Allow: 'POST' } });
  if (Number(req.headers.get('Content-Length') ?? 0) > IMPORT_MAX_CHARS * 4) return new Response('too large', { status: 413 });
  const body = await req.text();
  if (body.length > IMPORT_MAX_CHARS) return new Response('too large', { status: 413 });
  if (!(await verifyNotify(keys, req.headers.get(TIME_HEADER), req.headers.get(SIG_HEADER), body, now))) {
    return new Response('unauthorized', { status: 401 });
  }
  let o: unknown;
  try {
    o = JSON.parse(body);
  } catch {
    return new Response('bad request', { status: 400 });
  }
  const x = o as { rows?: unknown; notice?: unknown } | null;
  if (!x || typeof x !== 'object' || !x.rows || typeof x.rows !== 'object') return new Response('bad request', { status: 400 });
  const r = x.rows as Record<string, unknown>;
  const rows: ImportRows = {};
  for (const t of ['metrics', 'events', 'uploads'] as const) {
    if (r[t] === undefined) continue;
    if (!Array.isArray(r[t])) return new Response('bad request', { status: 400 });
    rows[t] = r[t] as unknown[][];
  }
  const notice = x.notice && typeof x.notice === 'object' ? (x.notice as Notice) : null;
  return Response.json({ ok: true, ...(await store().importRows(rows, notice)) }, { headers: { 'Cache-Control': 'no-store' } });
}
