<script lang="ts">
  // トレイル's sheet (docs/hiking.md), its own chunk: the hiking app's two screens on a full-screen <dialog> in its own
  // look (the Alpine Field Guide: paper-cool neutrals, pine, serif headings; its tokens on `.trails`), not the island's
  // skin. The list stays mounted under a trail's view (its scroll and chips kept for ‹); ✕ closes the whole sheet
  // from either level, Esc first folds a trail's sheet down to its peek. The island is paused under it (+page's
  // sheetOpen); its open and close tunes are the panel's.
  import { untrack } from 'svelte';
  import NavButton from '../ui/NavButton.svelte';
  import TrailList from './TrailList.svelte';
  import TrailView from './TrailView.svelte';
  import { hikingAsk } from './open.svelte.ts';
  import { trailOf } from '#lib/hiking/trails.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { pick } from '../travel/text.ts';
  import { lockScroll } from '../ui/scrollLock.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';

  /** Its id in ui.sheets (Sheet.svelte's count up from 1). */
  const SHEET_ID = -1;

  let { open = $bindable() }: { open: boolean } = $props();
  let dlg: HTMLDialogElement | undefined = $state();
  let sel = $state<Trail | null>(null);
  let view: { escape(): boolean } | undefined = $state();

  // each ask (the menu's pill, a hike card) picks the level it opens on
  $effect(() => {
    void hikingAsk.n;
    untrack(() => (sel = trailOf(hikingAsk.slug)));
  });

  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (!dlg || o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
    if (o && !dlg.open) (dlg.showModal(), dlg.focus({ preventScroll: true }));
    else if (!o && dlg.open) dlg.close();
  });
  $effect(() => {
    if (!open) return;
    // one of the open sheets (the leaf menu folds, and gives the focus back to the leaf once they're all gone)
    untrack(() => (ui.sheets = [...ui.sheets, SHEET_ID]));
    const unlock = lockScroll();
    return () => (unlock(), untrack(() => (ui.sheets = ui.sheets.filter((x) => x !== SHEET_ID))));
  });

  const close = () => (open = false);
  /** The native close (Esc, ✕): a late one, after it was opened again at once (Chromium queues it), isn't a close. */
  const closed = () => !dlg?.open && (open = false);
  function cancel(e: Event) {
    if (view?.escape()) e.preventDefault();
  }
</script>

<dialog bind:this={dlg} class="trails" lang={i18n.locale} aria-label={pick(S.title, i18n.locale)} tabindex="-1" data-sfx="self" data-hiking
  data-level={sel ? 'trail' : 'list'} onclose={closed} oncancel={cancel}>
  {#if open}
    <TrailList hidden={!!sel} onopen={(t) => (sel = t)} />
    {#if sel}
      {#key sel.slug}<TrailView bind:this={view} trail={sel} onback={() => (sel = null)} />{/key}
    {/if}
    <!-- ✕, the same corner on both levels (the trail's zoom buttons sit under it) -->
    <div class="x"><NavButton kind="close" onclick={close} sfx="self" /></div>
  {/if}
</dialog>

<style>
  /* the hiking app's :root (its app.css tokens), on the sheet: everything inside reads them */
  .trails {
    --paper: #f3f5f1; --paper-2: #ecefe8; --surface: #ffffff; --surface-2: #f3f6f1;
    --ink: #16231d; --ink-2: #41504a; --muted: #515c55; --line: rgba(22, 35, 29, .10); --line-2: rgba(22, 35, 29, .055);
    --pine: #1f6f5c; --pine-d: #175949; --pine-soft: rgba(31, 111, 92, .10); --pine-ring: rgba(31, 111, 92, .30); --blaze-d: #9a4d1f;
    --track: #d4442e; --progress: #1f9d63; --gps: #2f6fe0; --wpt: #d6861c; --scrub: #7b5bff;
    --sh-card: 0 1px 2px rgba(22, 35, 29, .05), 0 7px 22px rgba(22, 35, 29, .085);
    --sh-pop: 0 8px 30px rgba(22, 35, 29, .18);
    --sh-fab: 0 2px 5px rgba(22, 35, 29, .10), 0 7px 20px rgba(22, 35, 29, .16);
    --r-card: 20px;
    --font-sans: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', Meiryo, 'Noto Sans JP', system-ui, sans-serif;
    --font-display: 'New York', 'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, 'Hiragino Sans', 'Hiragino Kaku Gothic ProN', 'Yu Gothic', 'Noto Sans JP', serif;
    --safe-t: env(safe-area-inset-top, 0px); --safe-b: env(safe-area-inset-bottom, 0px);
    --safe-l: env(safe-area-inset-left, 0px); --safe-r: env(safe-area-inset-right, 0px);

    position: fixed; inset: 0; width: 100%; height: 100%; max-width: none; max-height: none; margin: 0; padding: 0; border: 0;
    overflow: hidden; background: var(--paper); color: var(--ink);
    font-family: var(--font-sans); -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility;
    /* its Japanese wraps as the hiking app's did (anywhere, kinsoku kept), not the island's keep-all */
    word-break: normal; line-break: strict; overscroll-behavior: none; font-feature-settings: normal;
  }
  /* ✕ and ‹: NavButton in the hiking app's frosted round button (its .hbtn) */
  .x { position: absolute; z-index: 1100; top: calc(var(--safe-t) + 5px); right: calc(12px + var(--safe-r)); }
  .trails[data-level='list'] .x { top: calc(var(--safe-t) + 15px); }
  .trails :global(.nav) {
    width: 42px; height: 42px; border: 1px solid var(--line); border-radius: 50%; color: var(--ink);
    background: rgba(255, 255, 255, .86); -webkit-backdrop-filter: blur(12px); backdrop-filter: blur(12px); box-shadow: var(--sh-fab);
  }
  .trails :global(.nav:active) { transform: scale(.92); background: #fff; box-shadow: var(--sh-fab); }
  .trails :global(.nav svg) { width: 20px; height: 20px; }
  .trails[open] { animation: rise 240ms cubic-bezier(.2, .8, .2, 1); }
  .trails::backdrop { background: var(--paper, #f3f5f1); }
  .trails:focus { outline: none; }
  .trails :global(*) { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
  .trails :global(button) { font-family: inherit; color: inherit; }
  .trails :global(:focus-visible) { outline: 2.5px solid var(--pine); outline-offset: 2px; }
  .trails :global(:focus:not(:focus-visible)) { outline: none; }
  @keyframes rise { from { transform: translateY(6%); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .trails[open] { animation: none; } }
</style>
