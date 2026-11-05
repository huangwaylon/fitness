// The write queue (docs/backend.md#write-queue): events persisted in localStorage and replayed in order, with backoff,
// until the server acks them. Undo windows (`holdMs`) are decided here.
import type { EventType } from '#lib/contract/api.ts';
import type { Who } from '#lib/types.ts';
import { LIVE, getKey, localKV, readJson, remove, writeJson } from './storage.ts';
import { post, type ApiError } from './transport.ts';
import { count, log } from './log.ts';

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
  person?: Who;
  /** Client time the server acked it (ms): set once it left the queue for `ackedEvents()`. */
  ackedAt?: number;
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

/** Pairing as someone else: their unsent events are not mine to send (nor their acked ones mine to show). */
export function clearQueue(): void {
  unsaved = null;
  unsavedAcked = null;
  remove(localKV(), LIVE.queue);
  remove(localKV(), LIVE.acked);
}

/**
 * Events the server acked whose rows the snapshot cache doesn't have yet. Persisted next to the queue, so a cold
 * open paints everything the user did before any fetch: without it, a tap acked just before the app was closed
 * vanished from the screen until the next snapshot brought its row back. The store drops each one once the cache
 * holds its id (`keepAcked`).
 */
let unsavedAcked: QueuedEvent[] | null = null;

export function ackedEvents(): QueuedEvent[] {
  if (unsavedAcked) return unsavedAcked;
  const q = readJson<unknown>(localKV(), LIVE.acked);
  return Array.isArray(q) ? q.filter(isEvent) : [];
}

export function keepAcked(list: QueuedEvent[]): void {
  if (!list.length) {
    unsavedAcked = null;
    remove(localKV(), LIVE.acked);
    return;
  }
  unsavedAcked = writeJson(localKV(), LIVE.acked, list) ? null : list;
}

/** `holdMs`: not sent before then (an undo window); it still shows in the optimistic view at once. */
export function enqueue(type: EventType, data: Record<string, unknown>, now = Date.now(), holdMs = 0): QueuedEvent {
  const ev: QueuedEvent = { id: newId(), type, data, queuedAt: now, tries: 0, nextAt: now + holdMs };
  saveQueue([...queued(), ev]);
  count(`ev:${type}`);
  return ev;
}

/** Several events at once (one write of the queue). */
export function enqueueAll(events: readonly { type: EventType; data: Record<string, unknown> }[], now = Date.now()): QueuedEvent[] {
  const evs = events.map(({ type, data }): QueuedEvent => ({ id: newId(), type, data, queuedAt: now, tries: 0, nextAt: now }));
  if (!evs.length) return evs;
  saveQueue([...queued(), ...evs]);
  for (const e of evs) count(`ev:${e.type}`);
  return evs;
}

/** Undo: drop a queued event that has not been sent yet. False if it already went out. */
export function unqueue(id: string): boolean {
  const q = queued();
  if (!q.some((x) => x.id === id) || flushingIds.has(id)) return false;
  saveQueue(q.filter((x) => x.id !== id));
  return true;
}

/** Move a still-held event's send time (the undo banner was paused or resumed). False once it was tried or sent. */
export function holdEvent(id: string, until: number): boolean {
  const q = queued();
  const ev = q.find((x) => x.id === id);
  if (!ev || ev.tries > 0 || flushingIds.has(id)) return false;
  saveQueue(q.map((x) => (x.id === id ? { ...x, nextAt: until } : x)));
  return true;
}

/**
 * The connection is back (the `online` event) or the user asked to sync: events waiting out a backoff go again now.
 * Without it a queue that backed off to minutes while offline sat out the rest of its wait with the network up (and
 * the sync pill gone, since the snapshot succeeds). Held events (undo
 * windows) keep their time.
 */
export function retryNow(now = Date.now()): void {
  const q = queued();
  if (!q.some((x) => x.tries > 0 && x.nextAt > now)) return;
  saveQueue(q.map((x) => (x.tries > 0 && x.nextAt > now ? { ...x, nextAt: now } : x)));
}

/** 1 s, 2 s, 4 s … capped at 5 min, ±20 % jitter. */
export function backoffMs(tries: number, rand = Math.random): number {
  const base = Math.min(300_000, 1000 * 2 ** Math.max(0, tries - 1));
  return Math.round(base * (0.8 + 0.4 * rand()));
}

/**
 * `acked`: the events the server confirmed in this flush (not merely ones that left the queue, e.g. by undo);
 * `stored`: those the record wrote a row for just now, with its `at` (the row the next snapshot would bring).
 */
interface FlushResult { sent: number; acked: QueuedEvent[]; stored: { ev: QueuedEvent; at: string }[]; dropped: QueuedEvent[]; remaining: number; error?: ApiError }

/** At most this many events in one request to the record (its EVENTS_MAX). */
const BATCH_MAX = 50;
/** One event's answer in an `events` reply. */
type EventResult = { id: string | null; ok: true; duplicate?: true; at?: string } | { id: string | null; ok: false; error: ApiError; detail?: string };

let flushing: Promise<FlushResult> | null = null;
/** The events currently in flight (they can't be undone any more). */
const flushingIds = new Set<string>();

