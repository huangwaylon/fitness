<script module lang="ts">
  // Moved to ui/Icon.svelte (docs/design.md "Unified kit"): this thin wrapper keeps the quiet kit's old defaults (22px,
  // 1.75 stroke) until the sheets have moved onto the kit; then it goes with the rest of quiet/.
  import { isIcon as is, type IconName as Name } from '../ui/Icon.svelte';
  export type IconName = Name;
  export const isIcon = is;
</script>

<script lang="ts">
  import Icon from '../ui/Icon.svelte';

  let { name, size = 22, stroke = 1.75 }: { name: IconName | (string & {}); size?: number; stroke?: number } = $props();
</script>

<Icon {name} {size} {stroke} />
