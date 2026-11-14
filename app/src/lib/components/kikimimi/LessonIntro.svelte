<script lang="ts">
  // A lesson's intro card (docs/curriculum.md "Lessons"; the UX review's P1-6): the lesson's name, the unit's, its host
  // villager and what I'll be able to do (the can-do's one line, else its sentence), 6 もん · 2ぷんはん, and one green はじめる. The チェック is framed as
  // a mission until ようじ でんわ and たちぎき are built: 「{host}から でんわ！ ようじを ききとろう」 over a phone, with its
  // rule (5 of 6 right on the first listen stamps the unit; try again any time). The 30-day recheck is 「おさらい チェック」.
  // A co-op lesson (`shared`, docs/curriculum.md "Playing together"): who's in it, the team's way to the stamp on a チェック, and
  // はじめる（Nにん） for the host; the others wait for it (their choices at their own tier, never shown).
  import type { Lesson, UnitPlay } from '#lib/kikimimi/lesson.ts';
  import type { Who } from '#lib/types.ts';
  import PlayerChip from './frame/PlayerChip.svelte';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName } from './scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { unit, lesson, recheck = false, shared = null, onstart, onback }: {
    unit: UnitPlay; lesson: Lesson; recheck?: boolean; shared?: { players: Who[]; host: boolean; wait: string } | null; onstart: () => void; onback: () => void;
  } = $props();
  const mission = $derived(lesson === 'check');
  const host = $derived(rosterName(unit.host as RosterId));
</script>

<div class="intro card" class:mission data-kiki-intro={lesson} data-kiki-recheck={recheck || undefined} data-kiki-coop={shared ? '1' : undefined}>
  <p class="unit">{unit.name}</p>
  <h3 class="name">{recheck ? t('kiki.lesson.recheck') : t(`kiki.lesson.${lesson}`)}</h3>
  <div class="art">
    <OfficialArt key={villagerArt(unit.host, true)} alt={host} size={mission ? 84 : 96} eager />
    {#if mission}<span class="phone" aria-hidden="true">📞</span>{/if}
  </div>
  {#if mission}
    <p class="say kana" data-kiki-mission>{t('kiki.mission.call', { name: host })}<b>{t('kiki.mission.task')}</b></p>
    <p class="rule"><span aria-hidden="true">🏅</span> {t('kiki.mission.rule')}{#if shared}<small data-kiki-mission-team>{t('kiki.mission.team')}</small>{/if}<small>{t('kiki.mission.retry')}</small></p>
  {:else}
    <p class="goal" data-kiki-intro-goal><small>{t('kiki.lesson.goal')}</small>{unit.cando.short ?? unit.cando.ja}</p>
  {/if}
  <p class="about">{t('kiki.lesson.about')}</p>
  {#if shared}
    <div class="who" data-kiki-players>{#each shared.players as w (w)}<PlayerChip who={w} state="here" size={40} />{/each}</div>
  {/if}
</div>

<div class="level-acts">
  {#if shared && !shared.host}
    <p class="wait" role="status">{shared.wait}</p>
  {:else}
    <button type="button" class="btn" data-kiki-lesson-start data-sfx="confirm" onclick={onstart}>{shared ? t('kiki.startN', { n: shared.players.length }) : t('kiki.lesson.start')}</button>
    <button type="button" class="btn paper wide" data-kiki-lesson-back data-sfx="back" onclick={onback}>{t('kiki.lesson.back')}</button>
  {/if}
</div>

<style>
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
  .who { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 16px; }
  .wait { flex: 1; margin: 0; padding: 14px 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  @keyframes ring { from { rotate: -12deg; } to { rotate: 12deg; } }
</style>
