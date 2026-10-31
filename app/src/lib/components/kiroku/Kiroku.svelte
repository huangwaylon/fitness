<script lang="ts">
  // きろく (records, design.md "Kiroku"), the island panel's first tab: at its top the ベル ledger (this week by day,
  // then the past weeks) and then 目標 (the Move and weight goals; the weight trend lives in けんこう);
  // a day, a goal or a buy's とりけす push a level (`level` = how deep, bindable:
  // the panel shows its tabs only at 0 and its ‹ calls `back()`). Read-only (Apple Health is the source of
  // truth): the only inputs are the two goals (either person's: the goal screen names whose) and とりけす on a buy (either of us, any buy).
  // Everything is computed from the store's reduced model, lazily for the opened day.
  import { tick } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import { MOVE_GOAL } from '#lib/config/rules.ts';
  import { bellsLedger, dayDetail } from '#lib/model/history.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { setGoalWeight, setMoveGoal, undoBanner, undoSpend } from '#lib/store/actions.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import ChoiceList from '../ui/ChoiceList.svelte';
  import DayDetail from './DayDetail.svelte';
  import BellsLog from './BellsLog.svelte';
  import ValueInput from './ValueInput.svelte';
  import GoalCard from './GoalCard.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import { parseKcalInput, parseKgInput } from './fmt.ts';
  import { t, formatBells, formatNum } from '#lib/i18n/index.ts';

  type Screen =
    | { k: 'day'; date: string }
    | { k: 'void'; id: string; label: string; bells: number }
    | { k: 'goal'; p: PersonId }
    | { k: 'moveGoal'; p: PersonId };

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
  /** Whose goals the 目標 card shows (null: mine). */
  let goalPick = $state<PersonId | null>(null);
  const goalP = $derived<PersonId>(goalPick ?? me);
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

  /** After けってい: focus back on the goal's ✎, else on the panel. */
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
      {#if money}
        <h2 class="sec">{t('panel.bells')}</h2>
        <BellsLog ledger={money} {order} {names} {villagers} onvoid={askVoid} onday={(date) => go({ k: 'day', date })} />
      {/if}
      <GoalCard person={goalP} {order} {names} {villagers} moveGoal={view.people[goalP].moveGoal} goalWeight={m.state.prefs[goalP].goalWeight ?? null}
        onperson={(p) => (goalPick = p)} onmove={() => go({ k: 'moveGoal', p: goalP })} onweight={() => go({ k: 'goal', p: goalP })} />
    {:else if top.k === 'day' && day}
      <DayDetail d={day} {me} {partner} {names} {villagers} />
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
  /* the section headings: the same small soft label as the panel's other sections */
  .sec { margin: 6px 2px -4px; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); letter-spacing: .04em; }
  .who { display: flex; align-items: center; gap: 8px; margin: 0 2px; font-size: var(--fs-body); }
  .who small { color: var(--text-soft); font-size: var(--fs-s); font-weight: 700; }
  /* each level slides in from the right (design.md "Navigation": one push motion, 240ms) */
  .lvl { display: grid; gap: 12px; animation: lvl 240ms cubic-bezier(.2, .8, .2, 1); }
  @keyframes lvl { from { opacity: 0; transform: translateX(24%); } to { opacity: 1; transform: none; } }
  @media (prefers-reduced-motion: reduce) { .lvl { animation: none; } }
  .wchoices { display: flex; justify-content: flex-end; padding-top: 8px; }
  .ask { padding: 16px; display: grid; gap: 6px; }
  .ask small { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .ask p { margin: 0; font-size: var(--fs-talk); font-weight: 700; line-height: 1.4; }
</style>
