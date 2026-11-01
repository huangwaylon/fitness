<script lang="ts">
  // 島's HUD, NH island-view light and symmetric: today's ベル ribbon centred under the notch / Dynamic Island (a copy
  // of the NH map's yellow title banner: the screen's one focal point, 「きょう +620 ベル」 for both of us) and, only
  // when sync is not ok, the sync chip centred under it. When ベル arrive the ribbon counts up (the focus beat).
  // Tap → the island panel slides down from under it (きろく first). The panel is its own chunk, loaded on first open.
  import { tick, untrack, type Snippet } from 'svelte';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import SyncPill from '../ui/SyncPill.svelte';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    /** Today's ベル so far, both people. */
    bells: number;
    /** Bindable: the panel is open (the island pauses under it). */
    panelOpen?: boolean;
    /** The jar (HudJar), beside the ribbon: the two are one group, centred. */
    jar?: Snippet;
  }
  let { bells, panelOpen = $bindable(false), jar }: Props = $props();
  const loadPanel = lazy(() => import('../panel/IslandPanel.svelte'));
  /** Mounted from the first open on (it keeps its state between opens). */
  let opened = $state(false);

  // Count-up on a rise (instant on a fall and on first paint), with a beat. The ribbon is never
  // remounted for it, so a focused ribbon keeps its focus.
  const shown = new Tween(untrack(() => bells), { duration: 900, easing: cubicOut });
  let beat = $state(false);
  let ribbon: HTMLButtonElement | undefined = $state();
  $effect(() => {
    const to = bells;
    const rise = to > untrack(() => shown.target);
    shown.set(to, { duration: rise ? 900 : 0 });
    if (rise) void replayBeat();
  });
  async function replayBeat() {
    beat = false;
    await tick();
    void ribbon?.offsetWidth; // restart the animation
    beat = true;
  }
</script>

<div class="ribbon-wrap">
  <div class="hud-row">
  <!-- Tap → the island panel (design.md "Panel"). -->
  <button type="button" class="ribbon" class:beat bind:this={ribbon} data-sfx="self" aria-label={t('hud.today', { bells: formatBells(bells) })}
    aria-haspopup="dialog" aria-expanded={panelOpen} onanimationend={() => (beat = false)} onclick={() => { opened = true; panelOpen = true; }}>
    <span class="wk" aria-hidden="true">{t('hud.todayShort')}</span><b class="money" aria-hidden="true">{shown.current >= 0.5 ? '+' : ''}{formatNum(shown.current)}<small>{t('bells.unit')}</small></b>
  </button>
  {@render jar?.()}
  </div>
  <SyncPill />
</div>

{#if opened}
  {#await loadPanel() then { default: IslandPanel }}<IslandPanel bind:open={panelOpen} />{/await}
{/if}

<style>
  /* centred on the column (left/right 0 inside the centred .island), its centre in the middle of the sky (--hud-top,
     tokens.css); the chip, when shown, sits centred 12px under the ribbon */
  .ribbon-wrap {
    position: absolute; z-index: var(--z-hud); left: 0; right: 0; top: var(--hud-top);
    display: flex; flex-direction: column; align-items: center; gap: 12px; pointer-events: none;
  }
  /* only the controls take taps: the gaps between them let a tap through to the sky (the sun, the moon) */
  .ribbon-wrap > :global(*:not(.hud-row)), .hud-row > :global(*) { pointer-events: auto; }
  /* the ribbon and the jar: one row, centred as a group (the ribbon's left tail counted in: the row's 16px left pad
     balances it), 24px apart (the right tail sits in the gap); on a narrow phone both tighten */
  .hud-row { display: flex; align-items: center; gap: clamp(20px, 6vw, 26px); padding-left: 16px; max-width: 100%; }
  .hud-row:has(> :only-child) { padding-left: 0; }
  .hud-row:not(:has(> :only-child)) .ribbon { padding: 0 clamp(12px, 4vw, 28px); gap: clamp(6px, 2.4vw, 10px); }
  /* The NH map title banner: a yuzu band, darker swallow-tails tucked behind each end. */
  .ribbon {
    appearance: none; border: 0; cursor: pointer; font: inherit; pointer-events: auto;
    /* 44px tall (the tap target); its type and padding grow with the screen */
    position: relative; margin: 0; height: var(--hit); padding: 0 clamp(22px, 6vw, 28px);
    display: flex; align-items: center; gap: 10px;
    background: var(--c-yuzu); color: var(--c-ink); border-radius: var(--r-chip); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip);
  }
  .ribbon::before, .ribbon::after {
    content: ''; position: absolute; z-index: -1; top: 25%; width: 24px; height: 83%; background: var(--c-yuzu-lip);
  }
  .ribbon::before { left: -16px; clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 38% 50%); }
  .ribbon::after { right: -16px; clip-path: polygon(0 0, 100% 0, 62% 50%, 100% 100%, 0 100%); }
  .wk { font: 700 clamp(.9375rem, calc(1.9 * var(--vh1)), 1.125rem)/1 var(--font-ui); }
  .ribbon b { font-size: clamp(1.5rem, calc(3.4 * var(--vh1)), 1.875rem); }
  .ribbon small { font: 700 .6em/1 var(--font-ui); margin-left: .3em; }
  .beat { animation: beat 900ms var(--ease-bounce); }
  @keyframes beat { 0%, 100% { transform: none; } 30% { transform: scale(1.12); } }
  
</style>
