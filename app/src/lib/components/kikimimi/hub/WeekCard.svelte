<script lang="ts">
  // The hub's week card (docs/kikimimi.md "The hub", "The weekly stamp card", "ふたりの クエスト"): こんしゅう きいた ひ, my days stamped against my target
  // (月 … 日, today ringed; met: a coral stamp, never a streak or a missed-day count), and ふたりの クエスト: the minutes
  // heard together this week as one bar (never who added what); the guest's own solo quest instead.
  import type { WeekCard } from '#lib/kikimimi/week.ts';
  import { t } from '#lib/i18n/index.ts';

  let { card }: { card: WeekCard } = $props();
  const q = $derived(card.quest);
  const pct = $derived(Math.min(100, Math.round((q.minutes / q.of) * 100)));
</script>

<section class="week card" aria-labelledby="kk-week" data-kiki-week-card data-kiki-week-count={card.count} data-kiki-week-goal={card.goal}>
  <header>
    <h3 id="kk-week">{t('kiki.week.title')}</h3>
    <span class="n" data-kiki-week-n>{t('kiki.week.n', { k: card.count, n: card.goal })}</span>
  </header>
  <ol class="days">
    {#each card.days as on, i (i)}
      <li class:on class:today={i === card.at} data-kiki-day={i} data-on={on || undefined}>
        <span class="dot" aria-hidden="true">{on ? '✓' : ''}</span>
        <span class="dl">{t(`kiki.day.${i}`)}</span>
      </li>
    {/each}
  </ol>
  {#if card.met}<p class="met" data-kiki-week-met>{t('kiki.week.met')}</p>{/if}
  <div class="quest" data-kiki-quest={q.minutes} data-kiki-quest-of={q.of}>
    <div class="ql"><b>{t(q.solo ? 'kiki.quest.solo' : 'kiki.quest.title')}</b><span>{t(q.solo ? 'kiki.quest.soloN' : 'kiki.quest.n', { k: q.minutes, n: q.of })}</span></div>
    <div class="bar" role="meter" aria-valuemin={0} aria-valuemax={q.of} aria-valuenow={Math.min(q.minutes, q.of)} aria-label={t(q.solo ? 'kiki.quest.solo' : 'kiki.quest.title')}>
      <i style="width: {pct}%"></i>
    </div>
    {#if q.met}<p class="met" data-kiki-quest-met>{t('kiki.quest.met')}</p>{/if}
  </div>
</section>

<style>
  .week { display: grid; gap: 10px; padding: 12px 14px; }
  header { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; }
  h3 { margin: 0; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .n { font: 700 var(--fs-body)/1 var(--font-num); color: var(--text-soft); }
  .days { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
  .days li { display: grid; justify-items: center; gap: 3px; }
  .dot {
    width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center; box-shadow: inset 0 0 0 2px var(--edge);
    font: 700 16px/1 var(--font-ui); color: var(--coral-text); background: var(--ctl-off);
  }
  .on .dot { background: var(--card); box-shadow: inset 0 0 0 2px var(--c-coral); transform: rotate(-8deg); }
  .today .dot { outline: 2px solid var(--c-yuzu); outline-offset: 2px; }
  .dl { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .met { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--leaf-text); }
  .quest { display: grid; gap: 6px; padding-top: 8px; border-top: 1.5px dashed var(--stitch); }
  .ql { display: flex; justify-content: space-between; gap: 8px; font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .ql span { color: var(--text-soft); }
  .bar { height: 12px; border-radius: var(--r-pill); background: var(--ctl-off); overflow: hidden; box-shadow: inset 0 0 0 2px var(--edge); }
  .bar i { display: block; height: 100%; border-radius: inherit; background: var(--c-leaf); }
  @media (prefers-reduced-motion: no-preference) { .bar i { transition: width var(--dur-base) var(--ease-bounce); } }
</style>
