<script lang="ts">
  // Scenery taps (docs/design.md "Scene interactions"): the island's decorative scenery answers a tap with a ≤ 1 s
  // flourish after NH / Pocket Camp, and nothing else (no points, no state, no sheets). A bush rustles and sheds a few
  // leaves (petals in spring, maple leaves in autumn, a clump of snow in winter); a flower wiggles and drops a petal
  // with a sparkle (rarely a butterfly flutters off it; on a summer night, a firefly); a cloud squishes and puffs; the
  // sun glints; the moon bobs and twinkles; a tap in the night sky lights a star; the sea (the pond, the river) rings and
  // splashes (rarely a fish shadow darts off); sand takes two footprints and a puff, grass a dust puff (snow in winter).
  // On a clear night (NH: 7 pm – 4 am) a shower of shooting stars crosses the sky every few minutes (stars.ts), never
  // over the UI; a tap in the sky while one streaks across is a wish (a sparkle, a chime, a caption: Finds.wish). A popped balloon's
  // present (Balloon.svelte sends `island:present`) falls onto the lawn in view, sparkles and lies there (or sinks in the sea).
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
  import { deckOut } from './stretching.ts';
  import { timers } from './timers.ts';
  import { hookFlag, islandSeed } from './devHooks.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { seasonArt, type SeasonItem } from '#lib/art.ts';
  import type { Season } from '#lib/ui-state/theme.svelte.ts';
  import { guardsU, stageGeo } from './placement.ts';
  import { STREAK_MS, WISH_MS, inStarHours, nextShowerMs, showerPlan, streakPath } from './stars.ts';
  import { BUSH_U, FLOWER_U, wildFlower, type Tod } from './scene.ts';
  import { ARCH, DECOR_SLOTS, FLOWERS, HEDGE_XS, HEDGE_Z, SCENERY, flowerById, type Flower } from './world.ts';
  import { hitWorld, petalOf, sceneSfx, shownNow, type SceneHit } from './sceneTaps.ts';
  import { useWorld } from './camera.svelte.ts';
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
  import { partnerTurnTo, turnTo } from './avatar.ts';
  import { t } from '#lib/i18n/index.ts';
  import { onMount } from 'svelte';
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
  }
  let { scene, season, tod, enabled, swallowed, say, ontrick, exercise = false, skyTap, cake = false, walk, tree }: Props = $props();
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
  let visitor = $state<{ tap(px: number, py: number): boolean }>();
  let deck = $state<{ tap(px: number, py: number): boolean }>();
  let cakeEl = $state<{ tap(px: number, py: number): boolean }>();
  // Loaded the first time they're due (their chunks stay out of the first load), then kept: a visitor (who leaves
  // the way they came), the tape deck (an Exercise day or a morning), a birthday's cake.
  const visitorC = lazyComponent(() => import('./Visitor.svelte')), deckC = lazyComponent(() => import('./TapeDeck.svelte')), cakeC = lazyComponent(() => import('./Cake.svelte'));
  const VisitorC = $derived(visitorC.get(!!visitorNow(minuteNow())));
  const TapeDeckC = $derived(deckC.get(hookFlag('stretch') || deckOut(dayKey(minuteNow()), jst(minuteNow()).hour, exercise)));
  const CakeC = $derived(cakeC.get(cake));
  /** The shooting star crossing now: a tap in the sky before `until` is a wish on it (NH), once. */
  let streak: { until: number; wished: boolean } | null = null;

  $effect(() => clear);

  function spawn(f: Omit<Fx, 'id'>, ms = LIFE_MS) {
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
    if (m) return HEDGE_XS[+m[1]] === undefined ? null : { x: HEDGE_XS[+m[1]], z: HEDGE_Z, h: BUSH_U };
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
    if (!(t instanceof Element) || t.closest('button, a, input, select, textarea, label, dialog, [role="button"], [tabindex]')) return;
    const stage = scene?.querySelector<HTMLElement>('.stage');
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    const cx = e.clientX, cy = e.clientY;
    // the critters move: they're hit-tested against their live boxes, and a cast bobber takes any tap (NH's A button)
    if (critters?.tap(cx, cy)) return;
    // group stretching's tape deck (when it's out: small and exact, before the visitor's wider reach)
    if (deck?.tap(cx, cy)) return;
    // a birthday's cake: a music box, the candles out
    if (cakeEl?.tap(cx, cy)) return;
    // a visitor answers with a line (K.K. with a song); then the day's finds (a shell, a fragment, the bottle, a dig
    // spot, a present) and the island's care (a weed to pull, the rock)
    if (visitor?.tap(cx, cy)) return;
    if (finds?.tap(cx, cy)) return;
    if (care?.tap(cx, cy)) return;
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
      return finds?.wish(e.clientX, e.clientY);
    }
    if (skyTap?.(e.clientX, e.clientY)) return;
    if (!night) return;
    spawn({ kind: 'star', x, y });
    sceneSfx('star');
  }

  /** NH's shooting star: a quick white streak falling to the lower left through the night sky, its whole path inside
   *  the fixed sky (under the status bar, above the horizon: the camera's --horizon-y) and clear of every control (the
   *  ribbon, the jar, the sync chip). */
  function shootingStar() {
    const g = stageGeo(scene);
    const band = scene?.querySelector('.band')?.getBoundingClientRect();
    if (!g || !band) return;
    const r = g.r, s = scene!.getBoundingClientRect();
    // in stage px (the stage is the whole viewport: the sky is its top, down to the horizon)
    const sky = { x0: s.left - r.left + 8, x1: s.right - r.left - 8, y0: band.top - r.top + 6, y1: w.view.horizon - 14 };
    const avoid = guardsU(g, 4).map((b) => ({ x0: b.x0 / g.k, x1: b.x1 / g.k, y0: b.y0 / g.k, y1: b.y1 / g.k }));
    const path = streakPath(sky, avoid, Math.random);
    if (!path) return;
    spawn({ kind: 'shoot', x: path.x, y: path.y, a: path.angle, len: path.len }, STREAK_MS + 100);
    streak = { until: performance.now() + WISH_MS, wished: false };
    sceneSfx('shooting-star');
    // a visitor watching the sky looks up at it (Celeste points: Visitor.svelte)
    scene?.dispatchEvent(new CustomEvent('island:star', { detail: { x: path.x } }));
  }

  /** NH's balloon present, shot down: it falls from where the balloon burst onto the lawn in view (the open spot nearest
   *  under the burst), lands with a bounce and a sparkle and stays there until a tap picks it up (Finds); with no lawn
   *  in view it drops into the sea. Balloon may name the landing itself (`detail.land`: a world [x, z], or null for the
   *  sea); else it's found here. The fall is drawn in the landing spot's own node, so it goes behind whatever stands
   *  nearer (it never covers a control), and it lands at least PRESENT_GAP clear of everything lying on the lawn. */
  interface Drop { id: number; x: number; z: number; dx: number; dy: number; size: number; sea: boolean; art: string }
  let drops = $state<Drop[]>([]);
  function present(e: Event) {
    const d = (e as CustomEvent<{ x: number; y: number; size: number; land?: readonly [number, number] | null }>).detail;
    const g = stageGeo(scene);
    if (!d || !g || !enabled()) return;
    const sx = d.x - g.r.left, sy = d.y - g.r.top;
    // the present's size in world units, a little bigger than on the balloon's string
    const size = Math.max(30, (d.size / w.view.s) * 1.2);
    const spot = d.land !== undefined ? (d.land && { x: d.land[0], z: d.land[1] }) : landing(sx, size);
    const to = spot ?? seaUnder(sx);
    if (!to) return;
    const p = w.screenAt(to.x, to.z), k = p.scale * w.view.s;
    const id = ++seq;
    // Bunny Day's celebrations: now and then the balloon carried NH's sky egg instead of its present
    const egg = eggTime(eventNow(minuteNow())) && eggInBalloon();
    const art = egg ? findArt('sky-egg') : 'deco/present';
    // the burst, from the landing spot, in the node's own (perspective-scaled) px
    drops = [...drops.slice(-1), { id, x: to.x, z: to.z, dx: (sx - p.sx) / k, dy: (sy - p.sy) / k, size, sea: !spot, art }];
    if (!spot) {
      later(() => (drops = drops.filter((q) => q.id !== id)), 2000);
      later(() => sceneSfx('splash'), 1500);
      return;
    }
    sceneSfx('present');
    // landed (and squashed): it lies there among the day's finds until it's picked up
    later(() => finds?.present(to.x, to.z, art, size), 2000);
    later(() => (drops = drops.filter((q) => q.id !== id)), 2500);
  }
  /** How far a landed present keeps from anything lying on the lawn (a weed, the rock, a dig spot, a mushroom, a branch,
   *  a pumpkin, another present), u, beyond both their halves. */
  const PRESENT_GAP = 16;
  /** Where a present falling from stage px x lands: on the lawn in view, the open spot nearest under the burst that
   *  keeps PRESENT_GAP from everything lying there and covers no control (a villager walking by doesn't count); null
   *  when there's none (it falls into the sea instead). `size`: the present's size (u). */
  function landing(x: number, size: number): { x: number; z: number } | null {
    const stage = scene?.querySelector<HTMLElement>('.stage'), g = stageGeo(scene);
    if (!stage || !g) return null;
    const things = [...stage.querySelectorAll('[data-care], [data-find], [data-branch], [data-nest], [data-pumpkin]')].flatMap((el) => {
      if (!shownNow(el)) return [];
      const b = el.getBoundingClientRect();
      // the ground items are 0 × 0 anchors at their foot; buttons are boxes
      const cx = (b.left + b.width / 2 - g.r.left) * g.k, foot = (b.bottom - g.r.top) * g.k;
      const r = el.matches('[data-care="rock"]') ? 11 : Math.max(8, (b.width * g.k) / 2);
      return [{ x: cx, y: foot - r * 0.6, r }];
    });
    // the villagers only pass by (it lies behind them): the controls that stay put
    const keep = guardsU(g, 2, (el) => !!el.closest('[data-actor]') || !shownNow(el));
    const v = w.view;
    const xs = Array.from({ length: 25 }, (_, i) => v.vw * (0.14 + i * 0.03)).sort((a, b) => Math.abs(a - x) - Math.abs(b - x));
    for (const sx of xs)
      for (const fy of [0.66, 0.6, 0.72, 0.54, 0.78, 0.48]) {
        const at = w.worldAt(sx, v.horizon + (v.vh - v.horizon) * fy);
        if (!at || hitWorld(at.x, at.z).kind !== 'grass') continue;
        // its centre on screen (u), as it lies, and its half size there
        const [cx, foot] = w.screenU(at.x, at.z), half = (size * w.scaleAt(at.x, at.z)) / 2, cy = foot - half;
        const clear = things.every((t) => Math.hypot(t.x - cx, t.y - cy) >= PRESENT_GAP + t.r + half);
        if (clear && !keep.some((b) => cx + half > b.x0 && cx - half < b.x1 && cy + half > b.y0 && cy - half < b.y1))
          return { x: Math.round(at.x), z: Math.round(at.z) };
      }
    return null;
  }
  /** The sea in view under stage px x (a present that found no lawn): the first sea from the screen's foot up. */
  function seaUnder(x: number): { x: number; z: number } | null {
    const v = w.view;
    for (let sy = v.vh - 20; sy > v.horizon + 8; sy -= 16) {
      const at = w.worldAt(x, sy);
      if (at && hitWorld(at.x, at.z).kind === 'sea') return at;
    }
    return null;
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
  const seed = islandSeed(), forceShower = hookFlag('shower');
  const shower = $derived.by(() => {
    const c = minuteNow(), date = dayKey(c);
    return showerAt(date, addDays(date, -1), jst(c).hour, seed, forceShower);
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
{#if TapeDeckC}<TapeDeckC bind:this={deck} {scene} {enabled} {exercise} />{/if}
{#if CakeC}<CakeC bind:this={cakeEl} {scene} {enabled} on={cake} />{/if}

<!-- a falling present: in its landing spot's node (behind whatever stands nearer), the fall drawn from the burst -->
{#each drops as p (p.id)}
  <div class="fxn" aria-hidden="true" {@attach w.at({ x: p.x, z: p.z, h: 40, always: true })}>
    <span class="fx" data-fx="present" style:--dx="{p.dx.toFixed(1)}px" style:--dy="{p.dy.toFixed(1)}px" style:--gs="calc({p.size.toFixed(1)} * var(--su))">
      <span class="gift" class:sea={p.sea}><span class="drop-in"><OfficialArt key={p.art} size="100%" eager /></span></span>
      {#if p.sea}
        <span class="land"><i class="ring"></i><i class="ring late"></i></span>
      {:else}
        <svg class="spark land-spark" viewBox="0 0 24 24"><path d={STAR} /></svg>
        <svg class="spark land-spark two" viewBox="0 0 24 24"><path d={STAR} /></svg>
      {/if}
    </span>
  </div>
{/each}

<!-- the ground's flourishes: world nodes where the tap landed (a mark flat on the ground, the rest upright) -->
{#each groundFx as f (f.id)}
  {#if f.kind === 'splash' || f.kind === 'sand' || f.v === 'snow'}
    <div class="fxn" aria-hidden="true" {@attach w.at({ x: f.x, z: f.y, mode: 'flat', h: 12 })}>
      <span class="fx {f.kind}" class:flip={f.flip} class:snow={f.v === 'snow'} class:small={f.v === 'pond'}>
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
    <span class="fx {f.kind}" class:flip={f.flip} class:snow={f.v === 'snow'} class:small={f.v === 'pond'} data-fx={f.kind} style:--c={f.color}>
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

  /* the balloon's present: falls from the burst (gravity, a gentle sway) onto its spot (standing on it), lands with a
     squash, sparkles, fades (Finds then shows it lying there); or sinks in the sea */
  .gift {
    left: 0; top: 0; width: var(--gs); height: var(--gs); margin: calc(var(--gs) * -1) 0 0 calc(var(--gs) / -2); line-height: 0;
    animation: gift-fall 1.5s cubic-bezier(.45, 0, .85, .55) both, gift-fade .01s linear 2s both;
  }
  .gift .drop-in { display: block; height: 100%; transform-origin: 50% 100%; animation: gift-sway 1.5s ease-in-out both, gift-land .5s ease-out 1.5s both; }
  @keyframes gift-fall { from { transform: translate(var(--dx), calc(var(--dy) + var(--gs) / 2)); } to { transform: translate(0, 0); } }
  @keyframes gift-sway { 0% { rotate: -10deg; } 30% { rotate: 8deg; } 60% { rotate: -6deg; } 85% { rotate: 3deg; } 100% { rotate: 0deg; } }
  @keyframes gift-land { 0% { scale: 1.12 .82; } 45% { scale: .95 1.06; } 100% { scale: 1; } }
  @keyframes gift-fade { to { opacity: 0; } }
  .gift.sea { animation: gift-fall 1.5s cubic-bezier(.45, 0, .85, .55) both, gift-fade .35s ease-in 1.5s both; }
  .gift.sea .drop-in { animation: gift-sway 1.5s ease-in-out both; }
  .land { left: 0; top: 0; width: 0; height: 0; opacity: 0; animation: land-on .01s 1.5s forwards; }
  @keyframes land-on { to { opacity: 1; } }
  .land .ring { animation-delay: 1.5s; } .land .ring.late { animation-delay: 1.66s; }
  .land-spark { left: calc(-16 * var(--su)); top: calc(-26 * var(--su)); animation-delay: 1.55s; }
  .land-spark.two { left: calc(6 * var(--su)); top: calc(-18 * var(--su)); width: calc(7 * var(--su)); height: calc(7 * var(--su)); animation-delay: 1.75s; }

</style>
