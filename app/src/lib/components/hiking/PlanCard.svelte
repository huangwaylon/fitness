<script lang="ts">
  // A trail's planned hike (the hiking app's YAMAP plan card): the date, the party, the plan's own distance and gain,
  // the hour-by-hour timeline (a leg's minutes between stops, a stay's badge), and the pace, course rating and planner.
  // The plan's link, party and planner are the `hiking` trip note's (`{p:key}`), 🔒 until it's in (docs/hiking.md).
  import Ic from './Ic.svelte';
  import type { Plan } from '#lib/hiking/types.ts';
  import { S, fmtDur, fmtParty, fmtPlanDate, span } from '#lib/hiking/strings.ts';
  import { fmtM, hrefOf, pick, render } from '../travel/text.ts';
  import { fmtKm } from '../travel/units.ts';
  import { i18n } from '#lib/i18n/index.ts';

  let { plan, note }: { plan: Plan; note: Record<string, string> | null } = $props();
  const L = $derived(i18n.locale);
  /** A private value's text, or null while locked. */
  const priv = (s: string): string | null => {
    const p = render(s, note);
    return p.length === 1 && p[0].k === 'text' ? p[0].s : null;
  };
  const href = $derived(hrefOf(plan.url, note));
  const party = $derived(priv(plan.party));
  const by = $derived(priv(plan.by));
  const rows = $derived(plan.itinerary.map((s, i) => ({ s, stay: s.depart ? span(s.time, s.depart) : 0, leg: i < plan.itinerary.length - 1 ? span(s.depart ?? s.time, plan.itinerary[i + 1].time) : null })));
</script>

