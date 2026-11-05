<script lang="ts">
  // A look's round portrait (the せってい row, the コーデ strip's chips): a player's head, or the villager's official head
  // (<Avatar>). The stand-in figure until the 3D player's portraits land (customization.md §5: rendered from the look,
  // cached by its hash).
  import type { Who } from '#lib/types.ts';
  import type { Look } from '#lib/contract/look.ts';
  import Avatar from '../characters/Avatar.svelte';
  import PlayerFigure from './PlayerFigure.svelte';
  import { tagOf } from '#lib/ui-state/viewer.ts';

  let { who, look, size = 48 }: { who: Who; look: Look; size?: number } = $props();
</script>

{#if look.kind === 'villager'}
  <Avatar person={who} villager={look.villager} {size} />
{:else}
  <span class="pt" style:--s="{size}px" style:--tag={tagOf(who)}><PlayerFigure {look} head /></span>
{/if}

<style>
  .pt {
    width: var(--s); height: var(--s); flex: none; display: block; overflow: hidden; border-radius: 50%;
    background: color-mix(in srgb, var(--tag) 55%, var(--c-cream)); padding: 8%;
  }
</style>
