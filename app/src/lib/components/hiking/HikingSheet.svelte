<script lang="ts">
  // トレイル's sheet (docs/hiking.md), its own chunk: a full sheet on the unified kit (docs/design.md "Unified kit"), one
  // list and no tab bar. The list stays mounted under a trail's view (its scroll and chips kept for ‹); each level has
  // its NavBar, ✕ closing the whole sheet from either; Esc first folds a trail's sheet down to its peek. The island
  // is paused under it (+page's sheetOpen); its open and close tunes are the panel's. The list is kept mounted between
  // openings (Sheet's `keep`: a reopening at once, its chips and scroll as left); a trail's view never (its map and
  // its location watch go with the close). The registered hikes' form (HikeForm) opens over either: ＋'s three ways
  // in, a hike's 編集; saved, its trail shows.
  import Sheet from '../ui/Sheet.svelte';
  import TrailList from './TrailList.svelte';
  import TrailView from './TrailView.svelte';
  import HikeForm from './HikeForm.svelte';
  import { hikes } from './hikes.svelte.ts';
  import { userIdOf, userSlug } from '#lib/hiking/user.ts';
  import type { HikeSrc, HikeView } from '#lib/contract/hike.ts';
  import { hiking } from './open.svelte.ts';
  import { trailOf } from '#lib/hiking/trails.ts';
  import type { Trail } from '#lib/hiking/types.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { S } from '#lib/hiking/strings.ts';
  import { pick } from '../travel/text.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  /** Each ask (the menu's pill, a hike card) picks the level it opens on; ‹ and a row move it. */
  let slug = $derived<string | null>(hiking.ask?.arg ?? null);
  /** (a registered hike's from the record: an edit shows at once, a removal goes back to the list) */
  const sel = $derived<Trail | null>(userIdOf(slug) ? hikes.trail(slug) : trailOf(slug));
  let view: { escape(): boolean } | undefined = $state();

  const close = () => (open = false);

  /** The form: a new hike's way in, or the hike edited; `n` remounts it fresh each opening. */
  let form = $state<{ open: boolean; n: number; src: HikeSrc; edit: HikeView | null }>({ open: false, n: 0, src: 'manual', edit: null });
  const add = (src: HikeSrc) => (form = { open: true, n: form.n + 1, src, edit: null });
  const editHike = (id: string) => {
    const v = hikes.view(id);
    if (v) form = { open: true, n: form.n + 1, src: v.src, edit: v };
  };
</script>

<Sheet bind:open tunes label={pick(S.title, i18n.locale)} variant="full" ondismiss={() => !view?.escape()} timed="hiking" keep={!sel}>
  <div class="hk" lang={i18n.locale} data-hiking data-level={sel ? 'trail' : 'list'}>
    <TrailList hidden={!!sel} onopen={(t) => (slug = t.slug)} onclose={close} onadd={add} />
    {#if sel}
      {#key sel.slug}<TrailView bind:this={view} trail={sel} onback={() => (slug = null)} onclose={close} onedit={editHike} onremoved={() => (slug = null)} />{/key}
    {/if}
    {#key form.n}
      {#if form.n}<HikeForm bind:open={form.open} src={form.src} edit={form.edit} onsaved={(id) => (slug = userSlug(id))} onswitch={add} />{/if}
    {/key}
  </div>
</Sheet>

<style>
  .hk { position: relative; flex: 1; min-height: 0; overflow: hidden; }
</style>
