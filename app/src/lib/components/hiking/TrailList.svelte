<script lang="ts">
  // トレイル's list (docs/hiking.md "Screens"): NavBar on the plain band, one ChipRow (the sort chip, which opens its
  // ActionSheet; すべて 日本 ワシントン州, one region at a time; the levels, any of them toggled), then the trails in sections
  // (lib/hiking/list.ts): 予定 as photo cards (a plan coming up), 行きたい and 歩いた as compact rows in a dense card
  // (a thumb, the name and area, the figures in one line, the level's sticker). A card or row opens the trail. The
  // registered hikes (hikes.svelte.ts) sit in the same sections, the paper placeholder (a mountain) for their photo;
  // ＋ before ✕ in the bar opens how to add one (an ActionSheet: YAMAP's link, a GPX, by hand).
  import NavBar from '../ui/NavBar.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import ChipRow from '../ui/ChipRow.svelte';
  import Chip from '../ui/Chip.svelte';
  import Icon from '../ui/Icon.svelte';
  import PhotoBand from '../ui/PhotoBand.svelte';
  import StatStrip from '../ui/StatStrip.svelte';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { photoFallback } from '../ui/photoFallback.ts';
  import { TRAILS } from '#lib/hiking/trails.ts';
  import { DIFF, S, fmtTime } from '#lib/hiking/strings.ts';
  import { SORTS, dayOf, sections, type SortKey, type Status } from '#lib/hiking/list.ts';
  import type { Diff, Region, Trail } from '#lib/hiking/types.ts';
  import { fmtM, pick } from '../travel/text.ts';
  import { fmtKm } from '../travel/units.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { formatDate } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { trailStats } from './stats.ts';
  import { hikes } from './hikes.svelte.ts';
  import type { HikeSrc } from '#lib/contract/hike.ts';
  import { staticUrl } from '#lib/staticUrl.ts';

  let { hidden = false, onopen, onclose, onadd }: { hidden?: boolean; onopen: (t: Trail) => void; onclose: () => void; onadd: (src: HikeSrc) => void } = $props();

  let region = $state<Region | null>(null);
  let diffs = $state<ReadonlySet<Diff>>(new Set());
  let sort = $state<SortKey>('auto');
  let sorting = $state(false);
  const today = $derived(dayKey(minuteNow()));
  let adding = $state(false);
  const all = $derived([...TRAILS, ...hikes.trails]);
  const shown = $derived(sections(all, { region, diffs }, sort, today));
  const L = $derived(i18n.locale);

  const REGIONS = [null, 'jp', 'us'] as const;
  /** The levels' chips: 初級 only while a registered hike is (the guide has none). */
  const LEVELS = $derived<readonly Diff[]>(all.some((t) => t.diff === 'easy') ? ['easy', 'moderate', 'hard', 'veryhard'] : ['moderate', 'hard', 'veryhard']);
  const SORT_LABEL: Record<SortKey, keyof typeof S> = { auto: 'sortAuto', dist: 'sortDist', gain: 'sortGain', time: 'sortTime' };
  const SEC: Record<Status, keyof typeof S> = { planned: 'secPlanned', want: 'secWant', walked: 'secWalked' };
  const count = (r: Region | null) => all.filter((t) => !r || t.tiles === r).length;
  const toggle = (d: Diff) => {
    const next = new Set(diffs);
    if (!next.delete(d)) next.add(d);
    diffs = next;
  };
  const reset = () => ((region = null), (diffs = new Set()));
  /** The level's sticker: leaf, yuzu, coral. */
  const TONE: Record<Diff, string> = { easy: 'sky', moderate: 'leaf', hard: '', veryhard: 'hot' };
  /** A row's thumb (the photo's 168 px square) and a 予定 card's band (its 1080 × 360 strip): scripts/hiking-thumbs.ts,
   *  ~5 and ~55 KB where the photo is ~150 KB (a slow link's list held the trail map's chunk back). */
  const thumb = (slug: string) => staticUrl(`hiking/thumbs/${slug}.webp`);
  const band = (slug: string) => staticUrl(`hiking/bands/${slug}.webp`);
  /** A row's line of figures: '9.8 km · 444 m · 約3時間15分'. */
  const line = (t: Trail) => [t.lengthKm ? fmtKm(t.lengthKm) : '', t.gainM ? fmtM(t.gainM) : '', t.time ? fmtTime(t.time, L) : ''].filter(Boolean).join(' · ');
  const ADD: { id: HikeSrc; label: keyof typeof S; icon: 'link' | 'file' | 'edit' }[] = [
    { id: 'yamap', label: 'srcYamap', icon: 'link' }, { id: 'gpx', label: 'srcGpx', icon: 'file' }, { id: 'manual', label: 'srcManual', icon: 'edit' }
  ];
