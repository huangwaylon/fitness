<script lang="ts">
  // ▶ (or the turtle, `slow`) on a results row: one round icon button the size of a tap, its name for VoiceOver. Every game's
  // review and list rows play their clip with this one.
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { t } from '#lib/i18n/index.ts';
  import Icon from '../../ui/Icon.svelte';

  let { slow = false, label = t(slow ? 'kiki.playSlow' : 'kiki.play'), onclick, ...rest }: { slow?: boolean; label?: string; onclick: () => void } & Omit<HTMLButtonAttributes, 'onclick'> = $props();
</script>

<button type="button" class="ib tile-btn" aria-label={label} data-sfx="tick" {...rest} onclick={() => onclick()}><Icon name={slow ? 'turtle' : 'play'} size={20} soft={!slow} /></button>

<style>
  .ib { flex: none; width: var(--hit); height: var(--hit); padding: 0; border-radius: 50%; display: grid; place-items: center; font: 700 18px/1 var(--font-ui); }
</style>
