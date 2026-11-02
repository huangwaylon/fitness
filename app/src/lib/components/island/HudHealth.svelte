<script lang="ts">
  // The health button in the HUD, beside today's ribbon (docs/design.md "Island"): a cream pill as tall as the ribbon,
  // NH's red dumbbell lying across its left end and a leaf "go" dot, no number (the numbers live in the popup). Tap:
  // a press squash, the villagers glance up at it (R18), and the health popup grows out of the dumbbell
  // (HealthSheet, Sheet's `pop`: the zoom's origin is the dumbbell, --pop-x / --pop-y on the root).
  //   <HudHealth onopen={() => …} {later} />
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** Tapped (open the health popup), after the press beat. */
    onopen?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { onopen, later }: Props = $props();

  let pressed = $state(false);
  let artEl: HTMLElement | undefined = $state();

  function tap() {
    pressed = false;
    const r = artEl?.getBoundingClientRect();
    if (r?.width) {
      const root = document.documentElement;
      root.style.setProperty('--pop-x', `${Math.round(r.left + r.width / 2)}px`);
      root.style.setProperty('--pop-y', `${Math.round(r.top + r.height / 2)}px`);
    }
    react('R18');
    later(() => onopen?.(), 90);
  }
</script>

<button type="button" class="hud-health" class:pressed aria-label={t('island.health')} aria-haspopup="dialog" data-sfx="self" onclick={tap}
  onpointerdown={() => (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="art" bind:this={artEl}><OfficialArt key="items/dumbbell" size="100%" eager /></span>
  <svg class="go" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="8" /><path d="M6.4 4.6 L11 8 L6.4 11.4 Z" /></svg>
</button>

<style>
  /* One cream pill, the ribbon's height and lip (its sibling in the HUD row): the dumbbell over its left end, then the
     go dot. */
  .hud-health {
    --art: clamp(54px, calc(7 * var(--vh1)), 64px);
    position: relative; flex: none; display: inline-flex; align-items: center; height: var(--hit); margin: 0;
    padding: 0 6px 0 calc(var(--art) + 4px); appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); font: inherit;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; pointer-events: auto;
    transition: transform 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft);
  }
  .hud-health.pressed { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-lip); }
  .hud-health:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the dumbbell, a little bigger than the pill is tall, its plates over the pill's edge */
  .art {
    position: absolute; left: 0; top: 50%; width: var(--art); height: var(--art); translate: 0 -50%; display: flex;
    align-items: center; justify-content: center; pointer-events: none; transform-origin: 50% 60%;
    transition: transform 220ms cubic-bezier(.34, 1.56, .64, 1);
    filter: drop-shadow(0 2px 0 rgb(0 0 0 / .12));
  }
  .hud-health.pressed .art { transform: scale(.9) rotate(-6deg); transition: transform 80ms var(--ease-squash); }
  .go { width: clamp(1.25rem, 6.4vw, 1.5rem); height: auto; aspect-ratio: 1; flex: none; }
  .go circle { fill: var(--c-leaf-lip); }
  .go path { fill: var(--c-cream); }
</style>
