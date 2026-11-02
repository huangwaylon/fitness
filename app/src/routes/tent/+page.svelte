<script lang="ts">
  // テント: the campsite tent's inside (docs/design.md "The tent"), its own screen behind the tent's door on the island.
  import TentRoom from '#lib/components/tent/TentRoom.svelte';
  import { week } from '#lib/store/week.svelte.ts';

  const view = $derived(week.view);
  // whose home (`?home=B`: うめ's house, `G` the guest's; none: the tent, ウェイ's)
  const q = new URLSearchParams(location.search).get('home');
  const home = q === 'B' || q === 'G' ? q : 'A';
</script>

{#if view}<TentRoom {view} {home} />{/if}
