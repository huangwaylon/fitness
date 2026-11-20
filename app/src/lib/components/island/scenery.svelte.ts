// The island's still scenery (docs/design.md "World"): the trees that aren't goal trees (oaks, cedars, palms, bamboo),
// the bushes (the hedge of the month, the plumeria at the beach, the campsite's hollies), the props (lamps, lanterns,
// rocks), the fixed decor (fixedDecor.ts) and the buildings, all drawn by the 3D island (world3d/: IslandScene's
// scenery3 / pieces3; the campfire's flames its fx3d 'flame'). What's left of them here: each one's tap areas for the 3D
// pick and the canvas router (a bush, a tree's leaves and trunk, the campfire, a seat, a fixed piece; a building's body:
// `onbuilding`), the shishi-odoshi's tipping, a fixed piece's speaker (the snowboy's line) and the list for the e2e's
// hooks (Island3D: scenery's pieces).
import { art, treeArt } from '#lib/art.ts';
import type { Season } from '#lib/ui-state/theme.svelte.ts';
import type { Foliage } from '#lib/ui-state/season.ts';
import { BUILDINGS, HEDGE_XS, HEDGE_Z, type BuildingId, type Scenery } from '#lib/world/world.ts';
import type { Piece } from '#lib/world/fixedDecor.ts';
import type { SaySpeaker } from '#lib/world/say.ts';
import { FIRE_AT, hedgePair, sceneryKey, type Tod } from './scene.ts';
import { sceneSfx } from './sceneTaps.ts';
import type { World } from './camera.svelte.ts';
import { tap, thing, type Tap3 } from '../world3d/things3.ts';
import PLACES from '#lib/world/models.json';
import { pose3d } from './echo3d.ts';
import { site } from './site.svelte.ts';
import { sitLook } from './sitting.ts';
import { footprint } from '#lib/world/nav.ts';
import { HOME_OF } from '#lib/world/layoutWorld.ts';

/** A fixed decor piece as placed today: a scenery thing that is also its own fixture (its id). */
type Fixture = Scenery & { fixture: string };
/** What the e2e's hooks read (Island3D's chunk makes their pieces of it). */
export type SceneryNow = {
  scenery: readonly Scenery[];
  fixtures: readonly Fixture[];
  buildings: typeof BUILDINGS;
  keyOf: (s: Scenery) => string;
  buildingLook: (key: string) => string;
  tipped: boolean;
  lit: boolean;
};

const lists = new WeakMap<World, () => SceneryNow>();
/** The scenery on World `w`'s island now (null while the island isn't up). */
export const sceneryOf = (w: World): SceneryNow | null => lists.get(w)?.() ?? null;
const speakers = new WeakMap<World, (id: string) => SaySpeaker | null>();
/** A fixed decor piece (by id) as a speaker (a balloon stands by its art's box on screen), or null (not out today). */
export const pieceSpeaker = (w: World, id: string): SaySpeaker | null => speakers.get(w)?.(id) ?? null;

/** A render stands on its feet (or door) point (scripts/models.ts: models.json), not its box's bottom centre. */
const P = PLACES as unknown as Record<string, { ax: number; ay: number; mu?: [number, number]; inset?: [number, number, number, number] }>;
const BUSH_H = 40;
/** A thing's width: its art's, else its model's box (models.json mu: a piece only the 3D island draws has no 2D art). */
function wOf(key: string, h: number) {
  const a = art(key), m = P[key]?.mu;
  return a ? (h * a.w) / a.h : m ? (h * m[0]) / m[1] : h;
}
/** The oak's trunk and canopy are their own renders (else the one image's box, cut as the icon was). */
const layered = (key: string) => !!art(`${key}-trunk`);
/** A tree's trunk tap area round its foot, as shares of its height (wide, tall): the trunk and its base down to the
 *  ground, at least 45 × 48 px; the leaves have their own. */
const TRUNK_HIT: Partial<Record<Scenery['kind'], readonly [number, number]>> = { oak: [0.32, 0.6], cedar: [0.24, 0.42], palm: [0.3, 0.72] };
const trunkHit = (s: Scenery, part: string) => (part === 'trunk' || (part === 'body' && s.kind !== 'oak') ? TRUNK_HIT[s.kind] : undefined);
/** A tree's leaves' tap area in its art (left, right, top, bottom shares). */
const LEAVES: Partial<Record<Scenery['kind'], readonly [number, number, number, number]>> = { oak: [0.08, 0.08, 0.02, 0.4], cedar: [0.16, 0.16, 0.02, 0.32], palm: [0.06, 0.06, 0, 0.58] };
/** An icon oak's trunk and canopy cut from its one image (their shares of its box: top, right, bottom, left). */
const CUT = { trunk: [53, 12, 0, 12], canopy: [0, 0, 33, 0] } as const;

