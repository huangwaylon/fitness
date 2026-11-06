<script lang="ts">
  // トレイル's list (the hiking app's list screen): the header with its contour drawing, the eyebrow and the wordmark;
  // the difficulty chips and the two sort toggles; a photo card per trail (its difficulty badge, name and area over
  // the photo, distance, gain and time under it). A card opens the trail. (The hiking app's "save maps" buttons and its
  // free-hike button are left out: no offline maps; free hike later, docs/hiking.md.)
  import { asset } from '$app/paths';
  import Ic from './Ic.svelte';
  import { TRAILS } from '#lib/hiking/trails.ts';
  import { DIFF, S, fmtTime } from '#lib/hiking/strings.ts';
  import type { Diff, Trail } from '#lib/hiking/types.ts';
  import { fmtM, pick } from '../travel/text.ts';
  import { fmtKm } from '../travel/units.ts';
  import { i18n } from '#lib/i18n/index.ts';

  let { hidden = false, onopen }: { hidden?: boolean; onopen: (t: Trail) => void } = $props();

  let filter = $state<Diff | 'all'>('all');
  let sort = $state<'dist' | 'gain' | null>(null);
  const shown = $derived.by(() => {
    const xs = TRAILS.filter((t) => filter === 'all' || t.diff === filter);
    return sort === 'dist' ? xs.toSorted((a, b) => a.lengthKm - b.lengthKm) : sort === 'gain' ? xs.toSorted((a, b) => a.gainM - b.gainM) : xs;
  });
  const L = $derived(i18n.locale);
  const FILTERS = ['all', 'moderate', 'hard', 'veryhard'] as const;
  const photo = (slug: string) => asset(`/hiking/photos/${slug}.webp` as Parameters<typeof asset>[0]);
</script>

