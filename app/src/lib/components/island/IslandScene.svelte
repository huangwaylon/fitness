<script lang="ts">
  // The island (design.md §S, §1.1, round 6 layout, round 7 "Pocket Camp diorama" environment:
  // docs/design/design.md §S.3). A capped 3-stop sky, one NH-blue sea and a fixed-aspect stage
  // (390 × 360 units) anchored to the bottom, painted like the official renders (light from the upper left,
  // soft gradients and contact shadows, no strokes or lips on scenery).
  //   <IslandScene {view} onme onpartner onjar paused />
  // Sky: sky table per time of day, sun / moon at the upper left with a soft glow + stars, two soft clouds,
  // balloon present, event fireworks. Stage: the sea (Sea.svelte: one layer from the horizon to below the
  // bottom edge, glints), the ground (Ground.svelte: organic plateau with sea on both sides, sand crescent,
  // wet band, foam, shallows, terracotta cliff, NH grass with flecks), one hedge along the back, one plain
  // seasonal oak per person with the week's fruit on the ground at its base (FruitTree), the jar + its ¥
  // nameplate in the middle (the scene's only label and the doorway to 旅の壺), a front row of flowers, the
  // villagers (me on the left, the partner on the right) on their motion rig, ≤ 3 particles and ONE multiply
  // tint for the time of day over land and sea (the jar, stars and fireflies stay above it).
  // The HUD (clock, NookPhone, score ribbon) is Builder B's: it overlays the sky; clouds keep below it
  // (Clouds.svelte --cloud-lane, ≈ 100px under the safe area).
  // Layout contract (F1/F2, for the page):
  //   --scene-h       the scene's height (give it the whole page, e.g. 100dvh, and keep it stable);
  //                   fallback clamp(300px, 100dvh − var(--chrome-below, 282px), 600px).
  //   --island-bottom the band under the stage kept for the bottom chrome (dialogue + action), from the
  //                   scene's bottom edge. Keep it STABLE (the tallest chrome state), so the island never
  //                   moves when the dialogue shows or hides; the chrome overlays the sea there. Default 0.
  //                   Round 7: the stage's front beach (its last TUCK_U = 34u: sand, foam, shallows, nothing
  //                   you tap) tucks under the top of that band, so the shore meets the dialogue instead of an
  //                   empty sea band. The flowers and the villagers' feet stay above it.
  //   --sky-cap       the least sky height used to size the stage (default safe-top + min(180px, 21dvh)).
  // The stage fills the band from the sky cap to the chrome (+ the tuck), never wider than keeps the sand
  // ≥ 5px inside each screen edge (sea on both sides at 393 / 375 / 320), never narrower than the column.
  // The horizon sits at stage y HORIZON_U (a short open-sea strip behind the island), so on a tall phone the
  // spare height goes to the sky (sun + clouds), never to an empty sea band. Read back --horizon-y /
  // --stage-top (set on .if-scene) to place overlays.
  // Life (islandLife.svelte.ts): the motion bus (emit('checkin-saved') etc.), reactions to the `view` diff (partner
  // data, fruit stages, a received high-five), naps, the balloon; idle life runs while `live` and not `paused`.
  import type { PersonId, PersonWeekView, WeekView } from '#lib/types.ts';
  import Villager from '../characters/Villager.svelte';
  import { t } from '#lib/i18n/index.ts';
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
  import { IslandLife } from './islandLife.svelte.ts';
  import { TREE, VILLAGER, eventsAt, u, type Tod } from './scene.ts';
  import { actors } from '../motion/director.svelte.ts';
  import { jst, minuteNow } from '#lib/time/clock.ts';

  interface Props {
    view: WeekView;
    /** My villager tapped (open 今夜のチェック). Fires 200 ms after the tap, after the squish. */
    onme?: () => void;
    /** Partner villager tapped (open the partner sheet). */
    onpartner?: () => void;
    /** Jar tapped (go to 旅の壺), after a short look-at-the-jar beat. */
    onjar?: () => void;
    /** A sheet / overlay covers the scene: idle life and particles pause. */
    paused?: boolean;
    /** Interactive + idle life + reactions (false for gallery thumbnails). */
    live?: boolean;
    /** Dev gallery: force a season / night / time of day instead of the theme clock. */
    season?: Season;
    /** Oak foliage (defaults to the season's signature look when `season` is forced, else the clock). */
    foliage?: Foliage;
    night?: boolean;
    tod?: Tod;
  }
  let {
    view, onme, onpartner, onjar, paused = false, live = true,
    season: seasonProp, foliage: foliageProp, night: nightProp, tod: todProp
  }: Props = $props();

  const uid = $props.id();
  const season = $derived(seasonProp ?? theme.season);
  const foliage = $derived<Foliage>(foliageProp ?? (seasonProp ? defaultFoliage(seasonProp) : theme.foliage));
  const tod = $derived<Tod>(todProp ?? (nightProp === true ? 'night' : nightProp === false && theme.tod === 'night' ? 'day' : theme.tod));

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
  // `live` is fixed per scene (the gallery's thumbnails are never live).
  // svelte-ignore state_referenced_locally
  const life = new IslandLife({ view: () => view, live, covered: () => covered, night: () => tod === 'night', day: () => tod === 'day' });
  /* both villagers asleep: the zzz loops join the idle budget, so particles thin out to one */
  const asleepNow = $derived(actors.mine.asleep && actors.partner.asleep);
