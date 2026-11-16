<script lang="ts">
  // ききみみ クイズ's きろく (docs/kikimimi.md "Progress & feedback" UI), its own lazy chunk: スピード はしご's measure once a
  // ladder's been climbed (the fastest comfortable speed over one bar a rung), the first-listen trend (the last 5 games'
  // mean, its change, a 12-point sparkline), this week's days (7 dots, never a streak), the together summary and the
  // details (per type, accent and level: one table) folded; with no game yet, a hello and 「あそぶ」. No stage, level
  // estimate or skill bars. Mine alone: the record sends the others only a summary (contract/guest.ts rowsFor).
  import type { Report } from '#lib/kikimimi/report.ts';
  import { SPEED_MIN } from '#lib/kikimimi/progress.ts';
  import type { Accent, ItemType } from '#lib/kikimimi/bank.ts';
  import { SPEEDS } from '#lib/kikimimi/ladder.ts';
  import { levelMark, sx } from './look.ts';
  import { t } from '#lib/i18n/index.ts';
  import Icon from '../ui/Icon.svelte';

  let { report, onplay }: { report: Report; onplay: () => void } = $props();
  const s = $derived(report.stats);
  const pct = (x: number) => Math.round(x * 100);
  // the sparkline: first-listen accuracy per game, 0-100 % on a fixed scale (one axis), the last point marked
  const W = 120, H = 36, PAD = 5;
  const pts = $derived(report.trend.map((y, i, a) => [a.length > 1 ? PAD + (i * (W - 2 * PAD)) / (a.length - 1) : W / 2, H - PAD - y * (H - 2 * PAD)] as const));
  const path = $derived(pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '));
  const delta = $derived(report.recent.delta === null ? null : Math.round(report.recent.delta * 100));
  const daysN = $derived(report.days.filter(Boolean).length);
  const TYPES: readonly ItemType[] = ['pic', 'word', 'num', 'reply', 'mean', 'gist', 'next'];
  const ACCENTS: readonly Accent[] = ['us', 'uk', 'au'];
  const levels = $derived(Object.keys(s.byLevel).map(Number).sort());
  /** くわしく's sections: per type, per accent, per level (each a sub-header row in the one table). */
  const details = $derived([
    ['byType', TYPES.filter((x) => s.byType[x]).map((x) => [t(`kiki.type.${x}`), s.byType[x]!] as const)],
    ['byAccent', ACCENTS.filter((x) => s.byAccent[x]).map((x) => [t(`kiki.accent.${x}`), s.byAccent[x]!] as const)],
    ['byLevel', levels.map((x) => [x <= 4 ? `★${x}` : `${levelMark(x)} ${t(`kiki.lv.${x}`)}`, s.byLevel[x]!] as const)]
  ] as const);
</script>

<div class="prog" data-kiki-progress>
  {#if !report.games.length}
    <p class="hello card kana">{t('kiki.prog.empty')}</p>
    <!-- nothing yet (a guest's first visit, a new phone): the way to a first game -->
    <button type="button" class="btn" data-kiki-prog-play data-sfx="tick" onclick={onplay}>{t('kiki.tile.asobu')}</button>
  {:else}
    {#if report.speed.ladders}
      {@const sp = report.speed}
      <!-- スピード はしご: the fastest comfortable speed, and one bar a rung (the share of recent ladders that climbed it) -->
      <section class="tile card" aria-labelledby="kp-speed" data-kiki-speed={sp.comfort ?? ''}>
        <h3 id="kp-speed" class="sec-label in">{t('kiki.prog.speed')}</h3>
        <p class="stage">{sp.measuring ? (sp.best ? t('kiki.prog.speedBest', { x: sx(sp.best) }) : t('kiki.prog.speedLow')) : sp.comfort ? t('kiki.prog.speedLine', { x: sx(sp.comfort) }) : t('kiki.prog.speedLow')}</p>
        <ul class="bars rungs">
          {#each SPEEDS as x, k (k)}
            <li data-rung={k + 1} data-m={pct(sp.reach[k])}>
              <span class="bl">{sx(x)}×</span>
              <span class="track" aria-hidden="true"><i style:width="{Math.max(3, pct(sp.reach[k]))}%"></i></span>
              <span class="bv">{t('kiki.prog.pct', { pct: pct(sp.reach[k]) })}</span>
            </li>
          {/each}
        </ul>
        <p class="note">{sp.measuring ? t('kiki.prog.speedMeasuring', { n: SPEED_MIN - sp.ladders }) : `${t('kiki.prog.speedSub', { n: sp.recent })}${sp.best ? ` · ${t('kiki.prog.speedBest', { x: sx(sp.best) })}` : ''}`}</p>
      </section>
    {/if}


    <div class="pair">
      <!-- the trend: a stat tile with a sparkline -->
      <section class="tile card" aria-labelledby="kp-trend" data-kiki-trend>
        <h3 id="kp-trend" class="sec-label in">{t('kiki.prog.trend')}</h3>
        <p class="big">{report.recent.now === null ? '–' : t('kiki.prog.pct', { pct: pct(report.recent.now) })}</p>
        {#if pts.length > 1}
          <svg class="spark" viewBox="0 0 {W} {H}" role="img" aria-label={report.trend.map((y) => `${pct(y)}%`).join(', ')}>
            <line x1={PAD} x2={W - PAD} y1={H - PAD} y2={H - PAD} class="base" />
            <path d={path} />
            <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="4" />
          </svg>
        {/if}
        <p class="note">{delta === null ? t('kiki.prog.trendSub', { n: report.trend.length }) : t('kiki.prog.trendDelta', { d: `${delta >= 0 ? '+' : '−'}${Math.abs(delta)}` })}</p>
      </section>
      <!-- this week: 7 dots, never a streak -->
      <section class="tile card" aria-labelledby="kp-week" data-kiki-week={daysN}>
        <h3 id="kp-week" class="sec-label in">{t('kiki.prog.week')}</h3>
        <ol class="days">
          {#each report.days as on, i (i)}<li class:on aria-label="{t(`kiki.day.${i}`)} {on ? '✓' : ''}"><span aria-hidden="true">{t(`kiki.day.${i}`)}</span></li>{/each}
        </ol>
        <p class="note">{t('kiki.prog.weekN', { n: daysN, m: report.minutes })}</p>
      </section>
    </div>

    {#if report.together.partner}
      <section class="tile card together" aria-labelledby="kp-two" data-kiki-together>
        <h3 id="kp-two" class="sec-label in">{t('kiki.prog.together')}</h3>
        <p>{t('kiki.prog.togetherLine', { n: report.together.games, m: report.together.minutes })}</p>
      </section>
    {/if}

    <details class="card more">
      <summary data-sfx="tick">{t('kiki.prog.details')}<span class="chev"><Icon name="chevron-down" size={18} /></span></summary>
      <!-- one table: a single header row, each kind a sub-header row, so the columns line up -->
      <table data-kiki-details>
        <thead><tr><td></td><th scope="col">{t('kiki.prog.colRight')}</th><th scope="col">{t('kiki.prog.colFirst')}</th><th scope="col">{t('kiki.prog.colN')}</th></tr></thead>
        {#each details as [key, rows] (key)}
          <tbody>
            <tr class="sub"><th scope="rowgroup" colspan="4">{t(`kiki.prog.${key}`)}</th></tr>
            {#each rows as [name, a] (name)}
              <tr><th scope="row">{name}</th><td>{t('kiki.prog.pct', { pct: pct(a.right) })}</td><td class="soft">{t('kiki.prog.pct', { pct: pct(a.first) })}</td><td class="soft">{a.n}</td></tr>
            {/each}
          </tbody>
        {/each}
      </table>
    </details>
    <p class="hint center"><Icon name="lock" size={14} stroke={2.4} /> {t('kiki.prog.private')}</p>
  {/if}
</div>

<style>
  .prog { display: grid; gap: 14px; --bar: var(--c-bar); --bar-track: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  /* night's navy card: the lighter leaf (≥ 3:1 there; the day's #3E9E4C passes the dataviz checks on cream) */
  :global(:root[data-tod='night']) .prog { --bar: var(--c-leaf); }
  .hello { margin: 0; padding: 10px 14px; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .sec-label.in { margin: 0; }
  .tile { display: grid; gap: 6px; padding: 12px 14px; align-content: start; }
  .stage { margin: 0; display: flex; align-items: baseline; gap: 8px; font: 700 var(--fs-title)/1.2 var(--font-ui); }
  .note { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .bars { list-style: none; margin: 0; padding: 12px 14px; display: grid; gap: 10px; }
  .bars li { display: grid; grid-template-columns: 7.5em 1fr 3em; align-items: center; gap: 10px; }
  .bl { font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .track { height: 12px; border-radius: 0 4px 4px 0; background: var(--bar-track); }
  .track i { display: block; height: 100%; border-radius: 0 4px 4px 0; background: var(--bar); }
  .bv { font: 700 var(--fs-s)/1 var(--font-num); text-align: right; color: var(--text); }
  .bars.rungs { padding: 4px 0; gap: 8px; }
  .rungs li { grid-template-columns: 3em 1fr 3em; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; align-items: start; }
  .big { margin: 0; font: 700 28px/1.1 var(--font-num); }
  .spark { width: 100%; height: 36px; overflow: visible; }
  .spark path { fill: none; stroke: var(--bar); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .spark circle { fill: var(--bar); stroke: var(--card); stroke-width: 2; }
  .spark .base { stroke: var(--bar-track); stroke-width: 1; }
  .days { list-style: none; margin: 4px 0 0; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .days li { aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; box-shadow: inset 0 0 0 2px var(--bar-track); font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .days li.on { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); color: var(--c-ink); }
  .together p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .more { padding: 0 14px; }
  .more summary { cursor: pointer; min-height: var(--hit); display: flex; align-items: center; justify-content: space-between; font: 700 var(--fs-body)/1.2 var(--font-ui); list-style: none; }
  .more summary::-webkit-details-marker { display: none; }
  .more .chev { display: grid; color: var(--text-soft); transition: rotate var(--dur-quick); }
  .more[open] .chev { rotate: 180deg; }
  .more table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font: 700 var(--fs-s)/1.6 var(--font-ui); }
  .more th { text-align: left; font-weight: 700; }
  .more thead th { text-align: right; font-size: var(--fs-xs); color: var(--text-soft); white-space: nowrap; padding-left: 8px; }
  .more .sub th { color: var(--text-soft); padding: 10px 0 2px; }
  .more tbody:first-of-type .sub th { padding-top: 2px; }
  .more td { text-align: right; font-family: var(--font-num); width: 4.5em; }
  .more td.soft { color: var(--text-soft); }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .center { text-align: center; }
</style>
