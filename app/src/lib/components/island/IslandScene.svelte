<script lang="ts">
  // The island (design.md §S, §1.1, round 6 layout, round 7 "Pocket Camp diorama" environment:
  // docs/design/design.md §S.3). A capped 3-stop sky, one NH-blue sea and a fixed-aspect stage
  // (390 × 360 units) anchored to the bottom, painted like the official renders (light from the upper left,
  // soft gradients and contact shadows, no strokes or lips on scenery).
  //   <IslandScene {view} onpartner onjar paused />
  // Sky: sky table per time of day, sun / moon at the upper left with a soft glow + stars, two soft clouds,
  // balloon present, event fireworks. Stage: the sea (Sea.svelte: one layer from the horizon to below the
  // bottom edge, glints), the ground (Ground.svelte: organic plateau with sea on both sides, sand crescent,
  // wet band, foam, shallows, terracotta cliff, NH grass with flecks), one hedge along the back, one plain
  // seasonal oak per person with today's fruit on the ground at its base (FruitTree), the jar + its ベル
  // nameplate in the middle (the scene's only label and the doorway to the wallet (ごほうび)), a front row of flowers, the
  // villagers (me on the left, the partner on the right) on their motion rig, ≤ 3 particles and ONE multiply
  // tint for the time of day over land and sea (the jar, stars and fireflies stay above it).
  // The HUD (sync chip, today's ベル ribbon, NookPhone) overlays the sky; clouds keep below it
  // (Clouds.svelte --cloud-lane, ≈ 100px under the safe area).
  // Layout contract (round 19, for the page): the island is CENTRED between the HUD and the bottom chrome.
  //   --scene-h       the scene's height (give it the whole page, e.g. 100dvh, and keep it stable);
  //                   fallback clamp(300px, 100dvh − var(--island-bottom), 600px).
  //   --hud-bottom    the bottom edge of the top chrome (the ribbon), from the scene's top. Default 0.
  //   --island-bottom the top edge of the bottom chrome (the phone), from the scene's bottom. Default 0.
  // The island (ISLE_TOP..ISLE_BOTTOM u: the hedge's top to the beach's foam) is centred in the band between them,
  // at most as tall as leaves ISLE_PAD px above and below it, at most as wide as keeps the sand (u 30–360) 5px
  // inside each screen edge (12px of grass on tall phones), so on a short screen it scales down instead of
  // running under the phone. The horizon sits at stage y HORIZON_U (a short open-sea strip behind the island); the
  // sea runs on under the island and behind the bottom chrome. Read back --horizon-y / --stage-top (set on
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
  import JarSpot from './JarSpot.svelte';
  import Ground from './Ground.svelte';
  import BackRow from './BackRow.svelte';
  import FruitTree from './FruitTree.svelte';
  import FlowerBeds from './FlowerBeds.svelte';
  import Particles from './Particles.svelte';
  import Balloon from './Balloon.svelte';
  import SceneTaps from './SceneTaps.svelte';
  import { IslandLife } from './islandLife.svelte.ts';
  import { TREE, VILLAGER, eventsAt, u, type Tod } from './scene.ts';
  import { actors } from '../motion/director.svelte.ts';
  import { jst, minuteNow } from '#lib/time/clock.ts';

  interface Props {
    view: WeekView;
    /** Partner villager tapped (open the partner sheet). */
    onpartner?: () => void;
    /** Jar tapped (go to ごほうび), after a short look-at-the-jar beat. */
    onjar?: () => void;
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
    view, onpartner, onjar, paused = false, live = true,
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

  // v5 §3: I stand on the left (layout slot A), my partner on the right (slot B), whichever person I am.
  const slot = (pid: PersonId): 'A' | 'B' => (pid === view.me ? 'A' : 'B');
  const sides = $derived<Record<'mine' | 'partner', { person: PersonWeekView; x: number; side: 'left' | 'right' }>>({
    mine: { person: view.people[view.me], x: VILLAGER.x.A, side: 'left' },
    partner: { person: view.people[view.partner], x: VILLAGER.x.B, side: 'right' }
  });

  const covered = $derived(paused || ui.overlay);

  // The trees' detail popups: at most one open (a tree's tap toggles it; the other tree's tap moves it there).
  // A tap anywhere else (the popup itself lets taps through, so tapping it closes it too) or Esc closes it; it never
  // times out (user 2026-10-30).
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
  /* both villagers asleep: the zzz loops join the idle budget, so particles thin out to one */
  const asleepNow = $derived(actors.mine.asleep && actors.partner.asleep);
</script>

<div class="if-scene scene" bind:this={sceneEl} data-season={season} data-tod={tod} data-paused={life.hidden || undefined} data-covered={covered || undefined}>
  <Sky {tod} fireworks={ev.fireworks || ev.newYear || life.devFireworks}>
    {#if life.balloon}<Balloon ondone={() => (life.balloon = false)} />{/if}
  </Sky>

  <div class="stage">
    <Sea />
    <svg class="ground" viewBox="0 0 390 360" preserveAspectRatio="none" aria-hidden="true">
      <Ground {uid} {season} />
    </svg>

    <BackRow {season} {month} toyDay={ev.toyDay} />

    {#each ['A', 'B'] as const as pid (pid)}
      <FruitTree person={view.people[pid]} x={TREE.x[slot(pid)]} {foliage} shakeN={life.shakeN[pid]}
        celebrate={life.celebrate[pid]} open={openTree === pid} ontoggle={(on) => (openTree = on ? pid : null)} />
    {/each}

    <!-- the jar + its plate (JarSpot): one button, the doorway to the wallet (ごほうび) -->
    <JarSpot {view} {live} {covered} {onjar} later={life.later} />

    <FlowerBeds {season} />

    {#each ['mine', 'partner'] as const as id (id)}
      {@const s = sides[id]}
      {@const a = actors[id]}
      <div class="actor" style:left={u(s.x)} style:top={u(VILLAGER.foot)} style:z-index={id === 'mine' ? 52 : 51}
        style:--walk={live ? (s.side === 'left' ? 1 : -1) * a.walkX : 0} style:--bob-delay={id === 'partner' ? '-1.2s' : '0s'}>
        <button type="button" class="vil" disabled={!live} data-sfx="self"
          aria-label={id === 'mine'
            ? t('island.me', { name: s.person.villagerName, bells: formatBells(s.person.today.bells) })
            : t('island.highfive', { name: s.person.villagerName })}
          onclick={() => life.tapVillager(id, id === 'mine' ? undefined : onpartner)}>
          <Villager person={s.person.person} villager={s.person.villager} size={u(VILLAGER.h)} eager
            actor={live ? id : undefined} side={s.side} emoteSize="var(--emote-size)" shadow animate={live} />
        </button>
      </div>
    {/each}

    <Particles {season} {foliage} {tod} quiet={asleepNow} mode="fireflies" />
    {#if live}
      <!-- scenery taps (bushes, flowers, clouds, sun / moon, sea, sand, grass): a short flourish, nothing else -->
      <SceneTaps scene={sceneEl} {season} {tod} enabled={() => !covered && !life.hidden} swallowed={() => closedBy} />
    {/if}
    <div class="tint"></div>
    <div class="fall"><Particles {season} {foliage} {tod} quiet={asleepNow} festival={ev.cherry || ev.maple} /></div>
  </div>
</div>

<style>
  .scene {
    --scene-h-auto: clamp(300px, calc(100dvh - var(--island-bottom, 0px)), 600px);
    /* emotes are game objects: 44u on the stage (resolved where used, against the stage), 36–56px (T5) */
    --emote-size: clamp(36px, calc(44 * 100cqw / 390), 56px);
    position: relative; width: 100%; height: var(--scene-h, var(--scene-h-auto)); overflow: hidden;
    container-type: inline-size; isolation: isolate;
    /* the layout (see the contract at the top of the script). The island's box in stage units: the hedge's top
       (32u) to the beach's foam (356u), centred on 194u (scene.ts ISLE). */
    --sh: var(--scene-h, var(--scene-h-auto));
    --ib: var(--island-bottom, 0px);
    --hb: var(--hud-bottom, 0px);
    --band: calc(var(--sh) - var(--ib) - var(--hb));
    --fit-w: calc((100cqw - 10px) * 390 / 330);
    --stage-w: min(calc((var(--band) - 2 * var(--isle-pad, 12px)) * 390 / 324), var(--fit-w), 560px);
    --stage-h: calc(var(--stage-w) * 360 / 390);
    --stage-top: calc(var(--hb) + var(--band) / 2 - var(--stage-w) * 194 / 390);
    /* the sky never takes more than --sky-max of the scene (sizing #6) */
    --horizon-y: max(40px, min(calc(var(--stage-top) + var(--stage-w) * 8 / 390), calc(var(--sh) * var(--sky-max, .27))));
    --sky-h: var(--horizon-y);
  }
  /* tall phones (390 × 844, 430 × 932): the stage may grow until the grass is 12px inside each edge (the beach and the
     shallows run off the sides), instead of leaving the extra height to an empty sky */
  @media (max-aspect-ratio: 1/2) { .scene { --fit-w: calc((100cqw - 24px) * 390 / 302); } }
  .stage {
    position: absolute; top: var(--stage-top); left: 50%; translate: -50% 0; width: var(--stage-w); aspect-ratio: 390 / 360;
    container-type: inline-size; z-index: 1;
    /* registered <length>s (tokens.css): resolved here against the scene, so the stage's children (whose cqw
       is the stage) read the horizon and the stage top in px */
    --if-st: var(--stage-top); --if-hy: var(--horizon-y);
  }
  .ground { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }

  .actor {
    position: absolute; width: 0; height: 0;
    transform: translateX(calc(var(--walk, 0) * 100cqw / 390)); transition: transform var(--dur-walk) linear; will-change: transform;
  }
  .vil {
    position: absolute; left: 0; bottom: 0; translate: -50% 2px; width: max-content;
    appearance: none; background: none; border: 0; padding: 8px 8px 0; margin: 0; cursor: pointer;
    border-radius: 40% 40% 20% 20%; -webkit-tap-highlight-color: transparent; min-width: 64px; min-height: 64px;
    display: flex; justify-content: center; align-items: flex-end; color: inherit;
  }
  .vil:disabled { cursor: default; }
  .vil:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  /* ONE time-of-day layer (round 7): a multiply tint over land, sea and the sprites, from the horizon to the
     scene's bottom edge and out to both screen edges (the sky has its own table; the jar z 81, fireflies z 82
     and the stars stay above it). Day: none. */
  .tint {
    position: absolute; z-index: 80; background: var(--tod-tint); mix-blend-mode: multiply; pointer-events: none;
    top: calc(var(--if-hy) - var(--if-st)); bottom: -100vh; left: -100vw; right: -100vw;
  }
  /* villager contact shadow (round 7): radial, surface-coloured, 0.30h × 0.06h, +6% right and down; dusk:
     stretched to the right (--sh-scale) */
  .vil :global(.shadow) {
    width: calc(var(--h) * .6); height: calc(var(--h) * .12); margin-left: calc(var(--h) * -.3); bottom: calc(var(--h) * -.05);
    background: radial-gradient(closest-side, var(--sh-c), color-mix(in srgb, var(--sh-c) 70%, transparent) 50%, transparent);
    translate: calc(var(--h) * .036) calc(var(--h) * .007); transform-origin: 30% 50%;
  }
  /* falling leaves pass behind the villagers (z 51/52), never across their faces */
  .fall { position: absolute; left: 0; right: 0; bottom: 0; height: calc(var(--sh) - var(--ib)); z-index: 50; pointer-events: none; }
  .scene[data-covered] .fall :global(*) { animation-play-state: paused !important; }

</style>
