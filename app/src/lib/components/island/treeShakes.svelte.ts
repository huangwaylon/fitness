// What a shaken tree drops (docs/design.md "Trees", "Shaking a tree"; island/treeShake.ts), for every tree on the
// island: a goal tree reports a shake from its canopy (FruitTree), any other from SceneTaps (IslandScene counts the
// taps), and this rolls the drop by the kind of tree. A tree branch falls beside the trunk on the inner side and lies
// there until a tap picks it up (it lifts off the grass, into my pocket: the shop buys it); a palm drops its two
// coconuts round its foot (a tap picks one up, into my pocket too). Any tree now and then knocks out a piece of NH's
// wood (wood, softwood or hardwood: treeShake.ts woodFall, 1 in 3 shakes, three a tree a day), put on the island for
// both (`wd:<tree>:<k>`, first wins); it lies by the trunk until a tap picks it up into my pocket. No piles: while
// anything a tree dropped lies under it (a branch, coconuts, wood, its present, a goal tree's fruit) a shake only
// rustles it, and a branch or a piece of wood lands on a free spot round the tree's foot (treeShake.ts dropSpot). Now
// and then a bagworm (at night sometimes a spider) drops out of the canopy on its thread beside the trunk on the outer
// side and dangles there, swaying, for DANGLE_MS: a tap nets it (NH's catch line, the ずかん's bagworm or spider), else
// it climbs back up. Rarely a wasp nest falls beside the trunk on the outer side: it lands with a thud, and
// SWARM_DELAY_MS later three wasps buzz out and charge the villager who shook it for SWARM_MS. A tap on them in time
// nets one (the net's swing, NH's catch line on the plate, the shared ずかん's wasp); too late and they sting
// (`onsting`: the scene gives that villager a fright and a sweat drop), then fly off. Nothing here pays ベル.
// Shared (docs/backend.md#shared-world): my shake's outcome goes to the partner (world.share), and theirs plays here:
// their villager turns to the tree and it shakes, the same drop falls, their wasps charge them. What lies (branches,
// coconuts) is the shared day's, so a reload or the partner's phone finds it there; a pick-up or a catch by either of
// us takes it on both phones (first wins). `?shake=nest|branch|bagworm|spider|coconut|wood` (dev or test mode) makes the
// next shake drop that (the e2e's hook; `wood`: a piece of wood and nothing else, while the tree has some today). Two
// oaks or cedars a day hold a present (treeGifts.ts): their first shake drops it, put on the island for both (`put`, by
// the tree's id: first wins); it lies and opens as a balloon's present does (finds.svelte.ts).
// The 3D island draws it all (world3d/things3.ts: NH's models beside the tree; the swarm follows the villager's face
// as it flies, its live spot, frames only while it's out) with its flourishes (the net's swing: fx3d); each pick-up and
// the net have their tap area (things3 Tap3, the canvas router's). No DOM of its own (R4 step 7). IslandScene calls this
// in its script (`shaken`).
import { showCatch } from './catchCard.ts';
import { timers } from './timers.ts';
import { hookOneOf, islandSeed } from '#lib/world/devHooks.ts';
import { giftAt, giftId, holdsGift } from './treeGifts.ts';
import { digSpots } from '#lib/world/beach.ts';
import { mushroomsOn } from '#lib/world/mushrooms.ts';
import { site } from './site.svelte.ts';
import { offBuildingsAt } from '#lib/world/world.ts';
import { onDestroy, onMount } from 'svelte';
import { SvelteSet } from 'svelte/reactivity';
import { t } from '#lib/i18n/index.ts';
import { recordFind, recordGoods } from '#lib/store/actions.ts';
import { world } from '#lib/store/world.svelte.ts';
import { caught, lying, taken } from '#lib/sync/world-day.ts';
import type { Drop, Pt } from '#lib/contract/live-protocol.ts';
import { VILLAGER } from './scene.ts';
import { OVER, type World } from './camera.svelte.ts';
import { tap, thing, things3, type Tap3 } from '../world3d/things3.ts';
import { sceneSfx } from './sceneTaps.ts';
import { waspMusic } from '#lib/sound/sound.svelte.ts';
import type { BugId } from '#lib/world/critters.ts';
import { critterArt } from '#lib/world/critterBits.ts';
import { catchLine, loadLines, loadNames } from './catchLine.ts';
import { jst } from '#lib/time/clock.ts';
import type { Who } from '#lib/types.ts';
import { islandDay } from './ambientClock.ts';
import { artUrl } from '#lib/art.ts';
import {
  DANGLE_MS, SWARM_DELAY_MS, SWARM_MS, WOODS, bearsCoconuts, dropAt, dropIds, dropSpot, fallen, legacyDropIds, lastNestOf, liesUnder, netsSwarm, shakeDrop,
  wireDrop, woodFall, woodOut, woodTree, type Ground, type ShakeDrop, type ShakeTree, type Wood
} from './treeShake.ts';
import { partnerTurnTo, turnTo } from './avatar.ts';
import { livePos } from '../motion/director.svelte.ts';
import { tellPartner } from './partnerNews.ts';
import { actorOf } from '#lib/ui-state/cast.ts';
import { fx3d } from '#lib/world/fx3d.ts';

