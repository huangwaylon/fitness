<script lang="ts">
  // 3.5 ベル, the passbook (round 17 IA §4.7, like NH's ATM statement): everything ever saved, then the ledger by week,
  // newest first, each with its total (the home of the week's ベル): the Sunday bonus, the spends (my own → とりけす,
  // asked first) and one line per day (each person's ベル and the pair's; tap → the day, where the per-fruit ベル
  // live). A week shows 🔒 once it locked (its days are final); a day can still change until then.
  import type { PersonId, WeekKey } from '#lib/types.ts';
  import type { BellsLedger, LedgerBonus, LedgerDay, LedgerSpend } from '#lib/model/history.ts';
  import { weekKeyOf } from '#lib/time/dates.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Bells from '../ui/Bells.svelte';
  import Glyph from './Glyph.svelte';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { stampOf, weekRange } from '#lib/i18n/format.ts';
  import { dayTitle } from './fmt.ts';

  interface Props {
    ledger: BellsLedger;
    me: PersonId;
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    onvoid: (spendId: string, label: string, bells: number) => void;
    onday: (date: string) => void;
  }
  let { ledger, me, order, names, villagers, onvoid, onday }: Props = $props();

  const tokyoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' });
  interface Week { weekKey: WeekKey; days: LedgerDay[]; bonus: LedgerBonus | null; spends: LedgerSpend[]; bells: number; locked: boolean }
  const weeks = $derived.by((): Week[] => {
    const m = new Map<WeekKey, Week>();
    const get = (wk: WeekKey) => m.get(wk) ?? m.set(wk, { weekKey: wk, days: [], bonus: null, spends: [], bells: 0, locked: false }).get(wk)!;
    for (const d of ledger.days) {
      const w = get(d.weekKey);
      w.days.push(d);
      w.bells += d.bells;
      w.locked = d.locked;
    }
    for (const b of ledger.bonuses) {
      const w = get(b.weekKey);
      w.bonus = b;
      w.bells += b.bells;
    }
    for (const s of ledger.spends) get(weekKeyOf(tokyoDate.format(new Date(s.at)))).spends.push(s);
    return [...m.values()].sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  });
</script>

<section class="card earned">
  <small>{t('kiroku.earnedAll')}</small>
  <Bells bells={ledger.earned} class="eb" />
</section>

