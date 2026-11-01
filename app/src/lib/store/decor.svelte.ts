// The island's decorations on this phone (docs/design.md "Decorating", docs/decisions.md "Decor is a last-writer-wins
// map"): each item's winning op (contract/decor.ts), merged from my own changes as I make them, the partner's over the
// relay (live, or the day's replay when this phone opens), and the sheet's `decor` rows (the model's, queued ones
// included). The merge is commutative, so the order they come in doesn't matter: both phones show the same layout.
// Kept in localStorage, so a reload shows the island as it was before the sheet answers.
//   decor.attach(relay, me, demo)   the relay in use and who I am
//   decor.items                     the layout (reactive)
//   decor.set(p) / decor.remove(id) a change of mine: merged, kept, sent (the relay now, the sheet's queue)
//   decor.on(fn)                    the partner's changes as they arrive (`live`: it just happened)
import { DECOR_MAX, decorLayout, decorOpOf, mergeDecor, type DecorEntry, type DecorOp, type Placed } from '#lib/contract/decor.ts';
import type { Relayed, Who } from '#lib/sync/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { world } from './world.svelte.ts';

/** A partner's change this recent is played as it happens. */
const LIVE_MS = 12_000;

interface DecorNews {
  e: DecorEntry;
  /** What it was before (null: new). */
  was: Placed | null;
  live: boolean;
}

class Decorations {
  /** Bumped at every change. */
  rev = $state(0);
  #map = new Map<string, DecorEntry>();
  #items: Placed[] = [];
  #loaded = false;
  #relay: Live | null = null;
  #off: (() => void) | null = null;
  #me: Who | null = null;
  #demo = false;
  #last = 0;
  #subs = new Set<(n: DecorNews) => void>();
  /** Where my changes go to the sheet (store/actions.ts sendDecor). */
  sink: ((op: DecorOp) => void) | null = null;

  #key(): string {
    return this.#demo ? DEMO.decor : LIVE.decor;
  }
  #load(): void {
    if (this.#loaded) return;
    this.#loaded = true;
    const kept = readJson<unknown[]>(localKV(), this.#key());
    if (Array.isArray(kept)) for (const k of kept) this.#merge(k);
    this.#items = decorLayout(this.#map.values());
  }
  #merge(raw: unknown): DecorEntry | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const r = raw as Record<string, unknown>;
    if (r.who !== 'A' && r.who !== 'B') return null;
    const { who, ...d } = r;
    const op = decorOpOf(d);
    if (!op) return null;
    const e = { ...op, who } as DecorEntry;
    return mergeDecor(this.#map, e) ? e : null;
  }
  #changed(): void {
    this.#items = decorLayout(this.#map.values());
    writeJson(localKV(), this.#key(), [...this.#map.values()]);
    this.rev++;
  }

  /** The layout: every item on the island (≤ DECOR_MAX), the first placed first. */
  get items(): readonly Placed[] {
    void this.rev;
    this.#load();
    return this.#items;
  }
  /** How many more fit. */
  get room(): number {
    return DECOR_MAX - this.items.length;
  }
  byId(id: string): Placed | undefined {
    return this.items.find((p) => p.id === id);
  }

  /** Use `relay` (null: none) as `me`; `demo`: the demo's own record. */
  attach(relay: Live | null, me: Who | null, demo = false): void {
    if (relay === this.#relay && me === this.#me && demo === this.#demo) return;
    this.#off?.();
    this.#off = null;
    if (demo !== this.#demo) {
      this.#map.clear();
      this.#loaded = false;
    }
    this.#relay = relay;
    this.#me = me;
    this.#demo = demo;
    if (relay) this.#off = relay.on((m) => this.#heard(m));
    this.rev++;
  }

  /** The sheet's ops (the model's `decor` rows, queued ones included). */
  rows(rows: readonly DecorEntry[]): void {
    this.#load();
    let any = false;
    for (const r of rows) if (this.#merge(r)) any = true;
    if (any) this.#changed();
  }

  #heard(m: Relayed): void {
    if (m.kind !== 'decor') return;
    this.#load();
    const { v: _v, t, kind: _k, ...d } = m;
    const was = this.byId(m.id) ?? null;
    const e = this.#merge(d);
    if (!e) return;
    this.#changed();
    if (m.who === this.#me) return;
    const n: DecorNews = { e, was, live: world.now() - t < LIVE_MS };
    for (const f of this.#subs) {
      try {
        f(n);
      } catch (err) {
        console.error('decor:', err);
      }
    }
  }

  /** The time of a change of mine: the relay's clock, never twice the same, and after the op it changes (a clock
   *  behind the one that wrote it still makes my move the later one: what I saw, I replace). */
  #now(after = 0): number {
    this.#last = Math.max(Math.round(world.now()), this.#last + 1, after + 1);
    return this.#last;
  }

  #mine(op: DecorOp): DecorEntry | null {
    this.#load();
    const e = { ...op, who: this.#me ?? 'A' } as DecorEntry;
    if (!mergeDecor(this.#map, e)) return null;
    this.#changed();
    // to the relay first (the partner sees it at once), then the sheet's queue (the record)
    this.#relay?.send({ kind: 'decor', ...op } as never);
    this.sink?.(op);
    return e;
  }

  /** Place or move an item (its whole state): false when it didn't take (a new item past the cap). */
  set(p: { id: string; item: Placed['item']; x: number; z: number; f: Placed['f']; p?: number }): boolean {
    const known = this.#map.get(p.id);
    if (known?.rm) return false;
    if (!known && this.room <= 0) return false;
    const at = this.#now(known?.at);
    return !!this.#mine({ id: p.id, at, item: p.item, x: p.x, z: p.z, f: p.f, p: p.p ?? (known && !known.rm ? known.p : at) });
  }

  /** Take an item away (final: an undo puts a new one down). */
  remove(id: string): boolean {
    const known = this.#map.get(id);
    if (!this.byId(id) || !known) return false;
    return !!this.#mine({ id, at: this.#now(known.at), rm: true });
  }

  on(fn: (n: DecorNews) => void): () => void {
    this.#subs.add(fn);
    return () => void this.#subs.delete(fn);
  }

  /** Forget everything (tests). */
  reset(): void {
    this.#off?.();
    this.#off = null;
    this.#relay = null;
    this.#me = null;
    this.#map.clear();
    this.#items = [];
    this.#loaded = false;
    this.#last = 0;
    this.#subs.clear();
    this.rev++;
  }
}

/** The island's decorations: one per phone. */
export const decor = new Decorations();
