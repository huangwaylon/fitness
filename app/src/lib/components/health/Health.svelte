<script module lang="ts">
  import type { Period } from '#lib/model/health.ts';
  /** The period and whose data (null: this phone's person), kept for the session like the panel's tab. */
  const last: { period: Period; who: 'A' | 'B' | null } = { period: 'month', who: null };
</script>

<script lang="ts">
  // けんこう (health, design.md "Kenkou"): the island panel's second tab, the Health data over time for the personal
  // trainer, one person at a time. First whose data (ウェイ / うめ, this phone's person by default; switching keeps the
  // period and the range), then one period for every chart (1週 / 1か月 / 3か月 / 1年 / すべて) and a sticky row with ‹ the visible range › and きょう; then a card per metric in the app's order (🍐 Move, 🍑 Exercise,
  // 🍒 Stand, 🍎 Steps) and 体重. A horizontal drag on any chart turns the page; a tap shows a bar's numbers. Read-only,
  // computed on read from the store's model (model/health.ts); loaded with the tab, not with the island.
  import '#lib/i18n/kenkou.ts'; // the tab's strings, loaded with it
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import { canShift, healthSeries, METRICS, PERIODS, rangeFor, shiftAnchor, type Metric } from '#lib/model/health.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import Avatar from '../characters/Avatar.svelte';
  import MetricCard from './MetricCard.svelte';
  import WeightCard from './WeightCard.svelte';
  import { rangeLabel } from './fmt.ts';

  const m = $derived(week.model);
  const view = $derived(week.view);
  const hs = $derived(m ? healthSeries(m.state, m.now) : null);
  const me = $derived<PersonId>(view?.me ?? 'A');
  const partner = $derived<PersonId>(view?.partner ?? 'B');
  const names = $derived({ A: view?.people.A.villagerName ?? 'A', B: view?.people.B.villagerName ?? 'B' } as Record<PersonId, string>);
  const villagers = $derived({ A: view?.people.A.villager ?? null, B: view?.people.B.villager ?? null } as Record<PersonId, string | null>);

  let period = $state<Period>(last.period);
  let picked = $state<PersonId | null>(last.who);
  /** Whose data every card shows. */
  const who = $derived<PersonId>(picked ?? me);
  /** The last day shown (null: today, following the clock). */
  let anchor = $state<LocalDate | null>(null);
  let slide = $state<-1 | 0 | 1>(0);
  /** The one open callout: a metric's bar or the weight dot. */
  let sel = $state<{ k: Metric | 'weight'; i: number } | null>(null);

  const today = $derived(hs?.to ?? '');
  const range = $derived(hs ? rangeFor(period, anchor ?? today, hs.from) : null);
  const can = $derived(hs && range ? canShift(range, hs.from, today) : { back: false, on: false });
  const unitKey = $derived(range?.unit ?? 'day');

  function setPeriod(p: Period) {
    if (p === period) return;
    period = last.period = p;
    slide = 0;
    sel = null;
  }
  /** Another person: the same period and range, their numbers. */
  function setWho(p: PersonId) {
    if (p === who) return;
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
  function pick(k: Metric | 'weight', i: number | null) {
    sel = i === null ? null : { k, i };
    if (i !== null) cue('tick');
  }
</script>

<div class="health">
  {#if hs && range}
    <div class="seg who" role="group" aria-label={t('health.who')}>
      {#each [me, partner] as p (p)}
        <button type="button" class="sb pp" aria-pressed={who === p} data-who={p} data-sfx={who === p ? 'none' : 'tick'} onclick={() => setWho(p)}>
          <Avatar person={p} villager={villagers[p]} size={28} /><span class="nm">{names[p]}</span><i class="sw p{p}" aria-hidden="true"></i>
        </button>
      {/each}
    </div>
    <div class="seg" role="group" aria-label={t('health.period')}>
      {#each PERIODS as id (id)}
        <button type="button" class="sb" aria-pressed={period === id} data-period={id} data-sfx={period === id ? 'none' : 'tick'} onclick={() => setPeriod(id)}>{t(`health.period.${id}`)}</button>
      {/each}
    </div>

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
      {#each METRICS as k (k)}
        <MetricCard metric={k} {hs} {range} p={who} {slide} onswipe={swipe}
          selected={sel?.k === k ? sel.i : null} onselect={(i) => pick(k, i)} />
      {/each}
      <WeightCard {hs} {range} p={who} name={names[who]} {slide} onswipe={swipe}
        selected={sel?.k === 'weight' ? sel.i : null} onselect={(i) => pick('weight', i)} />
      <p class="note">{t('health.note')}</p>
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
  /* whose data: the avatar pills, a little taller, the person's colour (their bars) under the pressed one's name */
  .who .sb { position: relative; min-height: 52px; gap: 8px; font-size: var(--fs-talk); }
  .pp .nm { overflow: hidden; text-overflow: ellipsis; }
  .pp .sw { position: absolute; left: 50%; bottom: 7px; width: 28px; height: 4px; margin-left: -14px; border-radius: 2px; opacity: 0; }
  .pp[aria-pressed='true'] .sw { opacity: 1; }
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
