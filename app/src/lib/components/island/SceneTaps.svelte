<script lang="ts">
  // Scenery taps (docs/design.md "Scene interactions"): the island's decorative scenery answers a tap with a ≤ 1 s
  // flourish after NH / Pocket Camp, and nothing else (no points, no state, no sheets). A bush rustles and sheds a few
  // leaves (petals in spring, maple leaves in autumn, a clump of snow in winter); a flower wiggles and drops a petal
  // with a sparkle (rarely a butterfly flutters off it; on a summer night, a firefly); a cloud squishes and puffs; the
  // sun glints; the moon bobs and twinkles; a tap in the night sky lights a star; the sea (the pond, the river) rings and
  // splashes (rarely a fish shadow darts off); sand takes two footprints and a puff, grass a dust puff (snow in winter).
  // On a clear night (NH: 7 pm – 4 am) a shower of shooting stars crosses the sky every few minutes (stars.ts), never
  // over the UI; a tap in the sky while one streaks across is a wish (a sparkle, a chime, a caption: finds.svelte.ts wish). A popped balloon's
  // present (balloon.svelte.ts sends `island:present`) falls to the open spot in front it chose, sparkles and lies there.
  // The critters (critters.svelte.ts: fish shadows to fish, bugs to net) get each tap first; a shaken bush can let a bug out.
  //   <SceneTaps scene={el} {season} {tod} enabled={() => live && !covered} />   (inside .stage, before the tint)
  // One `click` listener on the scene (a native scroll swallows the click: a drag scrolls, a tap acts; docs/design.md
  // "World"): anything inside a control (trees, fruit row, villagers, buildings, the balloon) is theirs; then the
  // critters and the island's things; then the scenery thing by its 3D tap area (a bush, a tree, a seat: scenery.svelte.ts;
  // a flower: flowers.svelte.ts); then the sky (above the horizon: the sun / moon / clouds against their live boxes) or the ground under
  // the finger (the camera's inverse projection → sceneTaps.ts hitWorld). A ground flourish is the 3D island's (fx3d)
  // where the tap landed; the sky's stay in the fixed sky (DOM: ≤ 4 at once, each removed after ≤ 1.1 s); nothing runs
  // while idle but the night's shower timer.
  //   ?shower (dev or test mode): a shower 1.5 s after the night sky shows, then every 8 s (the e2e's hook).
  // Decorative and pointer-only (aria-hidden, no focus stops).
  import { lazyModule } from '#lib/ui-state/lazyComponent.svelte.ts';
  import { guestNow, onBeach, visitorNow } from '#lib/world/visitors.ts';
  import { timers } from './timers.ts';
  import { hook, islandSeed } from '#lib/world/devHooks.ts';
  import { site } from './site.svelte.ts';
  import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { EDGE, guardsU, place, stageGeo } from './placement.ts';
  import type { Visitor } from './visitor.svelte.ts';
  import type { KK } from './kk.svelte.ts';
  import type { Prop } from './deck.svelte.ts';
  import { STREAK_MS, WISH_MS, inStarHours, nextShowerMs, showerPlan, streakPath } from '#lib/world/stars.ts';
  import { BUSH_U, FLOWER_U, wildFlower, type Tod } from './scene.ts';
  import { ARCH, DECOR_SLOTS, FLOWERS, HEDGE_XS, HEDGE_Z, SCENERY, flowerById, type BuildingId, type Flower } from '#lib/world/world.ts';
  import { hitWorld, petalOf, sceneSfx, type SceneHit } from './sceneTaps.ts';
  import { OVER, useWorld } from './camera.svelte.ts';
  import type { Critters } from './critters.svelte.ts';
  import { pickOf } from './probe.ts';
  import { thing, things3, type Claim } from '../world3d/things3.ts';
  import { SHOWN, notBehind, type Seen, type Src } from './hitbox.ts';
  import { footprint } from '#lib/world/nav.ts';
  import type { Finds } from './finds.svelte.ts';
  import type { Care } from './care.svelte.ts';
  import type { Choice } from '#lib/world/pager.ts';
  import { water } from '#lib/world/sceneDay.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { findArt } from '#lib/world/beach.ts';
  import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { nextStarMs, showerAt } from '#lib/world/meteor.ts';
  import { weather } from './weatherNow.svelte.ts';
  import { eggTime, eventNow } from '#lib/world/events.ts';
  import { eggInBalloon } from '#lib/world/eggs.ts';
  import { RIG, fallAt } from '#lib/world/balloonFlight.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { t } from '#lib/i18n/index.ts';
  import { onMount, tick, untrack } from 'svelte';
  import { fx3d } from '#lib/world/fx3d.ts';
  import { echo3d } from './echo3d.ts';
  import { pieceSpeaker, sceneryOf } from './scenery.svelte.ts';
  import type { SaySpeaker } from '#lib/world/say.ts';
  import { cropName, openPicker, popAt } from './farmUi.svelte.ts';
  import { farmTap, plantingRun } from '#lib/world/farmTap.ts';
  import { farmToday } from './farm.ts';
  import { islandDay } from './ambientClock.ts';
  import { loadNames } from './catchLine.ts';
  import { CROPS, FARM, plantsOf, seedKey } from '#lib/contract/farm.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { layoutPlots, plotAt, plotsAround } from '#lib/layout/field.ts';
  import { tileAt, tileMid } from '#lib/layout/grid.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { dig, harvestMany, plantMany, waterAll, type Seed } from '#lib/store/farm.svelte.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { shopView } from '#lib/model/shop.ts';
  import type { Who } from '#lib/types.ts';

  interface Props {
    /** The .if-scene element (the listener's home; the stage, orb and clouds are found inside it). */
    scene?: HTMLElement;
    season: Season;
    tod: Tod;
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
    /** The pointerdown that just closed a tree's popup: that tap only closes it. */
    swallowed?: () => Event | null;
    /** A visitor's line in the speech balloon (IslandScene's Talk). */
    say?: (name: string, parts: string | string[], from: SaySpeaker, o?: { colour?: string; choices?: Choice[]; ondone?: () => void }) => void;
    /** Jack's trick (visitor.svelte.ts), when he gets no candy. */
    ontrick?: () => void;
    /** Either of us met 🍑 Exercise today (group stretching's tape deck comes out). */
    exercise?: boolean;
    /** A tap in the sky (client px) during a fireworks show sends one more (IslandScene's Fireworks): true when it did. */
    skyTap?: (x: number, y: number) => boolean;
    /** One of our birthdays: the cake is out (cake.svelte.ts). */
    cake?: boolean;
    /** Tap-to-walk (spec §4): a tap nothing else took, on the ground at world (x, z): true when my villager set off. */
    walk?: (x: number, z: number, hit: SceneHit) => boolean;
    /** A tap on a tree (scenery.svelte.ts' tap areas: an oak, a cedar, a palm): it rustles, three quick ones shake it (IslandScene;
     *  true when it took the tap). */
    tree?: (id: string) => boolean;
    /** A tap on a seat (scenery.svelte.ts' `sit` tap areas, its piece's id: a bench, a stool, the hammock): my villager walks up to it and
     *  sits or lies on it (IslandScene sitOn; true when it took the tap). */
    sit?: (piece: string) => boolean;
  }
  let { scene, season, tod, enabled, swallowed, say, ontrick, exercise = false, skyTap, cake = false, walk, tree, sit }: Props = $props();
  const w = useWorld();

  type Kind = 'bush' | 'fire' | 'flower' | 'cloud' | 'sun' | 'moon' | 'star' | 'shoot' | 'wish' | 'splash' | 'sand' | 'grass';
  /** The flourishes drawn in the fixed sky (stage px, DOM: the sky isn't the island); the rest are the 3D island's where
   *  the tap landed (fx3d, no DOM: R4 step 7). */
  const SKY_KINDS: readonly Kind[] = ['cloud', 'sun', 'moon', 'star', 'shoot', 'wish'];
  interface Fx {
    id: number;
    kind: Kind;
    /** sky: px from the stage's top-left; on the ground: world x and z, `lift` units above it. */
    x: number;
    y: number;
    lift?: number;
    /** bush: what it sheds; grass: 'snow' in winter; splash: 'pond' (a small one); flower: its petals' colour (the
     *  sparkle's tint). */
    v?: string;
    /** a rare extra: 'butterfly' | 'firefly' | 'fish'. */
    rare?: string;
    /** cloud: the side the puffs fly off (−1 / 1). */
    dir?: number;
    /** shoot: its heading (deg) and length (px). */
    a?: number;
    len?: number;
  }
  const MAX_FX = 4;
  const LIFE_MS = 1100;
  const TAP_ID = 'scene-tap';
  let fx = $state<Fx[]>([]);
  const skyFx = $derived(fx.filter((f) => SKY_KINDS.includes(f.kind)));
  let seq = 0;
  const { later, clear } = timers();
  const night = $derived(tod === 'night');
  const roll = (n: number) => Math.random() * n < 1;
  let critters = $state<Critters>();
  let finds = $state<Finds>();
  let care = $state<Care>();
  let visitor = $state<Visitor>();
  /** The day's guest (visitor.svelte.ts' other slot: visitorRoles.ts, at the guest spot). */
  let guest = $state<Visitor>();
  let kk = $state<KK>();
  let deck = $state<Prop>();
  let cakeEl = $state<Prop>();
  // Loaded the first time they're due (their chunks stay out of the first load), then kept: a visitor (who leaves
  // the way they came), the tape deck (a fixed piece of the layout, there every day: its tap says when it plays), a
  // birthday's cake.
  const visitorM = lazyModule(() => import('./visitor.svelte.ts')), kkM = lazyModule(() => import('./kk.svelte.ts')), deckM = lazyModule(() => import('./deck.svelte.ts')), cakeM = lazyModule(() => import('./cake.svelte.ts'));
  const VisitorM = $derived(visitorM.get(!!visitorNow(minuteNow()) || !!guestNow(minuteNow())));
  /** Whether the day's visitor stands on centre stage now (the guest then stands beside it, with no guest spot down). */
  const stageTaken = () => ((v) => !!v && !onBeach(v))(visitorNow(minuteNow()));
  const DeckM = $derived(deckM.get(true));
  // K.K. on his stool (a piece of the layout, there every day: kk.svelte.ts)
  const KKM = $derived(kkM.get(true));
  const CakeM = $derived(cakeM.get(cake));
  // (each a model whose effects run in a root of its own, started once its chunk is in: stopped with the scene)
  $effect(() => {
    const m = VisitorM;
    if (!m) return;
    const v = untrack(() => m.useVisitor(w, { scene: () => scene, enabled, say, ontrick })), g = untrack(() => m.useVisitor(w, { scene: () => scene, enabled, say, ontrick, slot: 'guest', stageTaken }));
    visitor = v;
    guest = g;
    return () => {
      v.stop();
      g.stop();
      visitor = guest = undefined;
    };
  });
  $effect(() => {
    const m = KKM;
    if (!m) return;
    const k = untrack(() => m.useKK(w, { scene: () => scene, enabled, say }));
    kk = k;
    return () => (k.stop(), (kk = undefined));
  });
  $effect(() => {
    const m = DeckM;
    if (!m) return;
    const d = untrack(() => m.useDeck(w, { enabled, exercise: () => exercise, say }));
    deck = d;
    return () => (d.stop(), (deck = undefined));
  });
  $effect(() => {
    const m = CakeM;
    if (!m) return;
    const c = untrack(() => m.useCake(w, { enabled, on: () => cake }));
    cakeEl = c;
    return () => (c.stop(), (cakeEl = undefined));
  });
  /** A caption's nudge in from the screen's sides (EDGE: Gulliver may lie near one), measured as it shows. */
  function edgeIn(el: HTMLElement) {
    // (a frame on: its node placed by the projector first)
    const id = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect(), wd = el.offsetWidth, x0 = r.left + (r.width - wd) / 2;
      el.style.setProperty('--shift', `${Math.max(EDGE - x0, Math.min(0, innerWidth - EDGE - (x0 + wd)))}px`);
    });
    return () => cancelAnimationFrame(id);
  }
  // The critters, the day's finds and the weeds (their own chunks, out of the first load: nothing to show or tap before
  // the 3D island, so they load beside it)
  const crittersM = lazyModule(() => import('./critters.svelte.ts')), findsM = lazyModule(() => import('./finds.svelte.ts')), careM = lazyModule(() => import('./care.svelte.ts'));
  const CrittersM = $derived(crittersM.get(true)), FindsM = $derived(findsM.get(true)), CareM = $derived(careM.get(true));
  // (the critters', the finds' and the care's models, each its effects in a root of its own: stopped with the scene)
  $effect(() => {
    const m = CrittersM;
    if (!m) return;
    const c = untrack(() => m.useCritters(w, { scene: () => scene, enabled }));
    critters = c;
    return () => {
      c.stop();
      critters = undefined;
    };
  });
  $effect(() => {
    const m = FindsM;
    if (!m) return;
    const f = untrack(() => m.useFinds(w, { scene: () => scene, enabled }));
    finds = f;
    return () => {
      f.stop();
      finds = undefined;
    };
  });
  $effect(() => {
    const m = CareM;
    if (!m) return;
    const c = untrack(() => m.useCare(w, { scene: () => scene, enabled, rockBug: (x, z) => critters?.fromRock(x, z) }));
    care = c;
    return () => {
      c.stop();
      care = undefined;
    };
  });
  /** The shooting star crossing now: a tap in the sky before `until` is a wish on it (NH), once. */
  let streak: { until: number; wished: boolean } | null = null;

  $effect(() => clear);

  /** A ground flourish, the 3D island's (fx3d.ts): a splash (a rare fish's leap: a second, bigger one), sand or grass
   *  kicked up, a bush's leaves, a fire's sparks, a watering (the can tipping over it, the drops, a sparkle; a rare
   *  butterfly or firefly: a glint over it). */
  function ground3(f: Omit<Fx, 'id'>) {
    const lift = f.lift ?? 0;
    switch (f.kind) {
      case 'splash':
        fx3d('splash', f.x, f.y, 0, { size: f.v === 'pond' ? 0.6 : 1 });
        if (f.rare === 'fish') later(() => fx3d('splash', f.x, f.y, 0, { size: 1.3 }), 300);
        return;
      case 'sand': return void fx3d('sand', f.x, f.y);
      case 'grass': return void fx3d(f.v === 'snow' ? 'snow' : 'dust', f.x, f.y, 0, { v: '#cfe8a6' });
      case 'bush': return void fx3d('leaves', f.x, f.y, lift, { v: f.v === 'leaf' ? undefined : f.v === 'snow' ? 'snowflake' : f.v === 'maple-leaf' || f.v === 'petal' || f.v === 'snowflake' ? f.v : undefined });
      case 'fire': return void fx3d('sparks', f.x, f.y, lift);
      case 'flower':
        fx3d('art', f.x, f.y, lift + 14, { art: findArt('watering-can'), v: 'rise', size: 22, ms: 900 });
        fx3d('drops', f.x, f.y, 0);
        fx3d('sparkle', f.x, f.y, 6, { size: 0.7, v: f.v });
        if (f.rare) later(() => fx3d('glint', f.x, f.y, lift + 22, { size: 1.6 }), 400);
        return;
    }
  }
  function spawn(f: Omit<Fx, 'id'>, ms = LIFE_MS) {
    if (!SKY_KINDS.includes(f.kind)) return ground3(f);
    const id = ++seq;
    fx = [...fx.slice(-(MAX_FX - 1)), { ...f, id }];
    later(() => (fx = fx.filter((g) => g.id !== id)), ms);
  }

  /** A one-shot Web Animation on a sky element (the sun, the moon, a cloud: replacing the last tap's, so a quick re-tap
   *  restarts it). */
  function jiggle(el: Element | null | undefined, frames: Keyframe[], ms: number) {
    if (!el) return;
    for (const a of el.getAnimations()) if (a.id === TAP_ID) a.cancel();
    el.animate(frames, { duration: ms, easing: 'cubic-bezier(.3, .7, .4, 1)', id: TAP_ID });
  }
  const SQUISH: Keyframe[] = [
    { scale: '1' }, { scale: '1.1 .86', offset: 0.22 }, { scale: '.95 1.07', offset: 0.5 }, { scale: '1.02 .98', offset: 0.76 }, { scale: '1' }
  ];
  const POP: Keyframe[] = [{ scale: '1' }, { scale: '1.18', offset: 0.3 }, { scale: '.96', offset: 0.65 }, { scale: '1' }];

  const shed = (s: Season): string => (s === 'spring' ? 'petal' : s === 'autumn' ? 'maple-leaf' : s === 'winter' ? 'snow' : 'leaf');

  /** A box padded to ≥ 44px each way (shrunk to its middle 70% first: the sun's glow is wider than the sun). */
  function near(r: DOMRect, x: number, y: number, core = 1): boolean {
    const w = Math.max(44, r.width * core), h = Math.max(44, r.height * core);
    return Math.abs(x - (r.left + r.width / 2)) <= w / 2 && Math.abs(y - (r.top + r.height / 2)) <= h / 2;
  }

  /** Whether (x, y) (client px) is on the sun, the moon or a cloud. */
  function inSky(x: number, y: number): boolean {
    const orb = scene?.querySelector('.orb')?.getBoundingClientRect();
    if (orb && near(orb, x, y, 0.7)) return true;
    return [...(scene?.querySelectorAll('.cloud') ?? [])].some((c) => near(c.getBoundingClientRect(), x, y));
  }

  /** A tap on my villager (IslandScene's button): now and then a flea hops off it (critters.svelte.ts). */
  export function villagerTap() {
    if (enabled()) critters?.fromVillager();
  }

  /** A bush by its scenery id (world.ts SCENERY, or the river-bank hedge's `hedge-<i>`): its feet and height. */
  function bushAt(id: string): { x: number; z: number; h: number } | null {
    const m = /^hedge-(\d+)$/.exec(id);
    if (m && HEDGE_XS.length) return HEDGE_XS[+m[1]] === undefined ? null : { x: HEDGE_XS[+m[1]], z: HEDGE_Z, h: BUSH_U };
    const s = SCENERY.find((t) => t.id === id);
    return s ? { x: s.x, z: s.z, h: s.h } : null;
  }
  /** A shaken bush lets a bug out now and then (critters.svelte.ts' hook, at the bush: world x, z and the height of its top). */
  const bushBug = (x: number, z: number, lift: number) =>
    (critters as unknown as { fromBush?: (x: number, z: number, lift: number) => void } | undefined)?.fromBush?.(x, z, lift);

  /** Whether the click comes from the pointerdown that closed a tree's popup (IslandScene marks it in the capture phase,
   *  before this sees the pointerdown): that tap only closes it. */
  let downSwallowed = false;
  function onDown(e: PointerEvent) {
    downSwallowed = !!swallowed && e === swallowed();
  }

  /** The plot under world (x, z) that farmAt farms (its tile's), or null. */
  function plotUnder(x: number, z: number): string | null {
    const layout = site.layout ?? layoutStore.current, [c, r] = tileAt(x, z), plot = layout ? plotAt(layout, c, r) : undefined;
    return week.model && plot ? String(plot.p) : null;
  }
  /** The island's controls (probe.ts CONTROLS): a tap on one is its, but for a plot under it, a visitor before a door,
   *  a bug in front. */
  const CONTROL_KINDS: ReadonlySet<string> = new Set(['villager', 'building', 'decor', 'goal', 'row', 'talk', 'board', 'balloon', 'swarm', 'drop', 'ui']);
  const SCENERY_KINDS: ReadonlySet<string> = new Set(['tree', 'bush', 'campfire', 'sit', 'fixture', 'flower']);
  /** What a tap hit-tests to (probe.ts Picked: a control or a scenery thing, and what else the same area is). */
  type Under = { kind: string; id: string; also?: readonly { kind: string; id: string }[] };
  /**
   * The scene's chain, the tap's and its dry run's (R4 step 6: one chain): what a tap at client (cx, cy) on the stage
   * goes to before the controls, the scenery and the ground, given what it hit-tests to (`under`: probe.ts pickOf the
   * DOM's node, or the 3D pick's tap areas: world3d/pick3d.ts); `src`: the modules' boxes from their DOM art or from the
   * 3D island; `onHouse`: whether a point is on that building's body (3d; the DOM reads its door). `run`: each module's
   * tap() acts (its claim's id then ''), else their claims() (no side effect: the 3D pick's oracle). Null: the control or
   * the scenery `under` takes it, else the ground or the sky. Kinds: plot (id its plot), visitor (who), reel, critter
   * (its species), chase, bubbles, deck, cake, find (its uid), care (a weed's uid, rock), kk, fish (the water's kind).
   */
  function chain(cx: number, cy: number, under: Under | null, src: Src, onHouse: ((px: number, py: number) => boolean) | undefined, run: boolean): Claim | null {
    const stage = scene?.querySelector<HTMLElement>('.stage');
    if (!enabled() || !stage) return null;
    const k = under?.kind ?? null, top = stage.getBoundingClientRect().top;
    const step = (kind: string, dry: () => string | boolean | null | undefined, act: () => boolean | undefined): Claim | null =>
      run ? (act() ? { kind, id: '' } : null) : ((v) => (v ? { kind, id: v === true ? '' : v } : null))(dry());
    const bug = (seen: Seen, reel: boolean): Claim | null =>
      run ? (critters?.tap(cx, cy, seen, reel, src) ? { kind: 'critter', id: '' } : null) : (critters?.claims(cx, cy, seen, reel, src) ?? null);
    const vis = (body: boolean) => step('visitor', () => visitor?.claims(cx, cy, body) ?? guest?.claims(cx, cy, body), () => visitor?.tap(cx, cy, body) || guest?.tap(cx, cy, body));
    const kk_ = () => step('kk', () => kk?.claims(cx, cy), () => kk?.tap(cx, cy));
    const plot = () => {
      const g = cy - top < w.view.horizon ? null : w.worldAtClient(cx, cy);
      return step('plot', () => g && plotUnder(g.x, g.z), () => !!g && farmAt(g.x, g.z));
    };
    const prop = (p: Prop | undefined, kind: string, seen: Seen) => step(kind, () => p?.claims(cx, cy, seen), () => p?.tap(cx, cy, seen));
    const finds_ = (seen: Seen) => step('find', () => finds?.claims(cx, cy, seen, src), () => finds?.tap(cx, cy, seen, src));
    const care_ = (seen: Seen) => step('care', () => care?.claims(cx, cy, seen, src), () => care?.tap(cx, cy, seen, src));
    const fish = (seen: Seen) => step('fish', () => critters?.fishClaims(cx, cy, seen), () => critters?.fish(cx, cy, seen));
    // a plot under a goal tree's canopy or trunk, or a villager (their tap areas reach over a field beside them): the
    // plot's, farmed where it is; a bug in front keeps its tap
    if ((k === 'goal' || k === 'villager') && !critters?.lineOut() && !critters?.onCritter(cx, cy)) {
      const p = plot();
      if (p) return p;
    }
    // a visitor standing in front of a building (K.K. and Jack at night before the campsite) over its door: theirs (the
    // 3D island's camera shows the door small behind them)
    if (k === 'building') {
      const v = vis(false) ?? kk_();
      if (v) return v;
    }
    // my line out: a tap anywhere on the island is its reel (NH's A button: my villager, a tree, a seat, the water), but
    // a building's door, which one goes through with it (the line ends there)
    if (critters?.lineOut() && k !== 'building') return step('reel', () => true, () => critters?.tap(cx, cy));
    if (k === 'building') {
      // what the island tests by position in front of a building's body (its tap area: the model's silhouette), a
      // present lying before it, a fish in the pond before it, a bug by its wall: theirs, not the door's; what's behind
      // it is hidden, but where some of it is off the building's area on screen
      const before = notBehind(footprint(under!.id as BuildingId)), off = (px: number, py: number) => !onHouse?.(px, py);
      const seen: Seen = (x, z, r = 0) => {
        if (before(x, z)) return true;
        const [px, py] = w.clientAt(x, z);
        return r > 0 && [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => off(px + dx, py + dy));
      };
      const c = bug(seen, false) ?? prop(deck, 'deck', seen) ?? prop(cakeEl, 'cake', seen) ?? finds_(seen) ?? care_(seen) ?? fish(seen);
      if (c) return c;
    }
    // a bug in front of the island's own controls (flying past my villager, a tree's canopy, a door): the bug's (it was
    // in view; the net is what the tap was for), else theirs
    if (k && CONTROL_KINDS.has(k)) return critters?.onCritter(cx, cy) ? bug(SHOWN, true) : null;
    // the critters (hit-tested against their live boxes; a cast bobber takes any tap), group stretching's tape deck
    // (small and exact, before the visitor's wider reach), a birthday's cake; then what's exactly under the finger: a
    // visitor's figure, a plot (a field's tile, docs/farming.md: farmed where it is, before a weed's or a find's slack
    // round them reaches over it, never walked to), the day's finds (a shell, a fragment, the bottle, a dig spot, a
    // present) and the island's care (a weed, the rock) on their own boxes; the visitor's reach (a finger's slack round
    // it); K.K. on his stool (his figure's box is wider than he is: a shell by his stool is the shell's); the water under
    // the finger with nothing of the island's over it (a canopy over the pond shakes its tree): a cast, however far
    return bug(SHOWN, true) ?? prop(deck, 'deck', SHOWN) ?? prop(cakeEl, 'cake', SHOWN) ?? vis(true) ?? plot() ?? finds_(SHOWN) ?? care_(SHOWN) ?? vis(false)
      ?? kk_() ?? (k && SCENERY_KINDS.has(k) ? null : fish(SHOWN));
  }
  /** The chain's dry run (things3 claims: the 3D pick's figure layer and its oracle, world3d/pick3d.ts claimAt). */
  export const claims = (cx: number, cy: number, under: Under | null, src: Src = 'dom', onHouse?: (px: number, py: number) => boolean): Claim | null =>
    chain(cx, cy, under, src, onHouse, false);
  $effect(() => {
    const r = things3(w);
    r.claims = claims;
    return () => void (r.claims === claims && (r.claims = undefined));
  });

  /** A tap on the island, as the DOM hit-tests it (the island's buttons are the DOM's: theirs act after this, on the
   *  root; a kind whose nodes are gone, a flower, by its tap area: things3 gone): the chain on the DOM's answer, else
   *  the scenery or the ground. */
  function onClick(e: MouseEvent) {
    if (downSwallowed) return void (downSwallowed = false);
    const t = e.target, stage = scene?.querySelector<HTMLElement>('.stage');
    if (e.button > 0 || !enabled() || !(t instanceof Element) || !stage) return;
    const cx = e.clientX, cy = e.clientY, on = stage.contains(t), gone = on && !pickOf(t) ? things3(w).gone?.(cx, cy) : null;
    const under = on ? (pickOf(t) ?? gone ?? null) : null, control = !!under && CONTROL_KINDS.has(under.kind);
    // (a field, a label, the HUD's buttons: theirs; my line out still reels on the island)
    if (!control && t.closest('button, a, input, select, textarea, label, dialog, [role="button"], [tabindex]')) {
      if (on && critters?.lineOut()) (critters.tap(cx, cy), e.stopPropagation());
      return;
    }
    const c = chain(cx, cy, under, 'dom', gone?.onHouse, true);
    if (c) {
      // (before the control's own handler: delegated to the root, after this one)
      if (control || c.kind === 'reel') e.stopPropagation();
      if (control && c.kind === 'plot') e.preventDefault();
      return;
    }
    // (a control whose button is gone, the decor: its tap area's act)
    if (control) gone?.act?.(e);
    else scenery(cx, cy, under);
  }

  /** The canvas router (R4 step 6, with the pick3d switch: things3 route, Island3D's): a tap on the island goes by the
   *  3D pick, never to the DOM island's buttons (stopped here, on the stage in the capture phase, before them): the chain
   *  on the 3D boxes, else the control's own act (its tap area's), else the scenery or the ground. Where the DOM stays
   *  (route's 'dom': an overlay, the HUD's buttons, the speech balloon) and a click with no point (a keyboard's, an
   *  el.click(): no detail, at 0, 0), the DOM's (onClick). A touch on a fling only stops it. */
  function onRoute(e: MouseEvent) {
    const route = things3(w).route;
    if (!route || e.button > 0 || (!e.detail && !e.clientX && !e.clientY)) return;
    const cx = e.clientX, cy = e.clientY, r = route(cx, cy);
    if (r === 'dom') return;
    e.stopPropagation();
    e.preventDefault();
    const swallowed = downSwallowed;
    downSwallowed = false;
    if (r === 'rush') return;
    const control = !!r.under && CONTROL_KINDS.has(r.under.kind), act = () => void (control && r.tap?.act?.(cx, cy, r.area!, e));
    // (the touch that closed a tree's popup only closes it, as onClick, but on a control: its button's own, as the DOM's)
    if (swallowed || !enabled()) return act();
    if (chain(cx, cy, r.under, '3d', r.onHouse, true)) return;
    if (control) return act();
    scenery(cx, cy, r.under);
  }

  /** A tap the chain and the controls left: the scenery thing `under` is (by its id: a tree, a bush, the campfire, a
   *  seat, the fixed decor, a flower), else the sky above the horizon or the ground under the finger. */
  function scenery(cx: number, cy: number, under: Under | null) {
    const r = scene!.querySelector<HTMLElement>('.stage')!.getBoundingClientRect();
    const idOf = (kind: string) => (under?.kind === kind ? under.id : under?.also?.find((o) => o.kind === kind)?.id);
    // (a tree top reaching into the sky leaves the sun, the moon and the clouds theirs)
    const treeId = idOf('tree');
    if (treeId !== undefined && !(cy - r.top < w.view.horizon && inSky(cx, cy)) && tree?.(treeId)) return;
    const bushId = idOf('bush'), b = bushId !== undefined && bushAt(bushId);
    if (b) return bush(bushId!, b);
    const fireId = idOf('campfire'), fire = fireId !== undefined && SCENERY.find((s) => s.id === fireId);
    if (fire) return poke(fireId!, fire);
    // a seat: walked up to and sat or lain on (the one exception, with the doors, to "it answers where it stands")
    const sitId = idOf('sit');
    if (sitId !== undefined && sit?.(sitId)) return;
    const fxId = idOf('fixture');
    if (fxId !== undefined) return fixture(fxId);
    const fl = ((id) => id !== undefined && flowerById(id))(idOf('flower'));
    if (fl) return flower(fl);
    // the sky: above the horizon (where the ground's inverse projection finds nothing)
    const at = cy - r.top < w.view.horizon ? null : w.worldAtClient(cx, cy);
    if (!at) return sky(cx, cy, r);
    const { x, z } = at;
    const hit = hitWorld(x, z);
    // tap-to-walk (spec §4): my villager sets off there (to the nearest bank for water); on land its tap ring is the
    // flourish, on water the ripple still plays
    const walked = walk?.(x, z, hit) ?? false;
    switch (hit.kind) {
      case 'sea': {
        const rare = roll(10) ? 'fish' : undefined;
        spawn({ kind: 'splash', x, y: z, rare });
        return sceneSfx(rare ? 'fish' : 'splash');
      }
      case 'pond':
      case 'river':
        // still or flowing fresh water: a small ring and a few drops (no fish darting off: its fish come by on their own)
        spawn({ kind: 'splash', x, y: z, v: 'pond' });
        return sceneSfx('splash');
      case 'sand':
        if (walked) return;
        spawn({ kind: 'sand', x, y: z });
        return sceneSfx('sand');
      default: {
        if (walked) return;
        const snow = season === 'winter';
        spawn({ kind: 'grass', x, y: z, v: snow ? 'snow' : undefined });
        return sceneSfx(snow ? 'snow' : 'grass');
      }
    }
  }

  /** A bush: my villager turns to it (avatar.ts) and THAT bush rustles and sheds (and on the partner's phone too). */
  function bush(id: string, b: { x: number; z: number; h: number }) {
    shared.share({ kind: 'act', act: 'bush', id, pt: [Math.round(b.x), Math.round(b.z)] });
    turnTo(b.x);
    echo3d(id);
    spawn({ kind: 'bush', x: b.x, y: b.z, lift: b.h * 0.62, v: shed(season) });
    bushBug(b.x, b.z, b.h * 0.7);
    sceneSfx('bush');
  }

  /** The campfire poked (where it is: nobody walks): its logs shift, sparks fly up, a soft crackle. */
  function poke(id: string, f: { x: number; z: number; h: number }) {
    turnTo(f.x);
    echo3d(id);
    spawn({ kind: 'fire', x: f.x, y: f.z, lift: f.h * 0.3 });
    sceneSfx('campfire');
  }

  let snowLine = 0;
  /** The pump (NH's water pump): its gush waters every wild flower within PUMP_U (each as a tap's watering does: on
   *  both phones, the shared day's `watered`), a sprinkle over the nearest two. */
  const PUMP_U = 70;
  function pump(x: number, z: number) {
    sceneSfx('pump');
    const near = FLOWERS.filter((f) => Math.hypot(f.x - x, f.z - z) <= PUMP_U).sort((a, b) => Math.hypot(a.x - x, a.z - z) - Math.hypot(b.x - x, b.z - z));
    for (const f of near) {
      water(dayKey(), f.id);
      shared.share({ kind: 'world', op: 'watered', id: f.id });
    }
    for (const f of near.slice(0, 2)) spawn({ kind: 'flower', x: f.x, y: f.z, lift: FLOWER_U * 0.72, v: petalOf(wildFlower(f, season)) });
    if (near.length) later(() => sceneSfx('water'), 420);
  }
  /** The fixed decor (fixedDecor.ts) tapped: it answers where it stands (nobody walks), my villager turns to it. */
  function fixture(id: string) {
    const look = sceneryOf(w)?.fixtures.find((f) => f.id === id)?.key ?? '';
    const slot = DECOR_SLOTS.find((d) => d.id === id);
    const [x, z] = slot ? [slot.x, slot.z] : ARCH;
    turnTo(x);
    echo3d(id);
    if (id === 'bench-mae' || id === 'bench-pond') {
      spawn({ kind: 'bush', x, y: z, lift: 24, v: shed(season) });
      return sceneSfx('bench');
    }
    if (id === 'shishi') {
      document.dispatchEvent(new CustomEvent('island:shishi'));
      return;
    }
    if (id === 'pullup') return sceneSfx('bar');
    if (id === 'pump') return pump(x, z);
    if (/snowboy/.test(look)) {
      // the snowboy's line, in its voice (melting: a little smaller)
      const melt = Number(look.slice(-1)) >= 2;
      const from = pieceSpeaker(w, id);
      if (from) say?.(t('world.snowboy'), t(melt ? 'world.snowboy.melt' : `world.snowboy.${snowLine++ % 3}`), from, { colour: '#DDEBFA' });
    }
    if (id === 'sandcastle' || /snowboy/.test(look)) {
      spawn({ kind: id === 'sandcastle' ? 'sand' : 'grass', x, y: z, v: id === 'sandcastle' ? undefined : 'snow' });
      return sceneSfx(id === 'sandcastle' ? 'sand' : 'snow');
    }
    sceneSfx('decor');
  }

  /** A wild flower: my villager waters it. */
  function flower(f: Flower) {
    const color = petalOf(wildFlower(f, season));
    // NH: butterflies by day among the flowers (not in winter); fireflies on summer nights
    const rare = night ? (season === 'summer' && roll(2) ? 'firefly' : undefined) : season !== 'winter' && roll(8) ? 'butterfly' : undefined;
    water(dayKey(), f.id);
    // the partner's phone: the flower glitters there too, my villager waters it
    shared.share({ kind: 'world', op: 'watered', id: f.id });
    // my villager turns to it; the watering can floats over the bloom
    turnTo(f.x);
    echo3d(f.id);
    // NH's watering can: a tilt over the bloom, a sprinkle, the flower glitters (and maybe grows a hybrid tomorrow)
    spawn({ kind: 'flower', x: f.x, y: f.z, lift: FLOWER_U * 0.72, v: color, rare });
    sceneSfx('water');
    if (rare === 'butterfly') sceneSfx('butterfly');
  }

  /**
   * A tap on a plot (docs/farming.md "Playing", world/farmTap.ts): it acts where it is (nobody walks; my villager turns
   * to it), the tapped plot deciding: my ripe plant harvests all my ripe ones in its 3 × 3 (a plate a crop), a plant
   * waters the plants there whose watering counts (NH's golden can, on every phone: the shared day's `watered`), a miss
   * harvests my ripe ones near it, my empty plot plants my empty plots of its 3 × 3 (with 取り消す; the crop: `forced`,
   * the picker's pick, else this planting run's, else the one kind I hold, else the picker, whose pick runs this again),
   * else a word (who watered it; ほる on my own plant); the verb pops over the plot (FarmPop). False: no field there.
   */
  function farmAt(x: number, z: number, forced?: Seed): boolean {
    const m = week.model, layout = site.layout ?? layoutStore.current;
    const [c, r] = tileAt(x, z);
    const plot = layout ? plotAt(layout, c, r) : undefined;
    if (!m || !layout || !plot) return false;
    const date = week.view?.today ?? islandDay();
    const { farm, watered } = farmToday(m.state, date);
    const pocket = shopView(m.state, m.me).pocket, have = (k: string) => pocket.get(k) ?? 0;
    const kinds = (['start', 'crop'] as const).flatMap((src) => CROPS.flatMap((c) => (have(seedKey(c, src)) > 0 ? [{ c, src }] : [])));
    const run = plantRun.crop(performance.now());
    const pl = farm.plots.get(plot.p), mine = plantsOf(farm, m.me);
    const around = plotsAround(layout, plot).map((n) => ({ ...n, plant: farm.plots.get(n.p) }));
    const by = date === islandDay() ? shared.day.watered[plot.p] : undefined;
    const act = farmTap({ me: m.me, plot, plant: pl, around, date, watered, by, seed: forced ?? run, kinds, have, mine });
    const there = act.a === 'harvest' ? around.find((n) => n.p === act.ops[0].p)! : plot;
    const [px, pz] = tileMid(there.c, there.r);
    if (act.a !== 'pick') turnTo(px);
    const top = w.screenAt(px, pz, 6), pop = (text: string, dig?: () => void) => popAt(text, top.sx, top.sy, dig);
    // a word naming a crop waits on the crops' names (their own chunk: catchLine.ts loadNames), never a raw key
    const named = (then: () => void) => void loadNames().then(then, () => {});
    switch (act.a) {
      case 'harvest': {
        // NH's pick-up: a puff where I tapped, a sparkle over each plant picked (40 ms apart), one pop a tap (a semitone
        // up each quick tap after), a plate a crop counting up
        const ops = act.ops;
        harvestMany(date, ops);
        const [tx, tz] = tileMid(plot.c, plot.r);
        spawn({ kind: 'grass', x: tx, y: tz });
        ops.forEach((o, i) => {
          const n = around.find((a) => a.p === o.p)!, [sx, sz] = tileMid(n.c, n.r);
          later(() => harvestSparkle(sx, sz), i * 40);
        });
        const now = performance.now();
        harvestRun = { k: now - harvestRun.at <= HARVEST_RUN_MS ? Math.min(5, harvestRun.k + 1) : 0, at: now };
        cue('scene-harvest', { step: harvestRun.k });
        const [ux, uy] = w.screenU(px, pz, 4);
        void Promise.all([import('./harvestPlate.ts'), loadNames()]).then(([{ showHarvest }]) => showHarvest(ux, uy, ops), () => {});
        return true;
      }
      case 'water':
        waterAll(act.ids);
        spawn({ kind: 'flower', x: px, y: pz, lift: 8, v: '#8FD0F5' });
        sceneSfx('water');
        pop(t('world.farm.water', { n: act.ids.length, k: FARM.maxYield }));
        return true;
      case 'plant': {
        // one event held for its 取り消す (the shop's banner); the shovel and a puff over the tapped plot
        const { ps, c: crop, src } = act, sent = plantMany(date, ps, crop, src), n = ps.length;
        if (!sent.ok) return true;
        // (its 取り消す ends the run too)
        const res = plantRun.planted({ c: crop, src }, performance.now(), sent);
        spawn({ kind: 'grass', x: px, y: pz });
        fx3d('swing', px, pz, 0, { v: 'shovel' });
        sceneSfx('dig');
        // one word, the banner with its とりけす (world kana), even if the names never load (then the start's own name)
        const banner = (name: string) => undoBanner(t('world.farm.planted', { name, n, mine: mine + n, cap: FARM.cap }), res, { world: true });
        void loadNames().then(() => banner(cropName(crop)), () => banner(t(`farm.start.${crop}`)));
        return true;
      }
      case 'pick': {
        // (its pick runs this tap again with that crop)
        const out = act.out;
        if (out) named(() => pop(t('world.farm.noneLeft', { name: cropName(out) })));
        openPicker((s) => void farmAt(x, z, s));
        return true;
      }
      case 'none':
        pop(t('world.farm.noSeed'));
        return true;
      case 'cap':
        pop(t('world.farm.cap', { cap: FARM.cap }));
        return true;
      default: {
        // (my own plant without my name; ほる with it: its start back, 取り消す puts it back)
        const who = whoName(act.who), c = act.c, n = act.left;
        if (!c) pop(t('world.farm.whose', { who }));
        else {
          const digUp = act.dig ? () => {
            const res = dig(date, plot.p);
            if (!res.ok) return;
            spawn({ kind: 'grass', x: px, y: pz });
            fx3d('swing', px, pz, 0, { v: 'shovel' });
            sceneSfx('dig');
            undoBanner(t('world.farm.dug', { name: cropName(c) }), res, { world: true });
          } : undefined;
          named(() => {
            const name = cropName(c);
            // (thanks only for help: its owner watering their own plant is no 「…が みずを やってくれた」 to the partner)
            pop(act.by && act.by !== m.me && act.by !== act.who ? t('world.farm.wateredBy', { who: whoName(act.by) })
              : n ? t(act.who === m.me ? 'world.farm.leftMine' : 'world.farm.left', { who, name, k: act.watered ? FARM.maxYield : 1 })
              : act.watered ? t('world.farm.watered') : t('world.farm.ripe', { who, name }), digUp);
          });
        }
        return true;
      }
    }
  }
  /** A run of harvest taps (each within HARVEST_RUN_MS of the last): its pop climbs a semitone a tap, at most 5. */
  const HARVEST_RUN_MS = 2500;
  let harvestRun = { k: 0, at: -Infinity };
  /** The planting run (world/farmTap.ts plantingRun): the crop planted again without asking for a minute. */
  const plantRun = plantingRun();
  /** A player's villager name (the farm's words). */
  const whoName = (who: Who): string => (who === 'G' ? week.view?.guest.villagerName : week.view?.people[who].villagerName) ?? who;

  /** A harvested plant's sparkle (a world tap's ripple). */
  const harvestSparkle = (x: number, z: number) => fx3d('sparkle', x, z, 6, { size: 0.6, v: '#FFE27A' });

  /** A tap in the sky (x, y: px from the stage's top-left). */
  function sky(cx: number, cy: number, r: DOMRect) {
    const s = scene!, x = cx - r.left, y = cy - r.top;
    const orb = s.querySelector('.orb');
    const o = orb?.getBoundingClientRect();
    if (orb && o && near(o, cx, cy, 0.7)) {
      const ox = o.left + o.width / 2 - r.left, oy = o.top + o.height / 2 - r.top;
      jiggle(orb, POP, 600);
      if (night) {
        spawn({ kind: 'moon', x: ox, y: oy });
        return sceneSfx('moon');
      }
      spawn({ kind: 'sun', x: ox, y: oy });
      return sceneSfx('sun');
    }
    for (const c of s.querySelectorAll('.cloud')) {
      const b = c.getBoundingClientRect();
      if (!near(b, cx, cy)) continue;
      jiggle(c, SQUISH, 620);
      // the wisps break off the cloud's edge on the tapped side (white on white would vanish inside it)
      const dir = cx < b.left + b.width / 2 ? -1 : 1;
      const ex = (dir < 0 ? b.left + b.width * 0.1 : b.right - b.width * 0.1) - r.left;
      spawn({ kind: 'cloud', x: ex, y: b.top + b.height * 0.55 - r.top, dir });
      return sceneSfx('cloud');
    }
    // a wish comes first (it's only a moment); then, during a show, one more firework where the tap was
    const now = streak;
    if (night && now && !now.wished && performance.now() < now.until) {
      now.wished = true;
      spawn({ kind: 'wish', x, y });
      sceneSfx('wish');
      // a star the preview brought (せってい's きせつ) brings no fragment: the island's finds are the real day's
      if (scenePreview().on || !finds) return;
      finds.wish();
      return wishNote(cx, cy);
    }
    if (skyTap?.(cx, cy)) return;
    if (!night) return;
    spawn({ kind: 'star', x, y });
    sceneSfx('star');
  }

  /** A wish's caption (stage px, placed clear of every control): a small cream caption by the tap that floats up a
   *  little and fades (NH has no words for it: the moment). */
  let note = $state<{ n: number; x: number; y: number; placed: boolean } | null>(null);
  let noteEl = $state<HTMLElement>();
  function wishNote(px: number, py: number) {
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

  /** NH's shooting star: a quick white streak falling to the lower left through the night sky, its whole path inside
   *  the fixed sky (under the status bar, above the horizon: the camera's, data-horizon) and clear of every control (the
   *  dumbbell, the bowl, the leaf menu, the sync chip). */
  function shootingStar() {
    const g = stageGeo(scene);
    const band = scene?.querySelector('.band')?.getBoundingClientRect();
    if (!g || !band) return;
    const r = g.r, s = scene!.getBoundingClientRect();
    // in stage px (the stage is the whole viewport: the sky is its top, down to the horizon)
    const sky = { x0: s.left - r.left + 8, x1: s.right - r.left - 8, y0: band.top - r.top + 6, y1: w.view.horizon - 14 };
    // the 3D island's whole-island view leaves the sky a sliver under the HUD on a short screen: there a streak may
    // cross on down over the island's far end (the forest's tops: NH's sky seen past them)
    if (w.three) sky.y1 = Math.max(sky.y1, sky.y0 + 150);
    const avoid = guardsU(g, 4).map((b) => ({ x0: b.x0 / g.k, x1: b.x1 / g.k, y0: b.y0 / g.k, y1: b.y1 / g.k }));
    const path = streakPath(sky, avoid, Math.random);
    if (!path) return;
    spawn({ kind: 'shoot', x: path.x, y: path.y, a: path.angle, len: path.len }, STREAK_MS + 100);
    streak = { until: performance.now() + WISH_MS, wished: false };
    sceneSfx('shooting-star');
    // a visitor watching the sky looks up at it (Celeste points: visitor.svelte.ts)
    scene?.dispatchEvent(new CustomEvent('island:star', { detail: { x: path.x } }));
  }

  /** NH's balloon present, shot down (balloon.svelte.ts sends `island:present`): it falls from where it hung on the string
   *  (`from`, world x, y, z) along a short floaty arc (balloonFlight.ts fallAt) to the spot Balloon chose for it first
   *  (`to`: open ground in the front of the view, clear of every control and of what lies there: presentLanding.ts),
   *  in `ms`, drawn in 3D (its node's model on the arc); it lands with a sparkle and lies there until a tap picks it up
   *  (finds.svelte.ts puts it for both phones: the landing spot is sent). No spot (no open ground in view at all): nothing falls. */
  type P3 = readonly [number, number, number];
  interface Drop { id: number; from: P3; to: P3; t0: number; ms: number; art: string; m3: { key: string; id: string; pitch: number; size: number } }
  let drops = $state<Drop[]>([]);
  /** A balloon's present lies this big (u). */
  const PRESENT_U = 30;
  function present(e: Event) {
    const d = (e as CustomEvent<{ from: P3; to: P3 | null; ms: number }>).detail;
    if (!d?.to || !enabled()) return;
    const id = ++seq, to = d.to;
    // Bunny Day's celebrations: now and then the balloon carried NH's sky egg instead of its present
    const egg = eggTime(eventNow(minuteNow())) && eggInBalloon();
    const art = egg ? findArt('sky-egg') : 'deco/present';
    drops = [...drops.slice(-1), { id, from: d.from, to, t0: performance.now(), ms: d.ms, art, m3: { key: art, id: `drop-${id}`, pitch: 0, size: GIFT_K } }];
    sceneSfx('present');
    // (frames while it falls)
    later(w.moveStart('present'), d.ms + 100);
    // landed: it lies there among the day's finds until it's picked up, with a sparkle and a smaller one
    later(() => finds?.present(to[0], to[2], art, PRESENT_U), d.ms);
    later(() => fx3d('sparkle', to[0], to[2], PRESENT_U * 0.8), d.ms + 50);
    later(() => fx3d('sparkle', to[0], to[2], PRESENT_U * 0.5, { size: 0.6 }), d.ms + 250);
    later(() => (drops = drops.filter((q) => q.id !== id)), d.ms + 400);
  }
  // each falling present on its arc: a things3 thing (its node's live position, no DOM)
  $effect(() => {
    const list = drops;
    return untrack(() => {
      const offs = list.map((p) => thing(w, { x: p.to[0], z: p.to[2], h: 40, always: true, live: () => fallNow(p), m3: p.m3 })());
      return () => offs.forEach((off) => off());
    });
  });
  /** The present on the balloon's string is this much of its size on the ground (NH's model, 24u: assets.json). */
  const GIFT_K = RIG.gift / 24;
  /** A falling present's feet now (its node's live position: world x, z, lift), its tumble and its size on its model
   *  (from the string's to the ground's as it falls). */
  function fallNow(p: Drop): readonly [number, number, number] {
    const k = Math.min(1, (performance.now() - p.t0) / p.ms), { at, tilt } = fallAt(p.from, p.to, k);
    p.m3.pitch = tilt;
    p.m3.size = GIFT_K + (1 - GIFT_K) * Math.min(1, k * 1.5);
    return [at[0], at[2], at[1] - w.feetAt(at[0], at[2])];
  }

  // The partner's bush shakes and waterings (the shared day's news, just now): their villager walks over and does it,
  // then the bush rustles, the flower glitters or the plots get their drops here too.
  onMount(() =>
    shared.on(({ e, live }) => {
      if (!live || !enabled()) return;
      if (e.kind === 'act' && e.act === 'bush' && e.id) {
        const b = bushAt(e.id);
        if (!b) return;
        partnerTurnTo(b.x, e.who, e.t);
        echo3d(e.id);
        spawn({ kind: 'bush', x: b.x, y: b.z, lift: b.h * 0.62, v: shed(season) });
        sceneSfx('bush', [b.x, b.z]);
      } else if (e.kind === 'world' && e.op === 'watered') {
        if (e.id.startsWith('fd:')) return plotsWatered(e.who, e.id, e.t);
        const f = flowerById(e.id);
        if (!f) return;
        partnerTurnTo(f.x, e.who, e.t);
        echo3d(f.id);
        spawn({ kind: 'flower', x: f.x, y: f.z, lift: FLOWER_U * 0.72, v: petalOf(wildFlower(f, season)) });
        sceneSfx('water', [f.x, f.z]);
      }
    })
  );

  /** The partner's or the guest's 水やり of plots (a tap's 3 × 3), each plot its own news: gathered a
   *  person PLOTS_WET_MS, then their villager turns to the first, drops over each (≤ 9, 40 ms apart), one sound there,
   *  and a heart over them when one is my plant (docs/farming.md "Playing": who watered). */
  const PLOTS_WET_MS = 400;
  const wets = new Map<Who, { ids: string[]; t: number }>();
  function plotsWatered(who: Who, id: string, t: number) {
    const was = wets.get(who);
    if (was) return void was.ids.push(id);
    wets.set(who, { ids: [id], t });
    later(() => {
      const b = wets.get(who), layout = site.layout ?? layoutStore.current, m = week.model;
      wets.delete(who);
      if (!b || !layout || !enabled()) return;
      const tiles = new Map(layoutPlots(layout).map((p) => [p.p, p]));
      const at = b.ids.flatMap((p) => (tiles.has(p) ? [tileMid(tiles.get(p)!.c, tiles.get(p)!.r)] : [])).slice(0, 9);
      if (!at.length) return;
      const cx = at.reduce((s, p) => s + p[0], 0) / at.length, cz = at.reduce((s, p) => s + p[1], 0) / at.length;
      partnerTurnTo(at[0][0], who, b.t);
      at.forEach(([x, z], i) => later(() => fx3d('drops', x, z, 0), i * 40));
      sceneSfx('water', [cx, cz]);
      const plots = m && farmToday(m.state, week.view?.today ?? islandDay()).farm.plots;
      if (m && b.ids.some((p) => plots?.get(p)?.who === m.me)) fx3d('hearts', cx, cz, 10, { size: 0.6 });
    }, PLOTS_WET_MS);
  }

  // The listeners live on the scene (a click after a drag never comes: the scroll took it).
  $effect(() => {
    const el = scene;
    if (!el) return;
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('click', onClick);
    const stage = el.querySelector<HTMLElement>('.stage');
    stage?.addEventListener('click', onRoute, true);
    el.addEventListener('island:present', present);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('click', onClick);
      stage?.removeEventListener('click', onRoute, true);
      el.removeEventListener('island:present', present);
    };
  });

  // The night sky's shooting stars (stars.ts): on a clear night (no rain or snow: weatherNow.svelte.ts) (NH's star hours) a shower every 3–8 minutes of
  // on-screen night, the first soon after the night sky shows; on a meteor shower's night (meteor.ts, Celeste's) one
  // every 3–8 s. Not while covered or hidden (the countdown holds).
  const seed = islandSeed();
  const shower = $derived.by(() => {
    const c = minuteNow(), date = dayKey(c);
    return showerAt(date, addDays(date, -1), jst(c).hour, seed, scenePreview().event === 'shower');
  });
  $effect(() => {
    if (!night || !shower || !enabled()) return;
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      id = setTimeout(() => {
        if (enabled()) shootingStar();
        arm();
      }, nextStarMs());
    };
    arm();
    return () => clearTimeout(id);
  });
  const starHours = $derived(inStarHours(jst(minuteNow()).hour));
  /** `?stars=none` (dev or test mode; the e2e's ambient life off): no ordinary night's showers (a meteor shower's still
   *  comes). */
  const noStars = hook('stars') === 'none';
  let showerIn = nextShowerMs(Math.random, true);
  $effect(() => {
    if (noStars || !night || shower || !starHours || weather.sky !== 'clear' || !enabled()) return;
    let started = performance.now();
    let id: ReturnType<typeof setTimeout>;
    const arm = () => {
      started = performance.now();
      id = setTimeout(() => {
        for (const at of showerPlan(Math.random)) later(() => enabled() && shootingStar(), at);
        showerIn = nextShowerMs(Math.random);
        arm();
      }, showerIn);
    };
    arm();
    return () => {
      clearTimeout(id);
      showerIn = Math.max(1000, showerIn - (performance.now() - started));
    };
  });

  const STAR = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z';
