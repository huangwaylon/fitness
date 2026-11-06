<script lang="ts">
  // A mode's page (docs/kikimimi-ux.md §6.4): what it is (its subtitle, a line about it, its questions, minutes and
  // whether it can be shared), its settings (ひとこと クイズ: the ばしょ row; スピード はしご: its speeds and rule; アナウンス
  // and the quiz: こたえる じかん; a lane's game: the places its content has, if its mode offers them, and こたえる じかん),
  // the volume-0 line when the sound is off, and the foot: さそう (the みんなで page, this game in it) and はじめる.
  // おさらい: a solo deck of my weak spots, はじめる alone. Entering it sets my lobby's game to the mode (a lane's: its
  // lane loaded first; a lobby kept alone: nothing on the wire). The ばしょ is おまかせ (みみ チェック's placed stage:
  // progress.svelte.ts currentOmakase) till a place is tapped, kept for the mode (prefs.ts stagePick) till
  // 「おまかせに もどす」. Its own chunk.
  import { untrack } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import type { Level } from '#lib/kikimimi/bank.ts';
  import { LEVELS } from '#lib/kikimimi/deck.ts';
  import { SPEEDS } from '#lib/kikimimi/ladder.ts';
  import { modeOf, modeOfGame, type ModeId } from '#lib/kikimimi/catalog.ts';
  import { laneLevels, levelFor } from '#lib/kikimimi/round/registry.ts';
  import { REVIEW_CAP } from '#lib/kikimimi/srs.ts';
  import { currentOmakase, currentReport } from '../progress.svelte.ts';
  import { keepLv, keepStagePick, keepTimer, stagePick } from '../prefs.ts';
  import StageRow from './StageRow.svelte';
  import TimerRow from './TimerRow.svelte';
  import LadderSteps from '../LadderSteps.svelte';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, m, oninvite, onpractice }: { game: QuizGame; m: ModeId; oninvite: () => void; onpractice: () => void } = $props();
  const v = $derived(game.view);
  const meta = $derived(modeOf(m));
  /** A lane's game (the page is keyed by its mode), and the levels its ばしょ row offers (the quiz's: this build's). */
  const gm = untrack(() => modeOf(m).game);
  const levels = gm ? (modeOf(untrack(() => m)).places ? laneLevels(gm) : []) : LEVELS.filter((x) => x !== 5);
  const due = $derived(Math.min(REVIEW_CAP, currentReport()?.due ?? 0));
  const zero = $derived(sound.settings.volume <= 0);

  /** The ばしょ picked for this mode over おまかせ (null: おまかせ). */
  let pick = $state(untrack(() => stagePick(m))); // (the page is keyed by its mode)
  const omakase = $derived(gm ? levelFor(gm, currentOmakase()) : currentOmakase());

  // my lobby takes this mode's game (its level: アナウンス 5, the quiz its ばしょ: picked, else おまかせ)
  $effect(() => {
    const id = m;
    untrack(() => {
      const w = game.view;
      if (!w?.amHost) return;
      const lv = (pick ?? omakase) as Level;
      /** My lobby is a lane's game's (another mode's page goes back to the quiz family). */
      const lane = !!modeOfGame(w.gm ?? '');
      if (gm) {
        if (w.gm !== gm || w.lv !== lv) game.setGame(gm, { lv, timer: w.timer });
      } else if (id === 'ladder') {
        if (!w.ladder) game.configure({ ladder: true });
      } else if (id === 'announce') {
        if (lane || w.ladder || w.lv !== 5) game.configure({ ladder: false, lv: 5 });
      } else if (id === 'quiz' && (lane || w.ladder || w.lv !== lv)) game.configure({ ladder: false, lv });
      else if (lane || w.ladder) game.configure({ ladder: false });
    });
  });
  /** A place tapped: kept for this mode (おまかせ's own: back to おまかせ). */
  function level(lv: number) {
    pick = lv === omakase ? null : lv;
    keepStagePick(m, pick);
    game.configure({ lv: lv as Level });
    if (!gm) keepLv(lv as Level);
  }
  function reset() {
    level(omakase);
  }
</script>

<div class="mode" data-kiki-page="mode" data-kiki-mode-page={m}>
  <div class="head card">
    <span class="ic" aria-hidden="true">{meta.icon}</span>
    <b>{t(`kiki.modeSub.${m}`)}</b>
    <p>{m === 'ladder' ? t('kiki.ladderAbout') : t(`kiki.modeAbout.${m}`)}</p>
    <div class="chips" aria-label={t('kiki.mode')}>
      <span class="tag">{t('kiki.chip.qs', { n: m === 'review' && due ? due : meta.qs })}</span>
      <span class="tag">{t('kiki.chip.mins', { n: meta.mins })}</span>
      {#if meta.coop}<span class="tag">👥 {t('kiki.chip.coop')}</span>{/if}
    </div>
  </div>

  {#if meta.places && levels.length}
    <StageRow lv={v.lv} {levels} onpick={level} omakase={{ on: pick === null, onreset: reset }} />
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
