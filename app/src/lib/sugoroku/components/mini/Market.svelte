<script lang="ts">
  // ★1 ことばの市場 (mini/market.ts): the same 9 tiles on every phone, each making as many words as they can: tap a tile
  // to put it in the next slot, a slot to take it and those after it back, ⌫ the last; これにする checks the word here
  // first (too short, not a word, found already: a soft note, the tiles kept) and plays it. Everyone's finds show under
  // their heads (in seat order, never ranked); mine on their way faded till the fold has them (another's first: it
  // goes). やさしい: a ヒント (the first letters of an everyday word nobody found) each HINT_MS. Watching: the finds only.
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Nudge from '../Nudge.svelte';
  import { flashNote } from './note.svelte.ts';
  import { LEVEL } from '../../game.ts';
  import { marketCheck, marketHint, type MarketState } from '../../mini/market.ts';
  import type { Ctx, Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';
  import { HINT_MS, lenOf } from './len.ts';

  interface Props { s: MarketState; ctx: Ctx; seat: Who | null; live: boolean; nameOf: (w: Who) => string; play: (p: Play, who?: Who) => void }
  let { s, ctx, seat, live, nameOf, play }: Props = $props();

  const level = $derived(s.seats.find((x) => x.who === seat)?.level ?? 2);
  let picked = $state<number[]>([]);
  const note = flashNote(), say = note.say;
  // (a new seat at the phone: its own word)
  $effect(() => {
    void seat;
    picked = [];
    hint = '';
  });
  const word = $derived(picked.map((i) => s.rack[i]).join(''));
  /** Mine sent; those not in the fold yet (another's first: gone). */
  let sent = $state<string[]>([]);
  const pending = $derived(sent.filter((w) => !s.found.some((f) => f.w === w)));
  function put(i: number) {
    if (!live || picked.includes(i)) return;
    picked = [...picked, i];
  }
  function submit() {
    if (!seat || !live || word.length < 2) return;
    const why = pending.includes(word) ? 'found' : marketCheck(s, seat, word, ctx);
    if (why === 'short') return say(tr('minLen', { n: LEVEL[level].minLen }));
    if (why === 'word') return say(tr('notWord'));
    if (why === 'found') return say(tr('mkFound'));
    if (why === 'full') return say(tr('mkFull'));
    if (why) return;
    sent = [...sent, word];
    play({ w: word }, seat);
    picked = [];
  }
  // やさしい's ヒント: one each HINT_MS
  let hint = $state('');
  let hints = 0;
  let hintReady = $state(true);
  let hintTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(hintTimer));
  function askHint() {
    if (!seat || !hintReady) return;
    const h = marketHint(s, seat, hints++, ctx);
    hint = h ? tr('mkHint', { w: h }) : tr('mkNone');
    hintReady = false;
    hintTimer = setTimeout(() => (hintReady = true), lenOf(HINT_MS));
  }
  const bySeat = $derived(s.seats.map((x) => ({ who: x.who, words: s.found.filter((f) => f.who === x.who).map((f) => f.w), mine: x.who === seat ? pending : [] })));
</script>

<div class="mk" data-sg-market={s.found.length}>
  {#if seat}
    {#if note.text}<Nudge text={note.text} />{/if}
    <div class="slots sg-strip" lang="en" data-sg-mk-word={word}>
      {#each picked as i, k (i)}<button type="button" class="sg-tile in" data-sfx="tick" onclick={() => (picked = picked.slice(0, k))}>{s.rack[i].toUpperCase()}</button>{/each}
    </div>
    <div class="rack" lang="en" data-sg-mk-rack={s.rack.join('')}>
      {#each s.rack as l, i (i)}<button type="button" class="sg-tile" disabled={picked.includes(i) || !live} data-sfx="tick" data-sg-mk-tile={l} onclick={() => put(i)}>{l.toUpperCase()}</button>{/each}
    </div>
    <div class="acts">
      {#if level === 1}<button type="button" class="chip big" disabled={!hintReady || !live} data-sfx="tick" data-sg-mk-hint onclick={askHint}>{tr('hint')}</button>{/if}
      <button type="button" class="chip big" aria-label={tr('back1')} disabled={!picked.length} data-sfx="back" onclick={() => (picked = picked.slice(0, -1))}><Icon name="delete-left" size={20} /></button>
      <button type="button" class="btn" disabled={!live || word.length < 2} data-sfx="confirm" data-sg-mk-play onclick={submit}>{tr('play')}</button>
    </div>
    {#if hint}<p class="note" data-sg-mk-hinted>{hint}</p>{/if}
  {:else}
    <div class="rack" lang="en" aria-hidden="true">{#each s.rack as l, i (i)}<span class="sg-tile">{l.toUpperCase()}</span>{/each}</div>
  {/if}
  <ul class="found">
    {#each bySeat as row (row.who)}
      <li data-sg-mk-seat={row.who}>
        <Avatar person={row.who} worn size={24} /><span class="pn">{nameOf(row.who)}</span>
        {#each row.words as w (w)}<span class="tag word" lang="en" data-sg-mk-found={w}>{w}</span>{/each}
        {#each row.mine as w (w)}<span class="tag word sending" lang="en">{w}</span>{/each}
      </li>
    {/each}
  </ul>
</div>

<style>
  .mk { display: flex; flex-direction: column; gap: 8px; }
  .mk > :global(*) { flex-shrink: 0; }
  .slots, .rack { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
  .slots { padding: 4px 8px; gap: 3px; align-content: center; }
  .rack span.sg-tile { cursor: default; }
  .acts { display: flex; align-items: center; gap: 8px; }
  .acts .btn { flex: 1; min-width: 0; margin: 0; min-height: 48px; }
  .acts .chip { flex: none; }
  .note { margin: 0; text-align: center; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink); }
  .found { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; list-style: none; }
  .found li { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; min-height: 32px; }
  .pn { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink); margin-right: 2px; }
  .word { font: 600 var(--fs-s)/1.2 var(--font-num); color: var(--c-ink); }
  .sending { opacity: .5; }
</style>
