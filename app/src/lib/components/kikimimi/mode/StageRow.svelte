<script lang="ts">
  // The ばしょ row (docs/kikimimi-ux.md §4, §6.4): the five places はまべ → ほし with their ★s, the picked one yuzu, a
  // place this build has no level for sunk (aria-disabled); はまべ's two sub-steps (1 · 2) under it while it's picked.
  // `readonly`: another's lobby (the host picks; the others see it).
  import { PLACES, lvOfPlace, placeOfLv } from '#lib/kikimimi/catalog.ts';
  import { t } from '#lib/i18n/index.ts';

  let { lv, levels, readonly = false, onpick }: { lv: number; levels: readonly number[]; readonly?: boolean; onpick: (lv: number) => void } = $props();
  const at = $derived(placeOfLv(lv));
  const hama = $derived(PLACES[0].lvs.filter((x) => levels.includes(x)));
  function pick(x: number | null) {
    if (x === null || readonly || x === lv) return;
    onpick(x);
  }
</script>

<section class="sec" aria-labelledby="kk-place">
  <h3 id="kk-place" class="sec-label">{t('kiki.level')}</h3>
  <div class="places" role="radiogroup" aria-labelledby="kk-place" data-kiki-places>
    {#each PLACES as p (p.id)}
      {@const x = lvOfPlace(p.id, levels, lv)}
      <button type="button" class="place tile-btn" role="radio" aria-checked={at === p.id} aria-disabled={x === null || (readonly && at !== p.id)}
        data-stage={p.id} data-level={p.id === 'hama' ? undefined : (x ?? undefined)} data-sfx={at === p.id || x === null ? 'none' : 'tick'} onclick={() => pick(x)}>
        <span class="stars" aria-hidden="true">{'★'.repeat(p.stars)}</span>
        <span>{t(`kiki.stage.${p.id}`)}</span>
      </button>
    {/each}
  </div>
  {#if at === 'hama' && hama.length > 1}
    <div class="subs" role="radiogroup" aria-label={t('kiki.stage.hama')}>
      {#each hama as x (x)}
        <button type="button" class="chip big" role="radio" aria-checked={lv === x} aria-disabled={readonly && lv !== x} data-level={x}
          data-sfx={lv === x ? 'none' : 'tick'} onclick={() => pick(x)}>{t(`kiki.lv.${x}`)}</button>
      {/each}
    </div>
  {/if}
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .places { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .place {
    min-height: 60px; padding: 4px 2px; border-radius: var(--r-card); display: grid; place-content: center; gap: 2px;
    font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center;
  }
  .place[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .place[aria-disabled='true']:not([aria-checked='true']) { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  .stars { color: var(--c-coral); font-size: 9px; letter-spacing: 0; line-height: 1; }
  .place[aria-checked='true'] .stars { color: var(--c-coral-text); }
  .subs { display: flex; gap: 8px; }
  .subs .chip { flex: 1; }
  .subs .chip[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
</style>
