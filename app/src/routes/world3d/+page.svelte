<script lang="ts">
  // The 3D island POC (/tmp/world3d/design.md): unlinked, noindex, for testing on the phones. three.js and the engine
  // load only here (their own chunks); the island never imports them.
  import World3D from '#lib/components/world3d/World3D.svelte';
  import { week } from '#lib/store/week.svelte.ts';

  const view = $derived(week.view);
</script>

{#if view}<World3D {view} />{/if}
