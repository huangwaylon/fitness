// The backend transport (docs/backend.md#api): one POST helper, to the relay's record (docs/backend.md#the-record) or
// the Apps Script web app (the same contract), and `whoami`. Never throws; every failure maps to the error taxonomy.
// Plain TS (no Svelte) so it is unit-testable; fetch and the URLs are injectable.
import type { PersonId } from '#lib/types.ts';
import type { WhoamiReply } from '#lib/contract/api.ts';
import { getKey } from './storage.ts';
import { LIVE_URL } from './live.ts';

export type GasError = 'offline' | 'unauthorized' | 'busy' | 'unavailable' | 'bad_request' | 'too_large';
export type GasResult<T> = ({ ok: true } & T) | { ok: false; error: GasError; detail?: string };

const TIMEOUT_MS = 20_000;
const GAS_URL: string = (import.meta.env?.VITE_GAS_URL as string | undefined) ?? '';
/** The relay's record: `VITE_RECORD_URL`, else the live relay's origin + `/api` (empty: Apps Script only). */
const RECORD_URL: string = (import.meta.env?.VITE_RECORD_URL as string | undefined)
  ?? (LIVE_URL ? LIVE_URL.replace(/^ws(s?):/, 'http$1:').replace(/\/room$/, '/api') : '');

let fetcher: typeof fetch = (...a) => fetch(...a);
let url = GAS_URL;
let recordUrl = RECORD_URL;

/** False when the build had no VITE_GAS_URL: the app shows its "not set up yet" screen (demo still works). */
export const GAS_CONFIGURED = GAS_URL.trim() !== '';

/** Tests: swap fetch and the endpoint. */
export function configureTransport(o: { fetch?: typeof fetch; url?: string; recordUrl?: string }): void {
  if (o.fetch) fetcher = o.fetch;
  if (o.url !== undefined) {
    url = o.url;
    recordUrl = o.recordUrl ?? ''; // a test's one endpoint, unless it names the record's too
  } else if (o.recordUrl !== undefined) recordUrl = o.recordUrl;
}

const KNOWN: GasError[] = ['unauthorized', 'busy', 'unavailable', 'bad_request', 'too_large'];

/** POST `{key, action, ...body}` as text/plain (a simple request: no CORS preflight). Never throws. */
export async function post<T extends object = object>(action: string, body: Record<string, unknown> = {}, opts: { key?: string; timeoutMs?: number; to?: 'gas' | 'record' } = {}): Promise<GasResult<T>> {
  const key = opts.key ?? getKey();
  if (!key) return { ok: false, error: 'unauthorized' };
  const to = opts.to === 'record' ? recordUrl : url;
  if (!to) return { ok: false, error: 'unavailable', detail: opts.to === 'record' ? 'no record URL' : 'VITE_GAS_URL is not set' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetcher(to, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ ...body, key, action }),
      redirect: 'follow',
      signal: ctrl.signal
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
      return { ok: false, error: 'unavailable', detail: 'not JSON' }; // Google's HTML error page
    }
    const r = json as { ok?: unknown; error?: unknown; detail?: unknown };
    if (r && r.ok === true) return json as GasResult<T>;
    const error = KNOWN.includes(r?.error as GasError) ? (r.error as GasError) : 'unavailable';
    return { ok: false, error, ...(typeof r?.detail === 'string' ? { detail: r.detail } : {}) };
  } catch {
    return { ok: false, error: ctrl.signal.aborted ? 'unavailable' : 'offline' };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * A read from the relay's record, falling back to Apps Script when the relay can't be reached or answers with an
 * outage (`offline`, `unavailable`); a refusal (`unauthorized`, `bad_request`, …) is the answer. Without a record
 * URL, Apps Script only.
 */
export async function postRecord<T extends object = object>(action: string, body: Record<string, unknown> = {}, opts: { key?: string; timeoutMs?: number } = {}): Promise<GasResult<T>> {
  if (!recordUrl) return post<T>(action, body, opts);
  const r = await post<T>(action, body, { ...opts, to: 'record' });
  if (r.ok || (r.error !== 'unavailable' && r.error !== 'offline') || !url) return r;
  return post<T>(action, body, opts);
}

export function whoami(key: string): Promise<GasResult<{ me: PersonId }>> {
  return post<Extract<WhoamiReply, { ok: true }>>('whoami', {}, { key });
}
