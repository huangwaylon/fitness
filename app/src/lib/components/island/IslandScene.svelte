<script module lang="ts">
  /** The guest's villager came ashore in this page load already (once per app open: docs/design.md "The guest"). */
  let arrivedThisLoad = false;
</script>

<script lang="ts">
  // The island (docs/design.md "World"): NH's rolling-log island in 2D DOM. A native vertical scroller is the camera
  // (its scrollTop → camZ, camera.svelte.ts; overscroll contained) over two sections (sections.ts): まえ (home: the
  // sea, the beach, the health lawn) and おく (the campsite's clearing, the pond, the bamboo, the falls). The ground is baked raster chunks bent onto the log by 40 bands (WorldGround), the live
  // water on top (WorldWater); every upright thing is a world node at its feet, placed by one projector in one depth
  // order (nearer in front, ties by x; a tree's canopy hangs over its trunk). The sky, the HUD, the weather and the
  // fireworks stay fixed outside the curved layer. Nothing runs when still: a scroll frame, a walk (the one rAF while
  // someone is on the way) or a change places what moved.
  //   <IslandScene {view} onhighfive onhighfivegot paused />
  // Layout contract (for the page): give it the whole page (--scene-h, e.g. 100dvh); --hud-bottom is the top chrome's
  // bottom edge. Read back --horizon-y (set on .if-scene) to place overlays in the sky.
  // Life (islandLife.svelte.ts): the motion bus (emit('highfive-sent') etc.), reactions to the `view` diff (partner
  // data, fruit stages, a received high-five), naps, the balloon; idle life runs while `live` and not `paused`.
  import { lazyComponent } from '#lib/ui-state/lazyComponent.svelte.ts';
  import { showAt } from './fireworks.ts';
  import { hook, hookFlag, hooksOn } from './devHooks.ts';
  import type { PersonId, WeekView, Who } from '#lib/types.ts';
  import { actorOf, castMe, guestPhone, setCast, whoOf, type VillagerActor } from '#lib/ui-state/cast.ts';
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
  import Says from './Says.svelte';
  import SayPicker from './SayPicker.svelte';
  import SayButton from './SayButton.svelte';
  import { rememberSay, sayGate } from './say.ts';
  import { HIGHFIVE_LIVE_MS, heardHighFive } from './highFives.ts';
  import TreeShakes from './TreeShakes.svelte';
  import PartnerNews from './PartnerNews.svelte';
  import { HATS, birthdaysOn, isBirthday } from './birthday.ts';
  import { FIREWORKS_FROM, archOn, weddingDay } from './wedding.ts';
  import { eventAt, forcedEvent } from './events.ts';
  import { TRICK_MS } from './visitors.ts';
  import { STUNG_SWEAT_MS, SWOLLEN_MS, goalTree, shakeTap, treeById, type ShakeTree } from './treeShake.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { IslandLife } from './islandLife.svelte.ts';
  import { VILLAGER, eventsAt, u, wildFlower, type Tod } from './scene.ts';
  import { todayPct } from './progress.ts';
  import { CAMPSITE, CAMS, CAM_MAX, CAM_MIN, CENTRE_STAGE, FLOWERS, GOAL_TREES, HOMES, PLAN, PULLUP_AT, SEAT_DROP, SHORE_Z, TREE_H, flowerById, seatAt, surfaceAt, type BuildingId } from './world.ts';
  import { GUEST_ARRIVAL, GUEST_SPOT, doorAt, outOfTent, partnerOnline } from './buildings.ts';
  import { provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { RING_MS, stepCue } from './tapWalk.ts';
  import { buildingAt, nav } from './nav.ts';
  import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import { sendDecor, sendIslandDay } from '#lib/store/actions.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { decor } from '#lib/store/decor.svelte.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import Decor from './Decor.svelte';
  import Board from '../board/Board.svelte';
  import { World, dropLive, provideWorld } from './camera.svelte.ts';
  import { camAt, horizonAhead, scrollFor, solveCam } from './roll.ts';
  import { hybridFor, hybridsOf } from './care.ts';
  import { garden } from './sceneDay.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { actors, addFx, applyStep, busy, inMotion, react, livePos, onMove, onStep, place, setEmote, setHome, setMotion, wake } from '../motion/director.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { walkGeo } from './walkGraph.ts';
  import { arrive, attachAvatar, homeAgain, homeRoute, partnerRestsAt, partnerTo, presence, freeze, sendTo, setInside, setPartnerRest, snapHome, stayingAt, stepOut, steered, thaw, turnTo, SNAP_HOME_MS } from './avatar.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { JOIN_SAY_MS, RUN_RING_U_S, homeAfter, linkVillagers, playPartner, playWake, setHomeAfter } from './villagerSync.ts';
  import { canonical, hash, type DayEvent } from '#lib/sync/world-day.ts';
  import type { SceneHit } from './sceneTaps.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { flushSync, onMount, untrack } from 'svelte';
  import type { ActorId } from '../motion/reactions.ts';
  import { dayKey, jst, minuteNow, now } from '#lib/time/clock.ts';
  import { islandRender } from '#lib/store/islandRender.svelte.ts';
  import { piecesOn, swapsOn } from './fixedDecor.ts';
  import { islandSeed } from './devHooks.ts';
  import { ARCH, SCENERY } from './world.ts';
  import { echo3d } from './echo3d.ts';

  interface Props {
    view: WeekView;
    /** A high-five with another's villager (a tap on them; sent over the relay here): the banner (`who`: whose). */
    onhighfive?: (who: Who) => void;
    /** Another's high-five reached this phone (once each, live or held while it was closed): the banner. */
    onhighfivegot?: (who: Who) => void;
    /** The guest's villager arrived on a member's phone (its app opened): a banner. */
    onguest?: (name: string) => void;
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
    view, onhighfive, onhighfivegot, onguest, paused = false, live = true,
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
  // The guest (docs/design.md "The guest"): its villager is the third on a member's phone (shown only while its app is
  // open), this phone's own on the guest's (A and B then the partner and the third: ui-state/cast.ts). It has no home
  // or tree: its spot is by the campsite.
  // svelte-ignore state_referenced_locally
  if (live) setCast(view.viewer);
  const sideOf = (pid: Who): 'left' | 'right' => (pid === 'A' ? 'left' : 'right');
  /** Who each villager actor draws: its person, name and look, today's ベル (null: the guest's, which has none). */
  type Look = { person: Who; villagerName: string; villager: string | null; bells: number | null };
  const lookOf = (w: Who): Look => (w === 'G' ? { person: 'G', villagerName: view.guest.villagerName, villager: view.guest.villager, bells: null }
    : { person: w, villagerName: view.people[w].villagerName, villager: view.people[w].villager, bells: view.people[w].today.bells });
  const homeOf = (w: Who): readonly [number, number] => (w === 'G' ? GUEST_SPOT : HOMES[w]);
  const VILLAGERS = ['mine', 'partner', 'third'] as const;
  const sides = $derived.by(() => {
    const viewer = view.viewer, whos: Record<VillagerActor, Who> = viewer === 'G' ? { mine: 'G', partner: 'A', third: 'B' } : { mine: view.me, partner: view.partner, third: 'G' };
    return Object.fromEntries(VILLAGERS.map((id) => [id, { person: lookOf(whos[id]), home: homeOf(whos[id]), side: sideOf(whos[id]) }])) as Record<VillagerActor, { person: Look; home: readonly [number, number]; side: 'left' | 'right' }>;
  });
  /** Who else has the island open (the relay's presence): the guest's villager shows on a member's island only then. */
  let hereNow = $state<readonly Who[]>([]);
  /** Whose villager is in the tent (one place at a time: nowhere on the island then). */
  const inTent = (id: VillagerActor): boolean => id !== 'mine' && where.inTent[whoOf(id)];
  /** Whether an actor's villager is on this island now: mine and the members' always; the guest's while it's here. */
  const onIsland = (id: VillagerActor): boolean => id === 'mine' || whoOf(id) !== 'G' || hereNow.includes('G');

  const covered = $derived(paused || ui.overlay);
  // The island in 3D (world3d/Island3D.svelte: its own chunk with three.js), when this phone draws it so (?island=3d,
  // せってい's switch: store/islandRender.svelte.ts); the DOM island runs over its canvas as the taps and the overlays.
  let failed3 = $state(false);
  const r3 = $derived(live && islandRender.mode === '3d' && !failed3);
  const island3dC = lazyComponent(() => import('../world3d/Island3D.svelte'));
  const Island3DC = $derived(island3dC.get(r3));
  let island3d = $state<{ go(z: number, k?: number): void; limits(): { min: number; max: number } }>();
  /** Where the 3D camera opens (back from the tent: where it was). */
  let start3 = $state<number | null>(null);

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
  // A tap on mine squishes (R9; now and then a flea hops off it). The say button at the bottom right (SayButton) opens
  // the phrase picker above it (SayPicker): a pick hops my villager and shows the phrase in its balloon (Says) for a
  // few seconds, here and on the partner's phone (the relay's `say`, presence only: at most one per 1.5 s, the newer
  // waiting). The speech balloon (Talk) is for the island's other speakers: the campsite's door, the visitors.
  let talk = $state<ReturnType<typeof Talk>>();
  let says = $state<ReturnType<typeof Says>>();
  /** The say button while its picker is open. */
  let picking = $state<HTMLElement | null>(null);
  let sayBtn = $state<HTMLButtonElement>();
  /** The say button shows on the live island with nothing over it: no sheet, the harvest, a tree's popup, もようがえ. */
  const sayShown = $derived(live && !covered && !ui.decorating && !openTree && !ui.sheets.length);
  const vilEls = $state<Record<VillagerActor, HTMLElement | undefined>>({ mine: undefined, partner: undefined, third: undefined });
  /** The name tag's colour: the person's (tokens.css --person-a / --person-b; the guest's lilac). */
  const SAY_TAG: Record<Who, string> = { A: '#2F86BD', B: '#D2701F', G: '#8E6CC8' };
  function openPicker(el: HTMLElement) {
    if (!sayShown) return;
    picking = el;
    // my villager stays where it is while I choose (idle life leaves it be)
    actors.mine.busyUntil = Math.max(actors.mine.busyUntil, Date.now() + 60_000);
  }
  /** `by`: the pointerdown that closed it (on the scenery that tap only closes: SceneTaps). */
  function closePicker(by?: Event) {
    if (!picking) return;
    picking = null;
    if (by) closedBy = by;
    actors.mine.busyUntil = Math.min(actors.mine.busyUntil, Date.now() + 1200);
  }
  $effect(() => {
    // a sheet over the island, a tree's popup or decorating: the picker goes with its button
    if (picking && !sayShown) untrack(() => closePicker());
  });
  /** Show `text` over a villager (mine: picked here; the partner's: from the relay) and hop it. */
  function showSay(id: VillagerActor, text: string) {
    const el = vilEls[id], sd = sides[id];
    // (a villager in the tent, or the guest's away, isn't on this screen: nothing to say it over)
    if (!el || covered || inTent(id) || !onIsland(id)) return;
    says?.say(id, text, el, { name: sd.person.villagerName, colour: SAY_TAG[sd.person.person] });
    if (!actors[id].asleep && !actors[id].walking) applyStep(id, { actor: id, motion: 'hop' });
  }
  function pickSay(text: string, own: boolean) {
    closePicker();
    if (own) rememberSay(text);
    showSay('mine', text);
    sayOut.say(text);
  }
  const sayOut = sayGate((text) => void (relay ?? demoRelay)?.send({ kind: 'say', text }));
  $effect(() => () => sayOut.stop());
  /** The scenery taps (a tap on my villager may send a flea hopping off it). */
  let sceneTaps = $state<ReturnType<typeof SceneTaps>>();
  // A tap on the partner is a high-five (NH's reaction, no card), in place (only a tap on empty ground walks): both
  // woken if asleep, the partner stops where it is, a sparkle flies from mine to them, and it's sent: the two turn to
  // each other and hop with the sparkles (R4), hearts on them as it lands. It goes over the relay (`highfive`, at the
  // tap's relay time): the partner's phone plays the same moment from the same start (their villager, theirs to move,
  // stops there and is told again), or, closed, hears it when it opens (the room holds the last one). One at a time: a
  // tap while one is under way does nothing more, and the partner's own landing meanwhile plays no second one.
  // With three (the guest: docs/design.md "The guest") a tap on any other villager high-fives its person (`to`), one at
  // a time per pair.
  const fiving = new Set<VillagerActor>();
  const FIVE_MS = 2400;
  /** The two hop face to face with sparkles: R4 for the partner (both actors), by hand for the third. */
  function fiveHop(id: VillagerActor) {
    if (id === 'partner') return void react('R4');
    const [mx] = livePos('mine'), [tx] = livePos(id);
    for (const a of ['mine', id] as const) {
      actors[a].face = (a === 'mine' ? tx : mx) < livePos(a)[0] ? 'l' : 'r';
      setMotion(a, 'hop');
      setEmote(a, 'mark-sparkle');
      addFx(a, 'sparkles');
    }
    cue('emote-joy');
  }
  function highFiveTap(id: VillagerActor = 'partner') {
    if (!live || covered || fiving.has(id) || inTent(id) || !onIsland(id)) return;
    fiving.add(id);
    cue('villager-tap');
    for (const a of ['mine', id] as const) if (actors[a].asleep) wake(a);
    const [px, pz] = livePos(id);
    if (actors[id].walking) place(id, px, pz);
    turnTo(px);
    actors[id].busyUntil = Math.max(actors[id].busyUntil, Date.now() + FIVE_MS);
    zapStart('mine', 0, id);
    life.later(() => addFx(id, 'hearts'), ZAP_MS);
    const to = whoOf(id);
    (relay ?? demoRelay)?.send({ kind: 'highfive', at: Math.round(relayNow()), to });
    onhighfive?.(to);
    if (id !== 'partner') fiveHop(id); // (the partner's: the page's R4)
    life.later(() => fiving.delete(id), FIVE_MS);
  }
  /** The partner's high-five (the relay's): heard once (a resend or the room's held copy is no news), the banner; just
   *  tapped, the same moment as on their phone, from where it is by now: mine stops (and says so) and turns to them,
   *  their sparkle flies to mine, both hop, hearts on mine. Older (held while this phone was closed), or covered: the
   *  banner and my villager's hearts (R5) once the island shows. */
  function partnerHighFive(at: number, from: Who = whoOf('partner')) {
    if (!heardHighFive(castMe(), at, undefined, from)) return;
    onhighfivegot?.(from);
    const id = actorOf(from);
    if (id === 'mine') return;
    const ago = Math.max(0, relayNow() - at);
    if (fiving.has(id)) return; // one at a time: both tapped at once, mine is the one playing
    if (ago > HIGHFIVE_LIVE_MS || covered || life.hidden || !onIsland(id)) return void life.later(() => react('R5'), 700);
    fiving.add(id);
    for (const a of ['mine', id] as const) if (actors[a].asleep) wake(a, { remote: true });
    const [mx, mz] = livePos('mine');
    if (actors.mine.walking) place('mine', mx, mz);
    turnTo(livePos(id)[0]);
    actors.mine.busyUntil = Math.max(actors.mine.busyUntil, Date.now() + FIVE_MS);
    zapStart(id, ago, 'mine');
    fiveHop(id);
    life.later(() => addFx('mine', 'hearts'), Math.max(0, ZAP_MS - ago));
    life.later(() => fiving.delete(id), Math.max(400, FIVE_MS - ago));
  }
  /** The high-five's sparkle, flying from one villager's hands to the other's in an arc (ZAP_MS); `ago`: started that
   *  long ago (the partner's tap, heard a moment later). */
  let zap = $state<{ n: number; t0: number; from: VillagerActor; to: VillagerActor } | null>(null);
  const ZAP_MS = 520;
  function zapStart(from: VillagerActor, ago = 0, to: VillagerActor = from === 'mine' ? 'partner' : 'mine') {
    const left = ZAP_MS - ago;
    if (left <= 60) return;
    const t0 = performance.now() - ago, n = (zap?.n ?? 0) + 1, stop = world.moveStart();
    zap = { n, t0, from, to };
    life.later(() => {
      stop();
      if (zap?.n === n) zap = null;
    }, left + 60);
  }
  function zapAt(): readonly [number, number, number] {
    const k = Math.min(1, (performance.now() - (zap?.t0 ?? 0)) / ZAP_MS);
    const [ax, az] = livePos(zap?.from ?? 'mine'), [bx, bz] = livePos(zap?.to ?? 'partner');
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
  const hatOf = (id: VillagerActor, person: Look): string | null =>
    (bday.length && id !== 'third') || isBirthday(villagerBdays?.[resolveLook({ villager: person.villager, person: person.person }).id], today) ? HATS[id === 'third' ? 'partner' : id] : null;
  const hybrid = $derived.by(() => {
    if (!live) return null;
    const kindOf = (id: string) => wildFlower(flowerById(id) ?? FLOWERS[0], season);
    if (hookFlag('hybrid')) return { id: FLOWERS[0].id, flower: hybridsOf(kindOf(FLOWERS[0].id))[0] };
    const mine = garden(today, addDays(today, -1), (w) => hybridFor(today, w.filter(flowerById), kindOf)).hybrid;
    // both people's waterings yesterday (the shared day's), so both phones grow the same one
    const both = shared.wateredYesterday().filter(flowerById);
    return both.length ? hybridFor(today, both, kindOf) : mine;
  });
  // Shaking a tree (TreeShakes): its wasps sting the villager on their side: a fright (a 「！」), then a sweat drop, and
  // NH's swollen eye for a while.
  let shakes = $state<ReturnType<typeof TreeShakes>>();
  let stung = $state<Record<VillagerActor, boolean>>({ mine: false, partner: false, third: false });
  const unsting: Partial<Record<VillagerActor, ReturnType<typeof setTimeout>>> = {};
  let swollen = $state<Record<VillagerActor, boolean>>({ mine: false, partner: false, third: false });
  const unswell: Partial<Record<VillagerActor, ReturnType<typeof setTimeout>>> = {};
  function sting(side: VillagerActor) {
    setMotion(side, 'surprise');
    setEmote(side, 'mark-bang');
    stung[side] = swollen[side] = true;
    clearTimeout(unswell[side]);
    unswell[side] = setTimeout(() => (swollen[side] = false), SWOLLEN_MS);
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
  const trackH = $derived(r3 ? vh : vh + (camMax - camMin) * s);

  // Where each villager lives (the director walks them from there and back; design.md "Walking").
  // svelte-ignore state_referenced_locally
  if (live) for (const id of VILLAGERS) setHome(id, sides[id].home[0], sides[id].home[1]);
  // where a tap sent my villager this session (it stays there; the next open finds it home)
  let fromTentNow = false;
  // svelte-ignore state_referenced_locally
  if (live) {
    // just out of the tent: at its door, facing out; else where a tap sent it this session
    const stay = stayingAt();
    if ((fromTentNow = ui.takeFromTent())) stepOut(outOfTent(view.viewer));
    else if (stay && !actors.mine.walking) place('mine', stay[0], stay[1]);
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
  const feet = (id: VillagerActor) => livePos(id);

  // Sitting (docs/design.md "Decor: sitting"): a villager standing still on a seat (world.ts SEATS: the benches', the
  // campfire's stools) is drawn seated, sunk behind the seat; one at the pull-up bar on its person's exercise day does a
  // few pull-ups. From where it stands only, so both phones draw the same. Both on one bench: a heart each.
  const seated = $derived(Object.fromEntries(VILLAGERS.map((id) => [id, actors[id].walking || actors[id].asleep ? null : seatAt(Math.round(actors[id].x), Math.round(actors[id].y))])) as Record<VillagerActor, string | null>);
  const repping = $derived(Object.fromEntries(VILLAGERS.map((id) => {
    const a = actors[id], pid = whoOf(id);
    return [id, pid !== 'G' && !a.walking && !a.asleep && Math.abs(a.x - PULLUP_AT[0]) <= 3 && Math.abs(a.y - PULLUP_AT[1]) <= 3 && todayPct(view.people[pid].rings.peach) >= 100];
  })) as Record<VillagerActor, boolean>);
  const benchOf = (seat: string | null) => (seat?.startsWith('seat') ? seat.slice(0, -1) : null);
  let sharedBench: string | null = null;
  $effect(() => {
    const b = benchOf(seated.mine);
    const both = b && b === benchOf(seated.partner) ? b : null;
    if (both && both !== sharedBench) untrack(() => (setEmote('mine', 'mark-heart'), setEmote('partner', 'mark-heart')));
    sharedBench = both;
  });
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
    if (world.three) {
      // the 3D camera has its own ends (world3d/engine.ts)
      const l = island3d?.limits();
      if (l) [camMin, camMax] = [l.min, l.max];
      vh = world.view.vh;
      s = world.view.s;
      horizonPx = world.view.horizon;
      return;
    }
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
  const anyMoving = () => inMotion('mine') || inMotion('partner') || inMotion('third') || inMotion('visitor');

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
    if (!live || covered || decorating || actors.mine.asleep) return false;
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
    says?.hold(true);
    settle = setTimeout(() => {
      world.rest.z = Math.round(world.view.camZ);
      talk?.hold(false);
      says?.hold(false);
    }, 140);
  }
  /** Put the camera at a world z at once (the e2e hook). */
  function goTo(z: number) {
    if (world.three) return island3d?.go(z);
    // (the 3D island not up yet: it opens there)
    if (r3) return void (start3 = z);
    scroller?.scrollTo({ top: scrollFor(Math.min(camMax, Math.max(camMin, z)), camMax, s), behavior: 'instant' });
  }
  onMount(() => {
    if (!scroller) return;
    measure();
    world.onTick(() => {
      // (the 3D island's camera is its engine's: Island3D writes camZ in each of its frames)
      if (scroller && !world.three) world.view.camZ = live ? camAt(scroller.scrollTop, camMin, camMax, world.view.s) : camMin;
      if (live) edgeCheck();
      return anyMoving();
    });
    flushSync(); // the track's height for this screen, before scrolling to its foot
    // back out of the tent: the camera where it was when we went in (else the scroller's foot, まえ)
    const back = live ? ui.takeIslandZ() : null;
    start3 = back;
    const z0 = back === null ? camMin : Math.min(camMax, Math.max(camMin, back));
    scroller.scrollTop = scrollFor(z0, camMax, world.view.s);
    world.view.camZ = z0;
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
        if (scroller && live && !world.three) scroller.scrollTop = scrollFor(Math.min(camMax, Math.max(camMin, keep)), camMax, world.view.s);
        world.invalidate();
      });
    });
    ro.observe(scroller);
    if (live) expose();
    return () => {
      offMove();
      ro.disconnect();
      clearTimeout(settle);
      world.stop();
      dropLive(world);
    };
  });
  /** The e2e's hooks on the island (window.__world). */
  function expose() {
    (window as unknown as { __world?: unknown }).__world = {
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
      /** Anyone's villager's feet now (A, B or G), null when it isn't on this island (e2e: the guest). */
      who: (w: Who) => (onIsland(actorOf(w)) && !inTent(actorOf(w)) ? livePos(actorOf(w)) : null),
      /** The scroller's two ends for this screen (まえ, おく). */
      stops: () => (world.three && island3d ? [island3d.limits().min, island3d.limits().max] : [camMin, camMax]),
      /** The island as both phones must have it (e2e: the two-phone checks): the shared day's canonical hash, and each
       *  person's villager (where it stands, rounded, and whether it dozes). */
      state: () => ({
        day: hash(canonical(shared.day)),
        decor: hash(decorCanon()),
        villagers: Object.fromEntries(VILLAGERS.filter((id) => onIsland(id)).map((id) => {
          const [x, z] = livePos(id);
          return [whoOf(id), { x: Math.round(x), z: Math.round(z), asleep: actors[id].asleep, walking: actors[id].walking }];
        }))
      }),
      ...(hooksOn() ? {
        /** A change of mine straight into the shared world (e2e: the two-phone harness), and when each of the
         *  partner's arrived here (Date.now(), by kind and id), and the socket's counters. */
        share: (i: Parameters<typeof shared.share>[0]) => shared.share(i).fresh,
        heard: () => heardAt,
        /** The shared day's canonical form (what `state().day` hashes). */
        canon: () => canonical(shared.day),
        /** A decoration set (placed or moved) or removed straight into the layout, and the layout's canonical form. */
        decorSet: (p: Parameters<typeof decor.set>[0]) => decor.set(p),
        decorRemove: (id: string) => decor.remove(id),
        decorCanon: () => decorCanon(),
        metrics: () => (relay ?? demoRelay)?.metrics?.() ?? null,
        status: () => (relay ?? demoRelay)?.status() ?? null
      } : {})
    };
  }

  onMount(() => {
    if (!live) return;
    const off = attachAvatar({ geo: () => (presence.visitor ? geoVisited() : geo), clear: standsClear, where: feet, enabled: () => !covered && !life.hidden, hush: () => talk?.hush() });
    // the guest's villager comes ashore once each time its app opens, and walks up to its spot by the campsite (the
    // members see it arrive); back from the tent or another screen it is where it was
    if (guestPhone() && !arrivedThisLoad && !actors.mine.walking) {
      arrivedThisLoad = true;
      if (!fromTentNow) arrive(GUEST_ARRIVAL, GUEST_SPOT);
    }
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
    echo3d(tr.id, 1.4);
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
  // `?relay=<wss url>&key=<person key>` (the hooks on: the e2e's two-phone harness against the test relay, each its own
  // browser context): the demo talks to a real relay instead
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  // svelte-ignore state_referenced_locally
  const demoRelay = live && week.demo ? (testRelay() ?? createLocalLive(view.viewer)) : null;
  $effect(() => {
    if (!live) return;
    const me = view.viewer;
    untrack(() => {
      shared.attach(relay ?? demoRelay, me, !!week.demo);
      decor.attach(relay ?? demoRelay, me, !!week.demo);
      islandLayout.attach(relay ?? demoRelay, me, !!week.demo);
      // the e2e's view of the layout this phone holds (the editor's changes arriving live)
      if (hooksOn()) (window as unknown as { __layout?: unknown }).__layout = { pos: (id: string) => islandLayout.pos(id), home: (w: 'A' | 'B' | 'G') => islandLayout.home(w) };
      demoRelay?.start();
    });
  });
  $effect(() => () => demoRelay?.stop());
  // the sheet keeps each person's part of the day (held: one row per person and day), and gives the partner's back
  $effect(() => {
    if (!live) return;
    shared.sink = (date, row) => sendIslandDay(date, row);
    decor.sink = (op) => sendDecor(op);
    islandLayout.sink = (op) => sendDecor(op);
    return () => {
      shared.sink = null;
      decor.sink = null;
      islandLayout.sink = null;
    };
  });
  // (only for a new State or a new day: the minute tick replaces the model but keeps its State, and these rows with it)
  let fed = '';
  let fedState: unknown = null;
  $effect(() => {
    const m = week.model;
    if (!live || !m) return;
    const day = dayKey(now());
    if (m.state === fedState && day === fed) return;
    fedState = m.state;
    fed = day;
    untrack(() => {
      shared.rows(m.state.islandDays.map((r) => ({ at: r.at, person: r.person, data: r.data })));
      decor.rows(m.state.decor);
      islandLayout.rows(m.state.layout);
    });
  });
  $effect(() => {
    if (!relay) return;
    // (the edge face is the partner's: on the guest's phone, A's while A is here)
    return relay.onStatus((st) => (partnerHere = partnerOnline(st, !!week.demo) && st.here.includes(whoOf('partner'))));
  });
  /** A node id or a world point (a walk's target). */
  const pointOf = (to: string | readonly [number, number]) => (typeof to === 'string' ? nav().named[to] : to);
  // The villagers on both phones (villagerSync.ts): every move of mine goes over the relay as the very walk; the
  // partner's plays here from the same start at the same time, and while they have the island open their villager is
  // theirs to move (this phone's own life leaves it alone).
  // (on the relay's own clock: a `?date=` preview shifts the island's day, not when a walk set off)
  const relayNow = () => (relay ?? demoRelay)?.serverNow() ?? Date.now();
  // svelte-ignore state_referenced_locally
  const link = live ? linkVillagers({
    share: (w) => void shared.share(w), me: castMe, serverNow: relayNow, enabled: () => live,
    // a phone gone a while: its villager walks home from where its last walk (the relay's day) ended, by the nav
    lastAt: (id) => {
      const w0 = shared.day.walks[whoOf(id)];
      return w0 ? (pointOf(w0.to) ?? null) : null;
    },
    route: homeRoute,
    atHome: homeAgain
  }) : null;
  // (`?homeafter=<ms>`: how long a phone is gone before its villager walks home, and one gone quiet inside the tent
  // leaves it; the e2e's)
  if (hook('homeafter')) setHomeAfter(Number(hook('homeafter')));
  where.goneMs = homeAfter();
  $effect(() => {
    const r = relay ?? demoRelay;
    if (!link || !r) return;
    let up = false, soon: ReturnType<typeof setTimeout> | undefined;
    let was: readonly Who[] = [];
    const off = r.onStatus((st) => {
      const here = st.connected ? st.here : [];
      // each other person here: their villager is the relay's to move (the guest's shows only then); gone, it isn't
      // (a member's walks home a while after the relay saw them leave: villagerSync)
      for (const w of ['A', 'B', 'G'] as const) {
        if (w === castMe()) continue;
        const left = st.connected ? st.gone?.[w] : undefined;
        link.here(actorOf(w), here.includes(w), left);
        where.presence(w, here.includes(w), left === undefined ? (st.connected ? homeAfter() : null) : left + homeAfter() - relayNow());
      }
      // the guest arriving on a member's phone: a banner, once per arrival
      if (here.includes('G') && !was.includes('G') && !guestPhone()) onguest?.(view.guest.villagerName);
      // I'm on the island (not in the tent): said to whoever arrives, whatever they last heard of me
      if (here.some((w) => !was.includes(w))) r.send({ kind: 'tent', in: false });
      was = here;
      hereNow = here;
      // (re)connected: once the day's replay is in, my villager as it is here (the room may hold an older walk of it,
      // from a session that ended elsewhere; gone a while, where its walk home has it by now)
      if (st.connected && !up) {
        const myLeft = st.gone?.[castMe()];
        soon = setTimeout(() => link.joined(myLeft), JOIN_SAY_MS);
      }
      if (!st.connected && up) link.down();
      up = st.connected;
    });
    return () => (off(), clearTimeout(soon));
  });
  $effect(() => () => link?.detach());
  // one place at a time: another's villager in the tent is nowhere here; gone quiet inside, it's home again
  $effect(() => {
    for (const id of ['partner', 'third'] as const) {
      const on = inTent(id);
      untrack(() => setInside(id, on));
    }
  });
  const homeSeen = { ...where.homeN };
  $effect(() => {
    for (const w of ['A', 'B', 'G'] as const) {
      const n = where.homeN[w];
      if (n === homeSeen[w] || !live || w === castMe()) continue;
      homeSeen[w] = n;
      const id = actorOf(w);
      // (a member's villager walks home out of the door by villagerSync's rule; without the relay's leave time, put)
      untrack(() => !link?.homeBound(id) && place(id, sides[id].home[0], sides[id].home[1], true));
    }
  });
  // the partner's phrases, live (never replayed: a phone opening later hears none)
  $effect(() => {
    const r = relay ?? demoRelay;
    if (!live || !r) return;
    return r.on((m) => {
      if (m.who === castMe()) return;
      if (m.kind === 'say') untrack(() => showSay(actorOf(m.who), m.text));
      // (a high-five for me: the room sends each to whom it's for; an older one names nobody, the partner's)
      else if (m.kind === 'highfive') untrack(() => (m.to === undefined || m.to === castMe()) && partnerHighFive(m.at, m.who));
      // where their villager is: in the tent it's nowhere on the island (and its life here leaves it alone)
      else if (m.kind === 'tent') where.heard(m);
    });
  });
  /** When each of the partner's changes arrived here (e2e, the hooks on). */
  const heardAt: Record<string, number> = {};
  /** The decorations as both phones must have them (e2e: the two-phone harness): each item's id, kind, spot and facing. */
  const decorCanon = () => JSON.stringify([...decor.items].sort((p, q) => (p.id < q.id ? -1 : 1)).map((p) => [p.id, p.item, p.x, p.z, p.f]));
  /** The partner's walk, played here: the very walk when it came with it (rested at its end when it's over), else (an
   *  older app: only where to) planned here from where their villager stands. */
  function partnerWalk(w: Extract<DayEvent, { kind: 'walk' }>, now: boolean, id: VillagerActor = 'partner') {
    const to = pointOf(w.to);
    if (!to || id === 'mine') return;
    // their phone gone a while: the walk home is the villager's (from this walk's end, should it be newer news)
    if (link?.homeBound(id)) return link.replan(id);
    setPartnerRest(to[0], to[1], id);
    steered[id] = Date.now();
    const how = playPartner(w, relayNow(), !covered && !life.hidden && onIsland(id), id);
    if (how === 'walk' || how === 'jump') {
      // a run (a tap on their phone: NH's ring where it goes)
      if (now && onIsland(id) && w.ms && w.from && Math.hypot(to[0] - w.from[0], to[1] - w.from[1]) / (w.ms / 1000) >= RUN_RING_U_S) ring(to[0], to[1], true);
      return;
    }
    if (how) return;
    if (!now || covered) return partnerRestsAt(to[0], to[1], id);
    if (partnerTo(to[0], to[1], id)) ring(to[0], to[1], true);
  }
  onMount(() => {
    if (!live) return;
    // where the partner's villager is today (a phone opening later: the shared day's last walk, played to now)
    for (const w of ['A', 'B', 'G'] as const) {
      const w0 = w === castMe() ? null : shared.day.walks[w];
      if (w0) partnerWalk({ kind: 'walk', ...w0, who: w }, false, actorOf(w));
    }
    const offDecor = decor.on(({ e }) => {
      if (hooksOn()) heardAt[`decor:${e.id}`] = Date.now();
    });
    const offShared = shared.on(({ e, live: now }) => {
      if (hooksOn()) heardAt[`${e.kind}:${'id' in e ? e.id : 'tree' in e ? e.tree : ''}`] = Date.now();
      if (e.kind === 'walk' && e.who !== castMe()) partnerWalk(e, now, actorOf(e.who));
      // a villager woke on their phone (theirs tapped, or both at a high-five): here too, until the same moment
      else if (e.kind === 'act' && e.act === 'wake' && now) playWake(e, view.me, relayNow());
    });
    return () => {
      offShared();
      offDecor();
    };
  });
  // The campsite's door (docs/design.md "Buildings", "The tent"): a tap goes into the tent, its own screen (the door's
  // iris closes on it: ui-state/doorTransition.ts); the camera is kept for the way back out. The one exception to "a
  // tap on something acts in place" (the user: "we have to walk up to it before we enter it"): my villager walks up to
  // the door first (the walk goes over the relay like any), unless it's there already; a tap on anything else on the
  // way (it steers my villager anew) is the end of going in.
  function building(id: BuildingId, _el: HTMLElement) {
    if (!live || covered || id !== 'campsite' || entering) return;
    const door = doorAt(id), at = livePos('mine');
    clearTimeout(walkingIn);
    if (Math.hypot(at[0] - door[0], at[1] - door[1]) <= TENT_NEAR_U) return goIn();
    const p = sendTo(door[0], door[1]);
    if (!p) return goIn();
    const token = (goingIn = {});
    const check = () => {
      // another tap since (anywhere but the tent): no going in
      if (goingIn !== token) return;
      const [x, z] = livePos('mine');
      if (actors.mine.walking || inMotion('mine')) return void (walkingIn = setTimeout(check, 80));
      if (Math.hypot(x - door[0], z - door[1]) <= TENT_NEAR_U) return goIn();
      // stopped short (something on the island held my villager a moment, a reaction): on up to the door
      const again = tries++ < 3 && sendTo(door[0], door[1]);
      if (again) walkingIn = setTimeout(check, Math.max(80, again.ms - 40));
    };
    let tries = 0;
    walkingIn = setTimeout(check, Math.max(0, p.ms - 40));
  }
  /** My villager this near the tent's door (u) goes straight in. */
  const TENT_NEAR_U = 36;
  let walkingIn: ReturnType<typeof setTimeout> | undefined;
  /** The walk up to the tent under way (null: none, or a tap elsewhere ended it). */
  let goingIn: object | null = null;
  $effect(() => {
    const el = sceneEl;
    if (!el) return;
    const tapped = (e: Event) => {
      if (goingIn && !(e.target instanceof Element && e.target.closest('[data-building="campsite"]'))) goingIn = null;
    };
    el.addEventListener('pointerdown', tapped, true);
    return () => (el.removeEventListener('pointerdown', tapped, true), clearTimeout(walkingIn));
  });
  function goIn() {
    if (entering) return;
    turnTo(doorAt('campsite')[0]);
    entering = true;
    ui.islandZ = world.view.camZ;
    cue('scene-bench');
    void goto(resolve('/tent') + location.search).finally(() => (entering = false));
  }
  let entering = false;
  // the tent's door for the iris (its button's middle on screen)
  onMount(() =>
    provideDoor(() => {
      const r = sceneEl?.querySelector<HTMLElement>('[data-building="campsite"] .door')?.getBoundingClientRect();
      return r && r.width ? { x: r.left + r.width / 2, y: r.top + r.height * 0.7 } : null;
    })
  );
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
  // The decorate mode (docs/design.md "Decorating"): its tray and ghost are their own chunk, loaded on the first use.
  const decorating = $derived(live && ui.decorating);
  const decorModeC = lazyComponent(() => import('./DecorMode.svelte'));
  const DecorModeC = $derived(decorModeC.get(decorating));
  let decorMode = $state<{ pick(id: string, e: PointerEvent): void; moving(): string | null }>();
  // what the 3D island draws today (Scenery's own: the scenery's seasonal swaps, the fixed decor's pieces)
  const scenery3 = $derived.by(() => {
    const sw = swapsOn(today);
    return SCENERY.map((x) => (sw[x.id] ? { ...x, key: sw[x.id].key, h: sw[x.id].h } : x));
  });
  const pieces3 = $derived(piecesOn(today, jst(clock).hour, islandSeed(), ARCH));
  const cast3 = () => VILLAGERS.map((id) => ({
    id, person: sides[id].person.person, villager: sides[id].person.villager, side: sides[id].side,
    shown: onIsland(id) && !inTent(id), seated: !!seated[id], rep: repping[id]
  }));
</script>

<div class="if-scene scene" bind:this={sceneEl} data-r3={r3 || undefined} data-decorating={decorating || undefined} data-season={season} data-tod={tod} data-sky={live ? weather.sky : undefined} data-paused={life.hidden || undefined}
  data-covered={covered || undefined} data-live={live || undefined} style:--horizon-y="{horizonPx}px" style:--sky-h="{horizonPx + 6}px">
  {#if picking && sceneEl}
    <!-- what my villager says: outside the scroller (its field's focus never scrolls the island), over the stage -->
    <SayPicker scene={sceneEl} anchor={picking} onpick={pickSay} onclose={(e) => {
      closePicker(e);
      if (!e) sayBtn?.focus({ preventScroll: true }); // ✕ or Esc: the focus back on its button
    }} />
  {/if}
  {#if sayShown}
    <!-- the picker's door: bottom right, over the sea, clear of the home indicator and しずえ's box (--news-lift) -->
    <div class="say-dock"><SayButton bind:el={sayBtn} open={!!picking} onopen={openPicker} /></div>
  {/if}
  {#if live && FireworksC}<FireworksC bind:this={fireworks} enabled={() => !covered && !life.hidden} forced={life.devFireworks || wedding.fireworks} {allMet} {cheer} />{/if}

  <div class="scroller" bind:this={scroller} onscroll={onScroll} data-world-scroller>
    <div class="track" style:height="{trackH}px">
      <div class="stage" style:height="{vh}px" style:--u="{s}px" style:--su="{s}px" style:--tod-filter={shade ? `url(#${fid})` : undefined}>
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
        {#if r3}
          {#if Island3DC && sceneEl}
            <Island3DC bind:this={island3d} {world} scene={sceneEl} {season} {foliage} {month} {tod} scenery={scenery3} pieces={pieces3} {hybrid} floating={ev.cherry ? 'petal' : ev.maple ? 'maple' : null}
              wet={weather.sky !== 'clear' ? WET[weather.sky][1] : 0} cast={cast3} enabled={() => !covered && !life.hidden}
              start={start3} onscroll={onScroll} onhorizon={(px) => (horizonPx = px)} onfail={() => (failed3 = true)} onready={() => measure()} />
          {/if}
        {:else}
          <WorldGround {season} {foliage} />
          <WorldWater floating={ev.cherry ? 'petal' : ev.maple ? 'maple' : null} night={tod === 'night'} winter={season === 'winter'} />
          <div class="haze" aria-hidden="true"></div>
        {/if}

        <Scenery {season} {foliage} {month} {live} {tod} date={today} hour={jst(clock).hour} onbuilding={building} {r3} />

        {#each ['A', 'B'] as const as pid (pid)}
          {@const t = GOAL_TREES[pid]}
          <FruitTree person={view.people[pid]} x={t[0]} z={t[1]} {foliage} shakeN={life.shakeN[pid]}
            celebrate={life.celebrate[pid]} open={openTree === pid} ontoggle={(on) => (openTree = on ? pid : null)}
            onshake={() => shakeTree(pid)} />
        {/each}

        <Flowers {season} {hybrid} />

        {#if live}
          <Decor editing={decorating} hidden={decorating ? (decorMode?.moving() ?? null) : null} onpick={(id, e) => decorMode?.pick(id, e)} />
          <!-- the bulletin board on the front beach (docs/board.md): a tap walks up to it and opens it -->
          <Board enabled={() => !covered && !life.hidden && !decorating} night={tod === 'night'} {season} />
          {#if decorating && DecorModeC && sceneEl}<DecorModeC bind:this={decorMode} scene={sceneEl} ondone={() => (ui.decorating = false)} />{/if}
        {/if}

        {#each VILLAGERS as id (id)}
          {@const sd = sides[id]}
          {#if live ? onIsland(id) : id !== 'third'}
          <div class="actor" class:walking={live && actors[id].walking} class:inside={inTent(id)} data-inside={inTent(id) || undefined} data-actor={id} data-who={sd.person.person} data-seat={seated[id]} data-rep={repping[id] || undefined} style:--seat-drop={u(SEAT_DROP)} style:--rep-lift={u(9)} data-person={sd.person.person} data-stung={stung[id] || null} style:--bob-delay={id === 'partner' ? '-1.2s' : id === 'third' ? '-0.6s' : '0s'}
            {@attach world.at(live ? { x: sd.home[0], z: sd.home[1], h: VILLAGER.h, live: () => livePos(id), always: true } : { x: sd.home[0], z: sd.home[1], h: VILLAGER.h })}>
            <button type="button" class="vil" disabled={!live} data-sfx="self" bind:this={vilEls[id]}
              aria-label={id !== 'mine'
                ? t('island.highfive', { name: sd.person.villagerName })
                : sd.person.bells === null ? sd.person.villagerName
                : t('island.me', { name: sd.person.villagerName, bells: formatBells(sd.person.bells) })}
              onclick={(e) => {
                if (id === 'mine') {
                  sceneTaps?.villagerTap(e.currentTarget);
                  life.tapMine();
                } else highFiveTap(id);
              }}>
              <Villager person={sd.person.person} villager={sd.person.villager} size={u(VILLAGER.h)} eager
                actor={live ? id : undefined} side={sd.side} emoteSize="var(--emote-size)" shadow animate={live} tricked={id === 'mine' && tricked} swollen={swollen[id]} hat={live ? hatOf(id, sd.person) : null} />
            </button>
          </div>
          {/if}
        {/each}

        {#if live && edge && partnerHere && !where.partnerInTent}
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
          <SceneTaps bind:this={sceneTaps} scene={sceneEl} {season} {tod} enabled={() => !covered && !life.hidden && !decorating} swallowed={() => closedBy} walk={walkThere}
            exercise={view.people.A.rings.peach.met || view.people.B.rings.peach.met} cake={bday.length > 0}
            skyTap={(x, y) => !!fireworks?.tap(x, y)}
            say={(name, parts, from, o) => talk?.say(name, parts, from, o)} ontrick={trick} tree={treeTap} />
          <Talk bind:this={talk} scene={sceneEl} />
          <Says bind:this={says} scene={sceneEl} />
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
  /* the say button: bottom right over the sea (both islands: outside the scroller), 12px in from the side and above
     the home indicator; with しずえ's box up it sits over the box (the page's --news-lift) */
  .say-dock {
    position: absolute; z-index: 2; right: calc(var(--safe-right, 0px) + 8px);
    bottom: calc(var(--pad-bottom, 8px) + 8px + var(--news-lift, 0px));
  }
  /* the 3D island: the finger is world3d/gestures.ts' (no native scroll, no page zoom); the canvas draws what the DOM's
     art did: the ground, the water, the trees, the scenery, the flowers and the villagers' figures (their nodes stay
     as the tap areas, their marks, balloons and popups over the canvas) */
  .scene[data-r3] { touch-action: none; }
  .scene[data-r3] .scroller { overflow: hidden; touch-action: none; }
  .scene[data-r3] .tint { display: none; }
  .scene[data-r3] :global(:is(.spr > .art, .spr .door > *, .fl > .b, .tree > .oak)) { opacity: 0; }
  .scene[data-r3] :global(.m3on :is([data-m3art], .official)) { opacity: 0; }
  .scene[data-r3] :global(.mover.m3on > *) { opacity: 0; }
  .scene[data-r3] :global(.in3d) { opacity: 0; }
  .scene[data-r3] :global(.visitor:has(> .art.m3on) > .shade) { opacity: 0; }
  /* the campfire's light is the canvas's (its emissive, halo, pool and point light); its flames stay the DOM's */
  .scene[data-r3] :global(:is(.fire-halo, .embers, .fire-pool)) { display: none; }
  .scene[data-r3] .vil :global(:is(.body > .official, .body > .silhouette, .shadow)) { opacity: 0; }
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
  /* in the tent: not on the island (one place at a time) */
  .actor.inside { visibility: hidden; pointer-events: none; }
  /* seated: sunk behind the seat (the bench or the stool in front covers the legs) */
  .actor[data-seat] .vil { translate: -50% calc(2px + var(--seat-drop)); }
  /* at the bar: three pull-ups, a rest, again */
  .actor[data-rep] .vil { animation: pullup 4.2s ease-in-out infinite; }
  @keyframes pullup { 0%, 64%, 100% { translate: -50% 2px; } 8%, 16% { translate: -50% calc(2px - var(--rep-lift)); } 24%, 32% { translate: -50% 2px; } 40%, 48% { translate: -50% calc(2px - var(--rep-lift)); } 56% { translate: -50% 2px; } }
  :global(.if-scene:is([data-paused], [data-covered])) .actor[data-rep] .vil { animation-play-state: paused; }
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
  /* every world node is tinted (the same multiply as the plane), but the lights: on what it draws, never on a wrapper:
     each leaf (an image, an svg, a drawn bit with no child; a wrapper's ::before / ::after). A wrapper an animation
     moves gets its own compositing layer in WebKit, which an ancestor's url() filter doesn't reach: on the node, a
     tapped bush or tree flashed untinted at night for its shake. Specificity 0: a leaf's own filter wins and takes the
     tint first (`filter: var(--leaf-tint,) drop-shadow(…)`); day: no --tod-filter, no filter. */
  :where(.stage) :global(:where(.wn) :where(svg, :not(svg *, button, .hit, .hit-trunk):not(:has(*)))) { --leaf-tint: var(--tod-filter); filter: var(--leaf-tint); }
  :where(.stage) :global(:where(.wn) :where(:not(svg *, [data-hit-min]):has(*))::before),
  :where(.stage) :global(:where(.wn) :where(:not(svg *, [data-hit-min]):has(*))::after) { filter: var(--tod-filter); }
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
