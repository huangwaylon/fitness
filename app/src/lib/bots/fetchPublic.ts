// A public bot status read (ジム's Worker /status, メニュー's status.json): no key, no header of ours (a simple
// request, no preflight). Never throws; a failure is logged as `logEvent` (the HTTP status, the phone's code, ms), but
// not the caller's abort (the page left). 保養所 keeps its own call (lib/its/client.ts: the member key, a request id).
import { log } from '#lib/sync/log.ts';
import type { BotReply } from './types.ts';

export type PublicReply<S> = { ok: true; status: S } | { ok: false; err: 'offline' | 'http' | 'json'; http: number | null };

export async function fetchPublic<S>(url: string, logEvent: 'gym.fail' | 'kalori.fail', parse: (x: unknown) => S | null,
  o: { signal?: AbortSignal; cache?: RequestCache } = {}): Promise<PublicReply<S> & BotReply<S>> {
  const t0 = performance.now();
  let r: PublicReply<S>;
  try {
    const res = await fetch(url, { signal: o.signal, ...(o.cache ? { cache: o.cache } : {}) });
    const s = res.ok ? parse(await res.json().catch(() => null)) : null;
    r = s ? { ok: true, status: s } : { ok: false, err: res.ok ? 'json' : 'http', http: res.status };
  } catch {
    r = { ok: false, err: 'offline', http: null };
  }
  if (!r.ok && !o.signal?.aborted) log(logEvent, { op: 'status', err: r.err, ms: Math.round(performance.now() - t0), ...(r.http === null ? {} : { http: r.http }) }, r.err === 'offline' ? 1 : 2);
  return r;
}
