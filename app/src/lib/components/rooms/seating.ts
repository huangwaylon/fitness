// Sitting in a room, shared by the tent, the homes and the museum (docs/design.md "The tent": Sit, lie and switch; "The
// museum": the aquarium's benches): a tap on a piece walks my villager up to its nearest free seat (a step in front:
// its `from`) and on; a tap on the floor gets it up and walks it. One villager a seat, the first to sit keeps it: my
// seat goes out with my presence (the `tent` intent's `seat`, `n`, `lie`, `s`), the others' come in the same way, and
// two phones taking one seat at the same moment settle it by `outsat` (the same on every phone). Pure: the room's
// screen walks and poses.
import type { Who } from '#lib/types.ts';

type Pt = readonly [number, number];

/** One villager a seat, the first to sit keeps it: whether their sit (when, relay ms as sent: whole) stands mine up. An
 *  exact tie goes by who (A, then B, then G), the same on both phones: never both up. */
export function outsat(mine: { s: number; who: Who }, theirs: { s: number; who: Who }): boolean {
  const a = Math.round(theirs.s), b = Math.round(mine.s);
  return a < b || (a === b && theirs.who < mine.who);
}

/** What the shared flow needs of a room's seat: its piece and which of its seats, sat or lain on, where one sits and
 *  where one stands to get on it. */
export interface RoomSeat {
  id: string;
  n: number;
  lie: boolean;
  at: Pt;
  from: Pt;
}
/** Another's seat as heard (its piece, which seat, since when on the relay's clock). */
interface TheirSeat {
  id: string;
  n: number;
  s: number;
}

export interface Seating<S extends RoomSeat> {
  /** Mine now (and since when), or null standing. */
  mine(): (S & { s: number }) | null;
  /** Whether another villager is on a piece's seat. */
  taken(id: string, n: number): boolean;
  /** Whether `w` (another) is seated. */
  seated(w: Who): boolean;
  their(w: Who): TheirSeat | null;
  /** A tap on a piece (its seats): `full` all taken (a boop), `on` mine already, else `go`: `walk` up to the nearest
   *  free one's step and, there and still free, `sat` (mine is it from then). */
  tap(seats: readonly S[], here: Pt, now: () => number, walk: (to: Pt, then: () => void) => void, sat: (st: S) => void): 'full' | 'on' | 'go';
  /** Up off mine (a walk away, a seat gone): the step it gets up to, or null when standing. */
  stand(): Pt | null;
  /** My seat as my presence says it (the `tent` intent's fields), or null. */
  wire(): { seat: string; n: number; lie?: true; s: number } | null;
  /** Another's presence heard (`in` the room, its seat or none, `t` the relay's stamp): their seat now, and whether
   *  mine gives way (they took it first: I get up, a boop). */
  heard(w: Who, m: { in: boolean; seat?: string; n?: number; s?: number; t: number }): { seat: TheirSeat | null; yields: boolean };
}

export function createSeating<S extends RoomSeat>(me: Who): Seating<S> {
  let mine: (S & { s: number }) | null = null;
  const theirs = new Map<Who, TheirSeat>();
  const taken = (id: string, n: number) => [...theirs.values()].some((st) => st.id === id && st.n === n);
  return {
    mine: () => mine,
    taken,
    seated: (w) => theirs.has(w),
    their: (w) => theirs.get(w) ?? null,
    tap(seats, here, now, walk, sat) {
      const free = seats.filter((st) => !taken(st.id, st.n));
      if (!free.length) return 'full';
      if (mine && seats.some((st) => st.id === mine!.id)) return 'on';
      const d = (st: S) => Math.hypot(st.from[0] - here[0], st.from[1] - here[1]);
      const st = free.sort((a, b) => d(a) - d(b))[0];
      walk(st.from, () => {
        // (still free: another may have got there first)
        if (taken(st.id, st.n)) return;
        mine = { ...st, s: now() };
        sat(st);
      });
      return 'go';
    },
    stand() {
      const was = mine;
      mine = null;
      return was ? was.from : null;
    },
    wire: () => (mine ? { seat: mine.id, n: mine.n, ...(mine.lie ? { lie: true as const } : {}), s: Math.round(mine.s) } : null),
    heard(w, m) {
      const seat = m.in && m.seat !== undefined ? { id: m.seat, n: m.n ?? 0, s: m.s ?? m.t } : null;
      if (seat) theirs.set(w, seat);
      else theirs.delete(w);
      const yields = !!seat && !!mine && mine.id === seat.id && mine.n === seat.n && outsat({ s: mine.s, who: me }, { s: seat.s, who: w });
      return { seat, yields };
    }
  };
}
