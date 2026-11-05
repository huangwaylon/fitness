<script lang="ts">
  // A person's round head on a round chip (yuzu A, mint B, lilac the guest): a villager's official icon (silhouette
  // fallback), or, `worn`, the head of the look the person wears now (store/look.ts lookOf): a human player's portrait
  // (look/portraits.svelte.ts: drawn by the すがた preview or the island's renderer, kept by the look; the flat stand-in
  // till then), or their villager's icon.
  import type { Who } from '#lib/types.ts';
  import type { PlayerLook } from '#lib/contract/look.ts';
  import Villager from './Villager.svelte';
  import PlayerFigure from '../look/PlayerFigure.svelte';
  import { portraitOf } from '../look/portraits.svelte.ts';
  import { lookOf } from '#lib/store/look.ts';

  interface Props {
    person: Who;
    /** Roster id; null/undefined = the person's current villager. */
    villager?: string | null;
    size?: number;
    /** The person as they look now (a player's portrait when they wear one), not only a villager's head. */
    worn?: boolean;
  }
  let { person, villager, size = 56, worn = false }: Props = $props();
  const icon = $derived(Math.round(size * 0.86));
  const look = $derived(worn ? lookOf(person) : null);
  const player = $derived(look?.kind === 'player' ? (look as PlayerLook) : null);
  const shot = $derived(player ? portraitOf(player) : null);
</script>

<span class="av" class:pl={!!player} class:shot style:--s="{size}px" style:--tag={person === 'A' ? 'var(--c-yuzu)' : person === 'B' ? 'var(--c-mint)' : 'var(--c-lilac)'}
  data-portrait={player ? (shot ? '3d' : 'figure') : undefined}>
  {#if shot}<img src={shot} alt="" draggable="false" />
  {:else if player}<PlayerFigure look={player} head />
  {:else}<Villager {person} villager={villager ?? undefined} size={icon} head />{/if}
</span>

<style>
  .av {
    width: var(--s); height: var(--s); flex: none; display: grid; place-items: center; overflow: hidden;
    border-radius: 50%; background: color-mix(in srgb, var(--tag) 55%, var(--c-cream));
  }
  .av.pl:not(.shot) { padding: calc(var(--s) * .08); }
  .av img { display: block; width: 100%; height: 100%; user-select: none; -webkit-user-drag: none; pointer-events: none; }
</style>
