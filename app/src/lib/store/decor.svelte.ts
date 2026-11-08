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
import type { Relayed, Who } from '#lib/contract/live-protocol.ts';
import { DEMO, LIVE } from '#lib/sync/storage.ts';
import { Synced } from './synced.svelte.ts';
import { world } from './world.svelte.ts';

/** A partner's change this recent is played as it happens. */
const LIVE_MS = 12_000;

interface DecorNews {
  e: DecorEntry;
  /** What it was before (null: new). */
  was: Placed | null;
  live: boolean;
}

class Decorations extends Synced<DecorEntry, DecorOp, DecorNews> {
  protected readonly whos: readonly Who[] = ['A', 'B'];
  protected readonly label = 'decor';
  #items: Placed[] = [];
  /** Where my changes go to the sheet (store/actions.ts sendDecor). */
  sink: ((op: DecorOp) => void) | null = null;

  protected key(): string {
    return this.demo ? DEMO.decor : LIVE.decor;
  }
  protected opOf(d: Record<string, unknown>): DecorOp | null {
    return decorOpOf(d);
  }
  protected put(e: DecorEntry): boolean {
    return mergeDecor(this.map, e);
  }
  protected rebuild(): void {
    this.#items = decorLayout(this.map.values());
  }

  /** The layout: every item on the island (≤ DECOR_MAX), the first placed first. */
  get items(): readonly Placed[] {
    void this.rev;
    this.load();
    return this.#items;
  }
  /** How many more fit. */
  get room(): number {
    return DECOR_MAX - this.items.length;
  }
  byId(id: string): Placed | undefined {
    return this.items.find((p) => p.id === id);
  }

  protected heard(m: Relayed): void {
    if (m.kind !== 'decor') return;
    this.load();
    const { v: _v, t, kind: _k, ...d } = m;
    const was = this.byId(m.id) ?? null;
    const e = this.merge(d);
    if (!e) return;
    this.commit();
    if (m.who === this.me) return;
    this.tell({ e, was, live: world.now() - t < LIVE_MS });
  }

  #mine(op: DecorOp): DecorEntry | null {
    this.load();
    const e = { ...op, who: this.me ?? 'A' } as DecorEntry;
    if (!mergeDecor(this.map, e)) return null;
    this.commit();
    // to the relay first (the partner sees it at once), then the sheet's queue (the record)
    this.send(op);
    this.sink?.(op);
    return e;
  }

  /** Place or move an item (its whole state): false when it didn't take (a new item past the cap). */
  set(p: { id: string; item: Placed['item']; x: number; z: number; f: Placed['f']; p?: number }): boolean {
    const known = this.map.get(p.id);
    if (known?.rm) return false;
    if (!known && this.room <= 0) return false;
    const at = this.now(known?.at);
    return !!this.#mine({ id: p.id, at, item: p.item, x: p.x, z: p.z, f: p.f, p: p.p ?? (known && !known.rm ? known.p : at) });
  }

  /** Take an item away (final: an undo puts a new one down). */
  remove(id: string): boolean {
    const known = this.map.get(id);
    if (!this.byId(id) || !known) return false;
    return !!this.#mine({ id, at: this.now(known.at), rm: true });
  }

  protected cleared(): void {
    this.#items = [];
  }
}

/** The island's decorations: one per phone. */
export const decor = new Decorations();
