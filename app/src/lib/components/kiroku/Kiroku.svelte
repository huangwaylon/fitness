<script module lang="ts">
  export type KirokuEntry = { tab: 'body' | 'money'; week?: string };
</script>

<script lang="ts">
  // きろく (records) NookPhone app (design.md "Kiroku"): からだ | ベル pills, week cards → week → day, read-only
  // (Apple Health is the source of truth), full screen inside the phone. ◀ (the phone's back) goes up one level: the
  // phone calls `back()` first. The only inputs are the two goals (either person's: the goal screen names whose) and
  // とりけす on my buys. Everything is computed from the store's reduced model, lazily for the opened week/day. Loaded
  // on first open (ShimaPhone imports it dynamically).
  import { tick, untrack } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import { MOVE_GOAL } from '#lib/config/rules.ts';
  import { bellsLedger, dayDetail, historyWeeks, weekDetail } from '#lib/model/history.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { setGoalWeight, setMoveGoal, undoBanner, undoSpend } from '#lib/store/actions.ts';
  import { weightTrend } from '#lib/model/weight.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import ChoiceList from '../ui/ChoiceList.svelte';
  import WeekList from './WeekList.svelte';
  import WeekDetail from './WeekDetail.svelte';
  import DayDetail from './DayDetail.svelte';
  import BellsLog from './BellsLog.svelte';
  import WeightCard from './WeightCard.svelte';
  import WeightDetail from './WeightDetail.svelte';
  import ValueInput from './ValueInput.svelte';
  import GoalCard from './GoalCard.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import { parseKcalInput, parseKgInput } from './fmt.ts';
  import { t, formatBells, formatNum } from '#lib/i18n/index.ts';

  type Screen =
    | { k: 'week'; wk: string }
    | { k: 'day'; date: string }
    | { k: 'void'; id: string; label: string; bells: number }
    | { k: 'weight'; p: PersonId }
    | { k: 'goal'; p: PersonId }
    | { k: 'moveGoal'; p: PersonId };

  let { entry = null }: { entry?: KirokuEntry | null } = $props();
  let tab = $state<'body' | 'money'>('body');
  let stack = $state<Screen[]>([]);
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
  /** Whose goals the 目標 card shows (null: mine). */
  let goalPick = $state<PersonId | null>(null);
  const goalP = $derived<PersonId>(goalPick ?? me);
  // One computation per screen and model (not per use).
  const weeks = $derived(m && !top && tab === 'body' ? historyWeeks(m.state, m.now) : null);
  const money = $derived(m && !top && tab === 'money' ? bellsLedger(m.state, m.now) : null);
  const wkDetail = $derived(m && top?.k === 'week' ? weekDetail(m.state, top.wk, m.now) : null);
  const today = $derived(m ? localDateAt(m.now) : '');
  // The weight trend: both people on the からだ list, one on its own screen.
  const trends = $derived(m && ((!top && tab === 'body') || top?.k === 'weight')
    ? { A: weightTrend(m.state, 'A', m.now), B: weightTrend(m.state, 'B', m.now) } : null);
  const day = $derived(m && top?.k === 'day' ? dayDetail(m.state, top.date, m.now) : null);

  // Apply an entry (ribbon → this week, jar total → the ベル tab) each time one arrives.
  $effect(() => {
    const e = entry;
    if (!e) return;
    untrack(() => {
      tab = e.tab;
      stack = e.week ? [{ k: 'week', wk: e.week === 'current' ? (view?.weekKey ?? '') : e.week }] : [];
      saved = stack.map(() => 0);
    });
  });

  /** The element that scrolls きろく: the nearest scrolling ancestor (the phone's app body or the dialog itself). */
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
  /** ◀: one level up, back where that list was scrolled to. False at the top (the phone goes back to its home screen). */
  export function back(): boolean {
    if (!stack.length) return false;
    stack = stack.slice(0, -1);
    const y = saved[stack.length] ?? 0;
    saved = saved.slice(0, stack.length);
    void tick().then(() => scroller()?.scrollTo({ top: y }));
    return true;
  }

  /** After けってい: focus back on the goal's ✎, else on the phone. */
  async function refocus(key: string) {
    await tick();
    const el = root?.querySelector<HTMLElement>(`[data-focus="${CSS.escape(key)}"]`);
    if (el) el.focus();
    else root?.closest('dialog')?.focus();
  }

  /** なかったことに asks first (an NH choice list), then voids with もとに戻す on the banner. */
  function askVoid(id: string, label: string, bells: number) {
    void go({ k: 'void', id, label, bells });
  }
  function voidIt(id: string, label: string) {
    back();
    undoBanner(t('kiroku.spendVoided', { label }), undoSpend(id));
  }
  function saveGoal(p: PersonId, kg: number | null) {
    back();
    void refocus('weight-goal');
    if (setGoalWeight(p, kg).ok) toasts.show(t(kg === null ? 'weight.goalCleared' : 'weight.goalSaved'), 2500, { reaction: 'pleased' });
  }
  function saveMoveGoal(p: PersonId, kcal: number) {
    back();
    void refocus('move-goal');
    if (setMoveGoal(p, kcal).ok) toasts.show(t('goal.moveSaved'), 2500, { reaction: 'pleased' });
  }
