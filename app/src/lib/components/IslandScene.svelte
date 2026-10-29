<script lang="ts">
  // Moved to island/IslandScene.svelte (style guide v4 §W); this path re-exports it.
  import type { ComponentProps } from 'svelte';
  import Scene from './island/IslandScene.svelte';
  let props: ComponentProps<typeof Scene> = $props();
</script>

<Scene {...props} />
