<script lang="ts">
  // Scenery taps (docs/design.md "Scene interactions"): the island's decorative scenery answers a tap with a ≤ 1 s
  // flourish after NH / Pocket Camp, and nothing else (no points, no state, no sheets). A bush rustles and sheds a few
  // leaves (petals in spring, maple leaves in autumn, a clump of snow in winter); a flower wiggles and drops a petal
  // with a sparkle (rarely a butterfly flutters off it; on a summer night, a firefly); a cloud squishes and puffs; the
  // sun glints; the moon bobs and twinkles; a tap in the night sky lights a star; the sea (the pond, the river) rings and
  // splashes (rarely a fish shadow darts off); sand takes two footprints and a puff, grass a dust puff (snow in winter).
  // On a clear night (NH: 7 pm – 4 am) a shower of shooting stars crosses the sky every few minutes (stars.ts), never
  // over the UI; a tap in the sky while one streaks across is a wish (a sparkle, a chime, a caption: Finds.wish). A popped balloon's
  // present (Balloon.svelte sends `island:present`) falls to the open spot in front Balloon chose, sparkles and lies there.
  // The critters (Critters.svelte: fish shadows to fish, bugs to net) get each tap first; a shaken bush can let a bug out.
  //   <SceneTaps scene={el} {season} {tod} enabled={() => live && !covered} />   (inside .stage, before the tint)
  // One `click` listener on the scene (a native scroll swallows the click: a drag scrolls, a tap acts; docs/design.md
  // "World"): anything inside a control (trees, fruit row, villagers, buildings, the balloon) is theirs; then the
  // critters and the island's things; then the tapped element (a bush: Scenery's data-bush, a flower: Flowers'
  // data-flower); then the sky (above the horizon: the sun / moon / clouds against their live boxes) or the ground under
  // the finger (the camera's inverse projection → sceneTaps.ts hitWorld). A ground flourish is a world node where the tap
  // landed (a mark flat on the ground, a puff upright), so it stays put while the camera scrolls; the sky's stay in the
  // fixed sky. Cheap: transforms and opacity only (the shakes are Web Animations on the art's own element), ≤ 4
  // flourishes at once (≤ 6 nodes each), each removed after ≤ 1.1 s; nothing runs while idle but the night's shower timer.
  //   ?shower (dev or ?demo): a shower 1.5 s after the night sky shows, then every 8 s (the e2e's hook).
  // Decorative and pointer-only (aria-hidden, no focus stops).
  import { lazyComponent } from '#lib/ui-state/lazyComponent.svelte.ts';
  import { visitorNow } from './visitors.ts';
  import { timers } from './timers.ts';
  import { islandSeed } from './devHooks.ts';
  import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { seasonArt, type SeasonItem } from '#lib/art.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { guardsU, stageGeo } from './placement.ts';
  import { STREAK_MS, WISH_MS, inStarHours, nextShowerMs, showerPlan, streakPath } from './stars.ts';
  import { BUSH_U, FLOWER_U, wildFlower, type Tod } from './scene.ts';
  import { ARCH, DECOR_SLOTS, FLOWERS, HEDGE_XS, HEDGE_Z, SCENERY, flowerById, type BuildingId, type Flower } from './world.ts';
  import { hitWorld, petalOf, sceneSfx, type SceneHit } from './sceneTaps.ts';
  import { useWorld } from './camera.svelte.ts';
  import { notBehind, type Seen } from './hitbox.ts';
  import { footprint } from './nav.ts';
  import Critters from './Critters.svelte';
  import Finds from './Finds.svelte';
  import Care from './Care.svelte';
  import type { Choice } from './pager.ts';
  import { water } from './sceneDay.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { findArt } from './beach.ts';
  import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { nextStarMs, showerAt } from './meteor.ts';
  import { weather } from './weatherNow.svelte.ts';
  import { eggTime, eventNow } from './events.ts';
  import { eggInBalloon } from './eggs.ts';
  import { RIG, fallAt } from './balloonFlight.ts';
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { t } from '#lib/i18n/index.ts';
  import { onMount } from 'svelte';
  import { fx3d } from './fx3d.ts';
  import { echo3d } from './echo3d.ts';

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
    say?: (name: string, parts: string | string[], from: Element, o?: { colour?: string; choices?: Choice[]; ondone?: () => void }) => void;
    /** Jack's trick (Visitor.svelte), when he gets no candy. */
    ontrick?: () => void;
    /** Either of us met 🍑 Exercise today (group stretching's tape deck comes out). */
    exercise?: boolean;
    /** A tap in the sky (client px) during a fireworks show sends one more (IslandScene's Fireworks): true when it did. */
    skyTap?: (x: number, y: number) => boolean;
    /** One of our birthdays: the cake is out (Cake.svelte). */
    cake?: boolean;
    /** Tap-to-walk (spec §4): a tap nothing else took, on the ground at world (x, z): true when my villager set off. */
    walk?: (x: number, z: number, hit: SceneHit) => boolean;
    /** A tap on a tree (Scenery's data-tree: an oak, a cedar, a palm): it rustles, three quick ones shake it (IslandScene;
     *  true when it took the tap). */
    tree?: (id: string) => boolean;
    /** A tap on a seat (Scenery's data-sit, its piece's id: a bench, a stool, the hammock): my villager walks up to it and
     *  sits or lies on it (IslandScene sitOn; true when it took the tap). */
    sit?: (piece: string) => boolean;
  }
  let { scene, season, tod, enabled, swallowed, say, ontrick, exercise = false, skyTap, cake = false, walk, tree, sit }: Props = $props();
  const w = useWorld();

  type Kind = 'bush' | 'fire' | 'flower' | 'cloud' | 'sun' | 'moon' | 'star' | 'shoot' | 'wish' | 'splash' | 'sand' | 'grass';
  /** The flourishes drawn in the fixed sky (stage px); the rest are world nodes where the tap landed. */
  const SKY_KINDS: readonly Kind[] = ['cloud', 'sun', 'moon', 'star', 'shoot', 'wish'];
  interface Fx {
    id: number;
    kind: Kind;
    /** sky: px from the stage's top-left; on the ground: world x and z, `lift` units above it. */
    x: number;
    y: number;
    lift?: number;
    /** Drawn by the 3D island (its DOM art invisible). */
    in3d?: boolean;
    /** bush: what it sheds; grass: 'snow' in winter; splash: 'pond' (a small one). */
    v?: string;
    /** a rare extra: 'butterfly' | 'firefly' | 'fish'. */
    rare?: string;
    color?: string;
    /** mirror (a fish or butterfly heading left). */
    flip?: boolean;
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
  const groundFx = $derived(fx.filter((f) => !SKY_KINDS.includes(f.kind)));
  let seq = 0;
  const { later, clear } = timers();
  const night = $derived(tod === 'night');
  const roll = (n: number) => Math.random() * n < 1;
  let critters = $state<ReturnType<typeof Critters>>();
  let finds = $state<ReturnType<typeof Finds>>();
  let care = $state<ReturnType<typeof Care>>();
  let visitor = $state<{ tap(px: number, py: number, body?: boolean): boolean }>();
  let deck = $state<{ tap(px: number, py: number, seen?: Seen): boolean }>();
  let cakeEl = $state<{ tap(px: number, py: number, seen?: Seen): boolean }>();
  // Loaded the first time they're due (their chunks stay out of the first load), then kept: a visitor (who leaves
  // the way they came), the tape deck (a fixed piece of the layout, there every day: its tap says when it plays), a
  // birthday's cake.
  const visitorC = lazyComponent(() => import('./Visitor.svelte')), deckC = lazyComponent(() => import('./TapeDeck.svelte')), cakeC = lazyComponent(() => import('./Cake.svelte'));
  const VisitorC = $derived(visitorC.get(!!visitorNow(minuteNow())));
  const TapeDeckC = $derived(deckC.get(true));
  const CakeC = $derived(cakeC.get(cake));
  /** The shooting star crossing now: a tap in the sky before `until` is a wish on it (NH), once. */
  let streak: { until: number; wished: boolean } | null = null;

  $effect(() => clear);

  /** The 3D island's flourish for a ground one (fx3d.ts): its DOM art then invisible. */
  function in3d(f: Omit<Fx, 'id'>): boolean {
    const lift = f.lift ?? 0;
    switch (f.kind) {
      case 'splash': return fx3d('splash', f.x, f.y, 0, { size: f.v === 'pond' ? 0.6 : 1 });
      case 'sand': return fx3d('sand', f.x, f.y);
      case 'grass': return fx3d(f.v === 'snow' ? 'snow' : 'dust', f.x, f.y, 0, { v: '#cfe8a6' });
      case 'bush': return fx3d('leaves', f.x, f.y, lift, { v: f.v === 'leaf' ? undefined : f.v === 'snow' ? 'snowflake' : f.v === 'maple-leaf' || f.v === 'petal' || f.v === 'snowflake' ? f.v : undefined });
      case 'fire': return fx3d('sparks', f.x, f.y, lift);
      case 'flower': return fx3d('drops', f.x, f.y, 0) && fx3d('sparkle', f.x, f.y, 6, { size: 0.7 });
      default: return false;
    }
  }
  function spawn(f: Omit<Fx, 'id'>, ms = LIFE_MS) {
    if (!SKY_KINDS.includes(f.kind) && in3d(f)) f = { ...f, in3d: true };
    const id = ++seq;
    fx = [...fx.slice(-(MAX_FX - 1)), { ...f, id }];
    later(() => (fx = fx.filter((g) => g.id !== id)), ms);
  }

  /** A one-shot Web Animation on a scenery element (replacing the last tap's, so a quick re-tap restarts it). */
  function jiggle(el: Element | null | undefined, frames: Keyframe[], ms: number, origin?: string) {
    if (!el) return;
    echo3d(el);
    for (const a of el.getAnimations()) if (a.id === TAP_ID) a.cancel();
    const f = origin ? frames.map((k) => ({ ...k, transformOrigin: origin })) : frames;
    el.animate(f, { duration: ms, easing: 'cubic-bezier(.3, .7, .4, 1)', id: TAP_ID });
  }
  const RUSTLE: Keyframe[] = [
    { rotate: '0deg', scale: '1' }, { rotate: '-5deg', scale: '1.05 .95', offset: 0.14 },
    { rotate: '4deg', scale: '.98 1.03', offset: 0.34 }, { rotate: '-2.4deg', scale: '1', offset: 0.56 },
    { rotate: '1.1deg', scale: '1', offset: 0.78 }, { rotate: '0deg', scale: '1' }
  ];
  const WIGGLE: Keyframe[] = [
    { rotate: '0deg', scale: '1' }, { rotate: '0deg', scale: '1.08 .9', offset: 0.12 },
    { rotate: '-9deg', scale: '.97 1.04', offset: 0.32 }, { rotate: '7deg', scale: '1', offset: 0.52 },
    { rotate: '-3deg', scale: '1', offset: 0.74 }, { rotate: '0deg', scale: '1' }
  ];
  const SQUISH: Keyframe[] = [
    { scale: '1' }, { scale: '1.1 .86', offset: 0.22 }, { scale: '.95 1.07', offset: 0.5 }, { scale: '1.02 .98', offset: 0.76 }, { scale: '1' }
  ];
  const POP: Keyframe[] = [{ scale: '1' }, { scale: '1.18', offset: 0.3 }, { scale: '.96', offset: 0.65 }, { scale: '1' }];
  /** A bush's art stands on its foot (translate −50% 0, its bottom at the node): it rustles about its foot. */
  const BUSH_ORIGIN = '50% 100%';
  /** A flower is drawn at translate(−50%, −96%): this origin is its stem's foot. */
  const FLOWER_ORIGIN = '0% 4%';

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

  /** A tap on my villager (IslandScene's button): now and then a flea hops off it (Critters). */
  export function villagerTap(el: Element) {
    if (enabled()) critters?.fromVillager(el);
  }

  /** A bush by its scenery id (world.ts SCENERY, or the river-bank hedge's `hedge-<i>`): its feet and height. */
  function bushAt(id: string): { x: number; z: number; h: number } | null {
    const m = /^hedge-(\d+)$/.exec(id);
    if (m && HEDGE_XS.length) return HEDGE_XS[+m[1]] === undefined ? null : { x: HEDGE_XS[+m[1]], z: HEDGE_Z, h: BUSH_U };
    const s = SCENERY.find((t) => t.id === id);
    return s ? { x: s.x, z: s.z, h: s.h } : null;
  }
  /** A shaken bush lets a bug out now and then (Critters' hook, at the bush: world x, z and the height of its top). */
  const bushBug = (x: number, z: number, lift: number) =>
    (critters as unknown as { fromBush?: (x: number, z: number, lift: number) => void } | undefined)?.fromBush?.(x, z, lift);

  /** Whether the click comes from the pointerdown that closed a tree's popup (IslandScene marks it in the capture phase,
   *  before this sees the pointerdown): that tap only closes it. */
  let downSwallowed = false;
  function onDown(e: PointerEvent) {
    downSwallowed = !!swallowed && e === swallowed();
  }

  function onClick(e: MouseEvent) {
    if (downSwallowed) return void (downSwallowed = false);
    if (e.button > 0 || !enabled()) return;
    const t = e.target;
    // a visitor standing in front of the campsite (K.K. and Jack at night) over its door: theirs, not the door's (the
    // door's handler is delegated to the root, after this one; the 3D island's camera shows the door small behind them)
    if (t instanceof Element && t.closest('[data-building] .door') && visitor?.tap(e.clientX, e.clientY)) return void e.stopPropagation();
    // my line out: a tap anywhere on the island is its reel (NH's A button: my villager, a tree, a seat, the water), but
    // a building's door, which one goes through with it (the line ends there)
    if (critters?.lineOut() && t instanceof Element && scene?.querySelector('.stage')?.contains(t) && !t.closest('[data-building] .door')) {
      critters.tap(e.clientX, e.clientY);
      return void e.stopPropagation();
    }
    // what the island tests by position in front of a building's body (its tap area: the model's silhouette), a present
    // lying before it, a fish in the pond before it, a bug by its wall: theirs, not the door's; what's behind it is hidden
    const house = t instanceof Element ? t.closest<HTMLElement>('[data-building]') : null;
    if (house) {
      const before = notBehind(footprint(house.dataset.building as BuildingId)), door = house.querySelector('.door');
      // (behind it, it shows where some of it is off the building's area on screen)
      const off = (px: number, py: number) => !door || !document.elementsFromPoint(px, py).includes(door);
      const seen: Seen = (x, z, r = 0) => {
        if (before(x, z)) return true;
        const [px, py] = w.clientAt(x, z);
        return r > 0 && [[0, 0], [r, 0], [-r, 0], [0, r], [0, -r]].some(([dx, dy]) => off(px + dx, py + dy));
      };
      const [cx, cy] = [e.clientX, e.clientY];
      if (critters?.tap(cx, cy, seen, false) || deck?.tap(cx, cy, seen) || cakeEl?.tap(cx, cy, seen) || finds?.tap(cx, cy, seen) || care?.tap(cx, cy, seen) || critters?.fish(cx, cy, seen))
        return void e.stopPropagation();
    }
    const stage = scene?.querySelector<HTMLElement>('.stage');
    // a bug in front of the island's own buttons (flying past my villager, a tree's canopy, a door): the bug's (it was in
    // view; the net is what the tap was for), else theirs
    if (t instanceof Element && stage?.contains(t) && t.closest('button, [role="button"]') && critters?.onCritter(e.clientX, e.clientY) && critters.tap(e.clientX, e.clientY))
      return void e.stopPropagation();
    if (!(t instanceof Element) || t.closest('button, a, input, select, textarea, label, dialog, [role="button"], [tabindex]')) return;
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const cx = e.clientX, cy = e.clientY;
    // the critters move: they're hit-tested against their live boxes, and a cast bobber takes any tap (NH's A button)
    if (critters?.tap(cx, cy)) return;
    // group stretching's tape deck (when it's out: small and exact, before the visitor's wider reach)
    if (deck?.tap(cx, cy)) return;
    // a birthday's cake: a music box, the candles out
    if (cakeEl?.tap(cx, cy)) return;
    // what's exactly under the finger wins: a tap on a visitor's figure answers with a line (K.K. with a song); then
    // the day's finds (a shell, a fragment, the bottle, a dig spot, a present) and the island's care (a weed to pull,
    // the rock) on their own boxes; only then the visitor's reach (a finger's slack round it, its spot)
    if (visitor?.tap(cx, cy, true)) return;
    if (finds?.tap(cx, cy)) return;
    if (care?.tap(cx, cy)) return;
    if (visitor?.tap(cx, cy)) return;
    // the water under the finger, nothing of the island's over it (a canopy over the pond shakes its tree): a cast from
    // where my villager stands (NH), however far
    if (!t.closest('[data-tree], [data-bush], [data-campfire], [data-sit], [data-fixture], [data-flower]') && critters?.fish(cx, cy)) return;
    // the tapped element: a tree (Scenery's canopy), a bush (Scenery's art) or a flower (Flowers)
    // (a tree top reaching into the sky leaves the sun, the moon and the clouds theirs)
    const treeEl = t.closest<HTMLElement>('[data-tree]');
    if (treeEl && !(cy - r.top < w.view.horizon && inSky(cx, cy)) && tree?.(treeEl.dataset.tree ?? '')) return;
    const bushEl = t.closest<HTMLElement>('[data-bush]');
    const b = bushEl && bushAt(bushEl.dataset.bush ?? '');
    if (bushEl && b) return bush(bushEl, b);
    const fireEl = t.closest<HTMLElement>('[data-campfire]');
    const fire = fireEl && SCENERY.find((s) => s.id === fireEl.dataset.campfire);
    if (fireEl && fire) return poke(fireEl, fire);
    // a seat: walked up to and sat or lain on (the one exception, with the doors, to "it answers where it stands")
    const sitEl = t.closest<HTMLElement>('[data-sit]');
    if (sitEl && sit?.(sitEl.dataset.sit ?? '')) return;
    const fxEl = t.closest<HTMLElement>('[data-fixture]');
    if (fxEl) return fixture(fxEl, fxEl.dataset.fixture ?? '', fxEl.dataset.look ?? '');
    const flowerEl = t.closest<HTMLElement>('[data-flower]');
    const fl = flowerEl && flowerById(flowerEl.dataset.flower ?? '');
    if (flowerEl && fl) return flower(flowerEl, fl);
    // the sky: above the horizon (where the ground's inverse projection finds nothing)
    const at = cy - r.top < w.view.horizon ? null : w.worldAtClient(cx, cy);
    if (!at) return sky(e, r, cx - r.left, cy - r.top);
    const { x, z } = at;
    const hit = hitWorld(x, z);
    // tap-to-walk (spec §4): my villager sets off there (to the nearest bank for water); on land its tap ring is the
    // flourish, on water the ripple still plays
    const walked = walk?.(x, z, hit) ?? false;
    switch (hit.kind) {
      case 'sea': {
        const rare = roll(10) ? 'fish' : undefined;
        spawn({ kind: 'splash', x, y: z, rare, flip: roll(2) });
        return sceneSfx(rare ? 'fish' : 'splash');
      }
      case 'pond':
      case 'river':
        // still or flowing fresh water: a small ring and a few drops (no fish darting off: its fish come by on their own)
        spawn({ kind: 'splash', x, y: z, v: 'pond', flip: roll(2) });
        return sceneSfx('splash');
      case 'sand':
        if (walked) return;
        spawn({ kind: 'sand', x, y: z, flip: roll(2) });
        return sceneSfx('sand');
      default: {
        if (walked) return;
        const snow = season === 'winter';
        spawn({ kind: 'grass', x, y: z, v: snow ? 'snow' : undefined, flip: roll(2) });
        return sceneSfx(snow ? 'snow' : 'grass');
      }
    }
  }

  /** A bush: my villager turns to it (avatar.ts) and THAT bush rustles and sheds (and on the partner's phone too). */
  function bush(el: HTMLElement, b: { x: number; z: number; h: number }) {
    const id = el.dataset.bush;
    if (id) shared.share({ kind: 'act', act: 'bush', id, pt: [Math.round(b.x), Math.round(b.z)] });
    turnTo(b.x);
    jiggle(el, RUSTLE, 520, BUSH_ORIGIN);
    spawn({ kind: 'bush', x: b.x, y: b.z, lift: b.h * 0.62, v: shed(season) });
    bushBug(b.x, b.z, b.h * 0.7);
    sceneSfx('bush');
  }

  /** The campfire poked (where it is: nobody walks): its logs shift, sparks fly up, a soft crackle. */
  function poke(el: HTMLElement, f: { x: number; z: number; h: number }) {
    turnTo(f.x);
    jiggle(el, RUSTLE, 420, BUSH_ORIGIN);
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
    for (const f of near.slice(0, 2)) spawn({ kind: 'flower', x: f.x, y: f.z, lift: FLOWER_U * 0.72, color: petalOf(wildFlower(f, season)), flip: f.x > 195 });
    if (near.length) setTimeout(() => sceneSfx('water'), 420);
  }
  /** The fixed decor (fixedDecor.ts) tapped: it answers where it stands (nobody walks), my villager turns to it. */
  function fixture(el: HTMLElement, id: string, look: string) {
    const slot = DECOR_SLOTS.find((d) => d.id === id);
    const [x, z] = slot ? [slot.x, slot.z] : ARCH;
    turnTo(x);
    jiggle(el, WIGGLE, 520, BUSH_ORIGIN);
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
      say?.(t('world.snowboy'), t(melt ? 'world.snowboy.melt' : `world.snowboy.${snowLine++ % 3}`), el, { colour: '#DDEBFA' });
    }
    if (id === 'sandcastle' || /snowboy/.test(look)) {
      spawn({ kind: id === 'sandcastle' ? 'sand' : 'grass', x, y: z, v: id === 'sandcastle' ? undefined : 'snow', flip: roll(2) });
      return sceneSfx(id === 'sandcastle' ? 'sand' : 'snow');
    }
    sceneSfx('decor');
  }

  /** A wild flower: my villager waters it. */
  function flower(el: HTMLElement, f: Flower) {
    const color = petalOf(wildFlower(f, season));
    // NH: butterflies by day among the flowers (not in winter); fireflies on summer nights
    const rare = night ? (season === 'summer' && roll(2) ? 'firefly' : undefined) : season !== 'winter' && roll(8) ? 'butterfly' : undefined;
    water(dayKey(), f.id);
    // the partner's phone: the flower glitters there too, my villager waters it
    shared.share({ kind: 'world', op: 'watered', id: f.id });
    // my villager turns to it; the watering can floats over the bloom
    turnTo(f.x);
    jiggle(el, WIGGLE, 620, FLOWER_ORIGIN);
    // NH's watering can: a tilt over the bloom, a sprinkle, the flower glitters (and maybe grows a hybrid tomorrow)
    spawn({ kind: 'flower', x: f.x, y: f.z, lift: FLOWER_U * 0.72, color, rare, flip: f.x > 195 });
    sceneSfx('water');
    if (rare === 'butterfly') sceneSfx('butterfly');
  }

  /** A tap in the sky (x, y: px from the stage's top-left). */
  function sky(e: MouseEvent, r: DOMRect, x: number, y: number) {
    const s = scene!;
    const orb = s.querySelector('.orb');
    const o = orb?.getBoundingClientRect();
    if (orb && o && near(o, e.clientX, e.clientY, 0.7)) {
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
      if (!near(b, e.clientX, e.clientY)) continue;
      jiggle(c, SQUISH, 620);
      // the wisps break off the cloud's edge on the tapped side (white on white would vanish inside it)
      const dir = e.clientX < b.left + b.width / 2 ? -1 : 1;
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
      return scenePreview().on ? undefined : finds?.wish(e.clientX, e.clientY);
    }
    if (skyTap?.(e.clientX, e.clientY)) return;
    if (!night) return;
    spawn({ kind: 'star', x, y });
    sceneSfx('star');
  }

  /** NH's shooting star: a quick white streak falling to the lower left through the night sky, its whole path inside
   *  the fixed sky (under the status bar, above the horizon: the camera's --horizon-y) and clear of every control (the
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
    // a visitor watching the sky looks up at it (Celeste points: Visitor.svelte)
    scene?.dispatchEvent(new CustomEvent('island:star', { detail: { x: path.x } }));
  }

  /** NH's balloon present, shot down (Balloon.svelte sends `island:present`): it falls from where it hung on the string
   *  (`from`, world x, y, z) along a short floaty arc (balloonFlight.ts fallAt) to the spot Balloon chose for it first
   *  (`to`: open ground in the front of the view, clear of every control and of what lies there: presentLanding.ts),
   *  in `ms`, drawn in 3D (its node's model on the arc); it lands with a sparkle and lies there until a tap picks it up
   *  (Finds puts it for both phones: the landing spot is sent). No spot (no open ground in view at all): nothing falls. */
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
    later(w.moveStart(), d.ms + 100);
    // landed: it lies there among the day's finds until it's picked up
    later(() => finds?.present(to[0], to[2], art, PRESENT_U), d.ms);
    later(() => (drops = drops.filter((q) => q.id !== id)), d.ms + 400);
  }
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
  // then the bush rustles or the flower glitters here too.
  onMount(() =>
    shared.on(({ e, live }) => {
      if (!live || !enabled()) return;
      if (e.kind === 'act' && e.act === 'bush' && e.id) {
        const b = bushAt(e.id), el = scene?.querySelector<HTMLElement>(`[data-bush="${e.id}"]`);
        if (!b) return;
        partnerTurnTo(b.x, e.who);
        jiggle(el, RUSTLE, 520, BUSH_ORIGIN);
        spawn({ kind: 'bush', x: b.x, y: b.z, lift: b.h * 0.62, v: shed(season) });
        sceneSfx('bush');
      } else if (e.kind === 'world' && e.op === 'watered') {
        const f = flowerById(e.id);
        if (!f) return;
        const el = scene?.querySelector<HTMLElement>(`[data-flower="${f.id}"]`);
        partnerTurnTo(f.x, e.who);
        jiggle(el, WIGGLE, 620, FLOWER_ORIGIN);
        spawn({ kind: 'flower', x: f.x, y: f.z, lift: FLOWER_U * 0.72, color: petalOf(wildFlower(f, season)), flip: f.x > 195 });
        sceneSfx('water');
      }
    })
  );

  // The listeners live on the scene (a click after a drag never comes: the scroll took it).
  $effect(() => {
    const el = scene;
    if (!el) return;
    el.addEventListener('pointerdown', onDown);
    el.addEventListener('click', onClick);
    el.addEventListener('island:present', present);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      el.removeEventListener('click', onClick);
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
  let showerIn = nextShowerMs(Math.random, true);
  $effect(() => {
    if (!night || shower || !starHours || weather.sky !== 'clear' || !enabled()) return;
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

<Critters bind:this={critters} {scene} {tod} {enabled} />
<Finds bind:this={finds} {scene} {enabled} />
<Care bind:this={care} {scene} {enabled} rockBug={(x, z) => critters?.fromRock(x, z)} />
{#if VisitorC}<VisitorC bind:this={visitor} {scene} {enabled} {say} {ontrick} />{/if}
{#if TapeDeckC}<TapeDeckC bind:this={deck} {enabled} {exercise} {say} />{/if}
{#if CakeC}<CakeC bind:this={cakeEl} {enabled} on={cake} />{/if}

<!-- a falling present: a world node on its arc (its model the 3D island's; its art only with no model), its landing
     sparkles once it's down -->
{#each drops as p (p.id)}
  <div class="fxn" aria-hidden="true" {@attach w.at({ x: p.to[0], z: p.to[2], h: 40, always: true, live: () => fallNow(p), m3: p.m3 })}>
    <span class="fx" data-fx="present" style:--gs="calc({PRESENT_U} * var(--su))" style:--fall="{p.ms}ms">
      <span class="gift"><OfficialArt key={p.art} size="100%" eager /></span>
      <svg class="spark land-spark" viewBox="0 0 24 24"><path d={STAR} /></svg>
      <svg class="spark land-spark two" viewBox="0 0 24 24"><path d={STAR} /></svg>
    </span>
  </div>
{/each}

<!-- the ground's flourishes: world nodes where the tap landed (a mark flat on the ground, the rest upright) -->
{#each groundFx as f (f.id)}
  {#if f.kind === 'splash' || f.kind === 'sand' || f.v === 'snow'}
    <div class="fxn" aria-hidden="true" {@attach w.at({ x: f.x, z: f.y, mode: 'flat', h: 12 })}>
      <span class="fx {f.kind}" class:in3d={f.in3d} class:flip={f.flip} class:snow={f.v === 'snow'} class:small={f.v === 'pond'}>
        {#if f.kind === 'splash'}
          <i class="ring"></i><i class="ring late"></i>
          {#if f.rare === 'fish'}<i class="fish"></i>{/if}
        {:else}
          <i class="print"></i><i class="print r"></i>
        {/if}
      </span>
    </div>
  {/if}
  <div class="fxn" aria-hidden="true" {@attach w.at({ x: f.x, z: f.y, lift: f.lift ?? 0, h: 40, dz: -4, light: f.kind === 'fire' })}>
    <span class="fx {f.kind}" class:in3d={f.in3d} class:flip={f.flip} class:snow={f.v === 'snow'} class:small={f.v === 'pond'} data-fx={f.kind} style:--c={f.color}>
      {#if f.kind === 'bush'}
        {#each [-1, 0.3, 1] as dx, i (i)}
          <span class="bit" style:--dx={dx} style:--i={i}>
            {#if f.v === 'leaf'}<i class="leaf"></i>
            {:else if f.v === 'snow'}<i class="clump"></i>
            {:else}<OfficialArt key={seasonArt(f.v as SeasonItem)} size="calc(15 * var(--su))" eager />{/if}
          </span>
        {/each}
      {:else if f.kind === 'fire'}
        {#each [-1, -0.4, 0.2, 0.7, 1.1] as dx, i (i)}<i class="ember" style:--dx={dx} style:--i={i}></i>{/each}
      {:else if f.kind === 'flower'}
        <i class="petal" style:--dx="-1"></i><i class="petal two" style:--dx="1"></i>
        <svg class="spark" viewBox="0 0 24 24"><path d={STAR} /></svg>
        <span class="can" data-fx="water"><OfficialArt key={findArt('watering-can')} size="calc(22 * var(--su))" eager /></span>
        {#each [0, 1, 2, 3, 4] as i (i)}<i class="drip" style:--i={i} style:--dx={(i % 3) - 1}></i>{/each}
        <svg class="spark late" viewBox="0 0 24 24"><path d={STAR} /></svg>
        {#if f.rare === 'butterfly'}
          <span class="bfly"><svg viewBox="-12 -10 24 20">
            <g class="wing"><path d="M0 0 C-4 -9 -12 -9 -11 -2 C-10 2 -4 2 0 0 Z M0 0 C-3 3 -9 6 -7 9 C-5 10 -1 5 0 0 Z" /></g>
            <g class="wing r"><path d="M0 0 C4 -9 12 -9 11 -2 C10 2 4 2 0 0 Z M0 0 C3 3 9 6 7 9 C5 10 1 5 0 0 Z" /></g>
            <ellipse rx="1" ry="4.5" fill="#5B4636" />
          </svg></span>
        {:else if f.rare === 'firefly'}
          <i class="firefly"></i>
        {/if}
      {:else if f.kind === 'splash'}
        {#each [-1, 0, 1] as dx, i (i)}<i class="drop" style:--dx={dx} style:--i={i}></i>{/each}
      {:else}
        {#each [-1, 0, 1] as dx, i (i)}<i class="puff" style:--dx={dx} style:--i={i}></i>{/each}
      {/if}
    </span>
  </div>
{/each}

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
</div>

<style>
  /* the sky's: inside the stage, over the time-of-day tint with the fireflies, so the sky's sparkles glow; the ground's
     are world nodes (under the tint like the ground they're on) */
  .taps { position: absolute; inset: 0; z-index: var(--z-taps); pointer-events: none; --su: calc(100cqw / 390); }
  /* a world node: a 0 × 0 anchor at the feet (camera.svelte.ts places it) */
  .fxn { width: 0; height: 0; pointer-events: none; }
  .fx { position: absolute; width: 0; height: 0; }
  .fx > * { position: absolute; }
  .fx i { display: block; }
  .flip { scale: -1 1; }

  /* bush: three leaves pop up off the top and flutter down to either side */
  .bit {
    left: 0; top: 0; width: calc(16 * var(--su)); height: calc(16 * var(--su)); translate: -50% -50%; line-height: 0;
    display: grid; place-items: center; animation: bit .95s cubic-bezier(.25, .6, .45, 1) calc(var(--i) * 45ms) both; }
  @keyframes bit {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; }
    12% { opacity: 1; }
    34% { transform: translate(calc(var(--dx) * 13 * var(--su)), calc(-15 * var(--su))) rotate(calc(var(--dx) * 70deg + 20deg)); }
    75% { opacity: 1; }
    100% { transform: translate(calc(var(--dx) * 26 * var(--su)), calc(16 * var(--su))) rotate(calc(var(--dx) * 170deg + 80deg)); opacity: 0; }
  }
  .bit :global(img) { max-width: none; }
  .bit .leaf {
    width: calc(13 * var(--su)); height: calc(7.5 * var(--su)); border-radius: 0 80% 0 80%;
    background: linear-gradient(135deg, #8FD16A, #4FA644);
  }
  .bit .clump {
    width: calc(11 * var(--su)); height: calc(8 * var(--su)); border-radius: 50% 50% 45% 45%;
    background: #fff; box-shadow: 0 1px 0 #D5E2F2;
  }

  /* flower: two petals drift down and a sparkle pops at the bloom */
  .petal {
    left: 0; top: 0; width: calc(8 * var(--su)); height: calc(5.5 * var(--su)); margin: calc(-2.75 * var(--su)) 0 0 calc(-4 * var(--su));
    border-radius: 60% 40% 60% 40%; background: var(--c); box-shadow: 0 0 0 .5px rgba(120, 80, 60, .25);
    animation: petal .95s ease-out both;
  }
  .petal.two { animation-delay: 70ms; }
  @keyframes petal {
    0% { transform: translate(0, 0) rotate(0); opacity: 0; }
    15% { opacity: 1; transform: translate(calc(var(--dx) * 5 * var(--su)), calc(-6 * var(--su))) rotate(40deg); }
    100% { transform: translate(calc(var(--dx) * 15 * var(--su)), calc(14 * var(--su))) rotate(calc(var(--dx) * 200deg)); opacity: 0; }
  }
  .spark, .twinkle, .glint { fill: #FFF8D8; overflow: visible; }
  .spark {
    left: calc(4 * var(--su)); top: calc(-12 * var(--su)); width: calc(10 * var(--su)); height: calc(10 * var(--su));
    animation: twinkle .7s ease-out both;
  }
  @keyframes twinkle {
    0% { transform: scale(0) rotate(0); opacity: 0; } 35% { transform: scale(1.1) rotate(45deg); opacity: 1; }
    100% { transform: scale(0) rotate(90deg); opacity: 0; }
  }
  /* the watering can: it tilts in over the bloom (from its outer side), three drops fall, a late glint (watered) */
  .can { left: calc(6 * var(--su)); top: calc(-26 * var(--su)); line-height: 0; transform-origin: 20% 80%; animation: can .9s ease-out both; }
  .flip .can { scale: -1 1; }
  .can :global(.official) { max-width: none; }
  @keyframes can {
    0% { transform: rotate(10deg) translateY(-4px); opacity: 0; } 18% { opacity: 1; transform: rotate(0deg); }
    40%, 70% { transform: rotate(-28deg); opacity: 1; } 100% { transform: rotate(-10deg) translateY(-4px); opacity: 0; }
  }
  .drip {
    left: calc(2 * var(--su)); top: calc(-14 * var(--su)); width: calc(2 * var(--su)); height: calc(3 * var(--su));
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: #9FD8FF; box-shadow: 0 0 0 .5px rgba(60, 120, 180, .5);
    animation: drip .45s ease-in calc(.3s + var(--i) * 60ms) both;
  }
  /* five drops, 60 ms apart, spread a little over the bloom */
  @keyframes drip { from { transform: translate(calc(var(--dx) * 2 * var(--su)), 0); opacity: 0; } 20% { opacity: 1; } to { transform: translate(calc(-2 * var(--su) + var(--dx) * 3 * var(--su)), calc(13 * var(--su))); opacity: 0; } }
  .spark.late { left: calc(-10 * var(--su)); top: calc(-4 * var(--su)); width: calc(8 * var(--su)); height: calc(8 * var(--su)); animation-delay: .62s; }
  /* NH's common butterfly (white, a little yellow at the base): it lifts off the bloom and away, flapping */
  .bfly { left: 0; top: 0; width: calc(18 * var(--su)); margin: calc(-7.5 * var(--su)) 0 0 calc(-9 * var(--su)); line-height: 0; animation: bfly 1.05s ease-in both; }
  .bfly svg { width: 100%; height: auto; overflow: visible; }
  .bfly .wing { fill: #FFFDF3; stroke: #E4C979; stroke-width: .7; transform-origin: 0 0; animation: flap .14s ease-in-out infinite alternate; }
  .bfly .wing.r { animation-delay: 0s; }
  @keyframes flap { to { scale: .25 1; } }
  @keyframes bfly {
    0% { transform: translate(0, 0) rotate(-8deg); opacity: 0; } 10% { opacity: 1; }
    40% { transform: translate(calc(12 * var(--su)), calc(-22 * var(--su))) rotate(10deg); }
    70% { transform: translate(calc(6 * var(--su)), calc(-40 * var(--su))) rotate(-6deg); opacity: 1; }
    100% { transform: translate(calc(24 * var(--su)), calc(-62 * var(--su))) rotate(12deg); opacity: 0; }
  }
  /* a firefly rising out of the flowers, blinking (summer nights; above the tint like the scene's own fireflies) */
  .firefly {
    left: 0; top: 0; width: 4.4px; height: 4.4px; margin: -2.2px; border-radius: 50%;
    background: var(--firefly, #F6FF9E); box-shadow: 0 0 7px var(--firefly-glow, #EFFF7A); animation: firefly 1.05s ease-out both;
  }
  @keyframes firefly {
    0% { transform: translate(0, 0); opacity: 0; } 25% { opacity: 1; } 45% { opacity: .35; } 65% { opacity: 1; }
    100% { transform: translate(calc(-10 * var(--su)), calc(-34 * var(--su))); opacity: 0; }
  }

  /* sea: two foreshortened rings and three droplets; rarely a fish shadow slips away */
  .ring {
    left: 0; top: 0; width: calc(30 * var(--su)); height: calc(10 * var(--su)); margin: calc(-5 * var(--su)) 0 0 calc(-15 * var(--su));
    border: 1.6px solid rgba(255, 255, 255, .9); border-radius: 50%; animation: ring .8s ease-out both;
  }
  .ring.late { animation-delay: .16s; animation-duration: .75s; }
  .splash.small { scale: .6; }
  @keyframes ring { 0% { transform: scale(.15); opacity: 1; } 100% { transform: scale(1.35); opacity: 0; } }
  .drop {
    left: 0; top: 0; width: calc(3 * var(--su)); height: calc(3.6 * var(--su)); margin: calc(-1.8 * var(--su)) 0 0 calc(-1.5 * var(--su));
    border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; background: #fff;
    animation: drop .55s cubic-bezier(.3, .8, .6, 1) calc(var(--i) * 30ms) both;
  }
  @keyframes drop {
    0% { transform: translate(0, 0); opacity: 0; } 15% { opacity: 1; }
    50% { transform: translate(calc(var(--dx) * 6 * var(--su)), calc((-13 + var(--dx) * var(--dx) * 4) * var(--su))); }
    100% { transform: translate(calc(var(--dx) * 11 * var(--su)), 0); opacity: 0; }
  }
  .fish {
    left: 0; top: 0; width: calc(22 * var(--su)); height: calc(8 * var(--su)); margin: calc(-2 * var(--su)) 0 0 calc(-2 * var(--su));
    background:
      radial-gradient(closest-side, rgba(18, 52, 92, .55), rgba(18, 52, 92, .3) 60%, transparent) 0 0 / 78% 100% no-repeat,
      radial-gradient(closest-side, rgba(18, 52, 92, .4), transparent) 100% 50% / 30% 70% no-repeat;
    animation: fish 1.05s ease-in-out both;
  }
  @keyframes fish {
    0% { transform: translate(calc(-6 * var(--su)), calc(6 * var(--su))) rotate(-4deg); opacity: 0; }
    30% { opacity: 1; } 55% { transform: translate(calc(-14 * var(--su)), calc(7 * var(--su))) rotate(4deg); opacity: 1; }
    100% { transform: translate(calc(-36 * var(--su)), calc(10 * var(--su))) rotate(-3deg); opacity: 0; }
  }

  /* ground: footprints (sand, snow) and a little dust / snow puff, as NH's running leaves */
  .print {
    left: calc(-8 * var(--su)); top: calc(-1 * var(--su)); width: calc(5.5 * var(--su)); height: calc(3.6 * var(--su));
    border-radius: 50%; background: rgba(150, 105, 55, .32); animation: print 1.05s ease-out both;
  }
  .print.r { left: calc(2.5 * var(--su)); top: calc(-6.5 * var(--su)); animation-delay: .1s; }
  .snow .print { background: rgba(110, 140, 190, .45); }
  @keyframes print { 0% { opacity: 0; } 15% { opacity: 1; } 60% { opacity: .9; } 100% { opacity: 0; } }
  /* the campfire poked: five embers rise, drift and wink out (a light: untinted) */
  .ember {
    left: 0; top: 0; width: calc(2.6 * var(--su)); height: calc(2.6 * var(--su)); margin: calc(-1.3 * var(--su));
    border-radius: 50%; background: #FFD27A; box-shadow: 0 0 calc(3 * var(--su)) #FF9A3C;
    animation: ember .95s ease-out calc(var(--i) * 70ms) both;
  }
  @keyframes ember {
    0% { transform: translate(0, 0) scale(1); opacity: 0; } 15% { opacity: 1; }
    100% { transform: translate(calc(var(--dx) * 9 * var(--su)), calc(-34 * var(--su))) scale(.4); opacity: 0; }
  }
  .puff {
    left: 0; top: 0; width: calc(8.5 * var(--su)); height: calc(8.5 * var(--su)); margin: calc(-7 * var(--su)) 0 0 calc(-4.25 * var(--su));
    border-radius: 50%; background: rgba(255, 248, 228, .92); animation: puff .6s ease-out calc(var(--i) * 35ms) both;
  }
  .grass .puff { background: rgba(255, 255, 255, .88); }
  .snow .puff { background: #fff; box-shadow: 0 1px 2px rgba(110, 140, 190, .5); }
  @keyframes puff {
    0% { transform: translate(0, 0) scale(.3); opacity: 0; } 25% { opacity: 1; }
    100% { transform: translate(calc(var(--dx) * 12 * var(--su)), calc((-6 + var(--dx) * var(--dx) * 3) * var(--su))) scale(1.25); opacity: 0; }
  }

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

  /* the balloon's present: falling on its node's arc (the 3D island draws its model: this art is only for one with
     none), then the landing's two sparkles (Finds then shows it lying there) */
  .gift { left: 0; top: 0; width: var(--gs); height: var(--gs); margin: calc(var(--gs) * -1) 0 0 calc(var(--gs) / -2); line-height: 0; }
  .land-spark { left: calc(-16 * var(--su)); top: calc(-26 * var(--su)); animation-delay: calc(var(--fall) + 50ms); }
  .land-spark.two { left: calc(6 * var(--su)); top: calc(-18 * var(--su)); width: calc(7 * var(--su)); height: calc(7 * var(--su)); animation-delay: calc(var(--fall) + 250ms); }

</style>
