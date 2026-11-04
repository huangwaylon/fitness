<script module lang="ts">
  import type { Period } from '#lib/model/health.ts';
  import { last } from './healthLast.ts';
</script>

<script lang="ts">
  // けんこう (health, design.md "Kenkou"): the health popup (the HUD's dumbbell), the Health data over time for
  // the personal trainer, one person at a time. Whose data (ウェイ / うめ, this phone's person by default; switching
  // keeps the period and the range) is a native dropdown in the title bar, left of けんこう (`lead`, bindable: the
  // popup's NavBar renders it). Then one row: which cards (かつどう / からだ, かつどう
  // on each opening; switching keeps the period, range and person) and one period for every chart (1週 / 1か月 / 3か月 /
  // 1年, a dropdown) beside it; then a sticky row with ‹ the visible range › and きょう; then a card per metric in the group's CARDS order: かつどう 🍎 Steps,
  // 🍐 Move, 🍑 Exercise, 🍒 Stand; からだ 体重, 体脂肪率, BMI, 除脂肪体重. A horizontal drag on any chart turns the page; a tap shows a bar's numbers.
  // Each goal sits at its card's upper right (GoalEdit: the steps, Move, weight and body fat goals, tapped to set in
  // place); either person sets either person's, the guest's phone none (shown read-only; it has no からだ cards).
  // The charts are read-only, computed on read from the store's model (model/health.ts); loaded with the popup, not with the island.
  import '#lib/i18n/kenkou.ts'; // the tab's strings, loaded with it
  import type { Snippet } from 'svelte';
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import { isBodyMetric, type BodyMetric } from '#lib/contract/api.ts';
  import { setGoalBodyFat, setGoalWeight, setMoveGoal, setStepsGoal } from '#lib/store/actions.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { CARDS, canShift, GROUPS, healthSeries, PERIODS, rangeFor, shiftAnchor, type Group, type Metric } from '#lib/model/health.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import Segmented from '../ui/Segmented.svelte';
  import RangeNav from './RangeNav.svelte';
  import Pick from './Pick.svelte';
  import { GROUP_ART } from '#lib/art.ts';
  import MetricCard from './MetricCard.svelte';
  import WeightCard from './WeightCard.svelte';
  import BodyCard from './BodyCard.svelte';
  import { rangeLabel } from './fmt.ts';
  import { isGuest } from '#lib/ui-state/viewer.ts';

  let { lead = $bindable(null) }: { lead?: Snippet | null } = $props();

  const m = $derived(week.model);
  const view = $derived(week.view);
  const hs = $derived(m ? healthSeries(m.state, m.now) : null);
  const me = $derived<PersonId>(view?.me ?? 'A');
  const partner = $derived<PersonId>(view?.partner ?? 'B');
  const names = $derived({ A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B' } as Record<PersonId, string>);
  const villagers = $derived({ A: view?.people.A.villager ?? null, B: view?.people.B.villager ?? null } as Record<PersonId, string | null>);

  let period = $state<Period>(last.period);
  let pickedGroup = $state<Group>(last.group);
  /** The guest's phone has かつどう only (docs/design.md "The guest": never a からだ figure; its snapshot has none). */
  const guest = $derived(isGuest(view));
  const group = $derived<Group>(guest ? 'activity' : pickedGroup);
  let picked = $state<PersonId | null>(last.who);
  /** Whose data every card shows. */
  const who = $derived<PersonId>(picked ?? me);
  /** The last day shown (null: today, following the clock). */
  let anchor = $state<LocalDate | null>(null);
  let slide = $state<-1 | 0 | 1>(0);
  /** The one open callout: a metric's bar, or a weight or body metric's dot. */
  let sel = $state<{ k: Card; i: number } | null>(null);

  const today = $derived(hs?.to ?? '');
  const range = $derived(hs ? rangeFor(period, anchor ?? today) : null);
  const can = $derived(hs && range ? canShift(range, hs.from, today) : { back: false, on: false });
  const unitKey = $derived(range?.unit ?? 'day');

  function setPeriod(p: Period) {
    if (p === period || !PERIODS.includes(p)) return;
    cue('tick');
    period = last.period = p;
    slide = 0;
    sel = null;
  }
  /** The other cards: the same period, range and person. */
  function setGroup(g: Group) {
    if (g === group || guest) return;
    pickedGroup = last.group = g;
    sel = null;
  }
  /** Another person: the same period and range, their numbers. */
  function setWho(p: PersonId) {
    if (p === who || (p !== 'A' && p !== 'B')) return;
    cue('tick');
    picked = last.who = p;
    sel = null;
  }
  /** ‹ / ›, a swipe: one whole period older (−1) or newer (+1). */
  function go(dir: -1 | 1, swiped = false) {
    if (!hs || !(dir < 0 ? can.back : can.on)) return;
    const next = shiftAnchor(period, anchor ?? today, dir, today);
    anchor = next >= today ? null : next;
    slide = dir < 0 ? -1 : 1;
    sel = null;
    if (swiped) cue('tick');
  }
  function jumpToday() {
    if (anchor === null) return;
    anchor = null;
    slide = 1;
    sel = null;
  }
  const swipe = (dir: -1 | 1) => go(dir, true);
  type Card = Metric | 'weight' | BodyMetric;
  function pick(k: Card, i: number | null) {
    sel = i === null ? null : { k, i };
    if (i !== null) cue('tick');
  }

  $effect(() => {
    lead = hs ? whoPill : null;
  });
  /** Sets the shown person's goal (either person sets either person's; never the guest), and says so. */
  function saveGoal(k: 'move' | 'steps' | 'weight' | 'fat', v: number | null) {
    if (guest) return;
    const p = who;
    const ok = k === 'move' ? v !== null && setMoveGoal(p, v).ok : k === 'steps' ? v !== null && setStepsGoal(p, v).ok
      : k === 'weight' ? setGoalWeight(p, v).ok : setGoalBodyFat(p, v).ok;
    const msg = k === 'move' ? 'goal.moveSaved' : k === 'steps' ? 'goal.stepsSaved' : v === null ? 'weight.goalCleared' : 'weight.goalSaved';
    if (ok) toasts.show(t(msg), 2500, { reaction: 'pleased' });
  }
</script>

{#snippet whoPill()}
  <!-- whose data, in the title bar (NavBar's lead) -->
  <Pick kind="who" value={who} options={[me, partner].map((id) => ({ id, label: names[id] }))} label={t('health.who')} onpick={setWho}
    person={{ p: who, villager: villagers[who] }} compact />
{/snippet}

<div class="health">
  {#if hs && range}
    <!-- one row: which cards, and the period beside them (a native dropdown: iOS's own picker; the guest's: the period alone) -->
    <div class="sel">
      {#if !guest}
        <Segmented items={GROUPS.map((id) => ({ id, label: t(`health.group.${id}`), art: GROUP_ART[id] }))} value={group} label={t('health.group')} attr="group" onpick={setGroup} />
      {/if}
      <Pick kind="period" value={period} options={PERIODS.map((id) => ({ id, label: t(`health.period.${id}`) }))} label={t('health.period')} onpick={setPeriod} />
    </div>

    <RangeNav earlier={t('health.earlier')} later={t('health.later')} today={t('health.today')} canBack={can.back} canOn={can.on} atToday={anchor === null}
      onback={() => go(-1)} onon={() => go(1)} ontoday={jumpToday}>
      <span class="rl" aria-live="polite">
        <!-- the range wraps after its dash when a long one (2024/10–2026/10) doesn't fit beside the buttons -->
        <b class="money">{#each rangeLabel(range, today).split('–') as part, i (i)}{#if i}–<wbr />{/if}<span>{part}</span>{/each}</b>
        <small>{t(`health.unit.${unitKey}`)}</small>
      </span>
    </RangeNav>

    {#each CARDS[group] as k (k)}
      {#if guest && k !== 'steps' && k !== 'move' && k !== 'exercise' && k !== 'stand'}
        <!-- (never on the guest's phone) -->
      {:else if k === 'weight'}
        <WeightCard {hs} {range} p={who} name={names[who]} {slide} onswipe={swipe}
          selected={sel?.k === 'weight' ? sel.i : null} onselect={(i) => pick('weight', i)} onsavegoal={(v) => saveGoal('weight', v)} />
      {:else if isBodyMetric(k)}
        <BodyCard metric={k} {hs} {range} p={who} name={names[who]} {slide} onswipe={swipe}
          selected={sel?.k === k ? sel.i : null} onselect={(i) => pick(k, i)} onsavegoal={(v) => saveGoal('fat', v)} />
      {:else}
        {@const now = view && !guest && (k === 'steps' || k === 'move') ? view.people[who][k === 'steps' ? 'stepsGoal' : 'moveGoal'] : null}
        <MetricCard metric={k} {hs} {range} p={who} {slide} onswipe={swipe}
          selected={sel?.k === k ? sel.i : null} onselect={(i) => pick(k, i)}
          goal={now === null ? null : { value: now, onsave: (v) => saveGoal(k === 'steps' ? 'steps' : 'move', v) }} />
      {/if}
    {/each}
    {#if group === 'activity' && hs.any}<p class="note">{t('health.note')}</p>{/if}
  {/if}
</div>

<style>
  .health { display: grid; gap: 12px; padding-bottom: 8px; }
  /* かつどう · からだ, the period pill beside them at its own width (the guest's: the pill alone, at the right) */
  .sel { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px; }
  .sel > :global(:only-child) { grid-column: 2; }
  .rl { flex: 1; min-width: 0; display: grid; justify-items: center; gap: 3px; text-align: center; }
  .rl b { font-size: var(--fs-talk); line-height: 1.1; text-wrap: balance; }
  .rl b span { white-space: nowrap; }
  .rl small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); white-space: nowrap; }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
