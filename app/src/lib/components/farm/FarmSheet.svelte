<script lang="ts">
  // 畑 (docs/farming.md "Playing"): today's harvest and what it fetches, my plants against the cap, and the batches: 収穫
  // (every ripe plant of mine), 水やり (anyone's plants whose watering counts today: sheet.ts) and 植える (my empty plots, with a crop I
  // hold), each one event (store/farm.svelte.ts; the watering one change of the shared day; none: done, or from when). The partner's and the
  // guest's fields a line each, and who else watered mine today; my plants off every field (a field moved or deleted in
  // /editor) back to starts; the rule. A 収穫's banner names its crops and their かいがら.
  // Kanji (a sheet's copy).
  import '#lib/i18n/catch.ts'; // the crops' names (their own catalog, out of the island's first load)
  import Sheet from '../ui/Sheet.svelte';
  import NavBar from '../ui/NavBar.svelte';
  import Chip from '../ui/Chip.svelte';
  import FieldMap from './FieldMap.svelte';
  import { CROPS, FARM, cropKey, daysLeft, plantsOf, seedKey, stageOf, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
  import { sellPrice } from '#lib/contract/shop.ts';
  import { layoutPlots } from '#lib/layout/field.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { layout as layoutStore } from '#lib/store/layout.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { dig, digMany, harvestAll, pickSeed, plantMany, seed, waterAll } from '#lib/store/farm.svelte.ts';
  import { undoBanner } from '#lib/store/actions.ts';
  import { site } from '../island/site.svelte.ts';
  import { farmToday } from '../island/farm.ts';
  import { islandDay } from '../island/ambientClock.ts';
  import { formatNum, i18n, t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { world as shared } from '#lib/store/world.svelte.ts';
  import { bare } from '../kiroku/zukan.ts';
  import { fillPlan, harvestOps, harvestSummary, orphans, waterNext, waterTargets, wateredBy, yieldRange } from './sheet.ts';
  import type { Who } from '#lib/types.ts';

  // (farm fun B2: no longer said, deleted in A4: 'farm.waterTomorrow' 'farm.waterIn' 'farm.waterNone' 'farm.harvested')

  let { open = $bindable() }: { open: boolean } = $props();

  const m = $derived(week.model);
  const date = $derived(week.view?.today ?? islandDay());
  const names = $derived<Record<Who, string>>({ A: week.view?.people.A.villagerName ?? 'A', B: week.view?.people.B.villagerName ?? 'B', G: week.view?.guest.villagerName ?? 'G' });
  const pocket = $derived(m ? shopView(m.state, m.me).pocket : new Map<string, number>());
  /** What I can plant: each start, then each vegetable, that I hold. */
  const seeds = $derived((['start', 'crop'] as const).flatMap((src) => CROPS.map((c) => ({ c, src, n: pocket.get(seedKey(c, src)) ?? 0 }))).filter((s) => s.n > 0));
  /** The crop 植える plants: the one held (on the island too), else my first start. Never a vegetable unpicked: right
   *  after a harvest the big button would else plant the crop I meant to sell. */
  const held = $derived(seeds.find((s) => s.c === seed.pick?.c && s.src === seed.pick?.src) ?? seeds.find((s) => s.src === 'start') ?? null);
  const view = $derived.by(() => {
    if (!m) return null;
    const { farm, watered } = farmToday(m.state, date);
    const plots = layoutPlots(site.layout ?? layoutStore.current);
    const mine = plots.filter((x) => x.who === m.me);
    const ripe = harvestOps(farm, m.me, date, watered);
    const others = (['A', 'B', 'G'] as const).filter((w) => w !== m.me).map((who) => ({ who, n: plantsOf(farm, who) })).filter((o) => o.n);
    return {
      farm, watered, mine, field: mine.length > 0, ripe, others,
      max: ripe.reduce((a, o) => a + o.n, 0),
      shells: ripe.reduce((a, o) => a + o.n * (sellPrice(cropKey(farm.plots.get(o.p)!.c)) ?? 0), 0),
      water: waterTargets(plots, farm, date, watered),
      waterNext: waterNext(plots, farm, date),
      planted: plots.some((x) => farm.plots.has(x.p)),
      empty: mine.filter((x) => !farm.plots.has(x.p)).length,
      fill: held ? fillPlan(plots, farm, m.me, held.n) : [],
      off: orphans(farm, m.me, plots),
      n: plantsOf(farm, m.me),
      /** Days till my next plant ripens (Infinity: none of mine). */
      /** Who else watered my plants today (the shared day's, live only), and how many. */
      helped: (() => {
        void shared.rev;
        if (date !== islandDay()) return [];
        const by = wateredBy([...farm.plots].filter(([, pl]) => pl.who === m.me).map(([p]) => p), shared.day.watered, m.me);
        return (['A', 'B', 'G'] as const).flatMap((who) => (by[who] ? [{ who, n: by[who] }] : []));
      })(),
      next: Math.min(...mine.flatMap((x) => { const pl = farm.plots.get(x.p); return pl ? [daysLeft(pl, date)] : []; })),
      /** My plants ripe tomorrow. */
      tomorrow: mine.filter((x) => { const pl = farm.plots.get(x.p); return pl && pl.who === m.me && daysLeft(pl, date) === 1; }).length
    };
  });
  /** 水やり's words: the batch, else why there's none (done today, or every plant ripe: after the harvest). */
  const waterLabel = $derived(!view ? '' : view.water.length ? t('farm.waterAll', { n: view.water.length })
    : view.waterNext === 0 ? t('farm.watered') : t('farm.waterAfterHarvest'));
  /** 収穫 tapped while the sheet is up: the button stays (disabled, 収穫済み) till it closes, so nothing moves and the
   *  focus stays in the sheet (a removed button would also restyle the page: the app's :root:has() rules). */
  let harvested = $state(false);
  $effect(() => {
    if (!open) harvested = false;
  });
  const crop = (c: Crop, src: FarmSrc = 'crop') => (src === 'start' ? t(`farm.start.${c}`) : bare(t(`beach.name.${c}`)));

  /** The map's selected plot: what is on it, as its row tells it. */
  let selected = $state<string | null>(null);
  function cellOf(p: string) {
    const pl = view?.farm.plots.get(p);
    if (!view || !pl) return { p, label: t('farm.emptyCell') };
    const ripe = stageOf(pl, date) === 3, wet = view.watered(p, date);
    const { lo, hi } = yieldRange(p, pl, date, view.watered), name = crop(pl.c), n = daysLeft(pl, date);
    const label = ripe ? t('farm.cellRipe', { name, n: lo }) : lo === hi ? t('farm.cellSure', { name, n, k: lo }) : t('farm.cell', { name, n, lo, hi });
    return { p, pl, ripe, wet, n: lo, label };
  }
  const cell = $derived(selected && view?.mine.some((x) => x.p === selected) ? cellOf(selected) : null);

  /** A 収穫's banner: its crops in CROPS order (3 at most, then ほか) and what they fetch. */
  function harvestedLine(ops: readonly { p: string; n: number }[]): string {
    const farm = view!.farm, list = harvestSummary(ops, farm), en = i18n.locale === 'en';
    const items = list.slice(0, 3).map(({ c, n }) => t('farm.harvestItem', { name: crop(c), n: formatNum(n) })).join(en ? ', ' : '・');
    const shells = list.reduce((a, { c, n }) => a + n * (sellPrice(cropKey(c)) ?? 0), 0);
    return t('farm.harvestedNamed', { list: list.length > 3 ? `${items}${en ? ' ' : ''}${t('farm.harvestMore')}` : items, shells: formatNum(shells) });
  }
  function harvestOf(ops: readonly { p: string; n: number }[]) {
    const line = harvestedLine(ops);
    cue('farm-harvest');
    undoBanner(line, harvestAll(date, ops));
  }
  function harvest() {
    if (!view?.ripe.length) return;
    harvested = true;
    harvestOf(view.ripe);
  }
  function plant() {
    if (!held || !view?.fill.length) return;
    undoBanner(t('farm.planted', { name: crop(held.c, held.src), n: view.fill.length }), plantMany(date, view.fill, held.c, held.src));
  }
  function harvestCell(p: string, n: number) {
    harvestOf([{ p, n }]);
  }
  function plantCell(p: string) {
    if (!held || !view || view.n >= FARM.cap) return;
    undoBanner(t('farm.planted', { name: crop(held.c, held.src), n: 1 }), plantMany(date, [p], held.c, held.src));
  }
  function digCell(p: string, c: Crop) {
    undoBanner(t('farm.dug', { name: crop(c) }), dig(date, p));
  }
  function backToStarts() {
    if (!view?.off.length) return;
    undoBanner(t('farm.dugBack', { n: view.off.length }), digMany(date, view.off));
  }
</script>

<Sheet bind:open tunes label={t('farm.title')} variant="full">
  <div class="titlebar"><NavBar pad title={t('farm.title')} onclose={() => (open = false)} sfx="self" /></div>
  <div class="fs-body" data-farm-sheet>
    {#if view}
      <section class="card sum">
        {#if view.ripe.length}
          <p data-farm-today>{t('farm.today', { n: view.ripe.length, max: view.max, shells: formatNum(view.shells) })}</p>
        {:else if view.next === 1}
          <p data-farm-today>{t('farm.tomorrow', { n: view.tomorrow })}</p>
        {:else if Number.isFinite(view.next)}
          <p data-farm-today>{t('farm.next', { n: view.next })}</p>
        {:else if view.field}
          <p data-farm-today>{t('farm.noneYet')}</p>
        {:else if view.planted}
          <!-- (no field of mine, the guest's: its part is the two's watering) -->
          <p data-farm-today>{t('farm.helpWater')}</p>
        {/if}
        {#if view.field || view.n}<p class="cap" data-farm-count>{t('farm.count', { n: view.n, cap: FARM.cap })}</p>{/if}
        {#if view.ripe.length || harvested || view.planted}<div class="acts">
          {#if view.ripe.length || harvested}
            <button type="button" class="btn yuzu" data-farm-harvest data-sfx={view.ripe.length ? 'self' : 'tick'} aria-disabled={!view.ripe.length} onclick={harvest}>
              {view.ripe.length ? t('farm.harvestAll', { n: view.ripe.length }) : t('farm.harvestedAll')}</button>
          {/if}
          {#if view.planted}
            <button type="button" class="btn paper water" data-farm-water data-sfx="tick" aria-disabled={!view.water.length}
              onclick={() => view?.water.length && waterAll(view.water)}>{waterLabel}</button>
          {/if}
        </div>{/if}
        {#each view.helped as h (h.who)}
          <p class="note helped" data-farm-helped={h.who}>{t('farm.wateredBy', { who: names[h.who], n: h.n })}</p>
        {/each}
      </section>
      {#if view.field}
        <section class="card field">
          <FieldMap plots={view.mine} farm={view.farm} {date} watered={view.watered} label={(p) => cellOf(p).label} bind:selected />
          {#if cell}
            <div class="sel" data-farm-selected={cell.p}>
              <span class="what">{cell.label}{#if cell.wet}<span class="wet">{t('farm.watered')}</span>{/if}</span>
              <span class="btns">
              {#if cell.pl}
                {@const pl = cell.pl}
                {#if cell.ripe}<button type="button" class="btn small yuzu" data-farm-act="harvest" data-sfx="self" onclick={() => harvestCell(cell.p, cell.n ?? 1)}>{t('farm.act.harvest')}</button>{/if}
                <button type="button" class="btn small paper" data-farm-act="dig" data-sfx="tick" onclick={() => digCell(cell.p, pl.c)}>{t('farm.act.dig')}</button>
              {:else}
                <button type="button" class="btn small" data-farm-act="plant" data-sfx="tick" aria-disabled={!held || view.n >= FARM.cap} onclick={() => plantCell(cell.p)}>{t('farm.act.plant')}</button>
              {/if}
              </span>
            </div>
          {/if}
        </section>
        <section class="card plant" data-farm-plant>
          {#if !view.empty}
            <p class="note" data-farm-empty>{t('farm.full')}</p>
          {:else}
            {#if !held}<p class="note" data-farm-empty>{t('farm.noStarts')}{#if seeds.length}{t('farm.orCrop')}{/if}</p>{/if}
            {#if seeds.length}
              <div class="chips" role="group" aria-label={t('farm.act.plant')}>
                {#each seeds as s (s.src + s.c)}
                  <Chip label={crop(s.c, s.src)} count={s.n} selected={s === held} onclick={() => pickSeed({ c: s.c, src: s.src })} data-farm-seed="{s.src}:{s.c}" />
                {/each}
              </div>
            {/if}
            {#if held}<button type="button" class="btn small" data-farm-plant-all data-sfx="tick" onclick={plant}>{t('farm.plantAll', { name: crop(held.c, held.src), n: view.fill.length })}</button>{/if}
          {/if}
        </section>
      {:else if m?.me !== 'G'}
        <!-- (the guest's fields are the two's: no editor hint) -->
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
  .fs-body { flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; padding: 6px calc(var(--side) + var(--safe-right)) var(--body-pad) calc(var(--side) + var(--safe-left)); display: grid; gap: 10px; align-content: start; }
  .card { padding: 12px 14px; border-radius: var(--r-card, 18px); background: var(--card); color: var(--text); }
  .sum p { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .sum .cap { font-weight: 600; color: var(--text-soft); }
  .acts { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .acts .btn { margin: 0 0 var(--lip-h); }
  .btn.yuzu:not([aria-disabled='true']) { --fill: var(--c-yuzu); --lip-c: var(--c-yuzu-lip); }
  .acts .btn.yuzu { min-height: 52px; font-size: var(--fs-body); }
  .btn.water { min-height: 44px; font-size: var(--fs-body); }
  .field { display: grid; gap: 10px; padding: 12px 10px; }
  /* the row's words, its buttons at the right; too long for one line, the buttons go under them */
  .sel { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; min-height: 44px; }
  .sel .what { flex: 1 1 auto; min-width: min(100%, 13em); font: 600 var(--fs-s)/1.4 var(--font-ui); text-wrap: pretty; }
  .sel .btns { display: flex; gap: 8px; margin-left: auto; }
  .sel .wet { margin-left: 6px; color: var(--text-soft); }
  .sel .btn { margin: 0 0 var(--lip-h); padding: 0 14px; }
  .plant { display: grid; gap: 10px; }
  .plant .btn { margin: 0 0 var(--lip-h); }
  .off { display: flex; align-items: center; justify-content: space-between; gap: 10px; font: 600 var(--fs-s)/1.4 var(--font-ui); }
  .off .btn { margin: 0 0 var(--lip-h); }
  .note { margin: 0 2px; font: 500 var(--fs-s)/1.5 var(--font-body); text-wrap: pretty; }
  .sum .helped { margin: 8px 0 0; font: 600 var(--fs-s)/1.5 var(--font-ui); color: var(--text-soft); }
  .who { font-family: var(--font-ui); font-weight: 600; }
</style>
