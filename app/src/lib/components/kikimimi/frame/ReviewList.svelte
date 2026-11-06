<script lang="ts">
  // A game's review list (docs/kikimimi.md "Results"; framework §5 ReviewList), the main learning moment: 「まちがえた
  // だけ」 (the misses only: the game's rows read it), a game's retry above the rows (`retry`: the misses again), all right
  // said when no row is left, then the game's rows (`children`). Any game's.
  import type { Snippet } from 'svelte';
  import { t } from '#lib/i18n/index.ts';

  let { missedOnly = $bindable(), none, retry, children }: {
    missedOnly: boolean;
    /** No row to show (all right, the misses only). */
    none: boolean;
    retry?: Snippet;
    children: Snippet;
  } = $props();
</script>

<section class="sec" aria-labelledby="kk-review">
  <div class="rev-head">
    <h3 id="kk-review" class="sec-label">{t('kiki.review')}</h3>
    <button type="button" class="chip" aria-pressed={missedOnly} data-kiki-missed data-sfx="tick" onclick={() => (missedOnly = !missedOnly)}>{t('kiki.missedOnly')}</button>
  </div>
  {@render retry?.()}
  {#if none}<p class="none">{t('kiki.allRight')}</p>{/if}
  {@render children()}
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .rev-head { display: flex; align-items: center; justify-content: space-between; }
  .rev-head .chip { min-height: var(--hit); }
  .none { margin: 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--leaf-text); }
</style>
