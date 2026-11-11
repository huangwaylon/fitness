<script lang="ts">
  // 畑 (docs/farming.md "Playing"): today's harvest and what it fetches, my plants against the cap, and the batches: 収穫
  // (every ripe plant of mine), 水やり (every unwatered plant, anyone's field) and 植える (my empty plots, with a crop I
  // hold), each one event (store/farm.svelte.ts; the watering one change of the shared day). The partner's and the
  // guest's fields a line each; my plants off every field (a field moved or deleted in /editor) back to starts; the rule.
  // Kanji (a sheet's copy).
  import '#lib/i18n/catch.ts'; // the crops' names (their own catalog, out of the island's first load)
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Chip from '../ui/Chip.svelte';
  import { CROPS, FARM, cropKey, plantsOf, seedKey, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { layoutPlots } from '#lib/layout/field.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { digMany, harvestAll, pickSeed, plantMany, seed, waterAll } from '#lib/store/farm.svelte.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { site } from '../island/site.svelte.ts';
  import { farmToday } from '../island/farm.ts';
  import { islandDay } from '../island/ambientClock.ts';
  import { formatNum, t } from '#lib/i18n/index.ts';
  import { bare } from '../kiroku/zukan.ts';
  import { fillPlan, harvestOps, orphans, waterTargets } from './sheet.ts';
  import type { Who } from '#lib/types.ts';

  let { open = $bindable() }: { open: boolean } = $props();

  const m = $derived(week.model);
  const date = $derived(week.view?.today ?? islandDay());
  const names = $derived<Record<Who, string>>({ A: week.view?.people.A.villagerName ?? 'A', B: week.view?.people.B.villagerName ?? 'B', G: week.view?.guest.villagerName ?? 'G' });
  const pocket = $derived(m ? shopView(m.state, m.me).pocket : new Map<string, number>());
  /** What I can plant: each start, then each vegetable, that I hold. */
  const seeds = $derived((['start', 'crop'] as const).flatMap((src) => CROPS.map((c) => ({ c, src, n: pocket.get(seedKey(c, src)) ?? 0 }))).filter((s) => s.n > 0));
  /** The crop 植える plants: the one held (on the island too), else the first I have. */
  const held = $derived(seeds.find((s) => s.c === seed.pick?.c && s.src === seed.pick?.src) ?? seeds[0] ?? null);
  const view = $derived.by(() => {
    if (!m) return null;
    const { farm, watered } = farmToday(m.state, date);
    const plots = layoutPlots(site.layout ?? layoutStore.current);
    const field = plots.some((x) => x.who === m.me);
    const ripe = harvestOps(farm, m.me, date, watered);
    const others = (['A', 'B', 'G'] as const).filter((w) => w !== m.me).map((who) => ({ who, n: plantsOf(farm, who) })).filter((o) => o.n);
    return {
      field, ripe, others,
      max: ripe.reduce((a, o) => a + o.n, 0),
      shells: ripe.reduce((a, o) => a + o.n * (sellPrice(cropKey(farm.plots.get(o.p)!.c)) ?? 0), 0),
      water: waterTargets(plots, farm, date, watered),
      planted: plots.some((x) => farm.plots.has(x.p)),
      empty: plots.filter((x) => x.who === m.me && !farm.plots.has(x.p)).length,
      fill: held ? fillPlan(plots, farm, m.me, held.n) : [],
      off: orphans(farm, m.me, plots),
      n: plantsOf(farm, m.me)
    };
  });
  const crop = (c: Crop, src: FarmSrc = 'crop') => (src === 'start' ? t(`farm.start.${c}`) : bare(t(`beach.name.${c}`)));

  function harvest() {
    if (!view?.ripe.length) return;
    const max = view.max;
    undoBanner(t('farm.harvested', { max: formatNum(max) }), harvestAll(date, view.ripe));
  }
  function plant() {
    if (!held || !view?.fill.length) return;
    undoBanner(t('farm.planted', { name: crop(held.c, held.src), n: view.fill.length }), plantMany(date, view.fill, held.c, held.src));
  }
  function backToStarts() {
    if (!view?.off.length) return;
    undoBanner(t('farm.dugBack', { n: view.off.length }), digMany(date, view.off));
  }
</script>

<Sheet bind:open tunes label={t('farm.title')} variant="pop">
  <div class="titlebar"><NavBar title={t('farm.title')} onclose={() => (open = false)} sfx="self" /></div>
  <div class="fs-body" data-farm-sheet>
    {#if view}
      <section class="card sum">
        <p data-farm-today>{view.ripe.length ? t('farm.today', { n: view.ripe.length, max: view.max, shells: formatNum(view.shells) }) : t('farm.noneToday')}</p>
        {#if view.field || view.n}<p class="cap" data-farm-count>{t('farm.count', { n: view.n, cap: FARM.cap })}</p>{/if}
        <div class="acts">
          {#if view.ripe.length}
            <button type="button" class="btn yuzu" data-farm-harvest data-sfx="tick" onclick={harvest}>{t('farm.harvestAll', { n: view.ripe.length })}</button>
          {/if}
          {#if view.planted}
            <button type="button" class="btn small paper" data-farm-water data-sfx="tick" aria-disabled={!view.water.length}
              onclick={() => view?.water.length && waterAll(view.water)}>{view.water.length ? t('farm.waterAll', { n: view.water.length }) : t('farm.watered')}</button>
          {/if}
        </div>
      </section>
      {#if view.field}
        <section class="card plant" data-farm-plant>
          {#if !view.empty}
            <p class="note" data-farm-empty>{t('farm.full')}</p>
          {:else if !held}
            <p class="note" data-farm-empty>{t('farm.noStarts')}</p>
          {:else}
            <div class="chips" role="group" aria-label={t('farm.act.plant')}>
              {#each seeds as s (s.src + s.c)}
                <Chip label={crop(s.c, s.src)} count={s.n} selected={s === held} onclick={() => pickSeed({ c: s.c, src: s.src })} data-farm-seed="{s.src}:{s.c}" />
              {/each}
            </div>
            <button type="button" class="btn small" data-farm-plant-all data-sfx="tick" onclick={plant}>{t('farm.plantAll', { name: crop(held.c, held.src), n: view.fill.length })}</button>
          {/if}
        </section>
      {:else}
        <p class="note" data-farm-empty>{t('farm.noField')}</p>
      {/if}
      {#if view.off.length}
        <div class="card off" data-farm-orphans>
          <span>{t('farm.orphans', { n: view.off.length })}</span>
          <button type="button" class="btn small paper" data-farm-orphans-dig data-sfx="tick" onclick={backToStarts}>{t('farm.orphansDig')}</button>
        </div>
      {/if}
      {#each view.others as o (o.who)}
        <p class="note who" data-farm-others={o.who}>{t('farm.whose', { who: names[o.who], n: o.n })}</p>
      {/each}
      <p class="note">{t('farm.rule')}</p>
    {/if}
  </div>
</Sheet>

<style>
  .fs-body { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; margin: 0 -8px; padding: 6px 8px var(--body-pad); display: grid; gap: 10px; align-content: start; }
  .card { padding: 12px 14px; border-radius: var(--r-card, 18px); background: var(--card); color: var(--text); }
  .sum p { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .sum .cap { font-weight: 600; color: var(--text-soft); }
  .acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .acts:empty { display: none; }
  .acts .btn { margin: 0 0 var(--lip-h); }
  .btn.yuzu { --fill: var(--c-yuzu); --lip-c: var(--c-yuzu-lip); min-height: 52px; font-size: var(--fs-body); }
  .plant { display: grid; gap: 10px; }
  .plant .btn { margin: 0 0 var(--lip-h); }
  .off { display: flex; align-items: center; justify-content: space-between; gap: 10px; font: 600 var(--fs-s)/1.4 var(--font-ui); }
  .off .btn { margin: 0 0 var(--lip-h); }
  .note { margin: 0 2px; font: 500 var(--fs-s)/1.5 var(--font-body); text-wrap: pretty; }
  .who { font-family: var(--font-ui); font-weight: 600; }
</style>
