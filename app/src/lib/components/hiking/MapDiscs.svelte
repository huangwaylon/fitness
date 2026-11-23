<script lang="ts">
  // The trail map's discs bottom-right over the sheet's peek, in the thumb's reach (docs/hiking.md "In-hike map"): the
  // N disc (turned by −bearing; only while the map is turned by two fingers: the phone's compass never turns it, only
  // the dot's cone; a tap brings north up) over the location disc (off → 追従 → off; in hike mode a tap re-centres),
  // 56px drawn in a 64px hit (gloves), and the 1 s label after a tap. The location disc is high contrast (sky while following); the compass the map's controls' own, themed
  // by the hour as ＋ − are.
  import type { Live } from './map/live.svelte.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';
  import LocateDisc from '../map/LocateDisc.svelte';

  let { live, bottom, full, onlocate, onnorth }: { live: Live; bottom: number; full: boolean; onlocate: () => void; onnorth: () => void } = $props();
  const L = $derived(i18n.locale);
  const compassShown = $derived(Math.abs(live.bearing) > 0.5);
  /** The location disc (map/LocateDisc): off (the crosshair), free (a hollow arrow), follow (filled). */
  const camLabel = $derived(pick(live.cam === 'follow' ? S.camFollow : S.locate, L));
</script>

<div class="discs" style:bottom="{bottom + 6}px" inert={full}>
  {#if live.toast}<span class="toast" role="status" data-cam-toast>{pick(S[live.toast], L)}</span>{/if}
  {#if compassShown}
    <button type="button" class="big-disc compass" data-compass data-sfx="tick" aria-label={pick(S.north, L)} onclick={onnorth}>
      <svg viewBox="0 0 24 24" width="42" height="42" style:transform="rotate({-live.bearing}deg)" aria-hidden="true">
        <path d="M12 2 15.4 12H8.6z" fill="var(--c-coral-text)" /><path d="M12 22 8.6 12h6.8z" fill="var(--text-soft)" />
        <text x="12" y="10" text-anchor="middle" font-size="5.6" font-weight="800" fill="#fff">N</text>
      </svg>
    </button>
  {/if}
  <LocateDisc cam={live.cam} label={camLabel} onclick={onlocate} />
</div>

<style>
  .discs { position: absolute; z-index: 520; right: calc(4px + var(--safe-right)); display: flex; flex-direction: column; align-items: flex-end; gap: 4px; transition: bottom .32s var(--ease-soft); }
  .big-disc {
    appearance: none; position: relative; width: 64px; height: 64px; margin: 0; padding: 0; border: 0; background: none; border-radius: 50%;
    display: grid; place-items: center; color: var(--c-ink); cursor: pointer; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .big-disc::before { content: ''; position: absolute; inset: 4px; border-radius: 50%; background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-ink-soft), 0 3px 0 var(--c-ink-soft), var(--sh-float); }
  .big-disc > * { position: relative; }
  .big-disc:active::before { transform: translateY(2px); box-shadow: inset 0 0 0 2px var(--c-ink-soft), 0 1px 0 var(--c-ink-soft); }
  .big-disc:focus-visible { outline: none; }
  .big-disc:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the compass: the map's controls' own (theme.css .disc: --ctl, --edge; navy by night) */
  .compass { color: var(--text); }
  .compass::before { background: var(--ctl); box-shadow: inset 0 0 0 2px var(--edge), 0 3px 0 var(--edge), var(--sh-float); }
  .compass:active::before { box-shadow: inset 0 0 0 2px var(--edge), 0 1px 0 var(--edge); }
  .compass svg { transition: transform .12s linear; }
  /* the 1 s label after a tap, beside the disc */
  .toast {
    position: absolute; right: 70px; bottom: 16px; margin: 0; padding: 8px 14px; white-space: nowrap; pointer-events: none;
    background: var(--c-ink); color: var(--c-cream); border-radius: var(--r-pill); font: 700 var(--fs-body)/1.2 var(--font-ui); box-shadow: var(--sh-float);
  }
</style>
