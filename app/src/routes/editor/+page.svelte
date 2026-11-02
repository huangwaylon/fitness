<script lang="ts">
  // The layout editor (docs/island-layout.md "The editor"): unlinked, noindex, the members' only.
  import Preview3D from '#lib/components/editor/Preview3D.svelte';
  import { layout } from '#lib/store/layout.svelte.ts';
  const q = new URLSearchParams(location.search);
  const mode = q.get('view') === 'phone' ? 'phone' : 'orbit';
  let camZ = $state(Number(q.get('cam') ?? 300));
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
  <title>しまの エディター</title>
</svelte:head>

<div class="full"><Preview3D layout={layout.current} {mode} bind:camZ /></div>

<style>
  .full { position: fixed; inset: 0; }
</style>
