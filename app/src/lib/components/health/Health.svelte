<script module lang="ts">
  import type { Period } from '#lib/model/health.ts';
  import { last } from './healthLast.ts';
</script>

<script lang="ts">
  // けんこう (health, design.md "Kenkou"): the health popup (the HUD's dumbbell), the Health data over time for
  // the personal trainer, one person at a time. Whose data (ウェイ / うめ, this phone's person by default; switching
  // keeps the period and the range) is a native dropdown in the title bar, left of 健康 | ごはん (`lead`, bindable: the
  // popup's NavBar renders it), one pick with ごはん's (whose.svelte.ts): the guest picked there, this shows the last
  // member picked, its pill dashed and a line under the bar saying so. Then one row: which cards (かつどう / からだ, かつどう
  // on each opening; switching keeps the period, range and person) and one period for every chart (1週 / 1か月 / 3か月 /
  // 1年, a dropdown) beside it; then a sticky row with ‹ the visible range › and きょう; then a card per metric in the group's CARDS order: かつどう 🍎 Steps,
  // 🍐 Move, 🍑 Exercise, 🍒 Stand; からだ 体重, 体脂肪率, BMI, 除脂肪体重. A horizontal drag on any chart turns the page; a tap shows a bar's numbers.
  // Each card's goal sits at its upper right (ChartCard, GoalEdit: every chart has one, set in place, its direction
  // shown); either person sets either person's, the guest's phone none (shown read-only; it has no からだ cards).
  // The charts are read-only, computed on read from the store's model (model/health.ts); loaded with the popup, not with the island.
  import '#lib/i18n/kenkou.ts'; // the tab's strings, loaded with it
  import { untrack, type Snippet } from 'svelte';
  import type { PersonId } from '#lib/types.ts';
  import { CARDS, GROUPS, healthSeries, metricSeries, PERIODS, type Group, type Metric } from '#lib/model/health.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import Segmented from '../ui/Segmented.svelte';
  import RangeNav from './RangeNav.svelte';
  import RangeLabel from './RangeLabel.svelte';
  import Pick from './Pick.svelte';
  import { GROUP_ART } from '#lib/art.ts';
  import BarCard from './BarCard.svelte';
  import BodyCard from './BodyCard.svelte';
  import { goalName, saveGoal } from './goals.ts';
  import { RangePager } from './pager.svelte.ts';
  import { isGuest } from '#lib/ui-state/viewer.ts';
  import { pickWhose, whose } from './whose.svelte.ts';

  /** `opens`: the sheet's openings (HealthSheet keeps this mounted between them): each one starts again from `last`. */
  let { lead = $bindable(null), opens = 0 }: { lead?: Snippet | null; opens?: number } = $props();

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
  /** The person picked on either tab (this phone's by default); 健康 has no guest data, so with the guest picked it
   *  shows the last member picked (`away`). */
  const shared = $derived(whose.who ?? view?.viewer ?? me);
  const away = $derived(shared === 'G');
  /** Whose data every card shows. */
  const who = $derived<PersonId>(shared === 'G' ? (whose.member ?? me) : shared);
  const guestName = $derived(view?.guest.villagerName ?? '');
  const awayNote = $derived(away ? t('health.noGuest', { guest: guestName, name: names[who] }) : '');

  const today = $derived(hs?.to ?? '');
  const pager = new RangePager(() => ({ period, today, first: hs?.from ?? today }));
  const range = $derived(pager.range);

  function setPeriod(p: Period) {
    if (p === period || !PERIODS.includes(p)) return;
    cue('tick');
    period = last.period = p;
    pager.reset();
  }
  /** The other cards: the same period, range and person. */
  function setGroup(g: Group) {
    if (g === group || guest) return;
    pickedGroup = last.group = g;
    pager.sel = null;
  }
  /** Another person: the same period and range, their numbers. */
  function setWho(p: PersonId) {
    if ((p === who && !away) || (p !== 'A' && p !== 'B')) return;
    cue('tick');
    pickWhose(p);
    pager.sel = null;
  }

  // svelte-ignore state_referenced_locally
  let opened = opens;
  $effect.pre(() => {
    if (opens === opened) return;
    opened = opens;
    untrack(() => {
      period = last.period;
      pickedGroup = last.group;
      pager.anchor = null;
      pager.reset();
    });
  });

  $effect(() => {
    lead = hs ? whoPill : null;
  });
  /** The shown person's goal setter: either member sets either member's; the guest's phone none (read-only chips). */
  const saver = (k: Parameters<typeof saveGoal>[0]) => (guest ? null : (v: number | null) => saveGoal(k, who, v));
  /** An activity goal in force today (the editor starts from it). */
  const nowGoal = (k: Metric) => hs?.people[who].goals[k].at(-1) ?? null;
