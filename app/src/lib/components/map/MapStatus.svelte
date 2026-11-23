<script lang="ts">
  // Every map's status chrome (docs/design.md "Maps"): the map that didn't come (no chunk or WebGL: a word and もう一度
  // on the themed sunk panel; offline with `offlineText`, a note instead, the map drawn again by itself once back
  // online: mapLoader) or a note over a drawn map (a cream tag, the day's ink at every hour), placed by one rule: `top`
  // is the px under the map's own top controls. `loading`: 「地図を読み込み中…」 once no tile has come for LOADING_MS
  // (never a flash on a fast load). One copy per message for every map. Also the one attribution style: a map's root
  // with class `map-attrib` gets the cream pill bottom-left over its --peek (hidden while `.covered`: a sheet at full).
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';

  const LOADING_MS = 2000;

  let { failed = false, note = null, text, top, bottom = '0px', loading = false, offlineText, onretry }: {
    failed?: boolean;
    /** The note (its data-map-note; null: none): the tiles offline, offline in the saved area, or the map's own. */
    note?: 'offline' | 'saved' | (string & {}) | null;
    /** A note of the map's own's text. */
    text?: string;
    /** The note's top inside the map: the px under the map's own top controls. */
    top: string;
    /** The failed panel's bottom inset (a sheet peeking over the map). */
    bottom?: string;
    /** The map is still loading (no tile yet): the loading note after LOADING_MS. */
    loading?: boolean;
    /** Failed while offline: this note (data-map-note="offline") instead of the panel. */
    offlineText?: string;
    onretry: () => void;
  } = $props();

  let slow = $state(false);
  $effect(() => {
    if (!loading) return void (slow = false);
    const id = setTimeout(() => (slow = true), LOADING_MS);
    return () => clearTimeout(id);
  });
  const quiet = $derived(failed && !!offlineText && !online.current);
  const shown = $derived(quiet ? 'offline' : note ?? (loading && slow ? 'loading' : null));
  const words = $derived(
    quiet ? offlineText : shown === 'saved' ? t('offline.savedOnly') : shown === 'offline' ? t('offline.mapRoute') : shown === 'loading' ? t('offline.mapLoading') : text
  );
</script>

{#if failed && !quiet}
  <div class="failed" data-map-failed style:bottom>
    <p>{t('offline.mapFailed')}</p>
    <button type="button" class="btn small paper" data-map-retry data-sfx="tick" onclick={onretry}>{t('state.retry')}</button>
  </div>
{:else if shown}
  <p class="note obj-cream" data-map-note={shown} role="status" style:top>{words}</p>
{/if}

<style>
  .failed {
    position: absolute; inset: 0; z-index: 1001; display: grid; place-content: center; justify-items: center; gap: 12px; padding: 16px;
    background: var(--ctl-off); color: var(--text-soft); font: 700 var(--fs-body)/1.4 var(--font-ui); text-align: center;
  }
  .failed p { margin: 0; }
  /* (the pins under it still tappable) */
  .note {
    position: absolute; z-index: 1001; left: 50%; translate: -50% 0; width: max-content; max-width: calc(100% - 24px); margin: 0; padding: 6px 12px;
    border-radius: 14px; background: var(--c-cream); color: var(--text); font: 700 var(--fs-s)/1.35 var(--font-ui); text-align: center;
    white-space: pre-line; pointer-events: none; box-shadow: inset 0 0 0 2px var(--c-edge), 0 3px 0 var(--c-edge);
  }

  /* the attribution (ODbL, the topo's credit): small, cream, bottom-left over what covers the map's bottom */
  :global(.map-attrib .maplibregl-ctrl-bottom-left) { bottom: var(--peek, 0px); left: var(--safe-left, 0px); z-index: 1001; transition: bottom .32s var(--ease-soft); }
  :global(.map-attrib.covered .maplibregl-ctrl-bottom-left) { visibility: hidden; }
  :global(.map-attrib .maplibregl-ctrl-attrib) {
    margin: 0 0 6px 6px; padding: 1px 7px; border-radius: var(--r-pill); background: rgba(255, 249, 227, .82);
    font: 500 9.5px/1.5 var(--font-ui); color: var(--c-ink-soft);
  }
  :global(.map-attrib .maplibregl-ctrl-attrib a) { color: inherit; }
</style>
