<script lang="ts">
  // テント: the campsite tent's inside (docs/design.md "The tent"), its own screen behind the tent's door on the island;
  // すがた over it once a mirror or a clothes wardrobe asks (ui.dress: look/DressSheet, in its own chunk).
  import TentRoom from '#lib/components/tent/TentRoom.svelte';
  import Lazy from '#lib/components/ui/Lazy.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';

  const view = $derived(week.view);
  // whose home (`?home=B`: うめ's house, `G` the guest's; none: the tent, ウェイ's)
  const q = new URLSearchParams(location.search).get('home');
  const home = q === 'B' || q === 'G' ? q : 'A';
  let dressed = $state(false);
  $effect(() => void (ui.dress && (dressed = true)));
</script>

{#if view}
  <TentRoom {view} {home} />
  {#if dressed}<Lazy load={() => import('#lib/components/look/DressSheet.svelte')}>{#snippet children(DressSheet)}<DressSheet bind:open={ui.dress} {view} />{/snippet}</Lazy>{/if}
{/if}
