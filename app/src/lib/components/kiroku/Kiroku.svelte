<script module lang="ts">
  export type KirokuEntry = { tab: 'body' | 'money'; week?: string };
</script>

<script lang="ts">
  // きろく (records) NookPhone app (design.md "Kiroku"): からだ | ベル pills, week cards → week → day → edit,
  // full screen inside the phone. ◀ (the phone's back) goes up one level: the phone calls `back()` first. Every edit
  // screen names whose data it changes (`p`): either person edits either person's data.
  // Everything is computed from the store's reduced model, lazily for the opened week/day; edits go through the
  // queue (held 5 s with とりけす) and recompute the island's ベル ribbon and the wallet at once. Loaded on first open
  // (ShimaPhone imports it dynamically).
  import { tick, untrack } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import { MOVE_GOAL } from '#lib/config/rules.ts';
  import { bellsLedger, dayDetail, historyWeeks, weekDetail, weekEdits } from '#lib/model/history.ts';
  import { METRIC_BOUNDS, MANUAL_WORKOUT_MIN } from '#lib/contract/api.ts';
  import { WORKOUT_TYPES } from '#lib/contract/labels.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { addWorkout, excludeWorkout, setGoalWeight, setMetric, setMoveGoal, setWeight, undoBanner as undoToast, undoSpend, EDIT_CUTOFF_MS } from '#lib/store/actions.ts';
  import { weightOn, weightTrend } from '#lib/model/weight.ts';
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
  import NumberPad from './NumberPad.svelte';
  import TypeName from './TypeName.svelte';
  import Avatar from '../characters/Avatar.svelte';
  import { dayTitle, parseKcalInput, parseKgInput, typeLabel } from './fmt.ts';
  import { t, formatBells, formatNum } from '#lib/i18n/index.ts';

  type Screen =
    | { k: 'week'; wk: string }
    | { k: 'day'; date: string }
    | { k: 'metric'; p: PersonId; date: string; metric: 'steps' | 'exercise_min' }
    | { k: 'workout'; p: PersonId; date: string; id: string }
    | { k: 'add'; p: PersonId; date: string }
    | { k: 'void'; id: string; label: string; bells: number }
    | { k: 'weight'; p: PersonId }
    | { k: 'weightIn'; p: PersonId; date: string }
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
  const wkDetail = $derived(m && top?.k === 'week' ? { d: weekDetail(m.state, top.wk, m.now), edits: weekEdits(m.state, top.wk) } : null);
  const today = $derived(m ? localDateAt(m.now) : '');
  // The weight trend: both people on the からだ list, one on its own screen.
  const trends = $derived(m && ((!top && tab === 'body') || top?.k === 'weight')
    ? { A: weightTrend(m.state, 'A', m.now), B: weightTrend(m.state, 'B', m.now) } : null);
  const dayDate = $derived(top && 'date' in top && top.k !== 'weightIn' ? top.date : null);
  const day = $derived(m && dayDate ? dayDetail(m.state, dayDate, m.now) : null);
  /** Edit controls close a little before the lock, so an edit made now still lands in time. */
  const canEdit = $derived(!!day && !!m && day.open && !day.future && m.now < day.lockAt - EDIT_CUTOFF_MS);

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

  /** After けってい: focus back on the ✎ that opened the edit, else on the phone. */
  async function refocus(key: string) {
    await tick();
    const el = root?.querySelector<HTMLElement>(`[data-focus="${CSS.escape(key)}"]`);
    if (el) el.focus();
    else root?.closest('dialog')?.focus();
  }

  /** 「歩数を なおしました」, or 「うめの 歩数を なおしました」 for the partner's. */
  const savedText = (p: PersonId, field: string) => (p === me ? t('kiroku.saved', { field }) : t('kiroku.savedFor', { name: names[p], field }));
  function saveMetric(p: PersonId, date: string, metric: 'steps' | 'exercise_min', value: number) {
    back();
    void refocus(`${p}:${metric}`);
    undoToast(savedText(p, t(`kiroku.field.${metric}`)), setMetric(p, date, metric, value));
  }
  function workoutChange(p: PersonId, id: string, date: string, label: string, excluded: boolean) {
    back();
    void refocus(`${p}:w:${id}`);
    undoToast(p === me ? t('kiroku.savedWorkout', { label }) : savedText(p, label), excludeWorkout(p, id, date, excluded));
  }
  /** なかったことに asks first (an NH choice list), then voids with もとに戻す on the banner. */
  function askVoid(id: string, label: string, bells: number) {
    void go({ k: 'void', id, label, bells });
  }
  function voidIt(id: string, label: string) {
    back();
    undoToast(t('kiroku.spendVoided', { label }), undoSpend(id));
  }

  function saveWeight(p: PersonId, date: string, kg: number) {
    back();
    void refocus(date === today ? 'weight-log' : `wfix:${date}`);
    undoToast(p === me ? t('weight.saved') : savedText(p, t('kiroku.field.weight')), setWeight(p, date, kg));
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

  // Add a workout: pick a type, then the minutes on the keypad.
  let addType = $state<string | null>(null);
  function saveAdd(p: PersonId, date: string, min: number) {
    const type = addType!;
    addType = null;
    back();
    void refocus(`${p}:add`);
    const label = typeLabel(type);
    undoToast(t('kiroku.added', { label: p === me ? label : `${names[p]} ${label}` }), addWorkout(p, date, type, min));
  }
</script>

<!-- Every edit screen opens with whose data it changes (either person edits either person's data). -->
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
      <WeekDetail d={wkDetail.d} edits={wkDetail.edits} {order} {names} {villagers}
        onday={(date) => go({ k: 'day', date })} now={m.now} />
    {:else if top.k === 'day' && day}
      {@const date = top.date}
      <DayDetail d={day} editable={canEdit} {me} {partner} {names} {villagers} now={m.now}
        onmetric={(p, metric) => go({ k: 'metric', p, date, metric })} onworkout={(p, id) => go({ k: 'workout', p, date, id })}
        onadd={(p) => { addType = null; go({ k: 'add', p, date }); }} />
    {:else if top.k === 'weight' && trends}
      {@const p = top.p}
      <WeightDetail w={trends[p]} person={p} name={names[p]} villager={villagers[p]} mine={p === me} {today}
        onlog={(date) => go({ k: 'weightIn', p, date })} />
    {:else if top.k === 'weightIn'}
      {@const s = top}
      {@render who(s.p)}
      <ValueInput label={t('kiroku.field.weight')} sub={dayTitle(s.date)} old={weightOn(m.state, s.p, s.date, m.now)} unit="kg"
        parse={parseKgInput} hint={t('weight.range')} onok={(kg) => saveWeight(s.p, s.date, kg)} oncancel={back} />
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
    {:else if top.k === 'metric' && day}
      {@const s = top}
      {@render who(s.p)}
      {@const d = day.people[s.p]}
      <NumberPad label={t(`kiroku.field.${s.metric}`)} sub={dayTitle(s.date)} max={METRIC_BOUNDS[s.metric]}
        old={s.metric === 'steps' ? d.steps.value : d.exercise.watch} unit={s.metric === 'steps' ? '' : t('kiroku.min', { n: '' }).trim()}
        onok={(v) => saveMetric(s.p, s.date, s.metric, v)} oncancel={back} />
    {:else if top.k === 'workout' && day}
      {@const s = top}
      {@const w = day.people[s.p].workouts.find((x) => x.id === s.id)}
      {#if w}
        {@const label = typeLabel(w.type)}
        {@render who(s.p)}
        <section class="card wcard">
          <b><TypeName type={w.type} /></b><span class="money">{dayTitle(s.date)} · {t('kiroku.min', { n: w.durationMin })}</span>
          {#if w.excluded}<em>{t('kiroku.excluded')}</em>{/if}
        </section>
        <div class="wchoices">
          <ChoiceList choices={[
            w.excluded ? { label: t('kiroku.include'), run: () => workoutChange(s.p, s.id, s.date, label, false) }
              : { label: t('kiroku.exclude'), run: () => workoutChange(s.p, s.id, s.date, label, true) },
            { label: t('kiroku.cancel'), run: back, cancel: true }
          ]} />
        </div>
      {/if}
    {:else if top.k === 'add'}
      {@const s = top}
      {@render who(s.p)}
      {#if !addType}
        <h3 class="addh"><span class="nw">{t('kiroku.addWorkout')}</span> <span class="money">{dayTitle(s.date)}</span></h3>
        <p class="note">{t('kiroku.addNote')}</p>
        <div class="types" role="group" aria-label={t('kiroku.pickType')}>
          {#each WORKOUT_TYPES as ty (ty)}
            <button type="button" class="type" data-sfx="page" onclick={() => (addType = ty)}><TypeName type={ty} /></button>
          {/each}
        </div>
      {:else}
        <NumberPad label={typeLabel(addType)} sub={dayTitle(s.date)} old={null} min={MANUAL_WORKOUT_MIN.min} max={MANUAL_WORKOUT_MIN.max} unit={t('kiroku.min', { n: '' }).trim()}
          onok={(v) => saveAdd(s.p, s.date, v)} oncancel={() => (addType = null)} />
      {/if}
    {/if}
  {/if}
  </div>
  {/key}
</div>

<style>
  .kiroku { padding-bottom: 8px; }
  /* the keypad fills the phone so its keys sit at the bottom, in the thumb zone (ShimaPhone stretches this root;
     without this link in the chain the keys hang under the title with empty space below them) */
  .kiroku:has(:global(.atm)) { display: flex; flex-direction: column; }
  .kiroku:has(:global(.atm)) > .lvl { flex: 1 0 auto; grid-template-rows: auto 1fr; }
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
  .wcard { display: grid; gap: 6px; justify-items: start; }
  .wcard b { font-size: var(--fs-talk); }
  .wcard .money { font-size: var(--fs-body); color: var(--text-soft); }
  em { font-style: normal; font-size: var(--fs-s); font-weight: 700; padding: 3px 8px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 45%, transparent); }
  .wchoices { display: flex; justify-content: flex-end; padding-top: 8px; }
  .addh { margin: 0 2px; font-size: var(--fs-talk); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
  .addh .nw { white-space: nowrap; }
  .addh .money { font-size: var(--fs-body); color: var(--text-soft); }
  .note { margin: -6px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .ask { padding: 16px; display: grid; gap: 6px; }
  .ask small { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .ask p { margin: 0; font-size: var(--fs-talk); font-weight: 700; line-height: 1.4; }
  /* minmax(0, 1fr): the longest label (高強度インターバルトレーニング) must not set a column's minimum */
  .types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .type {
    appearance: none; border: 0; cursor: pointer; min-width: 0; overflow-wrap: anywhere; min-height: 52px; padding: 6px 10px; border-radius: var(--r-btn);
    font: 700 var(--fs-body)/1.25 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .type:active { transform: translateY(3px); box-shadow: var(--sh-ctl-press); }
</style>
