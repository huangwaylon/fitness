<script lang="ts">
  // まねっこ シャドーイング's end (docs/kikimimi-mic.md "まねっこ シャドーイング"), its own chunk: しずえ's word (no score, no tally), the lines
  // I said, each with ▶︎ to hear it again and its Japanese, that only my minutes are kept, and おわる / もういっかい (4 new
  // lines at the same level, at once).
  import '#lib/i18n/kiki-mane.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import { lineJa } from '#lib/kikimimi/games/mane/def.ts';
  import ResultsShell from '../frame/ResultsShell.svelte';
  import ScoreCard from '../frame/ScoreCard.svelte';
  import LineRow from '../frame/LineRow.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);

  function again() {
    const lv = v.lv, timer = v.timer;
    onagain();
    game.setGame('mane', { lv, timer });
    game.go();
  }
</script>

<ResultsShell line={t('kiki.mane.host')} {ondone} onagain={again} data-mane-results>
  <ScoreCard note={t('kiki.mane.row')}>
    <b class="big">{t('kiki.mane.count', { n: game.items.length })}</b>
  </ScoreCard>
  <section class="sec" aria-labelledby="mane-lines">
    <h3 id="mane-lines" class="sec-label">{t('kiki.mane.lines')}</h3>
    <ul class="list">
      {#each game.items as it (it.id)}
        <LineRow data-mane-line={it.id} en={it.en} ja={lineJa(it)} onhear={() => game.hear(it)} hear={{ 'aria-label': t('kiki.mane.hear') }} />
      {/each}
    </ul>
  </section>
</ResultsShell>

<style>
  .sec { display: grid; gap: 8px; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
</style>
