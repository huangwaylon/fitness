<script lang="ts">
  // The island (docs/design.md "World", docs/decisions.md "The island in 3D"): NH's models in three.js on the editable
  // layout (world3d/Island3D.svelte: its own chunk), the camera its engine's (one finger along the island, two pinch:
  // world3d/gestures.ts). Every world thing is also a DOM node at its feet over the canvas (its tap area, its marks, its
  // balloons and popups), placed through the 3D camera by one projector in one depth order (camera.svelte.ts). The sky,
  // the HUD, the weather and the fireworks stay fixed over it. Nothing runs when still: a camera move, a walk or a change
  // places what moved. No WebGL (never on the users' iPhones): a friendly line instead of the island; the panel, the
  // health and ごほうび work as ever.
  //   <IslandScene {view} onhighfive onhighfivegot paused />
  // Layout contract (for the page): give it the whole page (--scene-h, e.g. 100dvh); --hud-bottom is the top chrome's
  // bottom edge. Read back data-horizon (on .if-scene: the camera's horizon, px down it) to place overlays in the sky.
  // Life (islandLife.svelte.ts): the motion bus (emit('highfive-sent') etc.), reactions to the `view` diff (partner
  // data, fruit stages, a received high-five), naps, the balloon; idle life runs while not `paused`.
  import Lazy from '#lib/components/ui/Lazy.svelte';
  import { lazyComponent } from '#lib/ui-state/lazyComponent.svelte.ts';
  import { islandDay, relayOffset } from './ambientClock.ts';
  import { releaseWorker } from '#lib/ui-state/swLate.ts';
  import { showAt } from './fireworks.ts';
  import { hook, hookFlag, hooksOn } from './devHooks.ts';
  import type { PersonId, WeekView, Who } from '#lib/types.ts';
  import { actorOf, castMe, guestPhone, islandActors, keepSeen, setCast, setPresence, setPresenceClock, whoOf, type VillagerActor } from '#lib/ui-state/cast.ts';
  import Villager from '../characters/Villager.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import { artGate, setArtGate } from '../characters/artGate.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { theme } from '#lib/ui-state/theme.svelte.ts';
  import type { Foliage } from '#lib/ui-state/season.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import Sky from './Sky.svelte';
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
  import { farmUi } from './farmUi.svelte.ts';
  import { layoutPlots } from '#lib/layout/field.ts';
  import CatchStack from './CatchStack.svelte';
  import { SAY_TAG, rememberSay, sayGate } from './say.ts';
  import { HIGHFIVE_LIVE_MS, heardHighFive } from './highFives.ts';
  import TreeShakes from './TreeShakes.svelte';
  import PartnerNews from './PartnerNews.svelte';
  import KikimimiHost from '../kikimimi/KikimimiHost.svelte';
  import { quiz } from '../kikimimi/invite.svelte.ts';
  import { HATS, birthdaysShown, isBirthday } from './birthday.ts';
  import { FIREWORKS_FROM, archOn, weddingDay } from './wedding.ts';
  import { eventAt } from './events.ts';
  import { scenePreview } from '#lib/ui-state/preview.svelte.ts';
  import { beachedAt } from './visitors.ts';
  import { goalTree, shakeTap, treeById, type ShakeTree } from './treeShake.ts';
  import { Faces } from './faces.svelte.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { lookOf as wornOf } from '#lib/store/look.ts';
  import type { Look as Worn } from '#lib/contract/look.ts';
  import { IslandLife } from './islandLife.svelte.ts';
  import { VILLAGER, charInView, eventsAt, u, wildFlower, type Tod } from './scene.ts';
  import type { At } from '../world3d/engine.ts';
  import { CAMS, CENTRE_STAGE, FLOWERS, GOAL_TREES, HOMES, SEAT_DROP, flowerById, freshWhere, seatAt, surfaceAt, worldGen, BUILDINGS, LAWN_SPOTS, type BuildingId } from './world.ts';
  import { guestSpot, doorAt, outOf, partnerOnline } from './buildings.ts';
  import { site } from './site.svelte.ts';
  import { nextChance } from '#lib/ui-state/retry.ts';
  import { kkSpot } from './kkSlider.ts';
  import { digSpots, spotsOn } from './beach.ts';
  import * as W from './world.ts';
  import { provideDoor } from '#lib/ui-state/doorTransition.ts';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { RING_MS, stepCue } from './tapWalk.ts';
  import { buildingAt, walkNav } from './nav.ts';
  import { LIVE_URL, createLive, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';
  import { sendDecor, sendDecors, sendIslandDay } from '#lib/store/actions.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { decor } from '#lib/store/decor.svelte.ts';
  import { layout as islandLayout } from '#lib/store/layout.svelte.ts';
  import type { TentEntry } from '#lib/contract/tent.ts';
  import { decorLayout } from '#lib/contract/decor.ts';
  import Decor from './Decor.svelte';
  import Board from '../board/Board.svelte';
  import { World, dropLive, provideWorld } from './camera.svelte.ts';
  import { hybridFor, hybridsOf } from './care.ts';
  import { garden } from './sceneDay.ts';
  import { addDays } from '#lib/time/dates.ts';
  import { actors, addFx, applyStep, busy, eventsQuiet, inMotion, react, livePos, onMove, onStep, place, setEmote, setHome, setMotion, wake } from '../motion/director.svelte.ts';
  import { cue, hearFrom } from '#lib/sound/cues.ts';
  import { prefetchPlace } from '#lib/sound/sound.svelte.ts';
  import { enterStage } from '#lib/sound/stage.svelte.ts';
  import { walkGeo, walkable } from './walkGraph.ts';
  import { weedsAt } from './care.ts';
  import { mushroomSpots } from './mushrooms.ts';
  import { giftTreesOn } from './treeGifts.ts';
  import { landing, perches } from './critters.ts';
  import { attachAvatar, keepPos, partnerRestsAt, partnerTo, presence, freeze, sendTo, setInside, setPartnerRest, sitTo, snapHome, startAt, stepOut, steered, thaw, turnTo, wander, SNAP_HOME_MS } from './avatar.ts';
  import { freeSeat, seatNamed, seatOpen, seatPieceAt, seatSpots, sitTimeOf, yieldsSeat, type SeatSpot } from './sitting.ts';
  import { useOf } from '../villager3d/seats3d.ts';
  import type { GymUse } from '../villager3d/poses.ts';
  import { where } from '#lib/store/where.svelte.ts';
  import { JOIN_SAY_MS, RUN_RING_U_S, linkVillagers, playPartner, playWake } from './villagerSync.ts';
  import { canonical, hash, type DayEvent } from '#lib/sync/world-day.ts';
  import type { SceneHit } from './sceneTaps.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { onMount, untrack } from 'svelte';
  import type { ActorId } from '../motion/reactions.ts';
  import { dayKey, jst, minuteNow } from '#lib/time/clock.ts';
  import { piecesOn, swapsOn } from './fixedDecor.ts';
  import { islandSeed } from './devHooks.ts';
  import { ARCH, DECOR_SLOTS, SCENERY } from './world.ts';
  import { echo3d } from './echo3d.ts';
  import { fx3d } from './fx3d.ts';

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
  }
  let { view, onhighfive, onhighfivegot, onguest, paused = false }: Props = $props();

  const uid = $props.id();
  const season = $derived(theme.season);
  const foliage = $derived<Foliage>(theme.foliage);
  const tod = $derived<Tod>(theme.tod);

  // The clock (device time or ?date=), at each new minute; the seasonal preview (ui-state/preview.svelte.ts: せってい's
  // きせつ and the dev params) shows another event, season or time of day over it (the theme above follows it too).
  const clock = $derived(minuteNow());
  const preview = $derived(scenePreview());
  const month = $derived(preview.month ?? jst(clock).month);
  const ev = $derived(eventsAt(clock, preview.event));
  // NH's dated events (events.ts): Halloween's pumpkins all day, Jack, the lanterns and the villagers' lines at night
  const nhEvent = $derived(eventAt(dayKey(clock), jst(clock).hour, preview.event));
  // the wedding countdown (wedding.ts): the arch on June Sundays, the day itself, its fireworks at night
  const wedding = $derived.by(() => {
    const date = dayKey(clock), { hour, weekday } = jst(clock), shown = preview.event === 'wedding', day = shown || weddingDay(date);
    return { date, arch: archOn(date, weekday), day, fireworks: day && (shown || hour >= FIREWORKS_FROM) };
  });

  // The same island on both phones (docs/design.md "Shared world"): A (ウェイ) lives on the left, B (うめ) on the right,
  // whichever of us holds the phone: homes, goal trees, flower beds, every shared id by person.
  // The guest (docs/design.md "The guest"): its villager is the third on a member's phone (always there, asleep while
  // its app is closed, as everyone's), this phone's own on the guest's (A and B then the partner and the third: ui-state/cast.ts). It has no home
  // or tree: its spot is by the campsite.
  // svelte-ignore state_referenced_locally
  setCast(view.viewer);
  const sideOf = (pid: Who): 'left' | 'right' => (pid === 'A' ? 'left' : 'right');
  /** Who each villager actor draws: its person, name and look, today's ベル (null: the guest's, which has none). */
  type Look = { person: Who; villagerName: string; villager: string | null; bells: number | null; worn: Worn };
  const lookOf = (w: Who): Look => (w === 'G' ? { person: 'G', villagerName: view.guest.villagerName, villager: view.guest.villager, bells: null, worn: wornOf('G') }
    : { person: w, villagerName: view.people[w].villagerName, villager: view.people[w].villager, bells: view.people[w].today.bells, worn: wornOf(w) });
  const homeOf = (w: Who): readonly [number, number] => (w === 'G' ? guestSpot() : HOMES[w]);
  const VILLAGERS = ['mine', 'partner', 'third'] as const;
  const sides = $derived.by(() => {
    const viewer = view.viewer, whos: Record<VillagerActor, Who> = viewer === 'G' ? { mine: 'G', partner: 'A', third: 'B' } : { mine: view.me, partner: view.partner, third: 'G' };
    void site.rev;
    return Object.fromEntries(VILLAGERS.map((id) => [id, { person: lookOf(whos[id]), home: homeOf(whos[id]), side: sideOf(whos[id]) }])) as Record<VillagerActor, { person: Look; home: readonly [number, number]; side: 'left' | 'right' }>;
  });
  /** Whose villager is in the tent (one place at a time: nowhere on the island then). */
  const inTent = (id: VillagerActor): boolean => id !== 'mine' && where.inTent[whoOf(id)];

  const covered = $derived(paused || ui.overlay || quiz.open);
  /** Its CSS (data-covered, data-sheet: every animation held, the island hidden): under a sheet only once the sheet is
   *  up (its first frame out, ui.up), not in the tap's frame, where restyling the island's 600 elements held up the
   *  sheet's first frame. (data-sheet: never for ききみみ's alone, whose sheet is in the scene
   *  and animates.) */
  const up = $derived(ui.up.length > 0);
  // The island in 3D (world3d/Island3D.svelte: its own chunk with three.js); the DOM island runs over its canvas as the
  // taps and the overlays. No WebGL (failed3): the island's message instead (never on the users' iPhones).
  let failed3 = $state(false);
  const r3 = $derived(!failed3);
  // the island on its layout (site.svelte.ts): world.ts's geometry is the layout's from here on (before anything below
  // reads it)
  site.sync();
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
  // the nodes' art the canvas draws instead isn't downloaded while the island is 3D (the rules' --art3d below)
  setArtGate(artGate(() => r3, () => sceneEl));
  $effect(() => {
    if (covered) openTree = null;
  });
  $effect(() => {
    if (!openTree) return;
    // Capture phase, so it runs before the tapped control's own handler; the tap still does what it does.
    const away = (e: PointerEvent) => {
      // A tree's own buttons toggle it themselves; the popup's ごはん button opens the sheet (which closes it: covered).
      if (!(e.target instanceof Element) || !e.target.closest('.canopy, .row-btn, [data-tree-food]')) {
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
  const life = new IslandLife({ view: () => view, covered: () => covered, night: () => tod === 'night', day: () => tod === 'day' });
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
  const sayShown = $derived(!covered && !openTree && !ui.sheets.length);
  /** The island has a field (docs/farming.md): the farm button, its picker and a plot tap's word can show. */
  const fieldsHere = $derived((void site.rev, site.layout ? layoutPlots(site.layout).length > 0 : false));
  const vilEls = $state<Record<VillagerActor, HTMLElement | undefined>>({ mine: undefined, partner: undefined, third: undefined });
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
    // a sheet over the island or a tree's popup: the picker goes with its button
    if (picking && !sayShown) untrack(() => closePicker());
  });
  /** Show `text` over a villager (mine: picked here; the partner's: from the relay) and hop it. */
  function showSay(id: VillagerActor, text: string) {
    const el = vilEls[id], sd = sides[id];
    // (a villager in the tent, or the guest's away, isn't on this screen: nothing to say it over)
    if (!el || covered || inTent(id)) return;
    says?.say(id, text, el, { name: sd.person.villagerName, colour: SAY_TAG[sd.person.person] });
    if (!actors[id].asleep && !actors[id].walking) applyStep(id, { actor: id, motion: 'hop' });
  }
  function pickSay(text: string) {
    closePicker();
    rememberSay(text); // (a quick pick again: first)
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
    if (covered || fiving.has(id) || inTent(id)) return;
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
    if (ago > HIGHFIVE_LIVE_MS || covered || life.hidden) return void life.later(() => react('R5'), 700);
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
   *  long ago (the partner's tap, heard a moment later). The 3D island draws it (effects.ts' `zap`: its star in code,
   *  unlit, warmed with the island, following zapAt every frame); the node stays (the specs' [data-zap]), its art
   *  invisible then (`in3d`). */
  let zap = $state<{ n: number; t0: number; from: VillagerActor; to: VillagerActor; in3d: boolean } | null>(null);
  const ZAP_MS = 520;
  function zapStart(from: VillagerActor, ago = 0, to: VillagerActor = from === 'mine' ? 'partner' : 'mine') {
    const left = ZAP_MS - ago;
    if (left <= 60) return;
    const t0 = performance.now() - ago, n = (zap?.n ?? 0) + 1, stop = world.moveStart();
    const [x, z, h] = zapPos(t0, from, to);
    zap = { n, t0, from, to, in3d: fx3d('zap', x, z, h, { ms: left, follow: () => zapPos(t0, from, to) }) };
    life.later(() => {
      stop();
      if (zap?.n === n) zap = null;
    }, left + 60);
  }
  const zapAt = () => zapPos(zap?.t0 ?? 0, zap?.from ?? 'mine', zap?.to ?? 'partner');
  function zapPos(t0: number, from: VillagerActor, to: VillagerActor): readonly [number, number, number] {
    const k = Math.min(1, (performance.now() - t0) / ZAP_MS);
    const [ax, az] = livePos(from), [bx, bz] = livePos(to);
    return [ax + (bx - ax) * k, az + (bz - az) * k, VILLAGER.h * (0.55 + Math.sin(Math.PI * k) * 0.35)];
  }
  // Island care: a flower watered yesterday can show a hybrid colour today (care.ts; `?hybrid` in the demo shows one).
  const today = $derived(dayKey(clock));
  // Birthdays (birthday.ts): ours from the people config (both villagers wear NH's birthday hat, the cake, the
  // confetti, a popper on a goal), and an NH villager's own from the roster's birthdays (a small chunk of its own,
  // loaded with the island, never with the first load or the roster): that villager wears the hat.
  const bday = $derived(birthdaysShown(today, preview.event));
  let villagerBdays = $state<Record<string, string> | null>(null);
  $effect(() => {
    // (a failed load tried again at its next chance, a few times: retry.ts)
    let gone = false;
    const get = (n: number): void =>
      void import('#lib/villagers/birthdays.ts').then(
        (m) => !gone && (villagerBdays = m.BIRTHDAYS),
        () => n < 5 && void nextChance(n).then(() => !gone && get(n + 1))
      );
    get(0);
    return () => (gone = true);
  });
  const hatOf = (id: VillagerActor, person: Look): string | null =>
    (bday.length && id !== 'third') || isBirthday(villagerBdays?.[resolveLook({ villager: person.villager, person: person.person }).id], today) ? HATS[id === 'third' ? 'partner' : id] : null;
  const hybrid = $derived.by(() => {
    const kindOf = (id: string) => wildFlower(flowerById(id) ?? FLOWERS[0], season);
    if (hookFlag('hybrid')) return { id: FLOWERS[0].id, flower: hybridsOf(kindOf(FLOWERS[0].id))[0] };
    const mine = garden(today, addDays(today, -1), (w) => hybridFor(today, w.filter(flowerById), kindOf)).hybrid;
    // both people's waterings yesterday (the shared day's), so both phones grow the same one
    const both = shared.wateredYesterday().filter(flowerById);
    return both.length ? hybridFor(today, both, kindOf) : mine;
  });
  // a wasp's sting from a shaken tree (TreeShakes), Jack's trick: the villagers' faces a while (faces.svelte.ts)
  let shakes = $state<ReturnType<typeof TreeShakes>>();
  const faces = new Faces();
  // The world: its camera (the 3D island's, fitted to the viewport) and projector, shared with every part of the island
  // (camera.svelte.ts).
  const world = new World();
  provideWorld(world);
  let scroller = $state<HTMLElement>();
  let vh = $state(844), s = $state(1), horizonPx = $state(135);

  // Where each villager lives (the director walks them from there and back; design.md "Walking").
  // svelte-ignore state_referenced_locally
  for (const id of VILLAGERS) setHome(id, sides[id].home[0], sides[id].home[1]);
  // (a home spot moved on the layout: there from now on)
  $effect(() => {
    const sd = sides;
    untrack(() => VILLAGERS.forEach((id) => setHome(id, sd[id].home[0], sd[id].home[1])));
  });
  // Where my villager stands as the island opens: just out of a building's door (a room's ‹ 島へ: island/doorOut.ts),
  // facing out; else where it last stood (back from another screen, a reload, the app reopened, however long after:
  // avatar.ts startAt), home only when it has never been anywhere.
  {
    const out = ui.takeOutAt();
    if (out) stepOut(out.at, out.face);
    else {
      const at = startAt();
      if (at && !actors.mine.walking) place('mine', at[0], at[1]);
    }
  }
  // My villager walks to what I tap (avatar.ts): the walk geometry from the world's constants, a spot is fine when a
  // villager standing there covers no control or visitor and stays on screen, and the feet's live position (a walk
  // re-targets from mid-step). With a visitor on centre stage the villagers walk around them.
  let walk0: { gen: number; geo: ReturnType<typeof walkGeo> } | null = null;
  const geo = () => (walk0?.gen === worldGen() ? walk0 : (walk0 = { gen: worldGen(), geo: walkGeo() })).geo;
  let visited: { at: string; geo: ReturnType<typeof walkGeo> } | null = null;
  function geoVisited() {
    const { x, y } = actors.visitor, at = x || y ? [x, y] : [CENTRE_STAGE[0], CENTRE_STAGE[1]];
    if (visited?.at !== `${at}|${worldGen()}`) visited = { at: `${at}|${worldGen()}`, geo: walkGeo({ obstacles: [{ x0: at[0] - 18, x1: at[0] + 18, y0: at[1] - 8, y1: at[1] + 10 }] }) };
    return visited.geo;
  }
  const feet = (id: VillagerActor) => livePos(id);

  // Sitting (docs/design.md "Decor: sitting"): a villager standing still on a seat's spot (world.ts SEATS: a step in
  // front of a bench's seat, a stool, a chair, the hammock, a piece of the gym) is on it (the 3D villager sits or lies
  // down there itself, or uses the gym's piece: world3d/villagers.ts; a card sinks behind it); one at a pull-up bar does
  // a few pull-ups (the idle life takes it there on its person's exercise day). From where it stands only, so both
  // phones draw the same. Both on one bench: a heart each.
  // (asleep too: it dozes off on it; a seat whose spot has another piece today is none: seatHere)
  const seated = $derived(Object.fromEntries(VILLAGERS.map((id) => [id, actors[id].walking ? null : seatHere(seatAt(Math.round(actors[id].x), Math.round(actors[id].y)))])) as Record<VillagerActor, string | null>);
  // (the gym's pieces are seats: one on its spot uses it, the 3D villager by its pose, a card without a model by its
  // own rhythm: motion3d.ts gymPose; asleep, it dozes there)
  const gymUse = $derived(Object.fromEntries(VILLAGERS.map((id) => {
    const l = site.layout, s = seated[id] && l ? seatNamed(l, seated[id]) : null;
    return [id, !actors[id].asleep && s ? useOf(s.kind) : null];
  })) as Record<VillagerActor, GymUse | null>);
  /** The bench (a piece of two seats) a seat is on, or null. */
  const benchOf = (seat: string | null) => {
    const l = site.layout, s = seat && l ? seatNamed(l, seat) : null, o = s && l?.objects.get(s.piece);
    return o && l && seatSpots(l, o).length > 1 ? o.id : null;
  };
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

  // ---- the camera: the 3D island's engine's (world3d/engine.ts, gestures.ts); still → world.rest.z ----
  let settle: ReturnType<typeof setTimeout> | undefined;
  /** The scene's size and corner from its box (the ResizeObserver's, after a layout; `onready`). As it mounts, the
   *  page's size instead (the scene fills it: --scene-h): a read then forced a style and layout of everything mounted so
   *  far, mid-flush (27 ms of a launch's 71 ms task at 4× CPU), and the ResizeObserver's first call measures it anyway. */
  function measure(guess = false) {
    if (!scroller) return;
    if (guess) world.fit(innerWidth, innerHeight);
    else {
      const r = scroller.getBoundingClientRect();
      world.fit(scroller.clientWidth, scroller.clientHeight, r.left, r.top);
    }
    vh = world.view.vh;
    s = world.view.s;
    horizonPx = world.view.horizon;
  }
  /** Someone walking: the full rate while one is on screen or about to be (scene.ts charInView's margin: one walking in
   *  gets it a frame before it shows); one off it only the ambience's (the game clock still steps it). */
  const WALKERS = ['mine', 'partner', 'third', 'visitor'] as const;
  const AT3: At = { sx: 0, sy: 0, k: 0, up: 0, ground: 0, depth: 0, visible: false };
  function anyMoving(): boolean | 'ambient' {
    let off = false;
    for (const id of WALKERS) {
      if (!inMotion(id)) continue;
      const three = world.three;
      if (!three) return true;
      const [x, z] = livePos(id);
      if (charInView(three, x, z, world.view.vw, world.view.vh, AT3)) return true;
      off = true;
    }
    return off && 'ambient';
  }

  // ---- tap-to-walk (spec §4): a tap on the ground sends my villager there; a cream ring marks the spot ----
  let rings = $state<{ n: number; x: number; z: number; partner?: boolean; in3d?: boolean }[]>([]);
  let ringN = 0;
  /** The cream ring where a tap sent a villager (`partner`: theirs, from their phone). */
  function ring(x: number, z: number, partner = false) {
    const n = ++ringN;
    // (the 3D island's: fx3d.ts)
    const in3d = fx3d('ring', x, z, 0, { v: partner ? '#ddefff' : undefined });
    rings = [...rings.slice(-1), { n, x, z, partner, in3d }];
    life.later(() => (rings = rings.filter((g) => g.n !== n)), RING_MS + 50);
  }
  /** SceneTaps' last step: the tap landed on the ground at (x, z) and nothing else took it. A tap at a building's foot
   *  knocks at its door (walk there, then its line). */
  function walkThere(x: number, z: number, hit: SceneHit): boolean {
    if (covered || actors.mine.asleep) return false;
    // only empty ground walks: water ripples and a building's footprint knocks at its door where my villager stands
    if (hit.kind !== 'grass' && hit.kind !== 'sand') return false;
    const b0 = buildingAt(x, z), door = b0 && sceneEl?.querySelector<HTMLElement>(`[data-building="${b0}"] .door`);
    if (b0 && door) return building(b0, door), true;
    // a seat's foot (a 3D piece with no tap area of its own: an iron chair): up to it and on
    const sp = site.layout && seatPieceAt(site.layout, x, z);
    if (sp && sitOn(sp.id)) return true;
    // (the partner's phone plays the very walk: villagerSync.ts tells it every move of mine, and the relay keeps it)
    const r = sendTo(x, z);
    if (!r) return false;
    ring(r.to[0], r.to[1]);
    return true;
  }

  // ---- sitting and lying (sitting.ts, docs/design.md "Decor: sitting"): a tap on a seat walks my villager up to it,
  //      a step in front, and there it sits or lies down, as in the tent; one villager a seat (a bench two) ----
  /** A seat (its piece's id: SceneTaps' data-sit, or the ground at its foot) tapped: my villager walks up to its free
   *  seat nearest it, and on (all taken: a boop; on it already: nothing more). True when it took the tap. */
  function sitOn(piece: string): boolean {
    if (covered || actors.mine.asleep) return false;
    const l = site.layout, o = l?.objects.get(piece);
    const spots = l && o ? seatSpots(l, o).filter((q) => seatHere(q.name)) : [];
    if (!spots.length) return false;
    if (spots.some((q) => q.name === seated.mine)) return true;
    const taken = (q: SeatSpot) => VILLAGERS.some((id) => id !== 'mine' && seated[id] === q.name);
    const st = freeSeat(spots, livePos('mine'), taken);
    if (!st) return cue('boop'), true;
    // (the partner's phone plays the very walk; standing still on the spot is on it there too: world.ts seatAt)
    // another on it as mine got there, who sat first (yieldSeat, below): mine gets up again
    const ms = sitTo(st.at, () => !losesSeat() && cue('scene-bench'));
    return ms !== null;
  }
  /** When a villager sat where it is (its last walk's, the relay's clock: sitting.ts sitTimeOf), or null: unknown. */
  const sitTime = (id: VillagerActor) => sitTimeOf(shared.day.walks[whoOf(id)]);
  /** Whether mine, on a seat with another on it too, is the one to get up (sitting.ts yieldsSeat). */
  const losesSeat = () => {
    const on = seated.mine, others = VILLAGERS.filter((id) => id !== 'mine' && !!on && seated[id] === on);
    return others.length > 0 && yieldsSeat({ who: castMe(), s: sitTime('mine') }, others.map((id) => ({ who: whoOf(id), s: sitTime(id) })));
  };
  // Two on one seat (two phones took it at the same moment, each before it heard the other, or another got on it while
  // mine walked up): the earlier sit keeps it, an exact tie by who, the same on every phone; mine, the later, gets up
  // for the piece's other seat if it's free, else steps aside (and its walk tells the others).
  $effect(() => {
    const on = seated.mine;
    if (!on || !VILLAGERS.some((id) => id !== 'mine' && seated[id] === on)) return;
    untrack(() => losesSeat() && yieldSeat(on));
  });
  function yieldSeat(name: string) {
    const l = site.layout, s0 = l && seatNamed(l, name), o = s0 && l?.objects.get(s0.piece);
    if (!l || !s0 || !o) return;
    const spots = seatSpots(l, o).filter((q) => seatHere(q.name));
    const next = freeSeat(spots, s0.at, (q) => VILLAGERS.some((id) => seated[id] === q.name));
    if (next) sitTo(next.at, () => !losesSeat() && cue('scene-bench'));
    else sendTo(s0.at[0], s0.at[1] - 20);
    cue('boop');
  }

  // ---- the partner off screen: a round face of their villager pinned at the top or the bottom edge (a cue only) ----
  let edge = $state<'top' | 'bottom' | null>(null);
  function edgeCheck() {
    const [x, z] = livePos('partner'), p = world.screenAt(x, z, VILLAGER.h * 0.5);
    const e = p.sy < world.view.horizon + 10 || !p.visible ? (z > world.view.camZ ? 'top' : 'bottom') : p.sy > world.view.vh + 10 ? 'bottom' : null;
    if (e !== edge) edge = e;
  }

  /** When the camera's last move is SETTLE_MS old: one timer for a scroll, put off as it goes on (not a clear and a new
   *  one each moving frame). */
  const SETTLE_MS = 140;
  let settleAt = 0;
  function settled() {
    const left = settleAt - performance.now();
    if (left > 1) return void (settle = setTimeout(settled, left));
    settle = undefined;
    world.rest.z = Math.round(world.view.camZ);
    talk?.hold(false);
    says?.hold(false);
  }
  function onScroll() {
    world.kick();
    talk?.hold(true);
    says?.hold(true);
    // (in the camera's frame: the balloons carried with their speakers)
    talk?.track();
    says?.track();
    settleAt = performance.now() + SETTLE_MS;
    settle ??= setTimeout(settled, SETTLE_MS);
  }
  /** Put the camera at a world z at once (the e2e hook). */
  function goTo(z: number) {
    if (world.three) return island3d?.go(z);
    // (the 3D island not up yet: it opens there)
    start3 = z;
  }
  onMount(() => {
    if (!scroller) return;
    measure(true);
    world.onTick(() => {
      // (the camera is the 3D island's engine's: Island3D writes camZ in each of its frames)
      edgeCheck();
      return anyMoving();
    });
    // back out of the tent: the camera where it was when we went in (else まえ, the 3D island's own start)
    start3 = ui.takeIslandZ();
    world.rest.ready = true;
    world.invalidate();
    const offMove = onMove(() => world.kick());
    let first = true;
    const ro = new ResizeObserver(() => {
      // (the first call is the observe itself: the mount's guess made exact; after it a new screen, the same camera refitted)
      measure();
      if (first) first = false;
      else requestAnimationFrame(() => world.invalidate());
    });
    ro.observe(scroller);
    const hooks = expose();
    // the island's music stage (K.K., the island's cut-ins: sound/stage.svelte.ts) is heard here
    const leaveStage = enterStage('isl');
    // another player's sounds by where they are on this camera (sound/cues.ts)
    const offEar = hearFrom((x, z) => world.earGain(x, z));
    return () => {
      leaveStage();
      offEar();
      // (the hooks hold this island: its DOM and its renderer, through a room's visit)
      if (window.__world === hooks) delete window.__world;
      offMove();
      ro.disconnect();
      clearTimeout(settle);
      faces.clear();
      world.stop();
      dropLive(world);
    };
  });
  /** The e2e's hooks on the island (window.__world). */
  function expose() {
    return (window.__world = {
      cam: () => world.view.camZ, idle: () => world.idle(), perf: world.perf,
      /** The opening beats are over: none to come, no event playing or queued (idle life may still wander). */
      quiet: () => !life.opening && eventsQuiet(),
      /** The partner sets off on a one-stop outing now (false: it can't yet: the opening beats, someone else out, the
       *  island's targets not placed). The e2e's, after it has read where the partner stands. */
      wander: () => wander('partner', 1),
      /** Put the camera at z at once (e2e). */
      go: (z: number) => goTo(z),
      at: (x: number, z: number) => world.clientAt(x, z),
      /** Put my villager at a world point (e2e: the depth order). */
      put: (x: number, z: number) => (place('mine', x, z), world.kick()),
      /** My villager's feet now (e2e: tap-to-walk). */
      mine: () => livePos('mine'),
      /** The partner's villager's feet now (e2e: the shared world). */
      partner: () => livePos('partner'),
      /** The seat a villager is on (its spot's name: world.ts SEATS), or null (e2e: sitting). */
      seated: (id: VillagerActor) => seated[id],
      /** Anyone's villager's feet now (A, B or G), null when it's in the tent (e2e: the guest). */
      who: (w: Who) => (!inTent(actorOf(w)) ? livePos(actorOf(w)) : null),
      /** The camera's two ends for this screen (まえ, おく: the 3D island's; world.ts CAMS before it's up). */
      stops: () => (world.three && island3d ? [island3d.limits().min, island3d.limits().max] : [CAMS.mae, CAMS.oku]),
      /** The island on its layout (site.svelte.ts): whether it reads it, and where its doors, homes and centre stage are
       *  (e2e: the long island). */
      site: () => ({ on: site.on, doors: Object.fromEntries(BUILDINGS.map((b) => [b.id, doorAt(b.id)])), homes: HOMES, stage: CENTRE_STAGE, named: walkNav().named, grass: LAWN_SPOTS }),
      /** Where a villager (mine, or `who`'s) steps out of a building's door (buildings.ts outOf). */
      exit: (id: BuildingId, who: Who = castMe()) => outOf(id, who),
      /** What the ground is at a world point and the water a cast there lands in (world.ts: the layout's when on). */
      ground: (x: number, z: number) => ({ surface: surfaceAt(x, z), fresh: freshWhere(x, z) }),
      /** world.ts's places as the island has them now (the layout's when on): the e2e's, never world.ts's imported. */
      geo: () => ({
        CAMS: W.CAMS, SHORE_Z: W.SHORE_Z, POND: W.POND, CENTRE_STAGE: W.CENTRE_STAGE, ARCH: W.ARCH, CAKE: W.CAKE, HOMES: W.HOMES, SEATS: W.SEATS,
        BUILDINGS: W.BUILDINGS, FLOWERS: W.FLOWERS, SCENERY: W.SCENERY, DECOR_SLOTS: W.DECOR_SLOTS, CLIFF: W.CLIFF, RIVER: W.RIVER, RIVER_BEND: W.RIVER_BEND, PONDS: W.PONDS,
        GIFT_TREES: giftTreesOn(today, islandSeed()), BEACHED: beachedAt(site.layout, today, islandSeed())
      }),
      /** Whether (x, z) is open ground a tap there walks to (e2e: a spot for a tap-walk): walkable, `away` u from
       *  today's weeds, dig spots and mushrooms, 30 from the scenery's and the decor's tap areas, 32 from a flower (a thumb-sized tap area far up the screen),
       *  a thumb (20 u) off a building's footprint (a tap at its foot knocks at its door, and its model's eaves reach past it: a wide one's edge
       *  is far from its middle), and out of a finger's slack of any water (critters.ts landing: a tap there casts). */
      free: (x: number, z: number, away = 45) => {
        const ms = (jst(clock).hour * 60 + jst(clock).minute) * 60_000, seed = islandSeed();
        const near = (ps: readonly (readonly [number, number])[], d: number) => ps.some(([px, pz]) => Math.hypot(px - x, pz - z) < d);
        return walkable(walkGeo(), x, z) && !landing(x, z) && !([[0, 0], [20, 0], [-20, 0], [0, 20], [0, -20]] as const).some(([dx, dz]) => buildingAt(x + dx, z + dz)) && !near([...weedsAt(today, ms, seed).map((w) => [w.x, w.y] as const), ...digSpots(today, new Set(), seed).map((d) => [d.x, d.y] as const), ...mushroomSpots()], away)
          && !near([...W.SCENERY, ...W.DECOR_SLOTS].map((t) => [t.x, t.z] as const), 30) && !near([W.ROCK, W.TAPE_DECK, ...W.BUILDINGS.map((b) => [b.x, b.z + b.depth / 2] as const)], 40)
          && !near(((s) => (s ? [[s.x, s.z] as const] : []))(site.layout && kkSpot(site.layout)), 40)
          && !near(W.FLOWERS.map((f) => [f.x, f.z] as const), 32);
      },
      /** The trunks a bug perches on (critters.ts perches: the island's trees as they stand) and the ground's height
       *  at a point (the layout's): the e2e's bug on its bark. */
      perches: (palm: boolean) => perches(palm),
      height: async (x: number, z: number) => (await import('#lib/layout/height.ts')).heightAt(site.layout ?? islandLayout.current, x, z),
      /** Today's weed and dig spots (beach.ts spotsOn: the layout's open grass when on). */
      spots: () => spotsOn(today, islandSeed()),
      /** The island as both phones must have it (e2e: the two-phone checks): the shared day's canonical hash, and each
       *  person's villager (where it stands, rounded, and whether it dozes). */
      state: () => ({
        day: hash(canonical(shared.day)),
        decor: hash(decorCanon()),
        villagers: Object.fromEntries(VILLAGERS.map((id) => {
          const [x, z] = livePos(id);
          return [whoOf(id), { x: Math.round(x), z: Math.round(z), asleep: actors[id].asleep, walking: actors[id].walking, life: islandActors().includes(id) }];
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
        /** Layout ops of mine straight into the layout (its stamp first: `layoutStamp()`), and the merged ops. */
        layoutApply: (ops: Parameters<typeof islandLayout.apply>[0]) => islandLayout.apply(ops).length,
        layoutStamp: () => islandLayout.stamp(),
        metrics: () => (relay ?? demoRelay)?.metrics?.() ?? null,
        status: () => (relay ?? demoRelay)?.status() ?? null
      } : {})
    });
  }

  onMount(() => {
    const off = attachAvatar({ geo: () => (presence.visitor ? geoVisited() : geo()), clear: standsClear, where: feet, enabled: () => !covered && !life.hidden, hush: () => talk?.hush() });
    let hiddenAt = 0;
    const vis = () => {
      // (hidden: who's online kept as of now, for a reload's villagers: cast.ts keepSeen)
      if (document.hidden) (hiddenAt = Date.now()), keepSeen();
      else if (hiddenAt && Date.now() - hiddenAt > SNAP_HOME_MS) snapHome();
    };
    document.addEventListener('visibilitychange', vis);
    // footsteps by the ground under the walker (quiet world cues: silent under a sheet; the director spaces them)
    const offStep = onStep((id) => {
      if (covered || life.hidden) return;
      const [x, z] = livePos(id);
      const c = stepCue(surfaceAt(x, z), season === 'winter', raining());
      // (another's steps by where they are)
      if (c) cue(c, id === 'mine' ? undefined : { at: [x, z] });
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
    if (c === wasCovered) return;
    wasCovered = c;
    untrack(() => (c ? freeze() : thaw()));
  });
  // A shaken tree: it shakes where it stands, my villager turning to it (avatar.ts), and what falls falls (TreeShakes:
  // every tree on the island, its drop by its kind; the goal trees' canopies count their own taps, FruitTree).
  /** A tree by id (the same on both phones). */
  const treeOf = (id: string): ShakeTree | null => treeById(id);
  function shakeTree(pid: PersonId, fruitDown = false) {
    shakeAt(goalTree(pid), fruitDown);
  }
  function shakeAt(tr: ShakeTree, fruitDown = false) {
    turnTo(tr.x);
    shakes?.shaken(tr, fruitDown);
  }
  /** Any other tree (SceneTaps' tap on its art): a tap rustles it; the third quick one is a shake (treeShake.ts). */
  const treeTaps: Record<string, number[]> = {};
  function treeTap(id: string): boolean {
    const tr = treeOf(id);
    if (covered || !tr || tr.kind === 'goal') return false;
    const run = shakeTap(treeTaps[id] ?? [], Date.now());
    treeTaps[id] = run.taps;
    rustle(tr, true);
    if (run.shake) shakeAt(tr);
    return true;
  }
  /** A tree rustles (a tap, a shake: the partner's too, `far`: its sound by where it is): a goal tree its own way
   *  (FruitTree), any other here. */
  function rustle(tr: ShakeTree, sound = false, far = false) {
    const g = /^goal-([AB])$/.exec(tr.id);
    if (g) return void life.shakeN[g[1] as PersonId]++;
    if (sound) cue('tree-shake', far ? { at: [tr.x, tr.z] } : undefined);
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
  const relay = LIVE_URL && !week.demo ? liveRelay() : null;
  // The shared island (docs/backend.md#shared-world, store/world.svelte.ts): the day's changes, mine and the partner's,
  // over this relay; in the demo the two players' tabs share it (sync/live-local.ts: `?demo` and `?demo&as=B`).
  // `?relay=<wss url>&key=<person key>` (the hooks on: the e2e's two-phone harness against the test relay, each its own
  // browser context): the demo talks to a real relay instead
  const testRelay = (): Live | null => {
    const url = hook('relay'), key = hook('key');
    return url && /^wss?:\/\//.test(url) && key ? createLive({ url, key: () => key }) : null;
  };
  // svelte-ignore state_referenced_locally
  const demoRelay = week.demo ? (testRelay() ?? createLocalLive(view.viewer)) : null;
  /** The record's rooms' rows, for the rooms' store once it's in (the homes' sizes). */
  let tentRows: TentEntry[] | null = null, roomRows: ((t: TentEntry[]) => void) | null = null;
  $effect(() => {
    const me = view.viewer;
    untrack(() => {
      shared.attach(relay ?? demoRelay, me, !!week.demo);
      decor.attach(relay ?? demoRelay, me, !!week.demo);
      islandLayout.attach(relay ?? demoRelay, me, !!week.demo);
      // (the homes' rooms' sizes: each home's outside follows its room's, homes.ts exteriorOf; the rooms' store loaded
      // after the island's first load, never in it)
      void import('#lib/store/tent.svelte.ts').then(({ rooms }) => {
        for (const r of Object.values(rooms)) r.attach(relay ?? demoRelay, me, !!week.demo);
        roomRows = (t) => Object.values(rooms).forEach((r) => r.rows(t));
        if (tentRows) roomRows(tentRows);
      });
      demoRelay?.start();
    });
  });
  $effect(() => () => demoRelay?.stop());
  // the sheet keeps each person's part of the day (held: one row per person and day), and gives the partner's back
  $effect(() => {
    shared.sink = (date, row) => sendIslandDay(date, row);
    decor.sink = (op) => sendDecor(op);
    islandLayout.sink = (ops) => sendDecors(ops);
    return () => {
      shared.sink = null;
      decor.sink = null;
      islandLayout.sink = null;
    };
  });
  // (only for a new State or a new day, the relay's as the shared day's: the minute tick replaces the model but keeps
  // its State, and these rows with it)
  // (and once the rows are the record's as of this session: my day's row waits for that, store/world.svelte.ts)
  let fed = '';
  let fedState: unknown = null;
  let fedCurrent = false;
  $effect(() => {
    const m = week.model;
    if (!m) return;
    const day = islandDay(), current = week.current;
    if (m.state === fedState && day === fed && current === fedCurrent) return;
    fedState = m.state;
    fed = day;
    fedCurrent = current;
    untrack(() => {
      shared.rows(m.state.islandDays.map((r) => ({ at: r.at, person: r.person, data: r.data })), current);
      decor.rows(m.state.decor);
      islandLayout.rows(m.state.layout);
      tentRows = m.state.tent;
      roomRows?.(tentRows);
      // the old もようがえ's decorations, mine, into the layout once (layout/migrate.ts)
      islandLayout.migrateDecor(decorLayout(m.state.decor));
      // (no automatic move of a new building off a taken spot: the user places the museum and the shop themselves, in
      // the editor)
    });
  });
  $effect(() => {
    if (!relay) return;
    // (the edge face is the partner's: on the guest's phone, A's while A is here)
    return relay.onStatus((st) => (partnerHere = partnerOnline(st, !!week.demo) && st.here.includes(whoOf('partner'))));
  });
  /** A node id or a world point (a walk's target). */
  const pointOf = (to: string | readonly [number, number]) => (typeof to === 'string' ? walkNav().named[to] : to);
  // The villagers on both phones (villagerSync.ts): every move of mine goes over the relay as the very walk; the
  // partner's plays here from the same start at the same time, and while they have the island open their villager is
  // theirs to move (this phone's own life leaves it alone).
  // (on the relay's own clock: a `?date=` preview shifts the island's day, not when a walk set off)
  const relayNow = () => (relay ?? demoRelay)?.serverNow() ?? Date.now();
  // who's awake goes by the relay's clock (ui-state/cast.ts: a grace's end, a wake's, the same instant on every phone)
  setPresenceClock(relayNow);
  $effect(() => () => setPresenceClock(null));
  life.syncSleep();
  const link = linkVillagers({
    share: (w) => void shared.share(w), me: castMe, serverNow: relayNow, enabled: () => true, kept: keepPos
  });
  // (`?quietafter=<ms>`: how long one gone quiet inside a room stays there; the e2e's)
  if (hook('quietafter')) where.goneMs = Number(hook('quietafter'));
  $effect(() => {
    const r = relay ?? demoRelay;
    if (!link || !r) return;
    let up = false, soon: ReturnType<typeof setTimeout> | undefined;
    let was: readonly Who[] = [];
    const off = r.onStatus((st) => {
      const here = st.connected ? st.here : [];
      // each other person here: their villager is the relay's to move (the guest's shows only then); gone, it stays
      // where their last walk left it (villagerSync)
      for (const w of ['A', 'B', 'G'] as const) {
        if (w === castMe()) continue;
        const left = st.connected ? st.gone?.[w] : undefined;
        link.here(actorOf(w), here.includes(w));
        where.presence(w, here.includes(w), left === undefined ? (st.connected ? where.goneMs : null) : left + where.goneMs - relayNow());
      }
      // the guest arriving on a member's phone: a banner, once per arrival
      if (here.includes('G') && !was.includes('G') && !guestPhone()) onguest?.(view.guest.villagerName);
      // I'm on the island (not in the tent): said to whoever arrives, whatever they last heard of me
      if (here.some((w) => !was.includes(w))) r.send({ kind: 'tent', in: false });
      was = here;
      // everyone's villager: awake while its person's app is open, asleep while it's closed (after a grace: cast.ts)
      setPresence(st);
      life.syncSleep();
      // (re)connected: once the day's replay is in, my villager as it is here (the room may hold an older walk of it,
      // from a session that ended elsewhere)
      if (st.connected && !up) soon = setTimeout(() => link.joined(), JOIN_SAY_MS);
      if (!st.connected && up) link.down();
      up = st.connected;
    });
    return () => (off(), clearTimeout(soon));
  });
  $effect(() => () => link?.detach());
  // one place at a time: another's villager in a room (the tent, a home, the museum, the shop) is nowhere here; gone
  // quiet inside, it's back where it went in
  $effect(() => {
    for (const id of ['partner', 'third'] as const) {
      const on = inTent(id);
      untrack(() => setInside(id, on));
    }
  });
  // the partner's phrases, live (never replayed: a phone opening later hears none)
  $effect(() => {
    const r = relay ?? demoRelay;
    if (!r) return;
    return r.on((m) => {
      if (m.who === castMe()) return;
      // (one said in a home's room, `sc`, is for the phones in there: not the island's)
      if (m.kind === 'say') untrack(() => m.sc === undefined && showSay(actorOf(m.who), m.text));
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
    setPartnerRest(to[0], to[1], id);
    steered[id] = w.t - relayOffset(); // (the relay's instant, as on every phone: ambient.ts held())
    // (a phone opening, the island hidden: where the walk has it by now; live and in view, a big gap glides off)
    const how = playPartner(w, relayNow(), now && !covered && !life.hidden, id);
    if (how === 'walk' || how === 'glide' || how === 'jump') {
      // a run (a tap on their phone: NH's ring where it goes)
      if (now && w.ms && w.from && Math.hypot(to[0] - w.from[0], to[1] - w.from[1]) / (w.ms / 1000) >= RUN_RING_U_S) ring(to[0], to[1], true);
      return;
    }
    if (how) return;
    if (!now || covered) return partnerRestsAt(to[0], to[1], id);
    if (partnerTo(to[0], to[1], id, w.t)) ring(to[0], to[1], true);
  }
  onMount(() => {
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
      // a villager woke on another phone (a tap, a high-five): here too, until the same moment (a phone opening during
      // its minute finds it up for the rest)
      else if (e.kind === 'act' && e.act === 'wake' && playWake(e, castMe(), relayNow())) life.syncSleep();
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
    if (covered || entering || (id !== 'campsite' && !BUILDINGS.some((b) => b.id === id))) return;
    const door = doorAt(id), at = livePos('mine');
    const goIn = () => goInto(id);
    // the room's music fetched on the way (sound/places.ts; the door's black covers what's left)
    if (id === 'museum' || id === 'shop') prefetchPlace(id === 'shop' ? 'shop' : 'museum-hall');
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
      if (again) walkingIn = setTimeout(check, Math.min(CHECK_MS, Math.max(80, again.ms - 40)));
    };
    let tries = 0;
    // (looked at often: on the long island a walk up is seconds long, and stopped short it goes on at once)
    walkingIn = setTimeout(check, Math.min(CHECK_MS, Math.max(0, p.ms - 40)));
  }
  /** How often the walk up to a door is looked at (ms). */
  const CHECK_MS = 400;
  /** My villager this near the tent's door (u) goes straight in. */
  const TENT_NEAR_U = 36;
  let walkingIn: ReturnType<typeof setTimeout> | undefined;
  /** The walk up to the tent under way (null: none, or a tap elsewhere ended it). */
  let goingIn: object | null = null;
  $effect(() => {
    const el = sceneEl;
    if (!el) return;
    const tapped = (e: Event) => {
      if (goingIn && !(e.target instanceof Element && e.target.closest('[data-building]'))) goingIn = null;
    };
    el.addEventListener('pointerdown', tapped, true);
    return () => (el.removeEventListener('pointerdown', tapped, true), clearTimeout(walkingIn));
  });
  /** Through a home's door: the tent (ウェイ's, the campsite) or うめ's or the guest's home on the layout (its room:
   *  `/tent?home=B|G`). */
  function goInto(id: BuildingId) {
    if (entering) return;
    turnTo(doorAt(id)[0]);
    entering = true;
    doorOn = id;
    ui.islandZ = world.view.camZ;
    cue('scene-bench');
    const q = new URLSearchParams(location.search);
    q.delete('home');
    if (id !== 'campsite' && id !== 'museum' && id !== 'shop') q.set('home', id.slice(-1));
    const qs = q.toString();
    // the museum and the shop are their own screens (routes/museum, routes/shop); a home's the room's
    void goto((id === 'museum' ? resolve('/museum') : id === 'shop' ? resolve('/shop') : resolve('/tent')) + (qs ? `?${qs}` : '')).finally(() => (entering = false));
  }
  let entering = false;
  /** The door going in through (the iris closes on it). */
  let doorOn: BuildingId = 'campsite';
  // the tent's door for the iris (its button's middle on screen)
  onMount(() =>
    provideDoor(() => {
      const r = sceneEl?.querySelector<HTMLElement>(`[data-building="${doorOn}"] .door`)?.getBoundingClientRect();
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
  // weather changes; nothing per frame. A change of sky on screen (the real weather's hour turning) eases the
  // darkening over about a minute, in steps of WET_STEP every WET_STEP_MS (the 3D lights' too: Island3D `wet`), as
  // the grey sky and the rain fade (Weather.svelte); the sky the page opens to is there at once.
  const fid = `${uid}-tod`;
  const WET_STEP = 0.06, WET_STEP_MS = 5000, WET_OPENING_MS = 20_000;
  const wetTarget = $derived(weather.sky !== 'clear' ? WET[weather.sky] : null);
  /** The darkening now: the last grey sky's colour and how strong (eased toward wetTarget's). */
  let wetNow = $state<{ c: string; a: number }>(untrack(() => ({ c: wetTarget?.[0] ?? '#FFFFFF', a: wetTarget?.[1] ?? 0 })));
  $effect(() => {
    const to = wetTarget;
    let t: ReturnType<typeof setTimeout> | undefined;
    untrack(() => {
      if (to) wetNow = { c: to[0], a: wetNow.a };
      const goal = to?.[1] ?? 0;
      // the page's first seconds: the sky it opens to, at once
      if (performance.now() < WET_OPENING_MS) return void (wetNow = { c: wetNow.c, a: goal });
      const step = () => {
        const d = goal - wetNow.a;
        wetNow = { c: wetNow.c, a: Math.abs(d) <= WET_STEP ? goal : wetNow.a + Math.sign(d) * WET_STEP };
        if (wetNow.a !== goal) t = setTimeout(step, WET_STEP_MS);
      };
      if (wetNow.a !== goal) step();
    });
    return () => clearTimeout(t);
  });
  let shade = $state<[number, number, number] | null>(null);
  $effect(() => {
    void tod;
    const wet = wetNow;
    const el = sceneEl;
    if (!el) return;
    const hex = (h: string): [number, number, number] | null => (/^#[0-9a-f]{6}$/i.test(h) ? [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255) as [number, number, number] : null);
    const base = hex(getComputedStyle(el).getPropertyValue('--tod-tint').trim()) ?? [1, 1, 1];
    const w = wet.a > 0 ? hex(wet.c) : null;
    const rgb = base.map((c, i) => c * (w ? 1 - wet.a * (1 - w[i]) : 1)) as [number, number, number];
    shade = rgb.every((c) => c > 0.995) ? null : rgb;
  });
  const shadeMatrix = $derived(shade ? `${shade[0].toFixed(3)} 0 0 0 0 0 ${shade[1].toFixed(3)} 0 0 0 0 0 ${shade[2].toFixed(3)} 0 0 0 0 0 1 0` : '');

  // The scenery that comes only on its days (the weather, the fireworks, an event's decorations): loaded the first time
  // it's due, then kept, so its code stays out of the first load.
  const weatherC = lazyComponent(() => import('./Weather.svelte')), fireworksC = lazyComponent(() => import('./Fireworks.svelte'));
  const halloweenC = lazyComponent(() => import('./Halloween.svelte')), birthdayC = lazyComponent(() => import('./Birthday.svelte')), weddingC = lazyComponent(() => import('./Wedding.svelte'));
  // the farm's controls (docs/farming.md "Playing"): the button once the island has a field, its picker and a plot
  // tap's word on their first use
  const farmButtonC = lazyComponent(() => import('./FarmButton.svelte')), farmPickerC = lazyComponent(() => import('./FarmPicker.svelte'));
  const farmPopC = lazyComponent(() => import('./FarmPop.svelte'));
  const FarmButtonC = $derived(farmButtonC.get(fieldsHere)), FarmPickerC = $derived(farmPickerC.get(farmUi.picker)), FarmPopC = $derived(farmPopC.get(!!farmUi.pop));
  const WeatherC = $derived(weatherC.get((weather.sky !== 'clear' || weather.fog || !!weather.rainbow || weather.aurora)));
  const FireworksC = $derived(fireworksC.get((life.devFireworks || preview.event === 'fireworks' || wedding.fireworks || allMet || !!showAt(jst(clock).month, jst(clock).day, jst(clock).weekday, jst(clock).hour))));
  const HalloweenC = $derived(halloweenC.get(nhEvent?.id === 'halloween'));
  const BirthdayC = $derived(birthdayC.get(!!bday.length));
  const WeddingC = $derived(weddingC.get(wedding.arch || wedding.day));
  // The decorate mode (docs/design.md "Decorating"): its tray and ghost are their own chunk, loaded on the first use.
  // what the 3D island draws today (Scenery's own: the scenery's seasonal swaps, the fixed decor's pieces)
  const scenery3 = $derived.by(() => {
    void site.rev;
    const sw = swapsOn(today);
    return SCENERY.map((x) => (sw[x.id] ? { ...x, key: sw[x.id].key, h: sw[x.id].h } : x));
  });
  const pieces3 = $derived((void site.rev, piecesOn(today, jst(clock).hour, islandSeed(), ARCH)));
  /** The seat whose spot is `name` if it's there today (sitting.ts seatOpen: a decor spot's piece of the day its own),
   *  else null. */
  function seatHere(name: string | null): string | null {
    const l = site.layout, s = name && l ? seatNamed(l, name) : null;
    return !s || seatOpen(s, pieces3, DECOR_SLOTS) ? name : null;
  }
  /** The goal trees' spots (world.ts's, on the island's layout: site.rev). */
  const goalTrees = $derived((void site.rev, GOAL_TREES));
  const cast3 = () => VILLAGERS.map((id) => ({
    id, person: sides[id].person.person, villager: sides[id].person.villager, look: sides[id].person.worn, side: sides[id].side,
    shown: !inTent(id), seated: !!seated[id], seat: seated[id], stung: faces.swollen[id], gym: gymUse[id], hat: hatOf(id, sides[id].person)
  }));
</script>

<div class="if-scene scene" bind:this={sceneEl} data-r3={r3 || undefined} data-season={season} data-tod={tod} data-sky={weather.sky} data-paused={life.hidden || undefined}
  data-covered={ui.overlay || (covered && up) || undefined} data-sheet={(paused && up) || undefined} data-live="true" data-horizon={horizonPx}>
  {#if picking && sceneEl}
    <!-- what my villager says: outside the viewport (its field's focus never moves the island), over the stage -->
    <SayPicker scene={sceneEl} anchor={picking} onpick={pickSay} onclose={(e) => {
      closePicker(e);
      if (!e) sayBtn?.focus({ preventScroll: true }); // ✕ or Esc: the focus back on its button
    }} />
  {/if}
  {#if sayShown}
    <!-- the picker's door: bottom right, over the sea, clear of the home indicator and しずえ's box (--news-lift) -->
    <div class="say-dock"><SayButton bind:el={sayBtn} open={!!picking} onopen={openPicker} /></div>
    {#if fieldsHere}
      <!-- the farm button: its mirror at the bottom left (docs/farming.md), the picker over it, while the island has a field -->
      <div class="farm-dock">{#if FarmButtonC}<FarmButtonC />{/if}{#if FarmPickerC && farmUi.picker}<FarmPickerC />{/if}</div>
      {#if FarmPopC}<FarmPopC />{/if}
    {/if}
  {/if}
  <!-- every catch's plate: a stack at the bottom centre, outside the viewport (the newest at the bottom) -->
  <CatchStack scene={sceneEl} />
  {#if FireworksC}<FireworksC bind:this={fireworks} enabled={() => !covered && !life.hidden} forced={life.devFireworks || wedding.fireworks} {allMet} {cheer} horizon={horizonPx} />{/if}

  <div class="scroller" bind:this={scroller} data-world-scroller>
    <div class="track" style:height="{vh}px">
      <div class="stage" data-exact-taps style:height="{vh}px" style:--u="{s}px" style:--su="{s}px" style:--tod-filter={shade ? `url(#${fid})` : undefined}>
        <svg class="defs" aria-hidden="true" width="0" height="0">
          <filter id={fid} color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values={shadeMatrix || '1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0'} /></filter>
        </svg>
        <!-- the sky is the stage's backdrop, behind the 3D island and every world thing (a tree top rising over the horizon
             stands in front of the sun or moon); the sun or moon and the stars sit high in the sky -->
        <Sky {tod} h={horizonPx + 6} />
        <Sky {tod} layer="lights" h={horizonPx + 6} />
        <!-- the balloon present: NH's, flying over the island in 3D (its tap area a world node on it) -->
        {#if life.balloon}<Balloon ondone={() => (life.balloon = false)} />{/if}
        {#if WeatherC}<WeatherC where="sky" skyH={horizonPx + 6} />{/if}
        {#if r3 && Island3DC && sceneEl}
          <Island3DC bind:this={island3d} {world} scene={sceneEl} {season} {foliage} {month} date={today} {tod} scenery={scenery3} pieces={pieces3} {hybrid} floating={ev.cherry ? 'petal' : ev.maple ? 'maple' : null}
            wet={wetNow.a} cast={cast3} enabled={() => !covered && !life.hidden}
            start={start3} onscroll={onScroll} onhorizon={(px) => (horizonPx = px)} onfail={() => ((failed3 = true), releaseWorker())} onready={() => measure()} />
        {:else if failed3}
          <!-- no WebGL (never on the users' iPhones): a line instead of the island; the rest of the app works as ever -->
          <div class="no3d" role="status" data-no3d><p>{t('island.no3d')}</p><p class="sub">{t('island.no3dSub')}</p></div>
        {/if}

        <Scenery {season} {foliage} {month} {tod} date={today} hour={jst(clock).hour} onbuilding={building} />

        {#each ['A', 'B'] as const as pid (pid)}
          {@const t = goalTrees[pid]}
          <FruitTree person={view.people[pid]} x={t[0]} z={t[1]} {foliage} shakeN={life.shakeN[pid]}
            celebrate={life.celebrate[pid]} open={openTree === pid} ontoggle={(on) => (openTree = on ? pid : null)}
            onshake={(down) => shakeTree(pid, down)} />
        {/each}

        <Flowers {season} {hybrid} />

        <Decor sit={sitOn} />
        <!-- the bulletin board on the front beach (docs/board.md): a tap walks up to it and opens it -->
        <Board enabled={() => !covered && !life.hidden} night={tod === 'night'} {season} />

        {#each VILLAGERS as id (id)}
          {@const sd = sides[id]}
          <div class="actor" class:walking={actors[id].walking} class:inside={inTent(id)} data-inside={inTent(id) || undefined} data-actor={id} data-who={sd.person.person} data-seat={seated[id]} data-gym={gymUse[id] || undefined} style:--seat-drop={u(SEAT_DROP)} style:--rep-lift={u(9)} data-person={sd.person.person} data-stung={faces.stung[id] || null} style:--bob-delay={id === 'partner' ? '-1.2s' : id === 'third' ? '-0.6s' : '0s'}
            {@attach world.at({ x: sd.home[0], z: sd.home[1], h: VILLAGER.h, live: () => livePos(id), always: true, inv: true })}>
            <button type="button" class="vil" data-sfx="self" bind:this={vilEls[id]}
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
                actor={id} side={sd.side} emoteSize="var(--emote-size)" shadow animate tricked={id === 'mine' && faces.tricked} swollen={faces.swollen[id]} hat={hatOf(id, sd.person)} />
            </button>
          </div>
        {/each}

        {#if edge && partnerHere && !where.partnerInTent}
          <!-- the partner out of view: their villager's face at the edge they're off (a cue; the finger scrolls) -->
          <span class="edge {edge}" data-partner-edge={edge} aria-hidden="true">
            {#if sides.partner.person.worn.kind === 'player'}<Avatar worn person={sides.partner.person.person} size={28} />
            {:else}<Villager person={sides.partner.person.person} villager={sides.partner.person.villager} size={28} head />{/if}
          </span>
        {/if}

        {#if zap}
          {#key zap.n}
            <!-- the high-five's sparkle, flying from mine to the partner -->
            <div class="zap-node" aria-hidden="true" {@attach world.at({ x: 0, z: 0, h: 20, live: zapAt, always: true, light: true })}>
              <svg class="zap" class:in3d={zap.in3d} viewBox="0 0 24 24" data-zap><path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0 Z" /><circle cx="12" cy="12" r="3" /></svg>
            </div>
          {/key}
        {/if}
        {#each rings as r (r.n)}
          <!-- where a tap sent my villager: a cream ring on the ground, shrinking out (NH has none; the least feedback) -->
          <div class="ring-node" {@attach world.at({ mode: 'flat', x: r.x, z: r.z, h: 4, zi: 8 })}><i class="tap-ring" class:partner={r.partner} class:in3d={r.in3d} data-ring={r.partner ? 'partner' : 'mine'}></i></div>
        {/each}

        <Particles {season} {foliage} {tod} quiet={asleepNow} mode="fireflies" raining={raining()} />
        <!-- scenery taps (bushes, flowers, clouds, sun / moon, sea, sand, grass): a short flourish, nothing else -->
        <SceneTaps bind:this={sceneTaps} scene={sceneEl} {season} {tod} enabled={() => !covered && !life.hidden} swallowed={() => closedBy} walk={walkThere} sit={sitOn}
          exercise={view.people.A.rings.peach.met || view.people.B.rings.peach.met} cake={bday.length > 0}
          skyTap={(x, y) => !!fireworks?.tap(x, y)}
          say={(name, parts, from, o) => talk?.say(name, parts, from, o)} ontrick={faces.trick} tree={treeTap} />
        <Talk bind:this={talk} scene={sceneEl} />
        <Says bind:this={says} scene={sceneEl} />
        {#if hookFlag('hit')}
          <!-- ?hit: every tap target drawn over the island (its own chunk) -->
          <Lazy load={() => import('./HitOverlay.svelte')}>{#snippet children(HitOverlay)}<HitOverlay scene={sceneEl} />{/snippet}</Lazy>
        {/if}
        <!-- what a shaken tree drops: a branch, now and then a wasp nest -->
        <TreeShakes bind:this={shakes} scene={sceneEl} onsting={faces.sting} {treeOf} rustle={(tr) => rustle(tr, true, true)} />
        <!-- the partner's catches and finds: their plates in the bottom stack -->
        <PartnerNews scene={sceneEl} />
        <KikimimiHost live={relay ?? demoRelay} />
        {#if WeatherC}<WeatherC where="stage" />{/if}
        {#if nhEvent?.id === 'halloween' && HalloweenC}<HalloweenC scene={sceneEl} night={nhEvent.night} />{/if}
        {#if bday.length && BirthdayC}<BirthdayC {view} people={bday} date={today} />{/if}
        {#if (wedding.arch || wedding.day) && WeddingC}<WeddingC arch={wedding.arch} day={wedding.day} date={wedding.date} />{/if}
        <Particles {season} {foliage} {tod} quiet={asleepNow} festival={ev.cherry || ev.maple} snowing={weather.sky === 'snow'} />
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
    -webkit-user-select: none; user-select: none; -webkit-touch-callout: none;
  }
  /* the island's viewport (the World fits to it); no native scroll: the finger is world3d/gestures.ts' */
  .scroller { position: absolute; inset: 0; z-index: var(--z-stage); overflow: hidden; touch-action: none; }
  /* the say button: bottom right over the sea (outside the viewport), 12px in from the side and above
     the home indicator; with しずえ's box up it sits over the box (the page's --news-lift) */
  .say-dock {
    position: absolute; z-index: 2; right: calc(var(--safe-right, 0px) + 8px);
    bottom: calc(var(--pad-bottom, 8px) + 8px + var(--news-lift, 0px));
  }
  /* the farm button: the say button's mirror at the bottom left */
  .farm-dock {
    position: absolute; z-index: 2; left: calc(var(--safe-left, 0px) + 8px);
    bottom: calc(var(--pad-bottom, 8px) + 8px + var(--news-lift, 0px));
  }
  /* the 3D island: the finger is world3d/gestures.ts' (no native scroll, no page zoom); the canvas draws what the DOM's
     art did: the ground, the water, the trees, the scenery, the flowers and the villagers' figures (their nodes stay
     as the tap areas, their marks, balloons and popups over the canvas) */
  .scene[data-r3] { touch-action: none; }
  /* (!important: over an art's own animated opacity, a high five's zap, which else showed through as a blurry 2D star) */
  /* (each also --art3d: off, inherited: the art under it waits with no download, characters/artGate.ts) */
  .scene[data-r3] :global(:is(.spr > .art, .spr .door > *, .spr .deco > *, .fl > .b, .tree > .oak)) { opacity: 0 !important; --art3d: off; }
  /* (a winter flower's snow cap is the canvas's too, world3d/objects.ts: the DOM's, 28 painted layers riding every
     scroll under the wet sky's url() tint, held a snowy scroll at ~35 fps) */
  .scene[data-r3] :global(.fl > .cap) { display: none; }
  .scene[data-r3] :global(.m3on :is([data-m3art], .official)) { opacity: 0 !important; --art3d: off; }
  .scene[data-r3] :global([data-m3]:not(.m3off) :is([data-m3art], .official)) { opacity: 0 !important; --art3d: off; }
  .scene[data-r3] :global(.mover.m3on > *) { opacity: 0 !important; --art3d: off; }
  /* (and what animates for ever under art drawn there, none of it on screen, held: a fish's wag, a cicada's buzz, the
     bottle's rock, a 3D villager's 2D bob or a sleeper's breath, but a hat's or the trick's glasses riding it, the
     characters' hidden flourishes (a sleeper's zzz: Fx ends them by its timer); else their style and layers ran every
     frame for nothing, and an endless one kept the compositor at 60 Hz. No animationend waits on them) */
  .scene[data-r3] :global(:is(.mover.m3on *, [data-m3]:not(.m3off) .bottle .rock, .vil .body:is(.bob, .sleep):not(:has(> [data-hat], > [data-tricked])), :is(.actor, .visitor) .fxa:not(.sweat) *)) { animation-play-state: paused; }
  /* (and a fish shadow's own swim, its invisible sprite's transition, its turn's too: the canvas moves its model by the
     same curves, Critters' glide, and a tap on it goes by the model's spot, so the sprite stands at its move's end at
     once; the shadows' running transitions held the page at 60 frames a second at rest whatever the canvas drew, half
     the island's main thread at rest, Chromium 4x CPU. A bug's sprite keeps its flight: one at a time, its box read) */
  .scene[data-r3] :global(.mover.shadow.m3on), .scene[data-r3] :global(.mover.shadow.m3on *) { transition: none !important; }
  /* (and the hidden art holds no compositing layer: no filter, the night's tint or a drop shadow, and none of its own
     endless animations, a campfire's flames: each made a layer over the canvas that every frame it drew recomposited) */
  .scene[data-r3] :global(:is(.spr > .art, .spr .door > *, .spr .deco > *, .fl > .b, .tree > .oak, .m3on :is([data-m3art], .official), [data-m3]:not(.m3off) :is([data-m3art], .official), .mover.m3on > *, .in3d, .notes.m3on)),
  .scene[data-r3] :global(:is(.spr > .art, .spr .door > *, .spr .deco > *, .fl > .b, .tree > .oak, .m3on :is([data-m3art], .official), [data-m3]:not(.m3off) :is([data-m3art], .official), .mover.m3on > *, .in3d, .notes.m3on) *) { filter: none !important; }
  .scene[data-r3] :global(:is(.spr > .art, .spr .door > *, .spr .deco > *, .fl > .b, .tree > .oak, .m3on [data-m3art], [data-m3]:not(.m3off) [data-m3art], .in3d, .notes.m3on)),
  .scene[data-r3] :global(:is(.spr > .art, .spr .door > *, .spr .deco > *, .fl > .b, .tree > .oak, .m3on [data-m3art], [data-m3]:not(.m3off) [data-m3art], .in3d, .notes.m3on) *) { animation: none !important; }
  .scene[data-r3] :global(.in3d) { opacity: 0 !important; --art3d: off; }
  .scene[data-r3] :global(.notes.m3on) { opacity: 0 !important; --art3d: off; }
  /* the characters' flourishes are the canvas's (world3d/Island3D actorFx); a sweat drop stays on the face */
  .scene[data-r3] :global(:is(.actor, .visitor) .fxa:not(.sweat)) { opacity: 0 !important; --art3d: off; }
  /* a 3D villager's marks are the canvas's (world3d/Island3D marks3: NH's models over its head); a ？ stays the DOM's */
  .scene[data-r3] :global(.actor[data-v3] .float[data-mark]:not([data-mark='question'])) { opacity: 0 !important; --art3d: off; }
  .scene[data-r3] .vil :global(:is(.body > .official, .body > .sil, .shadow)) { opacity: 0; --art3d: off; }
  /* a sting's swollen eye: the 3D villager's own (villager3d's sting face and lump on its head bone), never the 2D
     render's lump floating where that render's eye was */
  .scene[data-r3] :global(.actor[data-v3] [data-swollen]) { opacity: 0 !important; --art3d: off; }
  .track { position: relative; }
  /* the stage stays on screen while the track scrolls under it; its width is 390 units (cqw) and --u one unit */
  .stage {
    position: sticky; top: 0; width: 100%; overflow: hidden; container-type: inline-size; contain: layout paint;
    /* the island's layers stand over every world thing (depths run to ~21M; camera.svelte.ts OVER is 50M). Six
       significant digits at most: the CSS minifier rounds a longer number (60000080 shipped as 60000100, so the
       tint stood over the lights at 60000081); the lights (Scenery's, the fireflies', Halloween's) are 60310000 */
    --z-tint: 60300000; --z-taps: 60320000; --z-coin: 60400000; --z-popup: 60500000;
  }
  /* no WebGL: the island's line, in the middle of the scene over the sky (the panel and the HUD work as ever) */
  .no3d {
    position: absolute; left: 50%; top: 45%; translate: -50% -50%; z-index: var(--z-popup); width: min(300px, 84%);
    padding: 16px 18px; border-radius: 22px; background: var(--plate); box-shadow: 0 4px 0 var(--plate-lip); text-align: center;
  }
  .no3d p { margin: 0; font-weight: 700; font-size: var(--fs-talk); line-height: 1.5; }
  .no3d .sub { margin-top: 6px; font-weight: 400; font-size: var(--fs-s); color: var(--text-soft); }

  /* the feet at the node's origin (camera.svelte.ts places it) */
  .actor { width: 0; height: 0; transform-origin: 0 0; }
  /* in the tent: not on the island (one place at a time) */
  .actor.inside { visibility: hidden; pointer-events: none; }
  /* seated: sunk behind the seat (the bench or the stool in front covers the legs) */
  .actor[data-seat] .vil { translate: -50% calc(2px + var(--seat-drop)); }
  /* at the bar: three pull-ups, a rest, again */
  .actor[data-gym=pullup] .vil { animation: pullup 4.2s ease-in-out infinite; }
  @keyframes pullup { 0%, 64%, 100% { translate: -50% 2px; } 8%, 16% { translate: -50% calc(2px - var(--rep-lift)); } 24%, 32% { translate: -50% 2px; } 40%, 48% { translate: -50% calc(2px - var(--rep-lift)); } 56% { translate: -50% 2px; } }
  :global(.if-scene:is([data-paused], [data-covered])) .actor[data-gym=pullup] .vil { animation-play-state: paused; }
  .actor.walking { will-change: transform; }
  .vil {
    position: absolute; left: 0; bottom: 0; translate: -50% 2px; width: max-content;
    appearance: none; background: none; border: 0; padding: 8px 8px 0; margin: 0; cursor: pointer;
    border-radius: 40% 40% 20% 20%; -webkit-tap-highlight-color: transparent; min-width: 64px; min-height: 64px;
    display: flex; justify-content: center; align-items: flex-end; color: inherit;
  }
  .vil:disabled { cursor: default; }
  /* a 3D villager: its tap area its model's core (Island3D sets --v3w, --v3h in u; rounded, as the figure), not the 2D
     render's with its padding and least size: in front of the tent it covered most of the door) */
  /* (at least a thumb on screen, 48px, by the node's own --inv: written with its scale in the same frame, where
     Island3D's --v3w floor reads the camera a frame apart from the node's placing: 40px on a loaded runner mid-walk) */
  .scene[data-r3] :global(.actor[data-v3] .vil) { width: calc(var(--v3w, 46) * 100cqw / 390); height: calc(var(--v3h, 76) * 100cqw / 390); min-width: calc(48px * var(--inv, 1)); min-height: calc(48px * var(--inv, 1)); padding: 0; }
  .scene[data-r3] :global(.actor[data-v3] .vil > *) { pointer-events: none; }
  .vil:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* the time of day's tint on what the DOM draws over the canvas (the 3D island's light is its own scene's): every
     world node takes the multiply in its own filter (--tod-filter), the lights (lamps, lit windows, fireflies) none.
     Day: none. Every world node is tinted (the same multiply as the plane), but the lights: on what it draws, never on a wrapper:
     each leaf (an image, an svg, a drawn bit with no child; a wrapper's ::before / ::after). A wrapper an animation
     moves gets its own compositing layer in WebKit, which an ancestor's url() filter doesn't reach: on the node, a
     tapped bush or tree flashed untinted at night for its shake. Specificity 0: a leaf's own filter wins and takes the
     tint first (`filter: var(--leaf-tint,) drop-shadow(…)`); day: no --tod-filter, no filter. */
  :where(.stage) :global(:where(.wn) :where(svg, :not(svg *, button, .hit, .hit-trunk):not(:has(*)))) { --leaf-tint: var(--tod-filter); filter: var(--leaf-tint); }
  :where(.stage) :global(:where(.wn) :where(:not(svg *, [data-hit-min]):has(*))::before),
  :where(.stage) :global(:where(.wn) :where(:not(svg *, [data-hit-min]):has(*))::after) { filter: var(--tod-filter); }
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
  .edge.bottom { bottom: calc(var(--safe-bottom) + 12px); }
  .tap-ring {
    position: absolute; left: 0; top: 0; width: calc(34 * var(--u)); height: calc(34 * var(--u)); translate: -50% -50%; border-radius: 50%;
    border: calc(3 * var(--u)) solid #FFF7DE; box-shadow: 0 0 0 1px rgba(120, 90, 40, .18); animation: tap-ring 400ms ease-out both;
  }
  @keyframes tap-ring { from { transform: scale(1); opacity: .95; } to { transform: scale(.35); opacity: 0; } }
  /* the partner's: their phone's tap, a softer ring */
  .tap-ring.partner { border-color: #DDEFFF; opacity: .8; }
</style>
