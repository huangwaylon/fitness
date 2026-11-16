<script lang="ts">
  // A clip's row (home's ライブラリ card, the library level): the thumbnail (✓ once finished), the title on one line, the
  // show · the length · the band (or the place of a play left part-way, or 新しい質問 for a clip offered again), and at
  // most one tag: 途中, もう一度, or 「2回」 once finished twice.
  import Thumb from './Thumb.svelte';
  import { clock, s } from '../i18n.ts';
  import type { ClipMeta } from '../catalog.ts';

  let { clip, plays = 0, part = null, again = false, onopen }: { clip: ClipMeta; plays?: number; part?: { at: number; n: number } | null; again?: boolean; onopen: (id: string) => void } = $props();
</script>

<button type="button" class="row clip" data-sfx="open" data-en-clip={clip.id} data-done={plays > 0 || undefined} onclick={() => onopen(clip.id)}>
  <Thumb video={clip.video} show={clip.show} done={plays > 0} />
  <span class="txt">
    <span class="name" lang="en">{clip.title}{#if plays > 0}<span class="sr-only">{s('done')}</span>{/if}</span>
    <span class="sub"><span lang="en">{clip.show}</span> · {#if part}{s('partAt', { at: part.at + 1, n: part.n })}{:else if again}{s('againSub')}{:else}<span class="num">{clock(clip.dur)}</span> · {s(`band.${clip.band}`)}{/if}</span>
  </span>
  {#if part}<span class="tag" data-en-part>{s('partTag')}</span>
  {:else if again}<span class="tag" data-en-again-row>{s('againTag')}</span>
  {:else if plays >= 2}<span class="times">{s('times', { n: plays })}</span>{/if}
</button>

<style>
  .clip { width: 100%; text-align: left; min-height: 52px; padding: 8px 12px; }
  .txt { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .sub { font-size: var(--fs-s); color: var(--text-soft); overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
  .num { font-family: var(--font-num); font-variant-numeric: tabular-nums; }
  .tag, .times { flex: none; }
  .times { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
</style>
