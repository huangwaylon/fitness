// The tent's room on this phone (docs/design.md "The tent", docs/decisions.md "Decor is a last-writer-wins map"): each
// piece's winning op, and the wallpaper's and the floor's (contract/tent.ts), merged from my own changes as I make them,
// the partner's over the relay (live, or the day's replay) and the sheet's tent rows (the model's, queued ones
// included). The merge is commutative, so both phones reach the same room whatever order the ops arrive in. Kept in
// localStorage, so the tent opens as it was before the sheet answers.
//   tent.attach(relay, me, demo)          the relay in use and who I am
//   tent.pieces / tent.wall / tent.floor  the room (reactive)
//   tent.set(p) / tent.remove(id) / tent.surface(kind, code)   a change of mine: merged, kept, sent
//   tent.on(fn)                           the partner's changes as they arrive
// The other homes' rooms are the same (docs/island-layout.md "Homes"): `rooms.B` うめ's house (`sc: 'u'`), `rooms.G`
// the guest's (`v`); `rooms.A` is the tent's.
import { TENT_FLOOR, TENT_MAX, TENT_ROOM, TENT_WALL, mergeTent, tentLayout, tentOpOf, type TentEntry, type TentOp, type TentPiece } from '#lib/contract/tent.ts';
import type { Relayed, Who } from '#lib/contract/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { DEMO, LIVE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
import { world } from './world.svelte.ts';

/** A partner's change this recent is played as it happens. */
const LIVE_MS = 12_000;

interface TentNews {
  e: TentEntry;
  /** The piece before (null: new, or a surface). */
  was: TentPiece | null;
  live: boolean;
}

type RoomSc = 't' | 'u' | 'v';

class TentRoom {
  rev = $state(0);
  /** Which home's room: `t` the tent's (ウェイ's), `u` うめ's, `v` the guest's. */
  readonly sc: RoomSc;
  constructor(sc: RoomSc = 't') {
    this.sc = sc;
  }
  #map = new Map<string, TentEntry>();
  #layout: ReturnType<typeof tentLayout> = { pieces: [], wall: null, floor: null, lights: true };
  #loaded = false;
  #relay: Live | null = null;
  #off: (() => void) | null = null;
  #me: Who | null = null;
  #demo = false;
  #last = 0;
  #subs = new Set<(n: TentNews) => void>();
  /** Where my changes go to the sheet (store/actions.ts sendDecor: the same event type, scoped). */
  sink: ((op: TentOp) => void) | null = null;

