<script lang="ts">
  // はくぶつかん: the museum's inside (docs/design.md "The museum"), its own screen behind the museum's door on the island.
  import MuseumRoom from '#lib/components/museum/MuseumRoom.svelte';
  import { week } from '#lib/store/week.svelte.ts';

  const view = $derived(week.view);
</script>

{#if view}<MuseumRoom {view} />{/if}
