// The island's decorations (docs/design.md "Decorating"): the layout's objects of the decorations' kinds, drawn by the
// 3D island (world3d/objects.ts) and arranged in /editor (docs/island-layout.md "The editor"); the walk has them already
// (layout/nav.ts). What's left of them here: each one's tap areas for the 3D pick and the canvas router. A tap jiggles
// it where it stands (my villager turns to it, no walk), but a seat or a piece of the gym one uses (`sit`: IslandScene
// sitOn, island/sitting.ts) has my villager walk up to it and on. A room's piece put outdoors answers as in a room
// (tent/toggles.ts): an instrument walked up to and played (its riff and the rooms' pose: islandPlay.ts), a toy's
// squeak, a gadget's cue and flourish, a clock's time, a bin's toss and a shed's look inside said over my villager
// (`say`); nothing switches (the layout keeps no piece's state). The partner's change, just made, puffs where it
// lands (a 3D puff: fx3d), their villager turning to it.
import { art } from '#lib/art.ts';
import { cue } from '#lib/sound/cues.ts';
import type { World } from './camera.svelte.ts';
import { decorArt, decorH, decorPlace, DECOR_KINDS, type Facing } from '#lib/world/decor.ts';
import { partnerTurnTo, sitTo, turnTo } from './avatar.ts';
import { livePos } from '../motion/director.svelte.ts';
import { playSpotOf, yawTo } from './sitting.ts';
import { startPlay } from './islandPlay.ts';
import { archTiles, walkable } from '#lib/layout/nav.ts';
import { echo3d } from './echo3d.ts';
import { site } from './site.svelte.ts';
import { layout } from '#lib/store/layout.svelte.ts';
import { objMid } from '#lib/layout/model.ts';
import { isOutdoor } from '#lib/layout/outdoor.ts';
import { castMe } from '#lib/ui-state/cast.ts';
import { fx3d } from '#lib/world/fx3d.ts';
import { tap, type Tap3 } from '../world3d/things3.ts';
import { familyOf, gadgetOf, insideOf, isGadget, isInstrument, playFrom, PLAY_MS, type Instrument } from '../tent/toggles.ts';

/** A decoration as placed: its spot (u, its feet; `lift` on a table's top), its kind and facing. */
export type Placed = { id: string; item: string; x: number; z: number; lift: number; f: Facing };

const KINDS: ReadonlySet<string> = new Set(DECOR_KINDS);
/** Whether a layout kind is a decoration's: the island's own (DECOR_KINDS, fixed at load) or the outdoor catalogue's
 *  (`nh-<code>`: its kinds join the catalogue only once its table is in, after this module loads). */
export const isDecorKind = (k: string): boolean => KINDS.has(k) || isOutdoor(k);
const lists = new WeakMap<World, () => readonly Placed[]>();
/** The decorations on World `w`'s island (none while the island isn't up). */
export const decorOf = (w: World): readonly Placed[] => lists.get(w)?.() ?? [];

/** A render stands on its feet point (decorPlace), its height decorH; its width the art's, else the model's box (the
 *  turned looks and a pack's kinds have no 2D art, only the 3D island draws them): left and bottom off the feet (u). */
function look(item: string, f: Facing) {
  const h = decorH(item, f), a = art(decorArt(item, f)), p = decorPlace(item, f);
  const wd = a ? (h * a.w) / a.h : p?.mu ? (h * p.mu[0]) / p.mu[1] : h;
  return { h, wd, l: p ? -p.ax * wd : 0, b: p ? -(1 - p.ay) * h : 0 };
}

/** Its tap areas (things3 Tap3): its body, and its reach (its middle down to 4u under it, at least 45 px either way). */
function areas(p: Placed, act: () => void): Tap3[] {
  const l = look(p.item, p.f), n = { kind: 'decor', id: p.id, x: p.x, z: p.z, lift: p.lift, h: l.h, act }, mid = l.l + l.wd / 2;
  return [
    { ...n, part: 'art', l: l.l, r: l.l + l.wd, b: l.b, t: l.b + l.h },
    { ...n, part: 'reach', l: mid - l.wd / 2, r: mid + l.wd / 2, b: l.b - 4, t: l.b + l.h, min: [45, 45, 'bottom'] }
  ];
}

/** The decorations on island `w` (call in IslandScene's script: its effects live with it). `sit`: a tap on a seat or a
 *  gym piece (its id), true when my villager went to it. */
