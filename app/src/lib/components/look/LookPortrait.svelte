<script lang="ts">
  // A look's round portrait (the せってい row, the コーデ strip's chips): a player's head, or the villager's official head
  // (<Avatar>). A player's is the 3D player's head as drawn and kept by portraits.svelte.ts (docs/players.md "Portraits": from
  // the look, by its hash, through the すがた preview's renderer); the flat stand-in until one is.
  import type { Who } from '#lib/types.ts';
  import type { Look, PlayerLook } from '#lib/contract/look.ts';
  import Avatar from '../characters/Avatar.svelte';
  import PlayerFigure from './PlayerFigure.svelte';
  import { portraitOf } from './portraits.svelte.ts';
  import { tagOf } from '#lib/ui-state/viewer.ts';

  let { who, look, size = 48 }: { who: Who; look: Look; size?: number } = $props();
  const shot = $derived(look.kind === 'player' ? portraitOf(look as PlayerLook) : null);
</script>

{#if look.kind === 'villager'}
  <Avatar person={who} villager={look.villager} {size} />
{:else}
  <span class="pt" class:shot style:--s="{size}px" style:--tag={tagOf(who)} data-portrait={shot ? '3d' : 'figure'}>
    {#if shot}<img src={shot} alt="" draggable="false" />{:else}<PlayerFigure {look} head />{/if}
  </span>
{/if}

<style>
  .pt {
    width: var(--s); height: var(--s); flex: none; display: block; overflow: hidden; border-radius: 50%;
    background: color-mix(in srgb, var(--tag) 55%, var(--c-cream)); padding: calc(var(--s) * .08); /* not 8%: a % is of the row's width */
  }
  .pt.shot { padding: 0; }
  .pt img { display: block; width: 100%; height: 100%; user-select: none; -webkit-user-drag: none; pointer-events: none; }
</style>
