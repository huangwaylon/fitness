<script lang="ts">
  // The island (style guide v4 §S, v5 §3, round 6 layout, round 7 "Pocket Camp diorama" environment:
  // docs/design/environment-style.md). A capped 3-stop sky, one NH-blue sea and a fixed-aspect stage
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
  // Reactions: listens to the motion bus (emit('checkin-saved') etc.) and diffs `view` (partner data,
  // fruit stages, a received high-five); idle life runs while `live` and not `paused`.
  import { onMount, untrack } from 'svelte';
  import type { FruitKey, PersonId, PersonWeekView, WeekView } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import { ripeness } from '../FruitRing.svelte';
  import Villager from '../Villager.svelte';
  import Fx from '../Fx.svelte';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { theme, type Season } from '#lib/client/theme.svelte.ts';
  import { defaultFoliage, type Foliage } from '#lib/client/season.ts';
  import { ui } from '#lib/client/ui.svelte.ts';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import Sky from './Sky.svelte';
  import Sea from './Sea.svelte';
  import Jar, { jarFill } from './Jar.svelte';
  import Ground from './Ground.svelte';
  import BackRow from './BackRow.svelte';
  import FruitTree from './FruitTree.svelte';
  import FlowerBeds from './FlowerBeds.svelte';
  import Particles from './Particles.svelte';
  import Balloon from './Balloon.svelte';
  import { JAR, TREE, VILLAGER, eventsAt, u, type Tod } from './scene.ts';

  /** Jar art: JAR.w wide (viewBox 54 × 68); the button's top sits that far above the base. */
  const JAR_H = (JAR.w * 68) / 54;
  import { actors, react, resetAll, setAsleep, wake } from '../motion/director.svelte.ts';
  import { startIdleLife } from '../motion/idleLife.svelte.ts';
  import { on } from '../motion/bus.svelte.ts';
  import { dayKey, minuteNow, now, reducedMotion } from '../motion/clock.ts';
  import type { ReactionId } from '../motion/reactions.ts';

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
  const night = $derived(tod === 'night');

  // The clock (device time or ?date=), at each new minute.
  const clock = $derived(minuteNow());
  const month = $derived(clock.getMonth() + 1);
  const ev = $derived(eventsAt(clock));

  // v5 §3: I stand on the left (layout slot A), my partner on the right (slot B), whichever person I am.
  const slot = (pid: PersonId): 'A' | 'B' => (pid === view.me ? 'A' : 'B');
  const sides = $derived<Record<'mine' | 'partner', { person: PersonWeekView; x: number; side: 'left' | 'right' }>>({
    mine: { person: view.people[view.me], x: VILLAGER.x.A, side: 'left' },
    partner: { person: view.people[view.partner], x: VILLAGER.x.B, side: 'right' }
  });

  // Jar (U5). `view.jar.totalYen` already counts an open harvest, but its yen are "in the jar" only
  // once I tap 壺に入れる: until then the island shows the total without this week's jar share. When
  // the harvest closes, the jar waits until the overlay is gone, then the coins rise (CSS transition)
  // with sparkles and a "+¥" pop.
  const harvestYen = $derived.by(() => {
    const h = view.harvest;
    if (!h || h.confirmedBy.includes(view.me)) return 0;
    return h.payout.A.fruitYen + h.payout.B.fruitYen + h.payout.teamYen;
  });
  const targetYen = $derived(Math.max(0, view.jar.totalYen - harvestYen));
  // svelte-ignore state_referenced_locally
  let jarYen = $state(targetYen);
  let jarGain = $state<{ yen: number; n: number } | null>(null);
  $effect(() => {
    const target = targetYen;
    if (covered || target === untrack(() => jarYen)) return;
    const t = setTimeout(() => {
      const gain = target - jarYen;
      jarYen = target;
      if (gain > 0 && live && !reducedMotion()) jarGain = { yen: gain, n: (jarGain?.n ?? 0) + 1 };
    }, untrack(() => jarYen) < target && live ? 450 : 0);
    return () => clearTimeout(t);
  });
  // The coin stack is drawn full and slid down by (1 − fill), so a change animates.
  const fill = $derived(jarFill(jarYen, view.jar));
  /** The plate counts up to the new total (no jump), in step with the coins rising. */
  // svelte-ignore state_referenced_locally
  const plateYen = new Tween(jarYen, { duration: 1200, easing: cubicOut });
  $effect(() => {
    plateYen.set(jarYen, { duration: live && !reducedMotion() ? 1200 : 0 });
  });
  /** Press squash on the jar (pointer down), released with a springy overshoot. */
  let pressed = $state(false);

  // ---- interaction ----
  let shakeN = $state<Record<PersonId, number>>({ A: 0, B: 0 });
  let celebrate = $state<Record<PersonId, { fruit: FruitKey; n: number } | null>>({ A: null, B: null });
  let celebrateN = 0;

  function tapVillager(id: 'mine' | 'partner') {
    if (!live) return;
    if (actors[id].asleep) wake(id);
    else react(id === 'mine' ? 'R9' : 'R10');
    later(() => {
      if (id === 'mine') onme?.();
      else onpartner?.();
    }, 200);
  }

  /** Tap: squash (pointer down, 80ms), spring back, the villagers glance at the jar (R18) during the morph
   *  and, 90ms later (no dead wait), the route changes: the page zooms about the jar (client/jarTransition.ts)
   *  and this jar morphs into the 旅の壺 hero jar when that one is <Jar name="jar">. */
  function tapJar() {
    pressed = false;
    if (live && !reducedMotion()) {
      react('R18');
      later(() => onjar?.(), 90);
    } else onjar?.();
  }

  // ---- reactions from the view diff (never on the first render) ----
  let prev: WeekView | null = null;
  $effect(() => {
    const v = view;
    untrack(() => {
      const p = prev;
      prev = v;
      if (!live || !p || p.weekKey !== v.weekKey || p.me !== v.me) return;
      diff(p, v);
    });
  });

  function diff(p: WeekView, v: WeekView) {
    if (v.highFivesToday > p.highFivesToday) return later(() => react('R5'), 700);
    for (const who of ['mine', 'partner'] as const) {
      const pid = who === 'mine' ? v.me : v.partner;
      const a = p.people[pid].fruits, b = v.people[pid].fruits;
      const ripeNow = FRUITS.filter((f) => b[f].pct >= 100);
      const newlyRipe = FRUITS.filter((f) => b[f].pct >= 100 && a[f].pct < 100);
      const stagedUp = FRUITS.filter((f) => ripeness(b[f].pct) !== ripeness(a[f].pct) && b[f].pct > a[f].pct);
      const swap = who === 'partner';
      if (newlyRipe.length && ripeNow.length === 4) {
        react('R8', swap);
        return;
      }
      if (newlyRipe.length) {
        celebrate[pid] = { fruit: newlyRipe[0], n: ++celebrateN };
        react('R6', swap);
        return;
      }
      if (stagedUp.length) {
        react('R7', swap);
        return;
      }
    }
    if (v.people[v.partner].score > p.people[v.partner].score) react('R3');
  }

  // ---- timers, bus, idle life ----
  const pending = new Set<ReturnType<typeof setTimeout>>();
  function later(fn: () => void, ms: number) {
    const t = setTimeout(() => {
      pending.delete(t);
      fn();
    }, ms);
    pending.add(t);
  }

  let hidden = $state(false);
  let balloon = $state(false);
  let devFireworks = $state(false);
  const covered = $derived(paused || ui.overlay);
  /* both villagers asleep: the zzz loops join the idle budget, so particles thin out to one */
  const asleepNow = $derived(actors.mine.asleep && actors.partner.asleep);

  function asleepHour(d = now()) {
    const h = d.getHours();
    return h >= 22 || h < 5;
  }

  // Naps 22:00–5:00, checked at each new minute (a tap wakes a villager for a moment; director.svelte.ts).
  $effect(() => {
    if (!live) return;
    const s = asleepHour(clock);
    untrack(() => {
      setAsleep('mine', s);
      setAsleep('partner', s);
    });
  });

  function once(key: string): boolean {
    const k = `if-${key}`;
    const day = dayKey();
    if (localStorage.getItem(k) === day) return false;
    localStorage.setItem(k, day);
    return true;
  }

  function greet() {
    if (once('open')) react('R1');
  }

  onMount(() => {
    if (!live) return;
    const offs = [
      on('open', greet),
      on('checkin-saved', () => react('R2')),
      on('highfive-sent', () => react('R4')),
      on('highfive-received', () => react('R5')),
      on('sync-error', () => react('R17')),
      on('dev:react', (id) => {
        if (id === 'R13') {
          setAsleep('mine', !actors.mine.asleep);
          setAsleep('partner', !actors.partner.asleep);
        } else if (id === 'R14') wake('mine');
        else if (id) react(id as ReactionId);
      }),
      on('dev:balloon', () => (balloon = true)),
      on('dev:fireworks', () => (devFireworks = !devFireworks))
    ];

    // Startup beats, spaced so they never overlap: greeting, morning stretch, evening nudge, low week.
    const h = now().getHours();
    const me = view.people[view.me];
    const checkedIn = (me.habits?.ticksByDate[view.today] ?? []).length > 0;
    const wd = now().getDay();
    const beats: ReactionId[] = [];
    if (!asleepHour()) {
      if (once('open')) beats.push('R1');
      if (h >= 5 && h < 9 && once('morning')) beats.push('R11');
      if (h >= 18 && h < 22 && !checkedIn && once('evening')) beats.push('R12');
      if (wd >= 4 && wd <= 6 && me.score < 30 && once('lowweek')) beats.push('R15');
    }
    // the director's event queue plays them one at a time
    later(() => beats.forEach((r) => react(r)), 700);


    const stopIdle = startIdleLife({
      paused: () => covered || hidden,
      asleep: () => actors.mine.asleep && actors.partner.asleep,
      night: () => tod === 'night',
      scores: () => [view.people.A.score, view.people.B.score],
      treeShake: (id) => {
        const pid = id === 'mine' ? view.me : view.partner;
        shakeN[pid]++;
      }
    });

    // Balloon present (A8: a bit more often): day only, first after 45 s on the island, then every
    // 4 min, at most 3 per session.
    const balloonTry = (ms: number) =>
      later(() => {
        const n = Number(sessionStorage.getItem('if-balloon') ?? 0);
        if (n >= 3) return;
        if (tod === 'day' && !covered && !hidden && !reducedMotion() && !balloon) {
          sessionStorage.setItem('if-balloon', String(n + 1));
          balloon = true;
          balloonTry(240_000);
        } else balloonTry(30_000);
      }, ms);
    balloonTry(45_000);

    const onVis = () => (hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      offs.forEach((o) => o());
      stopIdle();
      for (const t of pending) clearTimeout(t);
      document.removeEventListener('visibilitychange', onVis);
      resetAll();
    };
  });
