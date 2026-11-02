<script module lang="ts">
  import type { Period } from '#lib/model/health.ts';
  import { last } from './healthLast.ts';
</script>

<script lang="ts">
  // けんこう (health, design.md "Kenkou"): the health popup (the HUD's dumbbell), the Health data over time for
  // the personal trainer, one person at a time. Two rows of selectors: whose data (ウェイ / うめ, this phone's person
  // by default; switching keeps the period and the range) and one period for every chart (1週 / 1か月 / 3か月 / 1年),
  // a native dropdown each, side by side; then which cards (かつどう / からだ, かつどう on each opening; switching keeps the period, range and person) and a sticky
  // row with ‹ the visible range › and きょう; then a card per metric in the group's CARDS order: かつどう 🍎 Steps,
  // 🍐 Move, 🍑 Exercise, 🍒 Stand; からだ 体重, 体脂肪率, BMI, 除脂肪体重. A horizontal drag on any chart turns the page; a tap shows a bar's numbers.
  // Read-only, computed on read from the store's model (model/health.ts); loaded with the popup, not with the island.
  import '#lib/i18n/kenkou.ts'; // the tab's strings, loaded with it
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import { isBodyMetric, type BodyMetric } from '#lib/contract/api.ts';
  import { CARDS, canShift, GROUPS, healthSeries, PERIODS, rangeFor, shiftAnchor, type Group, type Metric } from '#lib/model/health.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { GROUP_ART } from '#lib/art.ts';
  import MetricCard from './MetricCard.svelte';
  import WeightCard from './WeightCard.svelte';
  import BodyCard from './BodyCard.svelte';
  import { rangeLabel } from './fmt.ts';
  import { isGuest } from '#lib/ui-state/viewer.ts';

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
</script>

