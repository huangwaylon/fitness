<script lang="ts">
  // トレイル's list: NavBar on the plain band (the body's --surface), one ChipRow under it (the difficulties with their counts, then the two
  // sorts, each off again on a second tap), and a dense photo card per trail (its level's sticker, name and area on a
  // PhotoBand, 距離 · 標高差 · 時間 in a StatStrip under it). A card opens the trail.
  import NavBar from '../ui/NavBar.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Chip from '../ui/Chip.svelte';
  import Icon from '../ui/Icon.svelte';
  import PhotoBand from '../ui/PhotoBand.svelte';
  import StatStrip from '../ui/StatStrip.svelte';
  import { TRAILS } from '#lib/hiking/trails.ts';
  import { DIFF, S } from '#lib/hiking/strings.ts';
  import type { Diff, Trail } from '#lib/hiking/types.ts';
  import { pick } from '../travel/text.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { trailStats } from './stats.ts';
  import { staticUrl } from '#lib/staticUrl.ts';

  let { hidden = false, onopen, onclose }: { hidden?: boolean; onopen: (t: Trail) => void; onclose: () => void } = $props();

  let filter = $state<Diff | 'all'>('all');
  let sort = $state<'dist' | 'gain' | null>(null);
  const shown = $derived.by(() => {
    const xs = TRAILS.filter((t) => filter === 'all' || t.diff === filter);
    return sort === 'dist' ? xs.toSorted((a, b) => a.lengthKm - b.lengthKm) : sort === 'gain' ? xs.toSorted((a, b) => a.gainM - b.gainM) : xs;
  });
  const L = $derived(i18n.locale);
  const FILTERS = ['all', 'moderate', 'hard', 'veryhard'] as const;
  const count = (f: (typeof FILTERS)[number]) => (f === 'all' ? TRAILS.length : TRAILS.filter((t) => t.diff === f).length);
  /** The level's sticker: leaf, yuzu, coral. */
  const TONE: Record<Diff, string> = { moderate: 'leaf', hard: '', veryhard: 'hot' };
  const photo = (slug: string) => staticUrl(`/hiking/photos/${slug}.webp`);
</script>

<section class="screen" {hidden} data-trail-list>
  <div class="top"><NavBar pad title={pick(S.title, L)} {onclose} /></div>
  <ChipRow label={pick(S.filterBar, L)}>
    {#each FILTERS as f (f)}
      <Chip label={pick(f === 'all' ? S.all : DIFF[f], L)} count={count(f)} selected={filter === f} data-filter={f} onclick={() => (filter = f)} />
    {/each}
    <span class="div" aria-hidden="true"></span>
    {#each ['dist', 'gain'] as const as k (k)}
      <button type="button" class="chip s" aria-pressed={sort === k} data-sort={k} data-sfx="tick" onclick={() => (sort = sort === k ? null : k)}>
        <Icon name="sort" size={16} /><span>{pick(k === 'dist' ? S.sortDist : S.sortGain, L)}</span>
      </button>
    {/each}
  </ChipRow>
  <div class="list" role="list">
    {#each shown as t (t.slug)}
      <div class="card dense trail" role="listitem" data-trail={t.slug}>
        <PhotoBand src={photo(t.slug)} height={120}>
          <h3 class="name">{pick(t.name, L)}</h3>
          <span class="area"><Icon name="pin" size={14} />{pick(t.area, L)}</span>
        </PhotoBand>
        <span class="sticker lvl {TONE[t.diff]}">{pick(DIFF[t.diff], L)}</span>
        <StatStrip items={trailStats(t, L)} />
        <button type="button" class="hit" data-sfx="page" aria-label={pick(t.name, L)} onclick={() => onopen(t)}></button>
      </div>
    {/each}
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .screen[hidden] { display: none; }
  .top { flex: none; background-color: var(--surface); }
  .div { flex: none; align-self: stretch; width: 1.5px; margin: 8px 2px; background: linear-gradient(var(--stitch) 60%, transparent 0) 0 0 / 1.5px 6px repeat-y; }
  .list {
    flex: 1; min-height: 0; overflow: hidden auto; overscroll-behavior: contain; scrollbar-width: none;
    display: flex; flex-direction: column; gap: 8px; padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left));
  }
  /* (a card clips its photo: never shrunk to the scroller) */
  .trail { flex: none; }
  .lvl { position: absolute; top: 9px; left: 10px; }
  .name { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .area { display: flex; align-items: center; gap: 3px; margin-top: 2px; font-size: var(--fs-s); }
  /* the whole card is the button (its name read out), over everything drawn */
  .hit { position: absolute; inset: 0; z-index: 1; appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; border-radius: inherit; -webkit-tap-highlight-color: transparent; }
  .hit:active { background: var(--hl); }
  .hit:focus-visible { outline: 3px solid var(--focus); outline-offset: -3px; }
  /* the hardest level: a coral sticker that reads on a photo (the coral stamp is an outline) */
  .sticker.hot { background: var(--c-coral); box-shadow: 0 2px 0 var(--c-coral-text); }
</style>
