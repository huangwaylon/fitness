<script lang="ts">
  // 島's HUD, NH island-view light: the sky clean, one small cluster in its top-right corner (docs/design.md "Island"):
  // [the health button] [the menu]. The health button (NH's dumbbell) → けんこう and ごはん's sheet (HealthSheet: two
  // tabs); the menu (NH's leaf, at the screen's side) drops eight pills under it (HudMenu): the ベル row (my
  // wallet's balance; today's +N flashing by the leaf as coins land) → the island panel (ごほうび), the others (旅行,
  // 結婚式, 登山, 地図, 英語, ボット, 設定) each open their own sheet, at once (each sheet's chunk fetched ahead: sheetChunks.ts).
  // Only when sync is not ok, the sync chip centred under the row; under it, while 設定's 季節 is on, its chip. The
  // panel, the popups and every sheet are their own chunks, loaded on first open.
  import { onMount } from 'svelte';
  import { replaceState } from '$app/navigation';
  import { page } from '$app/state';
  import Lazy from '../ui/Lazy.svelte';
  import SyncPill from '../ui/SyncPill.svelte';
  import PreviewPill from './PreviewPill.svelte';
  import HudHealth from './HudHealth.svelte';
  import HudMenu from './HudMenu.svelte';
  import { trips } from '../travel/open.svelte.ts';
  import { weddingSheet } from '../wedding/open.svelte.ts';
  import { todoSheet } from '../todo/open.svelte.ts';
  import { hiking, listenHike, openHike } from '../hiking/open.svelte.ts';
  import { placesSheet } from '../places/open.svelte.ts';
  import { english } from '#lib/english/open.svelte.ts';
  import { kenkou } from '../health/open.svelte.ts';
  import { botsSheet, listenOpen, openIts, openTodo } from '../bots/open.svelte.ts';
  import { loadPanel, loadSettings, loadZukan, prefetchSheets } from './sheetChunks.ts';

  interface Props {
    /** Today's ベル so far, both people (the ベル row's label and the flash; shown in full in ごほうび). */
    today: number;
    /** My wallet's balance (the ベル row's number; the guest's 0). */
    balance: number;
    /** Bindable: the panel is open (the island pauses under it). */
    panelOpen?: boolean;
    /** Bindable: ずかん, せってい open (the island pauses under them too). */
    zukanOpen?: boolean;
    settingsOpen?: boolean;
    /** The page's timer (cleared with the page). */
    later: (fn: () => void, ms: number) => void;
  }
  let { today, balance, panelOpen = $bindable(false), zukanOpen = $bindable(false), settingsOpen = $bindable(false), later }: Props = $props();
  /** Mounted from the first open on (each keeps its state between opens). */
  let opened = $state(false);
  let zukanMounted = $state(false);
  let settingsMounted = $state(false);
  /** ずかん (opened from 設定's row, its only door) going back by ‹: 設定 reopens where it was. */
  let settingsResume = $state(false);
  // every sheet's chunk ahead of its first tap, once the island is in and the worker serves them
  onMount(prefetchSheets);
  /** A one-time param read: it goes (a reload opens the island as ever), the rest of the query stays as it was written;
   *  `more`: the params that came with it, gone in the same replace (a second replace read the query from before the first). */
  function take(k: string, v: string, more: [string, string | undefined][] = []): boolean {
    if (new URLSearchParams(location.search).get(k) !== v) return false;
    let q = location.search;
    for (const [a, b] of [[k, v], ...more]) if (b) q = q.replace(new RegExp(`([?&])${a}=${b}(&|$)`), (_, x: string, y: string) => (y ? x : ''));
    replaceState(location.pathname + q.replace(/^\?$/, '') + location.hash, page.state);
    return true;
  }
  // the old /jar page (`?panel=rewards`): the panel open at once; a notification's `?open=its`: ボット on 保養所, its
  // `?open=todo&list=…&item=…`: やること there
  onMount(() => {
    if (take('panel', 'rewards')) opened = panelOpen = true;
    // a notification's tap opened the app (service-worker/notify.ts): ボット on 保養所; one while open: its message
    const q = new URLSearchParams(location.search);
    if (q.get('open') === 'its') {
      openIts();
      take('open', 'its');
    }
    // a やること reminder's: the list at its item
    if (q.get('open') === 'todo') {
      const at = { list: q.get('list') ?? undefined, item: q.get('item') ?? undefined };
      openTodo(at);
      take('open', 'todo', [['list', at.list], ['item', at.item]]);
    }
    // a hike's (its own, hiking/map/notify.ts): the trail, back in hike mode
    const trail = q.get('open') === 'hike' ? q.get('trail') : null;
    if (trail && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(trail)) {
      openHike(trail);
      take('open', 'hike', [['trail', trail]]);
    }
    const off = [listenOpen(), listenHike()];
    return () => off.forEach((f) => f());
  });
