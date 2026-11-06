<script lang="ts">
  // こたえる じかん (docs/kikimimi.md "Answering"): 20 / 30 / 60 びょう / なし in one row, the picked one yuzu; the host
  // sets it, the others see it (`readonly`).
  import type { QuizTimer } from '#lib/kikimimi/seed.ts';
  import { t } from '#lib/i18n/index.ts';

  let { timer, readonly = false, onpick }: { timer: QuizTimer; readonly?: boolean; onpick: (x: QuizTimer) => void } = $props();
  /** The answer windows in the order shown (none last). */
  const ROW: readonly QuizTimer[] = [20, 30, 60, 0];
</script>

<section class="sec" aria-labelledby="kk-timer">
  <h3 id="kk-timer" class="sec-label">{t('kiki.timer')}</h3>
  <div class="timers" role="radiogroup" aria-labelledby="kk-timer" data-kiki-timer={timer}>
    {#each ROW as x (x)}
      <button type="button" class="tm tile-btn" role="radio" aria-checked={timer === x} aria-disabled={readonly && timer !== x} data-timer={x}
        data-sfx={timer === x ? 'none' : 'tick'} onclick={() => !readonly && x !== timer && onpick(x)}>{t(`kiki.timer.${x}`)}</button>
    {/each}
  </div>
  {#if timer === 0}<p class="hint">{t('kiki.timerNone')}</p>{/if}
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .timers { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .tm { min-height: var(--hit); border-radius: var(--r-pill); font: 700 var(--fs-s)/1.1 var(--font-ui); padding: 0 4px; }
  .tm[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .tm[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
