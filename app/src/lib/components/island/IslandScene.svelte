<script lang="ts">
  // The island (style guide v4 §S): an elastic sky over a fixed-aspect stage (390 × 360 units).
  //   <IslandScene {view} onme onpartner onjar onfruit paused />
  // Sky: gradient, sun / moon + stars, drifting clouds, balloon present, event fireworks.
  // Stage: sea + waves + sparkles, beach + shells, cliff, NH checker grass, the T path, the back row
  // (cedar, seasonal hedge, Resident Services, fences, mailbox, bench / bonfire, rock), the two
  // official seasonal oaks carrying our fruit, the jar, flower beds, front palms, the villagers on
  // their motion rig, particles, the time-of-day tint, and the score pills above it.
  // Height: `--scene-h` from the parent, else clamp(300px, 100dvh − var(--chrome-below, 282px), 600px).
  // Reactions: listens to the motion bus (emit('checkin-saved') etc.) and diffs `view` (partner data,
  // fruit stages, a received high-five); idle life runs while `live` and not `paused`.
  import { onMount, untrack } from 'svelte';
  import type { FruitKey, PersonId, PersonWeekView, WeekView } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import { ripeness } from '../FruitRing.svelte';
  import Villager from '../Villager.svelte';
  import OfficialArt from '../OfficialArt.svelte';
  import type { EmoteKind, Expression } from '#lib/villagers/species.ts';
  import { fruitArt } from '#lib/client/assets.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { theme, type Season } from '#lib/client/theme.svelte.ts';
  import { ui } from '#lib/client/ui.svelte.ts';
  import Sky from './Sky.svelte';
  import Sea from './Sea.svelte';
  import Ground from './Ground.svelte';
  import BackRow from './BackRow.svelte';
  import FruitTree from './FruitTree.svelte';
  import FlowerBeds from './FlowerBeds.svelte';
  import Particles from './Particles.svelte';
  import Balloon from './Balloon.svelte';
  import { JAR, TREE, VILLAGER, eventsAt, u, type Tod } from './scene.ts';
  import { actors, applyStep, react, resetAll, setAsleep, wake } from '../motion/director.svelte.ts';
  import { startIdleLife } from '../motion/idleLife.svelte.ts';
  import { on } from '../motion/bus.svelte.ts';
  import { dayKey, now, reducedMotion } from '../motion/clock.ts';
  import type { ReactionId } from '../motion/reactions.ts';

  interface Props {
    view: WeekView;
    /** My villager tapped (open 今夜のチェック). Fires 200 ms after the tap, after the squish. */
    onme?: () => void;
    /** Partner villager tapped (open the partner sheet). */
    onpartner?: () => void;
    /** Either villager tapped: 'me' | 'partner' (alternative to onme / onpartner). */
    onvillager?: (who: 'me' | 'partner') => void;
    /** Jar tapped (go to 旅の壺), after a short look-at-the-jar beat. */
    onjar?: () => void;
    /** A tree canopy tapped (the scene already shakes it and shows the fruit bubble). */
    onfruit?: (person: PersonId) => void;
    /** A sheet / overlay covers the scene: idle life and particles pause. */
    paused?: boolean;
    /** Interactive + idle life + reactions (false for gallery thumbnails). */
    live?: boolean;
    /** v3 compatibility: a cheer on rising edge plays the check-in / high-five reactions. */
    meExpression?: Expression;
    partnerExpression?: Expression;
    meEmote?: boolean | EmoteKind;
    partnerEmote?: boolean | EmoteKind;
    /** Dev gallery: force a season / night / time of day instead of the theme clock. */
    season?: Season;
    night?: boolean;
    tod?: Tod;
  }
  let {
    view, onme, onpartner, onvillager, onjar, onfruit, paused = false, live = true,
    meExpression, partnerExpression, meEmote = false, partnerEmote = false,
    season: seasonProp, night: nightProp, tod: todProp
  }: Props = $props();

  const uid = $props.id();
  const season = $derived(seasonProp ?? theme.season);
  const tod = $derived<Tod>(todProp ?? (nightProp === true ? 'night' : nightProp === false && theme.tod === 'night' ? 'day' : theme.tod));
  const night = $derived(tod === 'night');

  // The clock (device time or ?date=), refreshed every minute.
  let clock = $state(now());
  const month = $derived(clock.getMonth() + 1);
  const ev = $derived(eventsAt(clock));

  const sides = $derived<Record<'mine' | 'partner', { person: PersonWeekView; x: number; side: 'left' | 'right' }>>({
    mine: { person: view.people[view.me], x: TREE.x[view.me], side: view.me === 'A' ? 'left' : 'right' },
    partner: { person: view.people[view.partner], x: TREE.x[view.partner], side: view.partner === 'A' ? 'left' : 'right' }
  });
  const TAG: Record<PersonId, string> = { A: 'var(--tag-apricot, #FFCFB0)', B: 'var(--tag-plum, #D9C6F5)' };

  // Jar fill: share of the top rung (a little visible as soon as there is anything in it).
  const topYen = $derived(Math.max(1, ...view.jar.rungs.map((r) => r.yen), view.jar.nextRung?.yen ?? 0));
  const fill = $derived(view.jar.totalYen <= 0 ? 0 : Math.min(1, Math.max(0.12, Math.sqrt(view.jar.totalYen / topYen))));
  const coinTop = $derived(66 - fill * 44);
  const partnerFruit = $derived(
    FRUITS.reduce((a, f) => (sides.partner.person.fruits[f].pct > sides.partner.person.fruits[a].pct ? f : a), FRUITS[0])
  );

  // ---- interaction ----
  let shakeN = $state<Record<PersonId, number>>({ A: 0, B: 0 });
  let celebrate = $state<Record<PersonId, { fruit: FruitKey; n: number } | null>>({ A: null, B: null });
  let celebrateN = 0;

  function tapVillager(id: 'mine' | 'partner') {
    if (!live) return;
    if (actors[id].asleep) wake(id);
    else react(id === 'mine' ? 'R9' : 'R10');
    setTimeout(() => {
      if (id === 'mine') (onme ?? (() => onvillager?.('me')))();
      else (onpartner ?? (() => onvillager?.('partner')))();
    }, 200);
  }

  function tapJar() {
    if (live && !reducedMotion()) {
      react('R18');
      setTimeout(() => onjar?.(), 450);
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

  // v3 props: a cheer on the rising edge.
  let meWas = false;
  let partnerWas = false;
  $effect(() => {
    const m = !!meEmote || meExpression === 'cheer';
    const pa = !!partnerEmote || partnerExpression === 'cheer';
    untrack(() => {
      if (live && m && !meWas) react('R2');
      if (live && pa && !partnerWas) applyStep('partner', { actor: 'partner', motion: 'hop2', emote: 'love', fx: 'hearts' });
      meWas = m;
      partnerWas = pa;
    });
  });

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

  function asleepHour(d = now()) {
    const h = d.getHours();
    return h >= 22 || h < 5;
  }

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
    beats.forEach((r, i) => later(() => react(r), 700 + i * 2800));

    const sleepCheck = () => {
      clock = now();
      const s = asleepHour(clock);
      setAsleep('mine', s);
      setAsleep('partner', s);
    };
    sleepCheck();
    const tick = setInterval(sleepCheck, 60_000);

    const stopIdle = startIdleLife({
      paused: () => covered || hidden,
      asleep: () => actors.mine.asleep && actors.partner.asleep,
      scores: () => [view.people.A.score, view.people.B.score],
      treeShake: (id) => {
        const pid = id === 'mine' ? view.me : view.partner;
        shakeN[pid]++;
      }
    });

    // Balloon present: day only, at most once per session, after 60 s on the island.
    if (!sessionStorage.getItem('if-balloon')) {
      later(() => {
        if (tod === 'day' && !covered && !hidden && !reducedMotion()) {
          sessionStorage.setItem('if-balloon', '1');
          balloon = true;
        }
      }, 60_000);
    }

    const onVis = () => (hidden = document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      offs.forEach((o) => o());
      clearInterval(tick);
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
    <svg class="ground" viewBox="0 0 390 360" preserveAspectRatio="none" aria-hidden="true">
      <Sea {uid} {night} />
      <Ground {uid} {season} />
    </svg>

    <BackRow {season} {tod} {month} toyDay={ev.toyDay} />

    {#each ['A', 'B'] as const as pid (pid)}
      <FruitTree person={view.people[pid]} x={TREE.x[pid]} {season} delay={pid === 'B' ? -2.1 : 0} shakeN={shakeN[pid]}
        celebrate={celebrate[pid]} ontap={() => onfruit?.(pid)} />
    {/each}

    <!-- the jar: glass, coins up to the fill line, yuzu lid -->
    <svg class="jar" viewBox="0 0 54 68" style:left={u(JAR.x)} style:top={u(JAR.base)} style:width={u(54)} aria-hidden="true">
      <defs><clipPath id="{uid}-jarbody"><path d="M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z" /></clipPath></defs>
      <path d="M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z" class="glass" />
      <g clip-path="url(#{uid}-jarbody)">
        {#if fill > 0}
          <rect x="0" y={coinTop + 3} width="54" height="70" fill="#F7C548" />
          {#each Array.from({ length: Math.ceil((66 - coinTop) / 6) + 1 }) as _, row (row)}
            {#each [0, 1, 2, 3] as col (col)}
              <ellipse cx={8 + col * 13 + (row % 2) * 6} cy={coinTop + 3 + row * 6} rx="6.4" ry="2.8" class="coin" />
            {/each}
          {/each}
        {/if}
      </g>
      <path d="M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z" class="glass-line" />
      <path d="M10 30 Q8.6 38 10 46" class="glint" />
      <rect x="11" y="9" width="32" height="11" rx="4" class="lid" />
      <path d="M14 12.5 H40" class="lidline" />
      <path d="M27 9 Q29 2 36 2.6 Q33 9 27 9 Z" fill="#7BC67E" stroke="#4A3A2C" stroke-width="1.6" stroke-linejoin="round" />
    </svg>
    <button type="button" class="jartap" style:left={u(JAR.x)} style:top={u(JAR.base)}
      aria-label={t('island.jar', { yen: formatYen(view.jar.totalYen) })} onclick={tapJar}></button>

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

    <Particles {season} {tod} mode="fireflies" />
    <div class="tint"></div>
    <div class="fall"><Particles {season} {tod} festival={ev.cherry || ev.maple} /></div>

    {#each ['mine', 'partner'] as const as id (id)}
      {@const s = sides[id]}
      {#if id === 'mine'}
        <div class="pill mine" style:left={u(s.x)} style:top={u(VILLAGER.foot + 6)} style:--tag={TAG[s.person.person]} role="img"
          aria-label={t('island.score', { name: s.person.villagerName, score: s.person.score })}>
          <span class="tag">{s.person.villagerName}</span><span class="dot"></span>
          <b class="money">{s.person.score}</b><small class="money">/100</small>
        </div>
      {:else}
        <div class="pill theirs" style:left={u(s.x)} style:top={u(VILLAGER.foot + 6)} style:--tag={TAG[s.person.person]} aria-hidden="true">
          <span class="tag">{s.person.villagerName}</span><span class="dot"></span>
          <span class="pf {ripeness(s.person.fruits[partnerFruit].pct)}"><OfficialArt key={fruitArt(partnerFruit)} size="22px" eager /></span>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style>
  .scene {
    --scene-h-auto: clamp(300px, calc(100dvh - var(--chrome-below, 282px)), 600px);
    --emote-size: 44px;
    position: relative; width: 100%; height: var(--scene-h, var(--scene-h-auto)); overflow: hidden;
    container-type: inline-size; isolation: isolate;
    --stage-w: min(100cqw, 480px);
    --sky-h: max(0px, calc(var(--scene-h, var(--scene-h-auto)) - var(--stage-w) * 360 / 390 + 8px));
  }
  @media (max-height: 700px), (max-width: 359px) { .scene { --emote-size: 36px; } }
  .stage {
    position: absolute; bottom: 0; left: 0; right: 0; margin: 0 auto; width: min(100%, 480px); aspect-ratio: 390 / 360;
    container-type: inline-size; z-index: 1;
  }
  .ground { position: absolute; inset: 0; width: 100%; height: 100%; display: block; overflow: visible; }

  .jar { position: absolute; z-index: 40; translate: -50% -97%; height: auto; overflow: visible; pointer-events: none; }
  .glass { fill: #DDF2FB; fill-opacity: .8; }
  .glass-line { fill: none; stroke: #4A3A2C; stroke-width: 2.6; stroke-linejoin: round; }
  .coin { fill: #F7C548; stroke: #D9962A; stroke-width: 1.2; }
  .glint { fill: none; stroke: #fff; stroke-width: 3; stroke-linecap: round; opacity: .85; }
  .lid { fill: #FFD84D; stroke: #4A3A2C; stroke-width: 2.4; }
  .lidline { stroke: #E6B22E; stroke-width: 1.6; stroke-linecap: round; }
  .jartap {
    position: absolute; z-index: 43; translate: -50% -90%; width: max(64px, 17cqw); height: max(64px, 19cqw);
    appearance: none; background: transparent; border: 0; border-radius: 30%; cursor: pointer; -webkit-tap-highlight-color: transparent;
  }

  .actor {
    position: absolute; width: 0; height: 0;
    transform: translateX(calc(var(--walk, 0) * 100cqw / 390)); transition: transform 1600ms linear; will-change: transform;
  }
  .vil {
    position: absolute; left: 0; bottom: 0; translate: -50% 2px; width: max-content;
    appearance: none; background: none; border: 0; padding: 8px 8px 0; margin: 0; cursor: pointer;
    border-radius: 40% 40% 20% 20%; -webkit-tap-highlight-color: transparent; min-width: 64px; min-height: 64px;
    display: flex; justify-content: center; align-items: flex-end; color: inherit;
  }
  .vil:disabled { cursor: default; }
  .jartap:focus-visible, .vil:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }

  .tint { position: absolute; inset: 0; z-index: 80; background: var(--tod-tint); pointer-events: none; }
  .fall { position: absolute; left: 0; right: 0; bottom: 0; height: var(--scene-h, var(--scene-h-auto)); z-index: 70; pointer-events: none; }
  .scene[data-covered] .fall :global(*) { animation-play-state: paused !important; }

  /* Score pills under the villagers, above the tint. */
  .pill {
    position: absolute; z-index: 90; translate: -50% 0;
    display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
    padding: 3px 10px 3px 3px; border-radius: 999px;
    background: var(--c-bubble, #FFFCEB); color: var(--c-ink); border: 2px solid #EADBB8;
    box-shadow: 0 3px 0 rgba(74, 58, 44, .14);
  }
  .pill .tag { background: var(--tag); border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 700; line-height: 1.1; }
  .pill .dot { display: none; width: 10px; height: 10px; border-radius: 50%; background: var(--tag); margin-left: 4px; }
  .pill b { font-family: var(--font-num); font-weight: 700; font-size: var(--fs-h2, 1.25rem); line-height: 1; }
  .pill small { font-size: 11px; font-weight: 600; color: var(--c-ink-talk); margin-left: -3px; align-self: flex-end; padding-bottom: 2px; }
  .pill.theirs { padding-right: 5px; gap: 3px; }
  .pf { display: block; flex: none; line-height: 0; }
  .pf.bud { opacity: .6; filter: saturate(.3); }
  .pf.small { filter: saturate(.7); }
  @media (max-height: 700px), (max-width: 359px) {
    .pill small { display: none; }
  }
  @media (max-width: 339px) {
    .pill .tag { display: none; }
    .pill .dot { display: block; }
  }
</style>