{#snippet lock()}<span class="lock" role="img" aria-label={pick(S.locked, L)}>🔒 ・・・</span>{/snippet}

<section class="plan" data-plan>
  <div class="head">
    <Ic name="calendar" />
    <span class="lbl">{pick(S.secPlan, L)}</span>
    {#if href}
      <a class="yamap" {href} target="_blank" rel="noopener" aria-label={pick(S.planYamapAria, L)} data-sfx="tick" data-plan-link>{pick(S.planYamap, L)}<Ic name="ext" /></a>
    {/if}
  </div>
  <div class="date">{fmtPlanDate(plan.dateISO, L)}</div>
  <div class="chips">
    <span class="pc"><Ic name="users" />{#if party}{fmtParty(party, L)}{:else}{@render lock()}{/if}</span>
    <span class="pc"><Ic name="dist" />{fmtKm(plan.distKm)}</span>
    <span class="pc"><Ic name="gain" />{fmtM(plan.gainM)}</span>
  </div>
  <details class="tl-wrap" open>
    <summary class="tl-title" data-sfx="tick">{pick(S.secSchedule, L)}<span class="caret"><Ic name="chevDown" /></span></summary>
    <div class="meta">
      <span><Ic name="sunrise" /> {plan.sunrise}<span class="sr">{pick(S.schedRise, L)}</span></span>
      <span><Ic name="sunset" /> {plan.sunset}<span class="sr">{pick(S.schedSet, L)}</span></span>
      <span><Ic name="clock" /> {plan.totalTime}<span class="sr">{pick(S.schedTotal, L)}</span></span>
    </div>
    <ol class="tl">
      {#each rows as r, i (i)}
        <li class="stop {r.s.type}" data-stop={r.s.type}>
          <span class="dot"></span><span class="time">{r.s.time}</span>
          <span class="name">{pick(r.s.name, L)}{#if r.stay}<span class="stay">{L === 'ja' ? `滞在 ${fmtDur(r.stay, L)}` : `${fmtDur(r.stay, L)} rest`}</span>{/if}</span>
        </li>
        {#if r.leg !== null}<li class="leg"><span>{fmtDur(r.leg, L)}</span></li>{/if}
      {/each}
    </ol>
  </details>
  <div class="foot">{pick(plan.paceLabel, L)} {plan.pace}% · {pick(S.planCourse, L)} {plan.constant} · {pick(S.planBy, L)} {#if by}{by}{:else}{@render lock()}{/if}</div>
</section>

<style>
  .plan { background: linear-gradient(150deg, var(--pine-soft), rgba(31, 111, 92, .03)); border: 1px solid var(--pine-ring); border-radius: 16px; padding: 15px 16px; margin-bottom: 20px; }
  .head { display: flex; align-items: center; gap: 8px; }
  .head :global(.ic) { width: 16px; height: 16px; color: var(--pine-d); }
  .lbl { font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--pine-d); }
  .yamap {
    margin: -7px -6px -7px auto; flex-shrink: 0; display: inline-flex; align-items: center; gap: 3px; padding: 7px 10px; border-radius: 999px;
    font-size: 11.5px; font-weight: 700; color: var(--pine-d); text-decoration: none; white-space: nowrap; transition: background .15s;
  }
  .yamap :global(.ic) { width: 13px; height: 13px; }
  .yamap:active { background: var(--pine-soft); }
  .date { font-family: var(--font-display); font-size: 20px; font-weight: 600; letter-spacing: -.1px; margin: 9px 0 11px; line-height: 1.15; color: var(--ink); }
  :lang(ja) .date { font-weight: 700; }
  .chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .pc {
    display: inline-flex; align-items: center; gap: 5px; background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 5px 11px;
    font-size: 12.5px; font-weight: 700; color: var(--ink-2); white-space: nowrap; font-variant-numeric: tabular-nums;
  }
  .pc :global(.ic) { width: 14px; height: 14px; color: var(--muted); }
  .foot { font-size: 11.5px; font-weight: 600; color: var(--muted); margin-top: 12px; line-height: 1.55; }
  .lock { display: inline-block; padding: 0 6px; border-radius: 999px; background: var(--paper-2); color: var(--muted); font-size: .9em; letter-spacing: .08em; }

  .tl-wrap { margin-top: 14px; border-top: 1px solid var(--pine-ring); padding-top: 12px; }
  .tl-title { display: flex; align-items: center; gap: 6px; min-height: 28px; cursor: pointer; list-style: none; font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; color: var(--pine-d); }
  .tl-title::-webkit-details-marker { display: none; }
  .caret { margin-left: auto; display: flex; color: var(--muted); transition: transform .2s; }
  .caret :global(.ic) { width: 16px; height: 16px; }
  .tl-wrap[open] .caret { transform: rotate(180deg); }
  .meta { display: flex; flex-wrap: wrap; gap: 8px 16px; margin: 11px 0 13px; font-size: 12px; font-weight: 700; color: var(--ink-2); font-variant-numeric: tabular-nums; }
  .meta > span { display: inline-flex; align-items: center; gap: 5px; }
  .meta :global(.ic) { width: 14px; height: 14px; color: var(--muted); }
  .sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

  .tl { position: relative; list-style: none; margin: 0; padding: 0; }
  .tl::before { content: ''; position: absolute; left: 6px; top: 11px; bottom: 11px; width: 2px; background: var(--line); border-radius: 1px; }
  .stop { position: relative; display: grid; grid-template-columns: 14px 48px 1fr; align-items: center; gap: 0 11px; min-height: 26px; }
  .dot { width: 13px; height: 13px; border-radius: 50%; position: relative; z-index: 1; justify-self: start; background: var(--wpt); box-shadow: 0 0 0 3px var(--surface); }
  .pass .dot { background: var(--surface); border: 2.5px solid var(--wpt); }
  .junction .dot { width: 10px; height: 10px; margin-left: 1.5px; background: var(--surface); border: 2px solid var(--muted); }
  .start .dot { background: var(--progress); width: 14px; height: 14px; box-shadow: 0 0 0 3px var(--surface), 0 0 0 6px rgba(31, 157, 99, .16); }
  .goal .dot { background: var(--track); width: 14px; height: 14px; box-shadow: 0 0 0 3px var(--surface), 0 0 0 6px rgba(226, 73, 47, .16); }
  .time { font-size: 13px; font-weight: 800; color: var(--ink); letter-spacing: -.2px; font-variant-numeric: tabular-nums; }
  .name { font-size: 13.5px; font-weight: 600; color: var(--ink-2); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; line-height: 1.3; }
  .start .name, .goal .name, .peak .name { color: var(--ink); font-weight: 700; }
  .junction .name { color: var(--muted); }
  .stay { font-size: 10.5px; font-weight: 700; color: var(--ink-2); background: var(--surface); border: 1px solid var(--line); border-radius: 999px; padding: 1px 8px; white-space: nowrap; }
  .leg { position: relative; display: grid; grid-template-columns: 14px 1fr; gap: 0 11px; min-height: 18px; align-items: center; }
  .leg > span { grid-column: 2; font-size: 11px; font-weight: 600; color: var(--muted); font-variant-numeric: tabular-nums; }
</style>
