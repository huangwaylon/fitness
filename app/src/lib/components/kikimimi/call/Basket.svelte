<script lang="ts">
  // ようじ でんわ's payoff (docs/kikimimi-engine.md "ようじ でんわ"): the errand's basket filling with what was caught,
  // a tag a memo row: caught (popping in, its right answer in Japanese), missed (set back, dashed), or still to come
  // (round 2's before its reveal: a blank tag); only the round just revealed drops in. No reward of any kind: the round
  // is its own payoff.
  import type { BasketTag } from './board.ts';
  import { t } from '#lib/i18n/index.ts';

  let { tags }: { tags: readonly BasketTag[] } = $props();
  const caught = $derived(tags.filter((x) => x.state === 'caught').length);
</script>

<div class="basket" data-kiki-basket={caught} data-of={tags.length}>
  <p class="head"><span class="ic" aria-hidden="true">🧺</span><b>{t('kiki.call.basket')}</b><span class="n">{caught} / {tags.length}</span></p>
  <ul class="tags">
    {#each tags as tag, k (tag.n)}
      <li class="tag" class:fresh={tag.fresh} data-state={tag.state} style:animation-delay="{k * 90}ms">
        {#if tag.state === 'soon'}<span class="sr-only">{t('kiki.call.soon')}</span><span aria-hidden="true">？</span>
        {:else}<span class="sym" aria-hidden="true">{tag.state === 'caught' ? '✓' : '×'}</span>{tag.label}{/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .basket { display: grid; gap: 6px; padding: 10px 12px; border-radius: 18px; background: color-mix(in srgb, var(--c-yuzu) 22%, var(--card)); }
  .head { margin: 0; display: flex; align-items: center; gap: 6px; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .ic { font-size: 22px; line-height: 1; }
  .n { margin-left: auto; font: 700 var(--fs-body)/1 var(--font-num); }
  .tags { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .tag {
    display: inline-flex; align-items: center; gap: 4px; min-height: 32px; padding: 4px 10px; border-radius: 10px; color: var(--c-ink);
    font: 700 var(--fs-s)/1.3 var(--font-ui); word-break: normal; line-break: strict;
  }
  .tag[data-state='caught'] { background: color-mix(in srgb, var(--c-leaf) 55%, var(--c-card)); }
  .tag.fresh[data-state='caught'] { animation: drop 420ms var(--ease-bounce) both; }
  .tag[data-state='missed'] { background: transparent; color: var(--text-soft); border: 2px dashed var(--edge); }
  .tag[data-state='soon'] { min-width: 44px; justify-content: center; background: transparent; color: var(--text-soft); border: 2px dashed var(--edge); }
  @keyframes drop { from { transform: translateY(-14px) scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .tag[data-state='caught'] { animation: none; } }
</style>