</script>

<!-- (.ribbon-wrap: the HUD's box, by its old name: the 3D island measures it for the sky under it) -->
<div class="ribbon-wrap">
  <div class="hud-row">
    <HudHealth onopen={() => kenkou.show()} />
    <HudMenu bells={balance} {today} {later} expanded={panelOpen} onbells={() => (opened = panelOpen = true)}
      onsettings={() => { settingsMounted = true; settingsOpen = true; }} />
  </div>
  <SyncPill />
  <PreviewPill />
</div>

<!-- each sheet through <Lazy> (a failed chunk: the island's toast with もういちど), its loader quiet: <Lazy> does the stale-build reload -->
{#if opened}
  <Lazy floating load={() => loadPanel(true)}>{#snippet children(IslandPanel)}<IslandPanel bind:open={panelOpen} />{/snippet}</Lazy>
{/if}
{#if zukanMounted}
  <Lazy floating load={() => loadZukan(true)}>{#snippet children(ZukanSheet)}<ZukanSheet bind:open={zukanOpen} onback={() => (settingsResume = settingsOpen = true)} />{/snippet}</Lazy>
{/if}
{#if settingsMounted}
  <Lazy floating load={() => loadSettings(true)}>{#snippet children(SettingsSheet)}<SettingsSheet bind:open={settingsOpen} bind:resume={settingsResume} onzukan={() => { zukanMounted = true; zukanOpen = true; }} />{/snippet}</Lazy>
{/if}
<!-- 旅行's and 結婚式's sheets, lazySheets from their first opening (the menu's pills) -->
{#if trips.Sheet}<trips.Sheet bind:open={trips.open} />{/if}
{#if weddingSheet.Sheet}<weddingSheet.Sheet bind:open={weddingSheet.open} />{/if}
<!-- やること's (the menu's pill) -->
{#if todoSheet.Sheet}<todoSheet.Sheet bind:open={todoSheet.open} />{/if}
<!-- トレイル's, opened by the menu's pill or a hike card (over りょこう's) -->
{#if hiking.Sheet}<hiking.Sheet bind:open={hiking.open} />{/if}
<!-- 保存した場所's (the menu's 地図 pill) -->
{#if placesSheet.Sheet}<placesSheet.Sheet bind:open={placesSheet.open} />{/if}
<!-- English Study's (lib/english) -->
{#if english.Sheet}<english.Sheet bind:open={english.open} />{/if}
<!-- ボット's, opened by the menu's pill (members only) -->
{#if botsSheet.Sheet}<botsSheet.Sheet bind:open={botsSheet.open} />{/if}
<!-- けんこう and ごはん's, opened by the dumbbell or a tree's ごはん -->
{#if kenkou.Sheet}<kenkou.Sheet bind:open={kenkou.open} />{/if}

<style>
  /* across the column (left/right 0 inside the centred .island), at --hud-top (tokens.css: 10px under the safe area,
     clear of iOS 27's top-edge blur); the chip, when shown, sits centred 12px under the row */
  .ribbon-wrap {
    position: absolute; z-index: var(--z-hud); left: 0; right: 0; top: var(--hud-top);
    display: flex; flex-direction: column; align-items: center; gap: 12px; pointer-events: none;
  }
  /* only the controls take taps: the sky between them lets a tap through (the sun, the moon, a wish) */
  .ribbon-wrap > :global(*:not(.hud-row)), .hud-row > :global(*) { pointer-events: auto; }
  /* [the health button] [the menu]: one cluster in the top-right corner, inset 14px or the safe area's side (a
     landscape notch), 6px apart; the dumbbell's pill --hud-side wide, the menu's
     44px disc at the right end (its pills drop under it along the screen's side); the row is under the safe area
     (--hud-top), so the Dynamic Island stays clear above it, and the sky's left clear for the sun, the moon and the
     balloon */
  .hud-row {
    --hud-side: 60px;
    align-self: stretch; display: flex; align-items: center; justify-content: flex-end; gap: 6px;
    padding: 0 max(14px, var(--safe-right)) 0 max(14px, var(--safe-left));
  }
</style>