</script>

<!-- A goal screen opens with whose goal it sets (either person sets either person's). -->
{#snippet who(p: PersonId)}
  <p class="who"><Avatar person={p} villager={villagers[p]} size={32} /><b>{names[p]}</b>{#if p === me}<small>· {t('kiroku.me')}</small>{/if}</p>
{/snippet}

<div class="kiroku" bind:this={root}>
  {#key stack.length}
  <div class="lvl">
  {#if m && view}
    {#if !top}
      <!-- A segmented switch (toggle buttons), not tabs: there is no tab panel to move to. -->
      <div class="pills" role="group" aria-label={t('phone.app.kiroku')}>
        {#each ['body', 'money'] as const as id (id)}
          <button type="button" class="pill" aria-pressed={tab === id} data-sfx={tab === id ? 'none' : 'tick'} onclick={() => (tab = id)}>{t(`kiroku.tab.${id}`)}</button>
        {/each}
      </div>
      {#if weeks && trends}
        <WeightCard {trends} {order} {names} {villagers} {today} onopen={(p) => go({ k: 'weight', p })} />
        <GoalCard person={goalP} {order} {names} {villagers} moveGoal={view.people[goalP].moveGoal} goalWeight={m.state.prefs[goalP].goalWeight ?? null}
          onperson={(p) => (goalPick = p)} onmove={() => go({ k: 'moveGoal', p: goalP })} onweight={() => go({ k: 'goal', p: goalP })} />
      {/if}
      {#if weeks}
        <WeekList {weeks} {order} {names} {villagers} onopen={(wk) => go({ k: 'week', wk })} />
      {:else if money}
        <BellsLog ledger={money} {me} {order} {names} {villagers} onvoid={askVoid} onday={(date) => go({ k: 'day', date })} />
      {/if}
    {:else if top.k === 'week' && wkDetail}
      <WeekDetail d={wkDetail} {order} {names} {villagers} onday={(date) => go({ k: 'day', date })} />
    {:else if top.k === 'day' && day}
      <DayDetail d={day} {me} {partner} {names} {villagers} />
    {:else if top.k === 'weight' && trends}
      {@const p = top.p}
      <WeightDetail w={trends[p]} person={p} name={names[p]} villager={villagers[p]} mine={p === me} {today} />
    {:else if top.k === 'goal'}
      {@const s = top}
      {@render who(s.p)}
      {@const goal = m.state.prefs[s.p].goalWeight ?? null}
      <ValueInput label={t('weight.goalWeight')} sub="" old={goal} unit="kg" parse={parseKgInput} hint={t('weight.range')}
        onok={(kg) => saveGoal(s.p, kg)} oncancel={back} extra={goal === null ? null : { label: t('weight.clearGoal'), run: () => saveGoal(s.p, null) }} />
    {:else if top.k === 'moveGoal'}
      {@const s = top}
      {@render who(s.p)}
      <ValueInput label={t('goal.move')} sub={t('goal.moveNote')} old={view.people[s.p].moveGoal} unit="kcal" parse={parseKcalInput}
        hint={t('goal.moveRange', { min: MOVE_GOAL.min, max: formatNum(MOVE_GOAL.max) })} onok={(kcal) => saveMoveGoal(s.p, kcal)} oncancel={back} />
    {:else if top.k === 'void'}
      {@const s = top}
      <section class="card ask">
        <p>{t('kiroku.voidAsk', { label: s.label, bells: formatBells(s.bells) })}</p>
        <small>{t('kiroku.voidRefund')}</small>
      </section>
      <div class="wchoices">
        <ChoiceList choices={[
          { label: t('kiroku.voidYes'), run: () => voidIt(s.id, s.label) },
          { label: t('kiroku.cancel'), run: back, cancel: true }
        ]} />
      </div>
    {/if}
  {/if}
  </div>
  {/key}
</div>

<style>
  .kiroku { padding-bottom: 8px; }
  .who { display: flex; align-items: center; gap: 8px; margin: 0 2px; font-size: var(--fs-body); }
  .who small { color: var(--text-soft); font-size: var(--fs-s); font-weight: 700; }
  /* each level slides in like a phone app (design.md "Navigation": one push motion, 240ms) */
  .lvl { display: grid; gap: 12px; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
  .pills { display: flex; gap: 8px; justify-content: center; margin: -4px 0 4px; }
  .pill {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); min-width: 104px; padding: 0 18px; border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .pill[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .wchoices { display: flex; justify-content: flex-end; padding-top: 8px; }
  .ask { padding: 16px; display: grid; gap: 6px; }
  .ask small { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .ask p { margin: 0; font-size: var(--fs-talk); font-weight: 700; line-height: 1.4; }
</style>
