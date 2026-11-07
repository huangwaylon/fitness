<script lang="ts">
  // せってい → オフラインの地図 (docs/design.md "Offline maps"): each area saved on this phone (lib/offline/areas.svelte.ts):
  // its name, MB and the day it was saved, 削除; 一部のみ with 続きを保存, 消えました (Safari evicted it) with もう一度保存, an
  // OpenFreeMap area past 30 days with 更新; then the total against the 150 MB, coral past 80 %. None: a line saying
  // where to save one.
  import { onMount } from 'svelte';
  import { i18n, t } from '#lib/i18n/index.ts';
  import { areas, planOf } from '#lib/offline/areas.svelte.ts';
  import { mb, TOTAL_CAP_BYTES, WARN_AT } from '#lib/offline/plan.ts';
  import { pick } from '../travel/text.ts';

  onMount(() => void areas.refresh(true));
  const ids = $derived(Object.keys(areas.list).sort((a, b) => areas.list[b].at - areas.list[a].at));
  const total = $derived(areas.total());
  const warn = $derived(total >= TOTAL_CAP_BYTES * WARN_AT);
  const day = (at: number) => new Intl.DateTimeFormat(i18n.locale === 'ja' ? 'ja-JP' : 'en-US', { month: 'short', day: 'numeric' }).format(at);

  async function again(id: string) {
    const p = await planOf(id);
    if (p) await areas.save(p.plan, p.name);
  }
</script>

<div class="prows" data-offline-list>
  {#each ids as id (id)}
    {@const e = areas.list[id]}
    {@const st = areas.state(id)}
    {@const name = pick(e.name, i18n.locale)}
    <div class="prow static" data-offline-area={id} data-offline-state={st.k === 'saved' && st.stale ? 'stale' : st.k}>
      <span class="prl">{name}<small>{st.k === 'gone' ? t('offline.rowGone') : st.k === 'saving' ? t('offline.rowSaving', { pct: Math.floor((100 * st.done) / Math.max(1, st.total)) }) : st.k === 'partial' ? t('offline.rowPartial', { mb: mb(e.bytes) }) : t('offline.row', { mb: mb(e.bytes), date: day(e.at) })}</small></span>
      {#if st.k === 'gone' || st.k === 'partial' || (st.k === 'saved' && st.stale)}
        <button type="button" class="btn small paper" data-offline-again data-sfx="tick" aria-disabled={!!areas.job} onclick={() => !areas.job && again(id)}>{st.k === 'gone' ? t('offline.again') : st.k === 'partial' ? t('offline.more') : t('offline.updateBtn')}</button>
      {/if}
      <button type="button" class="btn small paper" data-offline-delete data-sfx="tick" aria-label={t('offline.deleteAria', { name })} onclick={() => areas.remove(id)}>{t('offline.delete')}</button>
    </div>
  {:else}
    <p class="note" data-offline-none>{t('offline.none')}</p>
  {/each}
  {#if ids.length}
    <div class="total" class:warn data-offline-total={Math.round(total / 1e5) / 10}>
      <span class="bar" aria-hidden="true"><span style:width="{Math.min(100, (100 * total) / TOTAL_CAP_BYTES)}%"></span></span>
      <span class="tl">{t('offline.total', { mb: mb(total) })}{#if warn} · {t('offline.warn')}{/if}</span>
    </div>
  {/if}
</div>

<style>
  .prl small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  [data-offline-state='gone'] .prl small, [data-offline-state='partial'] .prl small { color: var(--coral-text); }
  .prow .btn { flex: none; }
  .note { margin: 0 4px; font-size: var(--fs-s); color: var(--text-soft); line-height: var(--lh); }
  .total { display: grid; gap: 4px; margin: 0 4px; }
  .bar { height: 8px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; }
  .bar span { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf-edge); }
  .warn .bar span { background: var(--c-coral); }
  .tl { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .warn .tl { color: var(--coral-text); }
</style>
