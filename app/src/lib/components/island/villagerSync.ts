// The villagers on both phones (docs/backend.md#shared-world "Villagers"): each person's phone moves their own villager
// and is the one that does. Every walk and put of mine (the director's onOwnMove: a tap-walk, a walk home, a stop under
// a sheet, back home after a while away) goes over the relay as the very walk: where from, the waypoints, when it set
// off on the relay's clock, how long, the facing at its end. The partner's phone plays that walk from the same start at
// the same time; a late one catches up (it starts where the walk is by now), a small gap from where their villager
// stands here is walked off within the walk's own time, a big one is a jump. While the partner has the island open
// their villager is the relay's to move here (director setRemote): this phone's own life leaves it alone. A join gets
// my villager as it is (its current walk again), and a long walk is said again every RESAY_MS, so a phone that missed
// the start finds it on its way. Plain TS: the relay and the clock come in through `VillagerLink`.
import { WAKE_MS, actors, along, isRemote, livePos, onOwnMove, onWake, place, setRemote, wake, walkTo, type Facing, type Move } from '../motion/director.svelte.ts';
import { VIA_MAX, type Face, type Intent, type Pt, type Who } from '#lib/sync/live-protocol.ts';
import { actorOfFor, whoOfFor, type VillagerActor } from '#lib/ui-state/cast.ts';

type Walk = Extract<Intent, { kind: 'walk' }>;
/** A villager woke (`id` whose, `at` when on the relay's clock). */
type Woke = Extract<Intent, { kind: 'act' }> & { act: 'wake'; id: Who; at: number };

export interface VillagerLink {
  /** Send (and keep in the day) a walk of mine, or a wake. */
  share(w: Walk | Woke): void;
  /** Who I am (whose villager is `mine`). */
  me(): Who;
  /** The relay's clock (ms). */
  serverNow(): number;
  /** Whether my villager's moves may be told now (live, and not the gallery). */
  enabled(): boolean;
}

/** After this phone's socket (re)connects, my villager as it is goes again this long after (ms): the day's replay is
 *  in by then (the room may hold an older walk of it). */
export const JOIN_SAY_MS = 400;
/** A walk still under way is said again this often (ms), while the partner is here. */
export const RESAY_MS = 5000;
/** A partner's villager further than this (u) from where their walk has it by now jumps there; nearer, it walks the gap
 *  off within the walk. */
export const JUMP_U = 160;
/** A walk heard after its end: a villager within this (u) of its end walks there briskly (at most CATCH_MS), else it
 *  is put there. */
const CATCH_U = 120;
const CATCH_MS = 600;
const RUN_U_S = 240;
/** A partner's walk this brisk (u/s) is a tap-walk's run: its ring shows where it goes (a wander home is slower). */
export const RUN_RING_U_S = 170;

const round = (p: Pt): [number, number] => [Math.round(p[0]), Math.round(p[1])];
const dist = (a: Pt, b: Pt): number => Math.hypot(a[0] - b[0], a[1] - b[1]);

/** At most VIA_MAX waypoints between `from` and the end: a longer way keeps every k-th corner (the end always). */
export function thin(pts: readonly Pt[]): Pt[] {
  if (pts.length <= VIA_MAX + 1) return pts.map(round);
  const k = Math.ceil((pts.length - 1) / VIA_MAX);
  const out: Pt[] = [];
  for (let i = k - 1; i < pts.length - 1; i += k) out.push(round(pts[i]));
  return [...out.slice(0, VIA_MAX), round(pts[pts.length - 1])];
}

/** A move of my villager as the relay's walk, set off at `s` (the relay's clock). */
export function walkOf(m: Move, s: number): Walk {
  const way = m.pts.length ? thin(m.pts) : [round(m.from)];
  const to = way[way.length - 1];
  const via = way.slice(0, -1);
  return {
    kind: 'walk', to, from: round(m.from), ...(via.length ? { via } : {}), s: Math.round(s), ms: Math.max(0, Math.min(60_000, Math.round(m.ms))),
    ...(m.face ? { f: m.face as Face } : {})
  };
}

/** Another's walk from the relay (the partner's, or the third villager's: `id`), played here on their villager (`now`:
 *  the relay's clock). Without the very walk (an older app: only `to`), null: the caller plans it. Returns how it was
 *  played. */