  #key(): string {
    const k = this.#demo ? DEMO.tent : LIVE.tent;
    return this.sc === 't' ? k : `${k}.${this.sc}`;
  }
  #load(): void {
    if (this.#loaded) return;
    this.#loaded = true;
    const kept = readJson<unknown[]>(localKV(), this.#key());
    if (Array.isArray(kept)) for (const k of kept) this.#merge(k);
    this.#layout = tentLayout(this.#map.values());
  }
  #merge(raw: unknown): TentEntry | null {
    if (typeof raw !== 'object' || raw === null) return null;
    const r = raw as Record<string, unknown>;
    if (r.who !== 'A' && r.who !== 'B' && r.who !== 'G') return null;
    const { who, ...d } = r;
    const op = tentOpOf(d);
    if (!op || op.sc !== this.sc) return null;
    const e = { ...op, who } as TentEntry;
    return mergeTent(this.#map, e) ? e : null;
  }
  /** Another tab's ops in storage merged into mine (commutative): true when any was news. */
  #fold(kept: unknown): boolean {
    let more = false;
    if (Array.isArray(kept)) for (const k of kept) if (this.#merge(k)) more = true;
    return more;
  }
  #changed(): void {
    // a second tab of the app keeps the same copy: its ops merged in before mine are written, never written over
    this.#fold(readJson<unknown[]>(localKV(), this.#key()));
    this.#layout = tentLayout(this.#map.values());
    writeJson(localKV(), this.#key(), [...this.#map.values()]);
    this.rev++;
  }
  #listening = false;
  /** Another tab's writes, folded in as they land (the `storage` event: only other tabs' writes fire it). */
  #listen(): void {
    if (this.#listening || typeof window === 'undefined') return;
    this.#listening = true;
    window.addEventListener('storage', (e) => {
      if (e.key !== this.#key() || !this.#loaded || !e.newValue) return;
      try {
        if (this.#fold(JSON.parse(e.newValue))) this.#changed();
      } catch {
        /* not ours */
      }
    });
  }

  #room() {
    void this.rev;
    this.#load();
    return this.#layout;
  }
  /** The pieces in the room (≤ TENT_MAX), the first placed first. */
  get pieces(): readonly TentPiece[] {
    return this.#room().pieces;
  }
  /** The wallpaper and the floor (null: the tent's own). */
  get wall(): string | null {
    return this.#room().wall;
  }
  get floor(): string | null {
    return this.#room().floor;
  }
  /** NH's room light switch (on unless switched off). */
  get lights(): boolean {
    return this.#room().lights;
  }
  /** When the room was last changed: its latest op's time, the room's light switch aside (0: never). */
  get changed(): number {
    void this.rev;
    this.#load();
    let at = 0;
    for (const e of this.#map.values()) if (e.id !== TENT_ROOM && e.at > at) at = e.at;
    return at;
  }
  /** How many more pieces fit. */
  get room(): number {
    return TENT_MAX - this.pieces.length;
  }
  byId(id: string): TentPiece | undefined {
    return this.pieces.find((p) => p.id === id);
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
    this.#listen();
    this.rev++;
  }

  /** The sheet's tent ops (the model's, queued ones included). */
  rows(rows: readonly TentEntry[]): void {
    this.#load();
    let any = false;
    for (const r of rows) if (this.#merge(r)) any = true;
    if (any) this.#changed();
  }

  #heard(m: Relayed): void {
    if (m.kind !== 'decor' || m.sc !== this.sc) return;
    this.#load();
    const { v: _v, t, kind: _k, ...d } = m;
    const was = this.byId(m.id) ?? null;
    const e = this.#merge(d);
    if (!e) return;
    this.#changed();
    if (m.who === this.#me) return;
    const n: TentNews = { e, was, live: world.now() - t < LIVE_MS };
    for (const f of this.#subs) {
      try {
        f(n);
      } catch (err) {
        console.error('tent:', err);
      }
    }
  }

  /** The time of a change of mine: the relay's clock, never twice the same, and after the op it changes. */
  #now(after = 0): number {
    this.#last = Math.max(Math.round(world.now()), this.#last + 1, after + 1);
    return this.#last;
  }

  #mine(op: TentOp): TentEntry | null {
    this.#load();
    const e = { ...op, who: this.#me ?? 'A' } as TentEntry;
    if (!mergeTent(this.#map, e)) return null;
    this.#changed();
    this.#relay?.send({ kind: 'decor', ...op } as never);
    this.sink?.(op);
    return e;
  }

  /** Place or move a piece (its whole state): false when it didn't take (a new piece past the cap, a removed one). */
  set(p: { id: string; item: string; x: number; z: number; f: TentPiece['f']; p?: number; on?: string; l?: 0 | 1 }): boolean {
    const known = this.#map.get(p.id);
    if (known?.rm) return false;
    if (!known && this.room <= 0) return false;
    const at = this.#now(known?.at);
    return !!this.#mine({ sc: this.sc, id: p.id, at, item: p.item, x: p.x, z: p.z, f: p.f, p: p.p ?? (known && !known.rm ? known.p : at), ...(p.on ? { on: p.on } : {}),
      // a light keeps its switch through a move (unless the move says otherwise)
      ...((p.l ?? (known && !known.rm ? known.l : undefined)) !== undefined ? { l: (p.l ?? (known as { l?: 0 | 1 }).l)! } : {}) });
  }

  /** Take a piece away (final: an undo puts a new one down). */
  remove(id: string): boolean {
    const known = this.#map.get(id);
    if (!this.byId(id) || !known) return false;
    return !!this.#mine({ sc: this.sc, id, at: this.#now(known.at), rm: true });
  }

  /** The wallpaper or the floor. */
  surface(kind: 'wall' | 'floor', code: string): boolean {
    const id = kind === 'wall' ? TENT_WALL : TENT_FLOOR;
    const known = this.#map.get(id);
    if (known && !known.rm && known.item === code) return false;
    const at = this.#now(known?.at);
    return !!this.#mine({ sc: this.sc, id, at, item: code, x: 0, z: 0, f: 0, p: known && !known.rm ? known.p : at });
  }

  /** A light's switch (a lamp, the lantern, the fireplace): the piece's whole state again, its `l` flipped, stamped just
   *  after the piece's own last op rather than now: an op carries the whole piece (last writer wins per id), so a
   *  switch stamped now beat a move the partner made meanwhile and put the piece back where this phone last saw it;
   *  now that move (later) wins and the switch is the one lost (both phones agree: the light as the move left it). */
  switchLight(id: string, on: boolean): boolean {
    const p = this.byId(id), known = this.#map.get(id);
    if (!p || !known || known.rm) return false;
    return !!this.#mine({ sc: this.sc, id: p.id, at: known.at + 1, item: p.item, x: p.x, z: p.z, f: p.f, p: p.p, ...(p.on ? { on: p.on } : {}), l: on ? 1 : 0 });
  }
  /** NH's room light switch. */
  switchRoom(on: boolean): boolean {
    if (this.lights === on) return false;
    const known = this.#map.get(TENT_ROOM);
    const at = this.#now(known?.at);
    return !!this.#mine({ sc: this.sc, id: TENT_ROOM, at, item: on ? 'r1' : 'r0', x: 0, z: 0, f: 0, p: known && !known.rm ? known.p : at });
  }

  on(fn: (n: TentNews) => void): () => void {
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
    this.#layout = { pieces: [], wall: null, floor: null, lights: true };
    this.#loaded = false;
    this.#last = 0;
    this.#subs.clear();
    this.rev++;
  }
}

/** The tent's room: one per phone. */
export const tent = new TentRoom('t');
/** Each home's room by its owner: ウェイ's the tent's, うめ's house's (`u`), the guest's (`v`). */
export const rooms: Readonly<Record<Who, TentRoom>> = { A: tent, B: new TentRoom('u'), G: new TentRoom('v') };
