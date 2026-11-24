// Beach finds (docs/design.md "Beach finds"), after NH: seashells keep washing up on the front beach (one every 1–2
// minutes, the newest three on the sand), four fossil dig spots (NH's ✕ crack) on the lawn a day, a dug one gone
// till tomorrow (beach.ts DIGS_A_DAY); a message bottle at the water's edge every 8–14 minutes for six; a star fragment on the
// beach the morning after each wish on a shooting star (stars.ts: one per wish, from 5:00, at most 8); in mushroom
// season, mushrooms beside the trees (mushrooms.ts). A tap picks a shell, a fragment or the bottle up (it lifts off the
// sand) or digs a fossil up (a shovel, a puff of earth, a hole), with NH's caption on the catch plate. The first find
// of each shell, fossil and fragment goes to the shared ずかん (`find`); none of it is ベル. Mushrooms are no
// find: picked up, or the rare one dug up (1 in 20 November dig spots) with NH's caption, they go into my pocket to
// sell (contract/pocket.ts goods), as Bunny Day's eggs do.
// Everything derives from the Tokyo date and the time (beach.ts), so both phones see the same island; what either of
// us takes is gone on both (the shared day: docs/backend.md#shared-world, a `pick` claimed at the tap, first wins;
// this phone's own record too, sceneDay.ts), and the partner's pick-up plays here: their villager turns to it, it
// is picked up or dug where it lies, and their line shows. A balloon's present that lands is put on the island for both (`put`), opened by
// either; so is a tree's present (treeGifts.ts: two oaks or cedars a day hold one, put by treeShakes.svelte.ts when shaken),
// which falls out of the canopy and opens into that tree's furniture of the day. Wishes are both people's: a fragment for each.
// Everything lies in the world (world units: beach.ts, mushrooms.ts); the 3D island draws each item (world3d/things3.ts:
// its NH model) and every flourish (a find lifting off, the present's pop and confetti, a fragment's glint, the
// bottle's foam, the shovel and the hole: fx3d). No DOM of its own (R4 step 7). SceneTaps loads this chunk beside the
// 3D island and asks it about each tap after the critters (`tap`, client px). The clock is the scene's minute tick.
//   ?find=bottle | washed | fragment | mushroom | rare-mushroom (dev or test mode): a bottle, a bottle washing in 1.5 s
//   after the island opens, this morning's fragments, a mushroom now, or the next dig spot's rare mushroom (the e2e's
//   hooks); ?seed= varies the island's seed.
import { fx3d } from '#lib/world/fx3d.ts';
import { showCatch } from './catchCard.ts';
import { timers } from './timers.ts';
import { hook, islandSeed } from '#lib/world/devHooks.ts';
import type { World } from './camera.svelte.ts';
import { thing, things3 } from '../world3d/things3.ts';
import { untrack } from 'svelte';
import { i18n, t } from '#lib/i18n/index.ts';
import { jst, minuteNow } from '#lib/time/clock.ts';
import { islandDay } from './ambientClock.ts';
import { addDays } from '#lib/time/dates.ts';
import { recordFind, recordGoods } from '#lib/store/actions.ts';
import { hitWorld, sceneSfx, shownNow } from './sceneTaps.ts';
import { loadNames } from './catchLine.ts';
import { NO_VILLAGER, guardsU, clearAt, stageGeo } from './placement.ts';
import { SHOWN, bareRect, drawn3, hitRect, hitSources, pick, type Seen } from './hitbox.ts';
import { bottleAt, bottleNow, digSpots, findArt, fragmentsOn, shellsAt, type Bottle, type DigSpot, type Fragment, type Shell } from '#lib/world/beach.ts';
import { take, takenOn, wish as addWish, wishes } from '#lib/world/sceneDay.ts';
import { fragmentsDue, wishDays } from '#lib/world/stars.ts';
import { showerNight } from '#lib/world/meteor.ts';
import { eggTime, eventNow } from '#lib/world/events.ts';
import { eggInDig } from '#lib/world/eggs.ts';
import { mushroomSpots, mushroomsOn, rareMushroom, type Mushroom } from '#lib/world/mushrooms.ts';
import { partnerTurnTo, turnTo } from './avatar.ts';
import { world as shared } from '#lib/store/world.svelte.ts';
import { lying, taken as takenBy, takenIds } from '#lib/sync/world-day.ts';
import { tellPartner, type PartnerNews } from './partnerNews.ts';
import { loadCatalogNames } from '#lib/i18n/catalog.ts';
import { ART_IDS } from '../museum/artIds.ts';
import { findKey, findsView } from '#lib/model/finds.ts';
import { week } from '#lib/store/week.svelte.ts';
import { giftTree } from './treeGifts.ts';
import { treeById } from './treeShake.ts';
import { SvelteSet } from 'svelte/reactivity';
import { site } from './site.svelte.ts';
import { offBuildingsAt } from '#lib/world/world.ts';
import { fieldsOf } from '#lib/layout/fields.ts';
import { nextRunUp, washAt, washFrom, washMs, type WashIn } from '#lib/layout/swash.ts';

