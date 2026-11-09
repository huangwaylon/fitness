<script lang="ts">
  // くりかえし チャレンジ's results (docs/kikimimi-mic.md "くりかえし チャレンジ"), its own chunk: しずえ's line, how far the run got
  // (「ここまで 14語！」: the longest sentence said) and how many sentences came through, shown only to you; then the run's
  // sentences, each with ○ / × (– skipped), its Japanese and ▶︎. What was heard isn't here: it went with the round. もういっかい: a new run at the same level, at once.
  import type { QuizGame } from '../game.svelte.ts';
  import { playAgain } from '../listenView.ts';
  import { answerOf, reached, saidOk } from '#lib/kikimimi/games/kuri/def.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import { jaOf } from './board.ts';
  import ResultsShell from '../frame/ResultsShell.svelte';
  import ScoreCard from '../frame/ScoreCard.svelte';
  import LineRow from '../frame/LineRow.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const rows = $derived(game.items.map((it, i) => {
    const a = answerOf(rawOf(v.answers[i]));
    return { it, i, mark: !a || !a.heard ? 'skip' : saidOk(a) ? 'ok' : 'miss' };
  }));
  const words = $derived(reached(game.items, v.answers.map(rawOf)));
  const said = $derived(rows.filter((r) => r.mark === 'ok').length);
  const line = $derived(t(words >= 12 ? 'kiki.kuri.host.long' : words ? 'kiki.kuri.host.some' : 'kiki.kuri.host.none'));

</script>

<ResultsShell {line} {ondone} onagain={() => playAgain(game, 'kuri', onagain)} data-kuri-results>
  <ScoreCard data-kuri-reached={words} note={t('kiki.kuri.private')}>
    <b class="big">{words ? t('kiki.kuri.reached', { n: words }) : t('kiki.kuri.reachedNone')}</b>
    <span class="sub">{t('kiki.kuri.sentences', { k: said, n: rows.length })}</span>
  </ScoreCard>

  <section class="sec" aria-labelledby="kk-kuri-list">
    <h3 id="kk-kuri-list" class="sec-label">{t('kiki.kuri.list')}</h3>
    <ol class="list">
      {#each rows as r (r.i)}
        <LineRow data-kuri-row={r.i} data-mark={r.mark} sym={r.mark === 'ok' ? '○' : r.mark === 'miss' ? '×' : '–'} tone={r.mark === 'ok' ? 'ok' : r.mark === 'miss' ? 'miss' : 'soft'}
          en={r.it.en} ja={jaOf(r.it)} onhear={() => game.hear(r.it)} hear={{ 'data-kuri-hear': r.i }} />
      {/each}
    </ol>
  </section>
</ResultsShell>

<style>
  .sec { display: grid; gap: 8px; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
</style>
