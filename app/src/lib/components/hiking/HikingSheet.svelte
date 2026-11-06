<script lang="ts">
  // トレイル's sheet (docs/hiking.md), its own chunk: a full sheet on the unified kit (docs/design.md "Unified kit"), one
  // list and no tab bar. The list stays mounted under a trail's view (its scroll and chips kept for ‹); each level has
  // its NavBar s, ✕ closing the whole sheet from either; Esc first folds a trail's sheet down to its peek. The island
  // is paused under it (+page's sheetOpen); its open and close tunes are the panel's.
  import { untrack } from 'svelte';
  import Sheet from '../ui/Sheet.svelte';
  import TrailList from './TrailList.svelte';
  import TrailView from './TrailView.svelte';
  import { hikingAsk } from './open.svelte.ts';
  import { trailOf } from '#lib/hiking/trails.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { pick } from '../travel/text.ts';
  import { cue } from '#lib/sound/cues.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  let sel = $state<Trail | null>(null);
  let view: { escape(): boolean } | undefined = $state();

  // each ask (the menu's pill, a hike card) picks the level it opens on
  $effect(() => {
    void hikingAsk.n;
    untrack(() => (sel = trailOf(hikingAsk.slug)));
  });

  // its open and close tunes (it mounts on the first tap, already open: that is an open too)
  let wasOpen = false;
  $effect(() => {
    const o = open;
    if (o === wasOpen) return;
    wasOpen = o;
    cue(o ? 'panel-open' : 'panel-close');
  });

  const close = () => (open = false);
</script>

<Sheet bind:open label={pick(S.title, i18n.locale)} variant="full" ondismiss={() => !view?.escape()}>
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
