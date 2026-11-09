// The villagers on both phones (docs/backend.md#shared-world "Villagers"): each person's phone moves their own villager
// and is the one that does. Every walk and put of mine (the director's onOwnMove: a tap-walk, a stop under a sheet, out
// of a door) goes over the relay as the very walk: where from, the waypoints, when it set off on the relay's clock, how
// long, the facing at its end. The partner's phone plays that walk from the same start at the same time; a late one
// catches up (it starts where the walk is by now), a small gap from where their villager stands here is walked off
// within the walk's own time, a big one glides off (a jump only while hidden). While the partner has the island open
// their villager is the relay's to move here (director setRemote): this phone's own life leaves it alone. A join gets
// my villager as it is (its current walk again), and a long walk is said again every RESAY_MS, so a phone that missed
// the start finds it on its way. A phone gone (closed, hidden, offline) leaves its villager where its last walk ended,
// on every phone, for as long as it's gone (the relay keeps each person's last walk, across days). Plain TS: the relay
// and the clock come in through `VillagerLink`.
import { actors, along, isRemote, livePos, onOwnMove, onWake, place, remoteWalking, setRemote, wake, walkTo, type Facing, type Move } from '../motion/director.svelte.ts';
import { VIA_MAX, type Face, type Intent, type Pt, type Who } from '#lib/contract/live-protocol.ts';
import { actorOfFor, setWoke, wakeMs, whoOfFor, type VillagerActor } from '#lib/ui-state/cast.ts';
import { dist } from '#lib/layout/nav.ts';
import { SPEED } from './speed.ts';

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
  /** Where my villager stands once its latest move is over (every move of mine, told or not: kept for the next open). */
  kept?(at: Pt): void;
}

/** After this phone's socket (re)connects, my villager as it is goes again this long after (ms): the day's replay is
 *  in by then (the room may hold an older walk of it). */
export const JOIN_SAY_MS = 400;
/** A walk still under way is said again this often (ms), while the partner is here. */
export const RESAY_MS = 5000;
/** A partner's villager further than this (u) from where their walk has it by now glides the gap off (no slower than
 *  the run, at most GLIDE_MS); nearer, it walks it off within the walk. */
export const JUMP_U = 160;
/** A walk heard after its end: a villager within this (u) of its end walks there briskly (at most CATCH_MS), further
 *  it glides there (at most GLIDE_MS): a big correction is never a jump while it's in view (a hidden island, a phone
 *  opening, a villager asleep: put). */
const CATCH_U = 120;
const CATCH_MS = 600;
const GLIDE_MS = 1500;
/** A correction's pace (u/s): a player's brisk walk. */
const RUN_U_S = SPEED.action;
/** A partner's walk this brisk (u/s) is a tap-walk's run: its ring shows where it goes (a wander home, 90, is slower;
 *  a run is 300, an older phone's 200). */
export const RUN_RING_U_S = 170;

const round = (p: Pt): [number, number] => [Math.round(p[0]), Math.round(p[1])];

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
 *  the relay's clock; `visible`: the island in view and the news live, not a phone opening). Without the very walk
 *  (an older app: only `to`), null: the caller plans it. Returns how it was played. */
