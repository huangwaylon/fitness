<script lang="ts">
  // 旅行 › 設定's オフライン地図 (docs/travel.md "Offline"): a row per trip with a map, in the list's order, each its
  // area's save (lib/offline/areas.svelte.ts, as the trail's SaveButton): the size, then saving (% and 止める: what's in
  // kept), 保存済み with its date and size (更新 past 30 days), 一部のみ and 消えました with もう一度; a save that can't
  // start says why for a few seconds; offline, the save is greyed and its line says so. The trash asks first (offline on the trip there is no getting it back), but a
  // gone area's, which only forgets it. The guides load as the tab opens (their chunks, kept by the worker), the plans a
  // frame later, one a frame; an area saved whose guide doesn't load is listed from the registry (its trash only).
  import { onMount } from 'svelte';
  import type { L, Trip, TripId } from '#lib/travel/types.ts';
  import { i18n, t } from '#lib/i18n/index.ts';
  import '#lib/i18n/sheets.ts';
  import { TRIP_META } from '#lib/travel/trips/meta.ts';
  import { loadTrip } from '#lib/travel/trips/index.ts';
  import { areas, type Refusal } from '#lib/offline/areas.svelte.ts';
  import { mb, planTrip, type Plan } from '#lib/offline/plan.ts';
  import { online } from '#lib/ui-state/online.svelte.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import Icon from '../ui/Icon.svelte';
  import ProgressBar from '../ui/ProgressBar.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import Sheet from '../ui/Sheet.svelte';
  import { pick } from './text.ts';
  import { sortTrips } from './when.ts';

  const order = (() => {
    const s = sortTrips(TRIP_META, minuteNow().getTime());
    return [...s.coming, ...s.past];
  })();
  /** Each trip's plan (null: no map), once its guide is in; a trip whose guide failed, absent. */
  let plans = $state.raw<Partial<Record<TripId, Plan | null>>>({});
  let loaded = $state(false);
  const rows = $derived(order.flatMap((m) => {
    const id = `trip-${m.id}`, plan = plans[m.id];
    return plan || (plan === undefined && loaded && areas.list[id]) ? [{ id, name: m.title, plan: plan ?? null }] : [];
  }));

  let why = $state<{ id: string; r: Refusal } | null>(null);
  let whyTimer: ReturnType<typeof setTimeout> | undefined;
  let asking = $state<{ id: string; name: L } | null>(null);
  let askOpen = $state(false);

  async function save(plan: Plan, name: L) {
    const r = await areas.save(plan, name);
    if (!r) return;
    why = { id: plan.id, r };
    clearTimeout(whyTimer);
    whyTimer = setTimeout(() => (why = null), 4000);
  }
  function del(id: string, name: L) {
    if (areas.state(id).k === 'gone') return void areas.remove(id);
    asking = { id, name };
    askOpen = true;
  }
  /** 保存済み's date (the phone's), as the app's m/d. */
  const day = (at: number) => `${new Date(at).getMonth() + 1}/${new Date(at).getDate()}`;

  onMount(() => {
    void areas.refresh();
    let raf = 0, gone = false;
    void Promise.all(order.map((m) => loadTrip(m.id).then((g): [TripId, Trip] => [m.id, g], () => null))).then((gs) => {
      loaded = true;
      const todo = gs.filter((g) => !!g);
      const next = () => {
        const g = todo.shift();
        if (!g || gone) return;
        plans = { ...plans, [g[0]]: g[1].places.length ? planTrip(g[1]) : null };
        raf = requestAnimationFrame(next);
      };
      raf = requestAnimationFrame(next);
    });
    return () => ((gone = true), cancelAnimationFrame(raf), clearTimeout(whyTimer));
  });
</script>