export function playPartner(w: Walk, now: number, visible = true, id: VillagerActor = 'partner'): 'walk' | 'catch-up' | 'jump' | 'put' | null {
  if (!Array.isArray(w.to) || !w.from || w.s === undefined || w.ms === undefined) return null;
  const to = w.to as Pt, pts: Pt[] = [...(w.via ?? []), to];
  const face = w.f as Facing | undefined;
  const { at, rest, left } = along(w.from, w.ms ? pts : [], w.ms, now - w.s);
  const here = livePos(id);
  if (!left) {
    // over by now: there already, or nearly (walked off briskly), else put there
    const d = dist(here, to);
    if (d > 2 && d <= CATCH_U && visible && !actors[id].asleep) {
      walkTo(id, [to], { ms: Math.min(CATCH_MS, (d / RUN_U_S) * 1000), from: here, face, remote: true });
      return 'catch-up';
    }
    place(id, to[0], to[1], true);
    if (face) actors[id].face = face;
    return 'put';
  }
  if (!visible || dist(here, at) > JUMP_U) {
    place(id, at[0], at[1], true);
    walkTo(id, rest, { ms: left, from: at, face, remote: true });
    return 'jump';
  }
  // from where it stands here, along the rest of the way, arriving when it does on their phone
  walkTo(id, rest, { ms: left, from: here, face, remote: true });
  return 'walk';
}

/** A villager woke on the partner's phone (a tap on theirs, a high-five): it wakes here too, for what's left of its
 *  WAKE_MS (the same moment it goes back to sleep on both). Returns whether it woke. */
export function playWake(e: { id?: string; at?: number }, me: Who, now: number): boolean {
  if (e.id !== 'A' && e.id !== 'B' && e.id !== 'G') return false;
  const id = actorOfFor(me, e.id);
  const left = WAKE_MS - Math.max(0, now - (e.at ?? now));
  if (left < 250 || !actors[id].asleep) return false;
  wake(id, { remote: true, ms: left });
  return true;
}

/** Tell the partner's phone my villager's every move, and play theirs here (see the top). Returns the detach. */
export function linkVillagers(link: VillagerLink): { detach(): void; partnerHere(on: boolean): void; here(id: VillagerActor, on: boolean): void; joined(): void } {
  /** My villager's current walk (as sent) and when it ends (the relay's clock). */
  let mine: Walk | null = null;
  let pending: Move | null = null;
  let resay: ReturnType<typeof setInterval> | null = null;
  /** Who else has the island open (their villagers are the relay's to move here). */
  const present = new Set<VillagerActor>();
  const say = (w: Walk) => {
    if (link.enabled()) link.share(w);
  };
  const off = onOwnMove((m) => {
    // a burst (a put, then a walk, in one go) is one message: the last
    const first = !pending;
    pending = m;
    if (first)
      queueMicrotask(() => {
        const m2 = pending;
        pending = null;
        if (!m2) return;
        mine = walkOf(m2, link.serverNow());
        say(mine);
      });
  });
  // a wake here (mine tapped, or both at a high-five) wakes the same villager there
  const offWake = onWake((id) => {
    if (!link.enabled()) return;
    link.share({ kind: 'act', act: 'wake', id: whoOfFor(link.me(), id), at: Math.round(link.serverNow()) });
  });
  const tick = () => {
    // a walk still under way, said again (a phone that missed its start finds it on its way)
    if (!present.size || !mine || !mine.ms || link.serverNow() >= mine.s! + mine.ms) return;
    say(mine);
  };
  return {
    detach() {
      off();
      offWake();
      if (resay) clearInterval(resay);
      resay = null;
      for (const id of present) setRemote(id, false);
      present.clear();
    },
    /** The partner has the island open (or not): `here('partner', on)`. */
    partnerHere(on: boolean) {
      this.here('partner', on);
    },
    /** Another has the island open (or not): while they do, their villager (`id`) is the relay's to move here. */
    here(id: VillagerActor, on: boolean) {
      if (on === present.has(id) || id === 'mine') return;
      if (on) {
        present.add(id);
        // whatever this phone had their villager doing stops where it is; their phone says where it is
        if (!isRemote(id) && actors[id].walking) {
          const [x, z] = livePos(id);
          place(id, x, z);
        }
        resay ??= setInterval(tick, RESAY_MS);
      } else {
        present.delete(id);
        if (!present.size && resay) {
          clearInterval(resay);
          resay = null;
        }
      }
      setRemote(id, on);
      if (on) this.joined();
    },
    /** A partner arrived (or this phone did): my villager as it is, so their phone has it where mine does. */
    joined() {
      if (!mine) {
        const [x, z] = livePos('mine');
        mine = walkOf({ id: 'mine', from: [x, z], pts: [], ms: 0, face: actors.mine.face }, link.serverNow());
      }
      say(mine);
    }
  };
}
