<script lang="ts">
  // The morning after a bedtime chapter (docs/kikimimi-ux.md §6.8; kikimimi/bedtime.ts morningCard): under the menu,
  // by day, 「きのうの つづき、どうなると おもう？」 with the chapter's three guesses (its `predict`), or あとで. Optional and
  // light: nothing is scored, the guess is kept on this phone and revealed when the next chapter is finished
  // (StoryFrame's end card). Shown only while a chapter waits for its guess.
  import type { LocalDate, Who } from '#lib/types.ts';
  import { guess, later, morningCard } from '#lib/kikimimi/bedtime.ts';
  import { loadChapter } from '#lib/kikimimi/pool.ts';
  import type { Chapter } from '#lib/kikimimi/story.ts';
  import { SERIALS, keepSerial, serialOf, storyProgress } from '../story/serials.svelte.ts';
  import { t } from '#lib/i18n/index.ts';

  let { me, today }: { me: Who; today: LocalDate } = $props();
  const card = $derived(morningCard(storyProgress(me), SERIALS.map((s) => ({ unit: s.unit, chapters: s.chapters.length })), today));
  let chapter = $state.raw<Chapter | null>(null);
  /** Just guessed: the thank-you line stays until the hub is left. */
  let thanks = $state(false);
  $effect(() => {
    const c = card, part = c && serialOf(c.unit)?.chapters[c.ch - 1]?.part;
    chapter = null;
    if (part) void loadChapter(part).then((ch) => card === c && (chapter = ch), () => {});
  });
  const predict = $derived(chapter?.predict ?? null);
  function pick(k: number) {
    if (!card || !predict) return;
    keepSerial(me, card.unit, guess(storyProgress(me)[card.unit], card.ch, k, predict.answer));
    thanks = true;
  }
</script>

{#if thanks}
  <p class="mc card thanks" aria-live="polite" data-kiki-predict-thanks>🌙 {t('kiki.story.thanks')}</p>
{:else if card && predict && chapter}
  <section class="mc card" aria-labelledby="kk-predict" data-kiki-predict={chapter.id}>
    <small class="slot">{t('kiki.story.morningSlot')} · {chapter.name}</small>
    <h3 id="kk-predict">{t('kiki.story.morning')}</h3>
    <p class="ask">{predict.ask}</p>
    <div class="choices">
      {#each predict.choices as c, k (k)}
        <button type="button" class="choice tile-btn" lang="en" data-kiki-predict-pick={k} data-sfx="confirm" onclick={() => pick(k)}>{c}</button>
      {/each}
    </div>
    <button type="button" class="later" data-kiki-predict-later data-sfx="back" onclick={() => keepSerial(me, card.unit, later(storyProgress(me)[card.unit], card.ch, today))}>
      {t('kiki.story.later')}
    </button>
  </section>
{/if}

<style>
  .mc { display: grid; gap: 8px; padding: 12px 14px; }
  .slot { font: 700 var(--fs-xs)/1.3 var(--font-ui); letter-spacing: .04em; color: var(--text-soft); }
  h3 { margin: 0; font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .ask { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .choices { display: grid; gap: 6px; }
  .choice { padding: 10px 12px; border-radius: 16px; text-align: left; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .later {
    appearance: none; border: 0; background: none; cursor: pointer; justify-self: end; min-height: var(--hit); padding: 0 8px;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); text-decoration: underline 1px; text-underline-offset: 4px;
  }
  .thanks { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
