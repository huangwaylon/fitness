<script lang="ts">
  // A map's location disc (docs/design.md "Maps"): `big` the full-bleed maps' (トレイル, 保存した場所: 56 px drawn in a
  // 64 hit, gloves), `small` an embedded map's (the trip's: theme.css .disc, 32 in 44). The crosshair while off or
  // one-shot; the trail's follow loop (`cam`) an arrow, hollow while free, filled on sky while following; sky (big) or
  // yuzu (small) while on; spinning while asking; grey with a slash once refused. Placed by its parent (the rest of the
  // props: style, inert, data-*).
  import type { LocState } from './types.ts';

  let { loc = 'off', cam, size = 'big', label, onclick, ...rest }: {
    loc?: LocState;
    /** The trail's camera loop (data-locate reads it then). */
    cam?: 'off' | 'free' | 'follow';
    size?: 'big' | 'small';
    label: string;
    onclick: () => void;
    [attr: string]: unknown;
  } = $props();
  const arrow = $derived(!!cam && cam !== 'off');
  const on = $derived(cam ? cam === 'follow' : loc === 'on');
  const refused = $derived(loc === 'denied');
</script>

<button type="button" {...rest} class={size === 'big' ? 'big locate' : 'disc small locate'} class:on class:refused data-locate={cam ?? loc} data-sfx="tick"
  aria-label={label} aria-pressed={cam ? cam !== 'off' : loc === 'on'} {onclick}>
  {#if arrow}
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path d="M12 3 19 20.5 12 16.6 5 20.5z" fill={cam === 'follow' ? 'currentColor' : 'none'} stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" /></svg>
  {:else if size === 'big'}
    <svg class="x" viewBox="0 0 24 24" width="30" height="30" aria-hidden="true"><path d="M2 12h3M19 12h3M12 2v3M12 19v3" /><circle cx="12" cy="12" r="7" /><circle class="in" cx="12" cy="12" r="2.6" />{#if refused}<path class="slash" d="M4 4 20 20" />{/if}</svg>
  {:else}
    <svg class="x" viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 2.8v3.4M12 17.8v3.4M2.8 12h3.4M17.8 12h3.4" /><circle cx="12" cy="12" r="6.2" /><circle class="in" cx="12" cy="12" r="2.6" />{#if refused}<path class="slash" d="M4 4 20 20" />{/if}</svg>
  {/if}
</button>

<style>
  .x { fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; }
  .in { fill: currentColor; }
  .small .in { stroke: none; }
  .slash { stroke-width: 2.6; }
  [data-locate='asking'] svg { animation: loc-spin 1.2s linear infinite; }
  @keyframes loc-spin { to { rotate: 360deg; } }

  /* big: 56 drawn in a 64 hit, the card with the ink lip; sky while on or following */
  .big {
    appearance: none; position: relative; width: 64px; height: 64px; margin: 0; padding: 0; border: 0; background: none; border-radius: 50%;
    display: grid; place-items: center; color: var(--c-ink); cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .big::before { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-ink-soft), 0 3px 0 var(--c-ink-soft), var(--sh-float); }
  .big > * { position: relative; }
  .big:active::before { transform: translateY(2px); box-shadow: inset 0 0 0 2px var(--c-ink-soft), 0 1px 0 var(--c-ink-soft); }
  .big:focus-visible { outline: none; }
  .big:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .big[data-locate='free'] { color: var(--c-sky-text); }
  .big.on { color: #fff; }
  .big.on::before { background: var(--c-sky); box-shadow: inset 0 0 0 2px var(--c-sky-text), 0 3px 0 var(--c-sky-text), var(--sh-float); }

  /* small: theme.css .disc, yuzu while on */
  .small[aria-pressed='true'] { color: var(--c-ink); }
  .small[aria-pressed='true']::before { background: var(--ctl-sel); }
  .small[data-locate='unavailable'] { color: var(--text-soft); }

  .refused { color: var(--text-soft); }
</style>
