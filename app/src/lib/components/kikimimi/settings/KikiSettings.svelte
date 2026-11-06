<script lang="ts">
  // ききみみ's せってい (docs/kikimimi-ux.md §6.11), pushed from the hub's ⚙: 🔊 「きこえる？」 (a clip through the game's
  // voice, with the earphones tip and the volume-0 line). Its own chunk.
  import type { QuizGame } from '../game.svelte.ts';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
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
      <button type="button" class="btn paper" data-kiki-test data-sfx="tick" onclick={test}>🔊 {t('kiki.test')}</button>
      {#if zero}<p class="hint warn" data-kiki-zero>{t('kiki.testZero')}</p>
      {:else if tested}<p class="hint">{t('kiki.testHint')}</p>
      {:else}<p class="hint">{t('kiki.set.earphones')}</p>{/if}
    </div>
  </section>
</div>

<style>
  .settings { display: grid; gap: 14px; }
  .sec { display: grid; gap: 8px; }
  .box { display: grid; gap: 8px; padding: 14px; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint.warn { color: var(--coral-text); }
</style>
