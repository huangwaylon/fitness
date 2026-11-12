<script lang="ts" module>
  import type { QuizGame } from '../game.svelte.ts';
  import { EMPTY } from '#lib/kikimimi/games/listened.ts';
  import { tileOk, slotOk, type TileCard } from '#lib/kikimimi/games/tile/def.ts';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import { boardFor, mySlots } from './board.ts';

  /** A sentence's review: right, its wrong slots (the word and what I put there), a first listen. */
  export function tileRow(game: QuizGame, i: number) {
    const v = game.view, c = game.items[i] as TileCard, a = v.answers[i], given = a && Array.isArray(a.a) ? (a.a as readonly number[]) : null;
    const board = boardFor(v, c), r = { tiles: c.tile.tiles, board };
    const ok = !!given && tileOk(r, given);
    const wrong = given ? mySlots(v, game.me, c.tile.tiles.length).filter((j) => !slotOk(r, given, j)).map((j) => ({ word: c.tile.tiles[j], put: given[j] === EMPTY ? null : board[given[j]] })) : [];
    return { c, i, ok, wrong, first: firstListen(ok, !!a?.rp, v.same) };
  }
  export type TileRowData = ReturnType<typeof tileRow>;
</script>

<script lang="ts">
  // One sentence of ことば タイル's review (the results' list, and the round's 前の問題 card: frame/LookBack.svelte): tapped
  // open, its sound marks and the karaoke as ▶︎ plays it (a review's play: game.hear), the marks' key, the Japanese, the
  // words I heard wrong, the trap's note and 解説.
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Note from '../frame/Note.svelte';
  import Why from '../frame/Why.svelte';
  import SoundLine from '../scene/SoundLine.svelte';
  import MarkLegend from '../scene/MarkLegend.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, r, open, ontoggle, canHear = true }: { game: QuizGame; r: TileRowData; open: boolean; ontoggle: () => void; canHear?: boolean } = $props();
  const playing = $derived(game.sounding && game.sounding.i === -1 && game.sounding.at === r.c.id ? game.sounding.from : null);
</script>

<ReviewRow i={r.i} ok={r.ok} {open} {ontoggle} first={r.first}>
  {#snippet summary()}
    {#if open}<span class="en big" data-kiki-review-en><SoundLine en={r.c.en} marks={r.c.marks} clip={r.c.id} from={playing} clock={() => game.clock()} /></span>
    {:else}<span class="en" lang="en">{r.c.en}</span>{/if}
  {/snippet}
  {#snippet hear()}<HearButton data-kiki-hear={r.i} aria-disabled={!canHear} onclick={() => canHear && game.hear(r.c)} />{/snippet}
  {#if r.c.marks}<MarkLegend marks={r.c.marks} />{/if}
  <p class="ja">{r.c.ja}</p>
  {#if r.wrong.length}
    <p class="picked" data-kiki-tile-heard>{t('kiki.tile.heard', { w: r.wrong.map((x) => `${x.put ?? '—'} → ${x.word}`).join('、') })}</p>
  {/if}
  {#if r.c.note}<Note text={r.c.note} />{/if}
  {#if r.c.why}<Why text={r.c.why} />{/if}
</ReviewRow>

<style>
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .en.big { font-size: max(17px, var(--fs-talk)); }
  .ja, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .picked { color: var(--coral-text); }
</style>
