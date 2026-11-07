<script lang="ts">
  // ことば タイル's results (docs/curriculum-wave2.md §2.1), its own chunk, in the frame's (frame/Results.svelte: しずえ's
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
  import { isCoop, playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import Why from '../frame/Why.svelte';
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
  const line = $derived(t(made >= cards.length ? 'kiki.tile.host.all' : made * 2 >= cards.length ? 'kiki.tile.host.some' : 'kiki.tile.host.few'));
  const frameV = $derived({ ...v, team: { ...v.team, right: v.team.all, all: 0 } });

  // with misses, the list opens on them, the first one open (the filter and the rows are mine after)
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(rows.some((r) => !r.ok));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>(rows.filter((r) => !r.ok).slice(0, 1).map((r) => r.i));
  const toggle = (i: number) => (opened = opened.includes(i) ? opened.filter((x) => x !== i) : [...opened, i]);
  const shown = $derived(rows.filter((r) => !missedOnly || !r.ok));
  const playing = (c: TileCard) => (game.sounding && game.sounding.i === -1 && game.sounding.at === c.id ? game.sounding.from : null);

  const again = () => playAgain(game, 'tile', onagain);
</script>

<ResultsFrame v={frameV} {tally} of={cards.length} {firsts} {line} {ondone} onagain={again}>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        {@const open = opened.includes(r.i)}
        <li class="item card" data-review={r.i} data-ok={r.ok} data-open={open}>
          <button type="button" class="head" aria-expanded={open} data-kiki-row={r.i} data-sfx="tick" onclick={() => toggle(r.i)}>
            <span class="sym" class:ok={r.ok}><span aria-hidden="true">{r.ok ? '○' : '×'}</span><span class="sr-only">{r.ok ? t('kiki.right') : t('kiki.wrong')}</span></span>
            <span class="sum">
              {#if open}<span class="en big" data-kiki-review-en><SoundLine en={r.c.en} marks={r.c.marks} clip={r.c.id} from={playing(r.c)} clock={() => game.clock()} /></span>
              {:else}<span class="en" lang="en">{r.c.en}</span>{/if}
            </span>
            {#if r.first}<span class="stamp obj-cream">{t('kiki.firstTry')}</span>{/if}
            <span class="chev" aria-hidden="true">{open ? '▴' : '▾'}</span>
          </button>
          {#if open}
            <div class="txt" data-kiki-detail={r.i}>
              {#if r.c.marks}<MarkLegend marks={r.c.marks} />{/if}
              <p class="ja">{r.c.ja}</p>
              {#if r.wrong.length}
                <p class="picked" data-kiki-tile-heard>{t('kiki.tile.heard', { w: r.wrong.map((x) => `${x.put ?? '—'} → ${x.word}`).join('、') })}</p>
              {/if}
              {#if r.c.note}<p class="note" data-kiki-note>{r.c.note}</p>{/if}
              {#if r.c.why}<Why text={r.c.why} />{/if}
              <div class="hear">
                <button type="button" class="ib tile-btn" aria-label={t('kiki.play')} data-kiki-hear={r.i} data-sfx="tick" onclick={() => game.hear(r.c)}>▶︎</button>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .item { display: grid; gap: 8px; padding: 0; }
  .head {
    appearance: none; border: 0; background: none; color: inherit; font: inherit; text-align: left; cursor: pointer; width: 100%;
    display: grid; grid-template-columns: auto 1fr auto auto; align-items: start; gap: 10px; padding: 12px 14px; min-height: var(--hit);
  }
  .sum { min-width: 0; display: grid; gap: 2px; }
  .sym { font: 700 22px/1.2 var(--font-ui); color: var(--coral-text); }
  .sym.ok { color: var(--leaf-text); }
  .chev { font: 700 var(--fs-s)/1.6 var(--font-ui); color: var(--text-soft); }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .en.big { font-size: max(17px, var(--fs-talk)); }
  .txt { min-width: 0; display: grid; gap: 6px; padding: 0 14px 12px 46px; }
  .ja, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .picked { color: var(--coral-text); }
  .note { margin: 0; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); padding: 6px 10px; border-radius: 10px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
  .stamp {
    display: inline-block; padding: 2px 6px; border-radius: 8px; rotate: -4deg; white-space: nowrap; color: var(--coral-text);
    background: color-mix(in srgb, var(--c-yuzu) 45%, var(--c-card)); box-shadow: inset 0 0 0 2px var(--c-coral); font: 700 var(--fs-s)/1.2 var(--font-ui);
  }
  .hear { display: flex; gap: 6px; }
  .ib { width: var(--hit); height: var(--hit); border-radius: 50%; display: grid; place-items: center; font: 700 18px/1 var(--font-ui); }
</style>
