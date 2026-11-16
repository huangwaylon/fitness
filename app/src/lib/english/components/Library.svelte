<script lang="ts">
  // English Study's library (docs/english.md "The page"), a level like 設定's: one ChipRow (すべて, each show, each
  // situation: a preset, one at a time), then its clips in order, the plays left part-way first and the finished last
  // (✓, never hidden), 20 at a time with もっと見る. A row shows its state and band; nothing is locked.
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import ChipRow from '#lib/components/ui/ChipRow.svelte';
  import Chip from '#lib/components/ui/Chip.svelte';
  import ClipRow from './ClipRow.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { LIBRARY } from '../data.ts';
  import { studyOf } from '../progress.ts';
  import { partWays } from '../session.ts';
  import { s } from '../i18n.ts';
  import type { Who } from '#lib/types.ts';

  const PAGE = 20;
  /** `filter`: a show or a situation ('' all); `count`: the rows shown. Both kept by the sheet while a lesson is open. */
  let { filter = $bindable(''), count = $bindable(PAGE), onopen, onback, onclose }: { filter?: string; count?: number; onopen: (id: string) => void; onback: () => void; onclose: () => void } = $props();
  /** The situations, in the order their chips go (types.ts Clip tags). */
  const TAGS = ['職場', '恋愛', '友だち', '家', '店・レストラン', '電話', '旅行', '買い物', 'お願い・断り'];

  const me = $derived<Who>(week.model?.me ?? 'A');
  const mine = $derived(studyOf(week.model?.state.listen ?? [], me, me));
  const parts = $derived(new Map(partWays(me).filter((p) => LIBRARY.some((c) => c.id === p.id && c.v === p.v)).map((p) => [p.id, p])));
  /** The chips: the shows, then the situations, each only with a clip. */
  const chips = $derived<string[]>([...new Set<string>(LIBRARY.map((c) => c.show))].concat(TAGS.filter((t) => LIBRARY.some((c) => c.tags.includes(t)))));
  const list = $derived.by(() => {
    const of = LIBRARY.filter((c) => !filter || c.show === filter || c.tags.includes(filter));
    const rank = (id: string) => (parts.has(id) ? 0 : mine.clips.has(id) ? 2 : 1);
    return of.map((c, i) => ({ c, i })).sort((a, b) => rank(a.c.id) - rank(b.c.id) || a.i - b.i).map((x) => x.c);
  });
  function pick(f: string): void {
    filter = f;
    count = PAGE;
  }
</script>

<section class="screen" data-en-library>
  <div class="top">
    <NavBar pad title={s('library')} {onback} {onclose} />
    <ChipRow label={s('libFilter')}>
      <Chip label={s('libAll')} selected={!filter} data-en-chip="" onclick={() => pick('')} />
      {#each chips as f (f)}<Chip label={f} selected={filter === f} data-en-chip={f} onclick={() => pick(f)} />{/each}
    </ChipRow>
  </div>
  <div class="body sheet-scroll">
    <h3 class="sec-label head">{filter || s('libClips')}<span class="n">{s('libN', { n: list.length })}</span></h3>
    <div class="card dense" data-en-list>
      {#each list.slice(0, count) as c (c.id)}
        <ClipRow clip={c} plays={mine.plays.get(c.id)} part={parts.get(c.id) ?? null} {onopen} />
      {/each}
      {#if list.length > count}
        <button type="button" class="row more" data-sfx="tick" data-en-more onclick={() => (count += PAGE)}>{s('more', { n: list.length - count })}</button>
      {/if}
    </div>
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 8px; padding: 0 calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .head { margin-top: 6px; }
  .card { flex: none; }
  .more { width: 100%; justify-content: center; font-weight: 700; color: var(--text-soft); }
</style>
