<script lang="ts">
  // はつおん ききわけ's end (docs/kikimimi-mic.md "はつおん ききわけ"), its own chunk: しずえ's word, 「通じた k / n」 (solo mine; あてっこ the
  // team's, never who), the cards with both words (▶︎ each) and the one I was to say, that only my minutes are kept, and
  // おわる / もういっかい (8 new cards).
  import '#lib/i18n/kiki-pair.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import { sayOf } from '#lib/kikimimi/games/pair/def.ts';
  import type { PairCard } from '#lib/kikimimi/games/pair/pairs.ts';
  import { wordItem } from './board.ts';
  import { playAgain } from '../listenView.ts';
  import ResultsShell from '../frame/ResultsShell.svelte';
  import ScoreCard from '../frame/ScoreCard.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as PairCard[]);
</script>

<ResultsShell line={t('kiki.pair.host')} {ondone} onagain={() => playAgain(game, 'pair', onagain)} data-pair-results>
  <ScoreCard data-pair-score={v.team.right} note={t('kiki.pair.row')}>
    <b class="big">{t('kiki.pair.score', { k: v.team.right, n: cards.length })}</b>
  </ScoreCard>
  <section class="sec" aria-labelledby="pair-cards">
    <h3 id="pair-cards" class="sec-label">{t('kiki.pair.cards')}</h3>
    <ul class="list">
      {#each cards as c (c.id)}
        {@const say = sayOf(v.seed, c.id)}
        <li class="card" data-pair-card={c.id}>
          {#each c.pair.words as w, k (w.en)}
            <button type="button" class="word" class:say={k === say} aria-label={t('kiki.pair.hear', { w: w.en })} data-sfx="tick" onclick={() => game.hear(wordItem(c, k))}>
              <span class="pic" aria-hidden="true">{w.pic}</span><b lang="en">{w.en}</b>{#if w.ja !== w.pic}<small>{w.ja}</small>{/if}<span class="play" aria-hidden="true">▶︎</span>
            </button>
          {/each}
        </li>
      {/each}
    </ul>
  </section>
</ResultsShell>

<style>
  .sec { display: grid; gap: 8px; }
  .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .list li { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 8px; }
  .word {
    display: grid; grid-template-columns: auto 1fr auto; grid-template-rows: auto auto; align-items: center; column-gap: 8px; padding: 6px 10px;
    min-height: var(--hit); border: 0; border-radius: 14px; background: var(--ctl-off); color: var(--text); text-align: left; cursor: pointer;
  }
  .word.say { background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); }
  .pic { grid-row: 1 / 3; font: 400 26px/1 var(--font-ui); }
  .word b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .word small { grid-column: 2; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .play { grid-column: 3; grid-row: 1 / 3; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
</style>
