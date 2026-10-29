<script lang="ts">
  // The island (style guide v4 §S, v5 §3/§5): an elastic sky over a fixed-aspect stage (390 × 360 units),
  // drawn in the flat NH map look (no strokes; depth = a lip + ground ellipses).
  //   <IslandScene {view} total={yen} onme onpartner onjar onfruit paused />
  // Sky: 2-stop gradient, flat sun / moon + stars, two clouds, balloon present, event fireworks.
  // Stage: flat map sea with ▲ marks, sand + foam line, cliff band, NH diamond grass, the T path, the
  // back row (cedar, four bushes, Resident Services, mailbox, bench / bonfire), the two orchards (three
  // official fruit trees each + the palm's coconut: my week's progress), the jar + its ¥ nameplate (the
  // scene's only label, and the doorway to 旅の壺), flower beds, front palms, the villagers (me on the
  // left, the partner on the right) on their motion rig, ≤ 3 particles and the time-of-day tint.
  // The HUD (clock, NookPhone, score ribbon) is Builder B's: it overlays the sky; clouds and the sun
  // keep below it (Clouds.svelte --cloud-lane, ≈ 100px under the safe area).
  // Height: `--scene-h` from the parent, else clamp(300px, 100dvh − var(--chrome-below, 282px), 600px).
  // Reactions: listens to the motion bus (emit('checkin-saved') etc.) and diffs `view` (partner data,
  // fruit stages, a received high-five); idle life runs while `live` and not `paused`.
  import { onMount, untrack } from 'svelte';
  import type { FruitKey, PersonId, PersonWeekView, WeekView } from '#lib/types.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import { ripeness } from '../FruitRing.svelte';
  import Villager from '../Villager.svelte';
  import Fx from '../Fx.svelte';
  import type { EmoteKind, Expression } from '#lib/villagers/species.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { theme, type Season } from '#lib/client/theme.svelte.ts';
  import { defaultFoliage, type Foliage } from '#lib/client/season.ts';
  import { ui } from '#lib/client/ui.svelte.ts';
  import Sky from './Sky.svelte';
  import Sea from './Sea.svelte';
  import Ground from './Ground.svelte';
  import BackRow from './BackRow.svelte';
  import FruitTree from './FruitTree.svelte';
  import FlowerBeds from './FlowerBeds.svelte';
  import Particles from './Particles.svelte';
  import Balloon from './Balloon.svelte';
  import { JAR, ORCHARD, PALM, TREE, VILLAGER, eventsAt, u, type Tod } from './scene.ts';

  /** Jar art: 60u wide (viewBox 54 × 68), so 75.6u tall; the button's top sits that far above the base. */
  const JAR_H = (60 * 68) / 54;
  const JAR_BODY = 'M13 18 Q4 24 4 36 V58 Q4 66 12 66 H42 Q50 66 50 58 V36 Q50 24 41 18 Z';
  import { actors, applyStep, react, resetAll, setAsleep, wake } from '../motion/director.svelte.ts';
  import { startIdleLife } from '../motion/idleLife.svelte.ts';
  import { on } from '../motion/bus.svelte.ts';
  import { dayKey, now, reducedMotion } from '../motion/clock.ts';
  import type { ReactionId } from '../motion/reactions.ts';

  interface Props {
    view: WeekView;
    /** Total in the jar, shown on the jar plate (defaults to view.jar.totalYen minus an unconfirmed harvest). */
    total?: number;
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
    /** Oak foliage (defaults to the season's signature look when `season` is forced, else the clock). */
    foliage?: Foliage;
    night?: boolean;
    tod?: Tod;
  }
  let {
    view, total, onme, onpartner, onvillager, onjar, onfruit, paused = false, live = true,
    meExpression, partnerExpression, meEmote = false, partnerEmote = false,
    season: seasonProp, foliage: foliageProp, night: nightProp, tod: todProp
  }: Props = $props();

  const uid = $props.id();
  const season = $derived(seasonProp ?? theme.season);
  const foliage = $derived<Foliage>(foliageProp ?? (seasonProp ? defaultFoliage(seasonProp) : theme.foliage));
  const tod = $derived<Tod>(todProp ?? (nightProp === true ? 'night' : nightProp === false && theme.tod === 'night' ? 'day' : theme.tod));
  const night = $derived(tod === 'night');

  // The clock (device time or ?date=), refreshed every minute.
  let clock = $state(now());
  const month = $derived(clock.getMonth() + 1);
  const ev = $derived(eventsAt(clock));

  // v5 §3: I stand on the left (layout slot A), my partner on the right (slot B), whichever person I am.
  const slot = (pid: PersonId): 'A' | 'B' => (pid === view.me ? 'A' : 'B');
  const sides = $derived<Record<'mine' | 'partner', { person: PersonWeekView; x: number; side: 'left' | 'right' }>>({
    mine: { person: view.people[view.me], x: TREE.x.A, side: 'left' },
    partner: { person: view.people[view.partner], x: TREE.x.B, side: 'right' }
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
  const targetYen = $derived(total ?? Math.max(0, view.jar.totalYen - harvestYen));
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
  // Fill: share of the top rung (a little visible as soon as there is anything in it). The coin stack is
  // drawn full and slid down by (1 − fill), so a change animates.
  const topYen = $derived(Math.max(1, ...view.jar.rungs.map((r) => r.yen), view.jar.nextRung?.yen ?? 0));
  const fill = $derived(jarYen <= 0 ? 0 : Math.min(1, Math.max(0.12, Math.sqrt(jarYen / topYen))));
  const COIN_FULL = 22;

  // ---- interaction ----
  let shakeN = $state<Record<PersonId, number>>({ A: 0, B: 0 });
  let celebrate = $state<Record<PersonId, { fruit: FruitKey; n: number } | null>>({ A: null, B: null });
  let celebrateN = 0;

  function tapVillager(id: 'mine' | 'partner') {
    if (!live) return;
    if (actors[id].asleep) wake(id);
    else react(id === 'mine' ? 'R9' : 'R10');
    later(() => {
      if (id === 'mine') (onme ?? (() => onvillager?.('me')))();
      else (onpartner ?? (() => onvillager?.('partner')))();
    }, 200);
  }

  function tapJar() {
    if (live && !reducedMotion()) {
      react('R18');
      later(() => onjar?.(), 450);
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
    // the director's event queue plays them one at a time
    later(() => beats.forEach((r) => react(r)), 700);

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
      <Sea {uid} />
      <Ground {uid} {season} />
    </svg>

    <BackRow {season} {tod} {month} toyDay={ev.toyDay} />

    {#each ['A', 'B'] as const as pid (pid)}
      <FruitTree person={view.people[pid]} trees={ORCHARD[slot(pid)]} {foliage} palm={PALM[slot(pid)]} shakeN={shakeN[pid]}
        celebrate={celebrate[pid]} ontap={() => onfruit?.(pid)} />
    {/each}

    <!-- the jar (v5 §5): flat glass with one highlight, coins up to the fill line, a yuzu lid; no ink.
         Jar + plate are one button, the doorway to 旅の壺. -->
    <button type="button" class="jar" style:left={u(JAR.x)} style:top={u(JAR.base - JAR_H)} disabled={!live}
      aria-label={t('island.jar', { yen: formatYen(jarYen) })} onclick={tapJar}>
      <svg class="jarart" viewBox="0 0 54 68" style:width={u(60)} aria-hidden="true">
        <defs><clipPath id="{uid}-jarbody"><path d={JAR_BODY} /></clipPath></defs>
        <path d={JAR_BODY} class="glass-lip" />
        <path d={JAR_BODY} class="glass" transform="translate(0 -2.4)" />
        <g clip-path="url(#{uid}-jarbody)">
          <g class="coins" style:transform="translateY({((1 - fill) * 44 + (fill > 0 ? 0 : 8)).toFixed(2)}px)">
            <rect x="0" y={COIN_FULL + 3} width="54" height="70" class="coinfill" />
            {#each Array.from({ length: 8 }) as _, row (row)}
              {#each [0, 1, 2, 3] as col (col)}
                <ellipse cx={8 + col * 13 + (row % 2) * 6} cy={COIN_FULL + 2 + row * 6} rx="5.8" ry="2.4" class="coin" />
              {/each}
            {/each}
          </g>
        </g>
        <path d="M8.6 30 Q7.4 38 8.6 47 Q9.4 48.6 10.8 47.4 Q9.8 38 11.2 30.6 Q10.2 28.6 8.6 30 Z" class="glint" />
        <rect x="11" y="10.4" width="32" height="10" rx="4" class="lid-lip" />
        <rect x="11" y="8" width="32" height="10" rx="4" class="lid" />
        <path d="M27 8 Q29 1 36 1.6 Q33 8 27 8 Z" class="jarleaf" />
      </svg>
      <span class="plate"><b class="money">{formatYen(jarYen)}</b><svg class="go" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" /><path d="M6.4 4.6 L11 8 L6.4 11.4 Z" /></svg></span>
    </button>
    {#if jarGain}
      {#key jarGain.n}
        <span class="jargain" style:left={u(JAR.x)} style:top={u(JAR.base - 72)} aria-hidden="true"
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

    <Particles {season} {foliage} {tod} mode="fireflies" />
    <div class="tint"></div>
    <div class="fall"><Particles {season} {foliage} {tod} festival={ev.cherry || ev.maple} /></div>
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

  /* jar + plate: one button (≥ 64px), anchored at the jar's base; the plate hangs just below it */
  .jar {
    position: absolute; z-index: 43; translate: -50% 0; display: flex; flex-direction: column; align-items: center;
    min-width: 64px; min-height: 64px; padding: 0 6px; margin: 0; appearance: none; background: none; border: 0;
    border-radius: 24px; cursor: pointer; color: inherit; -webkit-tap-highlight-color: transparent;
    transition: transform 160ms var(--ease-soft, ease-out);
  }
  .jar:active { transform: scale(.95); }
  .jar:disabled { cursor: default; }
  .jarart { display: block; height: auto; overflow: visible; }
  .glass-lip { fill: var(--jar-glass-lip); }
  .glass { fill: var(--jar-glass); }
  .coinfill { fill: var(--jar-coin-rim); }
  .coin { fill: var(--jar-coin); }
  .coins { transition: transform 1.4s var(--ease-soft, cubic-bezier(.3, 1.3, .5, 1)); }
  .glint { fill: #fff; opacity: .9; }
  .lid-lip { fill: var(--c-yuzu-lip, #E6B22E); }
  .lid { fill: var(--c-yuzu, #FFD84D); }
  .jarleaf { fill: var(--jar-leaf); }
  /* the ¥ nameplate: the scene's only label (v5 §3), cream pill with a 4px lip and a leaf "go" dot */
  .plate {
    display: inline-flex; align-items: center; gap: 4px; margin-top: -2px; padding: 3px 4px 3px 10px; border-radius: 999px;
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 3px 0 var(--plate-lip); white-space: nowrap;
  }
  .plate b { font: 700 12px/1.25 var(--font-num); letter-spacing: .02em; }
  .go { width: 15px; height: 15px; flex: none; }
  .go circle { fill: var(--c-leaf-lip, #4FB35C); }
  .go path { fill: #fff; }
  .jargain {
    position: absolute; z-index: 92; translate: -50% -100%; pointer-events: none; white-space: nowrap;
    animation: gain-rise 3s ease-out both;
  }
  .jargain b {
    display: block; padding: 2px 10px; border-radius: 999px; font: 700 15px/1.3 var(--font-num);
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 3px 0 var(--plate-lip);
  }
  .jargain .fxa { position: absolute; left: 50%; top: 100%; width: 0; height: 0; }
  @keyframes gain-rise {
    0% { opacity: 0; transform: translateY(8px) scale(.8); } 15% { opacity: 1; transform: none; }
    80% { opacity: 1; transform: translateY(-6px); } 100% { opacity: 0; transform: translateY(-10px); }
  }
  @media (prefers-reduced-motion: reduce) { .coins, .jar { transition: none; } }

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

  .tint { position: absolute; inset: 0; z-index: 80; background: var(--tod-tint); pointer-events: none; }
  /* falling leaves pass behind the villagers (z 51/52), never across their faces */
  .fall { position: absolute; left: 0; right: 0; bottom: 0; height: var(--scene-h, var(--scene-h-auto)); z-index: 50; pointer-events: none; }
  .scene[data-covered] .fall :global(*) { animation-play-state: paused !important; }

</style>