<div class="health">
  {#if hs && range}
    <!-- Row 1: whose data and the period, one native dropdown each (iOS's own picker; a cream pill ≥ 44px) -->
    <div class="dds">
      <label class="dd who" data-who={who}>
        <span class="sr-only">{t('health.who')}</span>
        <span class="av" aria-hidden="true"><Avatar person={who} villager={villagers[who]} size={28} /></span>
        <select data-pick="who" value={who} data-sfx="none" onchange={(e) => setWho(e.currentTarget.value as PersonId)}>
          {#each [me, partner] as p (p)}<option value={p}>{names[p]}</option>{/each}
        </select>
        <i class="sw p{who}" aria-hidden="true"></i>
        <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 L8 10.5 L12.5 6" /></svg>
      </label>
      <label class="dd period" data-period={period}>
        <span class="sr-only">{t('health.period')}</span>
        <select data-pick="period" value={period} data-sfx="none" onchange={(e) => setPeriod(e.currentTarget.value as Period)}>
          {#each PERIODS as id (id)}<option value={id}>{t(`health.period.${id}`)}</option>{/each}
        </select>
        <svg class="chev" viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 6 L8 10.5 L12.5 6" /></svg>
      </label>
    </div>
    {#if !guest}
      <div class="seg" role="group" aria-label={t('health.group')}>
        {#each GROUPS as id (id)}
          <button type="button" class="sb" aria-pressed={group === id} data-group={id} data-sfx={group === id ? 'none' : 'tick'} onclick={() => setGroup(id)}><span class="gi" aria-hidden="true"><OfficialArt key={GROUP_ART[id]} size={22} /></span>{t(`health.group.${id}`)}</button>
        {/each}
      </div>
    {/if}

    <div class="nav">
      <button type="button" class="nb" data-nav="back" aria-label={t('health.earlier')} aria-disabled={!can.back} data-sfx="tick" onclick={() => go(-1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5 L8 12 L15 19" /></svg>
      </button>
      <span class="rl" aria-live="polite">
        <!-- the range wraps after its dash when a long one (2024/10–2026/10) doesn't fit beside the buttons -->
        <b class="money">{#each rangeLabel(range, today).split('–') as part, i (i)}{#if i}–<wbr />{/if}<span>{part}</span>{/each}</b>
        <small>{t(`health.unit.${unitKey}`)}</small>
      </span>
      <button type="button" class="nb" data-nav="on" aria-label={t('health.later')} aria-disabled={!can.on} data-sfx="tick" onclick={() => go(1)}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5 L16 12 L9 19" /></svg>
      </button>
      <button type="button" class="nb today" data-nav="today" aria-disabled={anchor === null} data-sfx="tick" onclick={jumpToday}>{t('health.today')}</button>
    </div>

    {#if !hs.any}
      <section class="card empty"><p>{t('kiroku.empty')}</p></section>
    {:else}
      {#each CARDS[group] as k (k)}
        {#if guest && k !== 'steps' && k !== 'move' && k !== 'exercise' && k !== 'stand'}
          <!-- (never on the guest's phone) -->
        {:else if k === 'weight'}
          <WeightCard {hs} {range} p={who} name={names[who]} {slide} onswipe={swipe}
            selected={sel?.k === 'weight' ? sel.i : null} onselect={(i) => pick('weight', i)} />
        {:else if isBodyMetric(k)}
          <BodyCard metric={k} {hs} {range} p={who} name={names[who]} {slide} onswipe={swipe}
            selected={sel?.k === k ? sel.i : null} onselect={(i) => pick(k, i)} />
        {:else}
          <MetricCard metric={k} {hs} {range} p={who} {slide} onswipe={swipe}
            selected={sel?.k === k ? sel.i : null} onselect={(i) => pick(k, i)} />
        {/if}
      {/each}
      {#if group === 'activity'}<p class="note">{t('health.note')}</p>{/if}
    {/if}
  {/if}
</div>

<style>
  .health { display: grid; gap: 12px; padding-bottom: 8px; }
  /* a segmented switch: the panel's tab look, smaller */
  .seg { display: flex; gap: 6px; }
  .sb {
    appearance: none; border: 0; cursor: pointer; flex: 1 1 0; min-width: 0; min-height: var(--hit); padding: 0 4px; border-radius: var(--r-pill);
    display: inline-flex; align-items: center; justify-content: center; gap: 6px; white-space: nowrap;
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .sb[aria-pressed='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-edge), 0 var(--lip-h) 0 var(--c-edge); }
  .sb:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .gi { display: inline-flex; width: 22px; height: 22px; flex: none; line-height: 0; }
  /* row 1: two dropdowns side by side, whose data a little wider (the avatar and the name) */
  .dds { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr); gap: 8px; }
  .dd {
    position: relative; display: flex; align-items: center; min-width: 0; min-height: var(--hit);
    border-radius: var(--r-pill); background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl);
  }
  .dd:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .dd:has(select:focus-visible) { outline: 3px solid var(--focus); outline-offset: 2px; }
  /* the native select fills the pill (its whole face is the tap target); the avatar, the swatch and the chevron are
     drawn over it and let taps through */
  .dd select {
    appearance: none; -webkit-appearance: none; border: 0; margin: 0; background: transparent; color: inherit; cursor: pointer;
    width: 100%; min-width: 0; height: var(--hit); padding: 0 34px 0 16px; border-radius: inherit;
    font: 700 var(--fs-input)/1 var(--font-ui); text-overflow: ellipsis; white-space: nowrap; outline: none;
  }
  .dd.who select { padding-left: 46px; }
  .dd .av { position: absolute; left: 10px; top: 50%; translate: 0 -50%; display: flex; pointer-events: none; }
  .dd .chev { position: absolute; right: 12px; top: 50%; translate: 0 -50%; width: 16px; height: 16px; pointer-events: none;
    fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
  /* the person's colour (their bars), a short stroke under the name */
  .dd .sw { position: absolute; left: 46px; bottom: 6px; width: 24px; height: 3px; border-radius: 2px; pointer-events: none; }
  .sw.pA { background: var(--person-a); }
  .sw.pB { background: var(--person-b); }
  /* the range row stays at the top of the panel while the charts scroll under it */
  .nav {
    position: sticky; top: -6px; z-index: 2; display: flex; align-items: center; gap: 8px; min-width: 0;
    margin: 0 -8px; padding: 6px 8px calc(var(--lip-h) + 6px); background: var(--surface);
  }
  .nav::after { content: ''; position: absolute; left: 0; right: 0; top: 100%; height: 12px; pointer-events: none; background: linear-gradient(var(--surface), transparent); }
  .nb {
    appearance: none; border: 0; cursor: pointer; flex: none; min-width: var(--hit); height: var(--hit); padding: 0 10px; border-radius: var(--r-pill);
    display: inline-flex; align-items: center; justify-content: center;
    font: 700 var(--fs-body)/1 var(--font-ui); color: var(--text); background: var(--ctl); box-shadow: var(--sh-ctl);
  }
  .nb svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 2.8; stroke-linecap: round; stroke-linejoin: round; }
  .nb:active:not([aria-disabled='true']) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .nb[aria-disabled='true'] { background: var(--ctl-off); color: var(--text-soft); box-shadow: none; transform: translateY(4px); cursor: default; }
  .rl { flex: 1; min-width: 0; display: grid; justify-items: center; gap: 3px; text-align: center; }
  .rl b { font-size: var(--fs-talk); line-height: 1.1; text-wrap: balance; }
  .rl b span { white-space: nowrap; }
  .rl small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); white-space: nowrap; }
  .empty p { margin: 0; font-weight: 700; color: var(--text-soft); }
  .note { margin: 0 2px; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); line-height: var(--lh); }
</style>
