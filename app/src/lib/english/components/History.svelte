<script lang="ts">
  // これまでの記録 (docs/english.md "Progress"), a level from home's これまでの記録 row and 今週's これまで N本 ›: the counts (clips, days, time; never a
  // rate), then my plays by month, the latest first, 20 at a time: each its day and time, the clip, 「k回目」 on a replay,
  // 「もう一度聞きたい場面 n」 when it has any, 途中まで quietly. Mine only (the guest's own: progress.ts playsOf). A play opens
  // its page (HistoryPlay); a clip gone from the library is listed, not linked. The rows shown and the scroll are kept
  // by the sheet while a page is open.
  import { onMount } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Thumb from './Thumb.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { formatDate, monthLabel } from '#lib/i18n/format.ts';
  import { metaById } from '../data.ts';
  import { missesOf, playsOf, studyOf, type Play } from '../progress.ts';
  import { s } from '../i18n.ts';
  import type { Who } from '#lib/types.ts';

  const PAGE = 20;
  let { count = $bindable(PAGE), scroll = $bindable(0), onopen, onback, onclose }: { count?: number; scroll?: number; onopen: (key: string) => void; onback: () => void; onclose: () => void } = $props();

  const me = $derived<Who>(week.model?.me ?? 'A');
  const rows = $derived(week.model?.state.listen ?? []);
  const plays = $derived(playsOf(rows, me));
  const study = $derived(studyOf(rows, me, me));
  /** The plays shown, by month (the latest first). */
  const months = $derived.by(() => {
    const out: { m: string; plays: Play[] }[] = [];
    for (const p of plays.slice(0, count)) {
      const m = p.d.slice(0, 7);
      if (out.at(-1)?.m !== m) out.push({ m, plays: [] });
      out.at(-1)!.plays.push(p);
    }
    return out;
  });
  const minutes = (ms: number) => Math.max(1, Math.round(ms / 60_000));
  const total = $derived.by(() => {
    const m = Math.round([...study.ms.values()].reduce((a, b) => a + b, 0) / 60_000);
    return m >= 60 ? s('histTime', { h: Math.floor(m / 60), m: m % 60 }) : s('histTimeMin', { m: Math.max(1, m) });
  });

  let body: HTMLElement | undefined = $state();
  onMount(() => body?.scrollTo({ top: scroll }));
</script>

<section class="screen" data-en-history>
  <div class="top"><NavBar pad title={s('history')} {onback} {onclose} /></div>
  <div class="body sheet-scroll" bind:this={body} onscroll={() => (scroll = body?.scrollTop ?? 0)}>
    {#if plays.length}
      <p class="sum card pad" data-en-hist-sum>
        <b>{s('clips', { n: study.clips.size })}</b><span aria-hidden="true"> · </span><b>{s('histDays', { n: study.days.size })}</b>
        <small>{total}</small>
      </p>
      {#each months as { m, plays: ps } (m)}
        <h3 class="sec-label head">{monthLabel(m)}</h3>
        <div class="card dense">
          {#each ps as p (p.key)}
            {@const c = metaById(p.u)}
            {@const b = missesOf(p).length}
            {#snippet inner()}
              {#if c}<Thumb video={c.video} show={c.show} />{/if}
              <span class="txt">
                <span class="sub">{s('histRow', { date: formatDate(p.d), m: minutes(p.ms) })}</span>
                <span class="name" lang={c ? 'en' : undefined}>{c ? c.title : s('histGone')}</span>
                {#if p.k > 1 || b || !p.f}
                  <span class="sub tags">{#if !p.f}<span data-en-hist-part>{s('histPart')}</span>{/if}{#if p.k > 1}<span>{s('histNth', { k: p.k })}</span>{/if}{#if b}<span data-en-hist-miss={b}>{s('histMiss', { n: b })}</span>{/if}</span>
                {/if}
              </span>
            {/snippet}
            {#if c}
              <button type="button" class="row play" data-sfx="page" data-en-play={p.key} data-en-play-clip={p.u} onclick={() => onopen(p.key)}>
                {@render inner()}<Icon name="chevron-right" size={18} stroke={2.6} />
              </button>
            {:else}
              <div class="row play gone" data-en-play={p.key} data-en-play-clip={p.u}>{@render inner()}</div>
            {/if}
          {/each}
        </div>
      {/each}
      {#if plays.length > count}
        <div class="card dense"><button type="button" class="row more" data-sfx="tick" data-en-hist-more onclick={() => (count += PAGE)}>{s('more', { n: plays.length - count })}</button></div>
      {/if}
    {:else}
      <p class="empty card pad" data-en-hist-empty><Phrases text={s('histEmpty')} /></p>
    {/if}
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 8px; padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .card { flex: none; margin: 0; }
  .sum { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 2px; row-gap: 2px; font-size: var(--fs-body); }
  .sum small { flex-basis: 100%; font-size: var(--fs-s); color: var(--text-soft); }
  .empty { color: var(--text-soft); }
  .play { width: 100%; text-align: left; min-height: 60px; padding: 8px 12px; }
  .txt { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .gone .name { font-weight: 400; color: var(--text-soft); }
  .sub { font-size: var(--fs-s); color: var(--text-soft); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .tags { display: flex; gap: 8px; }
  .play :global(svg) { flex: none; color: var(--text-soft); }
  .more { width: 100%; justify-content: center; font-weight: 700; color: var(--text-soft); }
</style>
