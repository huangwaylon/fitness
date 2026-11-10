<script lang="ts">
  // The farm menu (docs/farming.md "Playing"): a round cream disc at the island's bottom left, the say button's
  // mirror, NH's seed bag in it. A tap unfolds three cream pills upward, left-aligned (the disc turns yuzu):
  // 「たね」 with what I plant next and how many (the seed picker: each start and vegetable I hold by its crop's name, kept
  // on this phone; a pick said by my villager and worn on the disc), 「スコップ」 (armed for one dig, yuzu while armed) and 「はたけ」 (the 畑 sheet). It folds as the leaf menu does:
  // a second tap, a tap anywhere else, Esc, a pick, a sheet opening. IslandScene places and hides it with the say button.
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { CROPS, cropKey, startKey, type Crop, type FarmSrc } from '#lib/contract/farm.ts';
  import { shopView } from '#lib/model/shop.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { pickSeed, seed } from '#lib/store/farm.svelte.ts';
  import { ui } from '#lib/ui-state/ui.svelte.ts';
  import { sheetTap } from '#lib/ui-state/sheetTiming.ts';
  import { react } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { farmUi } from './farmUi.svelte.ts';
  import { farmSheet } from '../farm/open.svelte.ts';
  import { loadNames } from './catchLine.ts';

  /** My villager's word on the island (IslandScene's showSay): what I picked. */
  let { mutter }: { mutter?: (text: string) => void } = $props();

  let open = $state(false);
  let root: HTMLElement | undefined = $state();
  let toggleEl: HTMLButtonElement | undefined = $state();

  const pocket = $derived(week.model ? shopView(week.model.state, week.model.me).pocket : new Map<string, number>());
  /** What I can plant: each start, then each vegetable, that I hold. */
  const seeds = $derived(
    (['start', 'crop'] as const).flatMap((src) => CROPS.map((c) => ({ c, src, n: pocket.get(src === 'start' ? startKey(c) : cropKey(c)) ?? 0 }))).filter((s) => s.n > 0)
  );
  const picked = $derived(seed.pick ? { ...seed.pick, n: pocket.get(seed.pick.src === 'start' ? startKey(seed.pick.c) : cropKey(seed.pick.c)) ?? 0 } : null);
  const art = (c: Crop, src: FarmSrc) => `finds/${src === 'start' ? `${c}-start` : c}`;
  /** The crops' names: the catch catalog's, loaded (out of the island's first load) once the menu or the picker opens,
   *  read again once in (its merge isn't reactive). */
  let named = $state(false);
  const name = (c: Crop, src: FarmSrc) => (void named, t(`beach.name.${src === 'start' ? `${c}-start` : c}`));
  $effect(() => {
    if (open || farmUi.picker) void loadNames().then(() => (named = true), () => {});
  });
  // a sheet opening folds it (the picker too)
  $effect(() => {
    if (ui.sheets.length) open = farmUi.picker = false;
  });
  // open: a tap outside folds it (capture: the tap itself goes on), Esc too
  $effect(() => {
    if (!open && !farmUi.picker) return;
    const down = (e: PointerEvent) => {
      if (!(e.target instanceof Node) || !root?.contains(e.target)) open = farmUi.picker = false;
    };
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      open = farmUi.picker = false;
      toggleEl?.focus({ preventScroll: true });
    };
    document.addEventListener('pointerdown', down, true);
    document.addEventListener('keydown', key);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('keydown', key);
    };
  });

  function choose(go: () => void) {
    react('R18');
    open = false;
    go();
  }
</script>

