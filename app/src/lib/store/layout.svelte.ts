// The island's layout on this phone (docs/island-layout.md): the default with every layout op merged over it (the
// record's rows, the partner's over the relay, mine as I make them; contract/layout.ts's merge is commutative, so
// every phone and the editor reach the same island whatever order the ops come in). Kept in localStorage, so the
// island opens as it was before the record answers. What the scene, the DOM sprites and the editor read.
//   layout.attach(relay, me, demo)   the relay in use and who I am
//   layout.current                   the Layout (reactive: reading it subscribes)
//   layout.pos(id) / layout.obj(id)  where an object stands (u) / the object; layout.ofKind(k)
//   layout.home(who)                 a home's look
//   layout.apply(ops)                changes of mine: merged, kept, sent (the editor's save, the phone's もようがえ)
//   layout.on(fn)                    every change as it lands, with what changed (diff.ts)
import { layoutOpOf, mergeLayout, type LayoutEntry, type LayoutOp } from '#lib/contract/layout.ts';
import { defaultLayout, layoutOf, objMid, type Layout, type Obj } from '#lib/layout/model.ts';
import { diffLayouts, type LayoutDiff } from '#lib/layout/diff.ts';
import { migrationOps } from '#lib/layout/migrate.ts';
import { buildingOps } from '#lib/layout/buildings.ts';
import type { Placed } from '#lib/contract/decor.ts';
import type { HomeStyle } from '#lib/layout/homes.ts';
import type { Relayed, Who } from '#lib/sync/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { world } from './world.svelte.ts';

const LAYOUT_SCOPES: readonly unknown[] = ['o', 'c', 'r', 'h'];

interface LayoutNews {
  diff: LayoutDiff;
  /** Whose change it was (mine included). */
  who: Who;
  /** It arrived over the relay just now (else the record's rows, or my own). */
  live: boolean;
}

class IslandLayout {
  rev = $state(0);
  #map = new Map<string, LayoutEntry>();
  #layout: Layout = defaultLayout();
  #loaded = false;
  #relay: Live | null = null;
  #off: (() => void) | null = null;
  #me: Who | null = null;
  #demo = false;
  #last = 0;
  #subs = new Set<(n: LayoutNews) => void>();
  /** Where my changes go to the record (store/actions.ts sendDecor: the decor event, scoped). */
  sink: ((op: LayoutOp) => void) | null = null;

