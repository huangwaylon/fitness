<script lang="ts">
  // はつおん ききわけ's end (docs/kikimimi-mic.md §2.4), its own chunk: しずえ's word, 「通じた k / n」 (solo mine; あてっこ the
  // team's, never who), the cards with both words (▶︎ each) and the one I was to say, that only my minutes are kept, and
  // おわる / もういっかい (8 new cards).
  import '#lib/i18n/kiki-pair.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import { sayOf } from '#lib/kikimimi/games/pair/def.ts';
  import type { PairCard } from '#lib/kikimimi/games/pair/pairs.ts';
  import { wordItem } from './board.ts';
  import { playAgain } from '../listenView.ts';
  import Bubble from '../../ui/Bubble.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as PairCard[]);
</script>

<div class="results" data-kiki-results data-pair-results>
  <Bubble text={t('kiki.pair.host')} host="wave" size={64} />
  <p class="score"><span class="pill" data-pair-score={v.team.right}>👄 {t('kiki.pair.score', { k: v.team.right, n: cards.length })}</span></p>
  <section class="cards card" aria-labelledby="pair-cards">
    <h3 id="pair-cards" class="sec-label">{t('kiki.pair.cards')}</h3>
    <ul>
      {#each cards as c (c.id)}
        {@const say = sayOf(v.seed, c.id)}
        <li data-pair-card={c.id}>
          {#each c.pair.words as w, k (w.en)}
            <button type="button" class="word" class:say={k === say} aria-label={t('kiki.pair.hear', { w: w.en })} data-sfx="tick" onclick={() => game.hear(wordItem(c, k))}>
              <span class="pic" aria-hidden="true">{w.pic}</span><b lang="en">{w.en}</b>{#if w.ja !== w.pic}<small>{w.ja}</small>{/if}<span class="play" aria-hidden="true">▶︎</span>
            </button>
          {/each}
        </li>
      {/each}
    </ul>
  </section>
  <p class="hint">{t('kiki.pair.row')}</p>
</div>

<div class="level-acts">
  <button type="button" class="btn paper" data-kiki-done data-sfx="back" onclick={ondone}>{t('kiki.done')}</button>
  <button type="button" class="btn" data-kiki-again data-sfx="confirm" onclick={() => playAgain(game, 'pair', onagain)}>{t('kiki.again')}</button>
</div>

<style>
  .results { display: grid; gap: 14px; }
  .results :global(.bubble) { margin-bottom: 0; }
  .score { margin: 0; text-align: center; }
  .pill { display: inline-block; padding: 6px 14px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .cards { display: grid; gap: 8px; padding: 12px 14px; }
  .cards h3 { margin: 0; }
  ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  li { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .word {
    display: grid; grid-template-columns: auto 1fr auto; grid-template-rows: auto auto; align-items: center; column-gap: 8px; padding: 6px 10px;
    min-height: var(--hit); border: 0; border-radius: 14px; background: var(--ctl-off); color: var(--text); text-align: left; cursor: pointer;
  }
  .word.say { background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); }
  .pic { grid-row: 1 / 3; font: 400 26px/1 var(--font-ui); }
  .word b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .word small { grid-column: 2; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .play { grid-column: 3; grid-row: 1 / 3; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .hint { margin: 0 4px; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
