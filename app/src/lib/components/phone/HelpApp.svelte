<script lang="ts">
  // しまフォン → あそびかた (ADR 0021), written for a 10-year-old: no taps needed, the five fruits and their daily goals
  // (what each pays), the weekly badges and the together bonus, the one shared wallet (ADR 0022), and the one-line
  // setup. Every number comes from the rules (and my own Move goal), so the page never disagrees with the island.
  import { version } from '$app/env';
  import type { RingFruit, WeekView } from '#lib/types.ts';
  import { RING_FRUITS, RULES } from '#lib/config/rules.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { dayMax } from '../island/progress.ts';
  import { badgeGoals } from '../kiroku/fmt.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();
  const r = RULES[RULES.length - 1];
  const days = badgeGoals();
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
</script>

<div class="howto">
  <section class="card">
    <h3><span class="hi"><OfficialArt key="money/bells" size={32} /></span>{t('help.bells.title')}</h3>
    <p>{t('help.bells.body')}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key={fruitArt('cherry')} size={30} /></span>{t('help.fruit.title')}</h3>
    <ul class="fruits">
      {#each RING_FRUITS as f (f)}
        <li>
          <OfficialArt key={fruitArt(f)} size={26} />
          <span class="nm"><b>{t(`fruit.${f}`)}</b><small>{goal(f)}</small></span>
          <span class="pay money">{pays(f)}</span>
        </li>
      {/each}
    </ul>
    <p class="note">{t('help.fruit.max', { bells: formatBells(dayMax()) })}</p>
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
  .chips { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; gap: 6px; }
  .chips li { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 10px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
  .chips .money { font-size: var(--fs-s); }
  .ver { margin: 16px 0 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
</style>