</script>

<div class="if-scene scene" data-season={season} data-tod={tod} data-paused={hidden || undefined} data-covered={covered || undefined}>
  <Sky {tod} fireworks={ev.fireworks || ev.newYear || devFireworks}>
    {#if balloon}<Balloon ondone={() => (balloon = false)} />{/if}
  </Sky>

  <div class="stage">
    <Sea />
    <svg class="ground" viewBox="0 0 390 360" preserveAspectRatio="none" aria-hidden="true">
      <Ground {uid} {season} />
    </svg>

    <BackRow {season} {month} toyDay={ev.toyDay} />

    {#each ['A', 'B'] as const as pid (pid)}
      <FruitTree person={view.people[pid]} x={TREE.x[slot(pid)]} {foliage} shakeN={shakeN[pid]}
        celebrate={celebrate[pid]} />
    {/each}

    <!-- the jar (v5 §5, Jar.svelte: the one jar drawing). Jar + plate are one button, the doorway to 旅の壺. -->
    <button type="button" class="jar" class:pressed style:left={u(JAR.x)} style:top={u(JAR.base - JAR_H)} disabled={!live}
      aria-label={t('island.jar', { yen: formatYen(jarYen) })} onclick={tapJar}
      onpointerdown={() => live && (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
      <span class="squash"><Jar {fill} width={u(JAR.w)} name={live ? 'jar' : undefined} /></span>
      <span class="plate"><b class="money">{formatYen(Math.round(plateYen.current))}</b><svg class="go" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" /><path d="M6.4 4.6 L11 8 L6.4 11.4 Z" /></svg></span>
    </button>
    {#if jarGain}
      {#key jarGain.n}
        <span class="jargain" style:left={u(JAR.x)} style:top={u(JAR.base - JAR_H - 4)} aria-hidden="true"
          onanimationend={(e) => e.animationName.endsWith('gain-rise') && (jarGain = null)}>
          <span class="fxa"><Fx kind="sparkles" spread={u(46)} /></span>
          <b class="money">+{formatYen(jarGain.yen)}</b>
        </span>
      {/key}
    {/if}

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
          onclick={() => tapVillager(id)}>
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

  /* jar + plate: one button (≥ 64px), anchored at the jar's base; the plate hangs just below it */
  .jar {
    /* above the time-of-day tint: the jar and its plate stay game-object bright (v5 §5) */
    position: absolute; z-index: 81; translate: -50% 0; display: flex; flex-direction: column; align-items: center;
    min-width: 64px; min-height: 64px; padding: 0 6px; margin: 0; appearance: none; background: none; border: 0;
    border-radius: 24px; cursor: pointer; color: inherit; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .jar:disabled { cursor: default; }
  /* press squash from the base, released with a springy overshoot (mobile-game feel) */
  .squash { display: block; transform-origin: 50% 100%; transition: transform 220ms cubic-bezier(.34, 1.56, .64, 1); }
  .jar.pressed .squash { transform: scale(.92); transition: transform 80ms var(--ease-squash); }
  .jar.pressed .plate { transform: translateY(2px); box-shadow: 0 1px 0 var(--plate-lip); }
  /* the ¥ nameplate: the scene's only label (v5 §3), cream pill with a 4px lip and a leaf "go" dot */
  .plate {
    display: inline-flex; align-items: center; gap: 4px; margin-top: -2px; padding: 3px 4px 3px 10px; border-radius: var(--r-pill);
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 4px 0 var(--plate-lip); white-space: nowrap;
    transition: transform 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft); font-variant-numeric: tabular-nums;
  }
  .plate b { font: 700 12px/1.25 var(--font-num); letter-spacing: .02em; }
  .go { width: 15px; height: 15px; flex: none; }
  .go circle { fill: var(--c-leaf-lip); }
  .go path { fill: var(--c-cream); }
  .jargain {
    position: absolute; z-index: 92; translate: -50% -100%; pointer-events: none; white-space: nowrap;
    animation: gain-rise 2.4s var(--ease-soft) both; will-change: transform, opacity;
  }
  .jargain b {
    display: block; padding: 2px 10px; border-radius: 999px; font: 700 15px/1.3 var(--font-num);
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 4px 0 var(--plate-lip);
  }
  .jargain .fxa { position: absolute; left: 50%; top: 100%; width: 0; height: 0; }
  @keyframes gain-rise {
    0% { opacity: 0; transform: translateY(10px) scale(.6); } 14% { opacity: 1; transform: translateY(0) scale(1.08); }
    22% { transform: scale(1); } 78% { opacity: 1; transform: translateY(-8px); } 100% { opacity: 0; transform: translateY(-14px); }
  }
  @media (prefers-reduced-motion: reduce) { .squash, .plate { transition: none; } .jar.pressed .squash { transform: none; } }

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
  .jar:focus-visible, .vil:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

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