{#if rows.length}
  <section class="sec" aria-labelledby="tv-offline" data-offline-maps>
    <h3 id="tv-offline" class="sec-label">{t('travel.offline')}</h3>
    <div class="card dense">
      {#each rows as r (r.id)}
        {@const st = areas.state(r.id)}
        {@const pct = st.k === 'saving' ? Math.floor((100 * st.done) / Math.max(1, st.total)) : 0}
        {@const canSave = !!r.plan && st.k !== 'saving' && !(st.k === 'saved' && !st.stale)}
        {@const refused = why?.id === r.id ? why.r : null}
        <div class="row area" data-offline-row={r.id} data-offline-state={st.k === 'saved' && st.stale ? 'stale' : st.k}>
          <div class="who">
            <span class="nm">{pick(r.name, i18n.locale)}</span>
            {#if refused}
              <span class="dt why" role="status" data-offline-why={refused}>{t(`offline.refuse.${refused}`)}</span>
            {:else if st.k === 'saving'}
              <span class="dt prog"><ProgressBar value={pct} max={100} h={6} label={t('offline.saving', { pct })} /><span class="pct">{pct}%</span></span>
            {:else}
              <span class="dt">{st.k === 'saved' ? t('travel.offline.saved', { date: day(st.at), mb: mb(st.bytes) })
                : st.k === 'partial' ? t('travel.offline.partial', { mb: mb(st.bytes) })
                : st.k === 'gone' ? t('travel.offline.gone')
                : r.plan ? t('travel.offline.size', { mb: mb(r.plan.bytes) }) : ''}</span>
              {#if canSave && !online.current}<span class="dt" data-offline-why="offline">{t('offline.refuse.offline')}</span>{/if}
            {/if}
          </div>
          <div class="acts">
            {#if st.k === 'saving'}
              <button type="button" class="btn paper small" data-offline-act="stop" data-sfx="tick" onclick={() => areas.stop()}>{t('travel.offline.stop')}</button>
            {:else if canSave && r.plan}
              {@const plan = r.plan}
              <button type="button" class="btn small" data-offline-act="save" data-sfx="tick" aria-disabled={!online.current} onclick={() => online.current && save(plan, r.name)}>
                {t(st.k === 'none' ? 'travel.offline.save' : st.k === 'saved' ? 'travel.offline.update' : 'travel.offline.retry')}</button>
            {/if}
            {#if st.k === 'saved' || st.k === 'partial' || st.k === 'gone'}
              <button type="button" class="btn paper small del" data-offline-act="delete" data-sfx="tick" aria-label={t('offline.deleteAria', { name: pick(r.name, i18n.locale) })}
                onclick={() => del(r.id, r.name)}><Icon name="trash" size={20} stroke={2.4} /></button>
            {/if}
          </div>
        </div>
      {/each}
    </div>
    <p class="sub"><Phrases text={t('travel.offline.sub')} /></p>
  </section>
{/if}

<Sheet name="travel.offline.delete" bind:open={askOpen} title={asking ? t('travel.offline.deleteTitle', { name: pick(asking.name, i18n.locale) }) : ''}
  confirm={{ verb: t('travel.offline.delete'), danger: true, focusNo: true, sfx: 'tick', onyes: () => ((askOpen = false), asking && void areas.remove(asking.id)) }}>
  <p class="note"><Phrases text={t('travel.offline.deleteNote')} /></p>
</Sheet>

<style>
  .sec { display: grid; gap: 8px; }
  .area { flex-wrap: wrap; row-gap: 8px; }
  .who { flex: 1 1 9em; min-width: 0; display: grid; gap: 2px; }
  .nm { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .dt { font-size: var(--fs-s); color: var(--text-soft); }
  .prog { display: flex; align-items: center; gap: 8px; min-height: 1.4em; }
  .pct { flex: none; font: 600 var(--fs-s)/1 var(--font-num); }
  .why { color: var(--coral-text); }
  .acts { display: flex; gap: 6px; flex: none; margin-left: auto; }
  .del { width: var(--hit); padding: 0; justify-content: center; }
  .sub { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .note { margin: 0; }
</style>
