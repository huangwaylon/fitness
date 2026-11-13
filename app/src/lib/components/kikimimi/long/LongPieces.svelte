<script lang="ts">
  // まるごと 聞く's page section (mode/ModeDetail.svelte, its own chunk; docs/kikimimi.md "まるごと 聞く"): the pieces at the
  // place, each with its kind (本物の録音 / 会話劇) and how I did when I last heard it, the piece of the day marked
  // (games/long/def.ts pieceFor: a new one first, then one I missed a week ago). A tap plays that one instead (its
  // lobby's option, till 「今日の会話に戻す」 or the sheet closes). Mine alone.
  import { INDEX, listenOf, load, type Unit } from '#lib/kikimimi/pool.ts';
  import { piecesAt } from '#lib/kikimimi/games/long/def.ts';
  import { currentLong, pickLong } from '../progress.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import '#lib/i18n/kiki-long.ts';

  let { lv, onpick }: { lv: number; onpick: () => void } = $props();
  const h = $derived(currentLong(lv));
  const units = Object.keys(INDEX.listen).filter((u) => INDEX.listen[u][0] === 'long' && INDEX.listen[u][2] === 'listened');
  let names = $state<Map<string, { name: string; real: boolean }>>(new Map());
  $effect(() => {
    void load(...(units as Unit[])).then(() => {
      names = new Map(piecesAt(units.flatMap((u) => listenOf(u) ?? [])).map((p) => [p.id, { name: p.name, real: p.source === 'real' }]));
    }, () => {}); // (offline: the section stays hidden)
  });
  function pick(k: number | null) {
    pickLong(k === null ? null : h.ids[k]);
    onpick();
  }
</script>

{#if h.ids.length && names.size}
<section class="pieces card" aria-labelledby="kk-long" data-kiki-long-pieces>
  <h3 id="kk-long" class="sec-label">{t('kiki.long.pieces')}</h3>
  {#if h.picked}
    <p class="picked"><button type="button" class="btn small paper" data-kiki-long-today-back data-sfx="back" onclick={() => pick(null)}>{t('kiki.long.backToday')}</button></p>
  {/if}
  <ol class="list">
    {#each h.ids as id, k (id)}
      {@const p = names.get(id)}
      {@const heard = h.heard.get(id)}
      <li>
        <button type="button" class="row tile-btn" data-kiki-long-piece={id} aria-pressed={h.piece === k} data-sfx="tick" onclick={() => pick(k === h.today ? null : k)}>
          <span class="name"><b>{p?.name ?? id}</b><small>{t(p?.real ? 'kiki.long.real' : 'kiki.long.drama')}</small></span>
          <span class="tags">
            {#if k === h.today}<span class="tag today">{t('kiki.long.todayTag')}</span>{/if}
            <span class="tag" data-kiki-long-heard>{heard ? `${heard.right} / ${heard.of}` : t('kiki.long.new')}</span>
          </span>
        </button>
      </li>
    {/each}
  </ol>
</section>
{/if}

<style>
  .pieces { display: grid; gap: 8px; padding: 12px 14px; }
  .sec-label { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .picked { margin: 0; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .row { width: 100%; min-height: var(--hit); padding: 8px 12px; border-radius: 14px; display: flex; align-items: center; gap: 10px; text-align: left; }
  .row[aria-pressed='true'] { box-shadow: inset 0 0 0 3px var(--c-leaf); }
  .name { flex: 1; min-width: 0; display: grid; gap: 1px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .name small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .tags { display: flex; gap: 4px; flex: none; }
  .tag.today { background: var(--c-yuzu); color: var(--c-ink); }
</style>
