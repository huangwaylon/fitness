<script lang="ts">
  // The health button in the HUD's top-right corner (docs/design.md "Island"): a small cream pill, 44px tall, with NH's
  // red dumbbell across it, no number (the numbers live in the popup), as wide as the jar in the other corner. Tap:
  // a press squash, the villagers glance up at it (R18), and the health popup grows out of the dumbbell
  // (HealthSheet, Sheet's `pop`: the zoom's origin is the dumbbell, --pop-x / --pop-y on the root).
  //   <HudHealth onopen={() => …} {later} />
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { hudGlance, react } from '../motion/director.svelte.ts';
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
    // the villagers glance up to the right, at it (then the jar's side again, for the idle peek)
    hudGlance.side = 'r';
    react('R18');
    later(() => (hudGlance.side = 'l'), 1_400);
    later(() => onopen?.(), 90);
  }
</script>

<button type="button" class="hud-health" class:pressed aria-label={t('island.health')} aria-haspopup="dialog" data-sfx="self" onclick={tap}
  onpointerdown={() => (pressed = true)} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="art" data-guard bind:this={artEl}><OfficialArt key="items/dumbbell" size="100%" eager /></span>
</button>

<style>
  /* One small cream pill, the tap target's height with the cream lip, the jar's width (--hud-side): the
     dumbbell across it, its plates a little over the pill's ends. */
  .hud-health {
    --art: clamp(62px, calc(8 * var(--vh1)), 70px);
    position: relative; flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: var(--hud-side, 56px); height: var(--hit); margin: 0; padding: 0;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); font: inherit;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; pointer-events: auto;
    transition: transform 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft);
  }
  .hud-health.pressed { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-lip); }
  .hud-health:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .art {
    position: absolute; left: 50%; top: 50%; width: var(--art); height: var(--art); translate: -50% -50%; display: flex;
    align-items: center; justify-content: center; pointer-events: none; transform-origin: 50% 60%;
    transition: transform 220ms cubic-bezier(.34, 1.56, .64, 1);
    filter: drop-shadow(0 2px 0 rgb(0 0 0 / .12));
  }
  .hud-health.pressed .art { transform: scale(.9) rotate(-6deg); transition: transform 80ms var(--ease-squash); }
</style>
