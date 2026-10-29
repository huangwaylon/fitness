// Apps Script transport (docs/design/sheets-architecture.md §2): one POST helper, the per-person key, a write queue
// persisted in localStorage (replayed with backoff until acked), and the snapshot cache with incremental `since` merges.
// Plain TS (no Svelte) so it is unit-testable; storage and fetch are injectable.
import type { PersonId } from '#lib/types.ts';
import type { EventReply, EventType, SnapshotReply, SnapshotRows, WhoamiReply } from '#lib/ingest/sheet-api.ts';
import { emptyRows, maxAt, mergeRows } from '#lib/model/snapshot.ts';

export type GasError = 'offline' | 'unauthorized' | 'busy' | 'unavailable' | 'bad_request' | 'too_large';
export type GasResult<T> = ({ ok: true } & T) | { ok: false; error: GasError; detail?: string };

export interface KV {
  getItem(k: string): string | null;
  setItem(k: string, v: string): void;
  removeItem(k: string): void;
}

const KEYS = { key: 'island.key', me: 'island.me', queue: 'island.queue', cache: 'island.snapshot' } as const;
const TIMEOUT_MS = 20_000;
const GAS_URL: string = (import.meta.env?.VITE_GAS_URL as string | undefined) ?? '';

let kv: KV | null = typeof window !== 'undefined' ? window.localStorage : null;
let fetcher: typeof fetch = (...a) => fetch(...a);
let url = GAS_URL;

/** Tests: swap storage, fetch and the endpoint. */
export function configure(o: { storage?: KV; fetch?: typeof fetch; url?: string }): void {
  if (o.storage) kv = o.storage;
  if (o.fetch) fetcher = o.fetch;
  if (o.url !== undefined) url = o.url;
}

const read = <T>(k: string): T | null => {
  try {
    const s = kv?.getItem(k);
    return s ? (JSON.parse(s) as T) : null;
  } catch {
    return null;
  }
};
const write = (k: string, v: unknown): void => {
  try {
    kv?.setItem(k, JSON.stringify(v));
  } catch {
    // Quota or private mode: the app still works from memory for this session.
  }
};

// ---------- key ----------

export const getKey = (): string | null => kv?.getItem(KEYS.key) ?? null;
export const getStoredMe = (): PersonId | null => read<PersonId>(KEYS.me);

/** Store the key for `me`. A different person than before drops that person's cache and unsent queue. */
export function setKey(key: string, me: PersonId): void {
  if (getStoredMe() !== me) {
    kv?.removeItem(KEYS.cache);
    kv?.removeItem(KEYS.queue);
  }
  kv?.setItem(KEYS.key, key);
  write(KEYS.me, me);
}

export function clearKey(): void {
  kv?.removeItem(KEYS.key);
}

