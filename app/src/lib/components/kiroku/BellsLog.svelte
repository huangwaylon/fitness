<script lang="ts">
  // 3.5 ベル (ADR 0019): the two pots, then the ledger by week, newest first: the Sunday bonus, the spends (my own →
  // なかったことに, asked first) and each day's ベル per person with what each fruit earned. A week shows 🔒 once it
  // locked (its days are final); a day can still change until then (late syncs, きろく edits).
  import type { FruitKey, PersonId, PotKey, WeekKey } from '#lib/types.ts';
  import type { BellsLedger, LedgerBonus, LedgerDay, LedgerSpend } from '#lib/model/history.ts';
  import { FRUITS } from '#lib/config/rules.ts';
  import { weekKeyOf } from '#lib/scoring/index.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Bells from '../ui/Bells.svelte';
  import Glyph from './Glyph.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { formatBells, t } from '#lib/i18n/index.ts';
  import { formatDate, stampOf, weekRange } from '#lib/i18n/format.ts';

  interface Props {
    ledger: BellsLedger;
    me: PersonId;
    order: PersonId[];
    names: Record<PersonId, string>;
    villagers: Record<PersonId, string | null>;
    onvoid: (spendId: string, label: string, bells: number) => void;
  }
  let { ledger, me, order, names, villagers, onvoid }: Props = $props();

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
  const potOf = (p: PotKey) => t(`pots.${p}.title`);
  const nonzero = (parts: Record<FruitKey, number>) => FRUITS.filter((f) => parts[f] > 0);
</script>

<section class="card pots">
  {#each ['treat', 'trip'] as const as p (p)}
    <div class="pot"><small>{potOf(p)}</small><Bells bells={ledger.pots[p].balance} class="pb" /></div>
  {/each}
  <p class="earned">{t('kiroku.earnedAll', { bells: formatBells(ledger.earned) })}</p>
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
          <span class="lbl">{t('pots.recent.bonus')}
            <small class="meta">{#each order as p (p)}<span>{names[p]} {formatBells(b.bonus[p], { signed: true })}</span>{/each}{#if b.bonus.duo}<span>{t('harvest.duo')} {formatBells(b.bonus.duo, { signed: true })}</span>{/if}</small>
          </span>
          <b class="money plus">{formatBells(b.bells, { signed: true })}</b>
        </li>
      {/if}
      {#each w.spends as s (s.spendId)}
        <li class="sp" class:void={s.voided}>
          <Avatar person={s.by} villager={villagers[s.by]} size={24} />
          <span class="lbl"><span>{s.label}</span><small class="meta"><span>{potOf(s.pot)}</span><span>{stampOf(s.at)}</span>{#if s.voided}<span>{t('kiroku.spend.voided')}</span>{/if}</small></span>
          <span class="money amt">{formatBells(-s.bells)}</span>
          {#if s.by === me && !s.voided}
            <button type="button" class="mini" onclick={() => onvoid(s.spendId, s.label, s.bells)}>{t('kiroku.voidSpend')}</button>
          {/if}
        </li>
      {/each}
      {#each w.days as d (d.date)}
        <li class="day" class:zero={d.bells === 0}>
          <span class="dh"><span class="dt">{formatDate(d.date)}</span><b class="money">{formatBells(d.bells, { signed: true })}</b></span>
          {#each order as p (p)}
            {@const x = d.people[p]}
            <span class="pp">
              <Avatar person={p} villager={villagers[p]} size={22} />
              <span class="sr-only">{names[p]}</span>
              <span class="parts">
                {#each nonzero(x.parts) as f (f)}
                  <span class="part" title={t(`fruit.${f}`)}><OfficialArt key={fruitArt(f)} size={16} /><span class="sr-only">{t(`fruit.${f}`)}</span><span class="money">{x.parts[f]}</span></span>
                {:else}<span class="none">—</span>{/each}
              </span>
              <span class="money pt">{formatBells(x.bells)}</span>
            </span>
          {/each}
        </li>
      {/each}
    </ul>
  </section>
{/each}

<style>
  .pots { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px 12px; padding: 14px 16px; margin-bottom: 6px; }
  .pot { display: grid; gap: 4px; min-width: 0; }
  .pot small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .pot :global(.pb) { font-size: clamp(1.125rem, 5.6vw, var(--fs-title)); }
  .earned { grid-column: 1 / -1; margin: 4px 0 0; font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .empty { text-align: center; color: var(--text-soft); font-weight: 700; }
  .week { margin-bottom: 6px; }
  h4 { display: flex; align-items: center; gap: 6px; margin: 0 4px 8px; font-size: var(--fs-body); color: var(--text-soft); }
  h4 b { margin-left: auto; font-size: var(--fs-talk); color: var(--text); }
  .rows { list-style: none; margin: 0; padding: 4px 14px; display: grid; }
  .rows li { display: flex; align-items: center; gap: 8px; min-height: 44px; font-weight: 700; }
  /* a spend: the label block, the amount, then なかったことに (wraps under them on a narrow phone) */
  .sp { flex-wrap: wrap; align-content: flex-start; row-gap: 4px; padding: 4px 0 8px; }
  .sp .lbl { flex: 1 1 9em; }
  .rows li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .lbl { flex: 1; min-width: 0; display: grid; gap: 2px; font-size: var(--fs-body); padding: 6px 0; }
  .lbl small { font-size: var(--fs-s); color: var(--text-soft); }
  /* meta parts never break inside a name or an amount; they wrap between parts */
  .meta { display: flex; flex-wrap: wrap; gap: 0 8px; }
  .meta > span { white-space: nowrap; }
  .bi { width: 24px; flex: none; line-height: 0; }
  .plus { font-size: var(--fs-body); color: var(--c-leaf-lip); white-space: nowrap; }
  :global(:root[data-tod='night']) .plus { color: var(--c-leaf); }
  .amt { font-size: var(--fs-body); white-space: nowrap; }
  .void .lbl, .void .amt { color: var(--text-soft); }
  .void .amt, .void .lbl > :first-child { text-decoration: line-through; }
  .mini {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); min-width: var(--hit); padding: 0 10px; border-radius: var(--r-btn); flex: none;
    font: 700 var(--fs-s)/1 var(--font-ui); background: var(--ctl); color: var(--text); box-shadow: var(--sh-ctl); white-space: nowrap; margin-left: auto;
  }
  .mini:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  /* a day: the date and the pair's total, then one line per person: villager, the fruit that earned, their total */
  .day { flex-direction: column; align-items: stretch !important; gap: 2px !important; padding: 8px 0; }
  .dh { display: flex; justify-content: space-between; align-items: baseline; font-size: var(--fs-body); }
  .dh b { font-size: var(--fs-body); }
  .zero .dh, .zero .pp { color: var(--text-soft); }
  .pp { display: flex; align-items: center; gap: 8px; min-height: 28px; font-size: var(--fs-s); }
  .parts { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 2px 8px; }
  .part { display: inline-flex; align-items: center; gap: 2px; line-height: 1; }
  .part .money { font-size: var(--fs-s); }
  .none { color: var(--text-soft); }
  .pt { font-size: var(--fs-s); white-space: nowrap; color: var(--text-soft); }
  @media (max-width: 359px) { .sp :global(.av) { display: none; } .rows { padding: 4px 10px; } }
</style>
