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
  // 🍐 Move, 🍑 Exercise, 🍒 Stand; からだ 体重のペース (PaceCard: as of today, its period line the period's), 体重, 体脂肪率, BMI, 除脂肪体重,
  // 筋肉量, 骨格筋量, 基礎代謝量. A horizontal drag on any chart turns the page; a tap shows a bar's numbers.
  // Each card's goal sits at its upper right (ChartCard, GoalEdit: every chart has one, set in place, its direction
  // shown); each person sets only their own, another's shown read-only (the guest's phone: every chip, no からだ cards).
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
  import BarCard from './BarCard.svelte';
  import BodyCard from './BodyCard.svelte';
  import PaceCard from './PaceCard.svelte';
  import { paceKind, paceOf, weightLine } from '#lib/model/pace.ts';
  import { count } from '#lib/sync/log.ts';
  import { goalName, saveGoal } from './goals.ts';
  import { goalStartBackfill } from '#lib/store/actions.ts';
  import { RangePager } from './pager.svelte.ts';
  import { isGuest } from '#lib/ui-state/viewer.ts';
  import { pickWhose, whose } from './whose.svelte.ts';

  /** The switch's emoji (docs/design.md "Icons"): 活動 the sneaker, 体 the teddy bear. */
  const GROUP_EMOJI = { activity: '👟', body: '🧸' } as const;

  /** `opens`: the sheet's openings (HealthSheet keeps this mounted between them): each one starts again from `last`.
   *  `focus`: a tree goal's ask (open.svelte.ts askActivity), a new object each time: 活動, that card scrolled to and
   *  marked a moment. */
  let { lead = $bindable(null), opens = 0, focus = null }: { lead?: Snippet | null; opens?: number; focus?: { metric: Metric } | null } = $props();

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
  /** 体's pace and 体重's line: worked out only while 体 shows (model/pace.ts, memoised per State and day). */
  const body = $derived(m && group === 'body' && !guest);
  const pace = $derived(body ? paceOf(m!.state, who, m!.now) : null);
  const wline = $derived(body ? weightLine(m!.state, who, m!.now) : null);
  // a goal weight from before the pace's start was a record fact: written once (store/actions.ts goalStartBackfill)
  $effect(() => {
    if (pace && pace.goal !== null) untrack(() => goalStartBackfill(who));
  });
  // the pace card's state, counted once a sheet opening (the first it shows; no value, no person)
  let paceTold = -1;
  $effect(() => {
    if (pace && opens !== paceTold) (paceTold = opens), count(`act:health.pace.${paceKind(pace)}`);
  });
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

  let opened = untrack(() => opens);
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

  let root: HTMLElement | undefined = $state();
  $effect(() => {
    const f = focus;
    if (!f) return;
    untrack(() => {
      pickedGroup = last.group = 'activity';
      pager.sel = null;
    });
    // after the sheet's own scroll to the top (HealthSheet, a microtask) and this render: the card in view, marked
    const id = requestAnimationFrame(() => {
      const card = root?.querySelector<HTMLElement>(`[data-metric="${f.metric}"]`);
      if (!card) return;
      card.scrollIntoView({ block: 'center' });
      card.dataset.asked = '';
      card.addEventListener('animationend', () => delete card.dataset.asked, { once: true });
    });
    return () => cancelAnimationFrame(id);
  });

  $effect(() => {
    lead = hs ? whoPill : null;
  });
  // (unmounted: HealthSheet's lead let go of, else it holds this component's DOM, the title bar's ‹ and ごはん with it)
  $effect(() => () => void (lead = null));
  /** The shown person's goal setter: my own only (the user, 2026-11-24); another's chips read-only (the guest's phone:
   *  every chip, the members' goals). */
  const saver = (k: Parameters<typeof saveGoal>[0]) => (who === view?.viewer ? (v: number | null) => saveGoal(k, who, v) : null);
  /** An activity goal in force today (the editor starts from it). */
  const nowGoal = (k: Metric) => hs?.people[who].goals[k].at(-1) ?? null;
