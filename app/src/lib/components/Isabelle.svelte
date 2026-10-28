<script lang="ts">
  // Alias of Juniper.svelte (the host component), named for what it draws.
  import Juniper from './Juniper.svelte';
  import type { ComponentProps } from 'svelte';
  let props: ComponentProps<typeof Juniper> = $props();
</script>

<Juniper {...props} />