</script>

<section class="screen" {hidden} data-trail-list>
  {#snippet plus()}<NavButton kind="tool" icon="plus" popup sfx="open" label={pick(S.add, L)} data-hike-add onclick={() => (adding = true)} />{/snippet}
  <div class="top"><NavBar pad title={pick(S.title, L)} trailing={plus} {onclose} /></div>
  <ChipRow label={pick(S.filterBar, L)}>
    <button type="button" class="chip s" aria-haspopup="dialog" aria-pressed={sort !== 'auto'} data-sort={sort} data-sfx="tick" onclick={() => (sorting = true)}>
      <Icon name="sort" size={16} /><span>{pick(S[SORT_LABEL[sort]], L)}</span>
    </button>
    <span class="div" aria-hidden="true"></span>
    {#each REGIONS as r (r)}
      <Chip
        label={pick(r === 'jp' ? S.regionJp : r === 'us' ? S.regionUs : S.all, L)}
        count={count(r)}
        selected={region === r && (r !== null || !diffs.size)}
        data-region={r ?? 'all'}
        onclick={() => (r === null ? reset() : (region = r))}
      />
    {/each}
    <span class="div" aria-hidden="true"></span>
    {#each LEVELS as d (d)}
      <Chip label={pick(DIFF[d], L)} selected={diffs.has(d)} data-filter={d} onclick={() => toggle(d)} />
    {/each}
  </ChipRow>
  <div class="list sheet-scroll">
    {#each shown as sec (sec.status)}
      <h3 class="sec-label head" data-section={sec.status}>{pick(S[SEC[sec.status]], L)}<span class="n">{sec.trails.length}</span></h3>
      {#if sec.status === 'planned'}
        {#each sec.trails as t (t.slug)}
          <div class="card dense trail" data-trail={t.slug}>
            {#snippet foot()}
              <h4 class="name">{pick(t.name, L)}</h4>
              <span class="area">{#if t.area.ja}<Icon name="pin" size={14} />{pick(t.area, L)}{/if}{#if dayOf(t)}<span class="when"><Icon name="calendar" size={14} />{formatDate(dayOf(t)!)}</span>{/if}</span>
            {/snippet}
            {#if t.user}
              <div class="band ph"><Icon name="mountain" size={32} /><div class="foot">{@render foot()}</div></div>
            {:else}
              <PhotoBand src={band(t.slug)} height={120}>{@render foot()}</PhotoBand>
            {/if}
            <span class="sticker lvl {TONE[t.diff]}">{pick(DIFF[t.diff], L)}</span>
            <StatStrip items={trailStats(t, L)} />
            <button type="button" class="hit" data-sfx="page" aria-label={pick(t.name, L)} onclick={() => onopen(t)}></button>
          </div>
        {/each}
      {:else}
        <div class="card dense rows">
          {#each sec.trails as t (t.slug)}
            <button type="button" class="row trail" data-trail={t.slug} data-sfx="page" onclick={() => onopen(t)}>
              {#if t.user}
                <span class="thumb ph" data-missing><Icon name="mountain" size={24} /></span>
              {:else}
                <img class="thumb" src={thumb(t.slug)} alt="" loading="lazy" decoding="async" {@attach photoFallback} />
              {/if}
              <span class="txt">
                <span class="name">{pick(t.name, L)}</span>
                <span class="sub">{sec.status === 'walked' && dayOf(t) ? formatDate(dayOf(t)!, { year: true }) : pick(t.area, L)}</span>
                <span class="fig">{line(t)}</span>
              </span>
              <span class="sticker {TONE[t.diff]}">{pick(DIFF[t.diff], L)}</span>
            </button>
          {/each}
        </div>
      {/if}
    {:else}
      <p class="none" data-none><Phrases text={pick(S.none, L)} /></p>
    {/each}
  </div>
</section>

<ActionSheet
  bind:open={sorting}
  name="trail-sort"
  title={pick(S.sort, L)}
  groups={[SORTS.map((k) => ({ id: k, label: pick(S[SORT_LABEL[k]], L), icon: k === sort ? ('check' as const) : undefined, hook: `sort-${k}` }))]}
  onpick={(id) => (sort = id as SortKey)}
/>

<ActionSheet
  bind:open={adding}
  name="hike-add"
  title={pick(S.add, L)}
  groups={[ADD.map((a) => ({ id: a.id, label: pick(S[a.label], L), icon: a.icon, hook: `add-${a.id}` }))]}
  onpick={(id) => onadd(id as HikeSrc)}
/>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .screen[hidden] { display: none; }
  .top { flex: none; background-color: var(--surface); }
  .div { flex: none; align-self: stretch; width: 1.5px; margin: 8px 2px; background: linear-gradient(var(--stitch) 60%, transparent 0) 0 0 / 1.5px 6px repeat-y; }
  .list {
    scrollbar-width: none;
    display: flex; flex-direction: column; gap: 8px; padding: 0 calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left));
  }
  .list > .sec-label { margin-bottom: -2px; }
  .list > .sec-label:first-child { margin-top: 4px; }
  /* (a card clips its photo: never shrunk to the scroller) */
  .card { flex: none; }
  .lvl { position: absolute; top: 9px; left: 10px; }
  .card.trail .name { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .area { display: flex; align-items: center; gap: 3px; margin-top: 2px; font-size: var(--fs-s); }
  .when { display: inline-flex; align-items: center; gap: 3px; margin-left: auto; font-variant-numeric: tabular-nums; }
  /* the whole card is the button (its name read out), over everything drawn */
  .hit { position: absolute; inset: 0; z-index: 1; appearance: none; border: 0; padding: 0; margin: 0; background: none; cursor: pointer; border-radius: inherit; -webkit-tap-highlight-color: transparent; }
  .hit:active { background: var(--hl); }
  .hit:focus-visible { outline-offset: -3px; }
  /* a compact row: a 56px thumb, three lines, the level's sticker */
  .row.trail { width: 100%; padding: 8px 12px 8px 8px; text-align: start; }
  .thumb { flex: none; width: 56px; height: 56px; border-radius: 10px; object-fit: cover; background: var(--ctl-off); }
  .txt { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .txt > span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row .name { font: 700 var(--fs-body)/1.25 var(--font-ui); color: var(--text); }
  .sub { font-size: var(--fs-s); color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .fig { font: 600 var(--fs-s)/1.3 var(--font-num); color: var(--text); font-variant-numeric: tabular-nums; }
  .row .sticker { flex: none; align-self: center; }
  /* a registered hike's photo: the paper placeholder (ui/photoFallback's look) with a mountain */
  .ph { display: grid; place-items: center; background: var(--c-paper); color: #A88B68; }
  .band.ph { position: relative; height: 120px; place-items: start center; padding-top: 22px; overflow: hidden; }
  .band.ph .foot { position: absolute; left: 0; right: 0; bottom: 0; padding: 8px 12px 9px; color: var(--c-ink); }
  .none { margin: 32px 16px; text-align: center; color: var(--text-soft); font-size: var(--fs-s); }
  /* the hardest level: a coral sticker that reads on a photo (the coral stamp is an outline) */
  .sticker.hot { background: var(--c-coral); box-shadow: 0 2px 0 var(--c-coral-text); }
  /* 初級 (a registered hike's only): the sky's tint */
  .sticker.sky { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-cream)); box-shadow: 0 2px 0 var(--c-edge); }
</style>
