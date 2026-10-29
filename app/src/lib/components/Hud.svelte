<script lang="ts">
  // 島's HUD (v5 §3), NH island-view light: the corner clock (plain text, no pill) with the sync chip under it
  // only when sync is not ok, the score ribbon (a copy of the NH map's yellow title banner: the screen's one
  // focal point) and the bare NookPhone. After a check-in the ribbon counts up (the focus beat).
  import { untrack } from 'svelte';
  import HelpButton from './HelpButton.svelte';
  import SyncPill from './SyncPill.svelte';
  import { now, reducedMotion } from './motion/clock.ts';
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

  // Clock: device time (or ?date=), refreshed every 20 s.
  let time = $state('');
  $effect(() => {
    const tick = () => {
      const d = now();
      time = `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
    };
    tick();
    const id = setInterval(tick, 20_000);
    return () => clearInterval(id);
  });
  const date = $derived.by(() => {
    const [, m, d] = today.split('-').map(Number);
    const w = new Date(Date.UTC(+today.slice(0, 4), m - 1, d)).getUTCDay() || 7;
    return t('hud.date', { m, d, w: t(`weekday.${w}`) });
  });

  // Count-up on a rise (instant under reduced motion and on first paint).
  let shown = $state(untrack(() => score));
  let beat = $state(0);
  $effect(() => {
    const to = score;
    const from = untrack(() => shown);
    if (to <= from || reducedMotion()) {
      shown = to;
      return;
    }
    untrack(() => (beat += 1));
    const t0 = performance.now();
    let raf = 0;
    const step = (ms: number) => {
      const k = Math.min(1, (ms - t0) / 900);
      shown = Math.round(from + (to - from) * (1 - (1 - k) ** 3));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  });
</script>

<div class="hud">
  <div class="corner">
    <span class="clock money" aria-hidden="true">{time}<small>{date}</small></span>
    <SyncPill />
  </div>
  <HelpButton bind:open={phoneOpen} />
</div>
<div class="ribbon-wrap">
  {#key beat}
    <p class="ribbon" class:beat={beat > 0} role="status" aria-label={t('hud.score', { score })}>
      <span class="wk" aria-hidden="true">{t('hud.week')}</span><b class="money" aria-hidden="true">{shown}<small>/100</small></b>
    </p>
  {/key}
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
  /* The NH map title banner: a yuzu band, darker swallow-tails tucked behind each end. */
  .ribbon {
    position: relative; margin: 0; height: 36px; padding: 0 22px; display: flex; align-items: center; gap: 10px;
    background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); box-shadow: 0 3px 0 var(--c-yuzu-lip);
  }
  .ribbon::before, .ribbon::after {
    content: ''; position: absolute; z-index: -1; top: 9px; width: 24px; height: 30px; background: var(--c-yuzu-lip);
  }
  .ribbon::before { left: -16px; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 38% 50%); }
  .ribbon::after { right: -16px; clip-path: polygon(0 0, 100% 0, 62% 50%, 100% 100%, 0 100%); }
  .wk { font: 700 var(--fs-body)/1 var(--font-ui); }
  .ribbon b { font-size: var(--fs-title); }
  .ribbon small { font-size: var(--fs-body); margin-left: 1px; }
  .beat { animation: beat 900ms var(--ease-bounce); }
  @keyframes beat { 0%, 100% { transform: none; } 30% { transform: scale(1.12); } }
  @media (max-width: 339px) { .wk { display: none; } }
</style>
