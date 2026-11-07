<script lang="ts">
  // One row of a game's review list (frame/ReviewList.svelte): the whole head a button (○ / × for each round it holds,
  // a face, the summary, 一発, ▾) and, opened, the detail under it: ▶︎ first (`hear`, under the line it plays), then the
  // game's text, the note and 解説 (`children`). Every game's review row is this one.
  import type { Snippet } from 'svelte';
  import type { HTMLLiAttributes } from 'svelte/elements';
  import FirstStamp from './FirstStamp.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { i, ok, open, ontoggle, marks, first = false, lead, summary, hear, children, ...rest }: {
    /** The row's key (`data-review`, `data-kiki-row`, `data-kiki-detail`). */
    i: number;
    ok: boolean;
    open: boolean;
    ontoggle: () => void;
    /** Each round's ○ / × when the row holds several (たちぎき's conversation): `data-kiki-round` on each. */
    marks?: { i: number; ok: boolean }[];
    /** 一発 on the head. */
    first?: boolean;
    lead?: Snippet;
    summary: Snippet;
    hear?: Snippet;
    children: Snippet;
  } & Omit<HTMLLiAttributes, 'children'> = $props();
</script>

{#snippet sym(ok: boolean, round?: number)}
  <span class="sym" class:ok data-kiki-round={round}><span aria-hidden="true">{ok ? '○' : '×'}</span><span class="sr-only">{ok ? t('kiki.right') : t('kiki.wrong')}</span></span>
{/snippet}

<li class="item card" data-review={i} data-ok={ok} data-open={open} {...rest}>
  <button type="button" class="head" aria-expanded={open} data-kiki-row={i} data-sfx="tick" onclick={ontoggle}>
    <span class="marks">{#if marks}{#each marks as m (m.i)}{@render sym(m.ok, m.i)}{/each}{:else}{@render sym(ok)}{/if}</span>
    {@render lead?.()}
    <span class="sum">{@render summary()}</span>
    {#if first}<FirstStamp sm />{/if}
    <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
  </button>
  {#if open}
    <div class="txt" data-kiki-detail={i}>
      {#if hear}<div class="hear">{@render hear()}</div>{/if}
      {@render children()}
    </div>
  {/if}
</li>

<style>
  .item { display: grid; gap: 8px; padding: 0; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; width: 100%;
    display: flex; align-items: flex-start; gap: 10px; padding: 12px 14px; min-height: var(--hit);
  }
  .marks, .chev { flex: none; }
  .marks { display: inline-flex; gap: 4px; }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .sum { flex: 1; min-width: 0; display: grid; gap: 2px; align-self: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text); }
  .chev { align-self: center; font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .txt { min-width: 0; display: grid; gap: 8px; padding: 0 14px 12px; }
  .hear { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
</style>
