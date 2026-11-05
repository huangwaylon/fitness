// A piece moving under a finger, shown live on the partner's phone (docs/design.md "The tent": NH's live furniture
// moving). Presence only: while I hold a piece its spot goes over the relay as a small `drag` (≤ 10 a second, only
// when it changed, again every KEEP_MS while it rests under the finger), and `end` when I let it go (after its `decor`
// op, which is the record). On the partner's phone it's held: lifted where my finger has it, eased between the
// updates, not theirs to pick up; silent for SILENT_MS (or the partner gone) and it drops back where the room has it.
// Plain TS: the relay's send and the clock come in.
import type { Intent, Relayed, Who } from '#lib/contract/live-protocol.ts';
import type { Facing } from './grid.ts';

type Drag = Extract<Intent, { kind: 'drag' }>;
/** At most one update this often (ms). */
export const DRAG_MS = 100;
/** A held piece that hasn't moved says so again this often (ms), so the partner's phone keeps it held. */
export const KEEP_MS = 1000;
/** A partner's held piece unheard this long (ms) goes back to where the room has it. */
export const SILENT_MS = 2000;

export interface Holding {
  id: string;
  item: string;
  /** Not in the room yet (the partner needs its item). */
  fresh: boolean;
  /** Its middle (model units) and facing. */
  x: number;
  z: number;
  f: Facing;
}
export interface HeldThere {
  id: string;
  item: string;
  x: number;
  z: number;
  f: Facing;
  /** When it was last heard (this phone's clock) and when the hold began (the relay's clock). */
  heard: number;
  since: number;
  /** Whose finger (the partner's, the guest's, a member's on the guest's phone). */
  who: Who;
}

export class DragLink {
  #send: (d: Drag) => boolean;
  #now: () => number;
  #mine: Holding | null = null;
  #sent: string | null = null;
  #sentAt = -Infinity;
  #timer: ReturnType<typeof setTimeout> | null = null;
  #theirs = new Map<string, HeldThere>();
  /** When my hold began (the relay's clock: the conflict rule). */
  since = 0;

  constructor(send: (d: Drag) => boolean, now: () => number = () => Date.now()) {
    this.#send = send;
    this.#now = now;
  }

  // ---- mine ----
  /** I hold this piece here (a pick, a move, a turn): sent now or once DRAG_MS has passed since the last. */
  hold(h: Holding, relayNow = this.#now()): void {
    if (!this.#mine || this.#mine.id !== h.id) this.since = relayNow;
    this.#mine = { ...h, x: Math.round(h.x), z: Math.round(h.z) };
    this.#flush();
  }
  #wire(h: Holding, end = false): Drag {
    return { kind: 'drag', id: h.id, x: h.x, z: h.z, f: h.f, ...(h.fresh ? { it: h.item } : {}), ...(end ? { end: true as const } : {}) };
  }
  #flush(): void {
    const h = this.#mine;
    if (!h) return;
    const key = `${h.x},${h.z},${h.f}`, t = this.#now();
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    const wait = key === this.#sent ? KEEP_MS - (t - this.#sentAt) : DRAG_MS - (t - this.#sentAt);
    if (wait > 0) {
      this.#timer = setTimeout(() => this.#flush(), wait);
      return;
    }
    this.#send(this.#wire(h));
    this.#sent = key;
    this.#sentAt = t;
    this.#timer = setTimeout(() => this.#flush(), KEEP_MS);
  }
  /** I let go (placed: after its op; or put back): the partner's phone drops it. */
  release(): void {
    if (this.#timer) clearTimeout(this.#timer);
    this.#timer = null;
    const h = this.#mine;
    this.#mine = null;
    this.#sent = null;
    if (h) this.#send(this.#wire(h, true));
  }
  get holding(): string | null {
    return this.#mine?.id ?? null;
  }

  // ---- the partner's ----
  /** A drag heard from the partner (`itemOf`: a placed piece's item, the room's): true when it changed what they hold. */
  heard(m: Relayed, itemOf: (id: string) => string | undefined = () => undefined): boolean {
    if (m.kind !== 'drag') return false;
    if (m.end) return this.#theirs.delete(m.id);
    const was = this.#theirs.get(m.id);
    const item = m.it ?? was?.item ?? itemOf(m.id);
    if (!item) return false;
    this.#theirs.set(m.id, { id: m.id, item, x: m.x, z: m.z, f: m.f as Facing, heard: this.#now(), since: was?.since ?? m.t, who: m.who });
    return true;
  }
  /** What the partner holds now (the silent ones dropped): true when something was dropped. */
  expire(): boolean {
    const t = this.#now();
    let any = false;
    for (const [id, h] of this.#theirs) if (t - h.heard > SILENT_MS) (this.#theirs.delete(id), (any = true));
    return any;
  }
  /** The partner left: everything they held goes back. */
  gone(): boolean {
    const any = this.#theirs.size > 0;
    this.#theirs.clear();
    return any;
  }
  theirs(): HeldThere[] {
    return [...this.#theirs.values()];
  }
  heldThere(id: string): HeldThere | null {
    return this.#theirs.get(id) ?? null;
  }

  stop(): void {
    this.release();
    this.#theirs.clear();
  }
}
