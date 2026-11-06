<script lang="ts">
  // One of トレイル's stroke icons (icons.ts), 18px unless the parent sizes `.ic`.
  import { ICONS, type IconName } from './icons.ts';

  let { name, w = 1.75 }: { name: IconName; w?: number } = $props();
</script>

<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width={w} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html ICONS[name]}</svg>

<style>
  .ic { width: 18px; height: 18px; display: inline-block; flex: none; vertical-align: middle; }
</style>