<div class="farm-menu" class:open bind:this={root}>
  {#if farmUi.picker}
    <!-- the seed picker: what I hold to plant, a tap picks it -->
    <div class="picker" role="dialog" aria-label={t('world.farm.pick')} data-farm-picker>
      {#if seeds.length}
        <p class="ph">{t('world.farm.pick')}</p>
        <div class="grid">
          {#each seeds as s (s.src + s.c)}
            <button type="button" class="cell" data-sfx="tick" class:on={seed.pick?.c === s.c && seed.pick?.src === s.src} data-farm-pick="{s.src}:{s.c}" aria-label={name(s.c, s.src)}
              onclick={() => { pickSeed({ c: s.c, src: s.src }); farmUi.picker = false; mutter?.(t('world.farm.picked', { name: name(s.c, s.src) })); }}>
              <OfficialArt key={art(s.c, s.src)} size={34} />
              <!-- (a start's seedling is NH's one for all six: its crop's own icon on it) -->
              {#if s.src === 'start'}<span class="tag"><OfficialArt key={art(s.c, 'crop')} size={18} /></span>{/if}
              <b class="n">{s.n}</b>
              <span class="cn" aria-hidden="true">{name(s.c, 'crop')}</span>
            </button>
          {/each}
        </div>
      {:else}
        <p class="ph" data-farm-noseed>{t('world.farm.noSeed')}</p>
      {/if}
    </div>
  {/if}
  <div class="items" role="group" aria-label={t('world.farm.open')} inert={!open}>
    <button type="button" class="item" data-farm-seed data-sfx="open" aria-haspopup="dialog" onclick={() => choose(() => (farmUi.picker = true))}>
      <span class="ic">{#if picked}<OfficialArt key={art(picked.c, picked.src)} size={28} />{:else}<OfficialArt key="finds/seed-bag" size={28} />{/if}</span>
      <span class="lbl">{t('world.farm.seed')}</span>
      {#if picked}<b class="n" data-farm-seed-n>{picked.n}</b>{/if}
    </button>
    <button type="button" class="item" class:armed={farmUi.shovel} data-farm-shovel data-sfx={farmUi.shovel ? 'toggle-off' : 'toggle-on'} aria-pressed={farmUi.shovel} onclick={() => choose(() => (farmUi.shovel = !farmUi.shovel))}>
      <span class="ic"><OfficialArt key="finds/shovel" size={28} /></span>
      <span class="lbl">{t('world.farm.shovel')}</span>
    </button>
    <button type="button" class="item" data-farm-field aria-haspopup="dialog" data-sfx="self" onpointerdown={() => void farmSheet.prefetch()} onclick={() => choose(() => (sheetTap(), farmSheet.show()))}>
      <span class="ic"><OfficialArt key="finds/tomato" size={28} /></span>
      <span class="lbl">{t('world.farm.field')}</span>
    </button>
  </div>
  <button type="button" class="toggle" class:armed={farmUi.shovel} bind:this={toggleEl} aria-label={t('world.farm.open')} aria-expanded={open} data-farm-open
    data-sfx={open ? 'toggle-off' : 'toggle-on'} onclick={() => { open = !open; farmUi.picker = false; }}>
    <span class="bag"><OfficialArt key={farmUi.shovel ? 'finds/shovel' : picked?.n ? art(picked.c, picked.src) : 'finds/seed-bag'} size={24} eager /></span>
  </button>
</div>

<style>
  /* the disc: the say button's mirror (44 px to the thumb, 36 px drawn, the cream lip); open or the shovel armed, NH's
     yellow */
  .farm-menu { position: relative; width: var(--hit, 44px); height: var(--hit, 44px); }
  .toggle {
    appearance: none; border: 0; margin: 0; padding: 0; width: var(--hit, 44px); height: var(--hit, 44px); display: grid; place-items: center;
    background: none; cursor: pointer; position: relative; -webkit-tap-highlight-color: transparent; touch-action: manipulation;
  }
  .toggle::before {
    content: ''; position: absolute; left: 4px; top: 4px; width: 36px; height: 36px; border-radius: 50%;
    background: color-mix(in srgb, var(--c-cream, #FFF9E3) 90%, transparent); box-shadow: 0 3px 0 rgba(150, 110, 70, .28), 0 2px 8px rgba(60, 40, 20, .12);
    transition: background-color 180ms, translate .12s;
  }
  .open .toggle::before, .toggle.armed::before { background: var(--c-yuzu); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .toggle:active::before { translate: 0 2px; }
  .toggle:focus-visible { outline: none; }
  .toggle:focus-visible::before { outline: 3px solid var(--focus); outline-offset: 2px; }
  .bag { position: relative; line-height: 0; pointer-events: none; }

  /* the pills: a column standing on the disc, left-aligned to its left edge; folded, hidden and inert */
  .items { position: absolute; left: 0; bottom: calc(100% + 10px); display: grid; gap: 10px; width: max-content; pointer-events: none; }
  .item {
    display: flex; align-items: center; gap: 8px; height: var(--hit, 44px); margin: 0; padding: 0 14px 0 6px;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; white-space: nowrap;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 6px 14px rgb(60 40 20 / .14);
    font: 700 var(--fs-body)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; touch-action: manipulation;
    opacity: 0; visibility: hidden; transform: scale(0); transition: opacity 100ms linear, visibility 0s linear 100ms, transform 0s linear 100ms;
  }
  .open .item { opacity: 1; visibility: visible; transform: none; pointer-events: auto; transition: none; }
  .open .item:active { transform: translateY(2px) scale(.97); box-shadow: 0 2px 0 var(--c-lip); }
  .item.armed { background: var(--c-yuzu); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); }
  .item:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .ic { flex: none; width: 32px; height: 32px; display: grid; place-items: center; line-height: 0; }
  .n { font: 700 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; }

  /* the seed picker: a small cream card over the disc */
  .picker {
    position: absolute; left: 0; bottom: calc(100% + 10px); z-index: 1; width: max-content; max-width: calc(100cqw - 24px);
    padding: 10px 12px 12px; border-radius: var(--r-card, 18px); background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip), 0 8px 18px rgb(60 40 20 / .18);
  }
  .ph { margin: 0 0 8px; font: 700 var(--fs-s)/1.4 var(--font-ui); word-break: keep-all; }
    /* (each cell its crop's name under the icon: the seedling is NH's one for all six) */
  .grid { display: grid; grid-template-columns: repeat(4, 58px); gap: 8px; }
  .cell {
    position: relative; width: 58px; height: 60px; display: grid; place-items: center; align-content: center; gap: 2px; margin: 0; padding: 4px 0 3px;
    appearance: none; border: 0; border-radius: 12px; background: rgb(255 255 255 / .6); cursor: pointer; line-height: 0;
  }
  .cell.on { background: var(--c-yuzu); }
  .cell .n { position: absolute; right: 4px; top: 4px; }
  .cn { font: 700 var(--fs-xs)/1.1 var(--font-ui); white-space: nowrap; }
  .tag { position: absolute; left: 4px; top: 3px; line-height: 0; }
</style>
