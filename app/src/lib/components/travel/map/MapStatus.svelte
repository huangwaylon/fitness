<script lang="ts">
  // The trip map's and the trail map's one status chrome (docs/travel.md "Maps"): the map that didn't come (no chunk or
  // WebGL: a word and もう一度 on the themed sunk panel) or a note over a drawn map (a cream tag, the day's ink at every
  // hour). One copy per message for both maps.
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';

  let { failed = false, note = null, text, top, bottom = '0px', onretry }: {
    failed?: boolean;
    /** The note (its data-map-note; null: none): the tiles offline, offline in the saved area, or the map's own. */
    note?: 'offline' | 'saved' | (string & {}) | null;
    /** A note of the map's own's text. */
    text?: string;
    /** The note's top inside the map (under the map's own buttons). */
    top: string;
    /** The failed panel's bottom inset (a sheet peeking over the map). */
    bottom?: string;
    onretry: () => void;
  } = $props();
</script>

{#if failed}
  <div class="failed" data-map-failed style:bottom>
    <p>{t('offline.mapFailed')}</p>
    <button type="button" class="btn small paper" data-map-retry data-sfx="tick" onclick={onretry}>{t('state.retry')}</button>
  </div>
{:else if note}
  <p class="note obj-cream" data-map-note={note} role="status" style:top>{note === 'saved' ? t('offline.savedOnly') : note === 'offline' ? t('offline.mapRoute') : text}</p>
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
</style>
