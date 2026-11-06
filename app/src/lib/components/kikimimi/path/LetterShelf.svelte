<script lang="ts">
  // The villagers' letters, newest first (docs/kikimimi-ux.md U7, §6.10 ずかん › スタンプ): one for each unit I've
  // stamped (letters.ts lettersOf over my stamps and the letters chunk, loaded here), each a folded envelope that opens in
  // place. None yet: a quiet line. In ずかん › スタンプ (zukan/Stamps.svelte), under the can-do stamps.
  import { lettersOf, type LetterText } from '#lib/kikimimi/letters.ts';
  import { loadLetters } from '#lib/kikimimi/pool.ts';
  import { currentUnits, pathUnits } from '../progress.svelte.ts';
  import VillagerLetter from './VillagerLetter.svelte';
  import { t } from '#lib/i18n/index.ts';

  let texts = $state.raw<Readonly<Record<string, LetterText>>>();
  $effect(() => {
    void loadLetters().then((x) => (texts = x), () => {});
  });
  const letters = $derived(lettersOf(pathUnits(), currentUnits(), texts));
</script>

<section class="shelf" data-kiki-letters={letters.length} aria-labelledby="kk-letters">
  <h3 id="kk-letters" class="sec-label">{t('kiki.letter.title')}</h3>
  {#each letters as l (l.unit)}
    <VillagerLetter letter={l} />
  {:else}
    {#if texts}<p class="none">{t('kiki.letter.none')}</p>{/if}
  {/each}
</section>

<style>
  .shelf { display: grid; gap: 8px; }
  .shelf .sec-label { margin: 0 4px; }
  .none { margin: 0; padding: 14px; border-radius: var(--r-card); text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); box-shadow: inset 0 0 0 2px var(--ctl-off); }
</style>
