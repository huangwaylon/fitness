<script lang="ts">
  // 3.5 お金: the jar total and a step line (no axes, rung labels only), then months, newest first: the transfer
  // (✓ → ✓をはずす, either of us), the weekly yen, and the treats with their outcome (my own → なかったことに, asked first).
  import type { PersonId } from '#lib/types.ts';
  import type { MoneyLog } from '#lib/model/history.ts';
  import { RUNGS } from '#lib/config/rules.ts';
  import Avatar from '../Avatar.svelte';
  import { weekRange } from './fmt.ts';
  import { t, formatYen } from '#lib/i18n/index.ts';

  interface Props {
    log: MoneyLog;
    me: PersonId;
    villagers: Record<PersonId, string | null>;
    /** `refund`: it was paid, so voiding gives the yen back to the purse. */
    onvoid: (spendId: string | number, label: string, yen: number, refund: boolean) => void;
    onundo: (month: string) => void;
  }
  let { log, me, villagers, onvoid, onundo }: Props = $props();

  const W = 300;
  const H = 84;
  const line = $derived.by(() => {
    const pts = log.steps;
    if (pts.length === 0) return null;
    const top = Math.max(...pts.map((p) => p.totalYen), 1);
    const nextRung = RUNGS.find((r) => r.yen > top);
    const max = Math.max(top, nextRung ? Math.min(nextRung.yen, top * 1.35) : top) * 1.04;
    const x = (i: number) => (pts.length === 1 ? W : (i / (pts.length - 1)) * W);
    const y = (v: number) => H - 6 - (v / max) * (H - 12);
    let d = `M0 ${y(0)}`;
    pts.forEach((p, i) => (d += ` H${x(i).toFixed(1)} V${y(p.totalYen).toFixed(1)}`));
    const rungs = RUNGS.filter((r) => r.yen <= max).map((r) => ({ key: r.key, y: y(r.yen) }));
    return { d, rungs, area: `${d} V${H} H0Z` };
  });
  const monthLabel = (m: string) => t('kiroku.monthLabel', { y: m.slice(0, 4), m: Number(m.slice(5, 7)) });
</script>

<section class="card jar">
  <div class="tot"><span>{t('kiroku.jar')}</span><b class="money">{formatYen(log.totalYen)}</b></div>
  {#if line}
    <svg class="chart" viewBox="0 0 {W} {H}" preserveAspectRatio="none" aria-hidden="true">
      {#each line.rungs as r (r.key)}
        <line x1="0" x2={W} y1={r.y} y2={r.y} class="rung" />
      {/each}
      <path d={line.area} class="area" />
      <path d={line.d} class="step" vector-effect="non-scaling-stroke" />
    </svg>
    <div class="rl">{#each line.rungs as r (r.key)}<span style:top="{(r.y / H) * 100}%">{t('rung.' + r.key)}</span>{/each}</div>
  {/if}
  <div class="purse"><span>{t('kiroku.purse')}</span><b class="money">{formatYen(log.purseYen)}</b></div>
</section>

{#each log.months as m (m.month)}
  <section class="month">
    <h4><span>{monthLabel(m.month)}</span><b class="money">{formatYen(m.earnedYen)}</b></h4>
    <ul class="card rows">
      {#if m.transfer}
        <li class="tr">
          <span class="lbl">{t('kiroku.transfer', { yen: formatYen(m.transfer.amountYen) })}</span>
          {#if m.transfer.done}
            <span class="chip ok"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-check" /></svg>{t('kiroku.transferDone')}</span>
            <button type="button" class="mini" onclick={() => onundo(m.month)}>{t('kiroku.undoTransfer')}</button>
          {:else}
            <span class="chip">{t('kiroku.transferTodo')}</span>
          {/if}
        </li>
      {/if}
      {#each m.weeks as w (w.weekKey)}
        <li><span class="lbl money">{weekRange(w.weekKey)}</span><b class="money">{formatYen(w.yen)}</b></li>
      {/each}
      {#each m.spends as s (s.spendId)}
        <li class="sp" class:void={s.status === 'voided' || s.status === 'refused'}>
          <Avatar person={s.by} villager={villagers[s.by]} size={24} />
          <span class="lbl">{s.label}</span>
          <span class="money yen">−{formatYen(s.amountYen)}</span>
          <span class="chip {s.status}">{t(`kiroku.spend.${s.status}`)}</span>
          {#if s.by === me && (s.status === 'done' || s.status === 'waiting')}
            <button type="button" class="mini" onclick={() => onvoid(s.id, s.label, s.amountYen, s.status === 'done')}>{t('kiroku.voidSpend')}</button>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/each}

<style>
  .jar { position: relative; display: grid; gap: 8px; padding: 14px 16px; margin-bottom: 6px; }
  .tot, .purse { display: flex; align-items: baseline; justify-content: space-between; font-weight: 700; color: var(--text-soft); font-size: var(--fs-body); }
  .tot b { font-size: var(--fs-title); color: var(--text); }
  .purse b { font-size: var(--fs-talk); color: var(--text); }
  .chart { width: 100%; height: 84px; display: block; }
  .area { fill: color-mix(in srgb, var(--c-yuzu) 45%, transparent); }
  .step { fill: none; stroke: var(--c-yuzu-lip); stroke-width: 3; stroke-linejoin: round; }
  .rung { stroke: color-mix(in srgb, var(--lip) 80%, transparent); stroke-width: 1.5; stroke-dasharray: 4 4; }
  .rl { position: absolute; left: 16px; right: 16px; top: 52px; height: 84px; pointer-events: none; }
  .rl span { position: absolute; right: 0; transform: translateY(-110%); font-size: 11px; font-weight: 700; color: var(--text-soft); }
  .month { margin-bottom: 6px; }
  h4 { display: flex; justify-content: space-between; align-items: baseline; margin: 0 4px 8px; font-size: var(--fs-body); }
  h4 b { font-size: var(--fs-talk); }
  .rows { list-style: none; margin: 0; padding: 4px 14px; display: grid; }
  .rows li { display: flex; align-items: center; gap: 8px; min-height: 44px; font-size: var(--fs-s); font-weight: 700; }
  .rows li + li { box-shadow: 0 -2px 0 color-mix(in srgb, var(--lip) 40%, transparent); }
  .lbl { flex: 1; min-width: 0; font-size: var(--fs-body); }
  .lbl.money { font-size: var(--fs-body); color: var(--text-soft); }
  .rows b { font-size: var(--fs-body); }
  .yen { font-size: var(--fs-body); white-space: nowrap; }
  .void .lbl, .void .yen { color: var(--text-soft); text-decoration: line-through; }
  .chip { display: inline-flex; align-items: center; gap: 3px; padding: 3px 7px; border-radius: var(--r-chip); font-size: 11px; white-space: nowrap; background: color-mix(in srgb, var(--lip) 45%, transparent); }
  .chip svg { width: 12px; height: 12px; }
  .chip.ok, .chip.done { background: var(--c-leaf); color: var(--c-ink); }
  .chip.waiting { background: var(--c-yuzu); color: var(--c-ink); }
  .mini {
    appearance: none; border: 0; cursor: pointer; min-height: 36px; padding: 0 10px; border-radius: var(--r-btn); flex: none;
    font: 700 var(--fs-s)/1 var(--font-ui); background: var(--c-cream); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-lip);
  }
  .mini:active { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-lip); }
  @media (max-width: 359px) { .sp :global(.av) { display: none; } .rows { padding: 4px 10px; } }
</style>
