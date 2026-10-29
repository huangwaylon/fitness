<script lang="ts">
  // A person's round villager head (official icon, silhouette fallback) on a round chip (yuzu A, mint B).
  import type { PersonId } from '#lib/types.ts';
  import Villager from './Villager.svelte';

  interface Props {
    person: PersonId;
    /** Roster id; null/undefined = the person's current villager. */
    villager?: string | null;
    size?: number;
  }
  let { person, villager, size = 56 }: Props = $props();
  const icon = $derived(Math.round(size * 0.86));
</script>

<span class="av" style:--s="{size}px" style:--tag={person === 'A' ? 'var(--c-yuzu)' : 'var(--c-mint)'}>
  <Villager {person} villager={villager ?? undefined} size={icon} head />
</span>

<style>
  .av {
    width: var(--s); height: var(--s); flex: none; display: grid; place-items: center; overflow: hidden;
    border-radius: 50%; background: color-mix(in srgb, var(--tag) 55%, var(--c-cream));
  }
</style>
