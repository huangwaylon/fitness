<script lang="ts">
  // The HUD menu, the cluster's left end (docs/design.md "Island"): a small round cream button with NH's leaf (the
  // toggle; aria-expanded) that drops two pills down under it, one after the other on a small spring: ずかん (NH's
  // agrias butterfly) and せってい (a gear). Folded by default: the sky keeps only the menu, the jar and the dumbbell. It folds
  // again on a second tap of the leaf, a tap anywhere else (that tap still goes where it was aimed), Esc, a sheet
  // opening, or a pick (a pill: a press squash, the villagers glance up at it (R18), then its sheet grows out of it,
  // Sheet's `pop`). Folded, the pills are hidden and inert (no taps, no focus, out of placement.ts' guards).
  //   <HudMenu onzukan={() => …} onsettings={() => …} {later} />
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { react } from '../motion/director.svelte.ts';
  import { popFrom } from './popFrom.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    /** ずかん picked (open the ずかん), after the press beat. */
    onzukan?: () => void;
    /** せってい picked (open せってい), after the press beat. */
    onsettings?: () => void;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { onzukan, onsettings, later }: Props = $props();

  let open = $state(false);
  let root: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  // a sheet opening (the jar's panel, けんこう, a tree's …) or もようがえ folds it
  $effect(() => {
    if (ui.sheets.length || ui.decorating) open = false;
  });

  // open: a tap outside folds it (capture, so it folds whatever the tap lands on; the tap itself goes on), Esc too
  $effect(() => {
    if (!open) return;
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !root?.contains(e.target)) open = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      open = false;
      toggleEl?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key);
    };
  });

  function pick(e: MouseEvent, go: (() => void) | undefined) {
    popFrom((e.currentTarget as HTMLElement).querySelector('.ic'));
    react('R18');
    open = false;
    later(() => go?.(), 90);
  }
</script>

<div class="hud-menu" class:open bind:this={root}>
  <button type="button" class="more" bind:this={toggleEl} aria-label={t('island.menu')} aria-expanded={open} aria-controls="hud-menu-items"
    data-hud-menu data-sfx={open ? 'toggle-off' : 'toggle-on'} onclick={() => (open = !open)}>
    <span class="leaf" data-guard><OfficialArt key="money/leaf" size="100%" eager /></span>
  </button>
  <div class="items" id="hud-menu-items" role="group" aria-label={t('island.menu')} inert={!open}>
    <button type="button" class="item" style="--i: 0" data-hud-zukan aria-haspopup="dialog" data-sfx="self" onclick={(e) => pick(e, onzukan)}>
      <span class="lbl">{t('zukan.title')}</span>
      <span class="ic"><OfficialArt key="critters/agrias-butterfly" size={30} eager /></span>
    </button>
    <button type="button" class="item" style="--i: 1" data-hud-settings aria-haspopup="dialog" data-sfx="self" onclick={(e) => pick(e, onsettings)}>
      <span class="lbl">{t('island.settings')}</span>
      <span class="ic">
        <!-- a gear in the say button's soft brown (no settings icon in NH's art) -->
        <svg viewBox="0 0 24 24" aria-hidden="true"><path class="gear" d="M10.3 2.6h3.4l.5 2.6c.6.2 1.2.5 1.7.9l2.5-.9 1.7 2.9-2 1.7c.1.6.1 1.3 0 1.9l2 1.7-1.7 2.9-2.5-.9c-.5.4-1.1.7-1.7.9l-.5 2.6h-3.4l-.5-2.6c-.6-.2-1.2-.5-1.7-.9l-2.5.9-1.7-2.9 2-1.7c-.1-.6-.1-1.3 0-1.9l-2-1.7 1.7-2.9 2.5.9c.5-.4 1.1-.7 1.7-.9z" transform="translate(0 1)" /><circle cx="12" cy="13" r="3.2" /></svg>
      </span>
    </button>
  </div>
</div>

<style>
  /* The toggle: 44px to the thumb, a 40px cream disc with the cream lip to the eye (the jar's and the dumbbell's
     cream), NH's leaf in it. Open: the disc NH's yellow, the leaf tipped as if it flicked the menu down. */
  .hud-menu { position: relative; flex: none; width: var(--hit); height: var(--hit); }
  .more {
    position: relative; width: var(--hit); height: var(--hit); margin: 0; padding: 0; display: grid; place-items: center;
    appearance: none; border: 0; background: none; cursor: pointer; color: var(--c-ink);
    -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .more::before {
    content: ''; position: absolute; inset: 2px 2px 4px; border-radius: 50%; background: var(--c-cream);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); transition: background-color 180ms var(--ease-soft), translate 120ms, box-shadow 120ms;
  }
  .more:active::before { translate: 0 2px; box-shadow: 0 2px 0 var(--c-lip); }
  .open .more::before { background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); }
  .more:focus-visible { outline: none; }
  .more:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .leaf {
    position: relative; width: 26px; height: 26px; margin-top: -2px; display: flex; pointer-events: none;
    filter: drop-shadow(0 1px 0 rgb(0 0 0 / .12)); transition: transform 320ms var(--ease-bounce);
  }
  .more:active .leaf { transform: scale(.88); transition-duration: 80ms; }
  .open .leaf { transform: rotate(-40deg) scale(1.06); }

  /* The pills: a column hanging under the toggle, right-aligned to its right edge (the sky under the cluster; the
     row's box, which the 3D island measures, stays the row: the column is out of flow), each a 44px cream pill with
     the lip, its name and its icon. They drop out of the leaf one after the other on a small spring (NH's bounce),
     and fold back up into it quicker, the last first; the two as wide as the longer (the name left, the icon right); folded they are hidden (visibility, after the fold). */
  .items {
    position: absolute; right: 0; top: calc(100% + 8px); display: grid; gap: 10px; width: max-content;
    pointer-events: none;
  }
  .item {
    --n: 2;
    position: relative; display: flex; align-items: center; justify-content: space-between; gap: 10px; height: var(--hit); margin: 0; padding: 0 4px 0 14px;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; white-space: nowrap;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14);
    font: 700 var(--fs-body)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    transform-origin: calc(100% - 22px) -30px;
    opacity: 0; visibility: hidden; transform: translateY(calc(-14px - var(--i) * 40px)) scale(.4);
    transition: transform 160ms var(--ease-squash) calc((var(--n) - 1 - var(--i)) * 30ms), opacity 120ms linear calc((var(--n) - 1 - var(--i)) * 30ms),
      visibility 0s linear 220ms;
  }
  .open .item {
    opacity: 1; visibility: visible; transform: none; pointer-events: auto;
    transition: transform 380ms var(--ease-bounce) calc(var(--i) * 55ms), opacity 140ms linear calc(var(--i) * 55ms), visibility 0s;
  }
  .open .item:active { transform: translateY(2px) scale(.97); box-shadow: 0 2px 0 var(--c-lip); transition: transform 80ms var(--ease-squash), box-shadow 80ms; }
  .item:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .lbl { letter-spacing: .02em; }
  .ic { flex: none; width: 36px; height: 36px; display: grid; place-items: center; line-height: 0; }
  .ic svg { width: 26px; height: 26px; }
  .gear { fill: #A88B68; }
  circle { fill: var(--c-cream); }

  /* reduced motion: no drop, no tip: the pills fade in and out where they stand */
  @media (prefers-reduced-motion: reduce) {
    .leaf, .open .leaf { transform: none; transition: none; }
    .item { transform: none; transition: opacity 120ms linear, visibility 0s linear 120ms; }
    .open .item { transform: none; transition: opacity 120ms linear, visibility 0s; }
  }
</style>
