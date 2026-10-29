// Apps Script transport (docs/design/sheets-architecture.md §2): one POST helper and `whoami`. Never throws; every
// failure maps to the error taxonomy. Plain TS (no Svelte) so it is unit-testable; fetch and the URL are injectable.
import type { PersonId } from '#lib/types.ts';
import type { WhoamiReply } from '#lib/contract/api.ts';
import { getKey } from './storage.ts';

export type GasError = 'offline' | 'unauthorized' | 'busy' | 'unavailable' | 'bad_request' | 'too_large';
export type GasResult<T> = ({ ok: true } & T) | { ok: false; error: GasError; detail?: string };

const TIMEOUT_MS = 20_000;
const GAS_URL: string = (import.meta.env?.VITE_GAS_URL as string | undefined) ?? '';

let fetcher: typeof fetch = (...a) => fetch(...a);
let url = GAS_URL;

/** False when the build had no VITE_GAS_URL: the app shows its "not set up yet" screen (demo still works). */
export const GAS_CONFIGURED = GAS_URL.trim() !== '';

/** Tests: swap fetch and the endpoint. */
export function configureTransport(o: { fetch?: typeof fetch; url?: string }): void {
  if (o.fetch) fetcher = o.fetch;
  if (o.url !== undefined) url = o.url;
}

const KNOWN: GasError[] = ['unauthorized', 'busy', 'unavailable', 'bad_request', 'too_large'];

/** POST `{key, action, ...body}` as text/plain (a simple request: no CORS preflight). Never throws. */
export async function post<T extends object = object>(action: string, body: Record<string, unknown> = {}, opts: { key?: string; timeoutMs?: number } = {}): Promise<GasResult<T>> {
  const key = opts.key ?? getKey();
  if (!key) return { ok: false, error: 'unauthorized' };
  if (!url) return { ok: false, error: 'unavailable', detail: 'VITE_GAS_URL is not set' };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), opts.timeoutMs ?? TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetcher(url, {
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

export function whoami(key: string): Promise<GasResult<{ me: PersonId }>> {
  return post<Extract<WhoamiReply, { ok: true }>>('whoami', {}, { key });
}
