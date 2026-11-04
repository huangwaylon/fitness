<script lang="ts">
  // くまのもり: the forest island's own screen (docs/design.md "Kuma no mori"); the island is unloaded while it's open.
  import ForestGame from '#lib/components/forest/ForestGame.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { loadForestStrings } from '#lib/i18n/forest.ts';

  const view = $derived(week.view);
  // (its strings first: no key flashes on screen)
  let strings = $state(false);
  $effect(() => {
    void loadForestStrings(i18n.locale).finally(() => (strings = true));
  });
</script>

{#if view && strings}<ForestGame {view} />{/if}
