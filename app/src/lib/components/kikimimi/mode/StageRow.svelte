<script lang="ts">
  // The ばしょ row (docs/kikimimi.md "Places", "Mode detail"): the five places はまべ → ほし with their ★s, the picked one yuzu, a
  // place this build has no level for sunk (aria-disabled); はまべ's two sub-steps (1 · 2) under it while it's picked.
  // `content` (a lane's game: every place offered, its content's places): a picked place with none says whose it plays
  // and whether harder or easier (catalog.ts nearOf).
  // `readonly`: another's lobby (the host picks; the others see it). `omakase` (a mode's page): 「おまかせ」 by the label
  // while the place is the suggested one (みみ チェック's), else 「おまかせに もどす」.
  import { PLACES, lvOfPlace, nearOf, placeOfLv } from '#lib/kikimimi/catalog.ts';
  import { t } from '#lib/i18n/index.ts';

  let { lv, levels, content, readonly = false, onpick, omakase }: {
    lv: number; levels: readonly number[]; content?: readonly number[]; readonly?: boolean; onpick: (lv: number) => void; omakase?: { on: boolean; onreset: () => void };
  } = $props();
  const at = $derived(placeOfLv(lv));
  const near = $derived(content ? nearOf(lv, content) : null);
  const hama = $derived(PLACES[0].lvs.filter((x) => levels.includes(x)));
  function pick(x: number | null) {
    if (x === null || readonly || x === lv) return;
    onpick(x);
  }
</script>

<section class="sec" aria-labelledby="kk-place">
  <div class="head">
    <h3 id="kk-place" class="sec-label">{t('kiki.level')}</h3>
    {#if omakase?.on}<span class="pill" data-kiki-omakase>{t('kiki.omakase')}</span>
    {:else if omakase}<button type="button" class="chip" data-kiki-omakase-reset data-sfx="tick" onclick={omakase.onreset}>{t('kiki.omakase.reset')}</button>{/if}
  </div>
  <div class="places" role="radiogroup" aria-labelledby="kk-place" data-kiki-places>
    {#each PLACES as p (p.id)}
      {@const x = lvOfPlace(p.id, levels, lv)}
      <button type="button" class="place tile-btn" class:obj-cream={at === p.id} role="radio" aria-checked={at === p.id} aria-disabled={x === null || (readonly && at !== p.id)}
        data-stage={p.id} data-level={p.id === 'hama' ? undefined : (x ?? undefined)} data-sfx={at === p.id || x === null ? 'none' : 'tick'} onclick={() => pick(x)}>
        <span class="stars" aria-hidden="true">{'★'.repeat(p.stars)}</span>
        <span>{t(`kiki.stage.${p.id}`)}</span>
      </button>
    {/each}
  </div>
  {#if near}<p class="hint" data-kiki-place-near={near.near}>{t(`kiki.place.near.${near.harder ? 'up' : 'down'}`, { at: t(`kiki.stage.${near.at}`), near: t(`kiki.stage.${near.near}`) })}</p>
  {:else if omakase?.on}<p class="hint" data-kiki-omakase-hint>{t('kiki.omakase.hint')}</p>{/if}
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
  .head { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 32px; }
  .pill { padding: 4px 10px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 45%, var(--card)); color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .places { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; }
  .place {
    min-height: 60px; padding: 4px 2px; border-radius: var(--r-card); display: grid; place-content: center; gap: 2px;
    font: 700 var(--fs-s)/1.2 var(--font-ui); text-align: center;
  }
  .place[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); }
  .place[aria-disabled='true']:not([aria-checked='true']) { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
  /* the stars: the coral text colour (the day one on the chosen yuzu place, .obj-cream; night's light one on navy) */
  .stars { color: var(--coral-text); font-size: var(--fs-xs); letter-spacing: 0; line-height: 1; }
  .subs { display: flex; gap: 8px; }
  .subs .chip { flex: 1; }
  .subs .chip[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; cursor: default; }
</style>
