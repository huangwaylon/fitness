<script lang="ts">
  // 英語すごろく's 結果 (docs/sugoroku.md "Rules"): a team game, no ranking: the team's stars against its goal, the
  // かいがら, each one's good thing, ふりかえり (Review) and 今日のことば; もう一度遊ぶ back to the setup, the same table.
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Review from './Review.svelte';
  import { teamGoal, teamStars, type Game } from '../game.ts';
  import { highlightOf, pairsOf } from './results.ts';
  import { s } from '../i18n.ts';

  interface Props {
    g: Game;
    /** The team's last total on this phone (beaten: said; not: nothing). */
    lastTotal: number | null;
    /** The game's かいがら for each of us (0: not played enough). */
    shells: number;
    onback: () => void;
    onclose: () => void;
    onagain: () => void;
  }
  let { g, lastTotal, shells, onback, onclose, onagain }: Props = $props();
  const stars = $derived(teamStars(g)), goal = $derived(teamGoal(g));
  const pairs = $derived(pairsOf(g));
</script>

<div class="top"><NavBar pad title={s('results')} {onback} {onclose} /></div>
<div class="body sheet-scroll" data-sg-results>
  <div class="card pad podium" data-sg-team-end>
    <p class="win">{s('endTitle')}</p>
    <p class="total"><Icon name="star" size={22} soft /><b>{stars}</b><span class="goal">/ {goal}</span></p>
    <p class="note centre">{stars >= goal ? s('goalMet', { n: stars }) : s('goalNear', { k: goal - stars })}</p>
    {#if lastTotal !== null && stars > lastTotal}<p class="note centre">{s('beatLast', { d: stars - lastTotal })}</p>{/if}
    <p class="shells" data-sg-shells={shells}>{shells ? s('shells', { n: shells }) : s('shellsLater')}</p>
    {#each g.players as p, k (k)}
      <div class="rrow" data-sg-hl={k}>
        <Avatar person={p.who} worn size={40} />
        <span class="nm">{p.name}<small class="hl">{highlightOf(g, k)}</small></span>
      </div>
    {/each}
  </div>
  {#if pairs.length >= 2}<Review {pairs} seed={g.seed} />{/if}
  {#if g.made.length}
    <h3 class="sec-label">{s('recap')}</h3>
    <div class="card dense" role="list">
      {#each g.made as m, i (i)}
        <div class="row recap" role="listitem">
          <Avatar person={g.players[m.p].who} worn size={24} />
          <span class="txt"><span lang="en" class="en2">{m.text}</span>{#if m.ja}<span class="ja2">{m.ja}</span>{/if}</span>
        </div>
      {/each}
    </div>
  {/if}
  <button type="button" class="btn" data-sfx="open" data-sg-again onclick={onagain}>{s('again')}</button>
</div>

<style>
  .top { flex: none; background-color: var(--surface); }
  .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px;
    padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .body > * { flex-shrink: 0; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .centre { text-align: center; }
  .podium { display: flex; flex-direction: column; gap: 8px; }
  .win { margin: 0 0 4px; text-align: center; font: 700 22px/1.3 var(--font-ui); }
  .total { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 0; color: var(--c-gold); }
  .total b { font: 600 34px/1 var(--font-num); color: var(--text); }
  .total .goal { font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .shells { margin: 2px 0 6px; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .rrow { display: flex; align-items: center; gap: 10px; }
  .nm { flex: 1; min-width: 0; font: 700 var(--fs-body)/1.2 var(--font-ui); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .hl { display: block; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .recap { display: flex !important; align-items: center; gap: 8px; }
  .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .en2 { font: 600 var(--fs-body)/1.3 var(--font-body); }
  .ja2 { font-size: var(--fs-s); color: var(--text-soft); }
</style>
