// The week store's data source (round 9 §2 item 14): the live Apps Script sync or the demo. The store only composes
// and shows; everything that differs between the two lives behind this interface, so no demo branch can reach live
// storage, the queue or the network.
import type { EventType } from '#lib/contract/api.ts';
import type { WeekView } from '#lib/types.ts';
import type { QueuedEvent } from '#lib/sync/queue.ts';
import type { SnapshotCache } from '#lib/sync/cache.ts';
import type { ComposedModel } from './view.ts';

/** A banner held open (hover/focus) keeps its action unsent for at most this long (then both end; round 7 M1). */
export const HOLD_MAX_MS = 2 * 60_000;

export interface SendOptions {
  /** An undo window: shown at once, not sent before then. */
  holdMs?: number;
  /** An edit of a week that locks (server-clock ms): it must reach the server before then (round 7 M1). */
  lockAt?: number;
}

/** A tap's outcome, known at once (the queue retries until the server acks). */
export interface SendResult {
  ok: boolean;
  /** Only with `holdMs`: take the action back while it is still held (returns false once it was sent). */
  undo?: () => boolean;
  /** Only with `holdMs`: keep holding it (`null`: as long as allowed) or send it `ms` from now; returns the ms granted. */
  hold?: (ms: number | null) => number;
}

/** The store's status fields a backend drives, and its recompute. */
export interface Host {
  status: 'loading' | 'ready' | 'error' | 'unconfigured';
  syncing: boolean;
  offline: boolean;
  lastSync: Date | null;
  /** The rows or events changed: recompute the view. */
  changed(): void;
}

export interface Backend {
  /** The rows the view is composed from (null: nothing to show yet). */
  cache(): SnapshotCache | null;
  /** Events applied on top of the rows (oldest first), and which of them are still unsent (only those can miss a lock). */
  events(): { list: QueuedEvent[]; unsent: Set<string> };
  /** Load, then sync. `background` refreshes respect a floor. */
  refresh(opts: { background?: boolean }): Promise<void>;
  send(type: EventType, data: Record<string, unknown>, opts: SendOptions): SendResult;
  /** Forget the cached state (after pairing as someone else). */
  reset(): void;
  /** A last touch to the view (the demo's `?demo=harvest`). */
  decorate?(m: ComposedModel, v: WeekView): void;
}