/** The key from `#key=…` (first open from a shared link), or null. */
export function keyFromHash(hash: string): string | null {
  const m = /(?:^#|&)key=([0-9a-fA-F]{16,128})(?:&|$)/.exec(hash);
  return m ? m[1].toLowerCase() : null;
}

// ---------- POST ----------

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
    const known: GasError[] = ['unauthorized', 'busy', 'unavailable', 'bad_request', 'too_large'];
    const error = known.includes(r?.error as GasError) ? (r.error as GasError) : 'unavailable';
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

// ---------- write queue ----------

export interface QueuedEvent {
  id: string;
  type: EventType;
  data: Record<string, unknown>;
  /** Client time it was queued (ms). */
  queuedAt: number;
  tries: number;
  /** Earliest next attempt (ms). */
  nextAt: number;
}

export function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export const queued = (): QueuedEvent[] => read<QueuedEvent[]>(KEYS.queue) ?? [];
const saveQueue = (q: QueuedEvent[]) => write(KEYS.queue, q);

export function enqueue(type: EventType, data: Record<string, unknown>, now = Date.now()): QueuedEvent {
  const ev: QueuedEvent = { id: newId(), type, data, queuedAt: now, tries: 0, nextAt: now };
  saveQueue([...queued(), ev]);
  return ev;
}

/** 1 s, 2 s, 4 s … capped at 5 min, ±20 % jitter. */
export function backoffMs(tries: number, rand = Math.random): number {
  const base = Math.min(300_000, 1000 * 2 ** Math.max(0, tries - 1));
  return Math.round(base * (0.8 + 0.4 * rand()));
}

export interface FlushResult { sent: number; dropped: QueuedEvent[]; remaining: number; error?: GasError }

let flushing: Promise<FlushResult> | null = null;

/**
 * Send queued events in order until one fails. Acked (`{ok}` or `{ok, duplicate}`) → removed. `bad_request` /
 * `too_large` can never succeed → dropped (reported). Transient errors keep the event (and everything after it,
 * so order is preserved) with a backoff. `unauthorized` stops the flush.
 */
export function flush(now: () => number = Date.now): Promise<FlushResult> {
  if (flushing) return flushing;
  const p = (async (): Promise<FlushResult> => {
    let sent = 0;
    const dropped: QueuedEvent[] = [];
    let error: GasError | undefined;
    for (;;) {
      const q = queued();
      const ev = q[0];
      if (!ev || ev.nextAt > now()) break;
      const r = await post<Extract<EventReply, { ok: true }>>('event', { id: ev.id, type: ev.type, data: ev.data });
      const cur = queued();
      if (r.ok) {
        sent++;
        saveQueue(cur.filter((x) => x.id !== ev.id));
        continue;
      }
      if (r.error === 'bad_request' || r.error === 'too_large') {
        dropped.push(ev);
        saveQueue(cur.filter((x) => x.id !== ev.id));
        continue;
      }
      error = r.error;
      if (r.error !== 'unauthorized') {
        const tries = ev.tries + 1;
        saveQueue(cur.map((x) => (x.id === ev.id ? { ...x, tries, nextAt: now() + backoffMs(tries) } : x)));
      }
      break;
    }
    return { sent, dropped, remaining: queued().length, error };
  })();
  flushing = p;
  void p.then(() => {
    if (flushing === p) flushing = null;
  });
  return p;
}

/** When the head of the queue may be retried (ms), or null if the queue is empty. */
export const nextRetryAt = (): number | null => queued()[0]?.nextAt ?? null;

// ---------- snapshot cache ----------

export interface SnapshotCache {
  v: 1;
  me: PersonId;
  rows: SnapshotRows;
  /** Max server `at` seen: the next `since`. */
  since: string | null;
  /** Server clock − client clock at the last fetch (ms). */
  skewMs: number;
  /** Client time of the last successful fetch (ms). */
  fetchedAt: number;
}

export function loadCache(): SnapshotCache | null {
  const c = read<SnapshotCache>(KEYS.cache);
  return c && c.v === 1 && c.rows ? c : null;
}

/** Merge a snapshot reply into the cache (pure; exported for tests). */
export function applySnapshot(prev: SnapshotCache | null, reply: { me: PersonId; now: string; rows: Partial<SnapshotRows> }, clientNow: number): SnapshotCache {
  const base = prev && prev.me === reply.me ? prev.rows : emptyRows();
  const rows = mergeRows(base, reply.rows);
  const serverNow = Date.parse(reply.now);
  return {
    v: 1, me: reply.me, rows, since: maxAt(rows),
    skewMs: Number.isNaN(serverNow) ? (prev?.skewMs ?? 0) : serverNow - clientNow,
    fetchedAt: clientNow
  };
}

/** Fetch rows since the last seen `at` (everything on first run), merge and persist. */
export async function refreshSnapshot(clientNow: () => number = Date.now): Promise<GasResult<{ cache: SnapshotCache }>> {
  const prev = loadCache();
  const me = getStoredMe();
  const since = prev && (!me || prev.me === me) ? prev.since : null;
  const r = await post<Extract<SnapshotReply, { ok: true }>>('snapshot', since ? { since } : {});
  if (!r.ok) return r;
  const cache = applySnapshot(since ? prev : null, r, clientNow());
  write(KEYS.cache, cache);
  if (getStoredMe() !== r.me) write(KEYS.me, r.me);
  return { ok: true, cache };
}
