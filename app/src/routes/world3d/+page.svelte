<script lang="ts">
  // The 3D island POC's old address (/world3d): the island itself in 3D now (?island=3d: docs/decisions.md "The island
  // in 3D"), with whatever else the link asked for (?demo, ?stats…).
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';

  onMount(() => {
    const q = new URLSearchParams(location.search);
    q.set('island', '3d');
    // (a full load: the island reads its drawing from the address when it starts)
    location.replace(`${resolve('/')}?${q}`);
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
</svelte:head>
