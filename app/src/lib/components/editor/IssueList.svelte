<script lang="ts">
  // The editor's checks (layout/validate.ts, live), and with `?check` what the phones' 3D island leaves undrawn
  // (world3d/drawCheck.ts) and the river's turns as the 3D island draws them. A line picks its pieces and shows its tile.
  import { labelOf } from '#lib/layout/labels.ts';
  import { GRID, TILE } from '#lib/layout/grid.ts';
  import type { Issue } from '#lib/layout/validate.ts';
  import type { Stem } from '#lib/layout/river.ts';
  import type { Undrawn } from '../world3d/drawCheck.ts';

  interface Props {
    issues: Issue[];
    focus: Issue | null;
    onshow(is: Issue): void;
    /** `?check`'s: null while it works, else the list (undefined: off). */
    undrawn?: Undrawn[] | null;
    stems?: Stem[];
    onpick(id: string): void;
  }
  let { issues, focus, onshow, undrawn, stems = [], onpick }: Props = $props();
  const errors = $derived(issues.filter((i) => i.level === 'error').length);
  const warns = $derived(issues.length - errors);
  const WHY: Record<string, string> = {
    'unknown-kind': '不明な種類（unknown kind: nothing drawn）',
    card: '絵のカード（a card of 2D art, not a model）',
    'no-model': '何も描かれない（no model at all）',
    'model-missing': 'モデルのファイルがない（model file missing）'
  };
  const tile = (x: number, z: number) => `${Math.floor((x - GRID.x0) / TILE)}, ${Math.floor((z - GRID.z0) / TILE)}`;
</script>

<section class="issues" data-issues>
  <h2>チェック {#if errors}<span class="bad">{errors}</span>{:else if warns}<span class="warn-n" data-warns={warns}>注意 {warns}</span>{:else}<span class="good">OK</span>{/if}</h2>
  <ul>
    {#each issues as is, i (i)}
      <li><button type="button" class={is.level} aria-pressed={focus === is} onclick={() => onshow(is)}>{is.ja}</button></li>
    {/each}
  </ul>
</section>
{#if undrawn !== undefined}
  <section class="issues" data-draw-check>
    <h2>3Dのチェック {#if undrawn === null}…{:else if undrawn.length}<span class="bad">{undrawn.length}</span>{:else}<span class="good">OK</span>{/if}</h2>
    <ul>
      {#each undrawn ?? [] as u (u.id + u.why)}
        <li><button type="button" class="error" onclick={() => onpick(u.id)}>{u.id}（{labelOf(u.k)}）{u.x}, {u.z}<small>{WHY[u.why]}{u.detail ? `: ${u.detail}` : ''} · {u.seasons.join(' ')}</small></button></li>
      {/each}
    </ul>
    <h3>川のカーブ <small>(the river's turns, drawn on the plan in orange)</small></h3>
    <ul data-river-arcs>
      {#each stems as s, i (i)}
        {#each s.arcs as a, j (j)}
          <li class="arc">R {(a.r / TILE).toFixed(1)}マス · {Math.round(a.deg)}°<small>マス {tile(a.x0, a.z0)} → {tile(a.x1, a.z1)}</small></li>
        {:else}
          <li class="arc"><small>まっすぐ (no turns)</small></li>
        {/each}
      {/each}
    </ul>
  </section>
{/if}

<style>
  .issues { background: var(--c-card); border-radius: 12px; padding: 8px 10px; display: flex; flex-direction: column; gap: 6px; }
  h2 { font-size: 15px; margin: 4px 0 0; }
  h3 small { color: var(--c-ink-soft); font-weight: 500; margin-left: 6px; }
  small { font-size: 12px; }
  ul { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; max-height: 240px; overflow-y: auto; }
  li button { width: 100%; text-align: left; font-weight: 500; display: flex; flex-direction: column; gap: 1px; border-width: 1.5px; }
  li button small { color: var(--c-ink-soft); }
  h3 { font-size: 13px; margin: 8px 0 4px; }
  li.arc { display: flex; flex-direction: column; font-size: 13px; color: #a34a00; font-weight: 600; }
  li.arc small { color: var(--c-ink-soft); font-weight: 400; }
  .issues .error { border-color: #d0533c; background: #fff0ec; }
  .issues .warn { border-color: #d7a323; background: #fff8e2; }
  .bad, .warn-n, .good { border-radius: 999px; padding: 0 8px; font-size: 12px; }
  .bad { background: #e2553d; color: #fff; }
  .warn-n { background: #d7a323; color: #2c2218; }
  .good { background: var(--c-leaf); color: #fff; }
</style>
