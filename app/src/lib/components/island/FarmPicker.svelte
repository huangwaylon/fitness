<script lang="ts">
  // The picker (docs/farming.md "Playing"): what I hold to plant, a small cream card over the farm button. Each cell is
  // its crop's own art and name, a start with NH's seedling on it (the six starts' art is one seedling), and how many.
  // Opened by a tap on my empty plot with nothing held or none left: that pick plants the plot at once, and is kept on
  // this phone (the farm button wears it). It shuts on a pick, a tap outside it, Esc or a sheet opening.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { CROPS, seedKey, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { seed } from '#lib/store/farm.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { choose, closePicker, cropName } from './farmUi.svelte.ts';
  import { loadNames } from './catchLine.ts';

  let root: HTMLElement | undefined = $state();
  const pocket = $derived(week.model ? shopView(week.model.state, week.model.me).pocket : new Map<string, number>());
  /** What I can plant: each start, then each vegetable, that I hold. */
  const seeds = $derived(
    (['start', 'crop'] as const).flatMap((src) => CROPS.map((c) => ({ c, src, n: pocket.get(seedKey(c, src)) ?? 0 }))).filter((s) => s.n > 0)
  );
  /** The crops' names (out of the island's first load), read again once in (its merge isn't reactive). */
  let named = $state(false);
  const name = (c: Crop, src?: FarmSrc) => (void named, cropName(c, src));
  void loadNames().then(() => (named = true), () => {});

  // a sheet opening shuts it
  $effect(() => {
    if (ui.sheets.length) closePicker();
  });
  // a tap outside shuts it (capture: the tap itself goes on), Esc too
  $effect(() => {
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !root?.contains(e.target)) closePicker();
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePicker();
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key);
    };
  });

</script>

<div class="picker" role="dialog" aria-label={t('world.farm.pick')} data-farm-picker bind:this={root}>
  {#if seeds.length}
    <p class="ph">{t('world.farm.pick')}</p>
    <div class="grid" style:--n={Math.min(4, seeds.length)}>
      {#each seeds as s (s.src + s.c)}
        <button type="button" class="cell" data-sfx="tick" class:on={seed.pick?.c === s.c && seed.pick?.src === s.src} data-farm-pick="{s.src}:{s.c}" aria-label={name(s.c, s.src)}
          onclick={() => choose({ c: s.c, src: s.src })}>
          <OfficialArt key="finds/{s.c}" size={34} />
          {#if s.src === 'start'}<span class="tag" data-farm-start><OfficialArt key="finds/{s.c}-start" size={18} /></span>{/if}
          <b class="n">{s.n}</b>
          <span class="cn" aria-hidden="true">{name(s.c)}</span>
        </button>
      {/each}
    </div>
  {:else}
    <p class="ph" data-farm-noseed>{t('world.farm.noSeed')}</p>
  {/if}
</div>

<style>
  .picker {
    position: absolute; left: 0; bottom: calc(100% + 10px); z-index: 1; width: max-content; max-width: calc(100cqw - 24px);
    padding: 10px 12px 12px; border-radius: var(--r-card, 18px); background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 8px 18px rgb(60 40 20 / .18);
  }
  .ph { margin: 0 0 8px; font: 700 var(--fs-s)/1.4 var(--font-ui); word-break: keep-all; }
  /* up to four across, the card as wide as what I hold (one crop: no empty room beside it) */
  .grid { display: grid; grid-template-columns: repeat(var(--n), 58px); gap: 8px; }
  .cell {
    position: relative; width: 58px; height: 60px; display: grid; place-items: center; align-content: center; gap: 2px; margin: 0; padding: 4px 0 3px;
    appearance: none; border: 0; border-radius: 12px; background: rgb(255 255 255 / .6); cursor: pointer; line-height: 0;
  }
  .cell.on { background: var(--c-yuzu); }
  .n { position: absolute; right: 4px; top: 4px; font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .cn { font: 700 var(--fs-xs)/1.1 var(--font-ui); white-space: nowrap; }
  .tag { position: absolute; left: 4px; top: 3px; line-height: 0; }
</style>