type Side = 'mine' | 'partner' | 'third';
/** A tree shake's leavings as the e2e's hooks list them (things3 probes 'shakes'; Island3D adds each drop's box, its tap
 *  area's): what fell to pick up (`what`: branch (`id` its tree), coconut, wood (`item` its kind), dangler (`id` the
 *  bug: the net's tap area, there while it dangles)), the nests, the swarms (`side`: the villager they charge), the dangling bug (`up`: climbing
 *  back into the tree). */
export interface ShakesRows {
  drops: { what: string; id: string; item: string | null }[];
  nests: { tree: string; fading: boolean }[];
  swarms: { side: string; stung: boolean }[];
  dangles: { bug: string; up: boolean }[];
}

/** The shakes on island `w` (from IslandScene's script: its effects the scene's). */
export function useTreeShakes(w: World, o: {
  /** The wasps reached the villager on `side`. */
  onsting?: (side: Side) => void;
  /** A tree by id (the same on both phones), or null. */
  treeOf: (id: string) => ShakeTree | null;
  /** The partner shook a tree: rustle it (their villager has just got there). */
  rustle?: (tree: ShakeTree) => void;
}) {
  const { treeOf } = o;
  const { later, clear } = timers();
  onDestroy(() => {
    clear();
    stopSwarm();
  });

  /** Their tap areas stand NEAR in front of the tree's own (the canopy's and the fruit row's), so a branch's or a bug's
   *  own is on top. */
  const NEAR = -60;
  /** A pick-up's tap area for the 3D pick (things3 Tap3: 30u round `up` u over the foot, ≥ 44 px). */
  const pickArea = (id: string, x: number, z: number, h: number, up: number, act: () => void): Tap3[] => [{ kind: 'drop', id, x, z, h, dz: NEAR, l: -15, r: 15, b: up - 15, t: up + 15, min: [44, 44, 'mid'], round: [0.5, 0.5], act }];
  /** Where a falling thing starts: inside the canopy (u above the ground), by the tree's height. */
  const fromOf = (tr: ShakeTree) => tr.h * 0.55;
  /** A dangling bug hangs at a branch's height (its tap area between the canopy's and the fruit row's). */
  const DANGLE_UP = 22;
  /** The wasps come out of the nest this high, and go for the villager's face. */
  const NEST_UP = 10, FACE = VILLAGER.h * 0.78;
  /** Stung, the wasps fly off (ms): to the island's nearer side and up. */
  const AWAY_MS = 900;

  let seq = 0;
  /** World x, y = the world's z. */
  let nests = $state<{ n: number; tree: string; x: number; y: number; from: number; fading: boolean }[]>([]);
  /** A shake's identity on both phones (its drop's ids hang off it). */
  type ShakeKey = { tree: string; who: Who; t: number };
  let swarm = $state<{ n: number; id: string; old?: string; shake?: ShakeKey; side: Side; x0: number; z0: number; at: number; stung: boolean; stungAt: number; away: number } | null>(null);
  let dangler = $state<{ n: number; id: string; old?: string; shake?: ShakeKey; tree: string; bug: 'bagworm' | 'spider'; x: number; y: number; from: number; up: boolean } | null>(null);

  /** What the day's shakes left lying (the shared day: a reload or the partner's phone finds it too), and which of it
   *  fell while this island watched (only those fall; the rest just lie there). */
  const ground = $derived.by((): Ground => {
    void site.rev;
    const d = world.day, date = islandDay(), seed = islandSeed();
    // what never moves today (dig spots, dug or not; mushrooms), the same on both phones
    const still = [...digSpots(date, new Set(), seed).map((s): Pt => [s.x, s.y]), ...mushroomsOn(date, seed).map((m): Pt => [m.x, m.y])];
    // anyone's pick-up takes it at once, mine too (a phone that lost its own record gets my claims back in the replay)
    return { puts: Object.values(d.puts), still, pickedAt: (id) => taken(d, id)?.t };
  });
  const lyingNow = $derived(fallen(world.day.shakes, treeOf, ground));
  const dropping = new SvelteSet<string>();

  // the dev hook: the next shake drops this (a bagworm or a spider: that bug)
  let forced: string | undefined = hookOneOf('shake', ['nest', 'branch', 'bagworm', 'spider', 'coconut', 'wood']) ?? undefined;

  /** The day's wood lying under the trees (the shared day's puts, `wd:`), as the branches: anyone's pick-up takes it
   *  at once. A piece put on a building's ground lies at the free spot off it (world.ts offBuildingsAt). */
  const woodLying = $derived.by(() => {
    void site.rev;
    const d = world.day;
    return Object.values(d.puts).flatMap((p) => {
      const tree = woodTree(p.id);
      if (!tree || !(WOODS as readonly string[]).includes(p.what)) return [];
      if (taken(d, p.id)) return [];
      const [x, z] = offBuildingsAt(p.at[0], p.at[1]);
      return [{ id: p.id, tree, what: p.what as Wood, x, z }];
    });
  });
  /** A piece of wood falls out of the tree (mine as I shake it, the partner's as theirs comes in: `at`, its tree). */
  function woodFalls(id: string, at?: readonly [number, number]) {
    dropping.add(id);
    later(() => sceneSfx('twig', at), 520);
    later(() => dropping.delete(id), 900);
  }

  /** My villager shook `tree` (where it stands: a tap acts in place): roll what falls by its kind, share it, play it.
   *  `fruitDown`: a goal tree's fruit lies under it. */
  function shaken(tree: ShakeTree, fruitDown = false) {
    const d = world.day, now = world.now();
    const bugForced = forced === 'bagworm' || forced === 'spider' ? forced : undefined;
    const woodForced = forced === 'wood';
    const force = bugForced ? 'bug' : woodForced ? null : (forced as ShakeDrop | undefined);
    // this shake's place among the tree's shakes today (both of ours): its wood's seed
    const nth = d.shakes.filter((s) => s.tree === tree.id).length;
    const gift = holdsGift(islandDay(), tree.id, d.puts, islandSeed());
    let drop: ShakeDrop = shakeDrop(Math.random, now, lastNestOf(d.shakes, tree.id), force, tree.kind, bearsCoconuts(d.shakes, tree.id), gift);
    // no piles: while anything it dropped lies under it, only a rustle (the dev hook's drop falls all the same)
    const lies = forced === undefined && (fruitDown || liesUnder(tree.id, lyingNow, lying(d)));
    forced = undefined;
    if (lies) drop = null;
    if (drop === 'nest' && (swarm || dangler?.tree === tree.id || nests.some((s) => s.tree === tree.id))) drop = null;
    if (drop === 'bug' && (dangler || nests.some((s) => s.tree === tree.id))) drop = null;
    const wire = wireDrop(drop, jst().hour, Math.random, bugForced);
    world.share({ kind: 'shake', tree: tree.id, drop: wire });
    // the tree's present falls out of the canopy (the finds draw it: a put of the day); the partner's phone may have
    // dropped it a moment before (the relay keeps the first)
    if (drop === 'gift' && world.share({ kind: 'put', id: giftId(tree.id), what: 'present', at: giftAt(tree) }).fresh) later(() => sceneSfx('twig'), 520);
    play(tree, 'mine', wire);
    // NH's wood without an axe: now and then a piece, three a tree a day (treeShake.ts woodFall); put for both, first
    // wins (the partner's phone may have knocked the same piece out a moment before); never on a shake that drops
    // something else to lie there; on a free spot by the trunk, picked by its id (both phones pick the same)
    const wood = lies || drop === 'gift' || drop === 'branch' || drop === 'coconut' ? null : woodFall(islandDay(), tree.id, nth, woodOut(d.puts, tree.id), islandSeed(), woodForced);
    if (wood) {
      const busy = [...(ground.still ?? []), ...lying(world.day).map((p) => p.at), ...lyingNow.map((b): Pt => [b.x, b.z])];
      if (world.share({ kind: 'put', id: wood.id, what: wood.what, at: dropSpot(tree, wood.id, busy) }).fresh) woodFalls(wood.id);
    }
  }

  /** The `drop` of a shake of `tree` by `side`, as it falls here (its ids from the day's shakes). */
  function play(tree: ShakeTree, side: Side, drop: Drop, by?: { who: Who; t: number }) {
    if (drop === 'none') return;
    const d = world.day;
    // (the very shake when it's known: another's earlier one may have arrived after it)
    const i = by ? d.shakes.findIndex((s) => s.tree === tree.id && s.who === by.who && s.t === by.t) : d.shakes.findLastIndex((s) => s.tree === tree.id && s.drop === drop);
    const ids = i >= 0 ? dropIds(d.shakes, i) : [], old = i >= 0 ? legacyDropIds(d.shakes, i)[0] : undefined;
    const shake = i >= 0 ? { tree: tree.id, who: d.shakes[i].who, t: d.shakes[i].t } : undefined;
    const from = fromOf(tree);
    // (another's shake: its sounds by where it is)
    const far = side === 'mine' ? undefined : ([tree.x, tree.z] as const);
    if (drop === 'bagworm' || drop === 'spider') {
      const id = ids[0] ?? `dg:${tree.id}:x`;
      void loadLines().catch(() => {});
      const url = artUrl(critterArt(drop));
      if (url) new Image().src = url;
      const at = dropAt(tree, drop);
      const g = { n: ++seq, id, old, shake, tree: tree.id, bug: drop, x: at.x, y: at.z, from, up: false };
      dangler = g;
      later(() => dangler?.n === g.n && (dangler = { ...g, up: true }), DANGLE_MS);
      later(() => dangler?.n === g.n && (dangler = null), DANGLE_MS + 900);
    } else if (drop === 'branch' || drop === 'coconut') {
      for (const id of ids) dropping.add(id);
      later(() => sceneSfx('twig', far), 520);
      later(() => ids.forEach((id) => dropping.delete(id)), 900);
    } else if (drop === 'nest') {
      void loadLines().catch(() => {});
      const at = dropAt(tree, 'nest');
      const nest = { n: ++seq, tree: tree.id, x: at.x, y: at.z, from, fading: false };
      nests = [...nests, nest];
      later(() => (sceneSfx('nest', far), side === 'mine' && waspMusic('nest')), 560);
      later(() => charge(nest.n, ids[0] ?? `ws:${tree.id}:x`, nest.x, nest.y, side, old, shake), 560 + SWARM_DELAY_MS);
    }
  }

  /** Whether a shake is gone from the day (the room refused it: store/world.svelte.ts #unshake): its bug or wasps are
   *  nobody's to net. */
  const unshaken = (k?: ShakeKey): boolean => !!k && !world.day.shakes.some((s) => s.tree === k.tree && s.who === k.who && s.t === k.t);

  /** The net's swing at world (x, z), `lift` up (the 3D island's). */
  const netAt = (x: number, z: number, lift: number) => fx3d('swing', x, z, lift, { v: 'net', dir: x < site.midX ? -1 : 1 });

  /** A tap on the dangling bug: netted (the net's swing, NH's catch line, a ずかん find), unless the partner has it. */
  function netDangler() {
    const d = dangler;
    if (!d || d.up) return;
    if (unshaken(d.shake)) return void (dangler = null);
    // first wins: claimed at the tap (the relay's first claim is the catch: the partner's phone hears it)
    if (d.old && caught(world.day, d.old)) return; // (an older app's catch of it, under its old id)
    if (!world.share({ kind: 'catch', what: d.bug, id: d.id, at: [Math.round(d.x), Math.round(d.y)], how: 'net' }).fresh) return;
    // in place: my villager turns to it and the net swings at the bug; caught at the tap
    turnTo(d.x);
    dangler = null;
    // the partner's claim reached the relay first: theirs (its plate is the news's)
    const c = caught(world.day, d.id);
    if (c && c.who !== world.me) return;
    netAt(d.x, d.y, DANGLE_UP);
    sceneSfx('net');
    later(async () => {
      sceneSfx('catch');
      const added = recordFind('bug', d.bug, `catch:${d.id}`);
      const text = await catchLine(d.bug as BugId);
      const [sx, sy] = w.screenU(d.x, d.y, DANGLE_UP);
      showCatch(sx, sy, critterArt(d.bug), text, added);
    }, 160);
  }

  /** The swarm's world point now: from the nest to the villager's face where its feet are this frame (it may be
   *  walking somewhere), easing in; stung, off to the side and up, gone. */
  function swarmAt(): [number, number, number] {
    const s = swarm;
    if (!s) return [0, 0, 0];
    const t = performance.now(), k = Math.min(1, Math.max(0, (t - s.at) / SWARM_MS)), e = k * k * (1.6 - 0.6 * k);
    const [vx, vz] = livePos(s.side);
    const x = s.x0 + (vx - s.x0) * e, z = s.z0 + (vz - s.z0) * e, lift = NEST_UP + (FACE - NEST_UP) * e;
    if (!s.stung) return [x, z, lift];
    const a = Math.min(1, (t - s.stungAt) / AWAY_MS), q = a * a;
    return [x + s.away * 120 * q, z, lift + 60 * q];
  }
  /** Frames run while the swarm is out (its thing follows `swarmAt`). */
  let stopFrames: (() => void) | null = null;
  function stopSwarm() {
    stopFrames?.();
    stopFrames = null;
  }

  function charge(nestN: number, id: string, x: number, z: number, side: Side, old?: string, shake?: ShakeKey) {
    const n = ++seq;
    stopSwarm();
    // the partner already netted these (their catch came in while the nest fell), or the room refused the shake
    if (caught(world.day, id) || (old && caught(world.day, old)) || unshaken(shake)) return fadeNest(nestN);
    swarm = { n, id, old, shake, side, x0: x, z0: z, at: performance.now(), stung: false, stungAt: 0, away: x < site.midX ? -1 : 1 };
    stopFrames = w.moveStart('shake');
    const at = side === 'mine' ? undefined : ([x, z] as const);
    sceneSfx('buzz', at);
    if (side === 'mine') waspMusic('chase'); // NH's Chased by Bees cuts in over the island's music
    later(() => {
      if (swarm?.n !== n) return;
      swarm = { ...swarm, stung: true, stungAt: performance.now() };
      sceneSfx('sting', at);
      if (side === 'mine') waspMusic('stung');
      o.onsting?.(side);
      later(() => {
        if (swarm?.n !== n) return;
        swarm = null;
        stopSwarm();
      }, AWAY_MS);
      fadeNest(nestN);
    }, SWARM_MS);
  }

  function fadeNest(n: number) {
    later(() => (nests = nests.map((s) => (s.n === n ? { ...s, fading: true } : s))), 1200);
    later(() => (nests = nests.filter((s) => s.n !== n)), 1800);
  }

  /** A tap on the swarm: netted while it's on its way (mine only: the partner's wasps are theirs to net). */
  function netIt() {
    const s = swarm;
    if (!s || s.stung || s.side !== 'mine' || !netsSwarm(performance.now() - s.at)) return;
    if (unshaken(s.shake)) {
      // refused while the wasps were out: they scatter
      swarm = null;
      stopSwarm();
      const nest = nests.find((ns) => !ns.fading);
      if (nest) fadeNest(nest.n);
      return;
    }
    const [x, z, lift] = swarmAt();
    world.share({ kind: 'catch', what: 'wasp', id: s.id, at: [Math.round(x), Math.round(z)], how: 'swarm' });
    swarm = null;
    stopSwarm();
    turnTo(x); // no walk: the wasps' timing stays as it is
    netAt(x, z, lift);
    sceneSfx('net');
    waspMusic('caught');
    const nest = nests.find((ns) => !ns.fading);
    if (nest) fadeNest(nest.n);
    later(async () => {
      sceneSfx('catch');
      const added = recordFind('bug', 'wasp', `catch:${s.id}`);
      const text = await catchLine('wasp');
      const [sx, sy] = w.screenU(x, z, lift);
      showCatch(sx, sy, critterArt('wasp'), text, added);
    }, 160);
  }

  /** Picked up where it lies: its model lifts off the grass, swelling a little, and is gone (as a find's). */
  function lifted(x: number, z: number, key: string) {
    const n = ++seq, t0 = performance.now(), MS = 300;
    const k = () => Math.min(1, (performance.now() - t0) / MS);
    const off = thing(w, { x, z, h: 30, live: () => [x, z, 14 * k()], m3: { key, id: `picked-${n}`, get size() { return 1 + 0.2 * k(); } } })();
    const moving = w.moveStart('other');
    later(() => (off(), moving()), MS);
  }
  /** A tap picks it up where it lies (it lifts, gone; a coconut's plate with its line), my villager turning to it
   *  (avatar.ts). First wins: claimed at the tap. */
  function pick(id: string) {
    const b = lyingNow.find((x) => x.id === id);
    if (!b) return;
    const coconut = b.what === 'coconut';
    if (coconut) void loadNames().catch(() => {});
    if (!world.share({ kind: 'pick', id, what: b.what, at: [Math.round(b.x), Math.round(b.z)] }).fresh) return;
    turnTo(b.x);
    sceneSfx('twig');
    const good = coconut ? 'coconut' : 'tree-branch';
    recordGoods(good, `pick:${id}`);
    lifted(b.x, b.z, `finds/${good}`);
    picked(b.x, b.z, `finds/${good}`, good);
  }
  /** Picked up (into my pocket): NH's line on the plate, 「ヤシのみを ひろった！」. */
  function picked(x: number, z: number, art: string, id: string) {
    const [sx, sy] = w.screenU(x, z, 4);
    void loadNames().then(() => showCatch(sx, sy, art, t('beach.picked', { name: t(`beach.name.${id}`) })), () => {});
  }
  /** A tap picks up a piece of wood where it lies, into my pocket. First wins: claimed at the tap. */
  function pickWood(id: string) {
    const b = woodLying.find((x) => x.id === id);
    if (!b) return;
    void loadNames().catch(() => {});
    if (!world.share({ kind: 'pick', id, what: b.what, at: [b.x, b.z] }).fresh) return;
    turnTo(b.x);
    sceneSfx('twig');
    recordGoods(b.what, `pick:${id}`);
    lifted(b.x, b.z, `finds/${b.what}`);
    picked(b.x, b.z, `finds/${b.what}`, b.what);
  }

  // The partner's shakes and catches (the shared day's news): their villager turns to the tree and it shakes, the same
  // drop falls; they net the dangling bug or their wasps, or pick up a branch or a coconut, and it's gone here too.
  onMount(() =>
    world.on(({ e, live }) => {
      if (e.kind === 'shake') {
        const tree = treeOf(e.tree);
        if (!tree || !live) return;
        partnerTurnTo(tree.x, e.who, e.t);
        o.rustle?.(tree);
        play(tree, actorOf(e.who), e.drop, { who: e.who, t: e.at ?? e.t });
      } else if (e.kind === 'catch' && e.id && /^(dg|ws):/.test(e.id)) {
        const d = dangler;
        if (d && (d.id === e.id || d.old === e.id)) {
          dangler = null;
          if (live) {
            partnerTurnTo(d.x, e.who, e.t);
            netAt(d.x, d.y, DANGLE_UP);
            tellPartner({ who: e.who, art: critterArt(d.bug), verb: 'caught', name: `critter.name.${d.bug}`, x: d.x, z: d.y, lift: DANGLE_UP });
          }
        }
        const s = swarm;
        if (s && (s.id === e.id || s.old === e.id)) {
          swarm = null;
          stopSwarm();
          const nest = nests.find((ns) => !ns.fading);
          if (nest) fadeNest(nest.n);
          if (live) tellPartner({ who: e.who, art: critterArt('wasp'), verb: 'caught', name: 'critter.name.wasp', x: s.x0, z: s.z0 });
        }
      } else if (e.kind === 'put' && woodTree(e.id) && live && e.who !== world.me) {
        // the partner knocked a piece of wood out: it falls here too
        const tr = treeOf(woodTree(e.id) ?? '');
        woodFalls(e.id, tr ? [tr.x, tr.z] : undefined);
      } else if (e.kind === 'pick' && /^wd:/.test(e.id) && live) {
        const p = world.day.puts[e.id];
        if (p) partnerTurnTo(p.at[0], e.who, e.t);
      } else if (e.kind === 'pick' && /^(br|co):/.test(e.id) && live) {
        const b = fallen(world.day.shakes, treeOf, ground, true).find((x) => x.id === e.id);
        if (!b) return;
        partnerTurnTo(b.x, e.who, e.t);
        if (b.what === 'coconut') tellPartner({ who: e.who, art: 'finds/coconut', verb: 'picked', name: 'beach.name.coconut', x: b.x, z: b.z });
      }
    })
  );

  // ---------- the 3D island's things and the tap areas ----------
  // (a nest falls from the canopy, lands with a thud and fades; a branch, a coconut or a piece of wood falls out of it
  // and bounces where it lands (m3 drop): one lying there since before this island watched just lies)
  $effect(() => {
    const offs = [
      ...nests.map((s) => thing(w, { x: s.x, z: s.y, h: s.from, m3: { key: 'finds/wasp-nest', id: `nest-${s.n}`, drop: s.from, ms: 520, off: s.fading } })()),
      ...lyingNow.map((b) => {
        const from = (treeOf(b.tree)?.h ?? 120) * 0.55;
        return [
          thing(w, { x: b.x, z: b.z, h: from, m3: { key: b.what === 'branch' ? 'finds/tree-branch' : 'finds/coconut', id: `drop-${b.id}`, drop: dropping.has(b.id) ? from : 0, ms: 520 } })(),
          tap(w, b.what === 'branch' ? pickArea(b.tree, b.x, b.z, from, 9, () => pick(b.id)) : pickArea(b.id, b.x, b.z, from, 7, () => pick(b.id)))()
        ];
      }).flat(),
      ...woodLying.map((b) => {
        const from = (treeOf(b.tree)?.h ?? 120) * 0.55;
        return [
          thing(w, { x: b.x, z: b.z, h: from, m3: { key: `finds/${b.what}`, id: `drop-${b.id}`, drop: dropping.has(b.id) ? from : 0, ms: 520 } })(),
          tap(w, pickArea(b.id, b.x, b.z, from, 7, () => pickWood(b.id)))()
        ];
      }).flat()
    ];
    return () => offs.forEach((off) => off());
  });
  // a bagworm or a spider on its thread out of the canopy beside the trunk: it drops, sways, and climbs back up (its
  // thread from the canopy); the net's tap area
  $effect(() => {
    const d = dangler;
    if (!d) return;
    const offs = [
      thing(w, { x: d.x, z: d.y, lift: d.up ? d.from : DANGLE_UP, h: 4, always: true, m3: { key: `critters/${d.bug}`, id: `dangle-${d.n}`, ms: 900, line: () => [d.x, d.y, d.from] } })(),
      // (climbing back up: still there, but a tap on it does nothing)
      tap(w, pickArea(d.bug, d.x, d.y, d.from, DANGLE_UP, netDangler))()
    ];
    return () => offs.forEach((off) => off());
  });
  // the swarm: flying from the nest to the villager's face (its live spot), a ≥ 44 px tap area over every world thing
  // while it can be netted (mine only)
  $effect(() => {
    const s = swarm;
    if (!s) return;
    const offs = [
      thing(w, { x: s.x0, z: s.z0, lift: NEST_UP, h: FACE + 20, live: swarmAt, m3: { key: 'critters/wasp-swarm', id: `swarm-${s.n}` } })(),
      ...(s.stung || s.side !== 'mine' ? [] : [tap(w, [{ kind: 'swarm', id: s.side, x: s.x0, z: s.z0, lift: NEST_UP, h: FACE + 20, zi: OVER, live: swarmAt, l: -23, r: 23, b: -23, t: 23, min: [44, 44, 'mid'], round: [0.5, 0.5], act: netIt }])()])
    ];
    return () => offs.forEach((off) => off());
  });

  // The e2e's lists (things3 probes 'shakes'), from the shakes' state.
  $effect(() => {
    const r = things3(w);
    const rows = (): ShakesRows => ({
      drops: [
        ...lyingNow.map((b) => (b.what === 'branch' ? { what: 'branch', id: b.tree, item: null } : { what: 'coconut', id: b.id, item: null })),
        ...woodLying.map((b) => ({ what: 'wood', id: b.id, item: b.what as string })),
        ...(dangler ? [{ what: 'dangler', id: dangler.bug, item: null }] : [])
      ],
      nests: nests.map((s) => ({ tree: s.tree, fading: s.fading })),
      swarms: swarm ? [{ side: swarm.side, stung: swarm.stung }] : [],
      dangles: dangler ? [{ bug: dangler.bug, up: dangler.up }] : []
    });
    r.probes.set('shakes', rows);
    return () => void (r.probes.get('shakes') === rows && r.probes.delete('shakes'));
  });

  return { shaken };
}
