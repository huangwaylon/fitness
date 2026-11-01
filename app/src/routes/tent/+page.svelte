<script lang="ts">
  // テント: the campsite tent's inside (docs/design.md "The tent"), its own screen behind the tent's door on the island.
  import TentRoom from '#lib/components/tent/TentRoom.svelte';
  import { week } from '#lib/store/week.svelte.ts';

  const view = $derived(week.view);
</script>

{#if view}<TentRoom {view} />{/if}