/** A find as the e2e's hooks list it (things3 probes 'finds'; Island3D adds `shown`): its kind (fossil: a dig spot,
 *  mushroom, present, shell, fragment, bottle), item, uid, a present's tree and fall, its thing's id, its foot (client
 *  px) and its box (its model's silhouette, till that's in a box round its foot). */
export interface FindRow {
  kind: string; id: string | null; uid: string; tree: string | null; fall: boolean; id3: string;
  foot: [number, number]; box: { left: number; top: number; width: number; height: number };
}
/** What SceneTaps asks of the finds. */
export type Finds = {
  tap(px: number, py: number, seen?: Seen): boolean;
  claims(px: number, py: number, seen?: Seen): string | null;
  present(x: number, z: number, art: string, size: number): void;
  wish(): void;
};

/** A present's size where it lies (u), when it wasn't this phone's balloon. */
const PRESENT_U = 30;

/** The day's finds on island `w`: their effects in a root of their own (SceneTaps loads this chunk after the first load
 *  and calls this once it's in: `stop` with the scene). */
export function useFinds(w: World, o: {
  scene: () => HTMLElement | undefined;
  /** Live, not covered by a sheet, page visible. */
  enabled: () => boolean;
}): Finds & { stop: () => void } {
  const { enabled } = o;
  const mount = (fn: () => void | (() => void)) => {
    $effect(() => untrack(fn));
  };
  let api!: Finds;
  const stop = $effect.root(() => {
    const seed = islandSeed();
    const want = hook('find');
    const rand = Math.random;

    /** Bumped when this phone takes something (the lists re-derive). */
    let taken = $state(0);

    const clock = $derived(minuteNow());
    const date = $derived(islandDay());
    /** What's gone today: what this phone took, and every claim in the shared day (mine too: a phone that lost its own
     *  record gets them back in the relay's replay; world-day.ts takenIds). */
    const goneOn = (d: string): Set<string> => {
      const mine = takenOn(d);
      return d === islandDay() ? mine.union(takenIds(shared.day)) : mine;
    };
    /** Both people's wishes for a morning (stars.ts: one fragment each): mine and the partner's. */
    const allWishes = () => {
      const all = { ...wishes() };
      const them = shared.me === 'A' ? 'B' : 'A';
      for (const d of [date, addDays(date, 1)]) {
        const n = shared.wishesOf(them, d);
        if (n) all[d] = (all[d] ?? 0) + n;
      }
      return all;
    };
    const msOfDay = $derived.by(() => {
      const { hour, minute } = jst(clock);
      return (hour * 60 + minute) * 60_000 + clock.getSeconds() * 1000;
    });

    /** This morning's fragments, picked or not (the shells and the bottle keep their distance from where they lay). */
    const allFragments = $derived.by<Fragment[]>(() => {
      void taken;
      const n = want === 'fragment' ? 3 : fragmentsDue(allWishes(), date, jst(clock).hour);
      // after a meteor shower's night (the night before this morning) the season's zodiac fragment is likelier
      return fragmentsOn(date, n, seed, showerNight(addDays(date, -1), seed));
    });
    const shells = $derived.by<Shell[]>(() => {
      void taken;
      const gone = goneOn(date);
      return shellsAt(date, msOfDay, seed, allFragments).filter((s) => !gone.has(s.uid));
    });
    const spots = $derived.by<DigSpot[]>(() => {
      void taken;
      void site.rev;
      return digSpots(date, goneOn(date), seed);
    });
    /** `?find=washed`: the bottle comes 1.5 s after the island opens. */
    let washedIn = $state(false);
    const bottle = $derived.by<Bottle | null>(() => {
      void taken;
      const b = want === 'bottle' || (want === 'washed' && washedIn) ? bottleNow(date, [...allFragments, ...shellsAt(date, msOfDay, seed, allFragments)], seed) : bottleAt(date, msOfDay, seed, allFragments);
      return b && !goneOn(date).has(b.uid) ? b : null;
    });
    const mushrooms = $derived.by<Mushroom[]>(() => {
      void taken;
      void site.rev;
      const gone = goneOn(date);
      const list = want === 'mushroom' ? [{ uid: 'm-demo', id: 'round-mushroom' as const, x: mushroomSpots()[0][0], y: mushroomSpots()[0][1], flip: false }] : mushroomsOn(date, seed);
      return list.filter((m) => !gone.has(m.uid));
    });
    /** Whether a dig spot holds the rare mushroom (`?find=rare-mushroom`: every one). */
    const rare = (s: DigSpot): boolean => want === 'rare-mushroom' || rareMushroom(date, s.uid, seed);
    /** Whether a dig spot holds Bunny Day's earth egg (its celebrations only; `?find=earth-egg`: every one). */
    const egg = (s: DigSpot): boolean =>
      want === 'earth-egg' || (eggTime(eventNow()) && eggInDig(date, s.uid, seed));
    const fragments = $derived.by<Fragment[]>(() => {
      void taken;
      const gone = goneOn(date);
      return allFragments.filter((f) => !gone.has(f.uid));
    });

    const { later, clear } = timers();
    $effect(() => clear);

    // What the waves bring in while you watch (a shell, the bottle, a star fragment) washes up the beach (layout/swash.ts):
    // it waits for the next wave at its stretch of the coast, then rides it in from just past the waterline, straight up
    // the beach to where it lies (~1–1.5 s, easing out), fading in; its model and its tap area move together (the
    // thing's `live`, the model's `wash`: Island3D fades it). The ones already there when the island opens just lie.
    let first = true;
    const washes = new Map<string, WashIn | null>();
    function washOf(uid: string, x: number, z: number): WashIn | null {
      if (washes.has(uid)) return washes.get(uid)!;
      let wi: WashIn | null = null;
      if (!first) {
        const t = performance.now(), l = site.layout;
        const way = l ? washFrom(fieldsOf(l), x, z) : null;
        // (the wave's clock is the water's: world3d/water.ts waterU.uTime, the frames' time in s)
        wi = way ? { from: way.from, to: [x, z], t0: t + nextRunUp((t / 1000) % 3600, ...way.coast) * 1000, ms: washMs(way.dist) } : { from: [x, z], to: [x, z], t0: t, ms: 1200 };
        const ms = wi.ms;
        later(() => later(w.moveStart('wash'), ms + 100), wi.t0 - t);
      }
      // only what lies there now kept (a shell comes every 60–120 s all day and the tide takes the oldest: ~1000 a day)
      if (washes.size >= 16) {
        const here = new Set([...shells, ...fragments, ...(bottle ? [bottle] : [])].map((x) => x.uid));
        for (const k of washes.keys()) if (!here.has(k)) washes.delete(k);
      }
      washes.set(uid, wi);
      return wi;
    }
    /** A washing-in thing's live position (world x, z) now. */
    const washPos = (wi: WashIn) => (): readonly [number, number] => {
      const p = washAt(wi, performance.now());
      return [p.x, p.z];
    };
    /** Where a thing lies now (world x, z): riding a wave in, or where it lies. */
    const posOf = (uid: string, x: number, z: number): readonly [number, number] => {
      const wi = washes.get(uid);
      return wi ? washPos(wi)() : [x, z];
    };

    // ---------- the moment of a find (world x, and y = the world's z; `up` units above the ground) ----------
    let seq = 0;
    /** The plate for world point (x, z), `up` units above it, `delay` ms after the tap (in the bottom stack, its icon
     *  popping up from where that point is on screen then); a first find of its kind gets a second page saying it's in the ずかん. */
    function plate(x: number, z: number, up: number, art: string, text: () => string, delay = 0, added = false) {
      const names = loadNames().catch(() => {});
      later(() => void names.then(() => {
        const [sx, sy] = w.screenU(x, z, up);
        showCatch(sx, sy, art, text(), added);
      }), delay);
    }
    /** Picked up: its model lifts off the ground (16 u in 0.5 s, swelling a little) and is gone with a sparkle. */
    function lifted(x: number, z: number, up: number, key: string, yaw = 0) {
      const n = ++seq, t0 = performance.now(), MS = 500;
      const k = () => Math.min(1, (performance.now() - t0) / MS), ease = () => 1 - (1 - k()) ** 2;
      const off = thing(w, { x, z, h: 30, live: () => [x, z, up + 16 * ease()], m3: { key, id: `lift-${n}`, yaw, get size() { return 1 + 0.15 * ease(); } } })();
      const moving = w.moveStart('present');
      later(() => (off(), moving(), fx3d('sparkle', x, z, up + 16, { size: 0.6 })), MS);
    }
    function pickUp(uid: string, x: number, y: number, art: string, yaw: number, up = 0) {
      take(date, uid);
      taken++;
      lifted(x, y, up, art, yaw);
    }

    /** Claim a thing on the ground for me (first wins): false when the partner has it already. */
    const claim = (uid: string, what: string, x: number, y: number): boolean =>
      shared.share({ kind: 'pick', id: uid, what, at: [Math.round(x), Math.round(y)] }).fresh;
    /** Still mine when my villager gets there: the partner's claim may have reached the relay first. */
    const stillMine = (uid: string) => (takenBy(shared.day, uid)?.who ?? shared.me) === shared.me;
    /** My villager turns to the find (avatar.ts) where it stands, and it's picked up there: lifted while the plate
     *  reads. The find is decided (and the ずかん written) at the tap. */
    function pickHere(x: number, fn: () => void) {
      turnTo(x);
      fn();
    }
    const shellYaw = (s: Shell) => (s.tilt * Math.PI) / 180;
    function pickShell(s: Shell) {
      if (!claim(s.uid, `shell:${s.id}`, s.x, s.y)) return;
      pickHere(s.x, () => {
        if (!stillMine(s.uid)) return;
        const added = recordFind('shell', s.id, `pick:${s.uid}`);
        pickUp(s.uid, s.x, s.y, findArt(s.id), shellYaw(s));
        sceneSfx('shell');
        plate(s.x, s.y, 4, findArt(s.id), () => t('beach.picked', { name: t(`beach.name.${s.id}`) }), 180, added);
      });
    }
    function pickFragment(f: Fragment) {
      if (!claim(f.uid, `fragment:${f.id}`, f.x, f.y)) return;
      pickHere(f.x, () => {
        if (!stillMine(f.uid)) return;
        recordFind('fragment', f.id, `pick:${f.uid}`);
        pickUp(f.uid, f.x, f.y, findArt(f.id), 0);
        sceneSfx('fragment');
        plate(f.x, f.y, 4, findArt(f.id), () => t('beach.picked', { name: t(`beach.name.${f.id}`) }), 180);
      });
    }
    function pickBottle(b: Bottle) {
      if (!claim(b.uid, 'bottle', b.x, b.y)) return;
      pickHere(b.x, () => {
        if (!stillMine(b.uid)) return;
        pickUp(b.uid, b.x, b.y, findArt('message-bottle'), 0.6);
        sceneSfx('bottle');
        plate(b.x, b.y, 4, findArt('message-bottle'), () => t('beach.bottle', { note: t(`beach.note.${b.note}`) }), 180);
      });
    }
    /** Balloon presents lying where they fell (SceneTaps lands them: world x, y = z; size in u), until either of us picks
     *  one up: the shared day's puts (a reload or the partner's phone finds them there too; the partner's at a usual
     *  size). */
    const sizes = new Map<string, number>();
    /** The presents lying unopened: gone once anyone's claim is in the shared day (world-day.ts lying). One put on a
     *  building's ground (before the rule, or a building placed over it since) lies at the free spot off it
     *  (world.ts offBuildingsAt, layout/clear.ts): seen and tapped there on every phone, its put as it was. */
    const presents = $derived.by(() => {
      void site.rev;
      const all = lying(shared.day).filter((p) => p.what === 'present' || p.what === 'sky-egg');
      // the balloons' newest three, and every tree's (two a day at most)
      const trees = all.filter((p) => giftTree(p.id)), balloons = all.filter((p) => !giftTree(p.id)).slice(-3);
      return [...balloons, ...trees].map((p) => {
        const tree = giftTree(p.id), [x, y] = offBuildingsAt(p.at[0], p.at[1]);
        return { uid: p.id, x, y, art: p.what === 'sky-egg' ? findArt('sky-egg') : 'deco/present', size: sizes.get(p.id) ?? PRESENT_U, tree,
          from: tree ? (treeById(tree)?.h ?? 120) * 0.55 : 0 };
      });
    });
    /** Trees' presents falling out of their canopies now (mine as treeShakes.svelte.ts puts it, the partner's as theirs comes in). */
    const falling = new SvelteSet<string>();
    const fellSeen = new Set<string>();
    $effect(() => {
      for (const p of presents) if (p.tree && !fellSeen.has(p.uid)) {
        fellSeen.add(p.uid);
        // just put (this phone's shake, or the partner's live): it falls; one lying since before (a reload) doesn't
        if (shared.now() - (shared.day.puts[p.uid]?.t ?? 0) < 1500) {
          falling.add(p.uid);
          later(() => falling.delete(p.uid), 900);
        }
      }
    });
    /** A balloon's present has landed on the lawn at world (x, z) (SceneTaps): it lies there until a tap picks it up (NH),
     *  on both phones. */
    function present(x: number, z: number, art: string, size: number) {
      const uid = `p${(shared.me ?? 'A').toLowerCase()}${shared.now().toString(36)}`;
      sizes.set(uid, size);
      shared.share({ kind: 'put', id: uid, what: art.endsWith('sky-egg') ? 'sky-egg' : 'present', at: [Math.round(x), Math.round(z)] });
      if (!art.endsWith('sky-egg')) void catalog().catch(() => {});
    }
    type Inside = ReturnType<typeof import('./catalog.ts')['pickPresent']>;
    /** What a present can hold (catalog.ts, ~2,000 entries) and their names (an artwork's with the catches'): their own
     *  chunks, fetched when one lands. */
    let catalogChunk: Promise<typeof import('./catalog.ts')> | null = null;
    const catalog = () => (catalogChunk ??= Promise.all([import('./catalog.ts'), loadCatalogNames(i18n.locale), loadNames()]).then(([m]) => m,
      (e: unknown) => ((catalogChunk = null), Promise.reject(e))));
    /** A present opening where it lay (NH's): the box squashes and pops up and away, confetti in the wrapping's colours
     *  bursts out of it with sparkles (fx3d's). */
    function opening(x: number, z: number, art: string, size: number) {
      const n = ++seq, t0 = performance.now(), MS = 440;
      const k = () => Math.min(1, (performance.now() - t0) / MS);
      // (a squash at a quarter, then up and away, swelling, as the 2D box-pop's keyframes)
      const s = () => ((q) => (q < 0.25 ? 1 - 0.2 * (q / 0.25) : 0.8 + 0.45 * ((q - 0.25) / 0.75)))(k());
      const up = () => ((q) => (q < 0.25 ? 0 : size * 0.7 * ((q - 0.25) / 0.75) ** 0.8))(k());
      const off = thing(w, { x, z, h: size + 40, live: () => [x, z, up()], m3: { key: art, id: `open-${n}`, get size() { return s(); }, get yaw() { return 0.4 * Math.max(0, k() - 0.25); } } })();
      const moving = w.moveStart('present');
      later(() => fx3d('confetti', x, z, size * 0.8, { v: 'burst', size: size / PRESENT_U }), 60);
      later(() => fx3d('sparkle', x, z, size * 0.6, { size: size / PRESENT_U }), 200);
      later(() => (off(), moving()), MS);
    }
    /** NH's balloon present, picked up: where it lies, the wrapping pops open (confetti, a little fanfare) and
     *  what was inside is on the plate: 「◯◯を てにいれた！」 (catalog.ts: furniture,
     *  clothing or a seasonal DIY recipe at NH's odds; never ベル, not kept, but counted in the ずかん's カタログ / レシピ, a
     *  first one with the plate's second page). On Bunny Day the sky egg is just picked up. */
    function openPresent(p: (typeof presents)[number]) {
      if (p.art.endsWith('sky-egg')) {
        if (!claim(p.uid, 'sky-egg', p.x, p.y)) return;
        return void pickHere(p.x, () => opened(p, null));
      }
      // what's inside is decided at the tap (and claimed with it: the partner's phone shows what I got)
      void catalog().then((C) => {
        // a tree's holds its furniture of the day (the same on every phone); a balloon's is a draw
        const inside = p.tree ? C.treeItem(date, p.tree, seed) : C.pickPresent(date, rand, eggTime(eventNow()), artWanted());
        if (!claim(p.uid, `present:${inside.kind}:${inside.id}`, p.x, p.y)) return;
        pickHere(p.x, () => opened(p, inside));
      }, () => {});
    }
    /** The genuine artworks the museum hasn't got yet (anyone's first find of one is its donation): a balloon's present
     *  holds one now and then (catalog.ts ART_ONE_IN). */
    function artWanted(): string[] {
      const m = week.model;
      if (!m) return [];
      const have = findsView(m.state);
      return ART_IDS.filter((id) => !have.has(findKey('item', id)));
    }
    function opened(p: (typeof presents)[number], inside: Inside | null) {
      if (!stillMine(p.uid)) return;
      take(date, p.uid);
      taken++;
      if (!inside) {
        recordGoods('sky-egg', `pick:${p.uid}`);
        lifted(p.x, p.y, 0, p.art);
        sceneSfx('present');
        return plate(p.x, p.y, p.size / 2, p.art, () => t('beach.picked', { name: t('beach.name.sky-egg') }), 180);
      }
      opening(p.x, p.y, p.art, p.size);
      sceneSfx('present');
      later(() => sceneSfx('catch'), 260);
      void catalog().then((C) => {
        const added = recordFind(inside.kind, inside.id, `pick:${p.uid}`);
        const name = C.catalogName(inside);
        // a recipe shows NH's DIY card, its name bare ("a DIY recipe for cherry-blossom clock")
        if (inside.kind === 'recipe') plate(p.x, p.y, p.size / 2, 'presents/diy-recipe', () => t('present.gotRecipe', { name: t(name).replace(/^(an?|some) /, '') }), 420, added);
        else plate(p.x, p.y, p.size / 2, C.catalogArt(inside), () => t('present.got', { name: t(name) }), 420, added);
      }, () => {});
    }
    function pickMushroom(m: Mushroom) {
      if (!claim(m.uid, `mushroom:${m.id}`, m.x, m.y)) return;
      pickHere(m.x, () => {
        if (!stillMine(m.uid)) return;
        recordGoods(m.id, `pick:${m.uid}`);
        pickUp(m.uid, m.x, m.y, findArt(m.id), m.flip ? Math.PI : 0, 0);
        sceneSfx('mushroom');
        plate(m.x, m.y, 6, findArt(m.id), () => t('beach.picked', { name: t(`beach.name.${m.id}`) }), 180);
      });
    }
    /** Holes dug (world x, z): open for 6.4 s where the shovel struck. */
    let holes = $state<{ n: number; x: number; z: number }[]>([]);
    /** Dug at (x, z): two strikes of the shovel and the earth (fx3d's), and a hole left there. */
    function dug(x: number, z: number) {
      fx3d('swing', x, z, 0, { v: 'shovel' });
      fx3d('dust', x, z, 0, { v: '#b48a5a' });
      const n = ++seq;
      holes = [...holes, { n, x, z }];
      later(() => (holes = holes.filter((h) => h.n !== n)), 6400);
    }
    function digUp(s: DigSpot) {
      const special = rare(s) ? 'rare-mushroom' : egg(s) ? 'earth-egg' : null;
      if (!claim(s.uid, special ? `dug:${special}` : `fossil:${s.fossil}`, s.x, s.y)) return;
      pickHere(s.x, () => {
        if (!stillMine(s.uid)) return;
        const added = special ? (recordGoods(special, `pick:${s.uid}`), false) : recordFind('fossil', s.fossil, `pick:${s.uid}`);
        take(date, s.uid);
        taken++;
        sceneSfx('dig');
        dug(s.x, s.y);
        if (special) plate(s.x, s.y, 4, findArt(special), () => t('beach.dug', { name: t(`beach.name.${special}`) }), 650);
        else plate(s.x, s.y, 4, findArt(s.fossil), () => t('beach.fossil', { name: t(`beach.name.${s.fossil}`) }), 650, added);
        later(() => sceneSfx('catch'), 650);
      });
    }

    // The partner's pick-ups (the shared day's news): gone here already (the lists re-derive); just now, their villager
    // turns to it, it is picked up (or dug, or the present opened) where it lay, with their line.
    mount(() =>
      shared.on(({ e, live }) => {
        if (e.kind === 'put' && e.what === 'present') void catalog().catch(() => {});
        if (e.kind === 'put' && giftTree(e.id) && live) later(() => sceneSfx('twig', e.at), 520);
        if (e.kind !== 'pick' || !live || !e.at || !enabled()) return;
        const [kind, id, id2] = e.what.split(':');
        const [x, z] = e.at;
        const news = (n: Omit<PartnerNews, 'x' | 'z'>) => tellPartner({ who: e.who, ...n, x, z });
        if (kind === 'fossil' || kind === 'dug') {
          partnerTurnTo(x, e.who);
          dug(x, z);
          sceneSfx('dig', [x, z]);
          news({ art: findArt(id), verb: 'dug', name: `beach.name.${id}` });
          return;
        }
        if (kind === 'present') {
          partnerTurnTo(x, e.who);
          opening(x, z, 'deco/present', PRESENT_U);
          sceneSfx('present', [x, z]);
          void catalog().then((C) => {
            const inside = { kind: id as 'item' | 'recipe', id: id2 };
            news({ art: inside.kind === 'recipe' ? 'presents/diy-recipe' : C.catalogArt(inside), verb: 'got', name: t(C.catalogName(inside)) });
          }, () => {});
          return;
        }
        const art = kind === 'bottle' ? findArt('message-bottle') : kind === 'sky-egg' ? findArt('sky-egg') : findArt(id);
        const name = kind === 'bottle' ? 'beach.name.message-bottle' : kind === 'sky-egg' ? 'beach.name.sky-egg' : `beach.name.${id}`;
        if (!['shell', 'fragment', 'bottle', 'mushroom', 'sky-egg'].includes(kind)) return;
        partnerTurnTo(x, e.who);
        lifted(x, z, 0, art);
        news({ art, verb: 'picked', name });
      })
    );

    // ---------- where each one is drawn, and its tap box ----------
    /** How big each kind is drawn (u: the 2D art's size) and how it sits on its foot (standing on it, or about it). */
    const SIZE: Record<string, readonly [number, number, 'stand' | 'mid']> = {
      shell: [32, 32, 'mid'], fragment: [24, 24, 'mid'], bottle: [28, 28, 'mid'], dig: [26, 18, 'mid'], mushroom: [26, 26, 'stand']
    };
    /** Where a thing's model is drawn on screen (client px): its silhouette (by its thing's id), or till its model is
     *  in, a box its size round its foot. */
    function drawnBox(kind: string, x: number, z: number, id3: string, size?: number): { left: number; top: number; width: number; height: number } {
      const r = drawn3(w, id3);
      if (r) return { left: r.left, top: r.top, width: r.width, height: r.height };
      const [cx, cy] = w.clientAt(x, z), k = w.scaleAt(x, z) * w.view.s;
      const [sw, sh, how] = size ? [size, size, 'stand' as const] : SIZE[kind];
      return { left: cx - (sw * k) / 2, top: how === 'stand' ? cy - sh * k : cy - (sh * k) / 2, width: sw * k, height: sh * k };
    }
    interface Lying { kind: string; id: string | null; uid: string; x: number; z: number; id3: string; size?: number; tree?: string | null; go: () => void }
    /** Every find lying out now, where it is (one riding a wave in, where the wave has it). */
    function lyingNow(): Lying[] {
      const at = (uid: string, x: number, z: number) => posOf(uid, x, z);
      const one = (kind: string, id: string | null, it: { uid: string; x: number; y: number }, id3: string, go: () => void, more: Partial<Lying> = {}): Lying => {
        const [x, z] = at(it.uid, it.x, it.y);
        return { kind, id, uid: it.uid, x, z, id3, go, ...more };
      };
      return [
        ...shells.map((s) => one('shell', s.id, s, `find-${s.uid}`, () => pickShell(s))),
        ...fragments.map((f) => one('fragment', f.id, f, `find-${f.uid}`, () => pickFragment(f))),
        ...(bottle ? [((b) => one('bottle', null, b, `find-${b.uid}`, () => pickBottle(b)))(bottle)] : []),
        ...visibleSpots.map((s) => one('fossil', null, s, `dig-${s.uid}`, () => digUp(s))),
        ...visibleMushrooms.map((m) => one('mushroom', m.id, m, `mush-${m.uid}`, () => pickMushroom(m))),
        ...presents.map((p) => one('present', null, p, `gift-${p.uid}`, () => openPresent(p), { size: p.size, tree: p.tree }))
      ];
    }
    const boxOf = (l: Lying) => drawnBox(l.kind === 'fossil' ? 'dig' : l.kind, l.x, l.z, l.id3, l.size);
    /** Every find lying in view and its tap box (hitbox.ts: what it draws, at least 44px), in front first on a tie; one
     *  washing in has none while it waits for its wave, unseen in the shallows (riding in, its box goes with it). */
    function targets(): { box: ReturnType<typeof hitRect>; body: ReturnType<typeof bareRect>; x: number; z: number; kind: string; uid: string; go: () => void }[] {
      const t = performance.now();
      const waiting = (uid: string) => t < (washes.get(uid)?.t0 ?? -Infinity);
      return lyingNow().flatMap((l) => {
        if (!w.inView(l.x, l.z, 20) || waiting(l.uid)) return [];
        const b = boxOf(l), r = { ...b, right: b.left + b.width, bottom: b.top + b.height };
        return [{ box: hitRect(r), body: bareRect(r), x: l.x, z: l.z, kind: l.kind === 'fossil' ? 'dig' : l.kind, uid: l.uid, go: l.go }];
      });
    }
    $effect(() => {
      const list = () => targets().flatMap((t) => (t.box ? [{ box: t.box, kind: t.kind }] : []));
      hitSources.add(list);
      return () => void hitSources.delete(list);
    });
    /** A tap on the scene (client px), after the critters: the find a tap took (on its tap box; in front wins; only
     *  what shows there: `seen`). On water, only on what it draws (the sea beside a shell is the sea's: a cast). */
    function hit(px: number, py: number, seen: Seen) {
      if (!enabled()) return null;
      const at = w.worldAtClient(px, py), k = at && hitWorld(at.x, at.z).kind, wet = k === 'sea' || k === 'pond' || k === 'river';
      return pick(targets().filter((t) => seen(t.x, t.z)), px, py, wet);
    }
    function tap(px: number, py: number, seen: Seen = SHOWN): boolean {
      const best = hit(px, py, seen);
      if (!best) return false;
      best.go();
      return true;
    }
    /** The find a tap at client (px, py) is for, by its uid (no side effect: SceneTaps' claims), or null. */
    const claims = (px: number, py: number, seen: Seen = SHOWN): string | null => hit(px, py, seen)?.uid ?? null;

    /** What comes and goes over the island, which a dig spot or a mushroom never gives way to: an open sheet (the island
     *  stays mounted under it), a tree's popup, a said line, a plate, the partner's news, the villagers walking about.
     *  Measured against these once, a spot under them hid, and stayed hidden once they'd gone (2026-11-16). */
    const passing = (el: Element) => !!el.closest('dialog, [data-fx], .detail, .news');
    /** Where each item lying on this screen that a control covers stands (`x,y`): one shows only where it's clear of the
     *  controls a tap over the island would go to (the HUD's, the stage's: the trees, the board), as on the old stage.
     *  One off screen stays (not drawn; it's checked once it's in view). `hw`, `up`, `hh`: its box around
     *  its middle, u. No stage yet: none covered. */
    function covered(list: { x: number; y: number }[], hw: number, up: number, hh: number, into: Set<string>): void {
      const g = stageGeo(o.scene());
      if (!g) return;
      // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over the crack)
      const keep = guardsU(g, -5 * g.k, (el) => passing(el) || !shownNow(el), NO_VILLAGER);
      for (const s of list) {
        if (!w.inView(s.x, s.y)) continue;
        const k = w.scaleAt(s.x, s.y), [sx, sy] = w.screenU(s.x, s.y, up);
        if (!clearAt(keep, sx, sy, hw * k, hh * k)) into.add(`${s.x},${s.y}`);
      }
    }
    /** Run `fn` two frames on (the camera's step and the 3D's frame done). */
    function placed(fn: () => void): () => void {
      let id = requestAnimationFrame(() => (id = requestAnimationFrame(fn)));
      return () => cancelAnimationFrame(id);
    }
    let under = $state<ReadonlySet<string>>(new Set());
    const uncovered = <T extends { x: number; y: number }>(list: T[]) => (under.size ? list.filter((s) => !under.has(`${s.x},${s.y}`)) : list);
    const visibleSpots = $derived(uncovered(spots));
    const visibleMushrooms = $derived(uncovered(mushrooms));
    /** Where they lie (a world event re-derives the lists: the same places, no new measure). */
    const lyingAt = $derived([...spots, ...mushrooms].map((s) => `${s.x},${s.y}`).join(' '));
    /** Bumped when a control over the island comes or goes (not what's `passing`). */
    let controls = $state(0);
    $effect(() => {
      const scene = o.scene();
      if (!scene) return;
      const SEL = 'button, [data-guard]';
      const control = (n: Node) => n instanceof Element && !passing(n) && (n.matches(SEL) || !!n.querySelector(SEL));
      const mo = new MutationObserver((rs) => {
        if (rs.some((r) => [...r.addedNodes].some(control) || [...r.removedNodes].some(control))) controls++;
      });
      mo.observe(scene, { childList: true, subtree: true });
      return () => mo.disconnect();
    });
    // measured once the camera settles (a scroll, a pinch), a control comes or goes, or the items move; never under a
    // sheet (the last measure kept: the island's hidden), again once it's gone
    $effect(() => {
      void lyingAt;
      void controls;
      void w.rest.settles;
      void w.rest.vw;
      if (!w.rest.ready || !enabled()) return;
      return placed(() => {
        const out = new Set<string>();
        covered(spots, 10, 0, 6, out);
        covered(mushrooms, 7, 7, 7, out);
        under = out;
      });
    });

    /** A wish on a shooting star (SceneTaps, a tap in the sky while one crosses; it shows the caption): one more star
     *  fragment on the beach the next morning (before dawn: this morning, from 5:00). */
    function wish(): void {
      const { day, morning } = wishDays(shared.now(), (d) => addDays(d, 1));
      addWish(morning, day);
      // the partner's beach gets its fragment too (both people's wishes count: the shared world)
      shared.share({ kind: 'world', op: 'wished', id: morning });
      taken++;
    }

    // ---------- the 3D island's things: each find's NH model where it lies ----------
    // (a dig spot and a hole flat on the ground; a tree's present falls out of its canopy, from its height, and bounces
    // where it lands: m3 drop; what the waves bring rides its wave in: m3 wash and the thing's live spot)
    $effect(() => {
      const offs = [
        ...visibleSpots.map((s) => thing(w, { x: s.x, z: s.y, h: 12, m3: { key: 'finds/dig-spot', id: `dig-${s.uid}` } })()),
        ...visibleMushrooms.map((m) => thing(w, { x: m.x, z: m.y, h: 14, m3: { key: findArt(m.id), id: `mush-${m.uid}`, yaw: m.flip ? Math.PI : 0 } })()),
        ...presents.map((p) => thing(w, { x: p.x, z: p.y, h: p.size + p.from, m3: { key: p.art, id: `gift-${p.uid}`, drop: falling.has(p.uid) ? p.from : 0, ms: 520 } })()),
        ...holes.map((h) => thing(w, { x: h.x, z: h.z, h: 12, m3: { key: 'finds/hole', id: `hole-${h.n}` } })())
      ];
      return () => offs.forEach((off) => off());
    });
    $effect(() => {
      // (the bottle at the water's edge, half in the foam: a small ring of foam now and then)
      const washed = (uid: string, x: number, z: number, h: number, m3: { key: string; yaw?: number; emit?: { kind: string; every: number; size?: number } }) => {
        const wi = untrack(() => washOf(uid, x, z));
        return thing(w, { x, z, h, ...(wi && { live: washPos(wi) }), m3: { ...m3, id: `find-${uid}`, wash: wi ?? undefined } })();
      };
      const offs = [
        ...shells.map((s) => washed(s.uid, s.x, s.y, 12, { key: findArt(s.id), yaw: shellYaw(s) })),
        ...fragments.map((f) => washed(f.uid, f.x, f.y, 14, { key: findArt(f.id) })),
        ...(bottle ? [washed(bottle.uid, bottle.x, bottle.y, 12, { key: findArt('message-bottle'), yaw: 0.6, emit: { kind: 'ripple', every: 4000, size: 0.4 } })] : [])
      ];
      return () => offs.forEach((off) => off());
    });
    // (after the things' first run: what lay there as the island opened just lies, what comes from now on washes in)
    mount(() => {
      first = false;
      if (want === 'washed') later(() => (washedIn = true), 1500);
    });
    // NH's beach glimmer: a star fragment glints now and then (every 3–5 s, out of step), on screen while the page shows
    $effect(() => {
      const on = fragments;
      if (!on.length) return;
      const t0 = performance.now(), every = (k: number) => (3 + ((k * 7) % 5) * 0.5) * 1000;
      const next = on.map((_, k) => t0 + 0.84 * every(k) - ((k * 1.3) % 3) * 1000);
      // (a timer to the next one due, not a 250 ms poll)
      let id: ReturnType<typeof setTimeout>;
      const tick = () => {
        const t = performance.now();
        on.forEach((f, k) => {
          if (t < next[k]) return;
          next[k] = t + every(k);
          const [x, z] = posOf(f.uid, f.x, f.y);
          if (!document.hidden && w.inView(x, z, 20) && t >= (washes.get(f.uid)?.t0 ?? -Infinity)) fx3d('glint', x + 3, z - 2, 8);
        });
        id = setTimeout(tick, Math.max(16, Math.min(...next) - t));
      };
      tick();
      return () => clearTimeout(id);
    });

    // The e2e's lists and boxes (things3 probes 'finds', 'digs'; boxes 'find': by kind or uid, its foot the point it lies
    // on), all from the finds' state and the 3D island.
    $effect(() => {
      const r = things3(w);
      const rows = (): FindRow[] => lyingNow().map((l) => ({
        kind: l.kind, id: l.id, uid: l.uid, tree: l.tree ?? null, fall: l.kind === 'present' && falling.has(l.uid), id3: l.id3,
        foot: [...w.clientAt(l.x, l.z)], box: boxOf(l)
      }));
      const digs = () => spots.map((s) => [s.x, s.y] as [number, number]);
      const box = (id: string) => ((f) => (f ? { ...f.box, foot: f.foot } : null))(rows().find((f) => f.kind === id || f.uid === id));
      r.probes.set('finds', rows);
      r.probes.set('digs', digs);
      r.boxes.set('find', box);
      return () => {
        if (r.probes.get('finds') === rows) r.probes.delete('finds');
        if (r.probes.get('digs') === digs) r.probes.delete('digs');
        if (r.boxes.get('find') === box) r.boxes.delete('find');
      };
    });

    api = { tap, claims, present, wish };
  });
  return { ...api, stop };
}
