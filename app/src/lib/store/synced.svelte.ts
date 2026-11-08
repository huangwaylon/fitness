// What the island's synced last-writer-wins maps share (decor.svelte.ts, tent.svelte.ts, layout.svelte.ts): each
// entry's winning op, merged from the record's rows, the partner's over the relay and mine; kept in localStorage under
// the live or the demo record's key; the relay in use and who I am (attach); my ops' clock (opClock: after the op each
// replaces); the partner's news told to subscribers. Each store brings its op's check and merge and what it builds
// from the map.
import type { Relayed, Who } from '#lib/contract/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { opClock } from './world.svelte.ts';

export abstract class Synced<E extends { who: Who }, O extends object, N> {
  /** Bumped at every change. */
  rev = $state(0);
  protected map = new Map<string, E>();
  protected loaded = false;
  protected relay: Live | null = null;
  protected me: Who | null = null;
  protected demo = false;
  /** My last op's time. */
  protected last = 0;
  #off: (() => void) | null = null;
  #subs = new Set<(n: N) => void>();
  #listening = false;

  /** Who may have written an entry. */
  protected abstract readonly whos: readonly Who[];
  /** The name in a subscriber's error. */
  protected abstract readonly label: string;
  /** The storage key: the demo's or the live record's. */
  protected abstract key(): string;
  /** A stored or heard op, checked (null: not one of this store's). */
  protected abstract opOf(d: Record<string, unknown>): O | null;
  /** Merge an entry into the map: whether it won. */
  protected abstract put(e: E): boolean;
  /** Rebuild what's read from the map. */
  protected abstract rebuild(): void;
  /** A relayed message (any kind). */
  protected abstract heard(m: Relayed): void;

  /** The kept entries, read once. */
  protected load(): void {
    if (this.loaded) return;
    this.loaded = true;
    const kept = readJson<unknown[]>(localKV(), this.key());
    if (Array.isArray(kept)) for (const k of kept) this.merge(k);
    this.rebuild();
  }
  /** A stored or relayed entry merged: the entry when it won, else null (not valid, not new). */
  protected merge(raw: unknown): E | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const { who, ...d } = raw as Record<string, unknown>;
    if (!this.whos.includes(who as Who)) return null;
    const op = this.opOf(d);
    if (!op) return null;
    const e = { ...op, who } as unknown as E;
    return this.put(e) ? e : null;
  }
  /** After a change: rebuilt, kept, bumped. */
  protected commit(): void {
    this.rebuild();
    writeJson(localKV(), this.key(), [...this.map.values()]);
    this.rev++;
  }

  /** The record's rows (the model's, queued ones included). */
  rows(rows: readonly E[]): void {
    this.load();
    let any = false;
    for (const r of rows) if (this.merge(r)) any = true;
    if (any) this.commit();
  }

  /** Use `relay` (null: none) as `me`; `demo`: the demo's own record. */
  attach(relay: Live | null, me: Who | null, demo = false): void {
    if (relay === this.relay && me === this.me && demo === this.demo) return;
    this.#off?.();
    this.#off = null;
    if (demo !== this.demo) {
      this.switching();
      this.map.clear();
      this.loaded = false;
    }
    this.relay = relay;
    this.me = me;
    this.demo = demo;
    if (relay) this.#off = relay.on((m) => this.heard(m));
    this.attached();
    this.rev++;
  }
  /** Before the map is cleared for the other record (the demo's, or back). */
  protected switching(): void {}
  /** After attach, before its bump. */
  protected attached(): void {}

  /** Another tab's writes of this key as they land (the `storage` event: only other tabs' writes fire it), once. */
  protected listen(fold: (text: string) => void): void {
    if (this.#listening || typeof window === 'undefined') return;
    this.#listening = true;
    window.addEventListener('storage', (e) => {
      if (e.key !== this.key() || !this.loaded || !e.newValue) return;
      fold(e.newValue);
    });
  }

  /** The time of a change of mine: the relay's clock, never twice the same, and after the op it changes (a clock
   *  behind the one that wrote it still makes my move the later one: what I saw, I replace). */
  protected now(after = 0): number {
    this.last = opClock(this.last, after);
    return this.last;
  }

  /** My op to the relay (the partner sees it at once). */
  protected send(op: O): void {
    this.relay?.send({ kind: 'decor', ...op } as never);
  }

  /** Tell the subscribers (one's throw never stops the rest). */
  protected tell(n: N): void {
    for (const f of this.#subs) {
      try {
        f(n);
      } catch (err) {
        console.error(`${this.label}:`, err);
      }
    }
  }
  protected get told(): boolean {
    return this.#subs.size > 0;
  }
  on(fn: (n: N) => void): () => void {
    this.#subs.add(fn);
    return () => void this.#subs.delete(fn);
  }

  /** Forget everything (tests). */
  reset(): void {
    this.#off?.();
    this.#off = null;
    this.relay = null;
    this.me = null;
    this.map.clear();
    this.loaded = false;
    this.last = 0;
    this.#subs.clear();
    this.cleared();
    this.rev++;
  }
  /** reset's own part, before its bump. */
  protected cleared(): void {}
}
