<script lang="ts">
  // 島's HUD, NH island-view light: the sky clean, one small cluster in its top-right corner (docs/design.md "Island"):
  // [the health button] [the meal button] [the menu]. The health button (NH's dumbbell) → the health popup (けんこう);
  // the meal button (NH's ramen bowl) → the meal log (ごはん); the menu (NH's leaf, at the screen's side) drops
  // 「ベル 121」, ずかん and せってい under it: the ベル row (the shared wallet's balance; today's +N flashing by the leaf as
  // coins land) → the island panel slides down (ごほうび), the others each open their own sheet grown out of them. Only
  // when sync is not ok, the sync chip centred under the row; under it, while せってい's きせつ is on, its chip. The
  // panel, the popups and the two sheets are their own chunks, loaded on first open.
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import SyncPill from '../ui/SyncPill.svelte';
  import PreviewPill from './PreviewPill.svelte';
  import HudFood from './HudFood.svelte';
  import HudHealth from './HudHealth.svelte';
  import HudMenu from './HudMenu.svelte';
  import { lazy } from '#lib/ui-state/reload.ts';

  interface Props {
    /** Today's ベル so far, both people (the ベル row's label and the flash; shown in full in ごほうび). */
    today: number;
    /** The shared wallet's balance (the ベル row's number). */
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
  const loadZukan = lazy(() => import('../kiroku/ZukanSheet.svelte'));
  const loadSettings = lazy(() => import('../panel/SettingsSheet.svelte'));
  /** Mounted from the first open on (each keeps its state between opens). */
  let opened = $state(false);
  let healthMounted = $state(false);
  let foodMounted = $state(false);
  let zukanMounted = $state(false);
  let settingsMounted = $state(false);
  let zukanOpen = $state(false);
  let settingsOpen = $state(false);
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
    <HudHealth {later} onopen={() => { healthMounted = true; healthOpen = true; }} />
    <HudFood {later} onopen={() => { foodMounted = true; foodOpen = true; }} />
    <HudMenu bells={balance} {today} {later} expanded={panelOpen} onbells={() => (opened = panelOpen = true)}
      onzukan={() => { zukanMounted = true; zukanOpen = true; }} onsettings={() => { settingsMounted = true; settingsOpen = true; }} />
  </div>
  <SyncPill />
  <PreviewPill />
</div>

{#if opened}
  {#await loadPanel() then { default: IslandPanel }}<IslandPanel bind:open={panelOpen} />{/await}
{/if}
{#if foodMounted}
  {#await loadFood() then { default: FoodSheet }}<FoodSheet bind:open={foodOpen} />{/await}
{/if}
{#if zukanMounted}
  {#await loadZukan() then { default: ZukanSheet }}<ZukanSheet bind:open={zukanOpen} />{/await}
{/if}
{#if settingsMounted}
  {#await loadSettings() then { default: SettingsSheet }}<SettingsSheet bind:open={settingsOpen} />{/await}
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
  /* [the health button] [the meal button] [the menu]: one cluster in the top-right corner, inset 14px or the safe
     area's side (a landscape notch), 6px apart; the dumbbell and the bowl the same width (--hud-side), the menu's
     44px disc at the right end (its pills drop under it along the screen's side); the row is under the safe area
     (--hud-top), so the Dynamic Island stays clear above it, and the sky's left clear for the sun, the moon and the
     balloon */
  .hud-row {
    --hud-side: 60px;
    align-self: stretch; display: flex; align-items: center; justify-content: flex-end; gap: 6px;
    padding: 0 max(14px, var(--safe-right)) 0 max(14px, var(--safe-left));
  }
</style>
