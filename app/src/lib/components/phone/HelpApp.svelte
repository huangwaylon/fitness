<script lang="ts">
  // しまフォン → あそびかた (ADR 0019): the game in five cards for a first-time player: what ベル are, how a day earns
  // them (the four fruit, the same goals for both), the Sunday bonus, the two pots, and where to tap on the island.
  // The numbers come from the rules, so the page never disagrees with what the island pays. Then the build.
  import { version } from '$app/env';
  import type { WeekView } from '#lib/types.ts';
  import { RULES } from '#lib/config/rules.ts';
  import Avatar from '../characters/Avatar.svelte';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { fruitArt } from '#lib/art.ts';
  import { dayMax } from '../island/progress.ts';
  import { potShare } from '../pots/flow.ts';
  import { formatBells, formatNum, t } from '#lib/i18n/index.ts';

  let { view }: { view: WeekView } = $props();
  const r = RULES[RULES.length - 1];
  const treat = potShare('treat', 100);
  const earn = [
    { f: 'peach', text: t('help.earn.peach', { per: r.bells.perMinute, max: r.goals.activeMin }) },
    { f: 'apple', text: t('help.earn.apple', { steps: formatNum(r.goals.steps), bells: formatBells(r.bells.stepDay) }) },
    { f: 'coconut', text: t('help.earn.coconut', { bells: formatBells(r.bells.strengthDay) }) },
    { f: 'pear', text: t('help.earn.pear', { bells: formatBells(r.bells.perTick) }) }
  ] as const;
  const badges = [
    { f: 'peach', n: r.badges.activeDays, key: 'days' },
    { f: 'apple', n: r.badges.stepDays, key: 'days' },
    { f: 'coconut', n: r.badges.strengthDays, key: 'days' },
    { f: 'pear', n: r.badges.ticks, key: 'ticks' }
  ] as const;
</script>

<div class="howto">
  <section class="card">
    <h3><span class="hi"><OfficialArt key="money/bells" size={32} /></span>{t('help.bells.title')}</h3>
    <p>{t('help.bells.body')}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key={fruitArt('peach')} size={30} /></span>{t('help.earn.title')}</h3>
    <ul class="rows">
      {#each earn as e (e.f)}
        <li><OfficialArt key={fruitArt(e.f)} size={22} /><span>{e.text}</span></li>
      {/each}
    </ul>
    <p class="note">{t('help.earn.max', { bells: formatBells(dayMax()) })}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key="money/miles" size={30} /></span>{t('help.bonus.title')}</h3>
    <p>{t('help.bonus.body', { bells: formatBells(r.badges.bells) })}</p>
    <ul class="chips">
      {#each badges as b (b.f)}
        <li><OfficialArt key={fruitArt(b.f)} size={20} /><span class="money">{t(`help.bonus.${b.key}`, { n: b.n })}</span></li>
      {/each}
    </ul>
    <p class="note">{t('help.bonus.duo', { bells: formatBells(r.badges.duo) })}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><OfficialArt key="phone/nook-shopping" size={30} /></span>{t('help.pots.title')}</h3>
    <p>{t('help.pots.body', { treat, trip: 100 - treat })}</p>
    <p class="note">{t('help.pots.use')}</p>
  </section>

  <section class="card">
    <h3><span class="hi"><Avatar person={view.me} villager={view.people[view.me].villager} size={36} /></span>{t('help.island.title')}</h3>
    <ul class="rows plain">
      <li>{t('help.island.me')}</li>
      <li>{t('help.island.partner')}</li>
      <li>{t('help.island.tree')}</li>
      <li>{t('help.island.jar')}</li>
      <li>{t('help.island.kiroku')}</li>
    </ul>
  </section>
</div>
<p class="ver">{t('help.version')} <span dir="ltr">{version}</span></p>

<style>
  .howto { display: grid; gap: 12px; }
  .card { display: grid; gap: 8px; padding: 12px 14px 14px; }
  h3 { display: flex; align-items: center; gap: 10px; margin: 0; font-size: var(--fs-talk); line-height: 1.25; }
  .hi { width: 40px; height: 40px; display: grid; place-items: center; flex: none; line-height: 0; }
  p { margin: 0; font-size: var(--fs-body); font-weight: 700; line-height: 1.5; word-break: auto-phrase; }
  .note { font-size: var(--fs-s); color: var(--text-soft); }
  .rows { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .rows li { display: flex; align-items: center; gap: 8px; font-size: var(--fs-body); font-weight: 700; line-height: 1.35; word-break: auto-phrase; }
  .rows li :global(.official), .rows li > :global(*:first-child:not(span)) { flex: none; }
  .rows.plain li { display: list-item; margin-left: 1.1em; list-style: '・'; }
  .rows.plain li:lang(en) { list-style: '• '; }
  .chips { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 6px; }
  .chips li { display: flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 10px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
  .chips .money { font-size: var(--fs-s); }
  .ver { margin: 16px 0 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
</style>
