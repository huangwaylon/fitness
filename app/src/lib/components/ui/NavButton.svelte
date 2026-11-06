<script lang="ts">
  // The one back / close button (docs/design.md "Navigation"): a round cream NH game-object button (the
  // edged tier, 44px), ‹ back always top-left, ✕ close always top-right. `text` adds a visible label to the
  // back pill (‹ 島へ on a full page).
  // `look`: `quiet` the quiet kit's bare line glyph (SheetHeader, docs/design.md "Quiet sheets"), `photo` the same on a
  // round smoked disc over a photo (a trip's hero).
  //   <NavButton kind="close" onclick={…} />   <NavButton kind="back" text="島へ" onclick={…} />
  import { t } from '#lib/i18n/index.ts';
  import Icon from '../quiet/Icon.svelte';

  interface Props {
    kind: 'back' | 'close';
    onclick: () => void;
    /** A visible label beside ‹ (where it goes). */
    text?: string;
    /** The accessible name (defaults to もどる / とじる, or `text`). */
    label?: string;
    /** `self`: the handler plays its own cue (the phone's close tune). */
    sfx?: 'back' | 'self';
    look?: 'game' | 'quiet' | 'photo';
  }
  let { kind, onclick, text, label, sfx = 'back', look = 'game' }: Props = $props();
  const name = $derived(label ?? text ?? t(kind === 'back' ? 'common.back' : 'common.close'));
</script>

{#snippet glyph()}
  {#if look === 'game'}
    <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{kind === 'back' ? 'i-back' : 'i-close'}" /></svg>
  {:else}
    <Icon name={kind} size={look === 'photo' ? (kind === 'back' ? 20 : 18) : kind === 'back' ? 24 : 22} />
  {/if}
{/snippet}

<button type="button" class="nav {kind} {look}" class:pill={!!text} aria-label={text ? undefined : name} data-sfx={sfx === 'self' ? 'self' : 'back'} {onclick}>{@render glyph()}{#if text}<span>{text}</span>{/if}</button>

<style>
  .nav {
    appearance: none; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); border-radius: 50%; padding: 0; border: 0;
    display: inline-grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
    transition: transform var(--dur-base) var(--ease-bounce); -webkit-tap-highlight-color: transparent;
  }
  .nav:active { transform: translateY(2px) scale(1.06, .92); box-shadow: var(--sh-obj-press); transition-duration: var(--dur-tap); }
  .nav:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .nav svg { width: 22px; height: 22px; }
  .close svg { width: 20px; height: 20px; }
  /* ‹ + where it goes (a page's way back): the same button, grown into a pill */
  .pill { width: auto; display: inline-flex; gap: 4px; padding: 0 16px 0 10px; border-radius: var(--r-btn); font: 700 var(--fs-body)/1 var(--font-ui); }
  /* the quiet kit's: a bare glyph in a 44px hit; on a photo a 32px smoked disc */
  .nav.quiet, .nav.photo { background: none; box-shadow: none; border-radius: 12px; transition: opacity var(--dur-quick); }
  .nav.quiet { color: var(--q-ink-2, var(--text)); }
  .nav.quiet.back { color: var(--q-ink, var(--text)); }
  .nav.photo { position: relative; color: #fff; }
  .nav.photo::before {
    content: ''; position: absolute; inset: 6px; border-radius: 50%; background: var(--q-photo-btn, rgb(30 24 18 / .35));
    -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px);
  }
  .nav.photo :global(svg) { position: relative; }
  .nav.quiet:active, .nav.photo:active { transform: none; box-shadow: none; opacity: .55; }
  .nav.quiet:focus-visible, .nav.photo:focus-visible { outline: 2px solid var(--q-accent, var(--focus)); outline-offset: -4px; }
</style>
