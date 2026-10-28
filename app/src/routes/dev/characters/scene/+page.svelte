<script lang="ts">
  // Dev only: one island scene filling the frame, for the gallery's season × day/night grid
  // (each grid cell is an iframe, so each gets its own <html data-season/data-theme>).
  // /dev/characters/scene?s=winter&n=1 — different params from ?season/?theme so the
  // tab's sessionStorage theme override isn't touched.
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import IslandScene from '#lib/components/IslandScene.svelte';
  import { week } from '#lib/client/week.svelte.ts';
  import type { Season } from '#lib/client/theme.svelte.ts';

  const season = $derived((page.url.searchParams.get('s') ?? 'spring') as Season);
  const night = $derived(page.url.searchParams.get('n') === '1');

  onMount(() => {
    const apply = () => {
      const r = document.documentElement.dataset;
      r.season = season;
      r.theme = night ? 'night' : 'day';
      r.tod = night ? 'night' : 'day';
    };
    apply();
    const id = setInterval(apply, 400); // the layout's theme clock re-applies the real time
    return () => clearInterval(id);
  });
</script>

{#if week.view}
  <div class="frame"><IslandScene view={week.view} {season} {night} /></div>
{/if}

<style>
  .frame { position: fixed; inset: 0; z-index: 1000; background: var(--bg); container-type: inline-size; }
</style>