/** A thing's art box (u, round its foot: its feet point's, flipped) and what clips it (its layer's inset, an icon oak's
 *  cut). */
function artBox(key: string, h: number, flip = false, cut: 'inset' | 'trunk' | 'canopy' | null = null) {
  const p = P[key], wd = wOf(key, h), l = p ? -(flip ? 1 - p.ax : p.ax) * wd : -wd / 2, b = p ? -(1 - p.ay) * h : 0;
  const box = { l, r: l + wd, b, t: b + h }, i = cut === 'inset' ? P[key]?.inset : cut ? CUT[cut] : undefined;
  if (!i) return { box, clip: undefined };
  const [it, ir, ib, il] = flip && cut === 'inset' ? [i[0], i[3], i[2], i[1]] : i;
  return { box, clip: { l: l + (wd * il) / 100, r: l + wd - (wd * ir) / 100, t: b + h - (h * it) / 100, b: b + (h * ib) / 100 } };
}

/** The scenery on island `w` (call in IslandScene's script: its effects live with it). */
export function useScenery(w: World, o: {
  season: () => Season; foliage: () => Foliage; month: () => number; tod: () => Tod;
  /** The day's scenery (its seasonal swaps) and the fixed decor's pieces (IslandScene's scenery3 / pieces3). */
  scenery: () => readonly Scenery[]; pieces: () => readonly Piece[];
  /** Nothing of the island's own life runs (the page hidden, a sheet over it). */
  idle: () => boolean;
  onbuilding: (id: BuildingId) => void;
}): void {
  // (world.ts's values follow the island's layout: site.rev)
  const hedge = $derived.by((): Scenery[] => {
    void site.rev;
    const [a, b] = hedgePair(o.month());
    return HEDGE_XS.map((x, i) => ({ id: `hedge-${i}`, kind: 'bush', key: `bushes/${i % 2 ? b : a}`, x, z: HEDGE_Z, h: BUSH_H }));
  });
  const scenery = $derived([...o.scenery(), ...hedge]);
  const fixtures = $derived(o.pieces().map((p): Fixture => ({ id: p.id, kind: 'prop', key: p.key, x: p.x, z: p.z, h: p.h, fixture: p.id })));
  const buildings = $derived((void site.rev, BUILDINGS));
  /** The winter look: a derived one (sceneryKey) or a render's own (<key>-winter: NH's snowy model). */
  const wintry = (k: string) => (o.season() === 'winter' && !k.endsWith('-winter') && art(`${k}-winter`) ? `${k}-winter` : k);
  const keyOf = (s: Scenery) => (s.kind === 'oak' ? treeArt(o.foliage()) : wintry(sceneryKey(s.key, o.season(), o.month())));

  /** A thing's tap areas (things3 Tap3, world3d/pick3d.ts), in u: its art as what it is (a bush, the campfire, a seat;
   *  a fixed piece, a seat too where one sits on it), a tree's leaves (an oak's canopy, 14u nearer than its trunk) and
   *  its trunk. */
  function areas(s: Scenery, part: 'body' | 'trunk' | 'canopy', fixture?: string): Tap3[] {
    const base = fixture ? s.key : keyOf(s), key = part !== 'body' && layered(base) ? `${base}-${part}` : base;
    const { box, clip } = artBox(key, s.h, s.flip, layered(base) ? 'inset' : part === 'body' ? null : part);
    const n = { id: s.id, x: s.x, z: s.z, h: s.h, model: true, dz: part === 'canopy' ? -14 : 0 }, out: Tap3[] = [];
    const roles = fixture
      ? [...(sitLook(key) && fixture !== 'shishi' ? [{ kind: 'sit', id: s.id }] : []), { kind: 'fixture', id: fixture }]
      : [...(s.kind === 'bush' ? [{ kind: 'bush', id: s.id }] : []), ...(FIRE_AT[s.key] ? [{ kind: 'campfire', id: s.id }] : []), ...(sitLook(key) ? [{ kind: 'sit', id: s.id }] : [])];
    if (roles.length) out.push({ ...n, ...box, clip, kind: roles[0].kind, id: roles[0].id, part: 'art', also: roles.slice(1) });
    const tree = s.kind === 'cedar' || s.kind === 'palm', lv = (tree || part === 'canopy') && LEAVES[tree ? s.kind : 'oak'];
    if (lv) {
      const wd = box.r - box.l, ht = box.t - box.b;
      out.push({ ...n, kind: 'tree', part: 'leaves', l: box.l + wd * lv[0], r: box.r - wd * lv[1], t: box.t - ht * lv[2], b: box.b + ht * lv[3], round: [0.42, 0.42], clip });
    }
    const th = trunkHit(s, part);
    if (th) out.push({ ...n, kind: 'tree', part: 'trunk', l: (-th[0] * s.h) / 2, r: (th[0] * s.h) / 2, b: -4, t: th[1] * s.h - 4, min: [45, 48, 'bottom'], round: [0.4, 0.3], base: s.id });
    return out;
  }
  // (an oak is two layers, its trunk and its canopy; a building's tap area is its whole body as the camera sees it: its
  // model's silhouette, or its footprint up to its height before that, nothing past it)
  $effect(() =>
    tap(w, [
      ...scenery.flatMap((s) => (s.kind === 'oak' ? [...areas(s, 'trunk'), ...areas(s, 'canopy')] : areas(s, 'body'))),
      ...fixtures.flatMap((f) => areas(f, 'body', f.fixture)),
      ...buildings.map((b): Tap3 => {
        const f = footprint(b.id);
        return { kind: 'building', id: b.id, x: b.x, z: b.z, l: 0, r: 0, b: 0, t: 0, body: { x0: f.x0, x1: f.x1, z0: f.y0, z1: f.y1, h: b.h, shape: HOME_OF[b.id] }, act: () => o.onbuilding(b.id) };
      })
    ])()
  );

  // The shishi-odoshi (docs/design.md "Decor"): every 15–25 s while it's in view, and on a tap (SceneTaps), its tube
  // tips (NH's own model posed: deco/shishiodoshi-tip), spills and knocks back on the stone: "kon". Local and cosmetic.
  let tipped = $state(false);
  const TIP_MS = 700;
  const shishi = () => fixtures.find((f) => f.fixture === 'shishi');
  const seen = () => ((s) => !!s && w.inView(s.x, s.z, 20))(shishi());
  $effect(() => {
    let timer = 0, tipT: ReturnType<typeof setTimeout> | undefined;
    const tip = () => {
      if (tipped || !shishi()) return;
      tipped = true;
      pose3d('shishi', 'deco/shishiodoshi-tip');
      tipT = setTimeout(() => {
        tipped = false;
        pose3d('shishi', null);
        if (seen()) sceneSfx('kon');
      }, TIP_MS);
    };
    const next = () => (timer = window.setTimeout(() => (document.hidden || o.idle() || !seen() || tip(), next()), 15_000 + Math.random() * 10_000));
    next();
    document.addEventListener('island:shishi', tip);
    return () => (clearTimeout(timer), clearTimeout(tipT), document.removeEventListener('island:shishi', tip));
  });

  // The campfire burns at dusk and night: the 3D island's flame cards rise from its logs (fx3d 'flame'; its glow,
  // halo, pool and point light are the canvas's own).
  const lit = $derived(o.tod() === 'night' || o.tod() === 'dusk');
  $effect(() => {
    if (!lit) return;
    const offs = scenery.filter((s) => FIRE_AT[s.key]).map((f) => thing(w, { x: f.x, z: f.z, h: f.h, m3: { key: '', id: `flame-${f.id}`, emit: { kind: 'flame', every: 120, lift: f.h * FIRE_AT[f.key] * 0.5, size: 0.9 } } })());
    return () => offs.forEach((off) => off());
  });

  lists.set(w, () => ({ scenery, fixtures, buildings, keyOf, buildingLook: (k) => sceneryKey(k, o.season(), o.month()), tipped, lit }));
  speakers.set(w, (id) => {
    const on = () => fixtures.find((f) => f.id === id);
    if (!on()) return null;
    return {
      get isConnected() {
        return !!on();
      },
      // (its art's box stood on its foot: across as the camera scales it there, up as the 3D camera sees its height)
      getBoundingClientRect() {
        const f = on();
        if (!f) return new DOMRect();
        const { box } = artBox(f.key, f.h), [cx] = w.clientAt(f.x, f.z), k = w.scaleAt(f.x, f.z) * w.view.s;
        const top = w.clientAt(f.x, f.z, box.t)[1], bottom = w.clientAt(f.x, f.z, Math.max(0, box.b))[1];
        return new DOMRect(cx + box.l * k, top, (box.r - box.l) * k, Math.max(1, bottom - top));
      }
    };
  });
}
