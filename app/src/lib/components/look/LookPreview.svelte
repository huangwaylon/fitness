<script lang="ts">
  // The すがた level's preview slot (customization.md §3.1): the look being edited, full body. A villager is its
  // official render; a player is the stand-in figure until the 3D player lands (components/player3d createPlayer: then
  // this slot makes its renderer on mount and disposes it on unmount, idling, blinking, a drag turning it). A tap hops it.
  import type { Who } from '#lib/types.ts';
  import type { Look } from '#lib/contract/look.ts';
  import Villager from '../characters/Villager.svelte';
  import PlayerFigure from './PlayerFigure.svelte';

  let { who, look }: { who: Who; look: Look } = $props();
  let hop = $state(0);
</script>

<button type="button" class="lpv" data-look-preview={look.kind} aria-hidden="true" tabindex="-1" data-sfx="none" onclick={() => hop++}>
  {#key hop}
    <span class="fig">
      {#if look.kind === 'villager'}
        {#key look.villager}<Villager person={who} villager={look.villager} size={112} head={false} expression="cheer" eager />{/key}
      {:else}
        <PlayerFigure {look} />
      {/if}
    </span>
  {/key}
</button>

<style>
  .lpv {
    appearance: none; border: 0; padding: 0; background: none; cursor: pointer; -webkit-tap-highlight-color: transparent;
    width: 96px; height: 132px; flex: none; display: grid; place-items: end center;
  }
  .fig { width: 88px; height: 128px; display: grid; place-items: end center; animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
</style>
