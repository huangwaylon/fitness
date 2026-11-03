<script lang="ts">
  // タヌキ商店: the shop's inside (docs/design.md "The shop"), its own screen behind the shop's door on the island.
  import ShopRoom from '#lib/components/shop/ShopRoom.svelte';
  import { week } from '#lib/store/week.svelte.ts';

  const view = $derived(week.view);
</script>

{#if view}<ShopRoom {view} />{/if}
