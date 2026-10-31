<script lang="ts">
  // The one title bar (docs/design.md "Navigation"), on every sheet and the island panel: the title centred,
  // ‹ back top-left when there is a level to go back to, ✕ top-right on every sheet (it closes the whole sheet, from any
  // level). Back and close never swap places, and the title never moves.
  //   <NavBar title="きろく" onback={…} onclose={…} />
  import NavButton from './NavButton.svelte';

  interface Props {
    title?: string;
    /** ‹ back: shown only when there is a previous level. */
    onback?: (() => void) | null;
    onclose?: (() => void) | null;
    /** `self`: the handlers play their own cues (the panel). */
    sfx?: 'back' | 'self';
  }
  let { title = '', onback = null, onclose = null, sfx = 'back' }: Props = $props();
</script>

<div class="navbar">
  <span class="side">{#if onback}<NavButton kind="back" onclick={onback} {sfx} />{/if}</span>
  {#if title}<h2 class="ttl">{title}</h2>{:else}<span></span>{/if}
  <span class="side end">{#if onclose}<NavButton kind="close" onclick={onclose} {sfx} />{/if}</span>
</div>

<style>
  .navbar { display: grid; grid-template-columns: var(--hit) minmax(0, 1fr) var(--hit); align-items: center; gap: 8px; min-height: 52px; }
  .side { display: flex; width: var(--hit); }
  .end { justify-content: flex-end; }
  .ttl { margin: 0; text-align: center; font-size: var(--fs-title); line-height: 1.2; overflow-wrap: anywhere; }
</style>
