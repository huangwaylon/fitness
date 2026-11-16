<script lang="ts">
  // English Study's library (docs/english.md "The page"), a level like 設定's: one ChipRow (すべて, each show, each
  // situation: a preset, one at a time), then its clips in the plan's order, the plays left part-way first and the
  // finished last (✓, never hidden), 20 at a time with もっと見る. On すべて the collections come first (collections.ts),
  // each a level of its own (its note under the bar, the same rows, no chips; ‹ back to the library). A row shows its
  // state and band; nothing is locked.
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import ChipRow from '#lib/components/ui/ChipRow.svelte';
  import Chip from '#lib/components/ui/Chip.svelte';
  import ClipRow from './ClipRow.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { LIBRARY } from '../data.ts';
  import { SITUATIONS, shownOf } from '../collections.ts';
  import { studyOf } from '../progress.ts';
  import { partWays } from '../session.ts';
  import { s } from '../i18n.ts';
  import type { Who } from '#lib/types.ts';

  const PAGE = 20;
  /** `filter`: a show or a situation ('' all); `col`: the collection open ('' none); `count`: the rows shown. All kept
   *  by the sheet while a lesson is open. */
  let { filter = $bindable(''), col = $bindable(''), count = $bindable(PAGE), onopen, onback, onclose }: { filter?: string; col?: string; count?: number; onopen: (id: string) => void; onback: () => void; onclose: () => void } = $props();

  const me = $derived<Who>(week.model?.me ?? 'A');
  const mine = $derived(studyOf(week.model?.state.listen ?? [], me, me));
  const parts = $derived(new Map(partWays(me).filter((p) => LIBRARY.some((c) => c.id === p.id && c.v === p.v)).map((p) => [p.id, p])));
  /** The chips: the shows, then the situations, each only with a clip. */
  const chips = $derived<string[]>([...new Set<string>(LIBRARY.map((c) => c.show))].concat(SITUATIONS.filter((t) => LIBRARY.some((c) => c.tags.includes(t)))));
  const cols = shownOf(LIBRARY);
  const open = $derived(cols.find((x) => x.c.id === col));
  const list = $derived.by(() => {
    const of = open ? open.clips : LIBRARY.filter((c) => !filter || c.show === filter || c.tags.includes(filter));
    const rank = (id: string) => (parts.has(id) ? 0 : mine.clips.has(id) ? 2 : 1);
    return of.map((c, i) => ({ c, i })).sort((a, b) => rank(a.c.id) - rank(b.c.id) || a.i - b.i).map((x) => x.c);
  });
  function pick(f: string): void {
    filter = f;
    count = PAGE;
  }
  function into(id: string): void {
    col = id;
    count = PAGE;
  }
</script>

<section class="screen" data-en-library data-en-col={open?.c.id}>
  <div class="top">
    {#if open}
      <NavBar pad title={s(`col.${open.c.id}`)} onback={() => into('')} {onclose} />
    {:else}
      <NavBar pad title={s('library')} {onback} {onclose} />
      <ChipRow label={s('libFilter')}>
        <Chip label={s('libAll')} selected={!filter} data-en-chip="" onclick={() => pick('')} />
        {#each chips as f (f)}<Chip label={f} selected={filter === f} data-en-chip={f} onclick={() => pick(f)} />{/each}
      </ChipRow>
    {/if}
  </div>
  <div class="body sheet-scroll">
    {#if open}
      <p class="note" data-en-col-note>{s(`colNote.${open.c.id}`)}</p>
    {:else if !filter && cols.length}
      <h3 class="sec-label head">{s('collections')}</h3>
      <div class="card dense" data-en-cols>
        {#each cols as { c, clips } (c.id)}
          {@const done = clips.filter((m) => mine.clips.has(m.id)).length}
          <button type="button" class="row colrow" data-sfx="page" data-en-colrow={c.id} onclick={() => into(c.id)}>
            <span class="name">{s(`col.${c.id}`)}</span>
            <span class="count">{s('libN', { n: clips.length })}{#if done} · {s('colDone', { n: done })}{/if}</span>
            <svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        {/each}
      </div>
    {/if}
    <h3 class="sec-label head">{open ? s('libClips') : filter || s('libClips')}<span class="n">{s('libN', { n: list.length })}</span></h3>
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
  .note { margin: 4px 2px 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .colrow { width: 100%; text-align: left; }
  .colrow .name { flex: 1; min-width: 0; font-weight: 700; }
  .count { flex: none; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .chev { flex: none; width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; color: var(--text-soft); }
  .more { width: 100%; justify-content: center; font-weight: 700; color: var(--text-soft); }
</style>
