<script lang="ts">
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
  // either; so is a tree's present (treeGifts.ts: two oaks or cedars a day hold one, put by TreeShakes when shaken),
  // which falls out of the canopy and opens into that tree's furniture of the day. Wishes are both people's: a fragment for each. Everything lies in the world (world units: beach.ts, mushrooms.ts),
  // each item a world node at its foot (a dig spot and a hole flat on the ground). SceneTaps mounts this inside the stage
  // and asks it about each tap after the critters (`tap`, client px). Cheap: static images and one-shot animations; the
  // clock is the scene's minute tick.
  //   ?find=bottle | washed | fragment | mushroom | rare-mushroom (dev or ?demo): a bottle, a bottle washing in 1.5 s
  //   after the island opens, this morning's fragments, a mushroom now, or the next dig spot's rare mushroom (the e2e's
  //   hooks); ?seed= varies the island's seed.
  import { fx3d } from './fx3d.ts';
  import { showCatch } from './catchCard.ts';
  import { timers } from './timers.ts';
  import { hook, islandSeed } from './devHooks.ts';
  import { su } from './scene.ts';
  import { useWorld } from './camera.svelte.ts';
  import { onMount, tick } from 'svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { jst, minuteNow } from '#lib/time/clock.ts';
  import { islandDay } from './ambientClock.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { recordFind, recordGoods } from '#lib/store/actions.ts';
  import { hitWorld, sceneSfx, shownNow } from './sceneTaps.ts';
  import { loadNames } from './catchLine.ts';
  import { guardsU, clearAt, place, stageGeo } from './placement.ts';
  import { SHOWN, bareOf, hitOf, hitSources, pick, type HitBox, type Seen } from './hitbox.ts';
  import { bottleAt, bottleNow, digSpots, findArt, fragmentsOn, shellsAt, type Bottle, type DigSpot, type Fragment, type Shell } from './beach.ts';
  import { take, takenOn, wish as addWish, wishes } from './sceneDay.ts';
  import { fragmentsDue, wishDays } from './stars.ts';
  import { showerNight } from './meteor.ts';
  import { eggTime, eventNow } from './events.ts';
  import { eggInDig } from './eggs.ts';
  import { mushroomSpots, mushroomsOn, rareMushroom, type Mushroom } from './mushrooms.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { lying, taken as takenBy, takenIds } from '#lib/sync/world-day.ts';
  import { tellPartner, type PartnerNews } from './partnerNews.ts';
  import { loadCatalogNames } from '#lib/i18n/catalog.ts';
  import { giftTree } from './treeGifts.ts';
  import { treeById } from './treeShake.ts';
  import { SvelteSet } from 'svelte/reactivity';
  import { site } from './site.svelte.ts';
  import { offBuildingsAt } from './world.ts';
  import { fieldsOf } from '#lib/layout/fields.ts';
  import { nextRunUp, washAt, washFrom, washMs, type WashIn } from '#lib/layout/swash.ts';

  interface Props {
    scene?: HTMLElement;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
  }
  let { scene, enabled }: Props = $props();
  const w = useWorld();

  const seed = islandSeed();
  const want = hook('find');

  /** A present's confetti: [angle from straight up, colour, distance (u)], wrapping-paper colours. */
  const CONFETTI: [number, string, number][] = [[-84, '#F2484A', 28], [-62, '#FFD23F', 34], [-40, '#4FC3F7', 31], [-18, '#8BD45B', 37],
    [4, '#F78FB3', 33], [24, '#FFD23F', 36], [46, '#F2484A', 30], [68, '#4FC3F7', 29], [86, '#8BD45B', 26], [-50, '#FFFFFF', 24],
    [34, '#FFFFFF', 25], [-6, '#F2484A', 22], [-74, '#F78FB3', 21], [76, '#FFD23F', 22]];
  /** The dig spot's crack: five jagged arms of unequal length (8, 6, 7.5, 5, 6.5u) and four side cracks. */
  const CRACK = 'M0 0 L1.2 -3.4 L.6 -5.2 L1.8 -8 M0 0 L2.8 .6 L4.2 -.4 L6 .4 M0 0 L-.6 2.8 L.6 4.8 L-.2 7.4 M0 0 L-2.4 -.8 L-3.4 .2 L-5 -.4 '
    + 'M0 0 L-2 -2.4 L-2.6 -4.4 L-4.4 -5.2 M.9 -4.4 L2.6 -5 M3.6 .2 L4.2 1.6 M.1 4.2 L-1.4 4.9 M-2.3 -3.3 L-3.8 -2.8';
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
    const w = { ...wishes() };
    const them = shared.me === 'A' ? 'B' : 'A';
    for (const d of [date, addDays(date, 1)]) {
      const n = shared.wishesOf(them, d);
      if (n) w[d] = (w[d] ?? 0) + n;
    }
    return w;
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

  // What the waves bring in while you watch (a shell, the bottle, a star fragment) washes up the beach (layout/swash.ts):
  // it waits for the next wave at its stretch of the coast, then rides it in from just past the waterline, straight up
  // the beach to where it lies (~1–1.5 s, easing out), fading in; its model and its tap area move together (the node's
  // `live`, the model's `wash`: Island3D fades it). Reduced motion: it fades in where it lies. The ones already there
  // when the island opens just lie.
  let first = true;
  const washes = new Map<string, WashIn | null>();
  function washOf(uid: string, x: number, z: number): WashIn | null {
    if (washes.has(uid)) return washes.get(uid)!;
    let wi: WashIn | null = null;
    if (!first) {
      const t = performance.now(), l = site.layout;
      const way = l && !globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? washFrom(fieldsOf(l), x, z) : null;
      // (the wave's clock is the water's: world3d/water.ts waterU.uTime, the frames' time in s)
      wi = way ? { from: way.from, to: [x, z], t0: t + nextRunUp((t / 1000) % 3600, ...way.coast) * 1000, ms: washMs(way.dist) } : { from: [x, z], to: [x, z], t0: t, ms: 1200 };
      const ms = wi.ms;
      later(() => later(w.moveStart(), ms + 100), wi.t0 - t);
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
  /** `?find=washed`: the bottle comes 1.5 s after the island opens. */
  let washedIn = $state(false);
  onMount(() => {
    first = false;
    if (want === 'washed') later(() => (washedIn = true), 1500);
  });

  // ---------- the moment of a find (world x, and y = the world's z; `lift` units above the ground) ----------
  interface Lift { n: number; x: number; y: number; lift: number; art: string; tilt: number }
  interface Dig { n: number; x: number; y: number; in3d?: boolean }
  let lift = $state<Lift | null>(null);
  let dig = $state<Dig | null>(null);
  let seq = 0;
  const { later, clear } = timers();
  $effect(() => clear);

  /** The plate for world point (x, z), `up` units above it, `delay` ms after the tap (in the bottom stack, its icon
   *  popping up from where that point is on screen then); a first find of its kind gets a second page saying it's in the ずかん. */
  function plate(x: number, z: number, up: number, art: string, text: () => string, delay = 0, added = false) {
    const names = loadNames().catch(() => {});
    later(() => void names.then(() => {
      const [sx, sy] = w.screenU(x, z, up);
      showCatch(sx, sy, art, text(), added);
    }), delay);
  }
  function pickUp(uid: string, x: number, y: number, art: string, tilt: number, up = 0) {
    take(date, uid);
    taken++;
    const n = ++seq;
    lift = { n, x, y, lift: up, art, tilt };
    later(() => lift?.n === n && (lift = null), 500);
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
  function pickShell(s: Shell) {
    if (!claim(s.uid, `shell:${s.id}`, s.x, s.y)) return;
    pickHere(s.x, () => {
      if (!stillMine(s.uid)) return;
      const added = recordFind('shell', s.id, `pick:${s.uid}`);
      pickUp(s.uid, s.x, s.y, findArt(s.id), s.tilt);
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
      pickUp(b.uid, b.x, b.y, findArt('message-bottle'), -64);
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
  /** Trees' presents falling out of their canopies now (mine as TreeShakes puts it, the partner's as theirs comes in). */
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
  /** A present's size where it lies (u), when it wasn't this phone's balloon. */
  const PRESENT_U = 30;
  /** A balloon's present has landed on the lawn at world (x, z) (SceneTaps): it lies there until a tap picks it up (NH),
   *  on both phones. */
  export function present(x: number, z: number, art: string, size: number) {
    const uid = `p${(shared.me ?? 'A').toLowerCase()}${shared.now().toString(36)}`;
    sizes.set(uid, size);
    shared.share({ kind: 'put', id: uid, what: art.endsWith('sky-egg') ? 'sky-egg' : 'present', at: [Math.round(x), Math.round(z)] });
    if (!art.endsWith('sky-egg')) void catalog().catch(() => {});
  }
  type Inside = ReturnType<typeof import('./catalog.ts')['pickPresent']>;
  /** What a present can hold (catalog.ts, ~2,000 entries) and their names: their own chunks, fetched when one lands. */
  let catalogChunk: Promise<typeof import('./catalog.ts')> | null = null;
  const catalog = () => (catalogChunk ??= Promise.all([import('./catalog.ts'), loadCatalogNames(i18n.locale)]).then(([m]) => m,
    (e: unknown) => ((catalogChunk = null), Promise.reject(e))));
  /** A present opening where it lay: the box pops (a squash, the lid off), confetti in the wrapping's colours bursts
   *  out with sparkles. */
  let opening = $state<{ n: number; x: number; y: number; art: string; size: number } | null>(null);
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
      const inside = p.tree ? C.treeItem(date, p.tree, seed) : C.pickPresent(date, rand, eggTime(eventNow()));
      if (!claim(p.uid, `present:${inside.kind}:${inside.id}`, p.x, p.y)) return;
      pickHere(p.x, () => opened(p, inside));
    }, () => {});
  }
  function opened(p: (typeof presents)[number], inside: Inside | null) {
    {
      if (!stillMine(p.uid)) return;
      take(date, p.uid);
      taken++;
      if (!inside) {
        recordGoods('sky-egg', `pick:${p.uid}`);
        const n = ++seq;
        lift = { n, x: p.x, y: p.y, lift: p.size / 2, art: p.art, tilt: 0 };
        later(() => lift?.n === n && (lift = null), 500);
        sceneSfx('present');
        return plate(p.x, p.y, p.size / 2, p.art, () => t('beach.picked', { name: t('beach.name.sky-egg') }), 180);
      }
      const n = ++seq;
      opening = { n, x: p.x, y: p.y, art: p.art, size: p.size };
      later(() => opening?.n === n && (opening = null), 1100);
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
  }
  function pickMushroom(m: Mushroom) {
    if (!claim(m.uid, `mushroom:${m.id}`, m.x, m.y)) return;
    pickHere(m.x, () => {
      if (!stillMine(m.uid)) return;
      recordGoods(m.id, `pick:${m.uid}`);
      pickUp(m.uid, m.x, m.y, findArt(m.id), 0, 6);
      sceneSfx('mushroom');
      plate(m.x, m.y, 6, findArt(m.id), () => t('beach.picked', { name: t(`beach.name.${m.id}`) }), 180);
    });
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
      const n = ++seq;
      // (the 3D island's: two strikes of the shovel and the earth: fx3d.ts)
      dig = { n, x: s.x, y: s.y, in3d: fx3d('swing', s.x, s.y, 0, { v: 'shovel' }) && fx3d('dust', s.x, s.y, 0, { v: '#b48a5a' }) };
      later(() => dig?.n === n && (dig = null), 6400);
      if (special) plate(s.x, s.y, 4, findArt(special), () => t('beach.dug', { name: t(`beach.name.${special}`) }), 650);
      else plate(s.x, s.y, 4, findArt(s.fossil), () => t('beach.fossil', { name: t(`beach.name.${s.fossil}`) }), 650, added);
      later(() => sceneSfx('catch'), 650);
    });
  }

  // The partner's pick-ups (the shared day's news): gone here already (the lists re-derive); just now, their villager
  // turns to it, it is picked up (or dug, or the present opened) where it lay, with their line.
  onMount(() =>
    shared.on(({ e, live }) => {
      if (e.kind === 'put' && e.what === 'present') void catalog().catch(() => {});
      if (e.kind === 'put' && giftTree(e.id) && live) later(() => sceneSfx('twig', e.at), 520);
      if (e.kind !== 'pick' || !live || !e.at || !enabled()) return;
      const [kind, id, id2] = e.what.split(':');
      const [x, z] = e.at;
      const news = (n: Omit<PartnerNews, 'x' | 'z'>) => tellPartner({ who: e.who, ...n, x, z });
      if (kind === 'fossil' || kind === 'dug') {
        partnerTurnTo(x, e.who);
        const n = ++seq;
        dig = { n, x, y: z, in3d: fx3d('swing', x, z, 0, { v: 'shovel' }) && fx3d('dust', x, z, 0, { v: '#b48a5a' }) };
        later(() => dig?.n === n && (dig = null), 6400);
        sceneSfx('dig', [x, z]);
        news({ art: findArt(id), verb: 'dug', name: `beach.name.${id}` });
        return;
      }
      if (kind === 'present') {
        partnerTurnTo(x, e.who);
        const n = ++seq;
        opening = { n, x, y: z, art: 'deco/present', size: PRESENT_U };
        later(() => opening?.n === n && (opening = null), 1100);
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
      const n = ++seq;
      lift = { n, x, y: z, lift: 0, art, tilt: 0 };
      later(() => lift?.n === n && (lift = null), 500);
      news({ art, verb: 'picked', name });
    })
  );

  /** Every find lying in view and its tap box (hitbox.ts: what it draws, at least 44px), in front first on a tie; one
   *  washing in has none while it waits for its wave, unseen in the shallows (riding in, its box goes with it). */
  function targets(): { box: HitBox | null; body: HitBox | null; x: number; z: number; kind: string; go: () => void }[] {
    const t = performance.now();
    const waiting = (uid: string) => t < (washes.get(uid)?.t0 ?? -Infinity);
    const el = (uid: string, x: number, z: number) => (w.inView(x, z, 20) && !waiting(uid) ? scene?.querySelector(`[data-find][data-uid="${uid}"]`) : null);
    const one = (kind: string, it: { uid: string; x: number; y: number }, go: () => void) => {
      const e = el(it.uid, it.x, it.y);
      return { box: hitOf(e), body: bareOf(e), x: it.x, z: it.y, kind, go };
    };
    return [
      ...shells.map((s) => one('shell', s, () => pickShell(s))),
      ...fragments.map((f) => one('fragment', f, () => pickFragment(f))),
      ...(bottle ? [one('bottle', bottle, () => pickBottle(bottle!))] : []),
      ...visibleSpots.map((s) => one('dig', s, () => digUp(s))),
      ...visibleMushrooms.map((m) => one('mushroom', m, () => pickMushroom(m))),
      ...presents.map((p) => one('present', p, () => openPresent(p)))
    ];
  }
  $effect(() => {
    const list = () => targets().flatMap((t) => (t.box ? [{ box: t.box, kind: t.kind }] : []));
    hitSources.add(list);
    return () => void hitSources.delete(list);
  });
  /** A tap on the scene (client px), after the critters: true when a find took it (on its tap box; in front wins; only
   *  what shows there: `seen`). On water, only on what it draws (the sea beside a shell is the sea's: a cast). */
  export function tap(px: number, py: number, seen: Seen = SHOWN): boolean {
    if (!enabled()) return false;
    const at = w.worldAtClient(px, py), k = at && hitWorld(at.x, at.z).kind, wet = k === 'sea' || k === 'pond' || k === 'river';
    const best = pick(targets().filter((t) => seen(t.x, t.z)), px, py, wet);
    if (!best) return false;
    best.go();
    return true;
  }


  /** The items lying on this screen that a control covers (measured when the camera settles, once the projector has
   *  placed everything): a dig spot or a mushroom shows only where it's clear of every control, as on the old stage (a
   *  tap there would go to the control). One off screen stays (the projector hides it; it's checked once it's in
   *  view). The villagers walk about: they don't count. `hw`, `up`, `hh`: its box around its middle, u. */
  function uncovered<T extends { x: number; y: number }>(list: T[], hw: number, up: number, hh: number): T[] {
    const g = stageGeo(scene);
    if (!g) return [];
    // flat on the lawn: clear of the controls themselves (their 6px tap padding may run over the crack)
    const keep = guardsU(g, -5 * g.k, (el) => !!el.closest('[data-actor]') || !shownNow(el));
    return list.filter((s) => {
      if (!w.inView(s.x, s.y)) return true;
      const k = w.scaleAt(s.x, s.y), [sx, sy] = w.screenU(s.x, s.y, up);
      return clearAt(keep, sx, sy, hw * k, hh * k);
    });
  }
  /** Run `fn` once the projector has placed this frame's nodes (two frames on). */
  function placed(fn: () => void): () => void {
    let id = requestAnimationFrame(() => (id = requestAnimationFrame(fn)));
    return () => cancelAnimationFrame(id);
  }
  let visibleSpots = $state<DigSpot[]>([]);
  let visibleMushrooms = $state<Mushroom[]>([]);
  $effect(() => {
    const list = spots, mush = mushrooms;
    void w.rest.z;
    void w.rest.vw;
    if (!w.rest.ready) return;
    return placed(() => {
      visibleSpots = uncovered(list, 10, 0, 6);
      visibleMushrooms = uncovered(mush, 7, 7, 7);
    });
  });

  /** A wish on a shooting star (SceneTaps, a tap in the sky while one crosses; client px): one more star fragment on the
   *  beach the next morning (before dawn: this morning, from 5:00), and a brief caption by the tap. */
  export function wish(px: number, py: number): void {
    const { day, morning } = wishDays(shared.now(), (d) => addDays(d, 1));
    addWish(morning, day);
    // the partner's beach gets its fragment too (both people's wishes count: the shared world)
    shared.share({ kind: 'world', op: 'wished', id: morning });
    taken++;
    const n = ++seq;
    note = { n, x: 0, y: 0, placed: false };
    void tick().then(() => {
      const s = scene?.querySelector('.stage')?.getBoundingClientRect(), b = noteEl?.getBoundingClientRect();
      if (!scene || !s || !b || note?.n !== n) return;
      const at = place(scene, b.width, b.height, px, py);
      if (!at) return void (note = null);
      note = { n, x: at.x - s.left, y: at.y - s.top, placed: true };
      later(() => note?.n === n && (note = null), 1900);
    });
  }
  /** The wish's caption (stage px, placed clear of every control). */
  let note = $state<{ n: number; x: number; y: number; placed: boolean } | null>(null);
  let noteEl = $state<HTMLElement>();
</script>

<!-- (the dig spots the island has out now and where, wherever they are: the e2e's) -->
<i hidden data-digs={spots.length} data-at={spots.map((s) => `${s.x},${s.y}`).join(' ')}></i>
<!-- each item a world node at its foot (the anchor: a 0 × 0 point there); a dig spot and a hole flat on the ground -->
{#each visibleSpots as s (s.uid)}
  <!-- NH's dig spot: a dark, uneven star-shaped crack in the soil (jagged arms of unequal length, little side cracks),
       a lighter lip of earth under each, foreshortened -->
  <div class="node" aria-hidden="true" {@attach w.at({ x: s.x, z: s.y, mode: 'flat', h: 12, m3: { key: 'finds/dig-spot' } })}>
    <span class="item spot" data-m3art data-find="fossil" data-uid={s.uid} data-x={s.x} data-z={s.y}>
      <svg viewBox="-10 -10 20 20">
        <path class="lip" d={CRACK} transform="translate(0 .8)" /><path class="crack" d={CRACK} />
      </svg>
    </span>
  </div>
{/each}
{#each visibleMushrooms as m (m.uid)}
  <div class="node" aria-hidden="true" {@attach w.at({ x: m.x, z: m.y, h: 14, m3: { key: findArt(m.id), yaw: m.flip ? Math.PI : 0 } })}>
    <span class="item mush" class:flip={m.flip} data-find="mushroom" data-id={m.id} data-uid={m.uid}>
      <OfficialArt key={findArt(m.id)} size="calc(26 * var(--su))" />
    </span>
  </div>
{/each}
{#each presents as p (p.uid)}
  <!-- a tree's present falls out of its canopy (from its height) and bounces where it lands (the 3D island's model
       falls the same way: m3 drop) -->
  <div class="node" aria-hidden="true" {@attach w.at({ x: p.x, z: p.y, h: p.size + p.from, m3: { key: p.art, id: `gift-${p.uid}`, drop: falling.has(p.uid) ? p.from : 0, ms: 520 } })}>
    <span class="item gift" class:fall={falling.has(p.uid)} data-find="present" data-uid={p.uid} data-tree-gift={p.tree} style:--from={su(-p.from)}><OfficialArt key={p.art} size={su(p.size)} eager /></span>
  </div>
{/each}
{#each shells as s (s.uid)}
  {@const wi = washOf(s.uid, s.x, s.y)}
  <div class="node" aria-hidden="true" {@attach w.at({ x: s.x, z: s.y, h: 12, ...(wi && { live: washPos(wi) }), m3: { key: findArt(s.id), id: `find-${s.uid}`, yaw: (s.tilt * Math.PI) / 180, wash: wi ?? undefined } })}>
    <span class="item shell" data-find="shell" data-id={s.id} data-uid={s.uid} style:--tilt="{s.tilt}deg">
      <OfficialArt key={findArt(s.id)} size="calc(32 * var(--su))" />
    </span>
  </div>
{/each}
{#each fragments as f, k (f.uid)}
  <!-- NH's beach glimmer: a star fragment twinkles now and then (every 3–5 s, out of step) -->
  {@const wi = washOf(f.uid, f.x, f.y)}
  <div class="node" aria-hidden="true" {@attach w.at({ x: f.x, z: f.y, h: 14, ...(wi && { live: washPos(wi) }), m3: { key: findArt(f.id), id: `find-${f.uid}`, wash: wi ?? undefined } })}>
    <span class="item frag" data-find="fragment" data-id={f.id} data-uid={f.uid} style:--tw="{3 + ((k * 7) % 5) * 0.5}s" style:--twd="{-k * 1.3}s">
      <OfficialArt key={findArt(f.id)} size="calc(24 * var(--su))" />
      <svg class="twinkle" viewBox="0 0 24 24"><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
    </span>
  </div>
{/each}
{#if bottle}
  {@const wi = washOf(bottle.uid, bottle.x, bottle.y)}
  <!-- at the water's edge, half in the foam: it rocks with the waves, a small ring of foam now and then -->
  <div class="node" aria-hidden="true" {@attach w.at({ x: bottle.x, z: bottle.y, h: 12, ...(wi && { live: washPos(wi) }), m3: { key: findArt('message-bottle'), id: `find-${bottle.uid}`, yaw: 0.6, wash: wi ?? undefined } })}>
    <span class="item bottle" data-find="bottle" data-uid={bottle.uid}>
      <i class="foam"></i>
      <span class="rock"><OfficialArt key={findArt('message-bottle')} size="calc(28 * var(--su))" /></span>
    </span>
  </div>
{/if}
{#if dig}
  {#key dig.n}
    <div class="node" aria-hidden="true" {@attach w.at({ x: dig.x, z: dig.y, mode: 'flat', h: 12, m3: { key: 'finds/hole' } })}>
      <span class="item digfx" data-m3art><i class="hole"></i></span>
    </div>
    <div class="node" aria-hidden="true" {@attach w.at({ x: dig.x, z: dig.y, h: 40, dz: -2 })}>
      <span class="item digfx" class:in3d={dig.in3d}>
        <!-- two strikes of the shovel, a burst of earth on each -->
        {#each [0, 1] as k (k)}{#each [-1, 0, 1] as dx, i (i)}<i class="clod" style:--dx={dx + k * 0.3} style:--i={i} style:--k={k}></i>{/each}{/each}
        <span class="shovel"><OfficialArt key={findArt("shovel")} size="calc(30 * var(--su))" eager /></span>
      </span>
    </div>
  {/key}
{/if}
{#if opening}
  {#key opening.n}
    <!-- the present pops open: the box squashes and its lid flies off, confetti and sparkles burst out -->
    <div class="node" aria-hidden="true" {@attach w.at({ x: opening.x, z: opening.y, h: 60, dz: -2 })}>
      <span class="item opening" data-fx="present-open">
        <span class="box"><OfficialArt key={opening.art} size={su(opening.size)} eager /></span>
        {#each CONFETTI as [a, c, d], i (i)}<i class="bit" style:--a="{a}deg" style:--c={c} style:--d={su(d)} style:--i={i}></i>{/each}
        {#each [[-12, -14, 0], [11, -18, 1], [2, -24, 2]] as [dx, dy, k] (k)}
          <svg class="pop-spark" viewBox="0 0 24 24" style:--dx={su(dx)} style:--dy={su(dy)} style:--k={k}><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /></svg>
        {/each}
      </span>
    </div>
  {/key}
{/if}
{#if lift}
  {#key lift.n}
    <div class="node" aria-hidden="true" {@attach w.at({ x: lift.x, z: lift.y, lift: lift.lift, h: 30, dz: -2 })}>
      <span class="item lift" style:--tilt="{lift.tilt}deg"><OfficialArt key={lift.art} size="calc(28 * var(--su))" eager /></span>
    </div>
  {/key}
{/if}

<div class="held">
  {#if note}
    {#key note.n}<span class="wish if-caption" class:placed={note.placed} data-fx="wish-note" bind:this={noteEl} style:left="{note.x}px" style:top="{note.y}px">{t('beach.wish')}</span>{/key}
  {/if}
</div>

<style>
  /* a world node: on the ground among everything else by depth, under the time-of-day tint like the land itself */
  .node { width: 0; height: 0; pointer-events: none; }
  .held { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; --su: calc(100cqw / 390); }
  .item { position: absolute; left: 0; top: 0; width: 0; height: 0; }
  .item > * { position: absolute; left: 0; top: 0; line-height: 0; }
  .item :global(.official) { max-width: none; }
  /* a shell lies on the sand at its own angle, a soft contact shadow under it */
  .shell > :global(*), .frag > :global(*) { translate: -50% -60%; filter: var(--leaf-tint,) drop-shadow(0 1px 0 rgba(120, 90, 50, .35)); }
  .shell > :global(*) { rotate: var(--tilt); }
  .bottle .rock { translate: -50% -60%; line-height: 0; transform-origin: 50% 70%; animation: bottle-rock 2.4s ease-in-out infinite alternate; }
  .bottle .rock > :global(*) { rotate: -64deg; filter: var(--leaf-tint,) drop-shadow(0 1px 0 rgba(120, 90, 50, .35)); }
  @keyframes bottle-rock { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
  .foam {
    display: block; width: calc(20 * var(--su)); height: calc(6 * var(--su)); translate: -50% -30%; border-radius: 50%;
    border: 1.2px solid rgba(255, 255, 255, .9); opacity: 0; animation: foam 4s ease-out infinite;
  }
  @keyframes foam { 0% { transform: scale(.4); opacity: 0; } 8% { opacity: .9; } 30% { transform: scale(1.2); opacity: 0; } 100% { opacity: 0; } }
  .twinkle {
    width: calc(9 * var(--su)); translate: 10% -120%; fill: #FFFBE6; filter: var(--leaf-tint,) drop-shadow(0 0 2px #FFE070); opacity: 0;
    animation: twinkle var(--tw, 4s) ease-out var(--twd, 0s) infinite;
  }
  @keyframes twinkle { 0%, 80% { transform: scale(0) rotate(0); opacity: 0; } 88% { transform: scale(1) rotate(40deg); opacity: 1; } 100% { transform: scale(0) rotate(90deg); opacity: 0; } }
  /* a present opening: the box squashes and pops up and away (its lid off), confetti bursts out, three sparkles */
  .opening .box { translate: -50% -50%; line-height: 0; transform-origin: 50% 100%; animation: box-pop .5s cubic-bezier(.3, 1.4, .5, 1) both; }
  @keyframes box-pop {
    0% { transform: none; } 25% { transform: scale(1.18, .8); } 55% { transform: translateY(-30%) scale(.9, 1.15) rotate(-6deg); opacity: 1; }
    100% { transform: translateY(-70%) scale(1.25) rotate(8deg); opacity: 0; }
  }
  .bit {
    display: block; width: calc(4 * var(--su)); height: calc(6 * var(--su)); margin: calc(-3 * var(--su)) 0 0 calc(-2 * var(--su));
    border-radius: 1px; background: var(--c); box-shadow: 0 0 0 .5px rgba(0, 0, 0, .08); rotate: var(--a); transform-origin: 50% 100%; opacity: 0;
    animation: confetti .9s cubic-bezier(.2, .7, .4, 1) calc(.12s + var(--i) * 12ms) both;
  }
  @keyframes confetti {
    0% { transform: translateY(0) scale(.4) rotate(0); opacity: 1; } 55% { opacity: 1; }
    100% { transform: translateY(calc(var(--d) * -1)) scale(1) rotate(200deg); opacity: 0; }
  }
  .pop-spark {
    width: calc(10 * var(--su)); translate: calc(-50% + var(--dx)) calc(-50% + var(--dy)); fill: #FFF8D8;
    filter: var(--leaf-tint,) drop-shadow(0 0 2px #FFE070); opacity: 0; animation: pop-spark .6s ease-out calc(.2s + var(--k) * .12s) both;
  }
  @keyframes pop-spark { 0% { transform: scale(0) rotate(0); opacity: 0; } 40% { transform: scale(1.1) rotate(45deg); opacity: 1; } 100% { transform: scale(0) rotate(90deg); opacity: 0; } }
  /* a balloon's present where it landed, standing on its foot, a soft shadow there */
  .gift > :global(*) { translate: -50% -100%; filter: var(--leaf-tint,) drop-shadow(0 1.5px 0 rgba(60, 70, 30, .35)); }
  /* a tree's present, shaken out: it falls from the canopy, squashes and bounces (TreeShakes' drop) */
  .gift.fall { animation: gift-fall 560ms cubic-bezier(.45, 0, .8, .6) both; transform-origin: 50% 0; }
  @keyframes gift-fall {
    0% { transform: translateY(var(--from)); }
    60% { transform: translateY(0) scale(1.1, .88); animation-timing-function: ease-out; }
    76% { transform: translateY(calc(-6 * var(--su))) scale(.96, 1.04); animation-timing-function: ease-in; }
    90% { transform: translateY(0) scale(1.03, .97); } 100% { transform: none; }
  }
  /* a mushroom stands on the lawn beside its tree, a soft shadow at its foot */
  .mush > :global(*) { translate: -50% -92%; filter: var(--leaf-tint,) drop-shadow(0 1.5px 0 rgba(60, 70, 30, .35)); }
  .mush.flip > :global(*) { scale: -1 1; }
  .frag > :global(*) { filter: var(--leaf-tint,) drop-shadow(0 0 3px rgba(255, 246, 190, .9)); }
  /* the dig spot */
  .spot svg { width: calc(26 * var(--su)); translate: -50% -50%; scale: 1 .7; overflow: visible; fill: none; stroke-linecap: round; stroke-linejoin: round; }
  .spot .crack { stroke: #4E321A; stroke-opacity: .85; stroke-width: 1.6; }
  .spot .lip { stroke: #C9A46A; stroke-width: .8; }
  /* digging: the shovel strikes twice (.28 s each), a burst of earth on each, and leaves an open hole for 6 s */
  .shovel { translate: -20% -95%; transform-origin: 30% 100%; animation: shovel .68s cubic-bezier(.3, .6, .4, 1) both; }
  @keyframes shovel {
    0% { transform: rotate(-40deg) translateY(-6px); opacity: 0; } 10% { opacity: 1; }
    37% { transform: rotate(8deg); } 52% { transform: rotate(-32deg) translateY(-4px); } 78% { transform: rotate(10deg); }
    90% { opacity: 1; } 100% { transform: rotate(-10deg) translateY(-8px); opacity: 0; }
  }
  .hole {
    display: block; width: calc(18 * var(--su)); height: calc(8 * var(--su)); translate: -50% -50%; border-radius: 50%;
    background: radial-gradient(closest-side, #4E321A, #6B4A2A 55%, #8A6238 78%, rgba(138, 98, 56, 0)); animation: hole 6s ease-out .25s both;
  }
  @keyframes hole { from { transform: scale(.3); opacity: 0; } 5% { transform: scale(.7); opacity: 1; } 10% { transform: scale(1); } 85% { opacity: 1; } to { opacity: 0; } }
  .clod {
    display: block; width: calc(4 * var(--su)); height: calc(3.4 * var(--su)); border-radius: 50%; background: #8A6238;
    animation: clod .6s cubic-bezier(.3, .8, .6, 1) calc(.24s + var(--k) * .28s + var(--i) * 40ms) both;
  }
  @keyframes clod {
    0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; }
    50% { transform: translate(calc(var(--dx) * 7 * var(--su)), calc(-10 * var(--su))); }
    100% { transform: translate(calc(var(--dx) * 12 * var(--su)), calc(2 * var(--su))); opacity: 0; }
  }
  /* a wish: a small cream caption by the tap that floats up a little and fades (NH has no words for it: the moment) */
  .wish { translate: -50% -50%; box-shadow: 0 2px 0 var(--plate-lip), 0 0 12px rgba(255, 246, 190, .55); animation: wish-note 1.9s ease-out both; }
  .wish:not(.placed) { visibility: hidden; animation: none; }
  @keyframes wish-note { 0% { transform: translateY(6px) scale(.85); opacity: 0; } 15% { transform: none; opacity: 1; } 75% { opacity: 1; } 100% { transform: translateY(-10px); opacity: 0; } }
  /* picked up: it lifts off the sand and fades */
  .lift > :global(*) { translate: -50% -60%; rotate: var(--tilt); animation: lift .5s ease-out both; }
  @keyframes lift { to { transform: translateY(calc(-16 * var(--su))) scale(1.15); opacity: 0; } }
</style>
