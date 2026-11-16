<script lang="ts">
  // ききみみ's せってい (docs/kikimimi.md "設定"), pushed from the hub's ⚙: 🔊 「きこえる？」 (a clip through the game's
  // voice, with the earphones tip and the volume-0 line); にほんごやく (when the Japanese shows: いつも / まちがえた とき /
  // みない), kept on this phone; 音声の出典 (まるごと 聞く's real recordings' credits: LongCredits). Its own chunk.
  import Icon from '../../ui/Icon.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import LongCredits from './LongCredits.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { JA_MODES, type JaMode } from '../prefs.ts';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, ja, onja }: { game: QuizGame; ja: JaMode; onja: (m: JaMode) => void } = $props();
  /** The sound check tried (its hint shows). */
  let tested = $state(false);
  const zero = $derived(sound.settings.volume <= 0);
  async function test() {
    tested = true;
    await game.test();
  }
</script>

<div class="settings" data-kiki-page="settings">
  <section class="sec" aria-labelledby="kk-sound">
    <h3 id="kk-sound" class="sec-label">{t('kiki.set.sound')}</h3>
    <div class="card box">
      <button type="button" class="btn paper" data-kiki-test data-sfx="tick" onclick={test}><Icon name="volume" /> {t('kiki.test')}</button>
      {#if zero}<p class="hint warn" data-kiki-zero><Phrases text={t('kiki.testZero')} /></p>
      {:else if tested}<p class="hint"><Phrases text={t('kiki.testHint')} /></p>
      {:else}<p class="hint"><Phrases text={t('kiki.set.earphones')} /></p>{/if}
    </div>
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

  <LongCredits />
</div>

<style>
  .settings { display: grid; gap: 16px; }
  .sec { display: grid; gap: 8px; }
  .box { display: grid; gap: 8px; padding: 14px; }
  .chips .chip { flex: 1; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint.warn { color: var(--coral-text); }
</style>
