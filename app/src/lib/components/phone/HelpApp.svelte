<script lang="ts">
  // しまフォン → あそびかた (ADR 0021), written for a 10-year-old: no taps needed, the five fruits and their daily goals
  // (what each pays), the weekly badges and the together bonus, the one shared wallet (ADR 0022) with the treat guide,
  // the protein tip and the one-line setup. Every number comes from the rules (and my own Move goal), so the page never disagrees with the island.
  import { version } from '$app/env';
  import type { RingFruit, WeekView } from '#lib/types.ts';
  import { RING_FRUITS, rulesFor, type CurveFruit } from '#lib/config/rules.ts';
  import { milestoneBells } from '#lib/scoring/bells.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { dayMax } from '../island/progress.ts';
  import { badgeGoals } from '../kiroku/fmt.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { weightTrend } from '#lib/model/weight.ts';

  let { view }: { view: WeekView } = $props();
  const r = $derived(rulesFor(view.weekKey));
  const days = $derived(badgeGoals(view.weekKey));
  const moveGoal = $derived(view.people[view.me].moveGoal);
  /** Each fruit: its daily goal and what it pays. */
  const goal = (f: RingFruit): string =>
    f === 'peach' ? t('help.goal.min', { n: r.goals.exerciseMin })
    : f === 'pear' ? t('help.goal.kcal', { n: formatNum(moveGoal) })
    : f === 'cherry' ? t('help.goal.min', { n: r.goals.standMin })
    : f === 'apple' ? t('help.goal.steps', { n: formatNum(r.goals.steps) })
    : t('help.goal.gym');
  const pays = (f: RingFruit): string =>
    f === 'peach' ? t('help.pay.perMin', { b: r.bells.perExerciseMin })
    : f === 'pear' ? t('help.pay.atGoal', { b: formatBells(r.bells.moveAtGoal) })
    : f === 'cherry' ? t('help.pay.perMin', { b: r.bells.perStandMin })
    : f === 'apple' ? formatBells(r.bells.stepDay)
    : formatBells(r.bells.gymDay);

  /** v2 (from 2026-11-02): 🍑🍐🍒🍎 pay in four steps of the goal (docs/reviews/round-19/milestones-contract.md):
   *  each step's amount and the fruit's ベル for the day once it's reached. Null in a v1 week (linear pay). */
  const stepsOf = (f: RingFruit): { at: string; bells: string }[] | null => {
    if (f === 'coconut' || !r.curve) return null;
    const bells = milestoneBells(view.weekKey, f as CurveFruit);
    if (!bells) return null;
    const goalOf = { peach: r.goals.exerciseMin, pear: moveGoal, cherry: r.goals.standMin, apple: r.goals.steps }[f];
    return r.curve.at.map((x, k) => ({ at: t('help.step', { n: formatNum(Math.ceil(x * goalOf)), u: t(`kiroku.unit.${f}`) }), bells: formatNum(bells[k]) }));
  };
  const curved = $derived(RING_FRUITS.some((f) => stepsOf(f)));

  /** The protein tip (user, round 19; not tracked): 1.6 g per kg a day, per person from their goal weight (else their
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
    <h3><span class="hi"><OfficialArt key="money/bells" size={32} /></span>{t('help.bells.title')}</h3>
    <p>{t('help.bells.body')}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key={fruitArt('cherry')} size={30} /></span>{t('help.fruit.title')}</h3>
    {#if curved}<p>{t('help.steps')}</p>{/if}
    <ul class="fruits">
      {#each RING_FRUITS as f (f)}
        {@const steps = stepsOf(f)}
        <li>
          <OfficialArt key={fruitArt(f)} size={26} />
          <span class="nm"><b>{t(`fruit.${f}`)}</b><small>{goal(f)}</small></span>
          {#if !steps}<span class="pay money">{pays(f)}</span>{/if}
          {#if steps}
            <!-- the four steps: the amount, then the day's ベル once it's reached (the last step pays the most) -->
            <span class="steps" role="list">
              {#each steps as st, k (k)}<span class="st" role="listitem"><small>{st.at}</small><b class="money">{st.bells}</b></span>{/each}
            </span>
          {/if}
        </li>
      {/each}
    </ul>
    <p class="note">{t('help.fruit.max', { bells: formatBells(dayMax(view.weekKey)) })}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key="money/miles" size={30} /></span>{t('help.badge.title')}</h3>
    <p>{t('help.badge.body', { bells: formatBells(r.badges.bells) })}</p>
    <ul class="chips">
      {#each RING_FRUITS as f (f)}
        <li><OfficialArt key={fruitArt(f)} size={20} /><span class="money">{t('help.badge.days', { n: days[f] })}</span></li>
      {/each}
    </ul>
    <p class="note">{t('help.badge.duo', { bells: formatBells(r.badges.duoPerBadge) })}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key="phone/nook-shopping" size={30} /></span>{t('help.wallet.title')}</h3>
    <p>{t('help.wallet.body')}</p>
    <p class="note">{t('help.treats')}</p>
    <p class="note">{t('help.escalate')}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key={fruitArt('coconut')} size={28} /></span>{t('help.protein.title')}</h3>
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
  p { margin: 0; font-size: var(--fs-body); font-weight: 700; line-height: 1.5; word-break: auto-phrase; }
  .note { font-size: var(--fs-s); color: var(--text-soft); }
  .fruits { list-style: none; margin: 0; padding: 0; display: grid; }
  .fruits li { display: flex; align-items: center; gap: 10px; min-height: 48px; }
  .fruits li + li { border-top: 1px dashed color-mix(in srgb, var(--lip) 70%, transparent); }
  .fruits :global(.official) { flex: none; }
  .nm { flex: 1; min-width: 0; display: grid; gap: 1px; }
  .nm b { font-size: var(--fs-body); }
  .nm small { font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }
  .pay { flex: none; font-size: var(--fs-s); text-align: right; }
  .fruits li:has(.steps) { flex-wrap: wrap; padding: 6px 0 8px; row-gap: 4px; }
  .steps { flex: 1 0 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; padding-left: 36px; }
  .st { display: grid; justify-items: center; gap: 1px; padding: 4px 2px; border-radius: var(--r-chip); background: var(--hl); }
  .st small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); white-space: nowrap; }
  .st b { font-size: var(--fs-s); }
  .st:last-child { box-shadow: inset 0 0 0 2px var(--c-yuzu-lip); }
  .chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .chips li { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 10px; border-radius: var(--r-pill); background: var(--hl); }
  .chips .money { font-size: var(--fs-s); }
  .ver { margin: 16px 0 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
</style>
