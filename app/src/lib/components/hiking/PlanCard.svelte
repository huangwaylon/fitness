<script lang="ts">
  // A trail's planned hike (Kinpu's YAMAP plan) on a dense card: the date, the party, the plan's own distance and gain,
  // the hour-by-hour timeline (a leg's minutes between stops, a stay's badge), and the pace, course rating and planner.
  // The plan's link, party and planner are the `hiking` trip note's (`{p:key}`), locked until it's in (docs/hiking.md).
  import Icon from '../ui/Icon.svelte';
  import type { Plan } from '#lib/hiking/types.ts';
  import { S, fmtDur, fmtParty, fmtPlanDate, span } from '#lib/hiking/strings.ts';
  import { fmtM, hrefOf, pick, render } from '../travel/text.ts';
  import { fmtKm } from '../travel/units.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { dayKey } from '#lib/time/clock.ts';

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
  /** A plan whose day has gone by is the day it was hiked (山行日), not one to come (山行予定). */
  const past = $derived(plan.dateISO < dayKey());
  const rows = $derived(plan.itinerary.map((s, i) => ({ s, stay: s.depart ? span(s.time, s.depart) : 0, leg: i < plan.itinerary.length - 1 ? span(s.depart ?? s.time, plan.itinerary[i + 1].time) : null })));
</script>

{#snippet lock()}<span class="lock" role="img" aria-label={pick(S.locked, L)}><Icon name="lock" size={13} />・・・</span>{/snippet}

<section class="card dense plan" data-plan>
  <div class="head">
    <Icon name="calendar" size={16} />
    <span class="lbl" data-plan-past={past || undefined}>{pick(past ? S.secPlanPast : S.secPlan, L)}</span>
    {#if href}
      <a class="yamap" {href} target="_blank" rel="noopener noreferrer" aria-label={pick(S.planYamapAria, L)} data-sfx="open" data-plan-link>{pick(S.planYamap, L)}<Icon name="arrow-up-right" size={14} /></a>
    {/if}
  </div>
  <div class="date">{fmtPlanDate(plan.dateISO, L)}</div>
  <div class="figs">
    <span class="tag"><Icon name="users" size={14} />{#if party}{fmtParty(party, L)}{:else}{@render lock()}{/if}</span>
    <span class="tag"><Icon name="distance" size={14} />{fmtKm(plan.distKm)}</span>
    <span class="tag"><Icon name="mountain" size={14} />{fmtM(plan.gainM)}</span>
  </div>
  <details class="tl-wrap" open>
    <summary class="tl-title" data-sfx="tick">{pick(S.secSchedule, L)}<span class="caret"><Icon name="chevron-down" size={16} /></span></summary>
    <div class="meta">
      <span><Icon name="sunrise" size={14} /> {plan.sunrise}<span class="sr-only">{pick(S.schedRise, L)}</span></span>
      <span><Icon name="sunset" size={14} /> {plan.sunset}<span class="sr-only">{pick(S.schedSet, L)}</span></span>
      <span><Icon name="clock" size={14} /> {plan.totalTime}<span class="sr-only">{pick(S.schedTotal, L)}</span></span>
    </div>
    <ol class="tl">
      {#each rows as r, i (i)}
        <li class="stop {r.s.type}" data-stop={r.s.type}>
          <span class="dot"></span><span class="time">{r.s.time}</span>
          <span class="name">{pick(r.s.name, L)}{#if r.stay}<span class="tag stay">{L === 'ja' ? `滞在 ${fmtDur(r.stay, L)}` : `${fmtDur(r.stay, L)} rest`}</span>{/if}</span>
        </li>
        {#if r.leg !== null}<li class="leg"><span>{fmtDur(r.leg, L)}</span></li>{/if}
      {/each}
    </ol>
  </details>
  <div class="foot">{pick(plan.paceLabel, L)} {plan.pace}% · {pick(S.planCourse, L)} {plan.constant} · {pick(S.planBy, L)} {#if by}{by}{:else}{@render lock()}{/if}</div>
</section>

<style>
  .card.plan { flex: none; padding: 10px 12px 12px; }
  .head { display: flex; align-items: center; gap: 6px; min-height: 24px; color: var(--leaf-text); }
  .lbl { font: 700 var(--fs-xs)/1.2 var(--font-ui); }
  .yamap {
    position: relative; margin-left: auto; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--leaf-text); text-decoration: none;
  }
  /* a 44px tap target on the small link */
  .yamap::after { content: ''; position: absolute; inset: -12px -8px; }
  .date { margin: 4px 0 8px; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .figs { display: flex; flex-wrap: wrap; gap: 6px; }
  .figs .tag { font: 600 var(--fs-s)/1.4 var(--font-num); color: var(--text); padding: 3px 8px; }
  .lock { display: inline-flex; align-items: center; gap: 2px; color: var(--text-soft); letter-spacing: .08em; }
  .foot { margin-top: 10px; font-size: var(--fs-s); color: var(--text-soft); line-height: 1.5; }

  .tl-wrap { margin-top: 10px; border-top: 1.5px dashed var(--stitch); padding-top: 8px; }
  .tl-title { display: flex; align-items: center; min-height: 32px; cursor: pointer; list-style: none; font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .tl-title::-webkit-details-marker { display: none; }
  .caret { margin-left: auto; display: flex; transition: transform var(--dur-quick); }
  .tl-wrap[open] .caret { transform: rotate(180deg); }
  .meta { display: flex; flex-wrap: wrap; gap: 6px 14px; margin: 2px 0 10px; font: 600 var(--fs-s)/1.2 var(--font-num); color: var(--text); }
  .meta > span { display: inline-flex; align-items: center; gap: 4px; }
  .meta :global(svg) { color: var(--text-soft); }

  /* the timeline: a dashed spine, a dot per stop (the start leaf, the goal the track's coral, a peak yuzu) */
  .tl { position: relative; list-style: none; margin: 0; padding: 0; }
  .tl::before { content: ''; position: absolute; left: 5.25px; top: 11px; bottom: 11px; width: 1.5px; background: linear-gradient(var(--stitch) 60%, transparent 0) 0 0 / 1.5px 6px repeat-y; }
  .stop { position: relative; display: grid; grid-template-columns: 14px 44px 1fr; align-items: center; gap: 0 10px; min-height: 28px; }
  .dot { width: 12px; height: 12px; border-radius: 50%; position: relative; z-index: 1; background: var(--c-yuzu-lip); box-shadow: 0 0 0 3px var(--card); }
  .pass .dot { background: var(--card); border: 2.5px solid var(--c-yuzu-lip); }
  .junction .dot { width: 10px; height: 10px; margin-left: 1px; background: var(--card); border: 2px solid var(--edge); }
  .start .dot, .goal .dot { width: 14px; height: 14px; }
  .start .dot { background: var(--c-leaf-edge); }
  .goal .dot { background: var(--c-coral-text); }
  .time { font: 600 var(--fs-s)/1 var(--font-num); color: var(--text); }
  .name { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 14px; line-height: 1.3; color: var(--text); }
  .junction .name { color: var(--text-soft); }
  .start .name, .goal .name, .peak .name { font-weight: 600; }
  .leg { display: grid; grid-template-columns: 14px 1fr; gap: 0 10px; min-height: 18px; align-items: center; }
  .leg > span { grid-column: 2; font: 600 var(--fs-xs)/1 var(--font-num); color: var(--text-soft); }
</style>
