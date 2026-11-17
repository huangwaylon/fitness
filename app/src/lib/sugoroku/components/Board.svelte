<script lang="ts">
  // 英語すごろく's board (docs/sugoroku.md "The board"): the route as a snake of COLS × ROWS cells, each space its kind's
  // colour and name, the stretch's place on its first space; the players' heads on their spaces (the one whose turn it
  // is ringed in yuzu). `shown`: each player's drawn space (the sheet walks it a space at a time after a spin).
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import { BOARD, COLS, ROWS, cellOf } from '../board.ts';
  import type { Player } from '../game.ts';
  import { s } from '../i18n.ts';

  let { players, shown, turn, lucky }: { players: readonly Player[]; shown: readonly number[]; turn: number; lucky: readonly string[] } = $props();
  const firstOfArea = (i: number) => i === 0 || BOARD[i - 1].area !== BOARD[i].area;
  const at = (i: number) => players.map((p, k) => ({ p, k })).filter(({ k }) => shown[k] === i);
</script>

<div class="board" role="img" aria-label={s('board')} style:--cols={COLS} style:--rows={ROWS} data-sg-board>
  {#each BOARD as sp, i (i)}
    {@const c = cellOf(i)}
    <div class="cell k-{sp.kind}" style:grid-row={c.row + 1} style:grid-column={c.col + 1} data-sg-space={i} data-kind={sp.kind}>
      {#if firstOfArea(i) && sp.kind !== 'goal'}<span class="area">{s(`area.${sp.area}`)}</span>{/if}
      <span class="kind">{s(`kind.${sp.kind}`)}</span>
      <span class="heads">
        {#each at(i) as { p, k } (k)}
          <span class="head" class:now={k === turn} data-sg-token={k}><Avatar person={p.who ?? 'G'} villager={p.villager} worn={!p.villager} size={24} /></span>
        {/each}
      </span>
    </div>
  {/each}
</div>
<p class="lucky">{s('lucky')} {#each lucky as l (l)}<b class="lt" lang="en">{l.toUpperCase()}</b>{/each}<span class="soft">{s('luckyNote')}</span></p>

<style>
  .board {
    display: grid; grid-template-columns: repeat(var(--cols), minmax(0, 1fr)); grid-template-rows: repeat(var(--rows), 58px);
    gap: 5px; padding: 8px; border-radius: var(--r-card); background: color-mix(in srgb, var(--c-mint) 30%, var(--c-card));
    box-shadow: 0 3px 0 var(--c-edge);
  }
  .cell {
    position: relative; display: flex; flex-direction: column; justify-content: space-between; min-width: 0;
    padding: 3px 4px; border-radius: 12px; background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge);
    font: 700 11px/1.1 var(--font-ui); color: var(--text-soft); overflow: hidden;
  }
  .k-double { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-card)); color: var(--c-ink); }
  .k-sentence { background: color-mix(in srgb, var(--c-mint) 60%, var(--c-card)); color: var(--c-ink); }
  .k-event { background: color-mix(in srgb, var(--c-lilac) 55%, var(--c-card)); color: var(--c-ink); }
  .k-start, .k-goal { background: color-mix(in srgb, var(--c-yuzu) 70%, var(--c-card)); color: var(--c-ink); }
  .area { font-size: 10px; color: var(--c-ink); opacity: .75; white-space: nowrap; }
  .kind { white-space: nowrap; }
  .heads { display: flex; flex-wrap: wrap; gap: 1px; min-height: 24px; }
  .head { display: inline-flex; border-radius: 50%; transition: transform 140ms var(--ease-soft); }
  .head.now { box-shadow: 0 0 0 2px var(--c-yuzu), 0 0 0 4px var(--c-ink); transform: scale(1.08); z-index: 1; }
  .lucky { display: flex; align-items: center; gap: 6px; margin: 6px 2px 0; font: 700 var(--fs-s)/1 var(--font-ui); }
  .lt { display: inline-grid; place-items: center; width: 24px; height: 24px; border-radius: 6px; background: var(--c-yuzu);
    box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 600 15px/1 var(--font-num); }
  .soft { color: var(--text-soft); font-weight: 500; }
</style>
