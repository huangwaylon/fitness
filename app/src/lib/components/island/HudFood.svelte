<script lang="ts">
  // The meal button in the HUD's top-right cluster, between the dumbbell and the leaf menu (docs/design.md "Island", "Gohan"): the health
  // button's cream pill (HudHealth), NH's ramen bowl (`items/dinner`) across it, no number. Tap: a press squash, the
  // villagers glance up at it (R18), and the meal log (ごはん) grows out of the bowl (FoodSheet, Sheet's `pop`, --pop-x / --pop-y).
  //   <HudFood onopen={() => …} />
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { prefetchSheet } from './sheetChunks.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** Tapped (open the meal log): at once (the press squash plays over its zoom). */
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

<button type="button" class="hud-food" class:pressed aria-label={t('island.food')} aria-haspopup="dialog" data-sfx="self" onclick={tap}
  onpointerdown={() => ((pressed = true), void prefetchSheet('food'))} onpointerup={() => (pressed = false)} onpointerleave={() => (pressed = false)} onpointercancel={() => (pressed = false)}>
  <span class="art" data-guard><OfficialArt key="items/dinner" size="100%" eager /></span>
</button>

<style>
  /* The health button's pill (HudHealth), the bowl standing in it a little over its top. */
  .hud-food {
    --art: clamp(54px, calc(7 * var(--vh1)), 60px);
    position: relative; flex: none; display: inline-flex; align-items: center; justify-content: center;
    width: var(--hud-side, 56px); height: var(--hit); margin: 0; padding: 0;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); font: inherit;
    -webkit-tap-highlight-color: transparent; touch-action: manipulation; pointer-events: auto;
    transition: transform 160ms var(--ease-soft), box-shadow 160ms var(--ease-soft);
  }
  .hud-food.pressed { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-lip); }
  .hud-food:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .art {
    position: absolute; left: 50%; top: 50%; width: var(--art); height: var(--art); display: flex;
    /* lowered from the pill's centre: the bowl's nori stands over its rim, so centred by its box the bowl read high
       (the user); 3px down puts the bowl itself mid-pill, its foot on the lip as the dumbbell's plates are */
    translate: -50% calc(-50% + 3px);
    align-items: center; justify-content: center; pointer-events: none; transform-origin: 50% 60%;
    transition: transform 220ms cubic-bezier(.34, 1.56, .64, 1);
    filter: drop-shadow(0 2px 0 rgb(0 0 0 / .12));
  }
  .hud-food.pressed .art { transform: scale(.9) rotate(4deg); transition: transform 80ms var(--ease-squash); }
</style>
