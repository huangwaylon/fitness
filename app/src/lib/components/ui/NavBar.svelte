<script lang="ts">
  // The one title bar (docs/design.md "Navigation"), on every sheet and the island panel: the title centred,
  // ‹ back top-left when there is a level to go back to, ✕ top-right on every sheet (it closes the whole sheet, from any
  // level). Back and close never swap places, and the title never moves. `lead`: a control in ‹'s place on the top
  // level (けんこう's and ごはん's whose data pill); `trailing`: controls before ✕ (＋, ⚙). The sides share the row evenly
  // so the title stays centred, and a level's ‹ takes the place back (the caller passes no lead there).
  // One size on every sheet: 48px, the title 18 (--fs-talk, --font-ui 700), the NavButtons' 32px discs. `over`: laid
  // over a photo (a trip's hero, a trail's map): no title shown (it stays the bar's name), ‹ ✕ on smoked discs.
  //   <NavBar title="記録" onback={…} onclose={…} />   <NavBar title="りょこう" onclose={…} trailing={add} />
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
    /** Right of the title, before ✕. */
    trailing?: Snippet | null;
    /** On a photo: the title hidden, ‹ ✕ on smoked discs. */
    over?: boolean;
    /** @deprecated ignored: one size (travel's call sites, until they move). */
    size?: 's';
  }
  let { title = '', onback = null, onclose = null, sfx = 'back', lead = null, trailing = null, over = false }: Props = $props();
  const led = $derived((!onback && !!lead) || !!trailing);
  const look = $derived(over ? 'photo' : 'game');
</script>

<div class="navbar" class:led class:over>
  <span class="side">{#if onback}<NavButton kind="back" onclick={onback} {sfx} {look} />{:else if lead}{@render lead()}{/if}</span>
  {#if title}<h2 class="ttl" class:sr-only={over}>{title}</h2>{:else}<span></span>{/if}
  <span class="side end">{#if trailing}{@render trailing()}{/if}{#if onclose}<NavButton kind="close" onclick={onclose} {sfx} {look} />{/if}</span>
</div>

<style>
  .navbar { display: grid; grid-template-columns: var(--hit) minmax(0, 1fr) var(--hit); align-items: center; gap: 4px; min-height: 48px;
    /* the disc (6px in its hit) on the container's content edge */
    margin-inline: -6px; }
  .side { display: flex; width: var(--hit); }
  .end { justify-content: flex-end; }
  /* a long level title (あたらしい マイ食品 at 375) wraps at its space, balanced, rather than running into ✕ */
  .ttl { margin: 0; text-align: center; font: 700 var(--fs-talk)/1.2 var(--font-ui); overflow-wrap: anywhere; text-wrap: balance; }
  /* with a lead or trailing controls: two equal sides (the title still centred), each as wide as it needs */
  .navbar.led { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); container: navbar / inline-size; }
  .led .side { width: auto; min-width: 0; align-items: center; gap: 0; }
  .led .ttl { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* over a photo: only the two buttons, at the band's sides */
  .navbar.over { display: flex; justify-content: space-between; }
  .over .side { width: auto; }
</style>
