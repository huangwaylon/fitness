<script lang="ts">
  // The one back / close button (docs/design.md "Navigation"): a round cream NH game-object button (the
  // edged tier, 44px), ‹ back always top-left, ✕ close always top-right. `text` adds a visible label to the
  // back pill (‹ 島へ on a full page). `href` makes it a link (a page's way back).
  //   <NavButton kind="close" onclick={…} />   <NavButton kind="back" text="島へ" href="/" />
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    kind: 'back' | 'close';
    onclick?: () => void;
    href?: string;
    /** A visible label beside ‹ (where it goes). */
    text?: string;
    /** The accessible name (defaults to もどる / とじる, or `text`). */
    label?: string;
    /** `self`: the handler plays its own cue (the phone's close tune). */
    sfx?: 'back' | 'self';
  }
  let { kind, onclick, href, text, label, sfx = 'back' }: Props = $props();
  const name = $derived(label ?? text ?? t(kind === 'back' ? 'common.back' : 'common.close'));
</script>

{#snippet glyph()}
  <svg viewBox="0 0 24 24" aria-hidden="true"><use href="#{kind === 'back' ? 'i-back' : 'i-close'}" /></svg>
{/snippet}

{#if href}
  <a class="nav {kind}" class:pill={!!text} {href} aria-label={text ? undefined : name} data-sfx={sfx === 'self' ? 'self' : 'back'}>{@render glyph()}{#if text}<span>{text}</span>{/if}</a>
{:else}
  <button type="button" class="nav {kind}" class:pill={!!text} aria-label={text ? undefined : name} data-sfx={sfx === 'self' ? 'self' : 'back'} {onclick}>{@render glyph()}{#if text}<span>{text}</span>{/if}</button>
{/if}

<style>
  .nav {
    appearance: none; cursor: pointer; flex: none; width: var(--hit); height: var(--hit); border-radius: 50%; padding: 0; border: 0;
    display: inline-grid; place-items: center; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-obj);
    text-decoration: none; transition: transform var(--dur-base) var(--ease-bounce); -webkit-tap-highlight-color: transparent;
  }
  .nav:active { transform: translateY(2px) scale(1.06, .92); box-shadow: var(--sh-obj-press); transition-duration: var(--dur-tap); }
  .nav:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .nav svg { width: 22px; height: 22px; }
  .close svg { width: 20px; height: 20px; }
  /* ‹ + where it goes (a page's way back): the same button, grown into a pill */
  .pill { width: auto; display: inline-flex; gap: 4px; padding: 0 16px 0 10px; border-radius: var(--r-btn); font: 700 var(--fs-body)/1 var(--font-ui); }
</style>
