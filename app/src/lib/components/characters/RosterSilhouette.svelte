<script lang="ts">
  // A villager whose image is missing (offline, never cached): the silhouette in the villager's colour. The colours
  // live with the names (villagers/roster.ts), out of the first load: fetched when this rare fallback shows, the
  // default tint until then.
  import Silhouette from './Silhouette.svelte';
  import type { RosterId } from '#lib/villagers/roster.ts';

  let { id, head = false, height }: { id: RosterId; head?: boolean; height: string } = $props();
  let colour = $state<string>();
  $effect(() => {
    const want = id;
    let live = true;
    void import('#lib/villagers/roster.ts').then(({ ROSTER }) => live && (colour = ROSTER[want]?.colour));
    return () => (live = false);
  });
</script>

<Silhouette {colour} {head} {height} />
