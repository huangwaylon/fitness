<script lang="ts">
  // The one title bar (docs/design.md "Navigation"), on every sheet and the island panel: the title centred,
  // ‹ back top-left when there is a level to go back to, ✕ top-right on every sheet (it closes the whole sheet, from any
  // level). Back and close never swap places, and the title never moves. `lead`: a control in ‹'s place on the top
  // level (けんこう's and ごはん's whose data pill); the sides share the row evenly so the title stays centred, and a
  // level's ‹ takes the place back (the caller passes no lead there).
  //   <NavBar title="きろく" onback={…} onclose={…} />
  import type { Snippet } from 'svelte';
  import NavButton from './NavButton.svelte';

  interface Props {
    title?: string;
    /** ‹ back: shown only when there is a previous level. */
    onback?: (() => void) | null;
    onclose?: (() => void) | null;
    /** `self`: the handlers play their own cues (the panel). */
    sfx?: 'back' | 'self';
    /** Left of the title when there is no ‹ (ignored with one). */
    lead?: Snippet | null;
  }
  let { title = '', onback = null, onclose = null, sfx = 'back', lead = null }: Props = $props();
  const led = $derived(!onback && !!lead);
</script>

<div class="navbar" class:led>
  <span class="side">{#if onback}<NavButton kind="back" onclick={onback} {sfx} />{:else if lead}{@render lead()}{/if}</span>
  {#if title}<h2 class="ttl">{title}</h2>{:else}<span></span>{/if}
  <span class="side end">{#if onclose}<NavButton kind="close" onclick={onclose} {sfx} />{/if}</span>
</div>

<style>
  .navbar { display: grid; grid-template-columns: var(--hit) minmax(0, 1fr) var(--hit); align-items: center; gap: 8px; min-height: 52px; }
  .side { display: flex; width: var(--hit); }
  .end { justify-content: flex-end; }
  .ttl { margin: 0; text-align: center; font-size: var(--fs-title); line-height: 1.2; overflow-wrap: anywhere; }
  /* with a lead: two equal sides (the title still centred), the lead as wide as its side, ✕ at the far right */
  .navbar.led { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); container: navbar / inline-size; }
  .led .side { width: auto; min-width: 0; }
  .led .ttl { white-space: nowrap; }
</style>
