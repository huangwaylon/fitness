<script lang="ts">
  // すうじ ラッシュ's results (docs/kikimimi-engine.md "すうじ ラッシュ"), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, co-op's 「ふたりで k / n」 the customers served, how many of mine I got right, my いっぱつ, おわる / もういっかい),
  // the best combo, then the review list (frame/ReviewList.svelte), the misses first: each customer's question and the
  // right chip; tapped open, ▶︎, what they said and its Japanese, the pick when it was wrong (co-op the register's), the
  // trap's note and 解説. もういっかい: the host a new queue at the same place.
  import type { QuizGame } from '../game.svelte.ts';
  import { PASS, type RushCard } from '#lib/kikimimi/games/rush/def.ts';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import { authoredPick, comboBest, myTurn, othersAt, roundFor } from './board.ts';
  import { hostLine, isCoop, playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import { Review } from '../frame/review.svelte.ts';
  import Why from '../frame/Why.svelte';
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Note from '../frame/Note.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as RushCard[]);
  const coop = $derived(isCoop(v));
  /** Each customer: mine or the partner's, right, the pick as authored (the register's), a first listen. */
  const rows = $derived(cards.map((c, i) => {
    const turn = myTurn(v, game.me, i), a = v.answers[i];
    const other = turn ? undefined : (othersAt(v, game.me, i) ?? [])[0];
    const k = turn ? (a && a.k !== PASS ? a.k : null) : (other?.k ?? null);
    const ok = turn ? k !== null && k === roundFor(v, c).answer : !!other?.ok;
    const pick = turn ? authoredPick(v, c, k) : other ? authoredPick(v, c, other.k, other.who) : null;
    return { c, i, turn, ok, pick, first: turn && firstListen(ok, !!a?.rp, v.same) };
  }));
  const mineRows = $derived(rows.filter((r) => r.turn));
  const tally = $derived(mineRows.filter((r) => r.ok).length);
  const firsts = $derived(mineRows.filter((r) => r.first).length);
  const served = $derived(coop ? v.team.right : tally);
  const best = $derived(comboBest(v, cards, game.me));
  const line = $derived(t(hostLine('kiki.rush.host', served, cards.length)));
  const frameV = $derived({ ...v, team: { ...v.team, all: 0 } });

  // with misses, the list opens on them, the first one open
  const review = new Review(() => rows.filter((r) => !r.ok).map((r) => r.i));
  const shown = $derived(review.shown(rows));
</script>

{#snippet more()}
  <span class="sub" data-kiki-rush-served={served}>{t('kiki.rush.served', { k: served, n: cards.length })}</span>
  {#if best >= 2}<span class="best obj-cream" data-kiki-rush-best={best}>{t('kiki.rush.best', { n: best })}</span>{/if}
{/snippet}

<ResultsFrame v={frameV} {tally} of={mineRows.length} {firsts} {line} {more} {ondone} onagain={() => playAgain(game, 'rush', onagain)}>
  <ReviewList {review} none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        <ReviewRow i={r.i} ok={r.ok} open={review.isOpen(r.i)} ontoggle={() => review.toggle(r.i)} first={r.first}>
          {#snippet summary()}<span>{r.c.rush.ask} <b>{r.c.choices[r.c.answer]}</b></span>{/snippet}
          {#snippet hear()}<HearButton data-kiki-hear={r.i} onclick={() => game.hear(r.c)} />{/snippet}
          <p class="en" lang="en">{r.c.en}</p>
          <p class="ja">{r.c.ja}</p>
          {#if !r.ok}
            <p class="picked" data-kiki-rush-picked>{r.turn ? t('kiki.rush.mineWas', { a: r.pick !== null ? r.c.choices[r.pick] : t('kiki.timeUp') }) : t('kiki.rush.partner', { a: r.pick !== null ? r.c.choices[r.pick] : t('kiki.timeUp') })}</p>
          {/if}
          {#if r.c.note}<Note text={r.c.note} />{/if}
          {#if r.c.why}<Why text={r.c.why} />{/if}
        </ReviewRow>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .best { padding: 3px 10px; border-radius: var(--r-pill); color: var(--c-ink); background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .review b { font: 700 var(--fs-body)/1.3 var(--font-num); margin-left: 4px; }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .ja, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .picked { color: var(--coral-text); }
</style>