export function useDecor(w: World, o: { sit: (id: string) => boolean; say?: (text: string) => void }): void {
  // (a thing on a table's top: there, over the ground: layout/tops.ts, the 3D island's own, loaded with it: never in the
  // first load)
  let topSpot = $state<typeof import('#lib/layout/tops.ts').topSpot | null>(null);
  $effect(() => {
    if (!topSpot && [...(site.layout?.objects.values() ?? [])].some((o) => o.on)) void import('#lib/layout/tops.ts').then((m) => (topSpot = m.topSpot));
  });
  // (an arch over water on its posts' banks: layout/height.ts standLift, the ground's field, loaded with an arch)
  let standLift = $state<typeof import('#lib/layout/height.ts').standLift | null>(null);
  $effect(() => {
    const l = site.layout;
    if (!standLift && l && [...l.objects.values()].some((o) => isOutdoor(o.k) && archTiles(l, o))) void import('#lib/layout/height.ts').then((m) => (standLift = m.standLift));
  });
  const items = $derived.by((): readonly Placed[] => {
    const l = site.layout;
    if (!l) return [];
    return [...l.objects.values()].filter((o) => isDecorKind(o.k)).map((o) => {
      const top = o.on && topSpot ? topSpot(l, o) : null, [x, z] = top ? [top.x, top.z] : objMid(l, o);
      return { id: o.id, item: o.k, x: Math.round(x), z: Math.round(z), lift: top?.lift ?? standLift?.(l, o) ?? 0, f: o.f as Facing };
    });
  });
  /** A tap: a seat or a gym piece is walked up to and on (all taken: its boop); else it jiggles and mine turns to it. */
  function tapped(p: Placed) {
    if (o.sit(p.id)) return;
    echo3d(p.id);
    // a room's piece put outdoors (an `nh-<code>`: tent/toggles.ts)
    const code = p.item.slice(3), fam = p.item.startsWith('nh-') ? familyOf(code) : null, top = p.lift + look(p.item, p.f).h;
    turnTo(p.x);
    if (isGadget(fam)) {
      const g = gadgetOf(code, fam);
      cue(g.cue);
      if (g.spark) fx3d(g.spark === 'twinkle' ? 'sparkle' : g.spark, p.x, p.z, top);
      return;
    }
    if (fam === 'clock' || fam === 'bin' || fam === 'closet') {
      cue(fam === 'clock' ? 'room-tick' : fam === 'bin' ? 'room-toss' : 'room-door');
      if (fam === 'bin') fx3d('dust', p.x, p.z, top);
      const n = lines++;
      void import('../tent/says.ts').then((m) => o.say?.(fam === 'clock' ? m.timeLine() : fam === 'bin' ? m.tossLine(n) : m.peekLine(insideOf(code), n)));
      return;
    }
    if (isInstrument(fam)) return play(p, code, fam);
    cue(fam === 'toy' ? 'room-toy' : 'tick');
  }
  /** An instrument: up to it (its `from` side's step, else another's: sitting.ts playSpotOf), turned to it and its riff
   *  played (tent/playPose.ts, the rooms' own pose, this phone's: islandPlay.ts), ♪ over it; with nowhere to stand or no
   *  way there, its riff where it is. */
  function play(p: Placed, code: string, fam: Instrument) {
    const l = site.layout, g = site.nav, o = l?.objects.get(p.id), top = p.lift + look(p.item, p.f).h;
    const here = livePos('mine'), spot = l && g && o && !p.lift ? playSpotOf(l, o, playFrom(code, fam), (q) => walkable(g, q[0], q[1]), here) : null;
    const start = () => {
      const at = livePos('mine');
      startPlay('mine', fam, PLAY_MS, yawTo(at, [p.x, p.z]));
      cue(`room-play-${fam}`);
      fx3d('notes', p.x, p.z, top);
    };
    if (spot && Math.hypot(spot[0] - here[0], spot[1] - here[1]) > 2 && sitTo(spot, start) !== null) return;
    start();
  }
  let lines = 0;
  $effect(() => tap(w, items.flatMap((p) => areas(p, () => tapped(p))))());

  // the partner's change on the layout, just made (any piece they put down or moved): a puff where it stands, their
  // villager turning to it
  $effect(() =>
    layout.on(({ diff, who, live }) => {
      if (!live || who === castMe()) return;
      const p = [...diff.objects.add, ...diff.objects.move].at(-1);
      if (!p) return;
      const [x, z] = objMid(layout.current, p);
      fx3d('puff', x, z, 4);
      partnerTurnTo(x, who);
    })
  );

  lists.set(w, () => items);
}
