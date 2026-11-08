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
import { DEMO, LIVE, localKV, readJson } from '#lib/sync/storage.ts';
import { Synced } from './synced.svelte.ts';
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

class TentRoom extends Synced<TentEntry, TentOp, TentNews> {
  protected readonly whos: readonly Who[] = ['A', 'B', 'G'];
  protected readonly label = 'tent';
  /** Which home's room: `t` the tent's (ウェイ's), `u` うめ's, `v` the guest's. */
  readonly sc: RoomSc;
  constructor(sc: RoomSc = 't') {
    super();
    this.sc = sc;
  }
  #layout: ReturnType<typeof tentLayout> = { pieces: [], wall: null, floor: null, lights: true };
  /** Where my changes go to the sheet (store/actions.ts sendDecor: the same event type, scoped). */
  sink: ((op: TentOp) => void) | null = null;

  protected key(): string {
    const k = this.demo ? DEMO.tent : LIVE.tent;
    return this.sc === 't' ? k : `${k}.${this.sc}`;
  }
  protected opOf(d: Record<string, unknown>): TentOp | null {
    const op = tentOpOf(d);
    return op && op.sc === this.sc ? op : null;
  }
  protected put(e: TentEntry): boolean {
    return mergeTent(this.map, e);
  }
  protected rebuild(): void {
    this.#layout = tentLayout(this.map.values());
  }
  /** Another tab's ops in storage merged into mine (commutative): true when any was news. */
  #fold(kept: unknown): boolean {
    let more = false;
    if (Array.isArray(kept)) for (const k of kept) if (this.merge(k)) more = true;
    return more;
  }
  protected commit(): void {
    // a second tab of the app keeps the same copy: its ops merged in before mine are written, never written over
    this.#fold(readJson<unknown[]>(localKV(), this.key()));
    super.commit();
  }
  protected attached(): void {
    this.listen((text) => {
      try {
        if (this.#fold(JSON.parse(text))) this.commit();
      } catch {
        /* not ours */
      }
    });
  }

  #room() {
    void this.rev;
    this.load();
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
    this.load();
    let at = 0;
    for (const e of this.map.values()) if (e.id !== TENT_ROOM && e.at > at) at = e.at;
    return at;
  }
  /** How many more pieces fit. */
  get room(): number {
    return TENT_MAX - this.pieces.length;
  }
  /** A piece's (or a surface's) own entry: its place, never its light's switch (that's `<id>/l`: contract/tent.ts tentKey). */
  #own(id: string): Exclude<TentEntry, { lt: 0 | 1 }> | undefined {
    return this.map.get(id) as Exclude<TentEntry, { lt: 0 | 1 }> | undefined;
  }
  byId(id: string): TentPiece | undefined {
    return this.pieces.find((p) => p.id === id);
  }

  protected heard(m: Relayed): void {
    if (m.kind !== 'decor' || m.sc !== this.sc) return;
    this.load();
    const { v: _v, t, kind: _k, ...d } = m;
    const was = this.byId(m.id) ?? null;
    const e = this.merge(d);
    if (!e) return;
    this.commit();
    if (m.who === this.me) return;
    this.tell({ e, was, live: world.now() - t < LIVE_MS });
  }

  #mine(op: TentOp): TentEntry | null {
    this.load();
    const e = { ...op, who: this.me ?? 'A' } as TentEntry;
    if (!mergeTent(this.map, e)) return null;
    this.commit();
    this.send(op);
    this.sink?.(op);
    return e;
  }

  /** Place or move a piece (its whole state): false when it didn't take (a new piece past the cap, a removed one). */
  set(p: { id: string; item: string; x: number; z: number; f: TentPiece['f']; p?: number; on?: string; l?: 0 | 1 }): boolean {
    const known = this.#own(p.id);
    if (known?.rm) return false;
    if (!known && this.room <= 0) return false;
    const at = this.now(known?.at);
    return !!this.#mine({ sc: this.sc, id: p.id, at, item: p.item, x: p.x, z: p.z, f: p.f, p: p.p ?? (known && !known.rm ? known.p : at), ...(p.on ? { on: p.on } : {}),
      // a light keeps its switch through a move: its own op's once it has one (the move says nothing of it), else the
      // piece's own `l` (unless the move says otherwise)
      ...this.#lightOf(p.id, p.l, known) });
  }

  /** What a move of piece `id` says of its light: nothing once its switch is an op of its own (`<id>/l`), else `l`
   *  asked for or the piece's own. */
  #lightOf(id: string, l: 0 | 1 | undefined, known: Exclude<TentEntry, { lt: 0 | 1 }> | undefined): { l?: 0 | 1 } {
    if (this.map.has(`${id}/l`) && l === undefined) return {};
    const own = l ?? (known && !known.rm ? known.l : undefined);
    return own !== undefined ? { l: own } : {};
  }

  /** Take a piece away (final: an undo puts a new one down). */
  remove(id: string): boolean {
    const known = this.#own(id);
    if (!this.byId(id) || !known) return false;
    return !!this.#mine({ sc: this.sc, id, at: this.now(known.at), rm: true });
  }

  /** The wallpaper or the floor. */
  surface(kind: 'wall' | 'floor', code: string): boolean {
    const id = kind === 'wall' ? TENT_WALL : TENT_FLOOR;
    const known = this.#own(id);
    if (known && !known.rm && known.item === code) return false;
    const at = this.now(known?.at);
    return !!this.#mine({ sc: this.sc, id, at, item: code, x: 0, z: 0, f: 0, p: known && !known.rm ? known.p : at });
  }

  /** A light's switch (a lamp, the lantern, the fireplace): its own op (contract/tent.ts `lt`, 2026-11-05), never the
   *  piece's place, so a move the partner made meanwhile and this switch both stand (as a whole-state op it was one or
   *  the other: last writer wins per id). False when it's already so, or the piece isn't here. */
  switchLight(id: string, on: boolean): boolean {
    const p = this.byId(id), known = this.#own(id);
    if (!p || !known || known.rm || (p.l ?? 1) === (on ? 1 : 0)) return false;
    const sw = this.map.get(`${id}/l`);
    return !!this.#mine({ sc: this.sc, id, at: this.now(sw?.at), lt: on ? 1 : 0 });
  }
  /** NH's room light switch. */
  switchRoom(on: boolean): boolean {
    if (this.lights === on) return false;
    const known = this.#own(TENT_ROOM);
    const at = this.now(known?.at);
    return !!this.#mine({ sc: this.sc, id: TENT_ROOM, at, item: on ? 'r1' : 'r0', x: 0, z: 0, f: 0, p: known && !known.rm ? known.p : at });
  }

  protected cleared(): void {
    this.#layout = { pieces: [], wall: null, floor: null, lights: true };
  }
}

/** The tent's room: one per phone. */
export const tent = new TentRoom('t');
/** Each home's room by its owner: ウェイ's the tent's, うめ's house's (`u`), the guest's (`v`). */
export const rooms: Readonly<Record<Who, TentRoom>> = { A: tent, B: new TentRoom('u'), G: new TentRoom('v') };
