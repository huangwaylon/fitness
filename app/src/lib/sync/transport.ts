// The backend transport (docs/backend.md#api): one POST helper to the relay's record (docs/backend.md#the-record), and
// `whoami`. Never throws; every failure maps to the error taxonomy. Plain TS (no Svelte) so it is unit-testable; fetch
// and the URL are injectable.
import type { Who } from '#lib/types.ts';
import type { WhoamiReply } from '#lib/contract/api.ts';
import { getKey } from './storage.ts';
import { LIVE_URL } from './live.ts';
import { API_OK_SAMPLE, log, logId, sessionId } from './log.ts';

export type ApiError = 'offline' | 'unauthorized' | 'forbidden' | 'busy' | 'unavailable' | 'bad_request' | 'too_large';
/** `served`: the relay itself answered the failure (its JSON `unavailable`, or an HTTP 5xx: a Worker or record that
 *  threw), not the network, a timeout or the record's restore: the queue counts those against one event (queue.ts). */
export type ApiResult<T> = ({ ok: true } & T) | { ok: false; error: ApiError; detail?: string; served?: true };

const TIMEOUT_MS = 20_000;
/** The relay's record: `VITE_RECORD_URL`, else the live relay's origin + `/api` (empty: none, the "not set up" screen). */
const RECORD_URL: string = (import.meta.env?.VITE_RECORD_URL as string | undefined)
  ?? (LIVE_URL ? LIVE_URL.replace(/^ws(s?):/, 'http$1:').replace(/\/room$/, '/api') : '');

let fetcher: typeof fetch = (...a) => fetch(...a);
let url = RECORD_URL;

/** False when the build has no record URL: the app shows its "not set up yet" screen (demo still works). */
export const RECORD_CONFIGURED = RECORD_URL.trim() !== '';

/** The relay's `path` beside the record's `/api` (`/log`: docs/ops/observability.md), or ''
 *  when the build has no relay. */
export const relayUrl = (path: string): string => url.replace(/\/api$/, path);
/** The log's endpoint beside the record's. */
export const logUrl = (): string => relayUrl('/log');

/** Tests: swap fetch and the endpoint. */
export function configureTransport(o: { fetch?: typeof fetch; url?: string }): void {
  if (o.fetch) fetcher = o.fetch;
  if (o.url !== undefined) url = o.url;
}

const KNOWN: ApiError[] = ['unauthorized', 'forbidden', 'busy', 'unavailable', 'bad_request', 'too_large'];

/** The actions sent again once at once when the phone came back with one in flight (`resumed`): the reads, and the
 *  queue's events (the record acks a repeat of an id as a duplicate). Not the share ops that make or change a link. */
const AGAIN_ON_RESUME = new Set(['snapshot', 'events', 'whoami', 'share_list', 'share_visits']);

/**
 * The requests in flight, each with whether the page was hidden since it went. iOS freezes a hidden page's requests
 * (the phone locked, another app): one across a hide answered only at its timeout, up to 20 s after the phone was back,
 * and the flush and the sync waited on it (review 11-24 R3: B's events request took 31.7 s, the snapshot 20 s, both
 * logged as the relay's `unavailable`). Back on screen, those are aborted (`resumed`): the phone's, not the relay's.
 */
const flying = new Set<{ ctrl: AbortController; hid: boolean; resumed: boolean }>();
let watching = false;
const pageHidden = (): boolean => typeof document !== 'undefined' && document.visibilityState === 'hidden';
function watchVisibility(): void {
  if (watching || typeof document === 'undefined') return;
  watching = true;
  document.addEventListener('visibilitychange', () => {
    const hidden = pageHidden();
    for (const f of flying) {
      if (hidden) f.hid = true;
      else if (f.hid) {
        f.resumed = true;
        f.ctrl.abort();
      }
    }
  });
}

/** POST `{key, action, ...body}` as text/plain (a simple request: no CORS preflight). Never throws. Each carries a request
 *  id (`rid`) and the app session's (`sid`): the relay's log joins its `req` to the phone's `api.*` (sync/log.ts).
 *  One aborted by the phone's coming back (`resumed`) goes again once when it's safe to (AGAIN_ON_RESUME). */
export async function post<T extends object = object>(action: string, body: Record<string, unknown> = {}, opts: { key?: string; timeoutMs?: number; keepalive?: boolean } = {}): Promise<ApiResult<T>> {
  const key = opts.key ?? getKey();
  if (!key) return { ok: false, error: 'unauthorized' };
  if (!url) return { ok: false, error: 'unavailable', detail: 'no record URL' };
  for (let n = 0; ; n++) {
    const rid = logId(), t0 = performance.now();
    const r = await send<T>(action, key, rid, body, opts.timeoutMs, opts.keepalive);
    const ms = Math.round(performance.now() - t0);
    if (r.ok) log('api.ok', { action, ms }, 1, { r: rid, sample: API_OK_SAMPLE });
    else {
      const http = /^HTTP (\d{3})$/.exec(r.detail ?? '')?.[1];
      // (`timeout`: no answer in time with the page on screen throughout; `resumed`, `hidden`: the phone's)
      const err = http ? 'http' : r.detail === 'not JSON' ? 'json' : r.detail === 'timeout' || r.detail === 'resumed' || r.detail === 'hidden' ? r.detail : r.error;
      // offline is the phone's, not a failure of ours: info
      log('api.fail', { action, err, ms, ...(http ? { http: Number(http) } : {}) }, r.error === 'offline' ? 1 : 2, { r: rid });
    }
    if (r.ok || r.detail !== 'resumed' || n > 0 || !AGAIN_ON_RESUME.has(action)) return r;
  }
}

/** `keepalive`: the request outlives the page (hidden, left: ≤ 64 KB of body, the browser's cap). A failure with the
 *  page hidden since it went is `offline` (the phone's): `resumed` when the phone's coming back aborted it, `hidden`
 *  at its timeout; at a timeout on screen throughout, `unavailable` (`timeout`). */
async function send<T extends object>(action: string, key: string, rid: string, body: Record<string, unknown>, timeoutMs?: number, keepalive?: boolean): Promise<ApiResult<T>> {
  const ctrl = new AbortController();
  const f = { ctrl, hid: pageHidden(), resumed: false };
  watchVisibility();
  flying.add(f);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs ?? TIMEOUT_MS);
  const failed = (): ApiResult<T> => {
    if (f.resumed) return { ok: false, error: 'offline', detail: 'resumed' };
    if (!ctrl.signal.aborted) return { ok: false, error: 'offline' };
    return f.hid || pageHidden() ? { ok: false, error: 'offline', detail: 'hidden' } : { ok: false, error: 'unavailable', detail: 'timeout' };
  };
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
    flying.delete(f);
    return failed();
  }
  try {
    // (a 413, the edge's body cap: the queue halves the batch, one alone set aside; never backed off for hours as
    // `unavailable`)
    if (!res.ok) return { ok: false, error: res.status === 413 ? 'too_large' : 'unavailable', detail: `HTTP ${res.status}`, ...(res.status >= 500 ? { served: true as const } : {}) };
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
    const detail = typeof r?.detail === 'string' ? r.detail : undefined;
    return { ok: false, error, ...(detail ? { detail } : {}), ...(error === 'unavailable' && detail !== 'restoring' ? { served: true as const } : {}) };
  } catch {
    return failed();
  } finally {
    flying.delete(f);
    clearTimeout(timer);
  }
}

export function whoami(key: string): Promise<ApiResult<{ me: Who }>> {
  return post<Extract<WhoamiReply, { ok: true }>>('whoami', {}, { key });
}
