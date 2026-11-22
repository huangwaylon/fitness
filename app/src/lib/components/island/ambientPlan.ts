// Where ambient life has the villagers nobody's phone moves (docs/backend.md#ambient-life "Positions"): a villager
// woken by a tap while its person is away (and the guest's, woken) goes on its slots' outings on every phone, but no
// phone tells the others where it walks. So where it is comes from the schedule alone: the slots from its wake to now,
// each decided by ambient.ts villagerBeats on a world built here from shared inputs only (its rest, the relay's
// wake, who is here, the points of interest), never from what this phone happened to play. A phone that skipped
// slots (hidden, under a sheet, the slow mode) gets the same walks, and joins them where they are by now
// (trackPlay.ts). An outing ends back at its rest before the wake runs out, so it falls asleep where every phone,
// one that saw none of it too, has it. Pure: the walk graph comes in as `route`.
import { DECIDE_MS, SLOT_MS, slotAt, villagerBeats, type AmbientWorld, type Poi, type VillagerBeat, type VillagerState } from './ambient.ts';
import { SPEED } from '#lib/world/speed.ts';
import type { PersonId, Who as Islander } from '#lib/types.ts';
import type { Pt } from '#lib/world/world.ts';

/** One stretch of a track: from `from` along `pts`, set off at `t0` (the island's clock with the relay's offset),
 *  taking `ms`, then standing `stay` ms at its end (`kind`: what's there, wander.ts PoiKind; `face` there). */
export interface Leg {
  t0: number;
  from: Pt;
  pts: Pt[];
  ms: number;
  stay: number;
  kind?: string;
  face?: 'home';
}
/** A walk somewhere and back on the schedule: its legs and when it's over. */
export interface Track {
  key: string;
  legs: Leg[];
  end: number;
}

/** Where a track has its walker at `t`: on leg `leg` (−1: not yet off; legs.length: over), walking or standing, the
 *  point, the rest of that leg's way and how long it still takes (ms). */
export function trackAt(tr: Track, t: number): { leg: number; walking: boolean; at: Pt; rest: Pt[]; left: number } {
  const first = tr.legs[0];
  if (!first || t < first.t0) return { leg: -1, walking: false, at: first?.from ?? [0, 0], rest: [], left: 0 };
  for (let i = 0; i < tr.legs.length; i++) {
    const l = tr.legs[i], end = l.pts.length ? l.pts[l.pts.length - 1] : l.from;
    if (t < l.t0 + l.ms) {
      const w = along(l.from, l.pts, l.ms, t - l.t0);
      return { leg: i, walking: true, ...w };
    }
    if (t < l.t0 + l.ms + l.stay || i === tr.legs.length - 1) return { leg: t < tr.end ? i : tr.legs.length, walking: false, at: end, rest: [], left: 0 };
  }
  return { leg: tr.legs.length, walking: false, at: first.from, rest: [], left: 0 };
}

/** Along a walk (as the director's: segments share the time by length). */
function along(from: Pt, pts: readonly Pt[], ms: number, t: number): { at: Pt; rest: Pt[]; left: number } {
  const end = pts.length ? pts[pts.length - 1] : from;
  const lens = pts.map((p, i) => Math.hypot(p[0] - (i ? pts[i - 1] : from)[0], p[1] - (i ? pts[i - 1] : from)[1]));
  const len = lens.reduce((s, l) => s + l, 0);
  if (!pts.length || ms <= 0 || t >= ms || len < 1) return { at: end, rest: [], left: 0 };
  let d = (Math.max(0, t) / ms) * len, prev = from;
  for (let i = 0; i < pts.length; i++) {
    if (d <= lens[i]) {
      const k = lens[i] ? d / lens[i] : 1;
      return { at: [prev[0] + (pts[i][0] - prev[0]) * k, prev[1] + (pts[i][1] - prev[1]) * k], rest: pts.slice(i), left: ms - Math.max(0, t) };
    }
    d -= lens[i];
    prev = pts[i];
  }
  return { at: end, rest: [], left: 0 };
}

export interface PlanVillager {
  home: Pt;
  /** Where it stands when it isn't out: its person's last walk's end (the relay's, the same on every phone); for one
   *  whose person is here, where their phone has it going. */
  rest: Pt;
  /** Its person has the island open (their phone moves it, and says so). */
  present: boolean;
  /** Woken by a tap while its person is away: free for the island's life from `from` (past its start's surprise) to
   *  `until`, when it falls asleep (the island's clock with the relay's offset). */
  wake?: { from: number; until: number };
  /** In a room (not on the island). */
  inside?: boolean;
  /** Its person's last walk or act (ambient.ts held). */
  lastIntent?: number;
}

export interface PlanInput {
  villagers: Partial<Record<Islander, PlanVillager>>;
  pois: readonly Poi[];
  phase: AmbientWorld['phase'];
  /** The settled day scores and exercise goals (ambient.ts settledDay). */
  scores: Record<PersonId, number>;
  exercise?: Record<PersonId, boolean>;
  /** The way between two points on the walk graph (null: none). */
  route: (from: Pt, to: Pt) => Pt[] | null;
}

