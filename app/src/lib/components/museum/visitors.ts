// The museum's visitors (docs/design.md "The museum"), pure: NH villagers (ききみみ's friends, VISITORS below, NH's own
// 3D models) come in through the day, up to eight across the museum and two to a room (spread so most rooms have
// someone, the aquarium and the bug garden first), each for half an hour or so in one room: in at its door, from one
// linger point to the next (admiring an exhibit, a little hop now and then; sitting on a bench; chatting in pairs at two
// points that face each other), an emote bubble (♪ ! 💡 …) over its head every 40 s or so, out at the door again. Who,
// where and when is the Tokyo day's, seeded (dayPlan): every phone shows the same visitors in the same places, with
// nothing on the relay.
// Nothing is stepped: a pose at t is read off the day's plan (its walks' times from straight-line lengths, so no path
// is searched to plan; a walk drawn takes the caller's path at the speed that ends it on time). A tap is this phone's
// alone: the visitor stops, turns to my villager, hops and talks (visitorLines.ts), then strolls back onto its plan;
// a new find on show turns the room's visitors to it with a start; my villager coming close gets a wave (once a visitor a
// visit, this phone's). The engine draws only the room it's in (step(t, room)) and sleeps between changes (nextChange).
//   const c = crowdOf({ rooms, points, path, name })  ·  c.step(t, room, blocked, me) → poses + acts  ·  c.tap(id, t, me) → line
//   c.notice(exhibitId, t)  ·  c.nextChange(t, room)
import type { Personality } from '#lib/villagers/species.ts';
import { ISLAND_SEED } from '#lib/contract/wet.ts';
import { seeded, weighted } from '#lib/random.ts';
import type { Pt, Rect, Wing } from './plan.ts';
import { SEA_TANKS } from './seaTanks.ts';
import { visitorLine, type Line, type LineContext, type RoomKind } from './visitorLines.ts';

/** Who visits: three of each NH personality from ききみみ's cast (kikimimi/cast.ts), each with NH's model
 *  (villager3d/villagers.json); visitors.test holds them to the roster. */
export const VISITORS: readonly (readonly [id: string, personality: Personality])[] = [
  ['goldie', 'normal'], ['maple', 'normal'], ['molly', 'normal'],
  ['stitches', 'lazy'], ['bob', 'lazy'], ['punchy', 'lazy'],
  ['bunnie', 'peppy'], ['rosie', 'peppy'], ['audie', 'peppy'],
  ['dom', 'jock'], ['hamlet', 'jock'], ['kid-cat', 'jock'],
  ['apollo', 'cranky'], ['kabuki', 'cranky'], ['wolfgang', 'cranky'],
  ['judy', 'snooty'], ['diana', 'snooty'], ['whitney', 'snooty'],
  ['raymond', 'smug'], ['marshal', 'smug'], ['pietro', 'smug'],
  ['cherry', 'sisterly'], ['tammy', 'sisterly'], ['agnes', 'sisterly']
];

/** Where a visitor may linger (the caller's, from the room's layout): `faceYaw` three's yaw (0 toward +z); a `look`
 *  point faces its exhibit (`exhibitId`: the line names it), a `sit` point is a bench's seat (`from`: where one stands
 *  by it), a `chat` point faces its `pair`'s. */
export interface LingerPoint {
  id: string;
  room: string;
  x: number;
  z: number;
  faceYaw: number;
  kind: 'look' | 'sit' | 'chat';
  exhibitId?: string;
  pair?: string;
  from?: Pt;
}
/** A room: its kind (the lines' and the room's draw), where visitors come in and go out (`door`: just inside its
 *  doorway), its doorways' boxes (no point in one is used), and its floor's box (`bounds`: no point at its very sides or
 *  front is used, where the room view puts one at the screen's edge or under the HUD). */
