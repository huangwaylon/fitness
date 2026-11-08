<script lang="ts">
  // The health button, the HUD cluster's left end in the top-right corner (docs/design.md "Island"): a small cream pill,
  // 44px tall, with NH's red dumbbell across it, no number (the numbers live in the popup), --hud-side wide. Tap: a
  // press squash, the villagers glance up at it (R18), and けんこう and ごはん's sheet opens at once (HealthSheet: on the
  // tab shown last).
  //   <HudHealth onopen={() => …} />
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { prefetchSheet } from './sheetChunks.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** Tapped (open the health popup): at once. */
    onopen?: () => void;
  }
  let { onopen }: Props = $props();

  let pressed = $state(false);

  function tap() {
    pressed = false;
    // the villagers glance up to the right, at it
    react('R18');
    sheetTap();
    onopen?.();
  }
</script>

<button type="button" class="hud-health" class:pressed aria-label={t('island.health')} aria-haspopup="dialog" data-sfx="self" onclick={tap}
  onpointerdown={() => ((pressed = true), void prefetchSheet('health'))} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="art" data-guard><OfficialArt key="items/dumbbell" size="100%" eager /></span>
</button>

<style>
  /* One small cream pill, the tap target's height with the cream lip, --hud-side wide: the
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
