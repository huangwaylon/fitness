<script lang="ts">
  // The island (design.md "Island scene"; the "Pocket Camp diorama" environment:
  // design.md "Environment"). A capped 3-stop sky, one NH-blue sea and a fixed-aspect stage
  // (390 × 360 units) anchored to the bottom, painted like the official renders (light from the upper left,
  // soft gradients and contact shadows, no strokes or lips on scenery).
  //   <IslandScene {view} onpartner paused />
  // Sky: sky table per time of day, sun / moon at the upper left with a soft glow + stars, two soft clouds,
  // balloon present, event fireworks. Stage: the sea (Sea.svelte: one layer from the horizon to below the
  // bottom edge, glints), the ground (Ground.svelte: organic plateau with sea on both sides, sand crescent,
  // wet band, foam, shallows, terracotta cliff, NH grass with flecks), one hedge along the back, one plain
  // seasonal oak per person with today's fruit on the ground at its base (FruitTree), the middle left open (a visitor
  // stands there; the jar is in the HUD, HudJar), each person's flower bed (a bud
  // per goal, blooming once met: FlowerBeds), the
  // villagers (me on the left, the partner on the right) on their motion rig, ≤ 3 particles and ONE multiply
  // tint for the time of day over land and sea (stars and fireflies stay above it).
  // The HUD (today's ベル ribbon, with the sync chip under it when it shows) overlays the sky, the ribbon centred in the
  // sky band's middle; the clouds keep clear of it (Clouds.svelte) and the balloon flies in the lane under it.
  // Layout contract (for the page): the island is CENTRED in the visible ocean (horizon → bottom chrome).
  //   --scene-h       the scene's height (give it the whole page, e.g. 100dvh, and keep it stable);
  //                   fallback clamp(300px, 100dvh − var(--island-bottom), 600px).
  //   --hud-bottom    the bottom edge of the top chrome (the ribbon), from the scene's top. Default 0.
  //   --island-bottom the top edge of the bottom chrome (the phone), from the scene's bottom. Default 0.
  // The island (14u..356u: the hedge's top to the beach's foam) is centred between the horizon and --island-bottom,
  // at most as wide as keeps the sand (u 30–360) 5px inside each screen edge (12px of grass on tall phones) and as
  // tall as keeps its horizon 12px under --hud-bottom, so on a short screen it scales down instead of
  // running under the phone. The horizon sits at stage y HORIZON_U (a short open-sea strip behind the island), or at
  // 27% of the scene on tall phones (more open sea above and below); the sea runs on under the island and
  // behind the bottom chrome. Read back --horizon-y / --stage-top (set on
  // .if-scene) to place overlays.
  // Life (islandLife.svelte.ts): the motion bus (emit('highfive-sent') etc.), reactions to the `view` diff (partner
  // data, fruit stages, a received high-five), naps, the balloon; idle life runs while `live` and not `paused`.
  import type { PersonId, PersonWeekView, WeekView } from '#lib/types.ts';
  import Villager from '../characters/Villager.svelte';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { theme, type Season } from '#lib/ui-state/theme.svelte.ts';
  import { defaultFoliage, type Foliage } from '#lib/ui-state/season.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import Sky from './Sky.svelte';
  import Sea from './Sea.svelte';
  import Ground from './Ground.svelte';
  import BackRow from './BackRow.svelte';
  import Pond from './Pond.svelte';
  import Museum from './Museum.svelte';
  import FruitTree from './FruitTree.svelte';
  import FlowerBeds from './FlowerBeds.svelte';
  import Particles from './Particles.svelte';
  import Weather from './Weather.svelte';
  import { raining, weather } from './weatherNow.svelte.ts';
  import Balloon from './Balloon.svelte';
  import Fireworks from './Fireworks.svelte';
  import SceneTaps from './SceneTaps.svelte';
  import Talk from './Talk.svelte';
  import TreeShakes from './TreeShakes.svelte';
  import Halloween from './Halloween.svelte';
  import Wedding from './Wedding.svelte';
  import Birthday from './Birthday.svelte';
  import { HATS, birthdaysOn, isBirthday } from './birthday.ts';
  import { FIREWORKS_FROM, archOn, weddingDay } from './wedding.ts';
  import { eventAt, forcedEvent } from './events.ts';
  import { TRICK_MS } from './visitors.ts';
  import { STUNG_SWEAT_MS } from './treeShake.ts';
  import { chatLine, moodOf, pagesOf } from './chat.ts';
  import { RING_FRUITS } from '#lib/config/rules.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { IslandLife } from './islandLife.svelte.ts';
  import { BEDS, CENTRE_STAGE, TREE, VILLAGER, eventsAt, u, type Tod } from './scene.ts';
  import { HYBRIDS, hybridFor } from './care.ts';
  import { garden } from './sceneDay.ts';
  import { addDays, localDateAt } from '#lib/time/dates.ts';
  import { actors, applyStep, busy, onStep, setEmote, setHome, setMotion } from '../motion/director.svelte.ts';
  import { hitStage } from './sceneTaps.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { depthZ, walkGeo } from './walkGraph.ts';
  import { approach, attachAvatar, presence, freeze, snapHome, thaw, SNAP_HOME_MS } from './avatar.ts';
  import { clearAt, guardsU, stageGeo } from './placement.ts';
  import { onMount, untrack } from 'svelte';
  import type { ActorId } from '../motion/reactions.ts';
  import { jst, minuteNow, now } from '#lib/time/clock.ts';

  interface Props {
    view: WeekView;
    /** Partner villager tapped (open the partner sheet). */
    onpartner?: () => void;
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
    view, onpartner, paused = false, live = true,
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
  const nhEvent = $derived(eventAt(localDateAt(clock.getTime()), jst(clock).hour, forced));
  // the wedding countdown (wedding.ts): the arch on June Sundays, the day itself, its fireworks at night
  const wedding = $derived.by(() => {
    const date = localDateAt(clock.getTime()), { hour, weekday } = jst(clock);
    return { date, arch: archOn(date, weekday), day: weddingDay(date), fireworks: weddingDay(date) && hour >= FIREWORKS_FROM };
  });

  // I stand on the left (layout slot A), my partner on the right (slot B), whichever person I am.
  const slot = (pid: PersonId): 'A' | 'B' => (pid === view.me ? 'A' : 'B');
  const sides = $derived<Record<'mine' | 'partner', { person: PersonWeekView; x: number; side: 'left' | 'right' }>>({
    mine: { person: view.people[view.me], x: VILLAGER.x.A, side: 'left' },
    partner: { person: view.people[view.partner], x: VILLAGER.x.B, side: 'right' }
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
  // Villager chats (design.md "Villager chats"): a tap on mine hops (R9) and says a line in its NH personality; a tap on
  // the partner keeps opening their card. The roster (personalities) loads on the first chat, out of the first load.
  let talk = $state<ReturnType<typeof Talk>>();
  /** The scenery taps (a tap on my villager may send a flea hopping off it). */
  let sceneTaps = $state<ReturnType<typeof SceneTaps>>();
  let lastLine: string | undefined;
  async function chat(btn: HTMLElement, asleep: boolean) {
    const v = view, p = v.people[v.me];
    const { ROSTER } = await import('#lib/villagers/roster.ts');
    const entry = ROSTER[resolveLook({ villager: p.villager, person: v.me }).id];
    const mood = moodOf(entry);
    const met = RING_FRUITS.filter((f) => p.rings[f].met).length;
    const event = nhEvent?.night ? nhEvent.id : undefined;
    // my villager's own NH birthday (villagers/birthdays.ts): it says so the first time, then now and then
    const mineBday = !asleep && isBirthday(villagerBdays?.[resolveLook({ villager: p.villager, person: v.me }).id], today);
    const line = mineBday && (lastLine !== 'chat.birthday' && (!toldBday || Math.random() < 1 / 3))
      ? { key: 'chat.birthday' }
      : chatLine(mood, { hour: jst(now()).hour, met, asleep, event }, Math.random, lastLine);
    if (line.key === 'chat.birthday') toldBday = true;
    lastLine = line.key;
    // above the villager's head, clear of its emote (the ♪ of the tap) as it floats up
    if (actors.mine.walking) return; // it only speaks standing still
    const r = btn.getBoundingClientRect();
    const pages = pagesOf(line).map((k) => t(k, line.params));
    talk?.say(p.villagerName, pages, btn, { avoid: [{ x0: r.left - 6, x1: r.right + 6, y0: r.top - 56, y1: r.bottom }], colour: entry?.colour });
  }
  // Island care: a flower watered yesterday can show a hybrid colour today (care.ts; `?hybrid` in the demo shows one).
  const today = $derived(localDateAt(clock.getTime()));
  // Birthdays (birthday.ts): ours from the people config (both villagers wear NH's birthday hat, the cake, the
  // confetti, a popper on a goal), and an NH villager's own from the roster's birthdays (a small chunk of its own,
  // loaded with the island, never with the first load or the roster): that villager wears the hat and says so.
  const bday = $derived(birthdaysOn(today));
  let villagerBdays = $state<Record<string, string> | null>(null);
  let toldBday = false;
  $effect(() => {
    if (live) void import('#lib/villagers/birthdays.ts').then((m) => (villagerBdays = m.BIRTHDAYS));
  });
  const hatOf = (id: 'mine' | 'partner', person: PersonWeekView): string | null =>
    bday.length || isBirthday(villagerBdays?.[resolveLook({ villager: person.villager, person: person.person }).id], today) ? HATS[id] : null;
  const hybrid = $derived.by(() => {
    if (!live) return null;
    const row = (r: number) => (r ? BEDS[season].front : BEDS[season].back);
    const q = new URLSearchParams(location.search);
    if (q.has('hybrid') && (import.meta.env.DEV || q.has('demo'))) return { cell: '0-1', flower: HYBRIDS[row(0)][0] };
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
  // Where each villager lives (the director walks them from there and back; design.md "Walking"), and depth from the
  // feet's y: behind the trees, among the beds, on the front row, on the beach; in one band, the nearer one in front.
  // svelte-ignore state_referenced_locally
  if (live) for (const id of ['mine', 'partner'] as const) setHome(id, sides[id].x, VILLAGER.foot);
  const depth = $derived.by(() => {
    if (!live) return { mine: 'var(--z-villager-mine)', partner: 'var(--z-villager)' };
    const zm = depthZ(actors.mine.zy), zp = depthZ(actors.partner.zy);
    const mineFront = zm === zp ? actors.mine.zy >= actors.partner.zy : true;
    return { mine: String(zm + (mineFront && zm === zp ? 1 : 0)), partner: String(zp + (!mineFront ? 1 : 0)) };
  });
  // My villager walks to what I tap (avatar.ts): the walk geometry from the scene's constants, a spot is fine when a
  // villager standing there covers no control or visitor and isn't hidden behind a canopy (measured) and
  // stays on screen, and the feet's live position (a walk re-targets from mid-step).
  // with a visitor on centre stage the villagers walk around them (and wander elsewhere: wander.ts)
  // (where the visitor stands now: the ones who roam stroll a little way from centre stage; Visitor.svelte)
  const geo = walkGeo();
  let visited: { at: string; geo: ReturnType<typeof walkGeo> } | null = null;
  function geoVisited() {
    const { x, y } = actors.visitor, at = x || y ? [x, y] : [CENTRE_STAGE.x, CENTRE_STAGE.base];
    if (visited?.at !== String(at)) visited = { at: String(at), geo: walkGeo({ obstacles: [{ x0: at[0] - 18, x1: at[0] + 18, y0: at[1] - 10, y1: at[1] + 6 }] }) };
    return visited.geo;
  }
  function feet(id: 'mine' | 'partner'): readonly [number, number] {
    const el = sceneEl?.querySelector<HTMLElement>(`[data-actor="${id}"]`), g = stageGeo(sceneEl);
    if (!el || !g) return [actors[id].x, actors[id].y];
    const m = new DOMMatrixReadOnly(getComputedStyle(el).transform);
    return [Math.round(m.m41 * g.k), Math.round(m.m42 * g.k)];
  }
  function standsClear(id: ActorId, x: number, y: number): boolean {
    const g = stageGeo(sceneEl);
    if (!g || x - 22 < g.left || x + 22 > g.right || y + 4 > g.bottom) return false;
    const self = sceneEl?.querySelector(`[data-actor="${id}"] .vil`);
    // behind the trees the fruit row (down at the trunk's foot) stays on top; a canopy would hide the villager
    const behind = depthZ(y) < 30;
    // the controls themselves (not the 6px of padding placement.ts adds), against the figure (≈ 0.45 × 0.92 of its height)
    const keep = guardsU(g, -6 * g.k, (el) => el === self || (behind && el.matches('.row-btn')));
    // nor in front of a visitor (a tap meant for them would land on the villager)
    for (const v of sceneEl?.querySelectorAll('[data-visitor] .art') ?? []) {
      const r = v.getBoundingClientRect();
      if (r.width) keep.push({ x0: (r.left - g.r.left) * g.k + 4, x1: (r.right - g.r.left) * g.k - 4, y0: (r.top - g.r.top) * g.k + 4, y1: (r.bottom - g.r.top) * g.k - 4 });
    }
    return clearAt(keep, x, y - VILLAGER.h * 0.46, VILLAGER.h * 0.225, VILLAGER.h * 0.46);
  }
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
    const offStep = onStep((_id, x, y) => {
      if (covered || life.hidden) return;
      const k = hitStage(x, y).kind;
      if (k === 'sea') return;
      if (raining()) cue('footstep-splash');
      else if (k === 'sand') cue('footstep-sand');
      else cue(season === 'winter' ? 'footstep-snow' : 'footstep-grass');
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
    const { ms } = approach(TREE.x[slot(pid)], TREE.base, { motion: 'shake' });
    if (ms) life.later(() => shakes?.shaken(pid, slot(pid)), ms);
    else shakes?.shaken(pid, slot(pid));
  }
  // Fireworks (design.md "Fireworks"): our volley when both of us met all four today; a villager cheers at a burst now
  // and then (awake and not busy with something else); a tap in the sky during a show sends one more (SceneTaps).
  let fireworks = $state<ReturnType<typeof Fireworks>>();
  const allMet = $derived((['A', 'B'] as const).every((p) => RING_FRUITS.every((f) => view.people[p].rings[f].met)));
  function cheer() {
    const id = Math.random() < 0.5 ? 'mine' : 'partner';
    if (actors[id].asleep || busy(id)) return;
    applyStep(id, { actor: id, motion: 'hop', emote: Math.random() < 0.5 ? 'glee' : 'mark-sparkle' });
  }
  /* both villagers asleep: the zzz loops join the idle budget, so particles thin out to one */
  const asleepNow = $derived(actors.mine.asleep && actors.partner.asleep);
</script>

<div class="if-scene scene" bind:this={sceneEl} data-season={season} data-tod={tod} data-sky={live ? weather.sky : undefined} data-paused={life.hidden || undefined} data-covered={covered || undefined}>
  <Sky {tod}>
    {#if life.balloon}<Balloon ondone={() => (life.balloon = false)} />{/if}
  </Sky>
  {#if live}<Weather where="sky" />{/if}
  {#if live}<Fireworks bind:this={fireworks} enabled={() => !covered && !life.hidden} forced={life.devFireworks || wedding.fireworks} {allMet} {cheer} />{/if}

  <div class="stage">
    <Sea />
    <svg class="ground" viewBox="0 0 390 360" preserveAspectRatio="none" aria-hidden="true">
      <Ground {uid} {season} />
    </svg>

    <!-- the back of the island: the pond (left) and the museum (the middle), the door to the ずかん -->
    <Pond {uid} {season} floating={ev.cherry ? 'petal' : ev.maple ? 'maple' : null} />
    <Museum {live} snow={season === 'winter'} say={(name, parts, from, o) => talk?.say(name, parts, from, o)} />

    <BackRow {season} {month} toyDay={ev.toyDay} />

    {#each ['A', 'B'] as const as pid (pid)}
      <FruitTree person={view.people[pid]} x={TREE.x[slot(pid)]} {foliage} shakeN={life.shakeN[pid]}
        celebrate={life.celebrate[pid]} open={openTree === pid} ontoggle={(on) => (openTree = on ? pid : null)}
        onshake={() => shakeTree(pid)} />
    {/each}

    <FlowerBeds {season} {hybrid} people={[view.people[view.me], view.people[view.partner]]} />

    {#each ['mine', 'partner'] as const as id (id)}
      {@const s = sides[id]}
      {@const a = actors[id]}
      {@const at = live ? [a.x, a.y] : [s.x, VILLAGER.foot]}
      <div class="actor" class:walking={live && a.walking} data-actor={id} data-stung={stung[id] || null} style:--x={at[0]} style:--y={at[1]} style:transition-duration="{live ? a.walkMs : 0}ms"
        style:z-index={depth[id]} style:--bob-delay={id === 'partner' ? '-1.2s' : '0s'}>
        <button type="button" class="vil" disabled={!live} data-sfx="self"
          aria-label={id === 'mine'
            ? t('island.me', { name: s.person.villagerName, bells: formatBells(s.person.today.bells) })
            : t('island.highfive', { name: s.person.villagerName })}
          onclick={(e) => {
            if (id === 'mine') void chat(e.currentTarget, actors.mine.asleep);
            if (id === 'mine') sceneTaps?.villagerTap(e.currentTarget);
            life.tapVillager(id, id === 'mine' ? undefined : onpartner);
          }}>
          <Villager person={s.person.person} villager={s.person.villager} size={u(VILLAGER.h)} eager
            actor={live ? id : undefined} side={s.side} emoteSize="var(--emote-size)" shadow animate={live} tricked={id === 'mine' && tricked} hat={live ? hatOf(id, s.person) : null} />
        </button>
      </div>
    {/each}

    <Particles {season} {foliage} {tod} quiet={asleepNow} mode="fireflies" raining={live && raining()} />
    {#if live}
      <!-- scenery taps (bushes, flowers, clouds, sun / moon, sea, sand, grass): a short flourish, nothing else -->
      <SceneTaps bind:this={sceneTaps} scene={sceneEl} {season} {tod} enabled={() => !covered && !life.hidden} swallowed={() => closedBy}
        exercise={view.people.A.rings.peach.met || view.people.B.rings.peach.met} cake={bday.length > 0}
        skyTap={(x, y) => !!fireworks?.tap(x, y)}
        say={(name, parts, from, o) => talk?.say(name, parts, from, o)} ontrick={trick} />
      <Talk bind:this={talk} scene={sceneEl} />
      <!-- what a shaken tree drops: a branch, now and then a wasp nest -->
      <TreeShakes bind:this={shakes} scene={sceneEl} onsting={sting} />
    {/if}
    <div class="tint"></div>
    {#if live}<Weather where="stage" />{/if}
    {#if live && nhEvent?.id === 'halloween'}<Halloween scene={sceneEl} night={nhEvent.night} />{/if}
    {#if live && bday.length}<Birthday {view} people={bday} date={today} />{/if}
    {#if live && (wedding.arch || wedding.day)}<Wedding scene={sceneEl} arch={wedding.arch} day={wedding.day} date={wedding.date} />{/if}
    <div class="fall"><Particles {season} {foliage} {tod} quiet={asleepNow} festival={ev.cherry || ev.maple} snowing={live ? weather.sky === 'snow' : undefined} /></div>
  </div>
</div>

<style>
  .scene {
    --scene-h-auto: clamp(300px, calc(100dvh - var(--island-bottom, 0px)), 600px);
    /* emotes are game objects: 44u on the stage (resolved where used, against the stage), 36–56px */
    --emote-size: clamp(36px, calc(44 * 100cqw / 390), 56px);
    /* clip, not hidden: nothing may scroll the scene (a focused balloon or plate would otherwise pull it along) */
    position: relative; width: 100%; height: var(--scene-h, var(--scene-h-auto)); overflow: clip;
    container-type: inline-size; isolation: isolate;
    /* the layout (see the contract at the top of the script). The island's box in stage units: the hedge's top
       (14u) to the beach's foam (356u), centred on 185u. It is centred in the visible OCEAN, the
       horizon down to the phone's top (--sea-bottom). The horizon is the stage's own (0u, 14u above the hedge) unless
       that would make the sky taller than 27% of the scene; then it stops there and the island sits lower in
       open sea. Centred, the island's own horizon lands at --sea-bottom − 370u, so that is where it starts. */
    --sh: var(--scene-h, var(--scene-h-auto));
    --ib: var(--island-bottom, 0px);
    --hb: var(--hud-bottom, 0px);
    --sea-bottom: calc(var(--sh) - var(--ib));
    --fit-w: calc((100cqw - 10px) * 390 / 330);
    /* at most as big as keeps the island's own horizon 12px under the ribbon */
    --stage-w: min(calc((var(--sea-bottom) - var(--hb) - 12px) * 390 / 370), var(--fit-w), 560px);
    /* the sky never takes more than 27% of the scene */
    --horizon-y: max(40px, min(calc(var(--sea-bottom) - var(--stage-w) * 370 / 390), calc(var(--sh) * .27)));
    --stage-top: calc((var(--horizon-y) + var(--sea-bottom)) / 2 - var(--stage-w) * 185 / 390);
    --sky-h: var(--horizon-y);
  }
  /* tall phones (390 × 844, 430 × 932): the stage may grow until the grass is 12px inside each edge (the beach and the
     shallows run off the sides), instead of leaving the extra height to an empty sky */
  @media (max-aspect-ratio: 1/2) { .scene { --fit-w: calc((100cqw - 24px) * 390 / 302); } }
  .stage {
    position: absolute; top: var(--stage-top); left: 50%; translate: -50% 0; width: var(--stage-w); aspect-ratio: 390 / 360;
    container-type: inline-size; z-index: var(--z-stage);
    /* registered <length>s (tokens.css): resolved here against the scene, so the stage's children (whose cqw
       is the stage) read the horizon and the stage top in px */
    --if-st: var(--stage-top); --if-hy: var(--horizon-y);
  }
  .ground { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }

  /* the feet at (--x, --y) u: a walk is one transition of transform per segment (its duration set per segment) */
  .actor {
    position: absolute; left: 0; top: 0; width: 0; height: 0;
    transform: translate(calc(var(--x) * 100cqw / 390), calc(var(--y) * 100cqw / 390)); transition: transform 0ms linear;
  }
  .actor.walking { will-change: transform; }
  .vil {
    position: absolute; left: 0; bottom: 0; translate: -50% 2px; width: max-content;
    appearance: none; background: none; border: 0; padding: 8px 8px 0; margin: 0; cursor: pointer;
    border-radius: 40% 40% 20% 20%; -webkit-tap-highlight-color: transparent; min-width: 64px; min-height: 64px;
    display: flex; justify-content: center; align-items: flex-end; color: inherit;
  }
  .vil:disabled { cursor: default; }
  .vil:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* ONE time-of-day layer: a multiply tint over land, sea and the sprites, from the horizon to the
     scene's bottom edge and out to both screen edges (the sky has its own table; fireflies z 82 and the
     stars stay above it). Day: none. */
  .tint {
    position: absolute; z-index: var(--z-tint); background: var(--tod-tint); mix-blend-mode: multiply; pointer-events: none;
    top: calc(var(--if-hy) - var(--if-st)); bottom: -100vh; left: -100vw; right: -100vw;
  }
  /* villager contact shadow: radial, surface-coloured, 0.30h × 0.06h, +6% right and down; dusk:
     stretched to the right (--sh-scale) */
  .vil :global(.shadow) {
    width: calc(var(--h) * .6); height: calc(var(--h) * .12); margin-left: calc(var(--h) * -.3); bottom: calc(var(--h) * -.05);
    background: radial-gradient(closest-side, var(--sh-c), color-mix(in srgb, var(--sh-c) 70%, transparent) 50%, transparent);
    translate: calc(var(--h) * .036) calc(var(--h) * .007); transform-origin: 30% 50%;
  }
  /* falling leaves pass behind the villagers (z 51/52), never across their faces */
  /* K.K.'s show: the villagers sway to the beat (Visitor sets data-show; rotate, apart from the rig's transforms) */
  .scene:global([data-show]) .vil { transform-origin: 50% 100%; animation: sway .84s ease-in-out infinite alternate; }
  .scene:global([data-show]) .actor:nth-of-type(odd) .vil { animation-delay: -.42s; }
  @keyframes sway { from { rotate: -3deg; } to { rotate: 3deg; } }
  .fall { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--sh) - var(--ib)); z-index: var(--z-fall); pointer-events: none; }
  .scene[data-covered] .fall :global(*) { animation-play-state: paused !important; }

</style>
