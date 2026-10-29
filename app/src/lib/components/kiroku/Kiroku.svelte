<script module lang="ts">
  export type KirokuEntry = { tab: 'body' | 'money'; week?: string };
</script>

<script lang="ts">
  // きろく (records) NookPhone app (history-and-editing.md): からだ | お金 pills, week cards → week → day → edit,
  // full screen inside the phone. ◀ (the phone's back) goes up one level: the phone calls `back()` first.
  // Everything is computed from the store's reduced model, lazily for the opened week/day; edits go through the
  // queue (held 5 s with もとに戻す) and recompute the island's ribbon and ≈¥ at once. Loaded on first open
  // (ShimaPhone imports it dynamically, round 7 L1).
  import { tick, untrack } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import { dayDetail, historyWeeks, moneyLog, weekDetail, weekEdits } from '#lib/model/history.ts';
  import { METRIC_BOUNDS, MANUAL_WORKOUT_MIN } from '#lib/contract/api.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { addWorkout, editWorkout, fixCheckin, setMetric, undoBanner as undoToast, undoTransfer, voidSpend, EDIT_CUTOFF_MS } from '#lib/store/actions.ts';
  import ChoiceList from '../ui/ChoiceList.svelte';
  import WeekList from './WeekList.svelte';
  import WeekDetail from './WeekDetail.svelte';
  import DayDetail from './DayDetail.svelte';
  import MoneyLog from './MoneyLog.svelte';
  import NumberPad from './NumberPad.svelte';
  import { dayTitle, typeLabel } from './fmt.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';

  type Screen =
    | { k: 'week'; wk: string }
    | { k: 'day'; date: string }
    | { k: 'metric'; date: string; metric: 'steps' | 'exercise_min' }
    | { k: 'workout'; date: string; id: string }
    | { k: 'add'; date: string }
    | { k: 'void'; id: string | number; label: string; yen: number; refund: boolean };

  let { entry = null }: { entry?: KirokuEntry | null } = $props();
  let tab = $state<'body' | 'money'>('body');
  let stack = $state<Screen[]>([]);
  let root: HTMLElement | undefined = $state();

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
  const money = $derived(m && !top && tab === 'money' ? moneyLog(m.state, m.now) : null);
  const wkDetail = $derived(m && top?.k === 'week' ? { d: weekDetail(m.state, top.wk, m.now), edits: weekEdits(m.state, top.wk) } : null);
  const dayDate = $derived(top && 'date' in top ? top.date : null);
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
    });
  });

  async function go(s: Screen) {
    stack = [...stack, s];
    await tick();
    root?.closest('dialog')?.scrollTo({ top: 0 });
  }
  /** ◀: one level up. False at the top (the phone goes back to its home screen). */
  export function back(): boolean {
    if (!stack.length) return false;
    stack = stack.slice(0, -1);
    return true;
  }

  /** After けってい: focus back on the ✎ that opened the edit (round 7 F4), else on the phone. */
  async function refocus(key: string) {
    await tick();
    const el = root?.querySelector<HTMLElement>(`[data-focus="${CSS.escape(key)}"]`);
    if (el) el.focus();
    else root?.closest('dialog')?.focus();
  }

  async function saveMetric(date: string, metric: 'steps' | 'exercise_min', value: number) {
    back();
    void refocus(metric);
    undoToast(t('kiroku.saved', { field: t(`kiroku.field.${metric}`) }), await setMetric(date, metric, value));
  }
  async function workoutChange(id: string, date: string, label: string, change: { strength?: boolean | null; excluded?: boolean }) {
    back();
    void refocus(`w:${id}`);
    undoToast(t('kiroku.savedWorkout', { label }), await editWorkout(id, date, change));
  }
  async function tickFix(date: string, habit: string, done: boolean) {
    undoToast(t('kiroku.saved', { field: t(`habit.${habit}`) }), await fixCheckin(date, habit, done));
  }
  /** なかったことに asks first (an NH choice list), then voids with もとに戻す on the banner (round 7 F7). */
  function askVoid(id: string | number, label: string, yen: number, refund: boolean) {
    void go({ k: 'void', id, label, yen, refund });
  }
  async function voidIt(id: string | number, label: string) {
    back();
    undoToast(t('kiroku.spendVoided', { label }), await voidSpend(id));
  }
  async function undoIt(month: string) {
    undoToast(t('kiroku.transferUndone', { month: t('kiroku.monthLabel', { y: month.slice(0, 4), m: Number(month.slice(5, 7)) }) }), await undoTransfer(month));
  }

  // Add a workout: pick a type, then the minutes on the keypad.
  const ADD_TYPES = ['Traditional Strength Training', 'Pilates', 'Yoga', 'Outdoor Walk', 'Outdoor Run', 'Cycling', 'Swimming', 'Dance', 'High Intensity Interval Training'];
  let addType = $state<string | null>(null);
  async function saveAdd(date: string, min: number) {
    const type = addType!;
    addType = null;
    back();
    void refocus('add');
    undoToast(t('kiroku.added', { label: typeLabel(type) }), await addWorkout(date, type, min));
  }
</script>

