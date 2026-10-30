<script module lang="ts">
  export type KirokuEntry = { tab: 'body' | 'money'; week?: string };
</script>

<script lang="ts">
  // きろく (records) NookPhone app (history-and-editing.md): からだ | ベル pills, week cards → week → day → edit,
  // full screen inside the phone. ◀ (the phone's back) goes up one level: the phone calls `back()` first.
  // Everything is computed from the store's reduced model, lazily for the opened week/day; edits go through the
  // queue (held 5 s with とりけす) and recompute the island's ベル ribbon and the wallet at once. Loaded on first open
  // (ShimaPhone imports it dynamically, round 7 L1).
  import { tick, untrack } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import { MOVE_GOAL } from '#lib/config/rules.ts';
  import { bellsLedger, dayDetail, historyWeeks, weekDetail, weekEdits } from '#lib/model/history.ts';
  import { METRIC_BOUNDS, MANUAL_WORKOUT_MIN } from '#lib/contract/api.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { addWorkout, editWorkout, setGoalWeight, setMetric, setMoveGoal, setWeight, undoBanner as undoToast, undoSpend, EDIT_CUTOFF_MS } from '#lib/store/actions.ts';
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
  import { dayTitle, parseKcalInput, parseKgInput, typeLabel } from './fmt.ts';
  import { t, formatBells, formatNum } from '#lib/i18n/index.ts';

  type Screen =
    | { k: 'week'; wk: string }
    | { k: 'day'; date: string }
    | { k: 'metric'; date: string; metric: 'steps' | 'exercise_min' }
    | { k: 'workout'; date: string; id: string }
    | { k: 'add'; date: string }
    | { k: 'void'; id: string; label: string; bells: number }
    | { k: 'weight'; p: PersonId }
    | { k: 'weightIn'; date: string }
    | { k: 'goal' }
    | { k: 'moveGoal' };

  let { entry = null }: { entry?: KirokuEntry | null } = $props();
  let tab = $state<'body' | 'money'>('body');
  let stack = $state<Screen[]>([]);
  let root: HTMLElement | undefined = $state();
  /** The scroll position of each level under the open one (parallel to `stack`), restored on ◀ (scroll audit L1). */
  let saved: number[] = [];

  const m = $derived(week.model);
  const view = $derived(week.view);
  const me = $derived<PersonId>(view?.me ?? 'A');
  const partner = $derived<PersonId>(view?.partner ?? 'B');
  const order = $derived<PersonId[]>([me, partner]);
  const names = $derived({ A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B' } as Record<PersonId, string>);
  const villagers = $derived({ A: view?.people.A.villager ?? null, B: view?.people.B.villager ?? null } as Record<PersonId, string | null>);
  const top = $derived(stack.at(-1) ?? null);
  // One computation per screen and model (not per use; round 7 L5).
  const weeks = $derived(m && !top && tab === 'body' ? historyWeeks(m.state, m.now) : null);
  const money = $derived(m && !top && tab === 'money' ? bellsLedger(m.state, m.now) : null);
  const wkDetail = $derived(m && top?.k === 'week' ? { d: weekDetail(m.state, top.wk, m.now), edits: weekEdits(m.state, top.wk) } : null);
  const today = $derived(m ? localDateAt(m.now) : '');
  // The weight trend (ADR 0020): both people on the からだ list, one on its own screen.
  const trends = $derived(m && ((!top && tab === 'body') || top?.k === 'weight')
    ? { A: weightTrend(m.state, 'A', m.now), B: weightTrend(m.state, 'B', m.now) } : null);
  const dayDate = $derived(top && 'date' in top && top.k !== 'weightIn' ? top.date : null);
  const day = $derived(m && dayDate ? dayDetail(m.state, dayDate, m.now) : null);
  /** Edit controls close a little before the lock, so an edit made now still lands in time (M1). */
  const canEdit = $derived(!!day && !!m && day.open && !day.future && m.now < day.lockAt - EDIT_CUTOFF_MS);

  // Apply an entry (ribbon → this week, jar total → お金) each time one arrives.
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

  /** After けってい: focus back on the ✎ that opened the edit (round 7 F4), else on the phone. */
  async function refocus(key: string) {
    await tick();
    const el = root?.querySelector<HTMLElement>(`[data-focus="${CSS.escape(key)}"]`);
    if (el) el.focus();
    else root?.closest('dialog')?.focus();
  }

  function saveMetric(date: string, metric: 'steps' | 'exercise_min', value: number) {
    back();
    void refocus(metric);
    undoToast(t('kiroku.saved', { field: t(`kiroku.field.${metric}`) }), setMetric(date, metric, value));
  }
  function workoutChange(id: string, date: string, label: string, change: { strength?: boolean | null; excluded?: boolean }) {
    back();
    void refocus(`w:${id}`);
    undoToast(t('kiroku.savedWorkout', { label }), editWorkout(id, date, change));
  }
  /** なかったことに asks first (an NH choice list), then voids with もとに戻す on the banner (round 7 F7). */
  function askVoid(id: string, label: string, bells: number) {
    void go({ k: 'void', id, label, bells });
  }
  function voidIt(id: string, label: string) {
    back();
    undoToast(t('kiroku.spendVoided', { label }), undoSpend(id));
  }

  function saveWeight(date: string, kg: number) {
    back();
    void refocus(date === today ? 'weight-log' : `wfix:${date}`);
    undoToast(t('weight.saved'), setWeight(date, kg));
  }
  function saveGoal(kg: number | null) {
    back();
    void refocus('weight-goal');
    if (setGoalWeight(kg).ok) toasts.show(t(kg === null ? 'weight.goalCleared' : 'weight.goalSaved'), 2500, { reaction: 'pleased' });
  }
  function saveMoveGoal(kcal: number) {
    back();
    void refocus('move-goal');
    if (setMoveGoal(kcal).ok) toasts.show(t('goal.moveSaved'), 2500, { reaction: 'pleased' });
  }

  // Add a workout: pick a type, then the minutes on the keypad.
  const ADD_TYPES = ['Traditional Strength Training', 'Pilates', 'Yoga', 'Outdoor Walk', 'Outdoor Run', 'Cycling', 'Swimming', 'Dance', 'High Intensity Interval Training'];
  let addType = $state<string | null>(null);
  function saveAdd(date: string, min: number) {
    const type = addType!;
    addType = null;
    back();
    void refocus('add');
    undoToast(t('kiroku.added', { label: typeLabel(type) }), addWorkout(date, type, min));
  }
</script>

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
        <GoalCard {me} villager={villagers[me]} moveGoal={view.people[me].moveGoal} goalWeight={m.state.prefs[me].goalWeight ?? null}
          onmove={() => go({ k: 'moveGoal' })} onweight={() => go({ k: 'goal' })} />
      {/if}
      {#if weeks}
        <WeekList {weeks} {order} {names} {villagers} onopen={(wk) => go({ k: 'week', wk })} />
      {:else if money}
        <BellsLog ledger={money} {me} {order} {names} {villagers} onvoid={askVoid} onday={(date) => go({ k: 'day', date })} />
      {/if}
    {:else if top.k === 'week' && wkDetail}
      <WeekDetail d={wkDetail.d} edits={wkDetail.edits} {order} {names} {villagers}
        onday={(date) => go({ k: 'day', date })} />
    {:else if top.k === 'day' && day}
      {@const date = top.date}
      <DayDetail d={day} editable={canEdit} {me} {partner} {names} {villagers} now={m.now}
        onmetric={(metric) => go({ k: 'metric', date, metric })} onworkout={(id) => go({ k: 'workout', date, id })}
        onadd={() => { addType = null; go({ k: 'add', date }); }} />
    {:else if top.k === 'weight' && trends}
      {@const p = top.p}
      <WeightDetail w={trends[p]} person={p} name={names[p]} villager={villagers[p]} mine={p === me} {today}
        onlog={(date) => go({ k: 'weightIn', date })} />
    {:else if top.k === 'weightIn'}
      {@const s = top}
      <ValueInput label={t('kiroku.field.weight')} sub={dayTitle(s.date)} old={weightOn(m.state, me, s.date, m.now)} unit="kg"
        parse={parseKgInput} hint={t('weight.range')} onok={(kg) => saveWeight(s.date, kg)} oncancel={back} />
    {:else if top.k === 'goal'}
      {@const goal = m.state.prefs[me].goalWeight ?? null}
      <ValueInput label={t('weight.goalWeight')} sub="" old={goal} unit="kg" parse={parseKgInput} hint={t('weight.range')}
        onok={(kg) => saveGoal(kg)} oncancel={back} extra={goal === null ? null : { label: t('weight.clearGoal'), run: () => saveGoal(null) }} />
    {:else if top.k === 'moveGoal'}
      <ValueInput label={t('goal.move')} sub={t('goal.moveNote')} old={view.people[me].moveGoal} unit="kcal" parse={parseKcalInput}
        hint={t('goal.moveRange', { min: MOVE_GOAL.min, max: formatNum(MOVE_GOAL.max) })} onok={saveMoveGoal} oncancel={back} />
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
      {@const d = day.people[me]}
      <NumberPad label={t(`kiroku.field.${s.metric}`)} sub={dayTitle(s.date)} max={METRIC_BOUNDS[s.metric]}
        old={s.metric === 'steps' ? d.steps.value : d.exercise.watch} unit={s.metric === 'steps' ? '' : t('kiroku.min', { n: '' }).trim()}
        onok={(v) => saveMetric(s.date, s.metric, v)} oncancel={back} />
    {:else if top.k === 'workout' && day}
      {@const s = top}
      {@const w = day.people[me].workouts.find((x) => x.id === s.id)}
      {#if w}
        {@const label = typeLabel(w.type)}
        <section class="card wcard">
          <b><TypeName type={w.type} /></b><span class="money">{dayTitle(s.date)} · {t('kiroku.min', { n: w.durationMin })}</span>
          {#if w.excluded}<em>{t('kiroku.excluded')}</em>{:else if w.strength}<em class="ok">{t('kiroku.strengthYes')}</em>{/if}
        </section>
        <div class="wchoices">
          <ChoiceList choices={[
            ...(w.excluded ? [{ label: t('kiroku.include'), run: () => workoutChange(s.id, s.date, label, { excluded: false }) }] : [
              ...(w.eligible && !w.strength ? [{ label: t('kiroku.count'), run: () => workoutChange(s.id, s.date, label, { strength: true }) }] : []),
              ...(w.strength ? [{ label: t('kiroku.nocount'), run: () => workoutChange(s.id, s.date, label, { strength: false }) }] : []),
              ...(w.override !== null ? [{ label: t('kiroku.auto'), run: () => workoutChange(s.id, s.date, label, { strength: null }) }] : []),
              { label: t('kiroku.exclude'), run: () => workoutChange(s.id, s.date, label, { excluded: true }) }
            ]),
            { label: t('kiroku.cancel'), run: back, cancel: true }
          ]} />
        </div>
      {/if}
    {:else if top.k === 'add'}
      {@const s = top}
      {#if !addType}
        <h3 class="addh"><span class="nw">{t('kiroku.addWorkout')}</span> <span class="money">{dayTitle(s.date)}</span></h3>
        <p class="note">{t('kiroku.addNote')}</p>
        <div class="types" role="group" aria-label={t('kiroku.pickType')}>
          {#each ADD_TYPES as ty (ty)}
            <button type="button" class="type" data-sfx="page" onclick={() => (addType = ty)}><TypeName type={ty} /></button>
          {/each}
        </div>
      {:else}
        <NumberPad label={typeLabel(addType)} sub={dayTitle(s.date)} old={null} max={MANUAL_WORKOUT_MIN.max} unit={t('kiroku.min', { n: '' }).trim()}
          onok={(v) => v >= MANUAL_WORKOUT_MIN.min && saveAdd(s.date, v)} oncancel={() => (addType = null)} />
      {/if}
    {/if}
  {/if}
  </div>
  {/key}
</div>

<style>
  .kiroku { padding-bottom: 8px; }
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
  em.ok { background: var(--c-yuzu); color: var(--c-ink); }
  .wchoices { display: flex; justify-content: flex-end; padding-top: 8px; }
  .addh { margin: 0 2px; font-size: var(--fs-talk); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
  .addh .nw { white-space: nowrap; }
  .addh .money { font-size: var(--fs-body); color: var(--text-soft); }
  .note { margin: -6px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .ask { padding: 16px; display: grid; gap: 6px; }
  .ask small { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .ask p { margin: 0; font-size: var(--fs-talk); font-weight: 700; line-height: 1.4; word-break: auto-phrase; }
  /* minmax(0, 1fr): the longest label (高強度インターバルトレーニング) must not set a column's minimum (sizing #3, scroll M1) */
  .types { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .type {
    appearance: none; border: 0; cursor: pointer; min-width: 0; overflow-wrap: anywhere; min-height: 52px; padding: 6px 10px; border-radius: var(--r-btn);
    font: 700 var(--fs-body)/1.25 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
    word-break: auto-phrase;
  }
  .type:active { transform: translateY(3px); box-shadow: var(--sh-ctl-press); }
</style>