{#if !weeks.length}<p class="empty">{t('kiroku.empty')}</p>{/if}

{#each weeks as w (w.weekKey)}
  <section class="week">
    <h4>
      <span class="money">{weekRange(w.weekKey)}</span>
      {#if w.locked}<Glyph kind="lock" size={14} label={t('kiroku.locked')} />{/if}
      <b class="money">{formatBells(w.bells, { signed: true })}</b>
    </h4>
    <ul class="card rows">
      {#if w.bonus && w.bonus.bells > 0}
        {@const b = w.bonus}
        <li class="bonus">
          <span class="bi" aria-hidden="true"><OfficialArt key="money/miles" size={24} /></span>
          <span class="lbl">{t('kiroku.bonus')}
            <small class="meta">{#each order as p (p)}<span>{names[p]} {formatBells(b.bonus[p], { signed: true })}</span>{/each}{#if b.bonus.duo}<span>{t('harvest.duo')} {formatBells(b.bonus.duo, { signed: true })}</span>{/if}</small>
          </span>
          <b class="money plus">{formatBells(b.bells, { signed: true })}</b>
        </li>
      {/if}
      {#each w.spends as s (s.spendId)}
        <li class="sp" class:void={s.voided}>
          <Avatar person={s.by} villager={villagers[s.by]} size={24} />
          <span class="lbl"><span>{s.label}</span><small class="meta"><span>{stampOf(s.at)}</span>{#if s.voided}<span>{t('kiroku.spend.voided')}</span>{/if}</small></span>
          <span class="money amt">{formatBells(-s.bells)}</span>
          {#if s.by === me && !s.voided}
            <button type="button" class="mini" data-sfx="page" onclick={() => onvoid(s.spendId, s.label, s.bells)}>{t('kiroku.voidSpend')}</button>
          {/if}
        </li>
      {/each}
      {#each w.days as d (d.date)}
        <li class="day" class:zero={d.bells === 0}>
          <button type="button" class="dbtn" data-sfx="page" onclick={() => onday(d.date)}>
            <span class="dt">{dayTitle(d.date)}</span>
            <span class="pp">
              {#each order as p (p)}
                <span class="pv"><Avatar person={p} villager={villagers[p]} size={20} /><span class="sr-only">{names[p]}</span><span class="money">{formatNum(d.people[p].bells)}</span></span>
              {/each}
            </span>
            <b class="money">{formatBells(d.bells, { signed: true })}</b>
          </button>
        </li>
      {/each}
    </ul>
  </section>
{/each}

<style>
  .earned { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 12px 16px; margin-bottom: 6px; }
  .earned small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .earned :global(.eb) { font-size: clamp(1.125rem, 5.6vw, var(--fs-title)); }
  .empty { text-align: center; color: var(--text-soft); font-weight: 700; }
  .week { margin-bottom: 6px; }
  h4 { display: flex; align-items: center; gap: 6px; margin: 0 4px 8px; font-size: var(--fs-body); color: var(--text-soft); }
  h4 b { margin-left: auto; font-size: var(--fs-talk); color: var(--text); }
  .rows { list-style: none; margin: 0; padding: 4px 14px; display: grid; }
  .rows li { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: 700; }
  /* a spend: the label block, the amount, then とりけす (wraps under them on a narrow phone) */
  .sp { flex-wrap: wrap; align-content: flex-start; row-gap: 4px; padding: 4px 0 8px; }
  .sp .lbl { flex: 1 1 6em; }
  .rows li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .lbl { flex: 1; min-width: 0; display: grid; gap: 2px; font-size: var(--fs-body); padding: 6px 0; }
  .lbl small { font-size: var(--fs-s); color: var(--text-soft); }
  /* meta parts never break inside a name or an amount; they wrap between parts */
  .meta { display: flex; flex-wrap: wrap; gap: 0 8px; }
  .meta > span { white-space: nowrap; }
  .bi { width: 24px; flex: none; line-height: 0; }
  .plus { font-size: var(--fs-body); color: var(--leaf-text); white-space: nowrap; }
  .amt { font-size: var(--fs-body); white-space: nowrap; }
  .void .lbl, .void .amt { color: var(--text-soft); }
  .void .amt, .void .lbl > :first-child { text-decoration: line-through; }
  .mini {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); min-width: var(--hit); padding: 0 10px; border-radius: var(--r-btn); flex: none;
    font: 700 var(--fs-s)/1 var(--font-ui); background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); white-space: nowrap; margin-left: auto;
  }
  .mini:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  /* a day: one line (date · each person's ベル · the pair's), the whole line opens the day */
  .day { padding: 0 !important; }
  .dbtn {
    appearance: none; border: 0; background: none; font: inherit; color: inherit; cursor: pointer; text-align: left;
    display: flex; align-items: center; gap: 8px; width: 100%; min-height: 44px; padding: 4px 0;
  }
  .dbtn:active { background: var(--hl); }
  .dt { width: 5.4em; flex: none; font: 700 var(--fs-body)/1.2 var(--font-num); }
  .pp { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 2px 10px; }
  .pv { display: inline-flex; align-items: center; gap: 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .pv .money { font-size: var(--fs-s); }
  .dbtn b { font-size: var(--fs-body); white-space: nowrap; }
  .zero .dbtn { color: var(--text-soft); }
  @media (max-width: 359px) { .sp :global(.av) { display: none; } .rows { padding: 4px 10px; } }
</style>
