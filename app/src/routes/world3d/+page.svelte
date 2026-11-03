<script lang="ts">
  // The 3D island POC's old address (/world3d): the island itself now (docs/decisions.md "The island in 3D"), with
  // whatever else the link asked for (?demo, ?stats…).
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';

  onMount(() => {
    const q = new URLSearchParams(location.search);
    q.delete('island');
    const qs = q.toString();
    location.replace(`${resolve('/')}${qs ? `?${qs}` : ''}`);
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>