export interface VisitorRoom {
  id: string;
  kind: Wing;
  door: Pt;
  doorways: readonly Rect[];
  bounds?: Rect;
}
type Act = 'hop' | 'surprise' | 'wave';
/** An idle emote's bubble over a visitor's head (NH's): ♪, !, 💡, …. */
export type Emote = 'note' | 'bang' | 'idea' | 'dots';
const EMOTES: readonly Emote[] = ['note', 'bang', 'idea', 'dots'];
type VisitorState = 'walk' | 'look' | 'sit' | 'chat' | 'stand' | 'talk';
export interface VisitorPose {
  id: string;
  personality: Personality;
  x: number;
  z: number;
  yaw: number;
  state: VisitorState;
  /** The walk's speed (u/s: the walk cycle's), 0 standing. */
  speed: number;
  /** 0 gone … 1 there: in at the door and out again. */
  fade: number;
  /** The point it's at (a seat's: sitAt its anchor), or null. */
  point: LingerPoint | null;
  /** Its emote bubble now (the plan's), or null. */
  emote: Emote | null;
}

/** At most this many in the museum, and in a room. */
export const MAX_IN = 8, MAX_ROOM = 2;
/** Visitors' stroll (u/s: under the players' PACE), and a walk's straight line to its length. */
const STROLL = 24, DETOUR = 1.25;
const MIN_WALK = 1500, MIN_STAY = 8000, FADE_MS = 500;
/** A tap's talk (ms) and the walk back onto the plan after it (u/s). */
const TALK_MS = 6000, CATCH = 34;
/** A notice's turn (ms), and how long a find is new (the `new` lines). */
const NOTICE_MS = 3000, FRESH_MS = 600_000;
/** An emote bubble: shown this long (ms), one every EMOTE_EVERY ± EMOTE_JIT while it stays. */
export const EMOTE_MS = 2500, EMOTE_EVERY = 40_000;
const EMOTE_JIT = 8000;
/** My villager this close (u: 2 tiles) gets a wave and a turn (ms), once a visitor a visit. */
export const WAVE_R = 20;
const WAVE_MS = 2500;
/** A point this near its room's sides or front (u) isn't used (the screen's edge, the HUD), nor this near its back. */
const SIDE = 10, FRONT = 14, BACK = 4;
const DAY = 86_400_000, Q = 900_000, MIN = 60_000, ZONE = 9 * 3_600_000;
/** How many come at each Tokyo hour (±1 a quarter): none in the small hours, a few at dusk, most in the afternoon and
 *  evening (after work, when we're in), still a few late (our evening visits: the museum never empty before 23:00). */
const BY_HOUR = [0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 7, 8, 8, 8, 8, 7, 7, 5, 4, 0];
/** From this Tokyo hour the hall is one of the rooms filled first (a night owl in the lobby, as the aquarium and the
 *  bug garden all day). */
const NIGHT_HALL = 20;
const ROOM_W: Record<Wing, number> = { hall: 1, bug: 3, fish: 3, fossil: 2.5, art: 2.5 };
/** What each personality likes: rooms (×), and how it lingers (a kind's weight, its time ×). */
const LIKES: Record<Personality, { room: Partial<Record<Wing, number>>; kind: Record<LingerPoint['kind'], number>; slow: number }> = {
  normal: { room: { bug: 1.4, fish: 1.3 }, kind: { look: 3, sit: 1, chat: 1.5 }, slow: 1 },
  lazy: { room: { fish: 1.6 }, kind: { look: 2, sit: 3, chat: 1 }, slow: 1.4 },
  peppy: { room: { fish: 1.5, art: 1.2 }, kind: { look: 3, sit: 0.5, chat: 2 }, slow: 0.8 },
  jock: { room: { bug: 1.8, fossil: 1.3 }, kind: { look: 3, sit: 0.4, chat: 1 }, slow: 0.7 },
  cranky: { room: { fossil: 1.8 }, kind: { look: 2, sit: 2, chat: 0.6 }, slow: 1.2 },
  snooty: { room: { art: 2.2 }, kind: { look: 3, sit: 1, chat: 1 }, slow: 1.1 },
  smug: { room: { art: 1.8, fossil: 1.2 }, kind: { look: 3, sit: 0.8, chat: 1.2 }, slow: 1 },
  sisterly: { room: { bug: 1.4, fossil: 1.3 }, kind: { look: 2, sit: 1, chat: 2.5 }, slow: 1 }
};
/** The look points before the sea creatures' tanks (spots.ts `tank:<id>`). */
const SEA_TANK_POINTS = new Set(SEA_TANKS.map((t) => `tank:${t.id}`));
const STAY_MS: Record<LingerPoint['kind'], readonly [number, number]> = { look: [18_000, 40_000], sit: [45_000, 100_000], chat: [30_000, 70_000] };

