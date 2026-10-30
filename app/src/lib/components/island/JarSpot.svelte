<script lang="ts">
  // The island's jar + its ¥ nameplate: one button (≥ 64px), the doorway to 旅の壺 (v5 §5; Jar.svelte is the one jar
  // drawing). `view.jar.totalYen` already counts an open harvest, but its yen are "in the jar" only once I tap
  // 壺に入れる: until then the island shows the total without this week's jar share. When the harvest closes, the jar
  // waits until the overlay is gone, then the coins rise (CSS transition) with sparkles and a "+¥" pop, and the plate
  // counts up in step.
  import { untrack } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import type { WeekView } from '#lib/types.ts';
  import Fx from '../characters/Fx.svelte';
  import Jar, { jarFill } from './Jar.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { reducedMotion } from '../../time/clock.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';
  import { JAR, u } from './scene.ts';

  interface Props {
    view: WeekView;
    /** Interactive (false for gallery thumbnails). */
    live: boolean;
    /** A sheet or the harvest covers the scene: hold the coins until it is gone. */
    covered: boolean;
    /** Tapped (go to 旅の壺), after a short look-at-the-jar beat. */
    onjar?: () => void;
    /** The scene's timer (cleared with the scene). */
    later: (fn: () => void, ms: number) => void;
  }
  let { view, live, covered, onjar, later }: Props = $props();

  /** Jar art: JAR.w wide (viewBox 54 × 68); the button's top sits that far above the base. */
  const JAR_H = (JAR.w * 68) / 54;

  const harvestYen = $derived.by(() => {
    const h = view.harvest;
    if (!h || h.confirmedBy.includes(view.me)) return 0;
    return h.payout.A.fruitYen + h.payout.B.fruitYen + h.payout.teamYen;
  });
  const targetYen = $derived(Math.max(0, view.jar.totalYen - harvestYen));
  // svelte-ignore state_referenced_locally
  let jarYen = $state(targetYen);
  let gain = $state<{ yen: number; n: number } | null>(null);
  $effect(() => {
    const target = targetYen;
    if (covered || target === untrack(() => jarYen)) return;
    const timer = setTimeout(() => {
      const g = target - jarYen;
      jarYen = target;
      if (g > 0 && live && !reducedMotion()) gain = { yen: g, n: (gain?.n ?? 0) + 1 };
    }, untrack(() => jarYen) < target && live ? 450 : 0);
    return () => clearTimeout(timer);
  });
  // The coin stack is drawn full and slid down by (1 − fill), so a change animates.
  const fill = $derived(jarFill(jarYen, view.jar));
  // svelte-ignore state_referenced_locally
  const plateYen = new Tween(jarYen, { duration: 1200, easing: cubicOut });
  $effect(() => {
    plateYen.set(jarYen, { duration: live && !reducedMotion() ? 1200 : 0 });
  });
  /** Press squash on the jar (pointer down), released with a springy overshoot. */
  let pressed = $state(false);

  /** Tap: squash (pointer down, 80ms), spring back, the villagers glance at the jar (R18) during the morph
   *  and, 90ms later (no dead wait), the route changes: the page zooms about the jar (ui-state/jarTransition.ts)
   *  and this jar morphs into the 旅の壺 hero jar when that one is <Jar name="jar">. */
  function tap() {
    pressed = false;
    if (live && !reducedMotion()) {
      react('R18');
      later(() => onjar?.(), 90);
    } else onjar?.();
  }
</script>

<button type="button" class="jar" class:pressed style:left={u(JAR.x)} style:top={u(JAR.base - JAR_H)} disabled={!live}
  aria-label={t('island.jar', { yen: formatYen(jarYen) })} onclick={tap}
  onpointerdown={() => live && (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="squash"><Jar {fill} width={u(JAR.w)} name={live ? 'jar' : undefined} /></span>
  <span class="jar-plate"><b class="money">{formatYen(Math.round(plateYen.current))}</b><svg class="go" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" /><path d="M6.4 4.6 L11 8 L6.4 11.4 Z" /></svg></span>
</button>
{#if gain}
  {#key gain.n}
    <span class="jargain" style:left={u(JAR.x)} style:top={u(JAR.base - JAR_H - 4)} aria-hidden="true"
      onanimationend={(e) => e.animationName.endsWith('gain-rise') && (gain = null)}>
      <span class="fxa"><Fx kind="sparkles" spread={u(46)} /></span>
      <b class="money">+{formatYen(gain.yen)}</b>
    </span>
  {/key}
{/if}

<style>
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
  .jar.pressed .jar-plate { transform: translateY(2px); box-shadow: 0 1px 0 var(--plate-lip); }
  /* the ¥ nameplate: the scene's only label (v5 §3), cream pill with a 4px lip and a leaf "go" dot */
  .jar-plate {
    display: inline-flex; align-items: center; gap: 4px; margin-top: -2px; padding: 3px 4px 3px 10px; border-radius: var(--r-pill);
    background: var(--plate); color: var(--plate-ink); box-shadow: 0 4px 0 var(--plate-lip); white-space: nowrap;
    transition: transform 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft); font-variant-numeric: tabular-nums;
    /* a game object on the stage: sized in stage units (14u), 13–16px (sizing #6, T5) */
    font-size: clamp(13px, calc(14 * 100cqw / 390), 16px);
  }
  .jar-plate b { font: 700 1em/1.25 var(--font-num); letter-spacing: .02em; }
  .go { width: 1.2em; height: 1.2em; flex: none; }
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
  @media (prefers-reduced-motion: reduce) { .squash, .jar-plate { transition: none; } .jar.pressed .squash { transform: none; } }

  .jar:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
</style>
