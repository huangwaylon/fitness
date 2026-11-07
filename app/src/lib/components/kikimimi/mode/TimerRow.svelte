<script lang="ts">
  // こたえる じかん (docs/kikimimi.md "Answering"): 20 / 30 / 60 びょう / なし in one row, the picked one yuzu; the host
  // sets it, the others see it (`readonly`). A game with its own window (ModeMeta.window: すうじ ラッシュ's 8 s) offers
  // that and なし: any timer but none is its window, picked from なし as the default 30 s.
  import type { QuizTimer } from '#lib/kikimimi/seed.ts';
  import { t } from '#lib/i18n/index.ts';

  let { timer, window, readonly = false, onpick }: { timer: QuizTimer; window?: number; readonly?: boolean; onpick: (x: QuizTimer) => void } = $props();
  /** The answer windows in the order shown (none last). */
  const ROW = $derived<readonly QuizTimer[]>(window ? [30, 0] : [20, 30, 60, 0]);
  /** A button's on (a game's own window: any timer but none). */
  const on = (x: QuizTimer) => (window && x ? timer !== 0 : timer === x);
</script>

<section class="sec" aria-labelledby="kk-timer">
  <h3 id="kk-timer" class="sec-label">{t('kiki.timer')}</h3>
  <div class="timers" class:two={!!window} role="radiogroup" aria-labelledby="kk-timer" data-kiki-timer={timer}>
    {#each ROW as x (x)}
      <button type="button" class="tm tile-btn" role="radio" aria-checked={on(x)} aria-disabled={readonly && !on(x)} data-timer={window && x ? window : x}
        data-sfx={on(x) ? 'none' : 'tick'} onclick={() => !readonly && !on(x) && onpick(x)}>{window && x ? t('kiki.timer.s', { n: window }) : t(`kiki.timer.${x}`)}</button>
    {/each}
  </div>
  {#if timer === 0}<p class="hint">{t('kiki.timerNone')}</p>{/if}
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .timers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .timers.two { grid-template-columns: repeat(2, 1fr); }
  .tm { min-height: var(--hit); border-radius: var(--r-pill); font: 700 var(--fs-s)/1.1 var(--font-ui); padding: 0 4px; }
  .tm[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .tm[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
