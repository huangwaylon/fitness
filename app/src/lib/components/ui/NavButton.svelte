<script lang="ts">
  // The one title-bar button (docs/design.md "Navigation"): ‹ back (top-left, only on a level), ✕ close (top-right, every
  // sheet), or a `tool` (⚙ ＋…: the lead slot on a top level, or before ✕). One size app-wide: a 32px disc drawn in
  // the 44px hit, the kit's control (`--ctl`, `--sh-ctl-s`: cream by day, navy at night), the glyph `ui/Icon` at stroke 2.4.
  // The same disc over a photo or a map (a trip's hero, a trail's map): one look everywhere.
  // `text`: ‹ grown into a labelled pill, a full page's way back (‹ しまへ in a room).
  //   <NavButton kind="close" onclick={…} />   <NavButton kind="back" text="しまへ" onclick={…} />
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
    /** A tool's glyph. */
    icon?: IconName;
    /** It opens a sheet (a tool's ⋯: aria-haspopup). */
    popup?: boolean;
  }
  let { kind, onclick, text, label, sfx = kind === 'tool' ? 'tick' : 'back', icon, popup = false, ...rest }: Props & Record<`data-${string}`, unknown> = $props();
  const name = $derived(label ?? text ?? t(kind === 'back' ? 'common.back' : 'common.close'));
  const glyph = $derived<IconName>(kind === 'tool' ? (icon ?? 'gear') : kind);
</script>

<button type="button" class="nav disc {kind}" class:pill={!!text} aria-label={text ? undefined : name} aria-haspopup={popup ? 'dialog' : undefined}
  data-sfx={sfx} {...rest} {onclick}><Icon name={glyph} size={kind === 'back' ? 20 : 18} stroke={2.4} />{#if text}<span>{text}</span>{/if}</button>

<style>
  /* theme.css .disc: the 32px disc in the 44px hit; ‹ + where it goes (a page's way back) grown into its pill */
  .pill { gap: 2px; padding: 0 14px 0 8px; font: 700 var(--fs-body)/1 var(--font-ui); }
</style>