/** Still inside its undo window (never tried yet, not due): later events may pass it. */
const isHeld = (ev: QueuedEvent, now: number): boolean => ev.tries === 0 && ev.nextAt > now;

/**
 * What an event changes, for ordering: a later event on the same spend never passes a held one, so the server keeps
 * the order the screen showed (a `spend_void` stamped before its `spend` would be ignored on read); nor does a sell or
 * a buy pass a held tally, sell or buy (the shop: the record checks a sell against the tallies it holds and a buy
 * against the sells, contract/shop.ts), nor a `tally_back` (the record takes one only while the day's tally covers it:
 * a catch given back after a reload, its tally still held). Null: nothing else touches it.
 */
function subjectOf(ev: Pick<QueuedEvent, 'type' | 'data'>): string | null {
  if (ev.type === 'tally' || ev.type === 'tally_back' || ev.type === 'sell' || ev.type === 'buy') return 'shop';
  return ev.type === 'spend' || ev.type === 'spend_void' ? `spend|${String(ev.data.spendId)}` : null;
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
 * (a held buy must not delay a goal behind it by 5 s), except by later events on the same subject;
 * everything else keeps queue order. Acked (`{ok}` or `{ok, duplicate}`) → removed. `bad_request` /
 * `too_large` / `forbidden` can never succeed → dropped (reported). Transient errors keep the event (and everything after it,
 * so order is preserved) with a backoff. `unauthorized` stops the flush.
 */
export function flush(now: () => number = Date.now): Promise<FlushResult> {
  if (flushing) return flushing;
  const p = (async (): Promise<FlushResult> => {
    const out: FlushResult = { sent: 0, acked: [], stored: [], dropped: [], remaining: 0 };
    const tried = new Set<string>();
    const ack = (ev: QueuedEvent, at?: string) => {
      out.sent++;
      out.acked.push(ev);
      if (at) out.stored.push({ ev, at });
      // into the acked list before it leaves the queue: closing the app between the two never loses it
      keepAcked([...ackedEvents().filter((x) => x.id !== ev.id), { ...ev, ackedAt: now() }]);
      saveQueue(queued().filter((x) => x.id !== ev.id));
    };
    const drop = (ev: QueuedEvent, error: ApiError) => {
      log('queue.drop', { type: ev.type, err: error, tries: ev.tries + 1 }, 3);
      out.dropped.push(ev);
      saveQueue(queued().filter((x) => x.id !== ev.id));
    };
    const backOff = (ev: QueuedEvent, error: ApiError) => {
      out.error = error;
      if (error === 'unauthorized') return;
      const tries = ev.tries + 1;
      // the first and every fifth (offline, it retries for as long as it takes)
      if (tries === 1 || tries % 5 === 0) log('queue.retry', { type: ev.type, err: error, tries, n: queued().length }, 2);
      saveQueue(queued().map((x) => (x.id === ev.id ? { ...x, tries, nextAt: now() + backoffMs(tries) } : x)));
    };
    for (;;) {
      // what may go now, in send order: the record takes up to BATCH_MAX at once, in order
      const batch: QueuedEvent[] = [];
      while (batch.length < BATCH_MAX) {
        const { ev } = due(queued(), now(), (x) => tried.has(x.id));
        if (!ev) break;
        tried.add(ev.id);
        batch.push(ev);
      }
      if (!batch.length) break;
      for (const ev of batch) flushingIds.add(ev.id);
      const key = getKey();
      const body = (ev: QueuedEvent) => ({ id: ev.id, type: ev.type, data: ev.data });
      const r = await post<{ results: EventResult[] }>('events', { events: batch.map(body) });
      flushingIds.clear();
      // Paired as someone else meanwhile (setKey cleared the queue): the reply is the old person's, not ours to show.
      if (getKey() !== key) break;
      if (!r.ok) {
        // a whole batch refused (its body, never one event's: those are answered by id) is tried again later
        backOff(batch[0], r.error === 'bad_request' || r.error === 'too_large' || r.error === 'forbidden' ? 'unavailable' : r.error);
        break;
      }
      const results: EventResult[] = Array.isArray(r.results) ? r.results : [];
      let stop = false;
      for (const [i, ev] of batch.entries()) {
        const x = results[i];
        if (x?.ok) ack(ev, x.at);
        // (`forbidden`: the guest's phone asked for what only a member may: never again)
        else if (x && (x.error === 'bad_request' || x.error === 'too_large' || x.error === 'forbidden')) drop(ev, x.error);
        else {
          // it and the rest wait (in order): the record already has any of them it took, and acks a repeat as a duplicate
          backOff(ev, x?.error ?? 'unavailable');
          stop = true;
          break;
        }
      }
      if (stop) break;
    }
    out.remaining = queued().length;
    return out;
  })();
  flushing = p;
  // cleared however it settles: a throw (storage) must not wedge every later flush
  void p.finally(() => {
    if (flushing === p) flushing = null;
  }).catch(() => {});
  return p;
}

/** When the flush can next make progress (ms): the earliest held event or the first blocking one; null if empty. */
export function nextRetryAt(now = Date.now()): number | null {
  return due(queued(), now).wake;
}