<section class="screen" {hidden} data-trail-list>
  <header class="head">
    <!-- the hiking app's signature: a contour motif bleeding off the top-right corner -->
    <svg class="topo" viewBox="0 0 220 150" preserveAspectRatio="xMaxYMin slice" aria-hidden="true">
      <g fill="none" stroke="currentColor" stroke-width="1.1" transform="rotate(-15 176 26)">
        {#each [[16, 11], [36, 25], [58, 40], [82, 56], [108, 73], [136, 91]] as [rx, ry] (rx)}<ellipse cx="186" cy="20" {rx} {ry} />{/each}
      </g>
    </svg>
    <span class="eyebrow">{pick(S.tagline, L)}</span>
    <h1>{pick(S.title, L)}</h1>
  </header>
  <div class="chips" role="toolbar" aria-label={pick(S.filterBar, L)}>
    {#each FILTERS as f (f)}
      <button type="button" class="chip" class:active={filter === f} aria-pressed={filter === f} data-filter={f} data-sfx="tick" onclick={() => (filter = f)}>
        {pick(f === 'all' ? S.all : DIFF[f], L)}
      </button>
    {/each}
    <span class="div" aria-hidden="true"></span>
    {#each ['dist', 'gain'] as const as k (k)}
      <button type="button" class="chip" class:active={sort === k} aria-pressed={sort === k} data-sort={k} data-sfx="tick" onclick={() => (sort = sort === k ? null : k)}>
        <Ic name="sort" /><span>{pick(k === 'dist' ? S.sortDist : S.sortGain, L)}</span>
      </button>
    {/each}
  </div>
  <div class="list" role="list">
    {#each shown as t (t.slug)}
      <div role="listitem">
        <button type="button" class="card" data-trail={t.slug} data-sfx="page" aria-label={pick(t.name, L)} onclick={() => onopen(t)}>
          <span class="img">
            <img src={photo(t.slug)} alt="" width="1200" height="800" loading="lazy" decoding="async" />
            <span class="badge d-{t.diff}">{pick(DIFF[t.diff], L)}</span>
            <span class="titlebar">
              <span class="title">{pick(t.name, L)}</span>
              <span class="area"><Ic name="pin" />{pick(t.area, L)}</span>
            </span>
          </span>
          <span class="stats">
            <span class="s"><Ic name="dist" /><span>{fmtKm(t.lengthKm)}</span></span>
            <span class="s"><Ic name="gain" /><span>{fmtM(t.gainM)}</span></span>
            <span class="s time"><Ic name="clock" /><span>{fmtTime(t.time, L)}</span></span>
          </span>
        </button>
      </div>
    {/each}
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--paper); }
  .screen[hidden] { display: none; }

  .head {
    position: relative; flex-shrink: 0; overflow: hidden;
    padding: calc(var(--safe-t) + 18px) calc(20px + var(--safe-r)) 14px calc(20px + var(--safe-l));
  }
  .topo { position: absolute; top: 0; right: 0; width: 62%; height: 100%; color: var(--pine); opacity: .10; pointer-events: none; }
  /* (the eyebrow's line holds the row ✕ sits on: HikingSheet's corner) */
  .eyebrow {
    position: relative; display: flex; align-items: center; min-height: 36px; margin-bottom: 8px; padding-right: 56px;
    font-size: 11px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--pine-d); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }
  h1 { position: relative; margin: 0; font-family: var(--font-display); font-size: 32px; font-weight: 600; letter-spacing: -.3px; line-height: 1.05; color: var(--ink); }
  :lang(ja) .eyebrow { letter-spacing: .03em; text-transform: none; font-size: 12px; font-weight: 600; }
  :lang(ja) h1 { font-weight: 700; letter-spacing: 0; }

  .chips {
    flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 2px 20px 14px; overflow-x: auto; scrollbar-width: none;
    -webkit-mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent); mask-image: linear-gradient(to right, #000 calc(100% - 28px), transparent);
  }
  .chips::-webkit-scrollbar { display: none; }
  .chip {
    position: relative; flex-shrink: 0; height: 36px; padding: 0 15px; border-radius: 999px; border: 1px solid var(--line); background: var(--surface);
    color: var(--ink-2); font-size: 13.5px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px;
    transition: background .15s, border-color .15s, color .15s, transform .1s;
  }
  /* a 44px tap target on the 36px pill */
  .chip::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 44px; transform: translateY(-50%); }
  .chip :global(.ic) { width: 15px; height: 15px; color: var(--muted); }
  .chip:active { transform: scale(.96); }
  .chip.active { background: var(--pine); border-color: var(--pine); color: #fff; }
  .chip.active :global(.ic) { color: #fff; }
  .div { flex-shrink: 0; width: 1px; height: 20px; background: var(--line); margin: 0 2px; }

  .list {
    flex: 1; overflow-y: auto; width: 100%; padding: 6px 20px calc(28px + var(--safe-b));
    display: flex; flex-direction: column; gap: 18px; overscroll-behavior: contain; scrollbar-width: none;
  }
  .card {
    display: block; width: 100%; padding: 0; margin: 0; text-align: left; font: inherit; color: inherit; cursor: pointer;
    border-radius: var(--r-card); overflow: hidden; background: var(--surface); position: relative;
    border: 1px solid var(--line-2); box-shadow: var(--sh-card); transition: transform .18s ease, box-shadow .18s ease;
  }
  .card:active { transform: scale(.985); box-shadow: var(--sh-pop); }
  .img { position: relative; display: block; width: 100%; height: clamp(158px, 42vw, 212px); background: var(--paper-2); }
  .img img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .img::after { content: ''; position: absolute; inset: 0; background: linear-gradient(to top, rgba(14, 22, 18, .74) 0%, rgba(14, 22, 18, .18) 32%, rgba(14, 22, 18, 0) 56%); }
  .badge {
    position: absolute; top: 11px; left: 11px; z-index: 2; display: inline-flex; align-items: center; gap: 5px;
    padding: 5px 11px 5px 9px; border-radius: 999px; font-size: 11.5px; font-weight: 700; letter-spacing: .01em;
    background: rgba(255, 255, 255, .92); -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px); box-shadow: 0 1px 4px rgba(14, 22, 18, .18);
  }
  .badge::before { content: ''; width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
  .titlebar { position: absolute; bottom: 0; left: 0; right: 0; z-index: 2; display: block; padding: 14px 16px 15px; }
  .title { display: block; font-family: var(--font-display); font-size: 21px; font-weight: 600; color: #fff; letter-spacing: -.1px; line-height: 1.16; text-shadow: 0 1px 10px rgba(0, 0, 0, .45); }
  :lang(ja) .title { font-weight: 700; }
  .area { display: flex; align-items: center; gap: 4px; margin-top: 4px; font-size: 12.5px; font-weight: 600; color: rgba(255, 255, 255, .92); text-shadow: 0 1px 6px rgba(0, 0, 0, .55); }
  .area :global(.ic) { width: 13px; height: 13px; opacity: .9; }
  .stats { display: flex; align-items: center; gap: 15px; padding: 13px 16px 15px; font-size: 13px; font-weight: 600; color: var(--ink-2); }
  .s { display: flex; align-items: center; gap: 6px; white-space: nowrap; font-variant-numeric: tabular-nums; }
  .stats :global(.ic) { width: 15px; height: 15px; color: var(--muted); }
  .time { margin-left: auto; }

  /* difficulty: the badge's text and dot */
  .d-moderate { color: #8a5410; }
  .d-hard { color: #c0392b; }
  .d-veryhard { color: #8e3bb0; }

  @media (min-width: 640px) {
    .head, .chips, .list { max-width: 760px; margin-inline: auto; }
    .list { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: min-content; align-items: start; }
  }
  @media (orientation: landscape) and (max-height: 560px) {
    .head, .chips, .list { max-width: none; margin-inline: 0; }
    .list { display: grid; grid-template-columns: 1fr 1fr; grid-auto-rows: min-content; align-items: start; gap: 14px; }
    .head { padding-top: calc(var(--safe-t) + 12px); padding-bottom: 10px; }
    h1 { font-size: 26px; }
    .img { height: 150px; }
  }
</style>
