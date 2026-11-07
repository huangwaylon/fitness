<script lang="ts">
  // A game's review list (docs/kikimimi.md "Results"; framework §5 ReviewList), the main learning moment: 「まちがえた
  // だけ」 (the misses only: the game's rows read it), a game's retry above the rows (`retry`: the misses again), all right
  // said when no row is left, then the game's rows (`children`). Any game's. A row puts よみきき サンド's way in where
  // it likes (`children`'s `sand(item)`: 「読んでから もう一度」, frame/SandButton; nothing without a `player`).
  import type { Snippet } from 'svelte';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import type { SandPlayer } from './Sandwich.svelte';
  import SandButton from './SandButton.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { missedOnly = $bindable(), none, retry, player, children }: {
    missedOnly: boolean;
    /** No row to show (all right, the misses only). */
    none: boolean;
    retry?: Snippet;
    /** The game's clips (よみきき サンド plays through them). */
    player?: SandPlayer;
    children: Snippet<[Snippet<[Item]>]>;
  } = $props();
</script>

{#snippet sand(it: Item)}{#if player}<SandButton {it} {player} />{/if}{/snippet}

<section class="sec" aria-labelledby="kk-review">
  <div class="rev-head">
    <h3 id="kk-review" class="sec-label">{t('kiki.review')}</h3>
    <button type="button" class="chip" aria-pressed={missedOnly} data-kiki-missed data-sfx="tick" onclick={() => (missedOnly = !missedOnly)}>{t('kiki.missedOnly')}</button>
  </div>
  {@render retry?.()}
  {#if none}<p class="none">{t('kiki.allRight')}</p>{/if}
  {@render children(sand)}
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .rev-head { display: flex; align-items: center; justify-content: space-between; }
  .rev-head .chip { min-height: var(--hit); }
  .none { margin: 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--leaf-text); }
</style>
