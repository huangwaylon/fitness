<script lang="ts">
  // The island (docs/design.md "World"): NH's rolling-log island in 2D DOM. A native vertical scroller is the camera
  // (its scrollTop → camZ, camera.svelte.ts; overscroll contained), with three proximity snaps: まえ (home: the health
  // lawn, the beach, the airport), ひろば (the plaza, Resident Services, the pond) and おく (the shops, the museum, the
  // cliff and the campsite). The ground is baked raster chunks bent onto the log by 40 bands (WorldGround), the live
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
  import Museum from './Museum.svelte';
  import FruitTree from './FruitTree.svelte';
  import FlowerBeds from './FlowerBeds.svelte';
  import Particles from './Particles.svelte';
  import { raining, weather } from './weatherNow.svelte.ts';
  import Balloon from './Balloon.svelte';
  import SceneTaps from './SceneTaps.svelte';
  import Talk from './Talk.svelte';
  import TreeShakes from './TreeShakes.svelte';
  import { HATS, birthdaysOn, isBirthday } from './birthday.ts';
  import { FIREWORKS_FROM, archOn, weddingDay } from './wedding.ts';
  import { eventAt, forcedEvent } from './events.ts';
  import { TRICK_MS } from './visitors.ts';
  import { STUNG_SWEAT_MS } from './treeShake.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { IslandLife } from './islandLife.svelte.ts';
  import { BEDS, VILLAGER, eventsAt, u, type Tod } from './scene.ts';
  import { CAMS, CAM_MAX, CAM_MIN, CENTRE_STAGE, GOAL_TREES, HOMES, surfaceAt, type BuildingId } from './world.ts';
  import { WILBUR_AT, doorAt, doorLine, wilburShows, type DoorOpens } from './buildings.ts';
  import { Follow, RING_MS, stepCue } from './tapWalk.ts';
  import { nav } from './nav.ts';
  import { LIVE_URL, liveRelay } from '#lib/sync/live.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { visitorNow } from './visitors.ts';
  import { World, dropLive, provideWorld } from './camera.svelte.ts';
  import { camAt, scrollFor } from './roll.ts';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { HYBRIDS, hybridFor } from './care.ts';
  import { garden } from './sceneDay.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { actors, applyStep, busy, inMotion, livePos, onMove, onStep, place, setEmote, setHome, setMotion, wake } from '../motion/director.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { walkGeo } from './walkGraph.ts';
  import { approach, attachAvatar, partnerTo, presence, freeze, sendTo, snapHome, stayingAt, thaw, SNAP_HOME_MS } from './avatar.ts';
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

  // I stand on the left (layout slot A), my partner on the right (slot B), whichever person I am.
  const slot = (pid: PersonId): 'A' | 'B' => (pid === view.me ? 'A' : 'B');
  const sides = $derived<Record<'mine' | 'partner', { person: PersonWeekView; home: readonly [number, number]; side: 'left' | 'right' }>>({
    mine: { person: view.people[view.me], home: HOMES.A, side: 'left' },
    partner: { person: view.people[view.partner], home: HOMES.B, side: 'right' }
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
  // the popup closed: a camera held for its room is let go (it snaps back to the stop)
  $effect(() => {
    if (!openTree) untrack(() => world.release?.());
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
  // The speech balloon (Talk) is for the island's other speakers: the doors, the visitors, Blathers, Wilbur.
  let talk = $state<ReturnType<typeof Talk>>();
  /** The scenery taps (a tap on my villager may send a flea hopping off it). */
  let sceneTaps = $state<ReturnType<typeof SceneTaps>>();
  // A tap on the partner is a high-five (NH's reaction, no card): mine walks up beside them (a step away, running if
  // it's far), they wait (both woken if asleep), then both hop face to face with the sparkles (R4) and it's sent. One at
  // a time: a tap while one is under way does nothing more.
  let fiving = false;
  function highFiveTap() {
    if (!live || covered || fiving) return;
    fiving = true;
    cue('villager-tap');
    for (const id of ['mine', 'partner'] as const) if (actors[id].asleep) wake(id);
    const [px, pz] = livePos('partner');
    if (actors.partner.walking) place('partner', px, pz);
    const { ms } = approach(px, pz, { reach: [40, 56], long: true });
    actors.partner.busyUntil = Math.max(actors.partner.busyUntil, Date.now() + ms + 2400);
    life.later(() => {
      fiving = false;
      if (!covered) onhighfive?.();
    }, ms + 120);
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
    const row = (r: number) => (r ? BEDS[season].front : BEDS[season].back);
    if (hookFlag('hybrid')) return { cell: '0-1', flower: HYBRIDS[row(0)][0] };
    return garden(today, addDays(today, -1), (w) => hybridFor(today, w, row)).hybrid;
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
  /** まえ, the scroller's bottom: camZ 150 (world.ts CAMS), lower on a short screen so the sea in front of the beach (its
   *  fishing and diving) stays in view: the screen's foot at least at z −70. */
  let camMin = $state<number>(CAM_MIN);
  const trackH = $derived(vh + (CAM_MAX - camMin) * s);

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

  // ---- the camera: the scroller's scrollTop → camZ, read on each frame; settled → world.rest.z ----
  let settle: ReturnType<typeof setTimeout> | undefined;
  /** The camera is held where something asked (a popup's room), or pinned by the e2e hook (no snapping back). */
  let held = false, pinned = false;
  function measure() {
    if (!scroller) return;
    const r = scroller.getBoundingClientRect();
    world.fit(scroller.clientWidth, scroller.clientHeight, r.left, r.top);
    // まえ on a short screen: down the beach until the sea shows at the foot
    const keepCam = world.view.camZ;
    world.view.camZ = CAMS.mae;
    const foot = world.worldAt(world.view.vw / 2, world.view.vh)?.z ?? -100;
    world.view.camZ = keepCam;
    camMin = Math.round(Math.min(CAMS.mae, CAMS.mae - (foot + 70)));
    vh = world.view.vh;
    s = world.view.s;
    horizonPx = world.view.horizon;
  }
  const anyMoving = () => inMotion('mine') || inMotion('partner') || inMotion('visitor');

  // ---- tap-to-walk (spec §4): a tap on the ground sends my villager there; a cream ring marks the spot ----
  let rings = $state<{ n: number; x: number; z: number }[]>([]);
  let ringN = 0;
  /** SceneTaps' last step: the tap landed on the ground at (x, z) and nothing else took it. A tap at a building's foot
   *  knocks at its door (walk there, then its character answers). */
  function walkThere(x: number, z: number, _hit: SceneHit): boolean {
    if (!live || covered || actors.mine.asleep) return false;
    const from = livePos('mine');
    const r = sendTo(x, z);
    if (!r) return false;
    relay?.send({ kind: 'walk', to: [Math.round(r.to[0]), Math.round(r.to[1])] });
    const n = ++ringN;
    rings = [...rings.slice(-1), { n, x: r.to[0], z: r.to[1] }];
    life.later(() => (rings = rings.filter((g) => g.n !== n)), RING_MS + 50);
    follow.start(from[1], r.to[1], world.screenAt(x, z).theta);
    const b = r.snap.kind === 'door' ? r.snap.building : undefined;
    const el = b && sceneEl?.querySelector<HTMLElement>(`[data-building="${b}"] .door`);
    if (b && el) life.later(() => knock(b, el), r.ms + 120);
    return true;
  }

  // ---- the partner off screen: a round face of their villager pinned at the top or the bottom edge; a tap scrolls there ----
  let edge = $state<'top' | 'bottom' | null>(null);
  function edgeCheck() {
    const [x, z] = livePos('partner'), p = world.screenAt(x, z, VILLAGER.h * 0.5);
    const e = p.sy < world.view.horizon + 10 || !p.visible ? (z > world.view.camZ ? 'top' : 'bottom') : p.sy > world.view.vh + 10 ? 'bottom' : null;
    if (e !== edge) edge = e;
  }

  // ---- camera follow (tapWalk.ts): while my villager runs somewhere the camera can't see, the scroller eases after it ----
  /** The top chrome's bottom edge (px): the follow band starts 80px under it. */
  let hudBottom = 0;
  const follow = new Follow({
    cam: () => world.view.camZ,
    range: () => [camMin, CAM_MAX],
    view: () => ({ P: world.P, pivot: world.view.pivot, vh: world.view.vh, s: world.view.s, hudBottom }),
    moveTo: (z) => scroller && (scroller.scrollTop = scrollFor(z, CAM_MAX, world.view.s)),
    snap: (on) => scroller && (!on || (!pinned && !held)) && (scroller.style.scrollSnapType = on ? '' : 'none'),
    kick: () => world.kick()
  });
  function onScroll() {
    world.kick();
    clearTimeout(settle);
    if (!follow.active) talk?.hold(true);
    settle = setTimeout(() => {
      world.rest.z = Math.round(world.view.camZ);
      talk?.hold(false);
    }, 160);
  }
  /** Ease the camera to a world z (a stop, or what was tapped far off). */
  export function goTo(z: number, smooth = true) {
    scroller?.scrollTo({ top: scrollFor(Math.min(CAM_MAX, Math.max(camMin, z)), CAM_MAX, s), behavior: smooth ? 'smooth' : 'instant' });
  }
  onMount(() => {
    if (!scroller) return;
    measure();
    world.onTick(() => {
      const chasing = live && follow.step(livePos('mine')[1], inMotion('mine'));
      if (scroller) world.view.camZ = live ? camAt(scroller.scrollTop, camMin, CAM_MAX, world.view.s) : camMin;
      if (live) edgeCheck();
      return anyMoving() || chasing;
    });
    hudBottom = document.querySelector('.ribbon-wrap')?.getBoundingClientRect().bottom ?? 0;
    // any touch takes the camera back from the chase
    const grab = () => follow.stop();
    scroller.addEventListener('touchstart', grab, { passive: true });
    scroller.addEventListener('wheel', grab, { passive: true });
    flushSync(); // the track's height for this screen, before scrolling to its foot
    scroller.scrollTop = scrollFor(camMin, CAM_MAX, world.view.s);
    world.view.camZ = camMin;
    world.rest.ready = true;
    if (live) {
      world.lookAt = (z) => {
        if (!scroller) return;
        held = true;
        scroller.style.scrollSnapType = 'none';
        goTo(z);
      };
      world.release = () => {
        if (!held || !scroller) return;
        held = false;
        if (!pinned) scroller.style.scrollSnapType = '';
      };
    }
    world.invalidate();
    const offMove = live ? onMove(() => world.kick()) : () => {};
    let first = true;
    const ro = new ResizeObserver(() => {
      // the first call is the observe itself (already measured)
      if (first) return void (first = false);
      const keep = world.view.camZ;
      measure();
      requestAnimationFrame(() => {
        if (scroller && live) scroller.scrollTop = scrollFor(keep, CAM_MAX, world.view.s);
        world.invalidate();
      });
    });
    ro.observe(scroller);
    if (live) (window as unknown as { __world?: unknown }).__world = {
      cam: () => world.view.camZ, idle: () => world.idle(), perf: world.perf,
      /** Put the camera at z at once (e2e; the stops' snapping is off from then on, so it stays exactly there). */
      go: (z: number) => {
        pinned = true;
        if (scroller) scroller.style.scrollSnapType = 'none';
        goTo(z, false);
      },
      at: (x: number, z: number) => world.clientAt(x, z), P: world.P,
      /** Put my villager at a world point (e2e: the depth order). */
      put: (x: number, z: number) => (place('mine', x, z), world.kick()),
      /** My villager's feet now (e2e: tap-to-walk), whether the camera is following it, the snapping now. */
      mine: () => livePos('mine'), following: () => follow.active, snapping: () => scroller?.style.scrollSnapType ?? ''
    };
    return () => {
      offMove();
      scroller?.removeEventListener('touchstart', grab);
      scroller?.removeEventListener('wheel', grab);
      follow.dispose();
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
  // A shaken tree: my villager walks up to its trunk and shakes it (avatar.ts), then what falls falls.
  function shakeTree(pid: PersonId) {
    const t = GOAL_TREES[slot(pid)];
    const { ms } = approach(t[0], t[1], { motion: 'shake' });
    if (ms) life.later(() => shakes?.shaken(pid, slot(pid)), ms);
    else shakes?.shaken(pid, slot(pid));
  }
  // Wilbur stands on the airport's dock while my partner has the app open (the relay's presence, NH's only cue for it:
  // docs/design.md "World"). The phone's one relay socket (sync/live.ts liveRelay, shared with the sync's push); never
  // a second. `?wilbur` (dev) shows him.
  let partnerHere = $state(false);
  /** The relay, when there is one (never in the demo): presence, and the partner's walks (spec §4, LIVE_V 2). */
  // svelte-ignore state_referenced_locally
  const relay = live && LIVE_URL && !week.demo ? liveRelay() : null;
  $effect(() => {
    if (!relay) return;
    const offStatus = relay.onStatus((st) => (partnerHere = wilburShows(st, !!week.demo)));
    // the partner's tap-to-walk: their villager runs there here too (a node id or a world point)
    const offWalk = relay.on((m) => {
      if (m.kind !== 'walk' || m.who !== view.partner || covered) return;
      const to = typeof m.to === 'string' ? nav().named[m.to] : m.to;
      if (to) partnerTo(to[0], to[1]);
    });
    return () => {
      offStatus();
      offWalk();
    };
  });
  const wilbur = $derived(live && (partnerHere || hookFlag('wilbur')));
  function wilburTap(el: HTMLElement) {
    if (covered) return;
    cue('tick');
    talk?.say(t('world.npc.wilbur'), t('world.wilbur', { name: view.people[view.partner].villagerName }), el, { colour: '#FFDF50' });
  }

  // A building's door (docs/design.md "World"): my villager walks to it, NH's character inside answers (the balloon's
  // tail at the door), and when the balloon closes the feature opens: Resident Services → せってい, the Cranny →
  // ごほうび, Able Sisters → the むらびと picker, the airport → つうしん; the campsite says who's visiting today.
  let lastDoor: string | undefined;
  function building(id: BuildingId, el: HTMLElement) {
    if (!live || covered) return;
    const door = doorAt(id);
    let { ms, walked } = approach(door[0], door[1] + 12, { spot: door, far: true });
    if (!walked) {
      // too far for an action walk: run there (tap-to-walk), the camera following
      const from = livePos('mine'), r = sendTo(door[0], door[1]);
      if (r) (ms = r.ms), follow.start(from[1], r.to[1], world.screenAt(door[0], door[1]).theta);
    }
    life.later(() => knock(id, el), ms + 120);
  }
  /** At the door: NH's character inside answers (the balloon's tail at the door), then the feature opens. */
  function knock(id: BuildingId, el: HTMLElement) {
    if (covered) return;
    const line = doorLine(id, jst(now()).hour, Math.random, lastDoor);
    if (!line) return;
    lastDoor = line.key;
    const guest = id === 'campsite' ? visitorNow(minuteNow()) : null;
    const text = guest ? t('world.door.campsite.guest', { name: t(`visitor.${guest}`) }) : t(line.key, { name: view.people[view.me].villagerName });
    cue('tick');
    talk?.say(t(line.name), text, el, { colour: line.colour, ondone: () => open(line.opens) });
  }
  function open(what: DoorOpens) {
    if (covered || !what) return;
    if (what === 'shop') void goto(resolve('/jar'));
    else if (what === 'zukan') ui.zukan = true;
    else ui.door = what;
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
  <Sky {tod}>
    {#if life.balloon}<Balloon ondone={() => (life.balloon = false)} />{/if}
  </Sky>
  {#if live && WeatherC}<WeatherC where="sky" />{/if}
  {#if live && FireworksC}<FireworksC bind:this={fireworks} enabled={() => !covered && !life.hidden} forced={life.devFireworks || wedding.fireworks} {allMet} {cheer} />{/if}

  <div class="scroller" bind:this={scroller} onscroll={onScroll} data-world-scroller>
    <div class="track" style:height="{trackH}px">
      <div class="snap" data-snap="oku" style:top="0"></div>
      <div class="snap" data-snap="hiroba" style:top="{scrollFor(CAMS.hiroba, CAM_MAX, s)}px"></div>
      <div class="snap end" data-snap="mae" style:bottom="0"></div>
      <div class="stage" style:height="{vh}px" style:--u="{s}px" style:--su="{s}px">
        <WorldGround {season} {foliage} />
        <WorldWater floating={ev.cherry ? 'petal' : ev.maple ? 'maple' : null} night={tod === 'night'} winter={season === 'winter'} />
        <div class="haze" aria-hidden="true"></div>

        <Scenery {season} {foliage} {month} {live} {tod} onbuilding={building} skip={['museum']} />
        <Museum {live} snow={season === 'winter'} say={(name, parts, from, o) => talk?.say(name, parts, from, o)} />

        {#each ['A', 'B'] as const as pid (pid)}
          {@const t = GOAL_TREES[slot(pid)]}
          <FruitTree person={view.people[pid]} x={t[0]} z={t[1]} {foliage} shakeN={life.shakeN[pid]}
            celebrate={life.celebrate[pid]} open={openTree === pid} ontoggle={(on) => (openTree = on ? pid : null)}
            onshake={() => shakeTree(pid)} />
        {/each}

        <FlowerBeds {season} {hybrid} people={[view.people[view.me], view.people[view.partner]]} />

        {#each ['mine', 'partner'] as const as id (id)}
          {@const sd = sides[id]}
          <div class="actor" class:walking={live && actors[id].walking} data-actor={id} data-stung={stung[id] || null} style:--bob-delay={id === 'partner' ? '-1.2s' : '0s'}
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

        {#if wilbur}
          <div class="wilbur" data-wilbur {@attach world.at({ x: WILBUR_AT[0], z: WILBUR_AT[1], h: 64 })}>
            <button type="button" class="npc" data-sfx="self" aria-label={t('world.npc.wilbur')} onclick={(e) => wilburTap(e.currentTarget)}>
              <OfficialArt key="villagers/wilbur" size={u(64)} />
            </button>
          </div>
        {/if}

        {#if live && edge && partnerHere}
          <button type="button" class="edge {edge}" data-partner-edge={edge} data-sfx="tick" aria-label={t('island.toPartner', { name: sides.partner.person.villagerName })}
            onclick={() => goTo(livePos('partner')[1])}>
            <Villager person={sides.partner.person.person} villager={sides.partner.person.villager} size={28} head />
          </button>
        {/if}

        {#each rings as r (r.n)}
          <!-- where a tap sent my villager: a cream ring on the ground, shrinking out (NH has none; the least feedback) -->
          <div class="ring-node" {@attach world.at({ mode: 'flat', x: r.x, z: r.z, h: 4, zi: 8 })}><i class="tap-ring"></i></div>
        {/each}

        <Particles {season} {foliage} {tod} quiet={asleepNow} mode="fireflies" raining={live && raining()} />
        {#if live}
          <!-- scenery taps (bushes, flowers, clouds, sun / moon, sea, sand, grass): a short flourish, nothing else -->
          <SceneTaps bind:this={sceneTaps} scene={sceneEl} {season} {tod} enabled={() => !covered && !life.hidden} swallowed={() => closedBy} walk={walkThere}
            exercise={view.people.A.rings.peach.met || view.people.B.rings.peach.met} cake={bday.length > 0}
            skyTap={(x, y) => !!fireworks?.tap(x, y)}
            say={(name, parts, from, o) => talk?.say(name, parts, from, o)} ontrick={trick} />
          <Talk bind:this={talk} scene={sceneEl} />
          <!-- what a shaken tree drops: a branch, now and then a wasp nest -->
          <TreeShakes bind:this={shakes} scene={sceneEl} onsting={sting} />
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
    position: absolute; inset: 0; z-index: var(--z-stage); overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch; scrollbar-width: none; scroll-snap-type: y proximity; touch-action: pan-y;
  }
  .scroller::-webkit-scrollbar { display: none; }
  .scene:not([data-live]) .scroller { overflow: hidden; }
  .track { position: relative; }
  .snap { position: absolute; left: 0; width: 1px; height: 1px; scroll-snap-align: start; pointer-events: none; }
  .snap.end { scroll-snap-align: end; }
  /* the stage stays on screen while the track scrolls under it; its width is 390 units (cqw) and --u one unit */
  .stage {
    position: sticky; top: 0; width: 100%; overflow: hidden; container-type: inline-size; contain: layout paint;
    --if-st: 0px; --if-hy: var(--horizon-y);
    /* the island's layers stand over every world thing (depths run to ~12M; camera.svelte.ts OVER is 50M) */
    --z-fall: 60000050; --z-leaf: 60000070; --z-tint: 60000080; --z-taps: 60000082; --z-coin: 60000090; --z-popup: 60000095;
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

  /* ONE time-of-day layer: a multiply tint over the land, the sea and the sprites below the horizon (the sky has its
     own table; fireflies and the stars stay above it). Day: none. */
  .tint {
    position: absolute; z-index: var(--z-tint); background: var(--tod-tint); mix-blend-mode: multiply; pointer-events: none;
    top: calc(var(--horizon-y) - 2px); bottom: 0; left: 0; right: 0;
  }
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
  .ring-node, .wilbur { width: 0; height: 0; transform-origin: 0 0; pointer-events: none; }
  /* the partner off screen: their villager's face at the edge (under the HUD at the top, over the foot at the bottom) */
  .edge {
    position: absolute; left: 50%; z-index: var(--z-taps); translate: -50% 0; width: 44px; height: 44px; padding: 6px; border: 0;
    border-radius: 50%; background: var(--plate); box-shadow: 0 3px 0 var(--plate-lip); display: grid; place-items: center; cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .edge.top { top: calc(var(--hud-bottom, 0px) + 8px); }
  .edge.bottom { bottom: calc(env(safe-area-inset-bottom, 0px) + 12px); }
  .npc {
    position: absolute; left: 0; bottom: 0; translate: -50% 2px; appearance: none; border: 0; padding: 0; background: none; line-height: 0;
    cursor: pointer; pointer-events: auto; -webkit-tap-highlight-color: transparent; animation: npc-breathe 2.8s ease-in-out infinite;
    transform-origin: 50% 100%;
  }
  .scene[data-covered] .npc { animation-play-state: paused; }
  @keyframes npc-breathe { 0%, 100% { scale: 1 1; } 50% { scale: 1.015 .985; } }
  .tap-ring {
    position: absolute; left: 0; top: 0; width: calc(34 * var(--u)); height: calc(34 * var(--u)); translate: -50% -50%; border-radius: 50%;
    border: calc(3 * var(--u)) solid #FFF7DE; box-shadow: 0 0 0 1px rgba(120, 90, 40, .18); animation: tap-ring 400ms ease-out both;
  }
  @keyframes tap-ring { from { transform: scale(1); opacity: .95; } to { transform: scale(.35); opacity: 0; } }
  .scene[data-covered] .fall :global(*) { animation-play-state: paused !important; }
</style>