</script>

{#snippet whoPill()}
  <!-- whose data, in the title bar (NavBar's lead) -->
  <Pick kind="who" value={who} options={[me, partner].map((id) => ({ id, label: names[id] }))} label={t('health.who')} onpick={setWho}
    person={{ p: who, villager: villagers[who] }} compact {away} note={awayNote} />
{/snippet}

<div class="health" bind:this={root}>
  {#if hs && range}
    {#if away}<p class="away" role="status" data-health-away>{awayNote}</p>{/if}
    <!-- one row: which cards, and the period beside them (a native dropdown: iOS's own picker); the guest has no cards to
         pick, so its period sits at the range row's end, as ごはん's グラフ's (no row left empty) -->
    {#snippet periodPick()}
      <Pick kind="period" value={period} options={PERIODS.map((id) => ({ id, label: t(`health.period.${id}`) }))} label={t('health.period')} onpick={setPeriod} compact />
    {/snippet}
    {#if !guest}
      <div class="sel">
        <Segmented items={GROUPS.map((id) => ({ id, label: t(`health.group.${id}`), emoji: GROUP_EMOJI[id] }))} value={group} label={t('health.group')} attr="group" onpick={setGroup} />
        {@render periodPick()}
      </div>
    {/if}

    <RangeNav earlier={t('health.earlier')} later={t('health.later')} today={t('health.today')} canBack={pager.can.back} canOn={pager.can.on} atToday={pager.anchor === null}
      onback={() => pager.go(-1)} onon={() => pager.go(1)} ontoday={() => pager.jumpToday()} end={guest ? periodEnd : undefined}>
      <RangeLabel {range} {today} />
    </RangeNav>
    {#snippet periodEnd()}<span class="per">{@render periodPick()}</span>{/snippet}

    {#if pace}<PaceCard {pace} p={who} {today} {period} line={wline ?? []} onsave={saver('weight')} />{/if}
    {#each CARDS[group] as k (k)}
      {#if k === 'steps' || k === 'move' || k === 'exercise' || k === 'stand'}
        <BarCard id={k} ds={metricSeries(hs, who, k)} {range} {today} p={who} name={names[who]} title={goalName(k)} empty={!hs.any} now={nowGoal(k)} onsave={saver(k)}
          selected={pager.selected(k)} onselect={(i) => pager.pick(k, i)} onswipe={pager.swipe} slide={pager.slide} />
      {:else if !guest}
        <!-- からだ: never on the guest's phone -->
        <BodyCard id={k} {hs} {range} p={who} name={names[who]} slide={pager.slide} onswipe={pager.swipe}
          selected={pager.selected(k)} onselect={(i) => pager.pick(k, i)} onsave={k === 'bmr' ? null : saver(k)}
          line={k === 'weight' ? wline : null} ahead={k === 'weight' && range.to === today && (period === 'month' || period === 'quarter') ? pace?.ahead : null} />
      {/if}
    {/each}
  {/if}
</div>

<style>
  .health { display: grid; gap: var(--kk-gap); padding-bottom: 8px; }
  /* the card a tree's goal asked for: a focus ring that fades (ChartCard's section) */
  .health :global([data-asked]) { animation: asked 1600ms ease-out both; }
  @keyframes asked { 0%, 40% { box-shadow: 0 0 0 3px var(--focus); } 100% { box-shadow: 0 0 0 3px transparent; } }
  .away { margin: 0; font: 600 var(--fs-s)/1.4 var(--font-body); color: var(--text-soft); text-align: center; }
  /* かつどう · からだ, the period pill beside them at its own width (the guest's: the pill alone, at the right); centred,
     not stretched: the pills ごはん's きろく · グラフ (Segmented's 36), the dropdown its グラフ's (Pick compact) */
  .sel { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: center; gap: 8px; min-height: var(--kk-row); }
  .per { flex: none; display: flex; }
</style>
