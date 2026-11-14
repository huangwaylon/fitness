// What the rooms' screens (the tent's and the homes', the shop's, the museum's: RoomShell.svelte their frame) do alike:
// the engine made and set up (a throw the room's failure), the door out, my walk as the relay's `tent` intent, the
// relay's presence, what covers the canvas, and the door the iris opens on.
import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import type { Intent, Pt as WirePt } from '#lib/contract/live-protocol.ts';
import type { Live } from '#lib/sync/live.ts';
import { logError } from '#lib/sync/log.ts';
import { cue } from '#lib/sound/cues.ts';
import { where } from '#lib/store/where.svelte.ts';
import { provideDoor } from '#lib/ui-state/doorTransition.ts';
import { staticUrl } from '#lib/staticUrl.ts';
import { art, artUrl, villagerArt } from '#lib/art.ts';
import { resolveLook } from '#lib/villagers/look.ts';
import { lookOf as wornOf } from '#lib/store/look.ts';
import type { WeekView, Who } from '#lib/types.ts';
import type { Look } from '../tent/engine.ts';
import { person3, type Dirs } from '../person3d/person3d.ts';
import { madeGL } from './madeGL.ts';

/** The villagers' GLBs and the players' parts (person3d). */
export const ROOM_DIRS: Dirs = { villagers: staticUrl('room/villagers3d/'), player: staticUrl('room/player/') };

/** Who draws `w` in the tent's engine (the tent, the homes, the shop: person3d, the look worn; its villager's render
 *  the card till the model is in). */
export function tentLook(w: Who, view: WeekView): Look | null {
  const villager = w === 'G' ? view.guest.villager : view.people[w].villager;
  const person = person3(w, wornOf(w), villager, ROOM_DIRS);
  const l = resolveLook({ villager: person.villager, person: w });
  const key = villagerArt(l.id), a = art(key), url = artUrl(key);
  return a && url ? { url, aspect: a.w / a.h, looksRight: l.looksRight, noMirror: l.noMirror, person: person.has3d ? person : undefined, cardless: person.kind === 'player' } : null;
}

/** The engine made on its canvas (madeGL) and `setup` on it: null and `fail()` (the door opens on the stand-in) if
 *  either throws (a setup's throw logged, its renderer let go of: before eng, nothing else would). */
export async function startRoom<E extends { dispose(): void }>(make: () => E, open: () => boolean, setup: (e: E) => void, fail: () => void): Promise<E | null> {
  let e: E;
  try {
    e = await madeGL(make, open);
  } catch {
    fail();
    return null;
  }
  try {
    setup(e);
  } catch (err) {
    logError('error', err);
    e.dispose();
    fail();
    return null;
  }
  return e;
}

/** The door out: `out()` (on the island just out of this door, on every phone: island/doorOut.ts, then the presence
 *  ended: the others' islands show it there, not where it went in), then the island, with the URL's query but `drop`. */
export function roomExit(out: () => void, drop?: string): () => void {
  let leaving = false;
  return () => {
    if (leaving) return;
    leaving = true;
    cue('scene-bench');
    out();
    const q = new URLSearchParams(location.search);
    if (drop) q.delete(drop);
    void goto(resolve('/') + (q.size ? `?${q}` : '')).finally(() => (leaving = false));
  };
}

/** My walk under way (where it set off, by way of, to, when, how long). */
export type MyWalk = { from: WirePt; via: WirePt[]; to: WirePt; s: number; ms: number };
/** Where my villager is, as the `tent` intent says it: the walk while it's under way (its points rounded, within
 *  ±`lim`), else where it stands. */
export function walkIntent(walk: MyWalk | null, at: WirePt, now: number, lim: number): Extract<Intent, { kind: 'tent' }> {
  const r = (p: WirePt): WirePt => [Math.round(Math.max(-lim, Math.min(lim, p[0]))), Math.round(Math.max(-lim, Math.min(lim, p[1])))];
  const w = walk && now < walk.s + walk.ms ? walk : null;
  return w ? { kind: 'tent', in: true, from: r(w.from), ...(w.via.length ? { via: w.via.map(r).slice(0, 10) } : {}), to: r(w.to), s: Math.round(w.s), ms: Math.round(w.ms) }
    : { kind: 'tent', in: true, to: r(at) };
}

/** The relay's presence in a room: each of `others` there or not (store/where.svelte.ts), then `heard(here, came)`
 *  (`came`: someone arrived, to be told where I am). Its off. */
export function onPresence(relay: Live, others: readonly Who[], heard: (here: readonly Who[], came: boolean) => void): () => void {
  let was: readonly Who[] = [];
  return relay.onStatus((st) => {
    const here = st.connected ? st.here : [], came = here.some((w) => !was.includes(w));
    was = here;
    for (const w of others) where.presence(w, here.includes(w));
    heard(here, came);
  });
}

/** What covers the canvas at its top (`top`'s box) and foot (from `foot`'s top, or that line): the room fits between. */
export function insetsOf(canvas: HTMLElement | undefined, top: HTMLElement | undefined, foot: HTMLElement | number | undefined): { top: number; bottom: number } {
  const rc = canvas?.getBoundingClientRect();
  if (!rc) return { top: 0, bottom: 0 };
  const tb = top?.getBoundingClientRect(), fy = typeof foot === 'number' ? foot : foot?.getBoundingClientRect().top;
  return { top: tb ? Math.max(0, tb.bottom - rc.top) : 0, bottom: fy !== undefined ? Math.max(0, rc.bottom - fy) : 0 };
}

interface Drawn<L> {
  at(who: Who): WirePt | null | undefined;
  villager(who: Who, look: L | null): void;
  put(who: Who, p: WirePt, face?: number): void;
}
/** Each of `others` drawn while they're in this `place` (store/where.svelte.ts `home`), put at `at`'s spot as it
 *  comes; one already drawn stays as it is, walking, sitting or standing. */
export function showOthers<L>(eng: Drawn<L> | null, others: readonly Who[], place: string, look: (w: Who) => L | null, at: Map<Who, WirePt>, face?: (w: Who) => number): void {
  if (!eng) return;
  for (const w of others) {
    const on = where.inTent[w] && where.home[w] === place, fresh = on && !eng.at(w);
    eng.villager(w, on ? look(w) : null);
    if (fresh) eng.put(w, at.get(w)!, face?.(w));
  }
}

interface Seen {
  inView(x: number, y: number, z: number): boolean;
  client(x: number, y: number, z: number): [number, number];
}
/** The room's door (a floor point) for the iris (ui-state/doorTransition.ts), while it's in view. Its off. */
export function roomDoor(eng: () => Seen | null, x: number, z: number): () => void {
  return provideDoor(() => {
    const e = eng();
    return e?.inView(x, 0, z) ? (([cx, cy]) => ({ x: cx, y: cy }))(e.client(x, 0, z)) : null;
  });
}
