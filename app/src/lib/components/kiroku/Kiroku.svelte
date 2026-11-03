<script lang="ts">
  // きろく (records, design.md "Kiroku"), the island panel's first tab: at its top the ベル ledger (this week by day,
  // then the past weeks) (the goals and the trends live in けんこう, the ずかん is the HUD menu's); a day
  // pushes a level (`level` = how deep, bindable: the panel shows its tabs only at 0 and its ‹ calls `back()`).
  // Read-only (Apple Health is the source of truth). The buys are on ごほうび.
  // Everything is computed from the store's reduced model, lazily for the opened day.
  import { tick } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import { bellsLedger, dayDetail } from '#lib/model/history.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import DayDetail from './DayDetail.svelte';
  import BellsLog from './BellsLog.svelte';
  import { t } from '#lib/i18n/index.ts';

  type Screen = { k: 'day'; date: string };

  let { level = $bindable(0) }: { level?: number } = $props();
  let stack = $state<Screen[]>([]);
  $effect(() => {
    level = stack.length;
  });
  let root: HTMLElement | undefined = $state();
  /** The scroll position of each level under the open one (parallel to `stack`), restored on ◀. */
  let saved: number[] = [];

  const m = $derived(week.model);
  const view = $derived(week.view);
  const me = $derived<PersonId>(view?.me ?? 'A');
  const partner = $derived<PersonId>(view?.partner ?? 'B');
  const order = $derived<PersonId[]>([me, partner]);
  const names = $derived({ A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B' } as Record<PersonId, string>);
  const villagers = $derived({ A: view?.people.A.villager ?? null, B: view?.people.B.villager ?? null } as Record<PersonId, string | null>);
  const top = $derived(stack.at(-1) ?? null);
  // One computation per screen and model (not per use).
  const money = $derived(m && !top ? bellsLedger(m.state, m.now) : null);
  const day = $derived(m && top?.k === 'day' ? dayDetail(m.state, top.date, m.now) : null);

  /** The element that scrolls きろく: the nearest scrolling ancestor (the panel's body). */
  function scroller(): HTMLElement | null {
    for (let el = root?.parentElement; el; el = el.parentElement) {
      const o = getComputedStyle(el).overflowY;
      if (o === 'auto' || o === 'scroll') return el;
      if (el.tagName === 'DIALOG') return el;
    }
    return null;
  }
  async function go(s: Screen) {
    const sc = scroller();
    saved = [...saved.slice(0, stack.length), sc?.scrollTop ?? 0];
    stack = [...stack, s];
    await tick();
    sc?.scrollTo({ top: 0 });
  }
  /** ‹: one level up, back where that list was scrolled to. False at the top. */
  export function back(): boolean {
    if (!stack.length) return false;
    stack = stack.slice(0, -1);
    const y = saved[stack.length] ?? 0;
    saved = saved.slice(0, stack.length);
    void tick().then(() => scroller()?.scrollTo({ top: y }));
    return true;
  }
</script>

<div class="kiroku" bind:this={root}>
  {#key stack.length}
  <div class="lvl">
  {#if m && view}
    {#if !top}
      {#if money}
        <h2 class="sec">{t('panel.bells')}</h2>
        <BellsLog ledger={money} {order} {names} {villagers} onday={(date) => go({ k: 'day', date })} />
      {/if}
    {:else if day}
      <DayDetail d={day} {me} {partner} {names} {villagers} />
    {/if}
  {/if}
  </div>
  {/key}
</div>

<style>
  .kiroku { padding-bottom: 8px; }
  /* the section headings: the same small soft label as the panel's other sections */
  .sec { margin: 6px 2px -4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .04em; }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .lvl { display: grid; gap: 12px; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
</style>
