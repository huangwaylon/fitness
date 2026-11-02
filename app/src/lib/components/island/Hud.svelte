<script lang="ts">
  // 島's HUD, NH island-view light and symmetric: today's ベル ribbon centred under the notch / Dynamic Island (a copy
  // of the NH map's yellow title banner: the screen's one focal point, 「きょう +620 ベル」 for both of us) and, only
  // when sync is not ok, the sync chip centred under it. When ベル arrive the ribbon counts up (the focus beat).
  // Tap → the island panel slides down from under it (きろく first). Beside it the health button (NH's dumbbell) →
  // the health popup (けんこう). The panel and the popup are their own chunks, loaded on first open.
  import { onMount, tick, untrack } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import { Tween } from 'svelte/motion';
  import { cubicOut } from 'svelte/easing';
  import SyncPill from '../ui/SyncPill.svelte';
  import HudHealth from './HudHealth.svelte';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  interface Props {
    /** Today's ベル so far, both people. */
    bells: number;
    /** Bindable: the panel is open (the island pauses under it). */
    panelOpen?: boolean;
    /** Bindable: the health popup is open (the island pauses under it too). */
    healthOpen?: boolean;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { bells, panelOpen = $bindable(false), healthOpen = $bindable(false), later }: Props = $props();
  const loadPanel = lazy(() => import('../panel/IslandPanel.svelte'));
  const loadHealth = lazy(() => import('../health/HealthSheet.svelte'));
  /** Mounted from the first open on (each keeps its state between opens). */
  let opened = $state(false);
  let healthMounted = $state(false);
  /** The panel's first tab: ごほうび when the old /jar page sent us here (`?panel=rewards`), else きろく. */
  let start = $state<'kiroku' | 'rewards'>('kiroku');
  onMount(() => {
    if (new URLSearchParams(location.search).get('panel') !== 'rewards') return;
    // the param goes (a reload opens the island as ever), the rest of the query stays as it was written
    const q = location.search.replace(/([?&])panel=rewards(&|$)/, (_, a: string, b: string) => (b ? a : '')).replace(/^\?$/, '');
    replaceState(location.pathname + q + location.hash, page.state);
    start = 'rewards';
    opened = panelOpen = true;
  });

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
  <HudHealth {later} onopen={() => { healthMounted = true; healthOpen = true; }} />
  </div>
  <SyncPill />
</div>

{#if opened}
  {#await loadPanel() then { default: IslandPanel }}<IslandPanel bind:open={panelOpen} {start} />{/await}
{/if}
{#if healthMounted}
  {#await loadHealth() then { default: HealthSheet }}<HealthSheet bind:open={healthOpen} />{/await}
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
  /* the ribbon and the health button: one row, centred as a group (the ribbon's left tail counted in: the row's 16px left pad
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
  /* a coin lands in it (HudCoins): its number's small catch squash (the ribbon's box holds still) */
  .ribbon b:global(.catch) { animation: catch 260ms var(--ease-bounce); }
  @keyframes catch { 0%, 100% { transform: none; } 40% { transform: scale(1.06, .94); } }
  @keyframes beat { 0%, 100% { transform: none; } 30% { transform: scale(1.12); } }
  
</style>