</script>

{#each [visitor, guest] as v, i (i)}
  {#if v?.shop.Sheet && v.shop.for}<v.shop.Sheet bind:open={v.shop.open} {...v.shop.for} />{/if}
  <!-- Gulliver's sleep talk, an おねがい's caption: over the head (a world node: its true size, nudged in from the sides) -->
  {#if v?.mumble}
    {@const m = v.mumble}
    {#key m.n}
      <span class="mumble-node" aria-hidden="true" {@attach w.at({ x: v.mumbleAt()[0], z: v.mumbleAt()[1], lift: v.mumbleAt()[2], h: 20, zi: OVER, always: true, inv: true, live: () => v.mumbleAt() })}>
        <span class="mumble if-caption" data-mumble data-veg-want={m.want} {@attach edgeIn}>{m.text}</span>
      </span>
    {/key}
  {/if}
{/each}
{#if kk?.caption}
  {@const c = kk.caption}
  <span class="kk-caption if-caption" class:placed={c.placed} data-fx="kk-caption" data-unheard={c.unheard || undefined} {@attach kk.captionEl} style:left="{c.x}px" style:top="{c.y}px">{c.text}</span>
{/if}

<!-- the sky's flourishes: in the fixed sky (stage px), over the time-of-day tint -->
<div class="taps" aria-hidden="true">
  {#each skyFx as f (f.id)}
    <span class="fx {f.kind}" data-fx={f.kind} style:left="{f.x}px" style:top="{f.y}px" style:--dir={f.dir}>
      {#if f.kind === 'cloud'}
        {#each [-0.6, 0.2, 1] as dy, i (i)}<i class="wisp" style:--dy={dy} style:--i={i}></i>{/each}
      {:else if f.kind === 'sun'}
        <i class="halo"></i>
        <svg class="glint" viewBox="0 0 24 24"><path d={STAR} /></svg>
        <i class="flare"></i><i class="flare far"></i>
      {:else if f.kind === 'moon' || f.kind === 'star'}
        <svg class="twinkle" viewBox="0 0 24 24"><path d={STAR} /></svg>
      {:else if f.kind === 'shoot'}
        <span class="streak" style:--a="{f.a ?? 152}deg" style:--len="{f.len ?? 150}px"><i></i></span>
      {:else if f.kind === 'wish'}
        <!-- a wish: a little burst of sparkles where the tap was -->
        {#each [[-14, -10, 0], [12, -16, 1], [2, 8, 2]] as [dx, dy, i] (i)}
          <svg class="twinkle wishspark" viewBox="0 0 24 24" style:--dx="{dx}px" style:--dy="{dy}px" style:--i={i}><path d={STAR} /></svg>
        {/each}
      {/if}
    </span>
  {/each}
  {#if note}
    {#key note.n}<span class="wish if-caption" class:placed={note.placed} data-fx="wish-note" bind:this={noteEl} style:left="{note.x}px" style:top="{note.y}px">{t('beach.wish')}</span>{/key}
  {/if}
</div>

<style>
  /* the sky's: inside the stage, over the time-of-day tint with the fireflies, so the sky's sparkles glow; the ground's
     are world nodes (under the tint like the ground they're on) */
  .taps { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; --su: calc(100cqw / 390); }
  /* a visitor's caption over its head (drawn at its true size: the node's --inv), nudged in from the screen's edge */
  .mumble-node { width: 0; height: 0; pointer-events: none; }
  .mumble { position: absolute; left: 0; bottom: 4px; transform-origin: 40% 100%; scale: var(--inv, 1); translate: calc(-60% + var(--shift, 0px) * var(--inv, 1)) 0; animation: v-mumble 1.6s ease-out both; }
  .mumble[data-veg-want] { animation-duration: 3s; }
  @keyframes v-mumble { from { opacity: 0; transform: translateY(6px) scale(.8); } 15% { opacity: 1; transform: none; } 80% { opacity: 1; } to { opacity: 0; transform: translateY(-6px); } }
  /* K.K.'s 「♪ title」, placed clear of every control */
  .kk-caption { position: absolute; z-index: var(--z-taps); translate: -50% -50%; animation: kk-appear .4s ease-out both; }
  .kk-caption:not(.placed) { visibility: hidden; }
  @keyframes kk-appear { from { opacity: 0; transform: scale(.85); } 60% { opacity: 1; transform: scale(1.04); } to { opacity: 1; transform: none; } }
  /* a wish's caption: floats up a little and fades */
  .wish { translate: -50% -50%; box-shadow: 0 2px 0 var(--plate-lip), 0 0 12px rgba(255, 246, 190, .55); animation: wish-note 1.9s ease-out both; }
  .wish:not(.placed) { visibility: hidden; animation: none; }
  @keyframes wish-note { 0% { transform: translateY(6px) scale(.85); opacity: 0; } 15% { transform: none; opacity: 1; } 75% { opacity: 1; } 100% { transform: translateY(-10px); opacity: 0; } }
  .fx { position: absolute; width: 0; height: 0; }
  .fx > * { position: absolute; }
  .fx i { display: block; }
  .twinkle, .glint { fill: #FFF8D8; overflow: visible; }
  @keyframes twinkle {
    0% { transform: scale(0) rotate(0); opacity: 0; } 35% { transform: scale(1.1) rotate(45deg); opacity: 1; }
    100% { transform: scale(0) rotate(90deg); opacity: 0; }
  }
  @keyframes ring { 0% { transform: scale(.15); opacity: 1; } 100% { transform: scale(1.35); opacity: 0; } }
  @keyframes print { 0% { opacity: 0; } 15% { opacity: 1; } 60% { opacity: .9; } 100% { opacity: 0; } }
  /* cloud: three soft wisps break off the side you tapped and dissolve */
  .wisp {
    --s: calc(15px - var(--i) * 3px);
    left: 0; top: 0; width: var(--s); height: var(--s); margin: calc(var(--s) / -2); border-radius: 50%; background: var(--cloud-top, #fff);
    box-shadow: inset 0 -3px 3px var(--cloud-mid, #E3F0FB); opacity: calc(.95 * var(--cloud-op, 1)); animation: wisp .7s ease-out calc(var(--i) * 50ms) both;
  }
  @keyframes wisp {
    0% { transform: translate(0, 0) scale(.9); opacity: 0; } 20% { opacity: .95; }
    100% { transform: translate(calc(var(--dir, 1) * (18px + var(--i) * 8px)), calc(var(--dy) * 12px)) scale(.35); opacity: 0; }
  }

  /* sun: a soft halo, a turning four-point glint and two lens flecks down-right (light from the upper left) */
  .halo {
    left: 0; top: 0; width: 44px; height: 44px; margin: -22px; border-radius: 50%; border: 2px solid rgba(255, 250, 215, .9);
    animation: ring .65s ease-out both;
  }
  .glint { left: -15px; top: -15px; width: 30px; height: 30px; animation: twinkle .75s ease-out both; }
  .flare {
    left: 18px; top: 15px; width: 7px; height: 7px; margin: -3.5px; border-radius: 50%; background: rgba(255, 255, 240, .75);
    animation: print .7s ease-out .08s both;
  }
  .flare.far { left: 34px; top: 28px; width: 4px; height: 4px; margin: -2px; animation-delay: .16s; }

  /* moon / night sky: a star twinkles where you tapped */
  .twinkle { left: -8px; top: -8px; width: 16px; height: 16px; animation: twinkle .7s ease-out both; }
  .moon .twinkle { left: 12px; top: -22px; width: 12px; height: 12px; }

  /* shooting star: NH's quick white streak falling to the lower left */
  .streak { left: 0; top: 0; transform-origin: 0 0; animation: shoot .85s cubic-bezier(.45, 0, .8, .6) both; }
  .wishspark { animation-delay: calc(var(--i) * 90ms); translate: var(--dx) var(--dy); fill: #FFF3B0; filter: drop-shadow(0 0 3px rgba(255, 240, 170, .9)); }
  .streak i {
    position: absolute; right: 0; top: -1px; width: 64px; height: 2px; border-radius: 2px;
    background: linear-gradient(to left, #FFFBEA, rgba(255, 251, 234, 0));
  }
  .streak::after {
    content: ''; position: absolute; left: -2.5px; top: -2.5px; width: 5px; height: 5px; border-radius: 50%;
    background: #FFFDF0; box-shadow: 0 0 6px 2px rgba(255, 246, 200, .7);
  }
  @keyframes shoot {
    0% { transform: rotate(var(--a)) translateX(0); opacity: 0; } 12% { opacity: 1; } 75% { opacity: 1; }
    100% { transform: rotate(var(--a)) translateX(var(--len)); opacity: 0; }
  }

</style>
