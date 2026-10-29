// Apps Script transport (docs/design/sheets-architecture.md §2): one POST helper, the per-person key, a write queue
// persisted in localStorage (replayed with backoff until acked), and the snapshot cache with incremental `since` merges.
// Plain TS (no Svelte) so it is unit-testable; storage and fetch are injectable.
import type { PersonId } from '#lib/types.ts';
import type { EventReply, EventType, SnapshotReply, SnapshotRows, WhoamiReply } from '#lib/ingest/sheet-api.ts';
import { emptyRows, maxAt, mergeRows } from '#lib/model/snapshot.ts';
import type { DemoCalendar } from '#lib/model/state.ts';

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

/** False when the build had no VITE_GAS_URL: the app shows its "not set up yet" screen (demo still works). */
export const GAS_CONFIGURED = GAS_URL.trim() !== '';

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
  /** Demo only: the sender when it isn't `me` (the demo's two players share one event list across tabs). */
  person?: PersonId;
  /** An edit of a week that locks (server-clock ms): rows stamped at or after it are refused (round 7 M1). */
  lockAt?: number;
}

export function newId(): string {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

export const queued = (): QueuedEvent[] => read<QueuedEvent[]>(KEYS.queue) ?? [];
const saveQueue = (q: QueuedEvent[]) => write(KEYS.queue, q);

/** `holdMs`: not sent before then (an undo window); it still shows in the optimistic view at once. */
export function enqueue(type: EventType, data: Record<string, unknown>, now = Date.now(), holdMs = 0, lockAt?: number): QueuedEvent {
  const ev: QueuedEvent = { id: newId(), type, data, queuedAt: now, tries: 0, nextAt: now + holdMs, ...(lockAt === undefined ? {} : { lockAt }) };
  saveQueue([...queued(), ev]);
  return ev;
}

/** Undo: drop a queued event that has not been sent yet. False if it already went out. */
export function unqueue(id: string): boolean {
  const q = queued();
  if (!q.some((x) => x.id === id) || flushingId === id) return false;
  saveQueue(q.filter((x) => x.id !== id));
  return true;
}

/** Move a still-held event's send time (the undo banner was paused or resumed). False once it was tried or sent. */
export function holdEvent(id: string, until: number): boolean {
  const q = queued();
  const ev = q.find((x) => x.id === id);
  if (!ev || ev.tries > 0 || flushingId === id) return false;
  saveQueue(q.map((x) => (x.id === id ? { ...x, nextAt: until } : x)));
  return true;
}

/** 1 s, 2 s, 4 s … capped at 5 min, ±20 % jitter. */
export function backoffMs(tries: number, rand = Math.random): number {
  const base = Math.min(300_000, 1000 * 2 ** Math.max(0, tries - 1));
  return Math.round(base * (0.8 + 0.4 * rand()));
}

/**
 * `acked`: the events the server confirmed in this flush (not merely ones that left the queue, e.g. by undo).
 * `expired`: edits dropped unsent because their week locked while they waited (offline, round 7 M1).
 */
export interface FlushResult { sent: number; acked: QueuedEvent[]; dropped: QueuedEvent[]; expired: QueuedEvent[]; remaining: number; error?: GasError }

let flushing: Promise<FlushResult> | null = null;
/** The event currently in flight (it can't be undone any more). */
let flushingId: string | null = null;

/** Still inside its undo window (never tried yet, not due): later events may pass it (review r2 N3). */
const isHeld = (ev: QueuedEvent, now: number): boolean => ev.tries === 0 && ev.nextAt > now;

/**
 * What an event changes, for ordering: a later event on the same thing (a habit tick of the same day, the same
 * workout, metric, spend or month) never passes a held one, so the server keeps the order the screen showed
 * (round 7 M2). Null: nothing else touches it.
 */
export function subjectOf(ev: Pick<QueuedEvent, 'type' | 'data'>): string | null {
  const d = ev.data;
  switch (ev.type) {
    case 'checkin': return `checkin|${String(d.date)}|${String(d.habit ?? d.habitKey)}`;
    case 'metric_set': return `metric|${String(d.date)}|${String(d.metric)}`;
    case 'workout_edit': return `workout|${String(d.id)}`;
    case 'confirm': return `${d.kind === 'workout' ? 'workout' : 'visit'}|${String(d.id)}`;
    case 'spend_void': case 'approve': return `spend|${String(d.spendId)}`;
    case 'transfer': case 'transfer_undo': return `transfer|${String(d.month)}`;
    default: return null;
  }
}

/**
 * The queue in send order at `now`: the events that may go now, then whether a due-later (backed-off) event blocks
 * the rest. Held events are skipped (with every later event on the same subject); a backed-off one stops the scan.
 */
function due(q: QueuedEvent[], now: number, skip: (ev: QueuedEvent) => boolean = () => false): { ev: QueuedEvent | null; wake: number | null } {
  const heldSubjects = new Set<string>();
  let wake: number | null = null;
  for (const ev of q) {
    if (skip(ev)) continue;
    const subj = subjectOf(ev);
    if (isHeld(ev, now)) {
      wake = wake === null ? ev.nextAt : Math.min(wake, ev.nextAt);
      if (subj) heldSubjects.add(subj);
      continue;
    }
    if (subj && heldSubjects.has(subj)) continue; // waits for the held one (it wakes the queue)
    if (ev.nextAt > now) return { ev: null, wake: wake === null ? ev.nextAt : Math.min(wake, ev.nextAt) };
    return { ev, wake: ev.nextAt };
  }
  return { ev: null, wake };
}

/**
 * Send queued events in order until one fails. Events still in their undo window are skipped, not waited for
 * (a held payday must not delay a check-in behind it by 5 s), except by later events on the same subject (M2);
 * everything else keeps queue order. Acked (`{ok}` or `{ok, duplicate}`) → removed. `bad_request` /
 * `too_large` can never succeed → dropped (reported). Transient errors keep the event (and everything after it,
 * so order is preserved) with a backoff. `unauthorized` stops the flush. `expired(ev, t)`: an edit that can no
 * longer land before its lock → dropped unsent (reported).
 */
export function flush(now: () => number = Date.now, expired: (ev: QueuedEvent, t: number) => boolean = () => false): Promise<FlushResult> {
  if (flushing) return flushing;
  const p = (async (): Promise<FlushResult> => {
    let sent = 0;
    const acked: QueuedEvent[] = [];
    const dropped: QueuedEvent[] = [];
    const late: QueuedEvent[] = [];
    let error: GasError | undefined;
    const tried = new Set<string>();
    for (;;) {
      const t = now();
      const { ev } = due(queued(), t, (x) => tried.has(x.id));
      if (!ev) break;
      tried.add(ev.id);
      if (expired(ev, t)) {
        late.push(ev);
        saveQueue(queued().filter((x) => x.id !== ev.id));
        continue;
      }
      flushingId = ev.id;
      const r = await post<Extract<EventReply, { ok: true }>>('event', { id: ev.id, type: ev.type, data: ev.data });
      flushingId = null;
      const cur = queued();
      if (r.ok) {
        sent++;
        acked.push(ev);
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
    return { sent, acked, dropped, expired: late, remaining: queued().length, error };
  })();
  flushing = p;
  void p.then(() => {
    if (flushing === p) flushing = null;
  });
  return p;
}

/** When the flush can next make progress (ms): the earliest held event or the first blocking one; null if empty. */
export function nextRetryAt(now = Date.now()): number | null {
  return due(queued(), now).wake;
}

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
  /** Demo only (never persisted): the demo's calendar, and queued events may name their sender (`person`). */
  demo?: DemoCalendar;
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

let fetching: Promise<GasResult<{ cache: SnapshotCache }>> | null = null;

/**
 * Fetch rows since the last seen `at` (everything on first run), merge and persist. Overlapping callers share the
 * request in flight, so two replies never merge from the same stale cache (review r2 N2).
 */
export function refreshSnapshot(clientNow: () => number = Date.now): Promise<GasResult<{ cache: SnapshotCache }>> {
  if (fetching) return fetching;
  const p = fetchSnapshot(clientNow);
  fetching = p;
  void p.then(() => {
    if (fetching === p) fetching = null;
  });
  return p;
}

async function fetchSnapshot(clientNow: () => number): Promise<GasResult<{ cache: SnapshotCache }>> {
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
