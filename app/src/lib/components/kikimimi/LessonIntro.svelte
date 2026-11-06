<script lang="ts">
  // A lesson's intro card (docs/curriculum-units.md §3; the UX review's P1-6): the lesson's name, the unit's, its host
  // villager and what I'll be able to do (the can-do), 6 もん · 2ぷんはん, and one green はじめる. The チェック is framed as
  // a mission until ようじ でんわ and たちぎき are built: 「{host}から でんわ！ ようじを ききとろう」 over a phone, with its
  // rule (5 of 6 right on the first listen stamps the unit; try again any time). The 30-day recheck is 「おさらい チェック」.
  import type { Lesson, UnitPlay } from '#lib/kikimimi/lesson.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName } from './scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { unit, lesson, recheck = false, onstart, onback }: { unit: UnitPlay; lesson: Lesson; recheck?: boolean; onstart: () => void; onback: () => void } = $props();
  const mission = $derived(lesson === 'check');
  const host = $derived(rosterName(unit.host as RosterId));
</script>

<div class="intro card" class:mission data-kiki-intro={lesson} data-kiki-recheck={recheck || undefined}>
  <p class="unit">{unit.name}</p>
  <h3 class="name">{recheck ? t('kiki.lesson.recheck') : t(`kiki.lesson.${lesson}`)}</h3>
  <div class="art">
    <OfficialArt key={villagerArt(unit.host, true)} alt={host} size={mission ? 84 : 96} eager />
    {#if mission}<span class="phone" aria-hidden="true">📞</span>{/if}
  </div>
  {#if mission}
    <p class="say" data-kiki-mission>{t('kiki.mission.call', { name: host })}<b>{t('kiki.mission.task')}</b></p>
    <p class="rule">🏅 {t('kiki.mission.rule')}<small>{t('kiki.mission.retry')}</small></p>
  {:else}
    <p class="goal"><small>{t('kiki.lesson.goal')}</small>{unit.cando.ja}</p>
  {/if}
  <p class="about">{t('kiki.lesson.about')}</p>
</div>

<div class="level-acts">
  <button type="button" class="btn" data-kiki-lesson-start data-sfx="confirm" onclick={onstart}>{t('kiki.lesson.start')}</button>
  <button type="button" class="btn paper wide" data-kiki-lesson-back data-sfx="back" onclick={onback}>{t('kiki.lesson.back')}</button>
</div>

<style>
  .card { border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .intro { display: grid; justify-items: center; gap: 10px; padding: 18px 16px; text-align: center; }
  .unit { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .name { margin: 0; font: 700 var(--fs-title)/1.2 var(--font-ui); }
  .art { position: relative; line-height: 0; }
  .phone { position: absolute; right: -18px; top: -6px; font-size: 30px; line-height: 1; animation: ring 900ms ease-in-out infinite alternate; }
  .say { margin: 0; font: 700 var(--fs-talk)/1.4 var(--font-ui); }
  .say b { display: block; }
  .goal, .rule, .about { margin: 0; font: 700 var(--fs-body)/1.45 var(--font-ui); }
  .goal small, .rule small { display: block; font-size: var(--fs-s); color: var(--text-soft); }
  .about { font-size: var(--fs-s); color: var(--text-soft); }
  .mission { background: color-mix(in srgb, var(--c-yuzu) 22%, var(--card)); }
  .level-acts > .wide { flex: 1 1 100%; }
  @keyframes ring { from { rotate: -12deg; } to { rotate: 12deg; } }
  @media (prefers-reduced-motion: reduce) { .phone { animation: none; } }
</style>
