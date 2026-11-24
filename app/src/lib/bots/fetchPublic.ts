// A public bot status read (ジム's Worker /status, メニュー's status.json): no key, no header of ours (a simple
// request, no preflight), 20 s for the whole answer (as memberCall: a hung read would hold the page's 更新中 and the
// dot's read for the session). Never throws; a failure is logged as `logEvent` (the HTTP status, the phone's code
// `offline` `timeout` `http` `json`, ms), but not the caller's abort (the page left). 保養所 keeps its own call
// (lib/its/client.ts: the member key, a request id). `early`: a read begun already (gym/early.ts), else null.
import { log } from '#lib/sync/log.ts';
import type { BotReply } from './types.ts';

const TIMEOUT_MS = 20_000;

export type PublicReply<S> = { ok: true; status: S } | { ok: false; err: 'offline' | 'timeout' | 'http' | 'json'; http: number | null };

export async function fetchPublic<S>(url: string, logEvent: 'gym.fail' | 'kalori.fail', parse: (x: unknown) => S | null,
  o: { signal?: AbortSignal; cache?: RequestCache; early?: (signal: AbortSignal) => Promise<Response> | null } = {}): Promise<PublicReply<S> & BotReply<S>> {
  const t0 = performance.now();
  const late = AbortSignal.timeout(TIMEOUT_MS);
  let r: PublicReply<S>;
  try {
    const signal = o.signal ? AbortSignal.any([o.signal, late]) : late;
    const res = await (o.early?.(signal) ?? fetch(url, { signal, ...(o.cache ? { cache: o.cache } : {}) }));
    const s = res.ok ? parse(await res.json().catch(() => null)) : null;
    r = late.aborted ? { ok: false, err: 'timeout', http: null } : s ? { ok: true, status: s } : { ok: false, err: res.ok ? 'json' : 'http', http: res.status };
  } catch (e) {
    r = { ok: false, err: late.aborted || (e instanceof DOMException && e.name === 'TimeoutError') ? 'timeout' : 'offline', http: null };
  }
  if (!r.ok && !o.signal?.aborted) log(logEvent, { op: 'status', err: r.err, ms: Math.round(performance.now() - t0), ...(r.http === null ? {} : { http: r.http }) }, r.err === 'offline' ? 1 : 2);
  return r;
}
