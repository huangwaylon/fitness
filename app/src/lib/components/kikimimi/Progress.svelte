<script lang="ts">
  // ききみみ クイズ's きろく (docs/kikimimi.md "Progress & feedback" UI), the lobby's second tab, its own lazy chunk: my
  // stage (a stat tile: the curriculum's stage, its CEFR and a meter of how far into it), the sub-skills as horizontal
  // bars (mastery, one hue, the value at the bar's end; unmeasured an empty track with 「まだ」), the first-listen trend
  // (the last 5 games' mean, its change, a 12-point sparkline), this week's days (7 dots, never a streak), the
  // recommendations each with its start, the couple summary (games together and both people's minutes, never a level;
  // not on the guest's phone) and the details (per type, accent and level) folded. Mine alone: the record sends the
  // partner only a summary (contract/guest.ts rowsFor).
  import type { Report } from '#lib/kikimimi/report.ts';
  import type { Rec } from '#lib/kikimimi/advice.ts';
  import { stageOf } from '#lib/kikimimi/progress.ts';
  import { SKILLS } from '#lib/kikimimi/tags.ts';
  import type { Accent, ItemType } from '#lib/kikimimi/bank.ts';
  import Host from '../characters/Host.svelte';
  import { recWords } from './progress.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { report, guest, canStart, onstart }: { report: Report; guest: boolean; canStart: boolean; onstart: (r: Rec) => void } = $props();
  const s = $derived(report.stats);
  const stage = $derived(s.level === null ? null : stageOf(s.level));
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
</script>

