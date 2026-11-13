<script lang="ts">
  // The mic's round tap-to-talk button (docs/kikimimi-mic.md "The modes"), as drawn: 80 px, leaf while waiting, coral in
  // a take, a ring meter of the voice's `level` (0–1) round it, its icon, and its caption under it (a live status).
  // `busy` (checking what came through): taps ignored, greyed unless still `on`. Its own logic is its caller's:
  // MicButton (the bare capture), TalkButton (a recogniser's take), pair/SayButton (はつおん's two words). `rest`: the
  // wrapper's data attributes; `children`: what follows the caption (MicButton's 「もう一度試す」).
  import type { Snippet } from 'svelte';
  import Icon, { isIcon } from '../../ui/Icon.svelte';

  let { on, pressed, busy = false, level, label, icon, cap, track = true, onclick, children, ...rest }: {
    on: boolean;
    pressed?: boolean;
    busy?: boolean;
    level: number;
    label: string;
    /** An Icon name (mic, stop), else a glyph (… while checking). */
    icon: string;
    cap: string;
    /** The ring's track drawn while on. */
    track?: boolean;
    onclick: () => void;
    children?: Snippet;
    [data: `data-${string}`]: unknown;
  } = $props();
</script>

<div class="mic" {...rest}>
  <button type="button" class="talk" class:on data-sfx="tick" aria-label={label} aria-pressed={pressed ?? on} aria-disabled={busy} {onclick}>
    <svg viewBox="0 0 80 80" aria-hidden="true">
      {#if track}<circle class="track" cx="40" cy="40" r="37" />{/if}
      <circle class="lv" cx="40" cy="40" r="37" pathLength="1" stroke-dasharray="1" stroke-dashoffset={1 - level} />
    </svg>
    <span class="ic" aria-hidden="true">{#if isIcon(icon)}<Icon name={icon} size={32} stroke={2.4} />{:else}{icon}{/if}</span>
  </button>
  <p class="cap" role="status">{cap}</p>
  {@render children?.()}
</div>

<style>
  .mic { display: grid; justify-items: center; gap: 6px; }
  .talk {
    position: relative; display: grid; place-items: center; width: 80px; height: 80px; padding: 0; border: 0; border-radius: 50%;
    background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 4px 0 var(--c-leaf-edge); cursor: pointer;
    transition: transform var(--dur-tap) var(--ease-squash);
  }
  .talk:active { transform: translateY(3px); box-shadow: inset 0 0 0 2px var(--c-leaf-edge), 0 1px 0 var(--c-leaf-edge); }
  .talk.on { background: var(--c-coral); box-shadow: inset 0 0 0 2px var(--c-edge), 0 4px 0 var(--c-edge); }
  .talk[aria-disabled='true']:not(.on) { background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); }
  svg { position: absolute; inset: -6px; width: calc(100% + 12px); height: calc(100% + 12px); rotate: -90deg; pointer-events: none; }
  circle { fill: none; stroke-width: 4; }
  .track { stroke: transparent; }
  .on .track { stroke: var(--edge); }
  .lv { opacity: 0; stroke: var(--coral-text); transition: stroke-dashoffset 80ms linear; }
  .on .lv { opacity: 1; }
  .ic { display: grid; font: 700 32px/1 var(--font-ui); color: var(--c-ink); }
  .cap { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); text-align: center; }
  @media (prefers-reduced-motion: reduce) { .talk, .lv { transition: none; } }
</style>
