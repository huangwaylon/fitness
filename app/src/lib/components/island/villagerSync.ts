// The villagers on both phones (docs/backend.md#shared-world "Villagers"): each person's phone moves their own villager
// and is the one that does. Every walk and put of mine (the director's onOwnMove: a tap-walk, a walk home, a stop under
// a sheet, back home after a while away) goes over the relay as the very walk: where from, the waypoints, when it set
// off on the relay's clock, how long, the facing at its end. The partner's phone plays that walk from the same start at
// the same time; a late one catches up (it starts where the walk is by now), a small gap from where their villager
// stands here is walked off within the walk's own time, a big one glides off (a jump only while hidden). While the partner has the island open
// their villager is the relay's to move here (director setRemote): this phone's own life leaves it alone. A join gets
// my villager as it is (its current walk again), and a long walk is said again every RESAY_MS, so a phone that missed
// the start finds it on its way.
// A member whose phone is gone (the relay saw its socket close) for HOME_AFTER_MS has their villager walk home, on every
// phone the same: the walk is a function of when the relay saw them leave (its clock, the presence's `t` or the
// welcome's `gone`), where their last walk ended and the island's nav, so a phone opening later finds it where that
// walk has it by now. Till then and on the way it stays the relay's (no phone's own life moves it); home, it's each
// phone's ambient life's again. A return before then cancels it; a return on the way takes it over from where it is
// (their own phone works out the same walk from the welcome and walks the rest). Plain TS: the relay, the clock and
// the island's planner come in through `VillagerLink`.
import { WAKE_MS, actors, along, isRemote, livePos, onOwnMove, onWake, place, setAsleep, setRemote, sleepTime, stir, wake, walkTo, type Facing, type Move } from '../motion/director.svelte.ts';
import { VIA_MAX, type Face, type Intent, type Pt, type Who } from '#lib/sync/live-protocol.ts';
import { actorOfFor, whoOfFor, type VillagerActor } from '#lib/ui-state/cast.ts';
import { dist } from '#lib/layout/nav.ts';

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
  /** Where a villager's last walk (today's, as the relay keeps it) ended: where a phone that's gone left it. Null: none
   *  today (it's home). */
  lastAt?(id: VillagerActor): Pt | null;
  /** The way from `from` to `to` on the island's nav (avatar.ts homeRoute: planTap), null when there's none. */
  route?(from: Pt, to: Pt): Pt[] | null;
  /** A villager walked home by the rule (or was home by now): it rests at home again. */
  atHome?(id: VillagerActor): void;
  /** Where my villager stands once its latest move is over (every move of mine, told or not: kept for the next open). */
  kept?(at: Pt): void;
}

/** A member's phone gone this long (ms, the relay's clock) and their villager walks home (`?homeafter=<ms>`: the
 *  e2e's, setHomeAfter). */
export const HOME_AFTER_MS = 180_000;
let homeAfterMs = HOME_AFTER_MS;
/** How long a phone is gone before its villager walks home (the test hook may shorten it). */
export const homeAfter = (): number => homeAfterMs;
export function setHomeAfter(ms: number): void {
  homeAfterMs = ms > 0 ? ms : HOME_AFTER_MS;
}
/** The walk home's speed (u/s): a stroll (walkGraph SPEED.wander). */
const HOME_U_S = 90;
/** The longest walk home (ms): a phone gone homeAfter() + this has its villager home on every phone. */
const HOME_WALK_MAX_MS = 60_000;
/** Whether a phone gone this long (ms) has its villager home by now (the walk home over: the island opening or shown
 *  again puts it there at once, as the welcome would a moment later). */
export const walkedHome = (goneMs: number): boolean => goneMs > homeAfter() + HOME_WALK_MAX_MS;

/** A villager's walk home: from where its phone left it to its home, at a stroll, setting off at `s` (the relay's
 *  clock: when it left + homeAfter()), `ms` long (0: home already). */
export interface HomeWay {
  from: Pt;
  pts: Pt[];
  s: number;
  ms: number;
}