  #key(): string {
    return this.#demo ? DEMO.layout : LIVE.layout;
  }
  #load(): void {
    if (this.#loaded) return;
    this.#loaded = true;
    const kept = readJson<unknown[]>(localKV(), this.#key());
    if (Array.isArray(kept)) for (const k of kept) this.#merge(k);
    this.#layout = layoutOf(this.#map);
  }
  #merge(raw: unknown): LayoutEntry | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const r = raw as Record<string, unknown>;
    if (r.who !== 'A' && r.who !== 'B' && r.who !== 'G') return null;
    const { who, ...d } = r;
    const op = layoutOpOf(d);
    if (!op) return null;
    const e = { ...op, who } as LayoutEntry;
    return mergeLayout(this.#map, e) ? e : null;
  }
  #changed(who: Who, live: boolean): void {
    const was = this.#layout;
    this.#layout = layoutOf(this.#map);
    writeJson(localKV(), this.#key(), [...this.#map.values()]);
    this.rev++;
    if (!this.#subs.size) return;
    const n: LayoutNews = { diff: diffLayouts(was, this.#layout), who, live };
    for (const f of this.#subs) {
      try {
        f(n);
      } catch (err) {
        console.error('layout:', err);
      }
    }
  }

  /** The island's layout now. */
  get current(): Layout {
    void this.rev;
    this.#load();
    return this.#layout;
  }
  /** The merged ops (the editor's undo base, the record's view). */
  get entries(): readonly LayoutEntry[] {
    void this.rev;
    this.#load();
    return [...this.#map.values()];
  }
  obj(id: string): Obj | undefined {
    return this.current.objects.get(id);
  }
  /** Where an object stands (u: its footprint's middle), or null when it's gone. */
  pos(id: string): [number, number] | null {
    const l = this.current, o = l.objects.get(id);
    return o ? objMid(l, o) : null;
  }
  ofKind(k: string): Obj[] {
    return [...this.current.objects.values()].filter((o) => o.k === k);
  }
  home(who: Who): HomeStyle {
    return this.current.homes[who];
  }

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
    // the e2e's view of the layout this phone holds (dev builds and the demo)
    if (typeof window !== 'undefined' && (import.meta.env.DEV || demo))
      (window as unknown as { __layout?: unknown }).__layout = {
        pos: (id: string) => this.pos(id), obj: (id: string) => this.obj(id), home: (w: Who) => this.home(w), count: (k: string) => this.ofKind(k).length,
        ids: (k: string) => this.ofKind(k).map((o) => o.id)
      };
  }

  /** The record's layout rows (the model's, queued ones included). */
  rows(rows: readonly LayoutEntry[]): void {
    this.#load();
    let any: Who | null = null;
    for (const r of rows) if (this.#merge(r)) any = r.who;
    if (any) this.#changed(any, false);
  }

  #heard(m: Relayed): void {
    if (m.kind !== 'decor' || !LAYOUT_SCOPES.includes(m.sc)) return;
    this.#load();
    const { v: _v, t, kind: _k, ...d } = m;
    if (!this.#merge(d)) return;
    this.#changed(m.who, world.now() - t < 12_000);
  }

  /** The time of a change of mine: the relay's clock, never twice the same, after every op it replaces. */
  #now(after = 0): number {
    this.#last = Math.max(Math.round(world.now()), this.#last + 1, after + 1);
    return this.#last;
  }
  /** A time for a burst of ops (the editor's save): each op one ms after the last. */
  stamp(): number {
    this.#load();
    let after = 0;
    for (const e of this.#map.values()) if (e.at > after) after = e.at;
    return this.#now(after);
  }

  /** Changes of mine (their `at` from stamp(), increasing): merged, kept, sent. The ops that took. */
  apply(ops: readonly LayoutOp[]): LayoutOp[] {
    this.#load();
    const took: LayoutOp[] = [];
    for (const op of ops) {
      const e = { ...op, who: this.#me ?? 'A' } as LayoutEntry;
      if (!mergeLayout(this.#map, e)) continue;
      took.push(op);
      this.#last = Math.max(this.#last, op.at);
    }
    if (!took.length) return took;
    this.#changed(this.#me ?? 'A', false);
    for (const op of took) {
      this.#relay?.send({ kind: 'decor', ...op } as never);
      this.sink?.(op);
    }
    return took;
  }

  /** Move my old decorations (contract/decor.ts's, the old もようがえ's) into the layout, once (layout/migrate.ts):
   *  the island calls it with the decorations as the record has them. How many went over. */
  migrateDecor(placed: readonly Placed[]): number {
    this.#load();
    if (!this.#me) return 0;
    const ops = migrationOps(this.#map, placed, this.#me);
    return ops.length ? this.apply(ops).length : 0;
  }

  /** The default's buildings new to an arranged island (the museum) onto a free spot, once, where theirs is taken
   *  (layout/buildings.ts): their ops, sent as mine; how many. */
  placeBuildings(): number {
    this.#load();
    if (!this.#me) return 0;
    const ops = buildingOps(this.#map, this.#me, this.stamp());
    return ops.length ? this.apply(ops).length : 0;
  }

  on(fn: (n: LayoutNews) => void): () => void {
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
    this.#layout = defaultLayout();
    this.#loaded = false;
    this.#last = 0;
    this.#subs.clear();
    this.rev++;
  }
}

/** The island's layout: one per phone. */
export const layout = new IslandLayout();