</script>

<div class="if-scene scene" data-season={season} data-tod={tod} data-paused={life.hidden || undefined} data-covered={covered || undefined}>
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
        celebrate={life.celebrate[pid]} />
    {/each}

    <!-- the jar + its plate (JarSpot): one button, the doorway to 旅の壺 -->
    <JarSpot {view} {live} {covered} {onjar} later={life.later} />

    <FlowerBeds {season} />

    {#each ['mine', 'partner'] as const as id (id)}
      {@const s = sides[id]}
      {@const a = actors[id]}
      <div class="actor" style:left={u(s.x)} style:top={u(VILLAGER.foot)} style:z-index={id === 'mine' ? 52 : 51}
        style:--walk={live ? (s.side === 'left' ? 1 : -1) * a.walkX : 0} style:--bob-delay={id === 'partner' ? '-1.2s' : '0s'}>
        <button type="button" class="vil" disabled={!live}
          aria-label={id === 'mine'
            ? t('island.score', { name: s.person.villagerName, score: s.person.score })
            : t('island.highfive', { name: s.person.villagerName })}
          onclick={() => life.tapVillager(id, id === 'mine' ? onme : onpartner)}>
          <Villager person={s.person.person} villager={s.person.villager} size={u(VILLAGER.h)} eager
            actor={live ? id : undefined} side={s.side} emoteSize="var(--emote-size)" shadow animate={live} />
        </button>
      </div>
    {/each}

    <Particles {season} {foliage} {tod} quiet={asleepNow} mode="fireflies" />
    <div class="tint"></div>
    <div class="fall"><Particles {season} {foliage} {tod} quiet={asleepNow} festival={ev.cherry || ev.maple} /></div>
  </div>
</div>

<style>
  .scene {
    --scene-h-auto: clamp(300px, calc(100dvh - var(--chrome-below, 282px)), 600px);
    --emote-size: 44px;
    position: relative; width: 100%; height: var(--scene-h, var(--scene-h-auto)); overflow: hidden;
    container-type: inline-size; isolation: isolate;
    /* F1/F2 layout (see the contract at the top of the script) */
    --sh: var(--scene-h, var(--scene-h-auto));
    --ib: var(--island-bottom, 0px);
    --cap: var(--sky-cap, calc(var(--safe-top) + min(180px, 21dvh)));
    /* the stage fills the band from the sky cap to the chrome (+ the 34u tuck of the front beach under it),
       at most as wide as keeps the sand (u 30–360) 5px inside each screen edge, never under the column width */
    --stage-w: max(min(100cqw, 480px), min(calc((var(--sh) - var(--ib) - var(--cap) - 12px) * 390 / 326), calc((100cqw - 10px) * 390 / 330), 560px));
    --stage-h: calc(var(--stage-w) * 360 / 390);
    --tuck: calc(var(--stage-w) * 34 / 390);
    --stage-top: calc(var(--sh) - var(--ib) + var(--tuck) - var(--stage-h));
    --horizon-y: max(40px, calc(var(--stage-top) + var(--stage-w) * 8 / 390));
    --sky-h: var(--horizon-y);
  }
  @media (max-height: 700px), (max-width: 359px) { .scene { --emote-size: 36px; } }
  .stage {
    position: absolute; bottom: calc(var(--ib) - var(--tuck)); left: 50%; translate: -50% 0; width: var(--stage-w); aspect-ratio: 390 / 360;
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