<div class="prog" data-kiki-progress>
  {#if !report.games.length}
    <div class="hello card">
      <span class="host" aria-hidden="true"><Host head size={52} animate={false} eager /></span>
      <p>{t('kiki.prog.empty')}</p>
    </div>
  {:else}
    <!-- the stage: a stat tile with a meter -->
    <section class="tile card" aria-labelledby="kp-level" data-kiki-stage={stage?.stage.id}>
      <h3 id="kp-level" class="sec-label in">{t('kiki.prog.level')}</h3>
      {#if stage}
        <p class="stage"><span class="stars" aria-hidden="true">{'★'.repeat(stage.stage.stars)}</span>{t(`kiki.stage.${stage.stage.id}`)}<small>{stage.stage.cefr}</small></p>
        <div class="meter" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow={pct(stage.into)} aria-label={t(`kiki.stage.${stage.stage.id}`)}><i style:width="{Math.max(4, pct(stage.into))}%"></i></div>
        <p class="note">{s.measuring ? t('kiki.prog.measuring', { n: 16 - s.answers }) : t('kiki.prog.comfort', { lv: Math.round(s.level!) })}</p>
      {/if}
    </section>

    <!-- what to practise next -->
    <section class="sec" aria-labelledby="kp-rec" data-kiki-recs>
      <h3 id="kp-rec" class="sec-label">{t('kiki.rec.title')}</h3>
      {#if report.recs.length}
        <ul class="recs">
          {#each report.recs as r, i (i)}
            {@const x = recWords(r)}
            <li class="rec card" data-rec={r.kind}>
              <div class="rt"><b>{x.title}</b><small>{x.why}</small></div>
              {#if canStart}<button type="button" class="btn small" data-kiki-rec-start={r.kind} data-sfx="confirm" onclick={() => onstart(r)}>{t('kiki.rec.start')}</button>{/if}
            </li>
          {/each}
        </ul>
      {:else}<p class="hint">{t('kiki.rec.none')}</p>{/if}
    </section>

    <!-- the sub-skills: one series of horizontal bars, labelled directly -->
    <section class="sec" aria-labelledby="kp-skills">
      <h3 id="kp-skills" class="sec-label">{t('kiki.prog.skills')}</h3>
      <ul class="bars card" data-kiki-skills>
        {#each SKILLS as k (k)}
          {@const m = s.skills[k].m}
          <li data-skill={k} data-m={m === null ? '' : pct(m)}>
            <span class="bl">{t(`kiki.skill.${k}`)}</span>
            <span class="track" aria-hidden="true">{#if m !== null}<i style:width="{Math.max(3, pct(m))}%"></i>{/if}</span>
            <span class="bv">{m === null ? t('kiki.prog.notYet') : t('kiki.prog.pct', { pct: pct(m) })}</span>
          </li>
        {/each}
      </ul>
    </section>

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

    {#if !guest && report.together.partner}
      <section class="tile card together" aria-labelledby="kp-two" data-kiki-together>
        <h3 id="kp-two" class="sec-label in">{t('kiki.prog.together')}</h3>
        <p>{t('kiki.prog.togetherLine', { n: report.together.games, m: report.together.minutes })}</p>
      </section>
    {/if}

    <details class="card more">
      <summary data-sfx="tick">{t('kiki.prog.details')}</summary>
      {#each [['byType', TYPES.filter((x) => s.byType[x]).map((x) => [t(`kiki.type.${x}`), s.byType[x]!] as const)], ['byAccent', ACCENTS.filter((x) => s.byAccent[x]).map((x) => [t(`kiki.accent.${x}`), s.byAccent[x]!] as const)], ['byLevel', levels.map((x) => [`★${x}`, s.byLevel[x]!] as const)]] as const as [key, rows] (key)}
        <table>
          <caption>{t(`kiki.prog.${key}`)}</caption>
          <tbody>
            {#each rows as [name, a] (name)}
              <tr><th scope="row">{name}</th><td>{t('kiki.prog.pct', { pct: pct(a.right) })}</td><td class="soft">1× {t('kiki.prog.pct', { pct: pct(a.first) })}</td><td class="soft">{t('kiki.prog.n', { n: a.n })}</td></tr>
            {/each}
          </tbody>
        </table>
      {/each}
    </details>
    <p class="hint center">🔒 {t('kiki.prog.private')}</p>
  {/if}
</div>

<style>
  .prog { display: grid; gap: 14px; --bar: #3E9E4C; --bar-track: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  /* night's navy card: the lighter leaf (≥ 3:1 there; the day's #3E9E4C passes the dataviz checks on cream) */
  :global(:root[data-tod='night']) .prog { --bar: var(--c-leaf); }
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .hello { display: flex; align-items: center; gap: 12px; padding: 10px 14px; }
  .hello p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .host { flex: none; line-height: 0; }
  .sec { display: grid; gap: 8px; }
  .sec-label.in { margin: 0; }
  .tile { display: grid; gap: 6px; padding: 12px 14px; align-content: start; }
  .stage { margin: 0; display: flex; align-items: baseline; gap: 8px; font: 700 var(--fs-title)/1.2 var(--font-ui); }
  .stage small { font-size: var(--fs-s); color: var(--text-soft); }
  .stars { color: var(--c-coral); font-size: var(--fs-s); letter-spacing: 1px; }
  .meter { height: 10px; border-radius: var(--r-pill); background: var(--bar-track); overflow: hidden; }
  .meter i { display: block; height: 100%; border-radius: 0 4px 4px 0; background: var(--bar); }
  .note { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .recs { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .rec { display: flex; align-items: center; gap: 10px; padding: 10px 10px 10px 14px; }
  .rt { flex: 1; min-width: 0; display: grid; gap: 2px; }
  .rt b { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .rt small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .rec .btn { flex: none; width: auto; min-height: var(--hit); margin-bottom: var(--lip-h); }
  .bars { list-style: none; margin: 0; padding: 12px 14px; display: grid; gap: 10px; }
  .bars li { display: grid; grid-template-columns: 7.5em 1fr 3em; align-items: center; gap: 10px; }
  .bl { font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .track { height: 12px; border-radius: 0 4px 4px 0; background: var(--bar-track); }
  .track i { display: block; height: 100%; border-radius: 0 4px 4px 0; background: var(--bar); }
  .bv { font: 700 var(--fs-s)/1 var(--font-num, var(--font-ui)); text-align: right; color: var(--text); }
  li[data-m=''] .bv { color: var(--text-soft); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .big { margin: 0; font: 700 28px/1.1 var(--font-num, var(--font-ui)); }
  .spark { width: 100%; height: 36px; overflow: visible; }
  .spark path { fill: none; stroke: var(--bar); stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
  .spark circle { fill: var(--bar); stroke: var(--card); stroke-width: 2; }
  .spark .base { stroke: var(--bar-track); stroke-width: 1; }
  .days { list-style: none; margin: 4px 0 0; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 3px; }
  .days li { aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; box-shadow: inset 0 0 0 2px var(--bar-track); font: 700 11px/1 var(--font-ui); color: var(--text-soft); }
  .days li.on { background: var(--bar); box-shadow: none; color: var(--c-card); }
  .together p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .more { padding: 0 14px; }
  .more summary { cursor: pointer; min-height: var(--hit); display: flex; align-items: center; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .more table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font: 700 var(--fs-s)/1.6 var(--font-ui); }
  .more caption { text-align: left; color: var(--text-soft); padding: 4px 0; }
  .more th { text-align: left; font-weight: 700; }
  .more td { text-align: right; font-family: var(--font-num, var(--font-ui)); }
  .more td.soft { color: var(--text-soft); }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .center { text-align: center; }
</style>
