<script lang="ts">
  // The island (docs/design.md "World"): NH's rolling-log island in 2D DOM. A native vertical scroller is the camera
  // (its scrollTop → camZ, camera.svelte.ts; overscroll contained) over two sections (sections.ts): まえ (home: the
  // sea, the beach, the health lawn) and おく (the campsite's clearing, the pond, the bamboo, the falls). The ground is baked raster chunks bent onto the log by 40 bands (WorldGround), the live
  // water on top (WorldWater); every upright thing is a world node at its feet, placed by one projector in one depth
  // order (nearer in front, ties by x; a tree's canopy hangs over its trunk). The sky, the HUD, the weather and the
  // fireworks stay fixed outside the curved layer. Nothing runs when still: a scroll frame, a walk (the one rAF while
  // someone is on the way) or a change places what moved.
  //   <IslandScene {view} onhighfive paused />
  // Layout contract (for the page): give it the whole page (--scene-h, e.g. 100dvh); --hud-bottom is the top chrome's
  // bottom edge. Read back --horizon-y (set on .if-scene) to place overlays in the sky.
  // Life (islandLife.svelte.ts): the motion bus (emit('highfive-sent') etc.), reactions to the `view` diff (partner
  // data, fruit stages, a received high-five), naps, the balloon; idle life runs while `live` and not `paused`.
  import { lazyComponent } from '#lib/ui-state/lazyComponent.svelte.ts';
  import { showAt } from './fireworks.ts';
  import { hookFlag } from './devHooks.ts';
  import type { PersonId, PersonWeekView, WeekView } from '#lib/types.ts';
  import Villager from '../characters/Villager.svelte';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { theme, type Season } from '#lib/ui-state/theme.svelte.ts';
  import { defaultFoliage, type Foliage } from '#lib/ui-state/season.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import Sky from './Sky.svelte';
  import WorldGround from './WorldGround.svelte';
  import WorldWater from './WorldWater.svelte';
  import Scenery from './Scenery.svelte';
  import FruitTree from './FruitTree.svelte';
  import Flowers from './Flowers.svelte';
  import Particles from './Particles.svelte';
  import { raining, weather } from './weatherNow.svelte.ts';
  import { WET } from './weather.ts';
  import Balloon from './Balloon.svelte';
  import SceneTaps from './SceneTaps.svelte';
  import Talk from './Talk.svelte';
  import TreeShakes from './TreeShakes.svelte';
  import PartnerNews from './PartnerNews.svelte';
  import { HATS, birthdaysOn, isBirthday } from './birthday.ts';
  import { FIREWORKS_FROM, archOn, weddingDay } from './wedding.ts';
  import { eventAt, forcedEvent } from './events.ts';
  import { TRICK_MS } from './visitors.ts';
  import { STUNG_SWEAT_MS, goalTree, shakeTap, treeById, type ShakeTree } from './treeShake.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { IslandLife } from './islandLife.svelte.ts';
  import { VILLAGER, eventsAt, u, wildFlower, type Tod } from './scene.ts';
  import { CAMPSITE, CAMS, CAM_MAX, CAM_MIN, CENTRE_STAGE, FLOWERS, GOAL_TREES, HOMES, PLAN, SHORE_Z, TREE_H, flowerById, surfaceAt, type BuildingId } from './world.ts';
  import { campLine, doorAt, partnerOnline } from './buildings.ts';
  import { RING_MS, stepCue } from './tapWalk.ts';
  import { buildingAt, nav } from './nav.ts';
  import { LIVE_URL, liveRelay } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import { sendIslandDay } from '#lib/store/actions.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { visitorNow } from './visitors.ts';
  import { World, dropLive, provideWorld } from './camera.svelte.ts';
  import { camAt, horizonAhead, scrollFor, solveCam } from './roll.ts';
  import { hybridFor, hybridsOf } from './care.ts';
  import { garden } from './sceneDay.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { actors, applyStep, busy, inMotion, livePos, onMove, onStep, place, setEmote, setHome, setMotion, wake } from '../motion/director.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { walkGeo } from './walkGraph.ts';
  import { attachAvatar, partnerRestsAt, partnerTo, presence, freeze, sendTo, setPartnerRest, snapHome, stayingAt, steered, thaw, turnTo, SNAP_HOME_MS } from './avatar.ts';
  import { RUN_RING_U_S, linkVillagers, playPartner, playWake } from './villagerSync.ts';
  import type { DayEvent } from '#lib/sync/world-day.ts';
  import type { SceneHit } from './sceneTaps.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { flushSync, onMount, untrack } from 'svelte';
  import type { ActorId } from '../motion/reactions.ts';
  import { dayKey, jst, minuteNow, now } from '#lib/time/clock.ts';

  interface Props {
    view: WeekView;
    /** The high-five with the partner's villager (a tap on them): send it (the store, the banner, R4). */
    onhighfive?: () => void;
    /** A sheet / overlay covers the scene: idle life and particles pause. */
    paused?: boolean;
    /** Interactive + idle life + reactions (false for gallery thumbnails). */
    live?: boolean;
    /** Dev gallery: force a season / time of day instead of the theme clock. */
    season?: Season;
    /** Oak foliage (defaults to the season's signature look when `season` is forced, else the clock). */
    foliage?: Foliage;
    tod?: Tod;
  }
  let {
    view, onhighfive, paused = false, live = true,
    season: seasonProp, foliage: foliageProp, tod: todProp
  }: Props = $props();

  const uid = $props.id();
  const season = $derived(seasonProp ?? theme.season);
  const foliage = $derived<Foliage>(foliageProp ?? (seasonProp ? defaultFoliage(seasonProp) : theme.foliage));
  const tod = $derived<Tod>(todProp ?? theme.tod);

  // The clock (device time or ?date=), at each new minute.
  const clock = $derived(minuteNow());
  const month = $derived(jst(clock).month);
  const ev = $derived(eventsAt(clock));
  // NH's dated events (events.ts): Halloween's pumpkins all day, Jack, the lanterns and the villagers' lines at night
  const forced = forcedEvent();
  const nhEvent = $derived(eventAt(dayKey(clock), jst(clock).hour, forced));
  // the wedding countdown (wedding.ts): the arch on June Sundays, the day itself, its fireworks at night
  const wedding = $derived.by(() => {
    const date = dayKey(clock), { hour, weekday } = jst(clock);
    return { date, arch: archOn(date, weekday), day: weddingDay(date), fireworks: weddingDay(date) && hour >= FIREWORKS_FROM };
  });

  // The same island on both phones (docs/design.md "Shared world"): A (ウェイ) lives on the left, B (うめ) on the right,
  // whichever of us holds the phone: homes, goal trees, flower beds, every shared id by person.
  const sideOf = (pid: PersonId): 'left' | 'right' => (pid === 'A' ? 'left' : 'right');
  const sides = $derived<Record<'mine' | 'partner', { person: PersonWeekView; home: readonly [number, number]; side: 'left' | 'right' }>>({
    mine: { person: view.people[view.me], home: HOMES[view.me], side: sideOf(view.me) },
    partner: { person: view.people[view.partner], home: HOMES[view.partner], side: sideOf(view.partner) }
  });

  const covered = $derived(paused || ui.overlay);

  // The trees' detail popups: at most one open (a tree's tap toggles it; the other tree's tap moves it there).
  // A tap anywhere else (the popup itself lets taps through, so tapping it closes it too) or Esc closes it; it never
  // times out.
  let openTree = $state<PersonId | null>(null);
  /** The pointerdown that just closed a popup: on scenery, that tap only closes it (SceneTaps). */
  let closedBy: Event | null = null;
  let sceneEl = $state<HTMLElement>();
  $effect(() => {
    if (covered) openTree = null;
  });
  $effect(() => {
    if (!openTree) return;
    // Capture phase, so it runs before the tapped control's own handler; the tap still does what it does.
    const away = (e: PointerEvent) => {
      // A tree's own buttons toggle it themselves.
      if (!(e.target instanceof Element) || !e.target.closest('.canopy, .row-btn')) {
        openTree = null;
        closedBy = e;
        // a tap on the popup itself only closes it: the click that follows (the popup gone from under the finger) must
        // not reach what stood under it (a villager, a door)
        if (e.target instanceof Element && e.target.closest('.detail')) {
          const eat = (c: Event) => {
            c.stopPropagation();
            c.preventDefault();
          };
          document.addEventListener('click', eat, { capture: true, once: true });
          setTimeout(() => document.removeEventListener('click', eat, { capture: true }), 700);
        }
      }
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') openTree = null;
    };
    document.addEventListener('pointerdown', away, true);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('pointerdown', away, true);
      document.removeEventListener('keydown', esc);
    };
  });
  // `live` is fixed per scene (the gallery's thumbnails are never live).
  // svelte-ignore state_referenced_locally
  const life = new IslandLife({ view: () => view, live, covered: () => covered, night: () => tod === 'night', day: () => tod === 'day' });
  // A tap on mine hops (R9) and says nothing (it was too easy to tap by accident); now and then a flea hops off it.
  // The speech balloon (Talk) is for the island's other speakers: the campsite's door, the visitors.
  let talk = $state<ReturnType<typeof Talk>>();
  /** The scenery taps (a tap on my villager may send a flea hopping off it). */
  let sceneTaps = $state<ReturnType<typeof SceneTaps>>();
  // A tap on the partner is a high-five (NH's reaction, no card), in place (only a tap on empty ground walks): both
  // woken if asleep, the partner stops where it is, a sparkle flies from mine to them, and it's sent: the two turn to
  // each other and hop with the sparkles (R4). One at a time: a tap while one is under way does nothing more.
  let fiving = false;
  function highFiveTap() {
    if (!live || covered || fiving) return;
    fiving = true;
    cue('villager-tap');
    for (const id of ['mine', 'partner'] as const) if (actors[id].asleep) wake(id);
    const [px, pz] = livePos('partner');
    if (actors.partner.walking) place('partner', px, pz);
    turnTo(px);
    actors.partner.busyUntil = Math.max(actors.partner.busyUntil, Date.now() + 2400);
    zapStart();
    onhighfive?.();
    life.later(() => (fiving = false), 2400);
  }
  /** The high-five's sparkle, flying from my villager's hands to the partner's in an arc (ZAP_MS). */
  let zap = $state<{ n: number; t0: number } | null>(null);
  const ZAP_MS = 520;
  function zapStart() {
    const t0 = performance.now(), n = (zap?.n ?? 0) + 1, stop = world.moveStart();
    zap = { n, t0 };
    life.later(() => {
      stop();
      if (zap?.n === n) zap = null;
    }, ZAP_MS + 60);
  }
  function zapAt(): readonly [number, number, number] {
    const k = Math.min(1, (performance.now() - (zap?.t0 ?? 0)) / ZAP_MS), [ax, az] = livePos('mine'), [bx, bz] = livePos('partner');
    return [ax + (bx - ax) * k, az + (bz - az) * k, VILLAGER.h * (0.55 + Math.sin(Math.PI * k) * 0.35)];
  }
  // Island care: a flower watered yesterday can show a hybrid colour today (care.ts; `?hybrid` in the demo shows one).
  const today = $derived(dayKey(clock));
  // Birthdays (birthday.ts): ours from the people config (both villagers wear NH's birthday hat, the cake, the
  // confetti, a popper on a goal), and an NH villager's own from the roster's birthdays (a small chunk of its own,
  // loaded with the island, never with the first load or the roster): that villager wears the hat.
  const bday = $derived(birthdaysOn(today));
  let villagerBdays = $state<Record<string, string> | null>(null);
  $effect(() => {
    if (live) void import('#lib/villagers/birthdays.ts').then((m) => (villagerBdays = m.BIRTHDAYS));
  });
  const hatOf = (id: 'mine' | 'partner', person: PersonWeekView): string | null =>
    bday.length || isBirthday(villagerBdays?.[resolveLook({ villager: person.villager, person: person.person }).id], today) ? HATS[id] : null;
  const hybrid = $derived.by(() => {
    if (!live) return null;
    const kindOf = (id: string) => wildFlower(flowerById(id) ?? FLOWERS[0], season);
    if (hookFlag('hybrid')) return { id: FLOWERS[0].id, flower: hybridsOf(kindOf(FLOWERS[0].id))[0] };
    const mine = garden(today, addDays(today, -1), (w) => hybridFor(today, w.filter(flowerById), kindOf)).hybrid;
    // both people's waterings yesterday (the shared day's), so both phones grow the same one
    const both = shared.wateredYesterday().filter(flowerById);
    return both.length ? hybridFor(today, both, kindOf) : mine;
  });
  // Shaking a tree (TreeShakes): its wasps sting the villager on their side: a fright (a 「！」), then a sweat drop.
  let shakes = $state<ReturnType<typeof TreeShakes>>();
  let stung = $state<Record<'mine' | 'partner', boolean>>({ mine: false, partner: false });
  const unsting: Partial<Record<'mine' | 'partner', ReturnType<typeof setTimeout>>> = {};
  function sting(side: 'mine' | 'partner') {
    setMotion(side, 'surprise');
    setEmote(side, 'mark-bang');
    stung[side] = true;
    clearTimeout(unsting[side]);
    unsting[side] = setTimeout(() => {
      setEmote(side, 'mark-sweat');
      unsting[side] = setTimeout(() => (stung[side] = false), STUNG_SWEAT_MS);
    }, STUNG_SWEAT_MS);
  }
  // Jack's trick (no candy for him): my villager's face goes goofy for a minute (NH's trick changes your look)
  let tricked = $state(false);
  let untrick: ReturnType<typeof setTimeout> | undefined;
  function trick() {
    setMotion('mine', 'surprise');
    setEmote('mine', 'mark-bang');
    tricked = true;
    clearTimeout(untrick);
    untrick = setTimeout(() => (tricked = false), TRICK_MS);
  }
  // The world: its camera (the scroller) and projector, shared with every part of the island (camera.svelte.ts).
  const world = new World();
  // svelte-ignore state_referenced_locally
  provideWorld(world, live);
  let scroller = $state<HTMLElement>();
  let vh = $state(844), s = $state(1), horizonPx = $state(135);
  /** まえ, the scroller's bottom: fitted so a wide band of sea shows under the beach (measure). */
  let camMin = $state<number>(CAM_MIN);
  /** おく, the scroller's top: camZ 470 (world.ts CAMS), further back on a screen whose HUD would cover the campsite. */
  let camMax = $state<number>(CAM_MAX);
  const trackH = $derived(vh + (camMax - camMin) * s);

  // Where each villager lives (the director walks them from there and back; design.md "Walking").
  // svelte-ignore state_referenced_locally
  if (live) for (const id of ['mine', 'partner'] as const) setHome(id, sides[id].home[0], sides[id].home[1]);
  // where a tap sent my villager this session (it stays there; the next open finds it home)
  // svelte-ignore state_referenced_locally
  if (live) {
    const stay = stayingAt();
    if (stay && !actors.mine.walking) place('mine', stay[0], stay[1]);
  }
  // My villager walks to what I tap (avatar.ts): the walk geometry from the world's constants, a spot is fine when a
  // villager standing there covers no control or visitor and stays on screen, and the feet's live position (a walk
  // re-targets from mid-step). With a visitor on centre stage the villagers walk around them.
  const geo = walkGeo();
  let visited: { at: string; geo: ReturnType<typeof walkGeo> } | null = null;
  function geoVisited() {
    const { x, y } = actors.visitor, at = x || y ? [x, y] : [CENTRE_STAGE[0], CENTRE_STAGE[1]];
    if (visited?.at !== String(at)) visited = { at: String(at), geo: walkGeo({ obstacles: [{ x0: at[0] - 18, x1: at[0] + 18, y0: at[1] - 8, y1: at[1] + 10 }] }) };
    return visited.geo;
  }
  const feet = (id: 'mine' | 'partner') => livePos(id);
  function standsClear(id: ActorId, x: number, z: number): boolean {
    const g = stageGeo(sceneEl);
    if (!g || !world.inView(x, z, -24)) return false;
    const [sx, sy] = world.screenU(x, z), k = world.scaleAt(x, z);
    const hw = 22 * k, h = VILLAGER.h * k;
    if (sx - hw < g.left || sx + hw > g.right || sy + 4 > g.bottom || sy - h < world.view.horizon * g.k) return false;
    const self = sceneEl?.querySelector(`[data-actor="${id}"] .vil`);
    // behind a goal tree its fruit row stays on top
    const behind = z > GOAL_TREES.A[1];
    // the controls themselves (not the 6px of padding placement.ts adds), against the figure (≈ 0.45 × 0.92 of its height)
    const keep = guardsU(g, -6 * g.k, (el) => el === self || (behind && el.matches('.row-btn')));
    // nor in front of a visitor (a tap meant for them would land on the villager)
    for (const v of sceneEl?.querySelectorAll('[data-visitor] .art') ?? []) {
      const r = v.getBoundingClientRect();
      if (r.width) keep.push({ x0: (r.left - g.r.left) * g.k + 4, x1: (r.right - g.r.left) * g.k - 4, y0: (r.top - g.r.top) * g.k + 4, y1: (r.bottom - g.r.top) * g.k - 4 });
    }
    return clearAt(keep, sx, sy - h * 0.46, h * 0.225, h * 0.46);
  }

  // ---- the camera (docs/decisions.md "Free scrolling"): the scroller's scrollTop → camZ, read on each frame; still →
  // world.rest.z. Only the finger moves it: plain native scrolling between the two ends (まえ at the foot, where it
  // opens; おく at the top), no snapping, no settling, no follow, no programmatic moves (but the e2e hook's). ----
  let settle: ReturnType<typeof setTimeout> | undefined;
  function measure() {
    if (!scroller) return;
    const r = scroller.getBoundingClientRect();
    world.fit(scroller.clientWidth, scroller.clientHeight, r.left, r.top);
    const keepCam = world.view.camZ;
    hudBottom = Math.max(0, (document.querySelector('.ribbon-wrap')?.getBoundingClientRect().bottom ?? 0) - world.view.top);
    const syAt = (x: number, z: number, lift = 0) => (cam: number) => ((world.view.camZ = cam), world.screenAt(x, z, lift).sy);
    // まえ: the shoreline SHORE_AT down the screen (a wide band of sea under the beach), unless that would put the goal
    // trees' canopies under the HUD (then as low as they stay CLEAR px under it)
    // (each searched where its point is on the near side of the horizon and on screen: the projection is monotonic there)
    const ahead = horizonAhead(world.P);
    const shore = solveCam(syAt(195, SHORE_Z), world.view.vh * SHORE_AT, SHORE_Z - ahead + 40, SHORE_Z + 60);
    const canopy = solveCam(syAt(GOAL_TREES.A[0], GOAL_TREES.A[1], TREE_H), hudBottom + CLEAR, GOAL_TREES.A[1] - ahead + 40, GOAL_TREES.A[1] + 60);
    camMin = Math.round(Math.max(shore, canopy));
    // おく: up the island until the campsite stands well in front of the horizon (its feet CAMP_AT of the height under
    // it, clear of the haze and the fade) and its top clears the HUD (CLEAR px under it), as far as the plan reaches
    const camp = CAMPSITE;
    const far = Math.max(CAMS.oku, PLAN.z1 - ahead - 40), near = Math.max(camMin + 120, camp.z - ahead + 40);
    const feet = solveCam(syAt(camp.x, camp.z), world.view.horizon + world.view.vh * CAMP_AT, near, far);
    camMax = Math.round(Math.max(feet, solveCam(syAt(camp.x, camp.z, camp.h), hudBottom + CLEAR, near, far)));
    world.view.camZ = keepCam;
    vh = world.view.vh;
    s = world.view.s;
    horizonPx = world.view.horizon;
  }
  const anyMoving = () => inMotion('mine') || inMotion('partner') || inMotion('visitor');

  // ---- tap-to-walk (spec §4): a tap on the ground sends my villager there; a cream ring marks the spot ----
  let rings = $state<{ n: number; x: number; z: number; partner?: boolean }[]>([]);
  let ringN = 0;
  /** The cream ring where a tap sent a villager (`partner`: theirs, from their phone). */
  function ring(x: number, z: number, partner = false) {
    const n = ++ringN;
    rings = [...rings.slice(-1), { n, x, z, partner }];
    life.later(() => (rings = rings.filter((g) => g.n !== n)), RING_MS + 50);
  }
  /** SceneTaps' last step: the tap landed on the ground at (x, z) and nothing else took it. A tap at a building's foot
   *  knocks at its door (walk there, then its line). */
  function walkThere(x: number, z: number, hit: SceneHit): boolean {
    if (!live || covered || actors.mine.asleep) return false;
    // only empty ground walks: water ripples and a building's footprint knocks at its door where my villager stands
    if (hit.kind !== 'grass' && hit.kind !== 'sand') return false;
    const b0 = buildingAt(x, z), door = b0 && sceneEl?.querySelector<HTMLElement>(`[data-building="${b0}"] .door`);
    if (b0 && door) return building(b0, door), true;
    // (the partner's phone plays the very walk: villagerSync.ts tells it every move of mine, and the relay keeps it)
    const r = sendTo(x, z);
    if (!r) return false;
    ring(r.to[0], r.to[1]);
    return true;
  }

  // ---- the partner off screen: a round face of their villager pinned at the top or the bottom edge (a cue only) ----
  let edge = $state<'top' | 'bottom' | null>(null);
  function edgeCheck() {
    const [x, z] = livePos('partner'), p = world.screenAt(x, z, VILLAGER.h * 0.5);
    const e = p.sy < world.view.horizon + 10 || !p.visible ? (z > world.view.camZ ? 'top' : 'bottom') : p.sy > world.view.vh + 10 ? 'bottom' : null;
    if (e !== edge) edge = e;
  }

  /** The top chrome's bottom edge (px). */
  let hudBottom = 0;
  /** How far under the HUD the ends keep the campsite's top and the goal trees' canopies (px). */
  const CLEAR = 16;
  /** Where the front end puts the shoreline: this share down the screen (the sea under it). */
  const SHORE_AT = 0.83;
  /** Where the back end puts the campsite's feet: this share of the height under the horizon. */
  const CAMP_AT = 0.17;
  function onScroll() {
    world.kick();
    clearTimeout(settle);
    talk?.hold(true);
    settle = setTimeout(() => {
      world.rest.z = Math.round(world.view.camZ);
      talk?.hold(false);
    }, 140);
  }
  /** Put the camera at a world z at once (the e2e hook). */
  function goTo(z: number) {
    scroller?.scrollTo({ top: scrollFor(Math.min(camMax, Math.max(camMin, z)), camMax, s), behavior: 'instant' });
  }
  onMount(() => {
    if (!scroller) return;
    measure();
    world.onTick(() => {
      if (scroller) world.view.camZ = live ? camAt(scroller.scrollTop, camMin, camMax, world.view.s) : camMin;
      if (live) edgeCheck();
      return anyMoving();
    });
    flushSync(); // the track's height for this screen, before scrolling to its foot
    scroller.scrollTop = scrollFor(camMin, camMax, world.view.s);
    world.view.camZ = camMin;
    world.rest.ready = true;
    world.invalidate();
    const offMove = live ? onMove(() => world.kick()) : () => {};
    let first = true;
    const ro = new ResizeObserver(() => {
      // the first call is the observe itself (already measured)
      if (first) return void (first = false);
      // a new screen: the same camera, refitted (within the new ends)
      const keep = world.view.camZ;
      measure();
      requestAnimationFrame(() => {
        if (scroller && live) scroller.scrollTop = scrollFor(Math.min(camMax, Math.max(camMin, keep)), camMax, world.view.s);
        world.invalidate();
      });
    });
    ro.observe(scroller);
    if (live) (window as unknown as { __world?: unknown }).__world = {
      cam: () => world.view.camZ, idle: () => world.idle(), perf: world.perf,
      /** Put the camera at z at once (e2e). */
      go: (z: number) => goTo(z),
      at: (x: number, z: number) => world.clientAt(x, z), P: world.P,
      /** Put my villager at a world point (e2e: the depth order). */
      put: (x: number, z: number) => (place('mine', x, z), world.kick()),
      /** My villager's feet now (e2e: tap-to-walk). */
      mine: () => livePos('mine'),
      /** The partner's villager's feet now (e2e: the shared world). */
      partner: () => livePos('partner'),
      /** The scroller's two ends for this screen (まえ, おく). */
      stops: () => [camMin, camMax]
    };
    return () => {
      offMove();
      ro.disconnect();
      clearTimeout(settle);
      world.stop();
      dropLive(world);
    };
  });

  onMount(() => {
    if (!live) return;
    const off = attachAvatar({ geo: () => (presence.visitor ? geoVisited() : geo), clear: standsClear, where: feet, enabled: () => !covered && !life.hidden, hush: () => talk?.hush() });
    let hiddenAt = 0;
    const vis = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > SNAP_HOME_MS) snapHome();
    };
    document.addEventListener('visibilitychange', vis);
    // footsteps by the ground under the walker (quiet world cues: silent under a sheet; the director spaces them)
    const offStep = onStep((id) => {
      if (covered || life.hidden) return;
      const [x, z] = livePos(id);
      const c = stepCue(surfaceAt(x, z), season === 'winter', raining());
      if (c) cue(c);
    });
    return () => {
      offStep();
      off();
      document.removeEventListener('visibilitychange', vis);
    };
  });
  // a sheet over the scene: everyone stops where they are; uncovered, whoever is away wanders home
  let wasCovered = false;
  $effect(() => {
    const c = covered;
    if (!live || c === wasCovered) return;
    wasCovered = c;
    untrack(() => (c ? freeze() : thaw()));
  });
  // A shaken tree: it shakes where it stands, my villager turning to it (avatar.ts), and what falls falls (TreeShakes:
  // every tree on the island, its drop by its kind; the goal trees' canopies count their own taps, FruitTree).
  /** A tree by id (the same on both phones). */
  const treeOf = (id: string): ShakeTree | null => treeById(id);
  function shakeTree(pid: PersonId) {
    shakeAt(goalTree(pid));
  }
  function shakeAt(tr: ShakeTree) {
    turnTo(tr.x);
    shakes?.shaken(tr);
  }
  /** Any other tree (SceneTaps' tap on its art): a tap rustles it; the third quick one is a shake (treeShake.ts). */
  const treeTaps: Record<string, number[]> = {};
  function treeTap(id: string): boolean {
    const tr = treeOf(id);
    if (!live || covered || !tr || tr.kind === 'goal') return false;
    const run = shakeTap(treeTaps[id] ?? [], Date.now());
    treeTaps[id] = run.taps;
    rustle(tr, true);
    if (run.shake) shakeAt(tr);
    return true;
  }
  /** A tree rustles (a tap, a shake: the partner's too): a goal tree its own way (FruitTree), any other here. */
  function rustle(tr: ShakeTree, sound = false) {
    const g = /^goal-([AB])$/.exec(tr.id);
    if (g) return void life.shakeN[g[1] as PersonId]++;
    if (sound) cue('tree-shake');
    for (const el of sceneEl?.querySelectorAll<HTMLElement>(`[data-scenery-id="${tr.id}"] .art`) ?? []) {
      for (const a of el.getAnimations()) if (a.id === 'rustle') a.cancel();
      el.animate([{ rotate: '0deg' }, { rotate: '-2.6deg', offset: 0.18 }, { rotate: '2deg', offset: 0.42 }, { rotate: '-1.1deg', offset: 0.68 }, { rotate: '0deg' }],
        { duration: 560, easing: 'ease-out', id: 'rustle' });
    }
  }
  // My partner has the app open (the relay's presence: their villager's face at the edge when it's out of view). The
  // phone's one relay socket (sync/live.ts liveRelay, shared with the sync's push); never a second.
  let partnerHere = $state(false);
  /** The relay, when there is one (never in the demo): presence, and the partner's walks (spec §4, LIVE_V 2). */
  // svelte-ignore state_referenced_locally
  const relay = live && LIVE_URL && !week.demo ? liveRelay() : null;
  // The shared island (docs/backend.md#shared-world, store/world.svelte.ts): the day's changes, mine and the partner's,
  // over this relay; in the demo the two players' tabs share it (sync/live-local.ts: `?demo` and `?demo&as=B`).
  // svelte-ignore state_referenced_locally
  const demoRelay = live && week.demo ? createLocalLive(view.me) : null;
  $effect(() => {
    if (!live) return;
    const me = view.me;
    untrack(() => {
      shared.attach(relay ?? demoRelay, me, !!week.demo);
      demoRelay?.start();
    });
  });
  $effect(() => () => demoRelay?.stop());
  // the sheet keeps each person's part of the day (held: one row per person and day), and gives the partner's back
  $effect(() => {
    if (!live) return;
    shared.sink = (date, row) => sendIslandDay(date, row);
    return () => (shared.sink = null);
  });
  $effect(() => {
    const m = week.model;
    if (!live || !m) return;
    untrack(() => shared.rows(m.state.islandDays.map((r) => ({ at: r.at, person: r.person, data: r.data }))));
  });
  $effect(() => {
    if (!relay) return;
    return relay.onStatus((st) => (partnerHere = partnerOnline(st, !!week.demo)));
  });
  /** A node id or a world point (a walk's target). */
  const pointOf = (to: string | readonly [number, number]) => (typeof to === 'string' ? nav().named[to] : to);
  // The villagers on both phones (villagerSync.ts): every move of mine goes over the relay as the very walk; the
  // partner's plays here from the same start at the same time, and while they have the island open their villager is
  // theirs to move (this phone's own life leaves it alone).
  // (on the relay's own clock: a `?date=` preview shifts the island's day, not when a walk set off)
  const relayNow = () => (relay ?? demoRelay)?.serverNow() ?? Date.now();
  // svelte-ignore state_referenced_locally
  const link = live ? linkVillagers({ share: (w) => void shared.share(w), me: () => view.me, serverNow: relayNow, enabled: () => live }) : null;
  $effect(() => {
    const r = relay ?? demoRelay;
    if (!link || !r) return;
    return r.onStatus((st) => link.partnerHere(st.connected && st.peer));
  });
  $effect(() => () => link?.detach());
  /** The partner's walk, played here: the very walk when it came with it (rested at its end when it's over), else (an
   *  older app: only where to) planned here from where their villager stands. */
  function partnerWalk(w: Extract<DayEvent, { kind: 'walk' }>, now: boolean) {
    const to = pointOf(w.to);
    if (!to) return;
    setPartnerRest(to[0], to[1]);
    steered.partner = Date.now();
    const how = playPartner(w, relayNow(), !covered && !life.hidden);
    if (how === 'walk' || how === 'jump') {
      // a run (a tap on their phone: NH's ring where it goes)
      if (now && w.ms && w.from && Math.hypot(to[0] - w.from[0], to[1] - w.from[1]) / (w.ms / 1000) >= RUN_RING_U_S) ring(to[0], to[1], true);
      return;
    }
    if (how) return;
    if (!now || covered) return partnerRestsAt(to[0], to[1]);
    if (partnerTo(to[0], to[1])) ring(to[0], to[1], true);
  }
  onMount(() => {
    if (!live) return;
    // where the partner's villager is today (a phone opening later: the shared day's last walk, played to now)
    const w0 = shared.day.walks[view.partner];
    if (w0) partnerWalk({ kind: 'walk', ...w0, who: view.partner }, false);
    return shared.on(({ e, live: now }) => {
      if (e.kind === 'walk' && e.who === view.partner) partnerWalk(e, now);
      // a villager woke on their phone (theirs tapped, or both at a high-five): here too, until the same moment
      else if (e.kind === 'act' && e.act === 'wake' && now) playWake(e, view.me, relayNow());
    });
  });
  // The campsite's door (docs/design.md "Buildings"): a tap says who is visiting today (nobody lives inside; the
  // balloon's tail at the door).
  function building(id: BuildingId, el: HTMLElement) {
    if (!live || covered) return;
    // in place (only a tap on empty ground walks): my villager turns to the door and the line is said
    turnTo(doorAt(id)[0]);
    knock(id, el);
  }
  /** At the door: the campsite's line about today's guest (the balloon's tail at the door). */
  function knock(id: BuildingId, el: HTMLElement) {
    if (covered) return;
    const guest = visitorNow(minuteNow());
    cue('tick');
    talk?.say(t(`world.building.${id}`), t(campLine(!!guest), { name: guest ? t(`visitor.${guest}`) : '' }), el, { colour: '#B5D98A' });
  }
  // Fireworks (design.md "Fireworks"): our volley when both of us met all four today; a villager cheers at a burst now
  // and then (awake and not busy with something else); a tap in the sky during a show sends one more (SceneTaps).
  let fireworks = $state<{ tap(px: number, py: number): boolean }>();
  const allMet = $derived((['A', 'B'] as const).every((p) => RING_FRUITS.every((f) => view.people[p].rings[f].met)));
  function cheer() {
    const id = Math.random() < 0.5 ? 'mine' : 'partner';
    if (actors[id].asleep || busy(id)) return;
    applyStep(id, { actor: id, motion: 'hop', emote: Math.random() < 0.5 ? 'glee' : 'mark-sparkle' });
  }
  /* both villagers asleep: the zzz loops join the idle budget, so particles thin out to one */
  const asleepNow = $derived(actors.mine.asleep && actors.partner.asleep);
  // The time of day's tint (and a wet day's darkening), at the source (docs/decisions.md "Lights in depth"): the ground
  // takes it as one multiply plane over its bands and the sky's low band; every world node takes the same multiply as
  // a colour-matrix filter, so a light (a lamp's glow, a lit window, a firefly: camera.svelte.ts `light`) sorts in depth
  // like anything else, untinted (a tree in front of a lamp covers its glow). Recomputed when the time of day or the
  // weather changes; nothing per frame.
  const fid = `${uid}-tod`;
  let shade = $state<[number, number, number] | null>(null);
  $effect(() => {
    void tod;
    const sky = live ? weather.sky : 'clear';
    const el = sceneEl;
    if (!el) return;
    const hex = (h: string): [number, number, number] | null => (/^#[0-9a-f]{6}$/i.test(h) ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number] : null);
    const base = hex(getComputedStyle(el).getPropertyValue('--tod-tint').trim()) ?? [1, 1, 1];
    const wet = sky !== 'clear' ? WET[sky] : null, w = wet && hex(wet[0]);
    const rgb = base.map((c, i) => c * (w ? 1 - wet![1] * (1 - w[i]) : 1)) as [number, number, number];
    shade = rgb.every((c) => c > 0.995) ? null : rgb;
  });
  const shadeMatrix = $derived(shade ? `${shade[0].toFixed(3)} 0 0 0 0 0 ${shade[1].toFixed(3)} 0 0 0 0 0 ${shade[2].toFixed(3)} 0 0 0 0 0 1 0` : '');

  // The scenery that comes only on its days (the weather, the fireworks, an event's decorations): loaded the first time
  // it's due, then kept, so its code stays out of the first load.
  const weatherC = lazyComponent(() => import('./Weather.svelte')), fireworksC = lazyComponent(() => import('./Fireworks.svelte'));
  const halloweenC = lazyComponent(() => import('./Halloween.svelte')), birthdayC = lazyComponent(() => import('./Birthday.svelte')), weddingC = lazyComponent(() => import('./Wedding.svelte'));
  const WeatherC = $derived(weatherC.get(live && (weather.sky !== 'clear' || weather.fog || !!weather.rainbow || weather.aurora)));
  const FireworksC = $derived(fireworksC.get(live && (life.devFireworks || hookFlag('fireworks') || wedding.fireworks || allMet || !!showAt(jst(clock).month, jst(clock).day, jst(clock).weekday, jst(clock).hour))));
  const HalloweenC = $derived(halloweenC.get(live && nhEvent?.id === 'halloween'));
  const BirthdayC = $derived(birthdayC.get(live && !!bday.length));
  const WeddingC = $derived(weddingC.get(live && (wedding.arch || wedding.day)));
</script>

<div class="if-scene scene" bind:this={sceneEl} data-season={season} data-tod={tod} data-sky={live ? weather.sky : undefined} data-paused={life.hidden || undefined}
  data-covered={covered || undefined} data-live={live || undefined} style:--horizon-y="{horizonPx}px" style:--sky-h="{horizonPx + 6}px">
  {#if live && FireworksC}<FireworksC bind:this={fireworks} enabled={() => !covered && !life.hidden} forced={life.devFireworks || wedding.fireworks} {allMet} {cheer} />{/if}

  <div class="scroller" bind:this={scroller} onscroll={onScroll} data-world-scroller>
    <div class="track" style:height="{trackH}px">
      <div class="stage" style:height="{vh}px" style:--u="{s}px" style:--su="{s}px" style:--tod-filter={shade ? `url(#${fid})` : 'none'}>
        <svg class="defs" aria-hidden="true" width="0" height="0">
          <filter id={fid} color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values={shadeMatrix || '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0'} /></filter>
        </svg>
        <!-- the sky is the stage's backdrop, behind every world thing (a tree top rising over the horizon stands in front
             of the sun or moon); the ground's tint plane reaches into its low band (no edge at the horizon); the sun or
             moon and the stars sit high in the sky, above the plane's reach -->
        <Sky {tod}>
          {#if life.balloon}<Balloon ondone={() => (life.balloon = false)} />{/if}
        </Sky>
        <Sky {tod} layer="lights" />
        {#if live && WeatherC}<WeatherC where="sky" />{/if}
        <WorldGround {season} {foliage} />
        <WorldWater floating={ev.cherry ? 'petal' : ev.maple ? 'maple' : null} night={tod === 'night'} winter={season === 'winter'} />
        <div class="haze" aria-hidden="true"></div>

        <Scenery {season} {foliage} {month} {live} {tod} onbuilding={building} />

        {#each ['A', 'B'] as const as pid (pid)}
          {@const t = GOAL_TREES[pid]}
          <FruitTree person={view.people[pid]} x={t[0]} z={t[1]} {foliage} shakeN={life.shakeN[pid]}
            celebrate={life.celebrate[pid]} open={openTree === pid} ontoggle={(on) => (openTree = on ? pid : null)}
            onshake={() => shakeTree(pid)} />
        {/each}

        <Flowers {season} {hybrid} />

        {#each ['mine', 'partner'] as const as id (id)}
          {@const sd = sides[id]}
          <div class="actor" class:walking={live && actors[id].walking} data-actor={id} data-person={sd.person.person} data-stung={stung[id] || null} style:--bob-delay={id === 'partner' ? '-1.2s' : '0s'}
            {@attach world.at(live ? { x: sd.home[0], z: sd.home[1], h: VILLAGER.h, live: () => livePos(id), always: true } : { x: sd.home[0], z: sd.home[1], h: VILLAGER.h })}>
            <button type="button" class="vil" disabled={!live} data-sfx="self"
              aria-label={id === 'mine'
                ? t('island.me', { name: sd.person.villagerName, bells: formatBells(sd.person.today.bells) })
                : t('island.highfive', { name: sd.person.villagerName })}
              onclick={(e) => {
                if (id === 'mine') {
                  sceneTaps?.villagerTap(e.currentTarget);
                  life.tapMine();
                } else highFiveTap();
              }}>
              <Villager person={sd.person.person} villager={sd.person.villager} size={u(VILLAGER.h)} eager
                actor={live ? id : undefined} side={sd.side} emoteSize="var(--emote-size)" shadow animate={live} tricked={id === 'mine' && tricked} hat={live ? hatOf(id, sd.person) : null} />
            </button>
          </div>
        {/each}

        {#if live && edge && partnerHere}
          <!-- the partner out of view: their villager's face at the edge they're off (a cue; the finger scrolls) -->
          <span class="edge {edge}" data-partner-edge={edge} aria-hidden="true">
            <Villager person={sides.partner.person.person} villager={sides.partner.person.villager} size={28} head />
          </span>
        {/if}

        {#if zap}
          {#key zap.n}
            <!-- the high-five's sparkle, flying from mine to the partner -->
            <div class="zap-node" aria-hidden="true" {@attach world.at({ x: 0, z: 0, h: 20, live: zapAt, always: true, light: true })}>
              <svg class="zap" viewBox="0 0 24 24" data-zap><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
          {/key}
        {/if}
        {#each rings as r (r.n)}
          <!-- where a tap sent my villager: a cream ring on the ground, shrinking out (NH has none; the least feedback) -->
          <div class="ring-node" {@attach world.at({ mode: 'flat', x: r.x, z: r.z, h: 4, zi: 8 })}><i class="tap-ring" class:partner={r.partner} data-ring={r.partner ? 'partner' : 'mine'}></i></div>
        {/each}

        <Particles {season} {foliage} {tod} quiet={asleepNow} mode="fireflies" raining={live && raining()} />
        {#if live}
          <!-- scenery taps (bushes, flowers, clouds, sun / moon, sea, sand, grass): a short flourish, nothing else -->
          <SceneTaps bind:this={sceneTaps} scene={sceneEl} {season} {tod} enabled={() => !covered && !life.hidden} swallowed={() => closedBy} walk={walkThere}
            exercise={view.people.A.rings.peach.met || view.people.B.rings.peach.met} cake={bday.length > 0}
            skyTap={(x, y) => !!fireworks?.tap(x, y)}
            say={(name, parts, from, o) => talk?.say(name, parts, from, o)} ontrick={trick} tree={treeTap} />
          <Talk bind:this={talk} scene={sceneEl} />
          {#if hookFlag('hit')}
            <!-- ?hit: every tap target drawn over the island (its own chunk) -->
            {#await import('./HitOverlay.svelte') then m}<m.default scene={sceneEl} />{/await}
          {/if}
          <!-- what a shaken tree drops: a branch, now and then a wasp nest -->
          <TreeShakes bind:this={shakes} scene={sceneEl} onsting={sting} {treeOf} rustle={(tr) => rustle(tr, true)} />
          <!-- the partner's catches and finds: their villager holds it up here, or a notice at the edge -->
          <PartnerNews scene={sceneEl} />
        {/if}
        <div class="tint"></div>
        {#if live && WeatherC}<WeatherC where="stage" />{/if}
        {#if live && nhEvent?.id === 'halloween' && HalloweenC}<HalloweenC scene={sceneEl} night={nhEvent.night} />{/if}
        {#if live && bday.length && BirthdayC}<BirthdayC {view} people={bday} date={today} />{/if}
        {#if live && (wedding.arch || wedding.day) && WeddingC}<WeddingC scene={sceneEl} arch={wedding.arch} day={wedding.day} date={wedding.date} />{/if}
        <div class="fall"><Particles {season} {foliage} {tod} quiet={asleepNow} festival={ev.cherry || ev.maple} snowing={live ? weather.sky === 'snow' : undefined} /></div>
      </div>
    </div>
  </div>
</div>

<style>
  .scene {
    --scene-h-auto: clamp(300px, calc(100dvh - var(--island-bottom, 0px)), 600px);
    /* emotes are game objects: 44u, 36–56px */
    --emote-size: clamp(36px, calc(44 * 100cqw / 390), 56px);
    /* clip, not hidden: nothing may scroll the scene (a focused balloon or plate would otherwise pull it along) */
    position: relative; width: 100%; height: var(--scene-h, var(--scene-h-auto)); overflow: clip;
    container-type: inline-size; isolation: isolate; background: var(--sea-flat);
    --stage-top: 0px;
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }
  /* the camera: a native scroller (drag scrolls; a tap is a click), its document never scrolls */
  .scroller {
    position: absolute; inset: 0; z-index: var(--z-stage); overflow-y: auto; overflow-x: hidden; overscroll-behavior: none;
    -webkit-overflow-scrolling: touch; scrollbar-width: none; touch-action: pan-y;
  }
  .scroller::-webkit-scrollbar { display: none; }
  .scene:not([data-live]) .scroller { overflow: hidden; }
  .track { position: relative; }
  /* the stage stays on screen while the track scrolls under it; its width is 390 units (cqw) and --u one unit */
  .stage {
    position: sticky; top: 0; width: 100%; overflow: hidden; container-type: inline-size; contain: layout paint;
    --if-st: 0px; --if-hy: var(--horizon-y);
    /* the island's layers stand over every world thing (depths run to ~12M; camera.svelte.ts OVER is 50M). Six
       significant digits at most: the CSS minifier rounds a longer number (60000080 shipped as 60000100, so the
       tint stood over the lights at 60000081); the lights (Scenery's, the fireflies', Halloween's) are 60310000 */
    --z-fall: 60100000; --z-leaf: 60200000; --z-tint: 60300000; --z-taps: 60320000; --z-coin: 60400000; --z-popup: 60500000;
    /* the ground's tint plane: over the bands and the sky, under every world node (they tint themselves) */
    --z-ground-tint: 2;
  }
  /* a little haze where the ground meets the sky */
  .haze {
    position: absolute; left: 0; right: 0; top: calc(var(--horizon-y) - 2px); height: 40px; z-index: 1; pointer-events: none;
    background: linear-gradient(to bottom, color-mix(in srgb, var(--sky-hz) 90%, transparent), color-mix(in srgb, var(--sky-hz) 35%, transparent) 45%, transparent);
  }

  /* the feet at the node's origin (camera.svelte.ts places it) */
  .actor { width: 0; height: 0; transform-origin: 0 0; }
  .actor.walking { will-change: transform; }
  .vil {
    position: absolute; left: 0; bottom: 0; translate: -50% 2px; width: max-content;
    appearance: none; background: none; border: 0; padding: 8px 8px 0; margin: 0; cursor: pointer;
    border-radius: 40% 40% 20% 20%; -webkit-tap-highlight-color: transparent; min-width: 64px; min-height: 64px;
    display: flex; justify-content: center; align-items: flex-end; color: inherit;
  }
  .vil:disabled { cursor: default; }
  .vil:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* the time of day's tint on the ground: one multiply plane over the bands and the sky's low band, fading out up the
     sky (its own table up there, the sun or moon and the stars in it), so no edge shows; every world node takes the
     same multiply in its own filter (--tod-filter), the lights (lamps, lit windows, fireflies) none. Day: none. */
  .tint {
    position: absolute; inset: 0; z-index: var(--z-ground-tint); background: var(--tod-tint); mix-blend-mode: multiply; pointer-events: none;
    -webkit-mask-image: var(--tint-mask); mask-image: var(--tint-mask);
  }
  .stage { --tint-mask: linear-gradient(to bottom, transparent calc(var(--horizon-y) - 70px), #000 calc(var(--horizon-y) - 16px)); }
  /* every world node tints itself (the same multiply as the plane), but the lights */
  .stage :global(.wn) { filter: var(--tod-filter); }
  .fall { filter: var(--tod-filter); }
  .defs { position: absolute; width: 0; height: 0; overflow: hidden; }
  /* villager contact shadow: radial, surface-coloured, 0.30h × 0.06h, +6% right and down; dusk: stretched to the right */
  .vil :global(.shadow) {
    width: calc(var(--h) * .6); height: calc(var(--h) * .12); margin-left: calc(var(--h) * -.3); bottom: calc(var(--h) * -.05);
    background: radial-gradient(closest-side, var(--sh-c), color-mix(in srgb, var(--sh-c) 70%, transparent) 50%, transparent);
    translate: calc(var(--h) * .036) calc(var(--h) * .007); transform-origin: 30% 50%;
  }
  /* K.K.'s show: the villagers sway to the beat (Visitor sets data-show; rotate, apart from the rig's transforms) */
  .scene:global([data-show]) .vil { transform-origin: 50% 100%; animation: sway .84s ease-in-out infinite alternate; }
  .scene:global([data-show]) .actor:nth-of-type(odd) .vil { animation-delay: -.42s; }
  @keyframes sway { from { rotate: -3deg; } to { rotate: 3deg; } }
  .fall { position: absolute; inset: 0; z-index: var(--z-fall); pointer-events: none; }
  .ring-node { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  .zap-node { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  .zap { position: absolute; left: calc(-13 * var(--u)); top: calc(-13 * var(--u)); width: calc(26 * var(--u)); height: calc(26 * var(--u)); animation: zap .52s linear both; }
  .zap path { fill: var(--fx-spark); }
  .zap circle { fill: #fff; }
  @keyframes zap { from { transform: scale(.5) rotate(0); opacity: 0; } 15% { opacity: 1; } 50% { transform: scale(1.15) rotate(90deg); } 85% { opacity: 1; } to { transform: scale(.7) rotate(180deg); opacity: 0; } }
  /* the partner off screen: their villager's face at the edge (under the HUD at the top, over the foot at the bottom) */
  .edge {
    position: absolute; left: 50%; z-index: var(--z-taps); translate: -50% 0; width: 44px; height: 44px; padding: 6px; border: 0; pointer-events: none;
    border-radius: 50%; background: var(--plate); box-shadow: 0 3px 0 var(--plate-lip); display: grid; place-items: center; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .edge.top { top: calc(var(--hud-bottom, 0px) + 8px); }
  .edge.bottom { bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); }
  .tap-ring {
    position: absolute; left: 0; top: 0; width: calc(34 * var(--u)); height: calc(34 * var(--u)); translate: -50% -50%; border-radius: 50%;
    border: calc(3 * var(--u)) solid #FFF7DE; box-shadow: 0 0 0 1px rgba(120, 90, 40, .18); animation: tap-ring 400ms ease-out both;
  }
  @keyframes tap-ring { from { transform: scale(1); opacity: .95; } to { transform: scale(.35); opacity: 0; } }
  /* the partner's: their phone's tap, a softer ring */
  .tap-ring.partner { border-color: #DDEFFF; opacity: .8; }
  .scene[data-covered] .fall :global(*) { animation-play-state: paused !important; }
</style>