</script>

{#snippet whoPill()}
  <!-- whose data, in the title bar (NavBar's lead) -->
  <Pick kind="who" value={who} options={[me, partner].map((id) => ({ id, label: names[id] }))} label={t('health.who')} onpick={setWho}
    person={{ p: who, villager: villagers[who] }} compact {away} note={awayNote} />
{/snippet}

<div class="health">
  {#if hs && range}
    {#if away}<p class="away" role="status" data-health-away>{awayNote}</p>{/if}
    <!-- one row: which cards, and the period beside them (a native dropdown: iOS's own picker); the guest has no cards to
         pick, so its period sits at the range row's end, as ごはん's グラフ's (no row left empty) -->
    {#snippet periodPick()}
      <Pick kind="period" value={period} options={PERIODS.map((id) => ({ id, label: t(`health.period.${id}`) }))} label={t('health.period')} onpick={setPeriod} compact />
    {/snippet}
    {#if !guest}
      <div class="sel">
        <Segmented items={GROUPS.map((id) => ({ id, label: t(`health.group.${id}`), art: GROUP_ART[id] }))} value={group} label={t('health.group')} attr="group" onpick={setGroup} />
        {@render periodPick()}
      </div>
    {/if}

    <RangeNav earlier={t('health.earlier')} later={t('health.later')} today={t('health.today')} canBack={pager.can.back} canOn={pager.can.on} atToday={pager.anchor === null}
      onback={() => pager.go(-1)} onon={() => pager.go(1)} ontoday={() => pager.jumpToday()} end={guest ? periodEnd : undefined}>
      <RangeLabel {range} {today} />
    </RangeNav>
    {#snippet periodEnd()}<span class="per">{@render periodPick()}</span>{/snippet}

    {#each CARDS[group] as k (k)}
      {#if k === 'steps' || k === 'move' || k === 'exercise' || k === 'stand'}
        <BarCard id={k} ds={metricSeries(hs, who, k)} {range} {today} p={who} name={names[who]} title={goalName(k)} empty={!hs.any} now={nowGoal(k)} onsave={saver(k)}
          selected={pager.selected(k)} onselect={(i) => pager.pick(k, i)} onswipe={pager.swipe} slide={pager.slide} />
      {:else if !guest}
        <!-- からだ: never on the guest's phone -->
        <BodyCard id={k} {hs} {range} p={who} name={names[who]} slide={pager.slide} onswipe={pager.swipe}
          selected={pager.selected(k)} onselect={(i) => pager.pick(k, i)} onsave={saver(k)} />
      {/if}
    {/each}
  {/if}
</div>

<style>
  .health { display: grid; gap: var(--kk-gap); padding-bottom: 8px; }
  .away { margin: 0; font: 600 var(--fs-s)/1.4 var(--font-body); color: var(--text-soft); text-align: center; }
  /* かつどう · からだ, the period pill beside them at its own width (the guest's: the pill alone, at the right); centred,
     not stretched: the pills ごはん's きろく · グラフ (Segmented's 36), the dropdown its グラフ's (Pick compact) */
  .sel { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; min-height: var(--kk-row); }
  .per { flex: none; display: flex; }
</style>
