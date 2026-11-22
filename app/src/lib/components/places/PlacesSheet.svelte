<script lang="ts">
  // 保存した場所's sheet (docs/places.md), its own chunk: a full sheet on the unified kit (docs/design.md "Unified kit"),
  // one screen (PlacesView: the map, the drag-up sheet, a place's card as its level). Esc first goes back from a card,
  // then folds the full sheet to its peek. The island is paused under it (+page's sheetOpen); its open and close tunes
  // are the panel's. Not kept between openings (its map and location watch go with the close).
  import Sheet from '../ui/Sheet.svelte';
  import PlacesView from './PlacesView.svelte';
  import { S } from '#lib/places/strings.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { pick } from '../travel/text.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  let view: { escape(): boolean } | undefined = $state();
</script>

<Sheet bind:open tunes label={pick(S.title, i18n.locale)} variant="full" ondismiss={() => !view?.escape()} timed="places">
  <div class="pl" lang={i18n.locale}>
    <PlacesView bind:this={view} onclose={() => (open = false)} />
  </div>
</Sheet>

<style>
  .pl { position: relative; flex: 1; min-height: 0; overflow: hidden; }
</style>