/** An outing is back at its rest this long before its villager's wake runs out (ms). */
const END_MARGIN = 1_000;
const r2 = (p: Pt): Pt => [Math.round(p[0]), Math.round(p[1])];
const len = (from: Pt, pts: readonly Pt[]) => pts.reduce((s, p, i) => s + Math.hypot(p[0] - (i ? pts[i - 1] : from)[0], p[1] - (i ? pts[i - 1] : from)[1]), 0);
const walkMs = (from: Pt, pts: readonly Pt[]) => Math.round((len(from, pts) / SPEED.wander) * 1000);

/** Nobody's phone moves it: its person is away, so it's this phone's schedule (and every other's). */
export const undriven = (v: PlanVillager | undefined): boolean => !!v && !v.present && !v.inside;
/** Awake by a tap at `t` (its wake under way, past the start). */
const woken = (v: PlanVillager, t: number) => !!v.wake && t >= v.wake.from && t < v.wake.until;

/** The world a slot is decided on: each villager where it stands at the slot's decision (out on a track: where that
 *  has it), free when it's awake, on the island and not out. Shared inputs only, so every phone decides the same. */
export function worldAt(input: PlanInput, start: number, tracks: Partial<Record<Islander, Track>>): AmbientWorld {
  const t = start + DECIDE_MS;
  const state = (p: Islander, v: PlanVillager): VillagerState => {
    const tr = tracks[p], out = !!tr && t < tr.end;
    const awake = v.present || woken(v, t);
    return { at: r2(out ? trackAt(tr!, t).at : v.rest), home: v.home, free: awake && !v.inside && !out, present: v.present, lastIntent: v.lastIntent };
  };
  const { A, B, G } = input.villagers;
  const villagers = { A: state('A', A!), B: state('B', B!) } as AmbientWorld['villagers'];
  // (the guest's while it's in the island's life: its app open, or woken)
  if (G && (G.present || woken(G, t))) villagers.G = state('G', G);
  return { villagers, pois: input.pois, phase: input.phase, scores: input.scores, ...(input.exercise ? { exercise: input.exercise } : {}) };
}

/** An outing as a track from `v`'s rest, set off at `t0`, fitted into its wake (lingers shortened, then the last
 *  stops dropped); null when not even one stop fits or there's no way. */
export function outingTrack(key: string, v: PlanVillager, stops: readonly { node: string; linger: number }[], t0: number, input: PlanInput): Track | null {
  const byNode = new Map(input.pois.map((p) => [p.node, p]));
  const out: { from: Pt; pts: Pt[]; stay: number; kind?: string }[] = [];
  let from = v.rest;
  for (const s of stops) {
    const p = byNode.get(s.node), pts = p && input.route(from, p.at);
    if (!p || !pts?.length) break;
    out.push({ from, pts, stay: s.linger, kind: p.kind });
    from = p.at;
  }
  const budget = (v.wake ? v.wake.until - END_MARGIN : Infinity) - t0;
  while (out.length) {
    const last = out[out.length - 1], end = last.pts[last.pts.length - 1];
    const back = input.route(end, v.rest) ?? [v.rest];
    const walking = out.reduce((s, l) => s + walkMs(l.from, l.pts), 0) + walkMs(end, back);
    const stays = out.reduce((s, l) => s + l.stay, 0);
    if (walking > budget) {
      out.pop();
      continue;
    }
    const k = walking + stays > budget ? (budget - walking) / stays : 1;
    const legs: Leg[] = [];
    let t = t0;
    for (const l of [...out, { from: end, pts: back, stay: 0, kind: undefined as string | undefined }]) {
      const ms = walkMs(l.from, l.pts), stay = Math.floor(l.stay * k);
      const face = l.kind === 'seat' || l.kind === 'bar' || l.kind === 'shore' || l.pts === back ? ('home' as const) : undefined;
      legs.push({ t0: t, from: l.from, pts: l.pts, ms, stay, ...(l.kind ? { kind: l.kind } : {}), ...(face ? { face } : {}) });
      t += ms + stay;
    }
    return { key, legs, end: t };
  }
  return null;
}

/** Each undriven villager's latest track as of `t` (the island's clock with the relay's offset), from the slots of its
 *  wake up to now: none when nobody is woken. */
export function planAt(input: PlanInput, t: number): Partial<Record<Islander, Track>> {
  const tracks: Partial<Record<Islander, Track>> = {};
  const woke = (Object.entries(input.villagers) as [Islander, PlanVillager][]).filter(([, v]) => undriven(v) && v.wake && v.wake.from <= t && t < v.wake.until + SLOT_MS);
  if (!woke.length) return tracks;
  const begin = Math.min(...woke.map(([, v]) => v.wake!.from));
  for (let s = begin - slotAt(begin).into; s + DECIDE_MS <= t; s += SLOT_MS) {
    const { date, slot } = slotAt(s);
    const beats = villagerBeats(worldAt(input, s, tracks), date, slot);
    for (const [p, b] of Object.entries(beats) as [Islander, VillagerBeat][]) {
      const v = input.villagers[p];
      if (b.kind !== 'outing' || !v || !undriven(v) || !woken(v, s + DECIDE_MS)) continue;
      const tr = outingTrack(`${p}:${date}:${slot}`, v, b.stops, s + DECIDE_MS, input);
      if (tr) tracks[p] = tr;
    }
  }
  return tracks;
}
