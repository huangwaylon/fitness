<script lang="ts">
  // せってい → あそびかた, written for a 10-year-old: the four goals (+1 ベル each, my own Move goal), ふたりでぜんぶ, the
  // two rewards, the Sunday recap; then the protein tip and the one-line setup. Every number comes from the rules (and
  // my own Move goal), so the page never disagrees with the island.
  import { version } from '$app/env';
  import type { RingFruit, WeekView } from '#lib/types.ts';
  import { RING_FRUITS, RULES, shopPrice } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { weightTrend } from '#lib/model/weight.ts';

  let { view }: { view: WeekView } = $props();
  const moveGoal = $derived(view.people[view.me].moveGoal);
  /** Each fruit's daily goal. */
  const goal = (f: RingFruit): string =>
    f === 'peach' ? t('help.goal.min', { n: RULES.goals.exerciseMin })
    : f === 'pear' ? t('help.goal.kcal', { n: formatNum(moveGoal) })
    : f === 'cherry' ? t('help.goal.min', { n: RULES.goals.standMin })
    : t('help.goal.steps', { n: formatNum(RULES.goals.steps) });

  /** The protein tip (not tracked): 1.6 g per kg a day, per person from their goal weight (else their
   *  weight trend), rounded to 5 g; just the rule when neither is known. */
  const protein = $derived.by((): string => {
    const m = week.model;
    if (!m) return '';
    return [view.me, view.partner].flatMap((p) => {
      const kg = m.state.prefs[p].goalWeight ?? weightTrend(m.state, p, m.now).latest?.trend ?? null;
      return kg ? [t('help.protein.person', { name: view.people[p].villagerName, g: Math.round((kg * 1.6) / 5) * 5 })] : [];
    }).join(t('help.protein.sep'));
  });
</script>

<div class="howto">
  <section class="card">
    <h3><span class="hi"><OfficialArt key="money/bells" size={32} /></span>{t('help.title')}</h3>
    <p>{t('help.goals', { b: formatBells(RULES.perGoal) })}</p>
    <ul class="fruits">
      {#each RING_FRUITS as f (f)}
        <li>
          <OfficialArt key={fruitArt(f)} size={26} />
          <span class="nm"><b>{t(`fruit.${f}`)}</b><small>{goal(f)}</small></span>
          <span class="pay money">{formatBells(RULES.perGoal, { signed: true })}</span>
        </li>
      {/each}
    </ul>
    <p>{t('help.together', { b: formatBells(RULES.together, { signed: true }) })}</p>
    <p>{t('help.shop', { snack: formatBells(shopPrice('snack') ?? 0), dinner: formatBells(shopPrice('dinner') ?? 0) })}</p>
    <p>{t('help.sunday')}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key="items/dinner" size={28} /></span>{t('help.protein.title')}</h3>
    <p>{t('help.protein.body')}</p>
    {#if protein}<p class="note">{protein}</p>{/if}
  </section>

  <section class="card">
    <h3><span class="hi"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#i-sync" /></svg></span>{t('help.setup.title')}</h3>
    <p>{t('help.setup.body')}</p>
  </section>
</div>
<p class="ver">{t('help.version')} <span dir="ltr">{version}</span></p>

<style>
  .howto { display: grid; gap: 12px; }
  .card { display: grid; gap: 8px; padding: 12px 14px 14px; }
  h3 { display: flex; align-items: center; gap: 10px; margin: 0; font-size: var(--fs-talk); line-height: 1.25; }
  .hi { width: 40px; height: 40px; display: grid; place-items: center; flex: none; line-height: 0; color: var(--text-soft); }
  .hi svg { width: 28px; height: 28px; }
  p { margin: 0; font-size: var(--fs-body); font-weight: 700; line-height: 1.5; }
  .note { font-size: var(--fs-s); color: var(--text-soft); }
  .fruits { list-style: none; margin: 0; padding: 0; display: grid; }
  .fruits li { display: flex; align-items: center; gap: 10px; min-height: 44px; }
  .fruits li + li { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .fruits :global(.official) { flex: none; }
  .nm { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .nm b { font-size: var(--fs-body); }
  .nm small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .pay { flex: none; font-size: var(--fs-body); text-align: right; }
  .ver { margin: 16px 0 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
</style>
