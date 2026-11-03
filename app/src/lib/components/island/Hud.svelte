<script lang="ts">
  // 島's HUD, NH island-view light: the sky clean, three controls along its top (docs/design.md "Island"). On
  // the left the jar (the shared wallet's ベル written in it, today's +N flashing beside it as coins land) → the
  // island panel slides down on ごほうび (where today's ベル are shown), its tabs きろく · ごほうび · せってい; on the
  // right the health button (NH's dumbbell) → the health popup (けんこう); between them, centred, the meal button (NH's
  // ramen bowl) → the meal log (ごはん). Only when sync is not ok, the sync chip centred under the row. The panel and
  // the popups are their own chunks, loaded on first open.
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import SyncPill from '../ui/SyncPill.svelte';
  import HudFood from './HudFood.svelte';
  import HudHealth from './HudHealth.svelte';
  import HudJar from './HudJar.svelte';
  import { lazy } from '#lib/ui-state/reload.ts';

  interface Props {
    /** Today's ベル so far, both people (the jar's label and its flash; shown in full in ごほうび). */
    today: number;
    /** The shared wallet's balance (the jar's number). */
    balance: number;
    /** Bindable: the panel is open (the island pauses under it). */
    panelOpen?: boolean;
    /** Bindable: the health popup is open (the island pauses under it too). */
    healthOpen?: boolean;
    /** Bindable: the meal log is open (the island pauses under it too). */
    foodOpen?: boolean;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { today, balance, panelOpen = $bindable(false), healthOpen = $bindable(false), foodOpen = $bindable(false), later }: Props = $props();
  const loadPanel = lazy(() => import('../panel/IslandPanel.svelte'));
  const loadHealth = lazy(() => import('../health/HealthSheet.svelte'));
  const loadFood = lazy(() => import('../food/FoodSheet.svelte'));
  /** Mounted from the first open on (each keeps its state between opens). */
  let opened = $state(false);
  let healthMounted = $state(false);
  let foodMounted = $state(false);
  // the old /jar page (`?panel=rewards`): the panel open at once
  onMount(() => {
    if (new URLSearchParams(location.search).get('panel') !== 'rewards') return;
    // the param goes (a reload opens the island as ever), the rest of the query stays as it was written
    const q = location.search.replace(/([?&])panel=rewards(&|$)/, (_, a: string, b: string) => (b ? a : '')).replace(/^\?$/, '');
    replaceState(location.pathname + q + location.hash, page.state);
    opened = panelOpen = true;
  });
</script>

<!-- (.ribbon-wrap: the HUD's box, by its old name: the 3D island measures it for the sky under it) -->
<div class="ribbon-wrap">
  <div class="hud-row">
    <HudJar bells={balance} {today} {later} expanded={panelOpen} onopen={() => (opened = panelOpen = true)} />
    <HudFood {later} onopen={() => { foodMounted = true; foodOpen = true; }} />
    <HudHealth {later} onopen={() => { healthMounted = true; healthOpen = true; }} />
  </div>
  <SyncPill />
</div>

{#if opened}
  {#await loadPanel() then { default: IslandPanel }}<IslandPanel bind:open={panelOpen} />{/await}
{/if}
{#if foodMounted}
  {#await loadFood() then { default: FoodSheet }}<FoodSheet bind:open={foodOpen} />{/await}
{/if}
{#if healthMounted}
  {#await loadHealth() then { default: HealthSheet }}<HealthSheet bind:open={healthOpen} />{/await}
{/if}

<style>
  /* across the column (left/right 0 inside the centred .island), at --hud-top (tokens.css: 10px under the safe area,
     clear of iOS 27's top-edge blur); the chip, when shown, sits centred 12px under the row */
  .ribbon-wrap {
    position: absolute; z-index: var(--z-hud); left: 0; right: 0; top: var(--hud-top);
    display: flex; flex-direction: column; align-items: center; gap: 12px; pointer-events: none;
  }
  /* only the controls take taps: the sky between them lets a tap through (the sun, the moon, a wish) */
  .ribbon-wrap > :global(*:not(.hud-row)), .hud-row > :global(*) { pointer-events: auto; }
  /* [the jar] … [the meal button] … [the health button]: the two top corners the same width (--hud-side) so they
     mirror each other and the meal button sits on the middle, inset 14px or the safe area's side (a landscape notch);
     the row is under the safe area (--hud-top), so the Dynamic Island stays clear above it; the sky beside the bowl
     stays clear for the sun, the moon and the balloon */
  .hud-row {
    --hud-side: 60px;
    align-self: stretch; display: flex; align-items: center; justify-content: space-between;
    padding: 0 max(14px, var(--safe-right)) 0 max(14px, var(--safe-left));
  }
</style>
