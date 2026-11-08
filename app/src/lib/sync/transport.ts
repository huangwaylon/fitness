// The backend transport (docs/backend.md#api): one POST helper to the relay's record (docs/backend.md#the-record), and
// `whoami`. Never throws; every failure maps to the error taxonomy. Plain TS (no Svelte) so it is unit-testable; fetch
// and the URL are injectable.
import type { Who } from '#lib/types.ts';
import type { WhoamiReply } from '#lib/contract/api.ts';
import { getKey } from './storage.ts';
import { LIVE_URL } from './live.ts';
import { API_OK_SAMPLE, log, logId, sessionId } from './log.ts';

export type ApiError = 'offline' | 'unauthorized' | 'forbidden' | 'busy' | 'unavailable' | 'bad_request' | 'too_large';
export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: ApiError; detail?: string };

const TIMEOUT_MS = 20_000;
/** The relay's record: `VITE_RECORD_URL`, else the live relay's origin + `/api` (empty: none, the "not set up" screen). */
const RECORD_URL: string = (import.meta.env?.VITE_RECORD_URL as string | undefined)
  ?? (LIVE_URL ? LIVE_URL.replace(/^ws(s?):/, 'http$1:').replace(/\/room$/, '/api') : '');

let fetcher: typeof fetch = (...a) => fetch(...a);
let url = RECORD_URL;

/** False when the build has no record URL: the app shows its "not set up yet" screen (demo still works). */
export const RECORD_CONFIGURED = RECORD_URL.trim() !== '';

/** The log's endpoint beside the record's (`/api` → `/log`: docs/ops/observability.md). */
export const logUrl = (): string => url.replace(/\/api$/, '/log');

/** Tests: swap fetch and the endpoint. */
export function configureTransport(o: { fetch?: typeof fetch; url?: string }): void {
  if (o.fetch) fetcher = o.fetch;
  if (o.url !== undefined) url = o.url;
}

const KNOWN: ApiError[] = ['unauthorized', 'forbidden', 'busy', 'unavailable', 'bad_request', 'too_large'];

/** POST `{key, action, ...body}` as text/plain (a simple request: no CORS preflight). Never throws. Each carries a request
 *  id (`rid`) and the app session's (`sid`): the relay's log joins its `req` to the phone's `api.*` (sync/log.ts). */
export async function post<T extends object = object>(action: string, body: Record<string, unknown> = {}, opts: { key?: string; timeoutMs?: number; keepalive?: boolean } = {}): Promise<ApiResult<T>> {
  const key = opts.key ?? getKey();
  if (!key) return { ok: false, error: 'unauthorized' };
  if (!url) return { ok: false, error: 'unavailable', detail: 'no record URL' };
  const rid = logId(), t0 = performance.now();
  const r = await send<T>(action, key, rid, body, opts.timeoutMs, opts.keepalive);
  const ms = Math.round(performance.now() - t0);
  if (r.ok) log('api.ok', { action, ms }, 1, { r: rid, sample: API_OK_SAMPLE });
  else {
    const http = /^HTTP (\d{3})$/.exec(r.detail ?? '')?.[1];
    const err = http ? 'http' : r.detail === 'not JSON' ? 'json' : r.error;
    // offline is the phone's, not a failure of ours: info
    log('api.fail', { action, err, ms, ...(http ? { http: Number(http) } : {}) }, r.error === 'offline' ? 1 : 2, { r: rid });
  }
  return r;
}

/** `keepalive`: the request outlives the page (hidden, left: ≤ 64 KB of body, the browser's cap). */
async function send<T extends object>(action: string, key: string, rid: string, body: Record<string, unknown>, timeoutMs?: number, keepalive?: boolean): Promise<ApiResult<T>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs ?? TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetcher(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, key, action, rid, sid: sessionId() }),
      signal: ctrl.signal,
      ...(keepalive ? { keepalive: true } : {})
    });
  } catch {
    clearTimeout(timer);
    return { ok: false, error: ctrl.signal.aborted ? 'unavailable' : 'offline' };
  }
  try {
    if (!res.ok) return { ok: false, error: 'unavailable', detail: `HTTP ${res.status}` };
    const text = await res.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      return { ok: false, error: 'unavailable', detail: 'not JSON' }; // an error page on the way
    }
    const r = json as { ok?: unknown; error?: unknown; detail?: unknown };
    if (r && r.ok === true) return json as ApiResult<T>;
    const error = KNOWN.includes(r?.error as ApiError) ? (r.error as ApiError) : 'unavailable';
    return { ok: false, error, ...(typeof r?.detail === 'string' ? { detail: r.detail } : {}) };
  } catch {
    return { ok: false, error: ctrl.signal.aborted ? 'unavailable' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

export function whoami(key: string): Promise<ApiResult<{ me: Who }>> {
  return post<Extract<WhoamiReply, { ok: true }>>('whoami', {}, { key });
}
