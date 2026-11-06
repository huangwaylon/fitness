<script lang="ts">
  // A mode's page (docs/kikimimi-ux.md §6.4): what it is (its subtitle, a line about it, its questions, minutes and
  // whether it can be shared), its settings (ひとこと クイズ: the ばしょ row; スピード はしご: its speeds and rule; アナウンス
  // and the quiz: こたえる じかん), the volume-0 line when the sound is off, and the foot: さそう (the みんなで page, this
  // game in it) and はじめる. おさらい: a solo deck of my weak spots, はじめる alone. Entering it sets my lobby's game to
  // the mode (a lobby kept alone: nothing on the wire). Its own chunk.
  import { untrack } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import type { Level } from '#lib/kikimimi/bank.ts';
  import { LEVELS } from '#lib/kikimimi/deck.ts';
  import { SPEEDS } from '#lib/kikimimi/ladder.ts';
  import { lvForMode, modeOf, type ModeId } from '#lib/kikimimi/catalog.ts';
  import { REVIEW_CAP } from '#lib/kikimimi/srs.ts';
  import { currentReport } from '../progress.svelte.ts';
  import { keepLv, keepTimer, lastLv } from '../prefs.ts';
  import StageRow from './StageRow.svelte';
  import TimerRow from './TimerRow.svelte';
  import LadderSteps from '../LadderSteps.svelte';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, m, oninvite, onpractice }: { game: QuizGame; m: ModeId; oninvite: () => void; onpractice: () => void } = $props();
  const v = $derived(game.view);
  const meta = $derived(modeOf(m));
  const ICON: Record<ModeId, string> = { quiz: '💬', ladder: '🪜', review: '🔁', announce: '📢', story: '🌙' };
  const due = $derived(Math.min(REVIEW_CAP, currentReport()?.due ?? 0));
  const zero = $derived(sound.settings.volume <= 0);

  // my lobby takes this mode's game (its level: アナウンス 5, the quiz the one last played)
  $effect(() => {
    const id = m;
    untrack(() => {
      const w = game.view;
      if (!w?.amHost) return;
      if (id === 'ladder') {
        if (!w.ladder) game.configure({ ladder: true });
      } else if (id === 'announce') {
        if (w.ladder || w.lv !== 5) game.configure({ ladder: false, lv: 5 });
      } else if (w.ladder || (id === 'quiz' && w.lv === 5)) game.configure({ ladder: false, lv: lvForMode('quiz', lastLv()) as Level });
    });
  });
  function level(lv: number) {
    game.configure({ lv: lv as Level });
    keepLv(lv as Level);
  }
</script>

<div class="mode" data-kiki-page="mode" data-kiki-mode-page={m}>
  <div class="head card">
    <span class="ic" aria-hidden="true">{ICON[m]}</span>
    <b>{t(`kiki.modeSub.${m}`)}</b>
    <p>{m === 'ladder' ? t('kiki.ladderAbout') : t(`kiki.modeAbout.${m}`)}</p>
    <div class="chips" aria-label={t('kiki.mode')}>
      <span class="tag">{t('kiki.chip.qs', { n: m === 'review' && due ? due : meta.qs })}</span>
      <span class="tag">{t('kiki.chip.mins', { n: meta.mins })}</span>
      {#if meta.coop}<span class="tag">👥 {t('kiki.chip.coop')}</span>{/if}
    </div>
  </div>

  {#if m === 'quiz'}
    <StageRow lv={v.lv} levels={LEVELS.filter((x) => x !== 5)} onpick={level} />
  {:else if m === 'ladder'}
    <section class="ladder card" data-kiki-ladder-about>
      <LadderSteps size="big" step={(k) => (k === SPEEDS.length - 1 ? 'up' : 'soft')} />
      <p class="hint">{t('kiki.ladderRule')}</p>
    </section>
  {:else if m === 'review' && due}
    <p class="hint" data-kiki-review-due>{t('kiki.review.picked', { n: due })}</p>
  {/if}
  {#if m !== 'review'}
    <TimerRow timer={v.timer} onpick={(x) => (game.configure({ timer: x }), keepTimer(x))} />
  {/if}
  {#if zero}<p class="hint warn" data-kiki-zero>🔊 {t('kiki.testZero')}</p>{/if}
</div>

<div class="level-acts">
  {#if meta.coop}<button type="button" class="btn paper" data-kiki-invite-all data-sfx="open" onclick={oninvite}>{t('kiki.inviteAll')}</button>{/if}
  <button type="button" class="btn" data-kiki-start data-sfx="confirm" onclick={() => (m === 'review' ? onpractice() : game.go())}>{t('kiki.startSolo')}</button>
</div>

<style>
  .mode { display: grid; gap: 14px; }
  .head { display: grid; gap: 6px; padding: 14px 16px; }
  .ic { font-size: 28px; line-height: 1.1; }
  .head b { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .head p { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); color: var(--text-soft); }
  .chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
  .tag { padding: 4px 10px; border-radius: var(--r-pill); background: var(--ctl-off); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .ladder { display: grid; gap: 10px; padding: 12px 14px; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint.warn { color: var(--coral-text); }
</style>
