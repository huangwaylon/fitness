<script lang="ts">
  // 体重のペース (design.md "Kenkou", model/pace.ts): 体's first card, as of today whatever range the pager shows. In
  // ChartCard with the 体重 goal's chip (the same goal, the same editor). A headline (順調です, ほぼ横ばい…), the ETA or
  // why there's none, the progress from the start, one stat 「−0.4 kg/週（4週）」 with 推移 ⓘ (how it's read, and the
  // calculation 計算 from the meals and Move) and the streak. No chart (体重's carries the line), no good / bad colours, no
  // ベル, nothing on the island.
  import type { LocalDate, PersonId } from '#lib/types.ts';
  import type { Pace } from '#lib/model/pace.ts';
  import { PACE, rateShown } from '#lib/model/pace.ts';
  import { t } from '#lib/i18n/index.ts';
  import { md, monthLabel } from '#lib/i18n/format.ts';
  import ChartCard from './ChartCard.svelte';
  import ProgressBar from '../ui/ProgressBar.svelte';
  import Phrases from '../ui/Phrases.svelte';

  interface Props {
    pace: Pace;
    p: PersonId;
    today: LocalDate;
    /** The goal's setter (absent: read-only). */
    onsave?: ((v: number | null) => void) | null;
  }
  let { pace, p, today, onsave = null }: Props = $props();

  /** One decimal with a true minus: `−0.4`, `+0.2`, `±0.0`. */
  const signed = (v: number): string => {
    const r = rateShown(v); // the rounding the verdict is drawn on
    return `${r < 0 ? '−' : r > 0 ? '+' : '±'}${Math.abs(r).toFixed(1)}`;
  };
  const kg1 = (v: number) => v.toFixed(1);
  const rate = $derived(pace.stale ? null : pace.rate);

  const head = $derived.by(() => {
    if (!pace.last) return t('health.pace.noWeight');
    if (pace.stale) return t('health.pace.stale', { date: md(pace.last) });
    if (pace.goal === null) return t('health.pace.noGoal');
    if (pace.state === 'drift') return t('health.pace.drift', { dir: t(`health.pace.dir.${pace.drift}`) });
    if (pace.state) return t(`health.pace.${pace.state}`);
    return pace.calc.rate === null ? t('health.pace.fewWeight', { n: pace.need }) : t('health.pace.calcOnly', { r: signed(pace.calc.rate) });
  });
  /** The lines under it: 速め's easy pace, the ETA, or the weigh-ins still wanted under 計算's line. */
  const subs = $derived.by(() => {
    const out: string[] = [];
    if (pace.state === 'fast' && rate !== null) out.push(t('health.pace.fastSub', { r: kg1(Math.abs(rate)) }));
    if (pace.eta === 'far') out.push(t('health.pace.etaFar'));
    else if (pace.eta) out.push(t('health.pace.eta', { when: monthLabel(pace.eta, { year: pace.eta.slice(0, 4) !== today.slice(0, 4) }), goal: kg1(pace.goal!) }));
    if (!pace.state && !pace.stale && pace.goal !== null && pace.last && pace.calc.rate !== null) out.push(t('health.pace.fewWeight', { n: pace.need }));
    return out;
  });
  const gap = $derived(rate !== null && pace.calc.rate !== null && Math.abs(rate - pace.calc.rate) > PACE.gap);
  /** 推移 ⓘ's lines: how the trend is read, the calculation (or the meals it still wants), and why the two may differ. */
  const notes = $derived([
    ...(rate !== null ? [t('health.pace.note.trend')] : []),
    pace.calc.rate === null ? t('health.pace.fewDays', { n: pace.calc.days }) : t('health.pace.calc', { r: signed(pace.calc.rate), n: pace.calc.days }),
    t('health.pace.note.calc'),
    ...(gap ? [t('health.pace.note.gap')] : []),
    t('health.pace.note.water')
  ]);
  let open = $state(false);
</script>

<ChartCard id="weight" name="pace" title={t('health.pace.title')} {p} goal={pace.goal} start={pace.kg === null ? null : Math.round(pace.kg * 10) / 10} {onsave} tone="yuzu" empty={false} kind="metric">
  <div class="pc" data-pace={pace.state ?? (pace.stale ? 'stale' : 'none')}>
    <p class="h"><Phrases text={head} /></p>
    {#each subs as s (s)}<p class="sub"><Phrases text={s} /></p>{/each}
  </div>
  {#if pace.progress && !pace.stale}
    <div class="pg">
      <ProgressBar value={pace.progress.share} max={1} decor />
      <p class="sub" data-pace-progress><Phrases text={t('health.pace.progress', { d: signed(pace.progress.done), left: kg1(pace.progress.left) })} /></p>
    </div>
  {/if}
  {#if rate !== null || pace.calc.rate !== null}
    <p class="sl">
      {#if rate !== null}<b class="v" data-pace-rate>{t('health.pace.rate', { r: signed(rate) })}</b><span>{t('health.pace.window')}</span>{/if}
      <button type="button" class="est" data-sfx="tick" aria-expanded={open} aria-controls="pace-{p}-note" onclick={() => (open = !open)}>{t('health.pace.how')} ⓘ</button>
      {#if pace.streak >= PACE.streakMin}<span class="dc" data-pace-streak>{t('health.pace.streak', { n: pace.streak })}</span>{/if}
    </p>
  {/if}
  {#if open}
    <div class="foot note" id="pace-{p}-note" data-note="pace">
      {#each notes as text (text)}<p><Phrases {text} /></p>{/each}
    </div>
  {/if}
</ChartCard>

<style>
  .pc { display: grid; gap: 2px; }
  .h { margin: 0; font: 700 var(--fs-body)/1.35 var(--font-ui); color: var(--text); }
  .sub { margin: 0; font: 600 var(--fs-s)/1.4 var(--font-body); color: var(--text-soft); }
  .pg { display: grid; gap: 4px; }
  .note { display: grid; gap: 4px; }
  .note p { margin: 0; }
  /* a soft word in the stat line, its tap area 44 px tall without growing the line (BodyCard's) */
  .est { all: unset; position: relative; cursor: pointer; color: var(--text-soft); font: inherit; white-space: nowrap; }
  .est::after { content: ''; position: absolute; inset: -14px -8px; }
  .est:focus-visible { border-radius: var(--r-chip); }
</style>
