<script lang="ts">
  // The one title-bar button (docs/design.md "Navigation"): ‹ back (top-left, only on a level), ✕ close (top-right, every
  // sheet), or a `tool` (⚙ ＋, km|mi…: the lead slot on a top level, or before ✕). One size app-wide: a 32px disc drawn in
  // the 44px hit, the kit's control (`--ctl`, `--sh-ctl-s`: cream by day, navy at night), the glyph `ui/Icon` at stroke 2.4.
  // `look="photo"`: the same disc smoked, over a photo (a trip's hero, a trail's map).
  // `text`: ‹ grown into a labelled pill, a full page's way back (‹ 島へ in a room).
  //   <NavButton kind="close" onclick={…} />   <NavButton kind="back" text="島へ" onclick={…} />
  //   <NavButton kind="tool" icon="gear" label="設定" sfx="open" onclick={…} />
  import { t } from '#lib/i18n/index.ts';
  import Icon, { type IconName } from './Icon.svelte';

  interface Props {
    kind: 'back' | 'close' | 'tool';
    onclick: () => void;
    /** A visible label beside ‹ (where it goes). */
    text?: string;
    /** The accessible name (defaults to 戻る / 閉じる, or `text`; a tool's own). */
    label?: string;
    /** The cue: `back` (‹ ✕), `self` (the handler plays its own), a tool's (`open`, `tick`). */
    sfx?: 'back' | 'self' | 'open' | 'tick' | 'undo';
    look?: 'game' | 'photo';
    /** A tool's glyph. */
    icon?: IconName;
  }
  let { kind, onclick, text, label, sfx = kind === 'tool' ? 'tick' : 'back', look = 'game', icon, ...rest }: Props & Record<`data-${string}`, unknown> = $props();
  const name = $derived(label ?? text ?? t(kind === 'back' ? 'common.back' : 'common.close'));
  const glyph = $derived<IconName>(kind === 'tool' ? (icon ?? 'gear') : kind);
</script>

<button type="button" class="nav {kind} {look}" class:pill={!!text} aria-label={text ? undefined : name}
  data-sfx={sfx === 'self' ? 'self' : sfx === 'open' ? 'open' : sfx === 'tick' ? 'tick' : sfx === 'undo' ? 'undo' : 'back'} {...rest} {onclick}><Icon name={glyph} size={kind === 'back' ? 20 : 18} stroke={2.4} />{#if text}<span>{text}</span>{/if}</button>

<style>
  .nav {
    appearance: none; cursor: pointer; flex: none; position: relative; width: var(--hit); height: var(--hit); padding: 0; border: 0;
    border-radius: 50%; display: inline-grid; place-items: center; background: none; color: var(--text);
    -webkit-tap-highlight-color: transparent;
  }
  /* the disc, 32px in the 44px hit */
  .nav::before { content: ''; position: absolute; inset: 6px; border-radius: 50%; background: var(--ctl); box-shadow: var(--sh-ctl-s); }
  .nav:active::before { transform: translateY(2px); box-shadow: var(--sh-ctl-s-press); }
  .nav :global(svg) { position: relative; }
  .nav:focus-visible { outline: 2px solid var(--focus); outline-offset: -4px; }
  /* on a photo: the disc smoked */
  .nav.photo { color: #fff; transition: opacity var(--dur-quick); }
  .nav.photo::before { background: rgb(30 24 18 / .35); box-shadow: none; -webkit-backdrop-filter: blur(10px); backdrop-filter: blur(10px); }
  .nav.photo:active { opacity: .55; }
  .nav.photo:active::before { transform: none; }
  /* ‹ + where it goes (a page's way back): the same control, grown into a pill */
  .pill { width: auto; display: inline-flex; gap: 2px; padding: 0 14px 0 8px; border-radius: var(--r-pill); font: 700 var(--fs-body)/1 var(--font-ui); }
  .pill::before { inset: 6px 0; border-radius: var(--r-pill); }
  .pill span { position: relative; }
  @media (prefers-reduced-motion: reduce) { .nav:active::before { transform: none; } }
</style>
