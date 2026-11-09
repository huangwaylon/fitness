<script lang="ts">
  // トレイル's sheet (docs/hiking.md), its own chunk: a full sheet on the unified kit (docs/design.md "Unified kit"), one
  // list and no tab bar. The list stays mounted under a trail's view (its scroll and chips kept for ‹); each level has
  // its NavBar, ✕ closing the whole sheet from either; Esc first folds a trail's sheet down to its peek. The island
  // is paused under it (+page's sheetOpen); its open and close tunes are the panel's. The list is kept mounted between
  // openings (Sheet's `keep`: a reopening at once, its chips and scroll as left); a trail's view never (its map and
  // its location watch go with the close).
  import Sheet from '../ui/Sheet.svelte';
  import TrailList from './TrailList.svelte';
  import TrailView from './TrailView.svelte';
  import { hiking } from './open.svelte.ts';
  import { trailOf } from '#lib/hiking/trails.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { pick } from '../travel/text.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  /** Each ask (the menu's pill, a hike card) picks the level it opens on; ‹ and a row move it. */
  let sel = $derived<Trail | null>(trailOf(hiking.ask?.arg ?? null));
  let view: { escape(): boolean } | undefined = $state();

  const close = () => (open = false);
</script>

<Sheet bind:open tunes label={pick(S.title, i18n.locale)} variant="full" ondismiss={() => !view?.escape()} timed="hiking" keep={!sel}>
  <div class="hk" lang={i18n.locale} data-hiking data-level={sel ? 'trail' : 'list'}>
    <TrailList hidden={!!sel} onopen={(t) => (sel = t)} onclose={close} />
    {#if sel}
      {#key sel.slug}<TrailView bind:this={view} trail={sel} onback={() => (sel = null)} onclose={close} />{/key}
    {/if}
  </div>
</Sheet>

<style>
  .hk { position: relative; flex: 1; min-height: 0; overflow: hidden; }
</style>
