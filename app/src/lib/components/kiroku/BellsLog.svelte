<script module lang="ts">
  /** Weeks shown at first, and added per 「まえの週」 tap. */
  const WEEKS_AT_ONCE = 3;
</script>

<script lang="ts">
  // The passbook (like NH's ATM statement): everything ever earned, then the ledger by week, newest first, each with its
  // earnings and one line per day: each person's four goals (bright = met, +1 each), the ふたりでぜんぶ star (+2) and the
  // day's ベル, with a がんばり line under it on a day either of us reached 1.5× of a goal (each person's +1 / +2 under
  // their goals); tap → the day. Earnings only: the buys live on ごほうび (wallet/Purchases.svelte).
  import type { PersonId, WeekKey } from '#lib/types.ts';
  import type { BellsLedger, LedgerDay } from '#lib/model/history.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Bells from '../ui/Bells.svelte';
  import GoalMarks from './GoalMarks.svelte';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { weekRange } from '#lib/i18n/format.ts';
  import { dayTitle } from './fmt.ts';

  interface Props {
    ledger: BellsLedger;
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    onday: (date: string) => void;
  }
  let { ledger, order, names, villagers, onday }: Props = $props();

  interface Week { weekKey: WeekKey; days: LedgerDay[]; bells: number }
  const weeks = $derived.by((): Week[] => {
    const m = new Map<WeekKey, Week>();
    const get = (wk: WeekKey) => m.get(wk) ?? m.set(wk, { weekKey: wk, days: [], bells: 0 }).get(wk)!;
    for (const d of ledger.days) {
      const w = get(d.weekKey);
      w.days.push(d);
      w.bells += d.bells;
    }
    return [...m.values()].sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  });
  /** The newest weeks first; older ones a tap away, so opening the panel doesn't build every week's rows at once. */
  let shown = $state(WEEKS_AT_ONCE);
</script>

{#snippet star(on: boolean)}
  <svg class="star" class:on viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" /></svg>
{/snippet}

<section class="card earned">
  <small>{t('kiroku.earnedAll')}</small>
  <Bells bells={ledger.earned} class="eb" />
</section>

{#if !weeks.length}<p class="empty">{t('kiroku.empty')}</p>{/if}

{#each weeks.slice(0, shown) as w (w.weekKey)}
  <section class="week">
    <h4>
      <span class="money">{weekRange(w.weekKey)}</span>
      <b class="money">{formatBells(w.bells, { signed: true })}</b>
    </h4>
    <ul class="card rows">
      {#if w.days.length}
        <!-- whose goals each column shows -->
        <li class="day head" aria-hidden="true">
          <span class="dt"></span>
          {#each order as p (p)}<span class="pv"><Avatar person={p} villager={villagers[p]} size={20} /></span>{/each}
          <span class="st"></span><span class="tot"></span>
        </li>
      {/if}
      {#each w.days as d (d.date)}
        <li class="day" class:zero={d.bells === 0}>
          <button type="button" class="dbtn" data-sfx="page" onclick={() => onday(d.date)}>
            <span class="dt">{dayTitle(d.date)}</span>
            {#each order as p (p)}<span class="pv"><GoalMarks met={d.people[p].met} name={names[p]} size="var(--mk)" /></span>{/each}
            <span class="st">{#if d.together}{@render star(true)}<span class="sr-only">{t('together.name')}</span>{/if}</span>
            <b class="money tot">{formatBells(d.bells, { signed: true })}</b>
            {#if order.some((p) => d.people[p].stretch)}
              <span class="gbk">{t('kiroku.stretch')}</span>
              {#each order as p (p)}
                <span class="pv gbv money" data-person={p} data-stretch={d.people[p].stretch || null}>{#if d.people[p].stretch}{formatBells(d.people[p].stretch, { signed: true })}<span class="sr-only"> {names[p]}</span>{/if}</span>
              {/each}
            {/if}
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/each}
{#if weeks.length > shown}
  <button type="button" class="btn small paper more" data-sfx="page" onclick={() => (shown += WEEKS_AT_ONCE)}>{t('kiroku.earlier')}</button>
{/if}

<style>
  .more { justify-self: center; }
  .earned { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 12px 16px; margin-bottom: 6px; }
  .earned small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .earned :global(.eb) { font-size: clamp(1.125rem, 5.6vw, var(--fs-title)); }
  .empty { text-align: center; color: var(--text-soft); font-weight: 700; }
  .week { margin-bottom: 6px; }
  h4 { display: flex; align-items: center; gap: 6px; margin: 0 4px 8px; font-size: var(--fs-body); color: var(--text-soft); }
  h4 b { margin-left: auto; font-size: var(--fs-talk); color: var(--text); }
  .rows { list-style: none; margin: 0; padding: 4px 12px; display: grid; }
  .rows li { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: 700; }
  .rows li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  /* a day: one line in shared columns (date · my goals · the partner's · ★ · the day's ベル); the line opens the day */
  .day { padding: 0 !important; }
  /* fixed columns, so the head's avatars sit over their goals and every day lines up (--mw: one GoalMarks row) */
  .rows { --mk: 15px; --mw: calc(4 * var(--mk) + 6px); }
  .day, .dbtn { display: grid !important; grid-template-columns: minmax(0, 1fr) var(--mw) var(--mw) 18px 3.2em; align-items: center; column-gap: 10px; }
  .dbtn {
    grid-column: 1 / -1;
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-align: left;
    width: 100%; min-height: 44px; padding: 4px 0;
  }
  .dbtn:active { background: var(--hl); }
  .head { min-height: 30px !important; }
  .head .pv { justify-content: center; }
  .dt { font: 700 var(--fs-body)/1.2 var(--font-num); white-space: nowrap; }
  .pv { display: flex; }
  .st { display: grid; place-items: center; line-height: 0; }
  .star { width: 18px; height: 18px; fill: var(--c-yuzu-lip); }
  .tot { font-size: var(--fs-body); white-space: nowrap; text-align: right; }
  .zero .dbtn { color: var(--text-soft); }
  /* がんばり: a second, smaller line in the same columns (the label under the date, each person's ベル under their goals) */
  .gbk, .gbv { grid-row: 2; font-size: var(--fs-s); color: var(--text-soft); line-height: 1.2; margin-top: -2px; }
  .gbk { grid-column: 1; padding-left: 1em; }
  .gbv { justify-content: center; color: var(--text); }
  @media (max-width: 359px) { .rows { padding: 4px 8px; --mk: 13px; } .day, .dbtn { column-gap: 6px; } }
</style>
