<script lang="ts">
  // English Study's progress block (docs/english.md "Progress"), one component so it can change alone: this week's
  // three dots (k/3日, then 「今週の3日、達成」; before the first day ever 「週3日見たら達成」 says what they mean), Monday's 「新しい週だよ」, the run of 3-day weeks or their count, the
  // clips finished (a link: これまでの記録), this week's minutes (information only), the partner's line and
  // 「今週はふたりとも達成」. Never a 0日, a break or a miss.
  import type { WeekView } from '../progress.ts';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { WEEK_TARGET } from '../progress.ts';
  import { s } from '../i18n.ts';
  import Icon from '#lib/components/ui/Icon.svelte';

  let { view, onhistory }: { view: WeekView; onhistory: () => void } = $props();
  const dots = (k: number) => Array.from({ length: WEEK_TARGET }, (_, i) => i < k);
  const met = $derived(view.days >= WEEK_TARGET);
</script>

<section class="card pad wk" data-en-week={view.days} aria-label={s('week')}>
  <p class="row">
    <b>{s('week')}</b>
    <span class="dots" role="img" aria-label={`${s('week')} ${view.days > WEEK_TARGET ? s('weekMore', { k: view.days }) : s('weekDays', { k: view.days })}`}>{#each dots(view.days) as on, i (i)}<i class:on></i>{/each}</span>
    {#if view.days > WEEK_TARGET}<span class="n" aria-hidden="true" data-en-week-n>{s('weekMore', { k: view.days })}</span>
    {:else if view.days > 0 && !met}<span class="n" aria-hidden="true" data-en-week-n>{s('weekDays', { k: view.days })}</span>{/if}
  </p>
  {#if met}<p class="line met" data-en-met>{s('weekMet')}</p>
  {:else if view.fresh}<p class="line" data-en-fresh>{s('weekNew')}</p>
  {:else if view.days === 0 && view.ever === 0 && view.clips === 0}<p class="soft" data-en-week-hint><Phrases text={s('weekHint')} /></p>{/if}
  {#if view.run >= 2}<p class="line" data-en-run>{s('run', { n: view.run })}</p>
  {:else if view.ever > 0}<p class="line" data-en-run>{s('runEver', { n: view.ever })}</p>{/if}
  {#if view.clips > 0}<button type="button" class="hist" aria-label={`${s('clips', { n: view.clips })} · ${s('history')}`} data-sfx="page" data-en-clips onclick={onhistory}>{s('clips', { n: view.clips })}<Icon name="chevron-right" size={18} stroke={2.6} /></button>{/if}
  {#if view.minutes > 0}<p class="soft" data-en-minutes>{s('minutes', { n: view.minutes })}</p>{/if}
  {#if view.partner && (view.partner.today || view.partner.days > 0)}
    <p class="partner" data-en-partner>
      {#if view.partner.today}{s('partnerDone', { name: view.partner.name })}<Icon name="check" size={14} stroke={2.6} />
      {:else}<span>{s('partnerWeek', { name: view.partner.name })}</span><span class="dots s" role="img" aria-label={s('weekDays', { k: Math.min(view.partner.days, WEEK_TARGET) })}>{#each dots(view.partner.days) as on, i (i)}<i class:on></i>{/each}</span>{/if}
    </p>
  {/if}
  {#if view.both}<p class="line met" data-en-both>{s('both')}</p>{/if}
</section>

<style>
  .wk { display: grid; gap: 4px; }
  .wk p { margin: 0; }
  .row { display: flex; align-items: center; gap: 10px; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .dots { display: inline-flex; gap: 6px; }
  .dots i { width: 14px; height: 14px; border-radius: 50%; box-shadow: inset 0 0 0 2px var(--edge); }
  .dots i.on { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .dots.s i { width: 10px; height: 10px; }
  .n { font: 600 var(--fs-body)/1 var(--font-num); }
  .line { font-size: var(--fs-body); }
  .met { color: var(--leaf-text); font-weight: 700; }
  /* これまで N本 ›: the line itself the link to これまでの記録, a 44 hit on a line's height */
  .hist { appearance: none; border: 0; background: none; cursor: pointer; justify-self: start; display: inline-flex; align-items: center; gap: 2px; min-height: var(--hit);
    margin: -10px 0; padding: 0 4px 0 0; font: inherit; font-size: var(--fs-body); color: var(--text); -webkit-tap-highlight-color: transparent; }
  .hist :global(svg) { color: var(--text-soft); }
  .soft { font-size: var(--fs-s); color: var(--text-soft); }
  .partner { display: flex; align-items: center; gap: 8px; font-size: var(--fs-s); color: var(--text-soft); margin-top: 4px !important; }
</style>
