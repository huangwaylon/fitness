<script lang="ts">
  // The phrase picker's door (docs/design.md "Villager taps"): a small round button at the island's bottom right, NH's
  // chat glyph (a speech bubble with three dots) in soft ink on the app's cream. A 44 px target, 36 px drawn, a little
  // see-through so it stays quiet over the sea. IslandScene places and hides it (a sheet, a popup, もようがえ); a tap
  // opens SayPicker above it.
  //   <SayButton bind:el open={!!picking} onopen={(el) => …} />
  import { t } from '#lib/i18n/index.ts';

  let { open, onopen, el = $bindable() }: { open: boolean; onopen: (el: HTMLElement) => void; el?: HTMLButtonElement } = $props();
</script>

<button type="button" class="say-btn" data-say-open data-sfx="open" bind:this={el} aria-label={t('say.open')} aria-haspopup="dialog" aria-expanded={open}
  onclick={(e) => onopen(e.currentTarget)}>
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path class="bub" d="M12 3.6c-5 0-8.6 3.1-8.6 7.1 0 2.3 1.2 4.3 3.1 5.6l-.7 3.2 3.6-2.1c.8.2 1.7.3 2.6.3 5 0 8.6-3.1 8.6-7s-3.6-7.1-8.6-7.1Z" />
    <circle cx="8.3" cy="10.8" r="1.25" /><circle cx="12" cy="10.8" r="1.25" /><circle cx="15.7" cy="10.8" r="1.25" />
  </svg>
</button>

<style>
  /* 44 px to the thumb, 36 px to the eye (::before draws the disc) */
  .say-btn {
    appearance: none; border: 0; margin: 0; padding: 0; width: var(--hit, 44px); height: var(--hit, 44px); display: grid; place-items: center;
    background: none; cursor: pointer; position: relative; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .say-btn::before {
    content: ''; position: absolute; left: 4px; top: 4px; width: 36px; height: 36px; border-radius: 50%;
    background: color-mix(in srgb, var(--c-cream, #FFF9E3) 90%, transparent); box-shadow: 0 3px 0 rgba(150, 110, 70, .28), 0 2px 8px rgba(60, 40, 20, .12);
    transition: translate .12s, box-shadow .12s;
  }
  .say-btn:active::before, .say-btn[aria-expanded='true']::before { translate: 0 2px; box-shadow: 0 1px 0 rgba(150, 110, 70, .28); }
  .say-btn:focus-visible { outline: none; }
  .say-btn:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  svg { position: relative; width: 22px; height: 22px; }
  .say-btn:active svg, .say-btn[aria-expanded='true'] svg { translate: 0 2px; }
  .bub { fill: #A88B68; }
  circle { fill: var(--c-cream, #FFF9E3); }
</style>
