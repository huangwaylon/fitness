// The write queue (sheets-architecture.md §2): events persisted in localStorage and replayed in order, with backoff,
// until the server acks them. Undo windows (`holdMs`) and week locks (round 7 M1/M2) are decided here.
import type { EventReply, EventType } from '#lib/contract/api.ts';
import type { PersonId } from '#lib/types.ts';
import { LIVE, localKV, readJson, remove, writeJson } from './storage.ts';
import { post, type GasError } from './transport.ts';

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

/**
 * The queue as last saved, while storage refuses it (full, private mode): the taps still go out while the app is
 * open, they just don't survive a reload (the store says so). Null when storage holds the queue.
 */
let unsaved: QueuedEvent[] | null = null;

const isEvent = (x: unknown): x is QueuedEvent => !!x && typeof (x as QueuedEvent).id === 'string' && typeof (x as QueuedEvent).type === 'string';

export function queued(): QueuedEvent[] {
  if (unsaved) return unsaved;
  const q = readJson<unknown>(localKV(), LIVE.queue);
  return Array.isArray(q) ? q.filter(isEvent) : [];
}

function saveQueue(q: QueuedEvent[]): void {
  unsaved = writeJson(localKV(), LIVE.queue, q) ? null : q;
}

/** Pairing as someone else: their unsent events are not mine to send. */
export function clearQueue(): void {
  unsaved = null;
  remove(localKV(), LIVE.queue);
}

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
function subjectOf(ev: Pick<QueuedEvent, 'type' | 'data'>): string | null {
  const d = ev.data;
  switch (ev.type) {
    case 'checkin': return `checkin|${String(d.date)}|${String(d.habit)}`;
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
