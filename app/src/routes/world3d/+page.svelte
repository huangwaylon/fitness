<script lang="ts">
  // /world3d (the 3D island POC's address, still linked from old notes): the island, with whatever else the link asked
  // for (?demo, ?stats…).
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';

  onMount(() => {
    const q = new URLSearchParams(location.search);
    const qs = q.toString();
    location.replace(`${resolve('/')}${qs ? `?${qs}` : ''}`);
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>
