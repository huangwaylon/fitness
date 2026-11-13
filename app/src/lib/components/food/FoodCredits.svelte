<script lang="ts">
  // データの出典: the food data's credits (each dataset's label, attribution and license, and the verify sources),
  // required by the data's licenses. A quiet row at the foot of the day; opened, it fetches the catalog (as the search
  // does) and lists credits(db). `open`: Food's, closed again at each opening (the sheet kept mounted).
  import { credits, type Credit } from '#lib/food/index.ts';
  import { t } from '#lib/i18n/index.ts';
  import { foodDb } from './dbHold.svelte.ts';

  let { open = $bindable(false) }: { open?: boolean } = $props();
  let list = $state.raw<Credit[] | null>(null);
  /** The chain menus are in (a member's): their pictures are Kalori's, credited beside ours. */
  let kal = $state(false);
  let failed = $state(false);

  function toggle() {
    open = !open;
    if (!open || list) return;
    failed = false; // (opened again after a failure: loading again)
    foodDb().then((db) => ((kal = db.sets.some((s) => s.source === 'kalori')), (list = credits(db))), () => (failed = true));
  }
</script>

<section class="credits" data-food-credits>
  <button type="button" class="hd" aria-expanded={open} data-sfx={open ? 'toggle-off' : 'toggle-on'} onclick={toggle}>
    {t('food.credits')}<svg class="chev" class:up={open} viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 L8 10.5 L12.5 6" /></svg>
  </button>
  {#if open}
    {#if list}
      <ul>
        <li data-credit-img><b>{t('food.img.badge')}</b><span>{t('food.img.credit')}</span>{#if kal}<span data-credit-kalori-img>{t('food.kal.img')}</span>{/if}</li>
        {#each list as c (c.label)}
          <li>
            <b>{#if c.url}<a href={c.url} target="_blank" rel="noopener noreferrer" data-sfx="open">{c.label}</a>{:else}{c.label}{/if}</b>
            {#if c.attribution}<span>{c.attribution}</span>{/if}
            {#if c.license}<span>{t('food.license', { l: c.license })}</span>{/if}
          </li>
        {/each}
      </ul>
    {:else}
      <p role="status">{t(failed ? 'food.loadFail' : 'food.loading')}</p>
    {/if}
  {/if}
</section>

<style>
  .credits { display: grid; gap: 6px; margin: 4px 2px 0; }
  .hd {
    appearance: none; border: 0; background: none; cursor: pointer; justify-self: start; display: inline-flex; align-items: center; gap: 6px;
    min-height: var(--hit); padding: 0 4px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft);
  }
  .hd:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; border-radius: var(--r-chip); }
  .chev { width: 14px; height: 14px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; transition: rotate 160ms; }
  .chev.up { rotate: 180deg; }
  ul { list-style: none; margin: 0; padding: 0 4px; display: grid; gap: 8px; }
  li { display: grid; gap: 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); overflow-wrap: anywhere; }
  li b { color: var(--text); font-size: var(--fs-s); }
  a { color: inherit; }
  p { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
</style>
