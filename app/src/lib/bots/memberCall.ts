// A members-only call to a bot's Worker that reads the answer's body either way (保養所's every call, ジム's act): this
// phone's key, an X-Request-Id the Worker logs (`rid=`), 20 s for the whole answer. Never throws: no key, a dead signal
// (nothing sent: `aborted`), offline or timeout is the phone's code; the caller's abort later is `offline` (the caller
// doesn't log it). ジム's acts pass no signal (components/bots/gymActs.svelte.ts: the timeout only). Each caller reads
// and logs its own answer (its.fail, gym.fail). (ジム's config: lib/keyed.ts.)
import { getKey } from '#lib/sync/storage.ts';

const TIMEOUT_MS = 20_000;

type Sent = { ok: true; res: Response; json: unknown; rid: string; ms: number } | { ok: false; err: 'no_key' | 'aborted' | 'offline' | 'timeout'; rid: string; ms: number };

/** A Worker's error code as the log may keep it (a short token), else `http`. */
export const errCode = (x: unknown): string => (typeof x === 'string' && /^[a-z_]{1,32}$/.test(x) ? x : 'http');

/** 8 hex digits: the Worker's log and the phone's say the same. */
const newRid = (): string => Array.from(crypto.getRandomValues(new Uint8Array(4)), (b) => b.toString(16).padStart(2, '0')).join('');

export async function memberCall(url: string, method: 'GET' | 'PUT' | 'POST', body: unknown, signal?: AbortSignal, key = getKey()): Promise<Sent> {
  const rid = newRid();
  if (!key || !url) return { ok: false, err: 'no_key', rid, ms: 0 };
  if (signal?.aborted) return { ok: false, err: 'aborted', rid, ms: 0 };
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  const late = AbortSignal.timeout(TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method, cache: 'no-store', signal: signal ? AbortSignal.any([signal, late]) : late,
      headers: { Authorization: `Bearer ${key}`, 'X-Request-Id': rid, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    const json: unknown = await res.json().catch(() => undefined);
    return { ok: true, res, json, rid, ms: ms() };
  } catch {
    return { ok: false, err: late.aborted ? 'timeout' : 'offline', rid, ms: ms() };
  }
}