/** A visitor's time in one room: in at `t0`, out by `t1`. */
interface Stint { who: number; room: string; t0: number; t1: number }
/** A stretch of a visitor's plan: a walk (`from` → `to`), or a stay at its point (an `act` at its middle). */
interface Seg { t0: number; t1: number; walk: boolean; from: Pt; to: Pt; point: LingerPoint | null; enter?: true; leave?: true; act?: { at: number; a: Act }; emotes?: { at: number; e: Emote }[] }
interface Plan { stints: Stint[]; segs: Map<Stint, Seg[]> }

const dayOf = (ms: number) => Math.floor((ms + ZONE) / DAY);
const dist = (a: Pt, b: Pt) => Math.hypot(b[0] - a[0], b[1] - a[1]);
const walkMs = (d: number) => Math.max(MIN_WALK, ((d * DETOUR) / STROLL) * 1000);
const inBox = (r: Rect, x: number, z: number, pad: number) => x > r.x0 - pad && x < r.x1 + pad && z > r.z0 - pad && z < r.z1 + pad;
const yawTo = (from: Pt, to: Pt) => Math.atan2(to[0] - from[0], to[1] - from[1]);
/** A visitor's body's reach (u): a point closer than this to a doorway is in it. */
const BODY = 6;

/** The points a room's visitors use: none in a doorway (one would stand in the way), none at its floor's very sides or
 *  front (the room view's edge, under the HUD: out of a finger's reach). */
export function usablePoints(points: readonly LingerPoint[], rooms: readonly VisitorRoom[]): LingerPoint[] {
  const byId = new Map(rooms.map((r) => [r.id, r]));
  return points.filter((p) => {
    const r = byId.get(p.room), b = r?.bounds;
    if (!r || r.doorways.some((d) => inBox(d, p.x, p.z, BODY))) return false;
    return !b || (p.x > b.x0 + SIDE && p.x < b.x1 - SIDE && p.z > b.z0 + BACK && p.z < b.z1 - FRONT);
  });
}

/** The Tokyo day's plan (`day`: days since the epoch, Tokyo's): who comes when to which room, and each one's walks and
 *  stays there. The same inputs, the same plan: on every phone. */
export function dayPlan(day: number, rooms: readonly VisitorRoom[], points: readonly LingerPoint[], seed = ISLAND_SEED): Plan {
  const r = seeded(`museum-visitors|${seed}|${day}`);
  const start = day * DAY - ZONE, end = start + DAY;
  const byRoom = new Map(rooms.map((m) => [m.id, points.filter((p) => p.room === m.id)]));
  // (a room needs a point more than it can hold, so a visitor always has somewhere to go)
  const open = rooms.filter((m) => byRoom.get(m.id)!.length > MAX_ROOM);
  const stints: Stint[] = [];
  const over = (a: number, b: number, f: (s: Stint) => boolean) => stints.filter((s) => s.t0 < b && s.t1 > a && f(s)).length;
  /** The most of those `f` keeps in at once between a and b (at a, or as one of them comes in). */
  const peak = (a: number, b: number, f: (s: Stint) => boolean) => {
    const near = stints.filter((s) => s.t0 < b && s.t1 > a && f(s));
    return Math.max(0, ...[a, ...near.map((s) => s.t0).filter((t) => t > a)].map((t) => near.filter((s) => s.t0 <= t && s.t1 > t).length));
  };
  for (let q = 0; q < 96 && open.length; q++) {
    const t = start + q * Q, hour = Math.floor(q / 4), base = BY_HOUR[hour], x = r();
    const first = (m: VisitorRoom) => m.kind === 'fish' || m.kind === 'bug' || (hour >= NIGHT_HALL && m.kind === 'hall');
    const want = base && Math.min(MAX_IN, Math.max(0, base + (x < 0.2 ? -1 : x > 0.85 ? 1 : 0)));
    for (let tries = 0; tries < 6; tries++) {
      const t0 = t + Math.floor(r() * 10 * MIN), t1 = Math.min(end, t0 + (2 + Math.floor(r() * 3)) * Q + Math.floor((r() - 0.5) * 10 * MIN));
      // (the hour's number in at its start, one more while the aquarium or the bug garden has nobody; never more than
      // MAX_IN at once while it stays)
      const bare = open.some((m) => first(m) && !peak(t0, t0, (s) => s.room === m.id));
      if (!want || t1 - t0 < 10 * MIN || peak(t0, t0, () => true) >= want + (bare ? 1 : 0) || peak(t0, t1, () => true) >= MAX_IN) break;
      const free = VISITORS.map((_, i) => i).filter((i) => !over(t0 - 10 * MIN, t1, (s) => s.who === i));
      if (!free.length) break;
      const who = free[Math.floor(r() * free.length)], likes = LIKES[VISITORS[who][1]];
      const can = open.filter((m) => peak(t0, t1, (s) => s.room === m.id) < MAX_ROOM);
      if (!can.length) break;
      // (the aquarium and the bug garden first (at night the hall too), while one has nobody; else a room with nobody,
      // by taste; else any)
      const empty = can.filter((m) => !over(t0, t1, (s) => s.room === m.id));
      const must = empty.filter(first);
      const room = must.length ? must[Math.floor(r() * must.length)]
        : weighted((empty.length ? empty : can).map((m) => [m, ROOM_W[m.kind] * (likes.room[m.kind] ?? 1)] as const), r);
      // (a night owl in the hall stays the longer: fewer gaps between one leaving and the next coming)
      stints.push({ who, room: room.id, t0, t1: hour >= NIGHT_HALL && room.kind === 'hall' ? Math.min(end, Math.max(t1, t0 + 5 * Q)) : t1 });
    }
  }
  stints.sort((a, b) => a.t0 - b.t0);
  const segs = new Map<Stint, Seg[]>();
  for (const m of open) roomPlan(m, byRoom.get(m.id)!, stints.filter((s) => s.room === m.id), segs, r);
  return { stints, segs };
}

