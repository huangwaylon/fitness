<script lang="ts">
  // 3.1 Week list: newest first, one cream Nook Miles+ card per week. Each card: the week (今週 or dates), its ベル
  // (both, incl. the Sunday bonus once it landed), 収穫✓ / 🔒, and per person the villager, their ベル and 7 day stamps.
  import type { PersonId } from '#lib/types.ts';
  import type { HistoryWeek } from '#lib/model/history.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Glyph from './Glyph.svelte';
  
  import { t, formatBells, formatNum } from '#lib/i18n/index.ts';
  import { weekRange } from '#lib/i18n/format.ts';

  interface Props {
    weeks: HistoryWeek[];
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    onopen: (wk: string) => void;
  }
  let { weeks, order, names, villagers, onopen }: Props = $props();
</script>

{#if weeks.length === 0}
  <p class="empty">{t('kiroku.empty')}</p>
{/if}
<ul class="list">
  {#each weeks as w, i (w.weekKey)}
    <li style:animation-delay="{Math.min(i, 6) * 40}ms">
      <button type="button" class="card wk" class:cur={w.current} onclick={() => onopen(w.weekKey)}
        aria-label="{w.current ? t('kiroku.thisWeek') : t('kiroku.weekOf', { range: weekRange(w.weekKey) })} {formatBells(w.bells)}{w.locked ? ' ' + t('kiroku.locked') : ''}{w.harvested ? ' ' + t('kiroku.harvested') : ''}">
        <span class="head">
          <span class="when">{#if w.current}<b>{t('kiroku.thisWeek')}</b>{/if}<span class="range">{weekRange(w.weekKey)}</span></span>
          <span class="total money">{formatBells(w.bells)}</span>
          {#if w.locked}<Glyph kind="lock" size={16} label={t('kiroku.locked')} />{/if}
          {#if w.harvested}<span class="hv" title={t('kiroku.harvested')}><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg></span>{/if}
        </span>
        {#if i === 0}
          <!-- 月…日 over the first card's stamps (round 7 F15). -->
          <span class="who wdrow" aria-hidden="true">
            <span class="avsp"></span><span class="pb"></span>
            <span class="stamps">{#each [1, 2, 3, 4, 5, 6, 7] as d (d)}<span class="wdl">{t(`weekday.${d}`)}</span>{/each}</span>
          </span>
        {/if}
        {#each order as p (p)}
          <span class="who">
            <Avatar person={p} villager={villagers[p]} size={30} />
            <span class="sr-only">{names[p]} {formatBells(w.people[p].bells)}</span>
            <span class="pb money" aria-hidden="true">{formatNum(w.people[p].bells)}</span>
            <span class="stamps">
              {#each w.people[p].stamps as s, d (d)}<Glyph kind={s} size={18} />{/each}
            </span>
          </span>
        {/each}
      </button>
    </li>
  {/each}
</ul>

<style>
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 14px; }
  .list li { animation: if-pop var(--dur-pop) var(--ease-bounce) both; }
  .empty { text-align: center; color: var(--text-soft); font-weight: 700; }
  .wk {
    appearance: none; border: 0; width: 100%; text-align: left; font: inherit; cursor: pointer;
    display: grid; gap: 8px; padding: 12px 14px 12px; box-shadow: var(--sh-ctl);
  }
  .wk:active { transform: translateY(3px); box-shadow: var(--sh-ctl-press); }
  /* this week: the edge plus a yuzu inner ring */
  .wk.cur { box-shadow: inset 0 0 0 2px var(--edge), inset 0 0 0 6px var(--c-yuzu), 0 var(--lip-h) 0 var(--edge); }
  .head { display: flex; align-items: center; gap: 8px; min-height: 24px; }
  .when { flex: 1; min-width: 0; display: flex; align-items: baseline; gap: 8px; font-weight: 700; font-size: var(--fs-body); }
  .when b { font-size: var(--fs-body); }
  .range { color: var(--text-soft); font: 700 var(--fs-body)/1 var(--font-num); white-space: nowrap; }
  .total { font-size: var(--fs-talk); white-space: nowrap; }
  .hv { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink); }
  .hv svg { width: 14px; height: 14px; }
  .who { display: flex; align-items: center; gap: 10px; }
  .pb { width: 3.6em; flex: none; font-size: var(--fs-talk); text-align: right; }
  .stamps { flex: 1; display: flex; justify-content: space-between; max-width: 220px; }
  .wdrow { margin: -2px 0 -6px; }
  .avsp { width: 30px; flex: none; }
  .wdl { width: 18px; text-align: center; font-size: var(--fs-xs); font-weight: 700; color: var(--text-soft); }
  @media (max-width: 359px) {
    .wdl { width: 14px; }
    .stamps :global(svg) { width: 14px; height: 14px; }
    .pb { font-size: var(--fs-body); width: 3.4em; }
    .wk { padding: 10px 12px; }
  }
</style>
