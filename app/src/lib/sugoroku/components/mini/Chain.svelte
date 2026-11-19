<script lang="ts">
  // 5 しりとり (mini/chain.ts): the chain one ribbon on every phone (each word in its maker's colour, the start word's
  // tag), whose turn and the letter to start from, the turn's own bar (CHAIN_TURN_MS: a CSS animation from when this
  // phone saw the turn). Whose turn it is (online: on their phone; passed round: the one phone, its head shown) makes a
  // word from the turn's tiles (chain.ts chainRack: the letter fixed first, the hint's word always among them; any real
  // word counts), checked here first (too short, too long, not a word, used: a soft note, the tiles kept); パス (no cost)
  // and ヒント (its first two letters on every phone). The turn's timer: any phone's `next` for its stage (online the
  // seats one after another: the first in counts) skips it.
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Nudge from '../Nudge.svelte';
  import { flashNote } from './note.svelte.ts';
  import { LEVEL } from '../../game.ts';
  import { chainCheck, chainHint, chainRack, chainTurn, letterOf, type ChainState } from '../../mini/chain.ts';
  import { stagePlay } from '../../mini/hands.ts';
  import type { Ctx, Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';

  interface Props {
    s: ChainState; ctx: Ctx; seat: Who | null; live: boolean; mode: 'local' | 'online'; nameOf: (w: Who) => string; play: (p: Play, who?: Who) => void;
    /** My seat's place at the table (online: the turn's timer, one after another). */
    seatIdx: number;
    turnMs: number;
  }
  let { s, ctx, seat, live, mode, nameOf, play, seatIdx, turnMs }: Props = $props();

  const turn = $derived(chainTurn(s));
  /** The turn (a hint's fold isn't a new one: the tiles and the timer kept). */
  const stage = $derived(s.stage);
  const starts = $derived(s.starts);
  /** This phone plays the turn: passed round always (as whose turn it is), online when it's my seat's. */
  const mine = $derived(mode === 'local' || seat === turn);
  const level = $derived(s.seats[s.at].level);
  const letter = $derived(letterOf(s));
  const rack = $derived.by(() => (void stage, chainRack(s, ctx)));
  const hint = $derived(s.hinted ? chainHint(s, ctx) : null);
  let picked = $state<number[]>([]);
  const note = flashNote(), say = note.say;
  // (each turn its own tiles; a whole round passed: a new start word, said)
  let startsSeen = -1;
  $effect(() => {
    void stage;
    picked = [];
    if (startsSeen >= 0 && starts > startsSeen) say(tr('chNew'), 2000);
    startsSeen = starts;
  });
  const word = $derived(letter + picked.map((i) => rack[i]).join(''));
  function submit() {
    if (!mine || !live) return;
    const why = chainCheck(s, turn, word, ctx);
    if (why === 'short') return say(tr('minLen', { n: LEVEL[level].minLen }));
    if (why === 'long') return say(tr('chLong'));
    if (why === 'word') return say(tr('notWord'));
    if (why === 'used') return say(tr('chUsed'));
    if (why) return;
    play({ w: word }, turn);
  }

  // the ribbon: the newest in view as it grows
  let ribbon = $state<HTMLElement | null>(null);
  $effect(() => {
    void s.chain.length;
    if (ribbon) ribbon.scrollLeft = ribbon.scrollWidth;
  });

  // the turn's timer: its `next` (online the seats one after another; passed round this phone's)
  $effect(() => {
    if (!live || (mode === 'online' && !seat)) return;
    const at = stage, wait = turnMs + (mode === 'online' ? seatIdx * 1500 : 0);
    const id = setTimeout(() => play(stagePlay(at), seat ?? turn), wait);
    return () => clearTimeout(id);
  });
</script>

<div class="ch" data-sg-chain={s.chain.length} data-sg-ch-turn={turn}>
  {#if note.text}<Nudge text={note.text} />{/if}
  <ol class="ribbon" lang="en" bind:this={ribbon} data-sg-ch-chain={s.chain.map((l) => l.w).join(' ')}>
    {#each s.chain as l, k (k)}
      <li class="link s-{l.who ?? 'start'}" class:last={k === s.chain.length - 1}>
        {#if !l.who}<small>{tr('chStart')}</small>{/if}<b>{l.w.slice(0, -1)}<u>{l.w.at(-1)}</u></b>
      </li>
    {/each}
  </ol>
  {#key stage}
    <div class="tbar" aria-hidden="true">{#if live}<i style:animation-duration="{turnMs}ms"></i>{/if}</div>
  {/key}
  <div class="whose">
    <Avatar person={turn} worn size={32} />
    <div>
      <b>{tr('chTurn', { name: nameOf(turn) })}</b>
      <p class="letter" data-sg-ch-letter={letter}>{tr('chLetter', { l: letter })}</p>
    </div>
  </div>
  {#if hint}<p class="note centre" data-sg-ch-hinted>{tr('mkHint', { w: hint.slice(0, 2) })}</p>{/if}
  {#if mine}
    <div class="slots sg-strip" lang="en" data-sg-ch-word={word}>
      <span class="sg-tile in first" aria-hidden="true">{letter.toUpperCase()}</span>
      {#each picked as i, k (i)}<button type="button" class="sg-tile in" data-sfx="tick" onclick={() => (picked = picked.slice(0, k))}>{rack[i].toUpperCase()}</button>{/each}
    </div>
    <div class="rack" lang="en" data-sg-ch-rack={rack.join('')}>
      {#each rack as l, i (i)}<button type="button" class="sg-tile" disabled={picked.includes(i) || !live} data-sfx="tick" data-sg-ch-tile={l} onclick={() => (picked = [...picked, i])}>{l.toUpperCase()}</button>{/each}
    </div>
    <div class="acts">
      <button type="button" class="chip big" disabled={!live || s.hinted} data-sfx="tick" data-sg-ch-hint onclick={() => play({ op: 'hint' }, turn)}>{tr('hint')}</button>
      <button type="button" class="chip big" disabled={!live} data-sfx="back" data-sg-ch-pass onclick={() => play({ op: 'pass' }, turn)}>{tr('chPass')}</button>
      <button type="button" class="chip big" aria-label={tr('back1')} disabled={!picked.length} data-sfx="back" onclick={() => (picked = picked.slice(0, -1))}><Icon name="delete-left" size={20} /></button>
      <button type="button" class="btn" disabled={!live || word.length < 2} data-sfx="confirm" data-sg-ch-play onclick={submit}>{tr('play')}</button>
    </div>
  {:else}
    <p class="note centre">{tr('chThinking', { name: nameOf(turn) })}</p>
  {/if}
</div>

<style>
  .ch { display: flex; flex-direction: column; gap: 8px; }
  .ch > :global(*) { flex-shrink: 0; }
  .ribbon { display: flex; gap: 6px; margin: 0; padding: 4px 2px 6px; list-style: none; overflow-x: auto; scrollbar-width: none; overscroll-behavior-x: contain; }
  .ribbon::-webkit-scrollbar { display: none; }
  .link { flex: none; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 40px; padding: 2px 12px; border-radius: var(--r-pill);
    box-shadow: 0 2px 0 var(--c-edge); background: var(--c-paper); color: var(--c-ink); }
  .link b { font: 600 18px/1.1 var(--font-body); }
  .link u { text-decoration: none; padding: 0 1px; border-radius: 4px; background: color-mix(in srgb, var(--c-yuzu) 70%, transparent); }
  .link:not(.last) u { background: none; }
  .link small { font: 700 10px/1 var(--font-ui); color: var(--text-soft); }
  .link.last { outline: 2px solid var(--c-edge); }
  /* each seat's colour (its head beside whose turn too: never colour alone) */
  .s-A { background: color-mix(in srgb, var(--c-sky) 32%, var(--c-cream)); }
  .s-B { background: color-mix(in srgb, var(--c-rose) 38%, var(--c-cream)); }
  .s-G { background: color-mix(in srgb, var(--c-lilac) 55%, var(--c-cream)); }
  .tbar { height: 4px; border-radius: 2px; overflow: hidden; background: color-mix(in srgb, var(--c-edge) 20%, transparent); }
  .tbar i { display: block; height: 100%; background: var(--c-sky); transform-origin: left; animation: drain linear forwards; }
  @keyframes drain { from { transform: scaleX(1); } to { transform: scaleX(0); } }
  .whose { display: flex; align-items: center; gap: 10px; }
  .whose b { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--c-ink); }
  .letter { margin: 2px 0 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); color: var(--c-ink); }
  .note { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); text-wrap: pretty; }
  .centre { text-align: center; }
  .slots, .rack { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
  .slots { padding: 4px 8px; gap: 3px; align-content: center; }
  .slots .first { cursor: default; background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-cream)); }
  .acts { display: flex; align-items: center; gap: 6px; }
  .acts .btn { flex: 1; min-width: 0; margin: 0; min-height: 48px; }
  .acts .chip { flex: none; padding: 0 12px; }
</style>
