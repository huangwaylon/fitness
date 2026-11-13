// A members-only call to the relay or a bot's Worker (docs/backend.md): the phone's key as a Bearer header, the answer
// sorted into one vocabulary: `unpaired` (no key here, or no endpoint in this build), `refused` (401, 403, 404: not
// this key's, the guest's, or a Worker without the route), `failed` (another status: the reply kept for the caller to
// read), `unreached` (fetch threw: offline, a preflight refused), `timeout`, `aborted` (the caller's signal). Never
// throws. Used by the relay recogniser (mic/backends/relay.ts) and ジム's 現在の設定 (gym/config.ts).

type KeyedMiss = 'unpaired' | 'refused' | 'failed' | 'unreached' | 'timeout' | 'aborted';

/** The log's failure (sync/log.ts plugs it in): one `keyed.fail` an incident by endpoint and
 *  kind. Not for `unpaired` or `aborted`: no call, or the caller's own. */
let sink: (url: string, why: KeyedMiss, http?: number) => void = () => {};
export const keyedSink = (fn: typeof sink): void => void (sink = fn);
/** The answer (2xx or a 304), or why not; a refused or failed one carries the reply. */
export type Keyed = { ok: true; res: Response } | { ok: false; why: KeyedMiss; res?: Response };

/** `init` sent to `url` with `key`; `answerMs`: how long its answer (the headers, never the body's download) is waited
 *  for (`timeout`). */
export async function keyed(url: string, key: string | null | undefined, init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}, answerMs?: number): Promise<Keyed> {
  const r = await call(url, key, init, answerMs);
  if (!r.ok && r.why !== 'unpaired' && r.why !== 'aborted') sink(url, r.why, r.res?.status);
  return r;
}

async function call(url: string, key: string | null | undefined, init: Omit<RequestInit, 'headers'> & { headers?: Record<string, string> } = {}, answerMs?: number): Promise<Keyed> {
  if (!key || !url) return { ok: false, why: 'unpaired' };
  const late = answerMs === undefined ? null : new AbortController();
  const timer = late && setTimeout(() => late.abort(new DOMException('no answer', 'TimeoutError')), answerMs);
  const signal = late && init.signal ? AbortSignal.any([init.signal, late.signal]) : (late?.signal ?? init.signal);
  let res: Response;
  try {
    res = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${key}` }, ...(signal ? { signal } : {}) });
  } catch (e) {
    const name = e instanceof DOMException ? e.name : '';
    return { ok: false, why: late?.signal.aborted || name === 'TimeoutError' ? 'timeout' : name === 'AbortError' ? 'aborted' : 'unreached' };
  } finally {
    if (timer) clearTimeout(timer);
  }
  if (res.ok || res.status === 304) return { ok: true, res };
  return { ok: false, why: res.status === 401 || res.status === 403 || res.status === 404 ? 'refused' : 'failed', res };
}
