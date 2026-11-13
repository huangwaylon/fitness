<script lang="ts">
  // ききみみ's first run (docs/kikimimi.md "First run"), once per player on this phone, in the hub's place: 1 しずえ's hello
  // and three points (1にち 3ぷんから · ふたりで いっしょに · まず みみ チェック), あとで / はじめる; 2 the sound check (🔊
  // 「きこえる？」 through the game's voice, the volume-0 line), then みみ チェック (the game itself: step 3). あとで goes to
  // the hub, which keeps a card for the check. Its own chunk.
  import Icon from '../../ui/Icon.svelte';
  import { untrack } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import Host from '../../characters/Host.svelte';
  import { sound } from '#lib/sound/sound.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, at = 1, onlater, onstart }: { game: QuizGame; at?: 1 | 2; onlater: () => void; onstart: () => void } = $props();
  let step = $state<1 | 2>(untrack(() => at)); // (the check's ‹ comes back to step 2)
  let tested = $state(false);
  const zero = $derived(sound.settings.volume <= 0);
  async function test() {
    tested = true;
    await game.test();
  }
</script>

<div class="welcome card" data-kiki-page="welcome" data-kiki-step={step}>
  <ol class="dots" aria-label={t('kiki.welcome.step', { n: step })}>
    {#each [1, 2, 3] as k (k)}<li class:on={k === step} class:done={k < step}></li>{/each}
  </ol>
  <Host pose={step === 1 ? 'wave' : 'stand'} size={step === 1 ? 120 : 96} />
  {#if step === 1}
    <p class="say kana">{t('kiki.welcome.hello')}</p>
    <ul class="points">
      <li><span aria-hidden="true">⏱️</span>{t('kiki.welcome.p1')}</li>
      <li><span aria-hidden="true">👥</span>{t('kiki.welcome.p2')}</li>
      <li><span aria-hidden="true">👂</span>{t('kiki.welcome.p3')}</li>
    </ul>
  {:else}
    <p class="say kana">{t('kiki.welcome.sound')}</p>
    <button type="button" class="btn paper" data-kiki-test data-sfx="tick" onclick={test}><Icon name="volume" /> {t('kiki.test')}</button>
    {#if zero}<p class="hint warn" data-kiki-zero>{t('kiki.testZero')}</p>
    {:else}<p class="hint">{tested ? t('kiki.testHint') : t('kiki.set.earphones')}</p>{/if}
    <p class="about">{t('kiki.welcome.check')}</p>
  {/if}
</div>

<div class="level-acts">
  {#if step === 1}
    <button type="button" class="btn paper" data-kiki-later data-sfx="back" onclick={onlater}>{t('kiki.welcome.later')}</button>
    <button type="button" class="btn" data-kiki-welcome-go data-sfx="confirm" onclick={() => (step = 2)}>{t('kiki.startSolo')}</button>
  {:else}
    <button type="button" class="btn" data-kiki-check-go data-sfx="confirm" onclick={onstart}>{t('kiki.welcome.toCheck')}</button>
  {/if}
</div>

<style>
  .welcome { display: grid; justify-items: center; gap: 12px; padding: 18px 16px 20px; text-align: center; }
  .dots { list-style: none; display: flex; gap: 8px; margin: 0; padding: 0; }
  .dots li { width: 8px; height: 8px; border-radius: 50%; background: var(--ctl-off); box-shadow: inset 0 0 0 1.5px var(--edge); }
  .dots li.on { width: 22px; border-radius: var(--r-pill); background: var(--c-leaf); box-shadow: none; }
  .dots li.done { background: var(--c-leaf); box-shadow: none; }
  .say { margin: 0; font: 700 var(--fs-talk)/1.45 var(--font-ui); }
  .points { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; width: 100%; text-align: left; }
  .points li {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--r-card);
    background: color-mix(in srgb, var(--c-mint) 22%, var(--card)); font: 700 var(--fs-body)/1.35 var(--font-ui);
  }
  .points span { flex: none; font-size: 20px; line-height: 1; }
  .hint, .about { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hint.warn { color: var(--coral-text); }
  .about { font-size: var(--fs-body); color: var(--text); }
</style>