/** One room's day: its visitors' walks and stays, decided in time order so no two ever head for one point. */
function roomPlan(room: VisitorRoom, pts: readonly LingerPoint[], stints: readonly Stint[], out: Map<Stint, Seg[]>, r: () => number) {
  const busy = new Map<string, number>(pts.map((p) => [p.id, -Infinity]));
  const live = stints.map((s) => ({ s, at: room.door as Pt, point: null as LingerPoint | null, next: s.t0, seen: new Set<string>(), done: false }));
  for (const v of live) out.set(v.s, []);
  for (;;) {
    let v: (typeof live)[number] | null = null;
    for (const w of live) if (!w.done && (!v || w.next < v.next)) v = w;
    if (!v) return;
    const t = v.next, likes = LIKES[VISITORS[v.s.who][1]], segs = out.get(v.s)!, first = !segs.length;
    const leave = () => {
      const ms = walkMs(dist(v!.at, room.door));
      segs.push({ t0: t, t1: t + ms, walk: true, from: v!.at, to: room.door, point: null, leave: true });
      v!.done = true;
    };
    const free = pts.filter((p) => p !== v!.point && busy.get(p.id)! <= t);
    const weightOf = (p: LingerPoint) => {
      let w = likes.kind[p.kind] * (v!.seen.has(p.id) ? 0.25 : 1);
      // (a chat point whose other half is held: go and talk)
      if (p.kind === 'chat') w *= p.pair && (busy.get(p.pair) ?? -Infinity) > t ? 6 : 0.3;
      return w;
    };
    const p = free.length ? weighted(free.map((q) => [q, weightOf(q)] as const), r) : null;
    if (!p) {
      // (nowhere free: a little longer where it is, else out)
      if (!v.point || v.s.t1 - t < walkMs(dist(v.at, room.door)) + MIN_STAY + 15_000) leave();
      else (busy.set(v.point.id, t + 10_000), segs.push({ t0: t, t1: t + 10_000, walk: false, from: v.at, to: v.at, point: v.point }), (v.next = t + 10_000));
      continue;
    }
    const to: Pt = [p.x, p.z], arrive = t + walkMs(dist(v.at, to));
    const [lo, hi] = STAY_MS[p.kind];
    const stayEnd = Math.min(arrive + (lo + r() * (hi - lo)) * likes.slow, v.s.t1 - walkMs(dist(to, room.door)));
    if (stayEnd - arrive < MIN_STAY) {
      leave();
      continue;
    }
    busy.set(p.id, stayEnd);
    segs.push({ t0: t, t1: arrive, walk: true, from: v.at, to, point: null, ...(first ? { enter: true as const } : {}) });
    const x = r();
    const act = p.kind === 'look' && x < 0.6 ? { at: arrive + (stayEnd - arrive) * (0.3 + 0.4 * r()), a: (x < 0.3 ? 'hop' : x < 0.45 ? 'wave' : 'surprise') as Act } : undefined;
    // (its emotes: the first a little after it arrives, then one every 40 s or so, each over before it moves on)
    const emotes: { at: number; e: Emote }[] = [];
    for (let at = arrive + 4000 + r() * 20_000; at + EMOTE_MS < stayEnd - 1000; at += EMOTE_EVERY + (r() * 2 - 1) * EMOTE_JIT) emotes.push({ at, e: EMOTES[Math.floor(r() * EMOTES.length)] });
    segs.push({ t0: arrive, t1: stayEnd, walk: false, from: to, to, point: p, ...(act ? { act } : {}), ...(emotes.length ? { emotes } : {}) });
    v.seen.add(p.id);
    v.at = to;
    v.point = p;
    v.next = stayEnd;
  }
}