export function playPartner(w: Walk, now: number, visible = true, id: VillagerActor = 'partner'): 'walk' | 'catch-up' | 'glide' | 'jump' | 'put' | null {
  if (!Array.isArray(w.to) || !w.from || w.s === undefined || w.ms === undefined) return null;
  const to = w.to as Pt, pts: Pt[] = [...(w.via ?? []), to];
  const face = w.f as Facing | undefined;
  const { at, rest, left } = along(w.from, w.ms ? pts : [], w.ms, now - w.s);
  const here = livePos(id);
  const run = (d: number, cap: number) => Math.min(cap, (d / RUN_U_S) * 1000);
  if (!left) {
    // over by now: there already, or nearly (walked off briskly), or further (glided there), else put there
    const d = dist(here, to);
    if (d > 2 && visible && !actors[id].asleep) {
      walkTo(id, [to], { ms: run(d, d <= CATCH_U ? CATCH_MS : GLIDE_MS), from: here, face, remote: true });
      return d <= CATCH_U ? 'catch-up' : 'glide';
    }
    place(id, to[0], to[1], true);
    if (face) actors[id].face = face;
    return 'put';
  }
  if (!visible) {
    place(id, at[0], at[1], true);
    walkTo(id, rest, { ms: left, from: at, face, remote: true });
    return 'jump';
  }
  // from where it stands here, along the rest of the way, arriving when it does on their phone (a big gap: glided off,
  // a little later)
  const gap = dist(here, at);
  walkTo(id, rest, { ms: gap > JUMP_U ? Math.max(left, run(gap, GLIDE_MS)) : left, from: here, face, remote: true });
  return gap > JUMP_U ? 'glide' : 'walk';
}

/** A villager woke on another phone (a tap there, a high-five): it wakes here too, for what's left of its minute (wakeMs)
 *  from the wake's `at` (the same moment it goes back to sleep on every phone). Returns whether it woke. */
export function playWake(e: { id?: string; at?: number }, me: Who, now: number): boolean {
  if (e.id !== 'A' && e.id !== 'B' && e.id !== 'G') return false;
  const id = actorOfFor(me, e.id);
  const left = wakeMs() - Math.max(0, now - (e.at ?? now));
  if (left < 250 || !actors[id].asleep) return false;
  setWoke(e.id, e.at ?? now);
  wake(id, { remote: true, ms: left });
  return true;
}

/** Tell the partner's phone my villager's every move, and play theirs here (see the top). Returns the detach. */
export interface VillagerLinked {
  detach(): void;
  partnerHere(on: boolean): void;
  here(id: VillagerActor, on: boolean): void;
  joined(): void;
  down(): void;
}

export function linkVillagers(link: VillagerLink): VillagerLinked {
  /** My villager's current walk (as sent) and when it ends (the relay's clock). */
  let mine: Walk | null = null;
  let pending: Move | null = null;
  let resay: ReturnType<typeof setInterval> | null = null;
  /** Who else has the island open (their villagers are the relay's to move here). */
  const present = new Set<VillagerActor>();
  /** The socket is up and the day's replay in (joined): my moves are told; before, only kept (the latest goes then). */
  let up = false;
  const say = (w: Walk) => {
    if (up && link.enabled()) link.share(w);
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
        link.kept?.(mine.to as Pt);
        say(mine);
      });
  });
  // a wake here (mine tapped, or both at a high-five) wakes the same villager there
  const offWake = onWake((id) => {
    const w = whoOfFor(link.me(), id), at = Math.round(link.serverNow());
    setWoke(w, at);
    if (link.enabled()) link.share({ kind: 'act', act: 'wake', id: w, at });
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
    /** Another has the island open (or not): while they do, their villager (`id`) is the relay's to move here; gone,
     *  it stays where their last walk left it (this phone's own life may give it its idle beats there). */
    here(id: VillagerActor, on: boolean) {
      if (id === 'mine' || on === present.has(id)) return;
      if (on) {
        present.add(id);
        // whatever this phone had their villager doing stops where it is; their phone says where it is (a walk the
        // relay gave it is their phone's already: it goes on, as after a bye from their other tab and a hello)
        if (!isRemote(id) && actors[id].walking && !remoteWalking(id)) {
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
      if (on && up) this.joined();
    },
    /** This phone's socket went down: my moves are only kept till it's back (joined). */
    down() {
      up = false;
    },
    /** A partner arrived (or this phone did): my villager as it is, so their phone has it where mine does. */
    joined() {
      up = true;
      if (!mine) {
        const [x, z] = livePos('mine');
        mine = walkOf({ id: 'mine', from: [x, z], pts: [], ms: 0, face: actors.mine.face }, link.serverNow());
      }
      say(mine);
    }
  };
}