/** The walk home of a villager whose phone left at `left`, from `from` (its last walk's end) to `home` by `route`. */
export function homeWay(from: Pt, home: Pt, left: number, route?: (from: Pt, to: Pt) => Pt[] | null, after = homeAfter()): HomeWay {
  const s = Math.round(left + after), f = round(from), h = round(home);
  if (dist(f, h) <= 2) return { from: h, pts: [], s, ms: 0 };
  const pts = (route?.(f, h) ?? [h]).map(round);
  if (!pts.length || dist(pts[pts.length - 1], h) > 2) pts.push(h);
  let len = 0, at: Pt = f;
  for (const p of pts) {
    len += dist(at, p);
    at = p;
  }
  return { from: f, pts, s, ms: Math.min(HOME_WALK_MAX_MS, Math.round((len / HOME_U_S) * 1000)) };
}

/** Where the walk home has its villager at `now`: not yet off (`wait`), on the way (`at`, the rest, the ms left), or
 *  home. */
export function homeAt(w: HomeWay, now: number): { phase: 'wait' } | { phase: 'way'; at: Pt; rest: Pt[]; left: number } | { phase: 'home' } {
  if (now < w.s) return { phase: 'wait' };
  const { at, rest, left } = along(w.from, w.pts, w.ms, now - w.s);
  return left > 0 ? { phase: 'way', at, rest, left } : { phase: 'home' };
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
const RUN_U_S = 240;
/** A partner's walk this brisk (u/s) is a tap-walk's run: its ring shows where it goes (a wander home is slower). */
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
export interface VillagerLinked {
  detach(): void;
  partnerHere(on: boolean): void;
  here(id: VillagerActor, on: boolean, left?: number): void;
  joined(myLeft?: number): void;
  down(): void;
  homeBound(id: VillagerActor): boolean;
  replan(id: VillagerActor): void;
}

/** The welcome's `gone` of my own last socket that my villager was last brought back by (mineBack: once per welcome,
 *  across the island's mounts). */
let backFrom: number | undefined;

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
  /** The members gone from the relay (when they left, its clock): their villager walks home (see the top). */
  const homing = new Map<VillagerActor, { left: number; from: Pt; timer?: ReturnType<typeof setTimeout>; played?: string }>();
  const member = (id: VillagerActor) => whoOfFor(link.me(), id) !== 'G';
  // (from its last walk's end; none today (a new day's relay holds none yet): from where it stood here as it went)
  const wayOf = (id: VillagerActor, r: { left: number; from: Pt }): HomeWay => homeWay(link.lastAt?.(id) ?? r.from, actors[id].home, r.left, link.route);
  /** Home by the rule: put there if it isn't, dozing at night, and the island's own life's again. */
  const home = (id: VillagerActor, key: string) => {
    const r = homing.get(id)!;
    if (r.played === `home|${key}`) return;
    r.played = `home|${key}`;
    const [hx, hz] = actors[id].home;
    if (dist(livePos(id), [hx, hz]) > 2 || actors[id].walking) place(id, hx, hz, true);
    actors[id].face = 'home';
    if (id !== 'mine' && actors[id].asleep !== sleepTime()) setAsleep(id, sleepTime());
    // home: ambient life's again (its outings are the same on every phone)
    setRemote(id, false);
    link.atHome?.(id);
  };
  /** Another's villager by the rule now: waiting where it was left, on its way home, or home. */
  const apply = (id: VillagerActor) => {
    const r = homing.get(id);
    if (!r || id === 'mine') return;
    clearTimeout(r.timer);
    const now = link.serverNow(), way = wayOf(id, r), key = `${way.s}|${way.from}|${way.ms}`;
    const p = homeAt(way, now);
    if (p.phase === 'home') return home(id, key);
    if (r.played?.startsWith('home|')) r.played = undefined;
    setRemote(id, true);
    if (p.phase === 'way' && r.played !== key) {
      r.played = key;
      // (asleep: up quietly for the walk, dozing again at home)
      stir(id);
      const to = way.pts[way.pts.length - 1];
      // on time it walks from where it stands; a phone opening later (or back) puts it where the walk has it by now
      playPartner({ kind: 'walk', from: way.from, to, ...(way.pts.length > 1 ? { via: way.pts.slice(0, -1) } : {}), s: way.s, ms: way.ms, f: 'home' }, now, now - way.s < 1000, id);
    }
    const next = p.phase === 'wait' ? way.s - now : p.left + 30;
    r.timer = setTimeout(() => apply(id), Math.max(0, next));
  };
  const unhome = (id: VillagerActor) => {
    clearTimeout(homing.get(id)?.timer);
    homing.delete(id);
  };
  /** My own villager, back after my phone was gone (`myLeft`, the welcome's): where the walk home has it by now, and
   *  the rest of it walked from there (said like any walk of mine). Once per welcome: the island opening again on the
   *  same socket (back from a room) hears the same `gone`, and my villager is where it was then, not home. Returns
   *  whether it moved it. */
  const mineBack = (myLeft: number | undefined): boolean => {
    if (myLeft === undefined || myLeft === backFrom || !member('mine')) return false;
    backFrom = myLeft;
    const way = homeWay(link.lastAt?.('mine') ?? livePos('mine'), actors.mine.home, myLeft, link.route);
    const p = homeAt(way, link.serverNow());
    if (p.phase === 'wait') return false;
    const [hx, hz] = actors.mine.home;
    if (p.phase === 'home') {
      link.atHome?.('mine');
      if (dist(livePos('mine'), [hx, hz]) <= 2 && !actors.mine.walking) return false;
      actors.mine.face = 'home';
      place('mine', hx, hz);
      return true;
    }
    stir('mine');
    place('mine', p.at[0], p.at[1]);
    walkTo('mine', p.rest, { ms: p.left, from: p.at, face: 'home', then: () => {
      link.atHome?.('mine');
      if (sleepTime()) setAsleep('mine', true);
    } });
    return true;
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
      for (const id of [...homing.keys()]) {
        unhome(id);
        setRemote(id, false);
      }
    },
    /** The partner has the island open (or not): `here('partner', on)`. */
    partnerHere(on: boolean) {
      this.here('partner', on);
    },
    /** Another has the island open (or not): while they do, their villager (`id`) is the relay's to move here. `left`:
     *  when they left (the relay's clock; none: this phone is offline, or the relay doesn't say): a member's villager
     *  walks home after a while (see the top). */
    here(id: VillagerActor, on: boolean, left?: number) {
      if (id === 'mine') return;
      if (on) unhome(id);
      else if (left !== undefined && member(id) && homing.get(id)?.left !== left) {
        unhome(id);
        homing.set(id, { left, from: livePos(id) });
        if (present.delete(id) && !present.size && resay) {
          clearInterval(resay);
          resay = null;
        }
        return apply(id);
      }
      if (on === present.has(id) || (!on && homing.has(id))) return;
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
      if (on && up) this.joined();
    },
    /** This phone's socket went down: my moves are only kept till it's back (joined). */
    down() {
      up = false;
    },
    /** Whether another's villager is the walk home's now (their phone gone): a walk of theirs heard (the day's replay)
     *  replans it rather than playing. */
    homeBound(id: VillagerActor): boolean {
      return homing.has(id);
    },
    /** Their last walk may have changed (heard again): the walk home from its end. */
    replan(id: VillagerActor) {
      const r = homing.get(id);
      if (!r) return;
      r.played = undefined;
      apply(id);
    },
    /** A partner arrived (or this phone did, `myLeft`: when my last socket left, the welcome's): my villager as it is,
     *  so their phone has it where mine does (gone long enough: first where the walk home has it by now). */
    joined(myLeft?: number) {
      const wasUp = up;
      up = true;
      if (!wasUp && mineBack(myLeft)) return; // (the move says itself)
      if (!mine) {
        const [x, z] = livePos('mine');
        mine = walkOf({ id: 'mine', from: [x, z], pts: [], ms: 0, face: actors.mine.face }, link.serverNow());
      }
      say(mine);
    }
  };
}