/** The plan's segment of `segs` at t, or null (not in yet, or gone). */
function segAt(segs: readonly Seg[], t: number): Seg | null {
  if (!segs.length || t < segs[0].t0 || t >= segs[segs.length - 1].t1) return null;
  let lo = 0, hi = segs.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (segs[mid].t0 <= t) lo = mid;
    else hi = mid - 1;
  }
  return segs[lo];
}

export interface Crowd {
  /** The visitors in `room` at t (ms: the clock's, Tokyo's day from it), posed; `acts` the acts due since the last
   *  step (play each once: villager3d act). `blocked`: seats a player sits on (a visitor stands by one instead); `me`:
   *  my villager (one standing within WAVE_R of it turns and waves, once a visit). */
  step(t: number, room: string, blocked?: ReadonlySet<string>, me?: Pt | null): { poses: readonly VisitorPose[]; acts: readonly { id: string; act: Act }[] };
  /** A tap on visitor `id` (this phone's): it stops, turns to my villager at `me`, hops; its line (null: not here). */
  tap(id: string, t: number, me: Pt): Line | null;
  /** A find just put on show (a `look` point's exhibitId): that room's visitors turn to it with a start; their lines
   *  call it new for a while. */
  notice(exhibitId: string, t: number): void;
  /** How long (ms) from t till a visitor in `room` next changes (0: one's moving now; Infinity: none due today). */
  nextChange(t: number, room: string): number;
}

interface CrowdOptions {
  rooms: readonly VisitorRoom[];
  points: readonly LingerPoint[];
  /** The walk from one point to another in a room (the points after `from`; [] for a straight line). */
  path(room: string, from: Pt, to: Pt): readonly Pt[];
  /** An exhibit's name as the world writes it (spaced kana: the catch's), or null (off show: the room's lines). */
  name(exhibitId: string): { ja: string; en: string } | null;
  seed?: string;
  /** The lines' randomness (this phone's: which line a tap gets isn't shared). */
  rand?: () => number;
}

interface Local { talk: number; held: Pt | null; faceYaw: number; notice: number; noticeYaw: number; shown: Pt | null; waved: boolean; greet: number; greetYaw: number; lastLine?: string }

