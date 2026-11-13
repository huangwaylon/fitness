<script lang="ts">
  // ことば タイル's results (docs/kikimimi-engine.md "ことば タイル"), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, the team's tally, how many I got right, my いっぱつ, おわる / もういっかい): co-op's 「ふたりで k / n」 counts the
  // sentences the team built whole (each half right: the session's `team.all`). Then the review list
  // (frame/ReviewList.svelte), the misses first: each sentence, tapped open, with its sound marks and the karaoke as ▶︎
  // plays it, the marks' key, the Japanese, the trap's note, 解説 and the words I heard wrong (TileRow). もういっかい: the host a new
  // deal of the same place (solo at once, shared re-invited), another back to the invite.
  import type { QuizGame } from '../game.svelte.ts';
  import type { TileCard } from '#lib/kikimimi/games/tile/def.ts';
  import { hostLine, isCoop, playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import { Review } from '../frame/review.svelte.ts';
  import TileRow, { tileRow } from './TileRow.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as TileCard[]);
  const coop = $derived(isCoop(v));
  const rows = $derived(cards.map((_, i) => tileRow(game, i)));
  const tally = $derived(rows.filter((r) => r.ok).length);
  const firsts = $derived(rows.filter((r) => r.first).length);
  /** The team's sentences built whole (co-op), else mine. */
  const made = $derived(coop ? v.team.all : tally);
  const line = $derived(t(hostLine('kiki.tile.host', made, cards.length)));
  const frameV = $derived({ ...v, team: { ...v.team, right: v.team.all, all: 0 } });

  // with misses, the list opens on them, the first one open
  const review = new Review(() => rows.filter((r) => !r.ok).map((r) => r.i));
  const shown = $derived(review.shown(rows));

  const again = () => playAgain(game, 'tile', onagain);
</script>

<ResultsFrame v={frameV} {tally} of={cards.length} {firsts} {line} {ondone} onagain={again}>
  <ReviewList {review} none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        <TileRow {game} {r} open={review.isOpen(r.i)} ontoggle={() => review.toggle(r.i)} />
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
</style>