<div class="kiroku" bind:this={root}>
  {#if m && view}
    {#if !top}
      <!-- A segmented switch (toggle buttons), not tabs: there is no tab panel to move to. -->
      <div class="pills" role="group" aria-label={t('phone.app.kiroku')}>
        {#each ['body', 'money'] as const as id (id)}
          <button type="button" class="pill" aria-pressed={tab === id} onclick={() => (tab = id)}>{t(`kiroku.tab.${id}`)}</button>
        {/each}
      </div>
      {#if weeks}
        <WeekList {weeks} {order} {names} {villagers} onopen={(wk) => go({ k: 'week', wk })} />
      {:else if money}
        <MoneyLog log={money} {me} {villagers} onvoid={askVoid} onundo={undoIt} />
      {/if}
    {:else if top.k === 'week' && wkDetail}
      <WeekDetail d={wkDetail.d} edits={wkDetail.edits} {order} {names} {villagers} now={m.now}
        onday={(date) => go({ k: 'day', date })} />
    {:else if top.k === 'day' && day}
      {@const date = top.date}
      <DayDetail d={day} editable={canEdit} {me} {partner} {names} {villagers} now={m.now}
        onmetric={(metric) => go({ k: 'metric', date, metric })} onworkout={(id) => go({ k: 'workout', date, id })}
        onadd={() => { addType = null; go({ k: 'add', date }); }} ontick={(h, done) => tickFix(date, h, done)} />
    {:else if top.k === 'void'}
      {@const s = top}
      <section class="card ask">
        <p>{t('kiroku.voidAsk', { label: s.label, yen: formatYen(s.yen) })}</p>
        {#if s.refund}<small>{t('kiroku.voidRefund')}</small>{/if}
      </section>
      <div class="wchoices">
        <ChoiceList choices={[
          { label: t('kiroku.voidYes'), run: () => voidIt(s.id, s.label) },
          { label: t('kiroku.cancel'), run: back }
        ]} />
      </div>
    {:else if top.k === 'metric' && day}
      {@const s = top}
      {@const d = day.people[me]}
      <NumberPad label={t(`kiroku.field.${s.metric}`)} sub={dayTitle(s.date)} max={METRIC_BOUNDS[s.metric]}
        old={s.metric === 'steps' ? d.steps.value : d.minutes.watch} unit={s.metric === 'steps' ? '' : t('kiroku.min', { n: '' }).trim()}
        onok={(v) => saveMetric(s.date, s.metric, v)} oncancel={back} />
    {:else if top.k === 'workout' && day}
      {@const s = top}
      {@const w = day.people[me].workouts.find((x) => x.id === s.id)}
      {#if w}
        {@const label = typeLabel(w.type)}
        <section class="card wcard">
          <b>{label}</b><span class="money">{dayTitle(s.date)} · {t('kiroku.min', { n: w.durationMin })}</span>
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
            { label: t('kiroku.cancel'), run: back }
          ]} />
        </div>
      {/if}
    {:else if top.k === 'add'}
      {@const s = top}
      {#if !addType}
        <h3 class="addh">{t('kiroku.addWorkout')} <span class="money">{dayTitle(s.date)}</span></h3>
        <p class="note">{t('kiroku.addNote')}</p>
        <div class="types" role="group" aria-label={t('kiroku.pickType')}>
          {#each ADD_TYPES as ty (ty)}
            <button type="button" class="type" onclick={() => (addType = ty)}>{typeLabel(ty)}</button>
          {/each}
        </div>
      {:else}
        <NumberPad label={typeLabel(addType)} sub={dayTitle(s.date)} old={null} max={MANUAL_WORKOUT_MIN.max} unit={t('kiroku.min', { n: '' }).trim()}
          onok={(v) => v >= MANUAL_WORKOUT_MIN.min && saveAdd(s.date, v)} oncancel={() => (addType = null)} />
      {/if}
    {/if}
  {/if}
</div>

<style>
  .kiroku { display: grid; gap: 12px; padding-bottom: 8px; }
  .pills { display: flex; gap: 8px; justify-content: center; margin: -4px 0 4px; }
  .pill {
    appearance: none; border: 0; cursor: pointer; min-height: 40px; min-width: 104px; padding: 0 18px; border-radius: var(--r-pill);
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text-soft); background: color-mix(in srgb, var(--lip) 40%, transparent);
  }
  .pill[aria-pressed='true'] { background: var(--c-yuzu); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-yuzu-lip); }
  .wcard { display: grid; gap: 6px; justify-items: start; }
  .wcard b { font-size: var(--fs-talk); }
  .wcard .money { font-size: var(--fs-body); color: var(--text-soft); }
  em { font-style: normal; font-size: var(--fs-s); font-weight: 700; padding: 3px 8px; border-radius: var(--r-chip); background: color-mix(in srgb, var(--lip) 45%, transparent); }
  em.ok { background: var(--c-yuzu); color: var(--c-ink); }
  .wchoices { display: flex; justify-content: flex-end; padding-top: 8px; }
  .addh { margin: 0 2px; font-size: var(--fs-talk); display: flex; gap: 8px; align-items: baseline; flex-wrap: wrap; }
  .addh .money { font-size: var(--fs-body); color: var(--text-soft); }
  .note { margin: -6px 2px 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .ask { padding: 16px; display: grid; gap: 6px; }
  .ask small { font-size: var(--fs-body); font-weight: 700; color: var(--text-soft); }
  .ask p { margin: 0; font-size: var(--fs-talk); font-weight: 700; line-height: 1.4; word-break: auto-phrase; }
  .types { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
  .type {
    appearance: none; border: 0; cursor: pointer; min-height: 52px; padding: 6px 10px; border-radius: var(--r-btn);
    font: 700 var(--fs-body)/1.25 var(--font-ui); color: var(--c-ink); background: var(--c-cream); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
    word-break: auto-phrase;
  }
  .type:active { transform: translateY(3px); box-shadow: 0 1px 0 var(--c-lip); }
</style>
