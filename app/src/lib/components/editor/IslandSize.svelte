<script lang="ts" module>
  import type { Edge } from '#lib/layout/resize.ts';
  export const EDGE_NAME: Record<Edge, string> = { front: '手前', back: '奥', left: '左', right: '右' };
</script>

<script lang="ts">
  // しまの おおきさ (layout/resize.ts): the land's size, an edge a tile out or in (shift: 8), what's in the way listed
  // with 「動かす」 (moved inside first; a fixed piece never deleted). The stepper under the pointer (or the finger) shows
  // its new coast on the plan (`hover`).
  import { kindDef } from '#lib/layout/catalog.ts';
  import Phrases from '../ui/Phrases.svelte';
  import { EDGES, landSize, resizedCodes, type Blocker } from '#lib/layout/resize.ts';
  import type { Layout } from '#lib/layout/model.ts';

  interface Props {
    layout: Layout;
    pending: { edge: Edge; by: number; blocked: Blocker[]; stuck: string[] } | null;
    selected: Set<string>;
    hover: { edge: Edge; by: number } | null;
    onresize(edge: Edge, by: number, moveIn?: boolean): void;
    onshow(id: string): void;
    oncancel(): void;
  }
  let { layout, pending, selected, hover = $bindable(), onresize, onshow, oncancel }: Props = $props();
  const isle = $derived(landSize(layout));
  const room = $derived(Object.fromEntries(EDGES.map((e) => [e, { out: !!resizedCodes(layout, e, 1), in: !!resizedCodes(layout, e, -1) }])) as Record<Edge, { out: boolean; in: boolean }>);
</script>

<section class="size" data-island-size>
  <h2>島の大きさ <small data-size-readout>{isle.cols} × {isle.rows}</small></h2>
  <div class="edges">
    {#each EDGES as e (e)}
      <div class="edge" data-edge={e}>
        <span class="ename">{EDGE_NAME[e]}</span>
        {#each [-1, 1] as by (by)}
          <button
            type="button"
            data-resize={e}
            data-by={by}
            disabled={!room[e][by > 0 ? 'out' : 'in']}
            aria-label={`${EDGE_NAME[e]}を1マス${by > 0 ? '広げる' : '狭める'}`}
            title={`${EDGE_NAME[e]}を1マス${by > 0 ? '広げる' : '狭める'}（Shift: 8マス）`}
            onpointerenter={(ev) => ev.pointerType === 'mouse' && (hover = { edge: e, by })}
            onpointerleave={() => (hover = null)}
            onclick={(ev) => onresize(e, ev.shiftKey ? by * 8 : by)}>{by > 0 ? '＋' : '−'}</button>
        {/each}
      </div>
    {/each}
  </div>
  {#if pending}
    {@const p = pending}
    <div class="blocked" data-resize-blocked>
      <p><Phrases text={`${EDGE_NAME[p.edge]}を${p.by > 0 ? '広げる' : '狭める'}には邪魔な物があります（${p.blocked.length}個）`} /><small>★は消せない物: 動かすのみ</small></p>
      <ul>
        {#each p.blocked as b (b.id)}
          <li><button type="button" data-blocker={b.id} class:stuck={p.stuck.includes(b.id)} aria-pressed={selected.has(b.id)} onclick={() => onshow(b.id)}>{b.fixed ? '★ ' : ''}{kindDef(b.k)?.ja ?? b.k}<small>{b.id}{p.stuck.includes(b.id) ? ' · 動かせない' : ''}</small></button></li>
        {/each}
      </ul>
      <div class="row">
        <button type="button" data-resize-move onclick={() => onresize(p.edge, p.by, true)}>動かす</button>
        <button type="button" onclick={oncancel}>キャンセル</button>
      </div>
    </div>
  {/if}
</section>

<style>
  .size { background: var(--c-card); border-radius: 12px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
  h2 { font-size: 15px; margin: 4px 0 0; }
  h2 small { color: var(--c-ink-soft); font-weight: 500; margin-left: 6px; }
  h2 small, .blocked small { font-size: 12px; }
  .row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
  .edges { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }
  .edge { display: flex; align-items: center; gap: 4px; }
  .ename { font-size: 13px; font-weight: 700; min-width: 3.2em; }
  .size .edge button { padding: 2px 10px; min-width: 34px; }
  .blocked { background: #fff8e2; border: 2px solid #d7a323; border-radius: 10px; padding: 6px 8px; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
  .blocked p { margin: 0; }
  .blocked p small { display: block; color: var(--c-ink-soft); }
  .blocked ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 3px; max-height: 180px; overflow-y: auto; }
  .blocked li button { width: 100%; text-align: left; font-weight: 600; display: flex; justify-content: space-between; gap: 6px; border-width: 1.5px; }
  .blocked li button small { color: var(--c-ink-soft); font-weight: 400; }
  .blocked li button.stuck { border-color: #d0533c; background: #fff0ec; }
  /* (a finger's: the kit's 44px hit) */
  @media (pointer: coarse) { .size .edge button { min-height: 44px; min-width: 52px; } }
</style>
