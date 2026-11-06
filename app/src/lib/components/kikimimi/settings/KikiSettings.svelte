<script lang="ts">
  // ききみみ's せってい (docs/kikimimi-ux.md §6.11), pushed from the hub's ⚙: 🔊 「きこえる？」 (a clip through the game's
  // voice, with the earphones tip and the volume-0 line); 「おとを 1だいに まとめる」 as a new lobby's default; にほんごやく
  // (when the Japanese shows: いつも / まちがえた とき / みない); こんしゅうの めあて (3 / 5 / 7 にち). Each kept on this
  // phone. (みみ チェックを もういちど comes with the placement check.) Its own chunk.
  import type { QuizGame } from '../game.svelte.ts';
  import { JA_MODES, WEEK_GOALS, keepSame, keepWeekGoal, sameDefault, weekGoal, type JaMode, type WeekGoal } from '../prefs.ts';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, ja, onja }: { game: QuizGame; ja: JaMode; onja: (m: JaMode) => void } = $props();
  /** The sound check tried (its hint shows). */
  let tested = $state(false);
  let same = $state(sameDefault());
  let goal = $state<WeekGoal>(weekGoal());
  const zero = $derived(sound.settings.volume <= 0);
  async function test() {
    tested = true;
    await game.test();
  }
  function toggleSame() {
    same = !same;
    cue(same ? 'toggle-on' : 'toggle-off');
    keepSame(same);
    // my lobby kept alone takes it now too
    if (game.view?.amHost && game.view.local && game.view.same !== same) game.configure({ same });
  }
  function pickGoal(x: WeekGoal) {
    goal = x;
    keepWeekGoal(x);
  }
</script>

<div class="settings" data-kiki-page="settings">
  <section class="sec" aria-labelledby="kk-sound">
    <h3 id="kk-sound" class="sec-label">{t('kiki.set.sound')}</h3>
    <div class="card box">
      <button type="button" class="btn paper" data-kiki-test data-sfx="tick" onclick={test}>🔊 {t('kiki.test')}</button>
      {#if zero}<p class="hint warn" data-kiki-zero>{t('kiki.testZero')}</p>
      {:else if tested}<p class="hint">{t('kiki.testHint')}</p>
      {:else}<p class="hint">{t('kiki.set.earphones')}</p>{/if}
    </div>
    <button type="button" class="row tile-btn" role="switch" aria-checked={same} data-kiki-set-same data-sfx="self" onclick={toggleSame}>
      <span class="rl">{t('kiki.same')}<small>{t('kiki.set.sameSub')}</small></span>
      <span class="sw" aria-hidden="true"><i></i></span>
    </button>
  </section>

  <section class="sec" aria-labelledby="kk-ja">
    <h3 id="kk-ja" class="sec-label">{t('kiki.set.ja')}</h3>
    <div class="chips" role="radiogroup" aria-labelledby="kk-ja" data-kiki-set-ja={ja}>
      {#each JA_MODES as m (m)}
        <button type="button" class="chip big" role="radio" aria-checked={ja === m} data-ja={m} data-sfx={ja === m ? 'none' : 'tick'}
          onclick={() => ja !== m && onja(m)}>{t(`kiki.set.ja.${m}`)}</button>
      {/each}
    </div>
  </section>

  <section class="sec" aria-labelledby="kk-goal">
    <h3 id="kk-goal" class="sec-label">{t('kiki.set.goal')}</h3>
    <div class="chips" role="radiogroup" aria-labelledby="kk-goal" data-kiki-set-goal={goal}>
      {#each WEEK_GOALS as x (x)}
        <button type="button" class="chip big" role="radio" aria-checked={goal === x} data-goal={x} data-sfx={goal === x ? 'none' : 'tick'}
          onclick={() => goal !== x && pickGoal(x)}>{t('kiki.set.days', { n: x })}</button>
      {/each}
    </div>
    <p class="hint">{t('kiki.set.goalSub')}</p>
  </section>
</div>

<style>
  .settings { display: grid; gap: 16px; }
  .sec { display: grid; gap: 8px; }
  .box { display: grid; gap: 8px; padding: 14px; }
  .chips .chip { flex: 1; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint.warn { color: var(--coral-text); }
  .row { display: flex; align-items: center; gap: 12px; min-height: 60px; padding: 8px 16px; margin: 0; border-radius: var(--r-card); text-align: left; width: 100%; }
  .rl { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .rl small { display: block; margin-top: 2px; font-size: var(--fs-s); color: var(--text-soft); }
  .sw {
    position: relative; flex: none; width: 56px; height: 32px; border-radius: var(--r-pill);
    background: var(--ctl-off); box-shadow: inset 0 0 0 2px var(--edge); transition: background var(--dur-quick);
  }
  .sw i {
    position: absolute; top: 4px; left: 4px; width: 24px; height: 24px; border-radius: 50%;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge), 0 2px 0 var(--c-edge); transition: translate var(--dur-base) var(--ease-bounce);
  }
  .row[aria-checked='true'] .sw { background: var(--c-leaf); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .row[aria-checked='true'] .sw i { translate: 24px 0; }
  @media (prefers-reduced-motion: reduce) { .sw i { transition: none; } }
</style>
