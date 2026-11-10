<script lang="ts">
  // ことば タイル's results (docs/kikimimi-engine.md "ことば タイル"), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, the team's tally, how many I got right, my いっぱつ, おわる / もういっかい): co-op's 「ふたりで k / n」 counts the
  // sentences the team built whole (each half right: the session's `team.all`). Then the review list
  // (frame/ReviewList.svelte), the misses first: each sentence, tapped open, with its sound marks and the karaoke as ▶︎
  // plays it, the marks' key, the Japanese, the trap's note, 解説 and the words I heard wrong. もういっかい: the host a new
  // deal of the same place (solo at once, shared re-invited), another back to the invite.
  import type { QuizGame } from '../game.svelte.ts';
  import { EMPTY } from '#lib/kikimimi/games/listened.ts';
  import { tileOk, slotOk, type TileCard } from '#lib/kikimimi/games/tile/def.ts';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import { boardFor, mySlots } from './board.ts';
  import { hostLine, isCoop, playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import { Review } from '../frame/review.svelte.ts';
  import Why from '../frame/Why.svelte';
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Note from '../frame/Note.svelte';
  import SoundLine from '../scene/SoundLine.svelte';
  import MarkLegend from '../scene/MarkLegend.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as TileCard[]);
  const coop = $derived(isCoop(v));
  /** Each sentence: right, its wrong slots (the word and what I put there), a first listen. */
  const rows = $derived(cards.map((c, i) => {
    const a = v.answers[i], given = a && Array.isArray(a.a) ? (a.a as readonly number[]) : null, board = boardFor(v, c), r = { tiles: c.tile.tiles, board };
    const ok = !!given && tileOk(r, given);
    const wrong = given ? mySlots(v, game.me, c.tile.tiles.length).filter((j) => !slotOk(r, given, j)).map((j) => ({ word: c.tile.tiles[j], put: given[j] === EMPTY ? null : board[given[j]] })) : [];
    return { c, i, ok, wrong, first: firstListen(ok, !!a?.rp, v.same) };
  }));
  const tally = $derived(rows.filter((r) => r.ok).length);
  const firsts = $derived(rows.filter((r) => r.first).length);
  /** The team's sentences built whole (co-op), else mine. */
  const made = $derived(coop ? v.team.all : tally);
  const line = $derived(t(hostLine('kiki.tile.host', made, cards.length)));
  const frameV = $derived({ ...v, team: { ...v.team, right: v.team.all, all: 0 } });

  // with misses, the list opens on them, the first one open
  const review = new Review(() => rows.filter((r) => !r.ok).map((r) => r.i));
  const shown = $derived(review.shown(rows));
  const playing = (c: TileCard) => (game.sounding && game.sounding.i === -1 && game.sounding.at === c.id ? game.sounding.from : null);

  const again = () => playAgain(game, 'tile', onagain);
</script>

<ResultsFrame v={frameV} {tally} of={cards.length} {firsts} {line} {ondone} onagain={again}>
  <ReviewList {review} none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        {@const open = review.isOpen(r.i)}
        <ReviewRow i={r.i} ok={r.ok} {open} ontoggle={() => review.toggle(r.i)} first={r.first}>
          {#snippet summary()}
            {#if open}<span class="en big" data-kiki-review-en><SoundLine en={r.c.en} marks={r.c.marks} clip={r.c.id} from={playing(r.c)} clock={() => game.clock()} /></span>
            {:else}<span class="en" lang="en">{r.c.en}</span>{/if}
          {/snippet}
          {#snippet hear()}<HearButton data-kiki-hear={r.i} onclick={() => game.hear(r.c)} />{/snippet}
          {#if r.c.marks}<MarkLegend marks={r.c.marks} />{/if}
          <p class="ja">{r.c.ja}</p>
          {#if r.wrong.length}
            <p class="picked" data-kiki-tile-heard>{t('kiki.tile.heard', { w: r.wrong.map((x) => `${x.put ?? '—'} → ${x.word}`).join('、') })}</p>
          {/if}
          {#if r.c.note}<Note text={r.c.note} />{/if}
          {#if r.c.why}<Why text={r.c.why} />{/if}
        </ReviewRow>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .en.big { font-size: max(17px, var(--fs-talk)); }
  .ja, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .picked { color: var(--coral-text); }
</style>
