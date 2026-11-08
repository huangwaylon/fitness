<script lang="ts">
  // よみきき サンド's way in (docs/kikimimi-engine.md "よみきき サンド"): 「読んでから もう一度」 on a review row (frame/ReviewList) and
  // at a solo reveal (frame/RevealFrame), opening the lazy frame/Sandwich.svelte over the game.
  import Lazy from '#lib/components/ui/Lazy.svelte';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import type { SandPlayer } from './Sandwich.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { it, player }: { it: Item; player: SandPlayer } = $props();
  let open = $state(false);
</script>

<button type="button" class="btn small paper" data-kiki-sand-open={it.id} data-sfx="tick" onclick={() => (open = true)}>📖 {t('kiki.sand.open')}</button>
{#if open}
  <Lazy load={() => import('./Sandwich.svelte')}>{#snippet children(Sandwich)}
    <Sandwich {it} {player} onclose={() => (open = false)} />
  {/snippet}</Lazy>
{/if}

