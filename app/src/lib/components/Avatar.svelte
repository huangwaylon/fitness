<script lang="ts">
  // A person's round villager head (official icon, fan-art fallback) on a pebble in their tag colour (§A).
  import type { PersonId } from '#lib/types.ts';
  import OfficialArt from './OfficialArt.svelte';
  import Villager from './Villager.svelte';
  import { villagerArt } from '#lib/client/assets.ts';
  import { resolveLook } from '#lib/villagers/roster.ts';

  interface Props {
    person: PersonId;
    /** Roster id; null/undefined = the person's current villager. */
    villager?: string | null;
    size?: number;
    label?: string;
  }
  let { person, villager, size = 56, label = '' }: Props = $props();
  const id = $derived(resolveLook({ villager, person }).id);
  const icon = $derived(Math.round(size * 0.86));
</script>

<span class="av" style:--s="{size}px" style:--tag={person === 'A' ? 'var(--tag-apricot)' : 'var(--tag-plum)'}>
  <OfficialArt key={villagerArt(id, true)} alt={label} size={icon}>
    {#snippet fallback()}<Villager {person} villager={id} size={icon} head {label} />{/snippet}
  </OfficialArt>
</span>

<style>
  .av {
    width: var(--s); height: var(--s); flex: none; display: grid; place-items: center; overflow: hidden;
    border-radius: var(--r-blob); background: color-mix(in srgb, var(--tag) 55%, var(--surface));
  }
</style>
