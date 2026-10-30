<script lang="ts">
  // 島's HUD (v5 §3), NH island-view light: the corner clock (plain text, no pill) with the sync chip under it
  // only when sync is not ok, the score ribbon (a copy of the NH map's yellow title banner: the screen's one
  // focal point) and the bare NookPhone. After a check-in the ribbon counts up (the focus beat).
  import { tick, untrack } from 'svelte';
  import { Tween, prefersReducedMotion } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import PhoneButton from '../ui/PhoneButton.svelte';
  import SyncPill from '../ui/SyncPill.svelte';
  import { minuteNow } from '../../time/clock.ts';
  import { clockTime, weekdayOf } from '#lib/i18n/format.ts';
  import { openKiroku } from '#lib/ui-state/ui.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** My score this week, 0–100. */
    score: number;
    /** `YYYY-MM-DD` (the view's today, so the demo shows its fixed date). */
    today: string;
    /** Bindable: the launcher is open (the page pauses the scene). */
    phoneOpen?: boolean;
  }
  let { score, today, phoneOpen = $bindable(false) }: Props = $props();

  // Clock: device time (or ?date=), at each new minute.
  const time = $derived(clockTime(minuteNow()));
  const date = $derived(t('hud.date', { m: Number(today.slice(5, 7)), d: Number(today.slice(8, 10)), w: weekdayOf(today) }));

  // Count-up on a rise (instant under reduced motion, on a fall and on first paint), with a beat. The ribbon is never
  // remounted for it, so a focused ribbon keeps its focus (round 8).
  const shown = new Tween(untrack(() => score), { duration: 900, easing: cubicOut });
  let beat = $state(false);
  let ribbon: HTMLButtonElement | undefined = $state();
  $effect(() => {
    const to = score;
    const rise = to > untrack(() => shown.target) && !prefersReducedMotion.current;
    shown.set(to, { duration: rise ? 900 : 0 });
    if (rise) void replayBeat();
  });
  async function replayBeat() {
    beat = false;
    await tick();
    void ribbon?.offsetWidth; // restart the animation
    beat = true;
  }
</script>

<div class="hud">
  <div class="corner">
    <span class="clock money" aria-hidden="true">{time}<small>{date}</small></span>
    <SyncPill />
  </div>
  <PhoneButton bind:open={phoneOpen} />
</div>
<div class="ribbon-wrap">
  <!-- Tap → きろく, this week (history-and-editing.md §2). -->
  <button type="button" class="ribbon" class:beat bind:this={ribbon} aria-label={t('hud.score', { score })} onanimationend={() => (beat = false)}
    onclick={() => { openKiroku({ tab: 'body', week: 'current' }); phoneOpen = true; }}>
    <span class="wk" aria-hidden="true">{t('hud.week')}</span><b class="money" aria-hidden="true">{Math.round(shown.current)}<small>/100</small></b>
  </button>
</div>

<style>
  .hud {
    position: absolute; z-index: 8; left: 0; right: 0; top: calc(var(--safe-top) + 8px); height: 44px;
    padding: 0 calc(var(--side) - 6px + var(--safe-right)) 0 calc(var(--side) + var(--safe-left));
    display: flex; justify-content: space-between; align-items: flex-start; pointer-events: none;
  }
  .hud > :global(*) { pointer-events: auto; }
  .corner { display: grid; justify-items: start; gap: 6px; padding-top: 8px; }
  .clock { display: flex; align-items: baseline; gap: 8px; color: var(--hud); font-size: var(--fs-talk); }
  .clock small { font-size: var(--fs-body); }

  .ribbon-wrap {
    position: absolute; z-index: 7; left: 0; right: 0; top: calc(var(--safe-top) + 56px);
    display: flex; justify-content: center; pointer-events: none;
  }
  /* the sync chip (under the clock, ≤ 74px with its lip) pushes the ribbon down, so it never hides the score (sizing #2) */
  .hud:has(:global(.chip)) ~ .ribbon-wrap { top: calc(var(--safe-top) + 84px); }
  /* The NH map title banner: a yuzu band, darker swallow-tails tucked behind each end. */
  .ribbon {
    appearance: none; border: 0; cursor: pointer; font: inherit; pointer-events: auto;
    /* ≥ 44px tall (the tap target) and growing with the screen's height, like the scene (sizing #6, #8) */
    position: relative; margin: 0; height: clamp(44px, calc(5 * var(--vh1)), 50px); padding: 0 clamp(22px, 6vw, 28px);
    display: flex; align-items: center; gap: 10px;
    background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip);
  }
  .ribbon::before, .ribbon::after {
    content: ''; position: absolute; z-index: -1; top: 25%; width: 24px; height: 83%; background: var(--c-yuzu-lip);
  }
  .ribbon::before { left: -16px; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 38% 50%); }
  .ribbon::after { right: -16px; clip-path: polygon(0 0, 100% 0, 62% 50%, 100% 100%, 0 100%); }
  .wk { font: 700 clamp(.9375rem, calc(1.9 * var(--vh1)), 1.125rem)/1 var(--font-ui); }
  .ribbon b { font-size: clamp(1.5rem, calc(3.4 * var(--vh1)), 1.875rem); }
  .ribbon small { font-size: .6em; margin-left: 1px; }
  .beat { animation: beat 900ms var(--ease-bounce); }
  @keyframes beat { 0%, 100% { transform: none; } 30% { transform: scale(1.12); } }
  @media (max-width: 339px) { .wk { display: none; } }
</style>