export function crowdOf(o: CrowdOptions): Crowd {
  const points = usablePoints(o.points, o.rooms);
  const rand = o.rand ?? Math.random;
  let day = NaN, plan: Plan | null = null;
  const planAt = (t: number) => {
    const d = dayOf(t);
    if (d !== day || !plan) (day = d), (plan = dayPlan(d, o.rooms, points, o.seed)), walks.clear();
    return plan;
  };
  // (a walk's path, found once as it's drawn: its points and lengths)
  const walks = new Map<Seg, { pts: Pt[]; lens: number[]; total: number }>();
  const walkOf = (room: string, s: Seg) => {
    let w = walks.get(s);
    if (!w) {
      const pts = [...o.path(room, s.from, s.to)];
      if (!pts.length || dist(pts[pts.length - 1], s.to) > 1) pts.push(s.to);
      let a = s.from, total = 0;
      const lens = pts.map((b) => {
        const d = dist(a, b);
        a = b;
        total += d;
        return d;
      });
      if (walks.size > 64) walks.clear();
      walks.set(s, (w = { pts, lens, total }));
    }
    return w;
  };
  const local = new Map<string, Local>();
  const localOf = (id: string) => local.get(id) ?? (local.set(id, { talk: -Infinity, held: null, faceYaw: 0, notice: -Infinity, noticeYaw: 0, shown: null, waved: false, greet: -Infinity, greetYaw: 0 }), local.get(id)!);
  const fresh = new Map<string, number>();
  const pending: { id: string; act: Act }[] = [];
  const poses = new Map<string, VisitorPose>();
  const out: VisitorPose[] = [];
  const acts: { id: string; act: Act }[] = [];
  let lastT = -Infinity, lastRoom = '';

  /** Where the plan has a visitor at t (no local overlay). */
  function planned(st: Stint, s: Seg, t: number, blocked: ReadonlySet<string> | undefined, into: VisitorPose) {
    const [id, personality] = VISITORS[st.who];
    into.id = id;
    into.personality = personality;
    into.speed = 0;
    into.fade = 1;
    into.point = s.point;
    into.emote = s.emotes?.find((e) => t >= e.at && t < e.at + EMOTE_MS)?.e ?? null;
    if (s.walk) {
      const w = walkOf(st.room, s), dur = s.t1 - s.t0, k = Math.min(1, (t - s.t0) / dur);
      let d = k * w.total, a = s.from, i = 0;
      for (; i < w.pts.length - 1 && d > w.lens[i]; i++) (d -= w.lens[i]), (a = w.pts[i]);
      const b = w.pts[i], f = w.lens[i] ? Math.min(1, d / w.lens[i]) : 1;
      into.x = a[0] + (b[0] - a[0]) * f;
      into.z = a[1] + (b[1] - a[1]) * f;
      into.yaw = yawTo(a, b);
      into.state = 'walk';
      into.speed = (w.total / dur) * 1000;
      if (s.enter) into.fade = Math.min(1, (t - s.t0) / FADE_MS);
      if (s.leave) into.fade = Math.min(1, (s.t1 - t) / FADE_MS);
      return;
    }
    const p = s.point!;
    into.x = p.x;
    into.z = p.z;
    into.yaw = p.faceYaw;
    if (p.kind === 'sit' && blocked?.has(p.id)) {
      const at = p.from ?? [p.x, p.z];
      (into.x = at[0]), (into.z = at[1]), (into.state = 'stand');
    } else if (p.kind === 'chat') {
      const other = plan!.stints.find((q) => q !== st && q.room === st.room && segAt(plan!.segs.get(q)!, t)?.point?.id === p.pair);
      into.state = other ? 'chat' : 'stand';
    } else into.state = p.kind;
  }

  /** The room's visitors at t with their stints and segments. */
  function here(t: number, room: string): [Stint, Seg][] {
    const pl = planAt(t), res: [Stint, Seg][] = [];
    for (const st of pl.stints) {
      if (st.t0 > t) break;
      if (st.room !== room || st.t1 + 120_000 < t) continue;
      const s = segAt(pl.segs.get(st)!, t);
      if (s) res.push([st, s]);
    }
    return res;
  }

  return {
    step(t, room, blocked, me) {
      out.length = 0;
      acts.length = 0;
      const dt = room === lastRoom ? Math.min(250, Math.max(0, t - lastT)) : 0;
      for (const [st, s] of here(t, room)) {
        const id = VISITORS[st.who][0];
        let p = poses.get(id);
        if (!p) poses.set(id, (p = { id, personality: VISITORS[st.who][1], x: 0, z: 0, yaw: 0, state: 'stand', speed: 0, fade: 1, point: null, emote: null }));
        planned(st, s, t, blocked, p);
        const l = localOf(id);
        if (t < l.talk && l.held) {
          (p.x = l.held[0]), (p.z = l.held[1]), (p.yaw = l.faceYaw), (p.state = 'talk'), (p.speed = 0), (p.fade = 1), (p.emote = null);
          l.shown = l.held;
        } else if (l.shown) {
          // (back onto the plan after a talk, at a stroll's pace)
          const gap = dist(l.shown, [p.x, p.z]);
          if (gap < 0.5 || !dt) l.shown = null;
          else {
            const k = Math.min(1, (CATCH * dt) / 1000 / gap);
            const at: Pt = [l.shown[0] + (p.x - l.shown[0]) * k, l.shown[1] + (p.z - l.shown[1]) * k];
            (p.yaw = yawTo(l.shown, [p.x, p.z])), (p.x = at[0]), (p.z = at[1]), (p.state = 'walk'), (p.speed = CATCH);
            l.shown = k >= 1 ? null : at;
          }
          l.held = null;
        } else if (t < l.notice && p.state !== 'sit' && p.state !== 'walk') p.yaw = l.noticeYaw;
        else if (p.state !== 'sit' && p.state !== 'walk' && p.fade === 1) {
          // (my villager come close: a turn and a wave, once a visit)
          if (me && !l.waved && dist(me, [p.x, p.z]) < WAVE_R) {
            l.waved = true;
            l.greet = t + WAVE_MS;
            l.greetYaw = yawTo([p.x, p.z], me);
            acts.push({ id, act: 'wave' });
          }
          if (t < l.greet) p.yaw = l.greetYaw;
        }
        // (an emote of the plan's, once, only if it came due just now in this room)
        if (s.act && dt && s.act.at > lastT && s.act.at <= t && t >= l.talk) acts.push({ id, act: s.act.a });
        out.push(p);
      }
      for (const a of pending) if (out.some((p) => p.id === a.id)) acts.push(a);
      pending.length = 0;
      lastT = t;
      lastRoom = room;
      return { poses: out, acts };
    },
    tap(id, t, me) {
      const v = VISITORS.find((x) => x[0] === id);
      if (!v) return null;
      for (const m of o.rooms) {
        const hit = here(t, m.id).find(([st]) => VISITORS[st.who][0] === id);
        if (!hit) continue;
        const [st, s] = hit, p = poses.get(id) ?? ({} as VisitorPose);
        const l = localOf(id), was = t < l.talk ? l.held : l.shown;
        planned(st, s, t, undefined, p);
        const at: Pt = was ?? [p.x, p.z];
        l.held = at;
        l.talk = t + TALK_MS;
        l.faceYaw = yawTo(at, me);
        pending.push({ id, act: 'hop' });
        // what it says: of what it's looking at, new or not; else of where it sits, talks or strolls
        const ex = s.point?.kind === 'look' && s.point.exhibitId ? s.point.exhibitId : null;
        const name = ex ? o.name(ex) : null;
        // (before a sea creatures' tank: the sea's lines)
        const kind: RoomKind = s.point?.kind === 'look' && SEA_TANK_POINTS.has(s.point.exhibitId ?? '') ? 'sea' : m.kind;
        const ctx: LineContext = name ? (t - (fresh.get(ex!) ?? -Infinity) < FRESH_MS ? 'new' : 'look')
          : s.point?.kind === 'sit' ? 'sit' : s.point?.kind === 'chat' ? 'chat' : kind;
        const line = visitorLine(v[1], ctx, rand, l.lastLine, name ?? undefined, kind);
        l.lastLine = line.key;
        return line;
      }
      return null;
    },
    notice(exhibitId, t) {
      fresh.set(exhibitId, t);
      const p = points.find((q) => q.exhibitId === exhibitId);
      if (!p) return;
      for (const [st] of here(t, p.room)) {
        const id = VISITORS[st.who][0], l = localOf(id), at = poses.get(id);
        l.notice = t + NOTICE_MS;
        l.noticeYaw = at ? yawTo([at.x, at.z], [p.x, p.z]) : p.faceYaw;
        pending.push({ id, act: 'surprise' });
      }
    },
    nextChange(t, room) {
      let next = Infinity;
      for (const [st, s] of here(t, room)) {
        const l = local.get(VISITORS[st.who][0]);
        if (s.walk || l?.shown || (l && t < l.talk + 100)) return 0;
        next = Math.min(next, s.t1 - t, s.act && s.act.at > t ? s.act.at - t : Infinity, l && l.notice > t ? l.notice - t : Infinity, l && l.greet > t ? l.greet - t : Infinity);
        // (an emote's bubble coming or going)
        for (const e of s.emotes ?? []) if (e.at + EMOTE_MS > t) next = Math.min(next, e.at > t ? e.at - t : e.at + EMOTE_MS - t);
      }
      // (the next to come in)
      const pl = planAt(t);
      for (const st of pl.stints) if (st.room === room && st.t0 > t) return Math.min(next, st.t0 - t);
      return next;
    }
  };
}

