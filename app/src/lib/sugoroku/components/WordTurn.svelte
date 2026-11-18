<script lang="ts">
  // 英語すごろく's ことば turn (docs/sugoroku.md "Rules"): the rack's tiles (each its points in a corner, the lucky ones
  // yuzu), tap one to put it in the next slot, tap a slot to take it back; これにする checks the word: one on the list
  // shows its points in words (and its Japanese, an everyday word's) then 次へ; one not on it a soft note, the tiles kept.
  // ヒント fills in the rack's best everyday word (halved but at やさしい, for the rest of the turn); 入れかえる swaps the
  // whole rack (no points). The seat's level sets the shortest word (game.ts LEVEL). Never red, never ×.
  import { untrack } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { VALUE, type Score } from '../tiles.ts';
  import type { Words } from '../words.ts';
  import { s } from '../i18n.ts';

  interface Props {
    rack: readonly string[];
    lucky: readonly string[];
    mult: number;
    /** The seat's shortest word. */
    minLen: number;
    /** A ヒント's word halved (not at やさしい). */
    hintHalf: boolean;
    /** ヒント used already this turn (a sheet reopened mid-turn). */
    hinted0?: boolean;
    /** ヒント used, to keep. */
    onhint: () => void;
    words: Words;
    score: (word: string, everyday: boolean, hinted: boolean) => Score | null;
    onplay: (word: string, hinted: boolean) => void;
    onswap: () => void;
  }
  let { rack, lucky, mult, minLen, hintHalf, hinted0 = false, onhint, words, score, onplay, onswap }: Props = $props();

  /** The rack's tiles in the slots, in order. */
  let picked = $state<number[]>([]);
  /** ヒント used this turn (sticks: taking a tile back doesn't undo it). */
  let hinted = $state(untrack(() => hinted0));
  let note = $state('');
  /** The word checked and on the list: its points shown till 次へ. */
  let done = $state<{ word: string; sc: Score; ja: string } | null>(null);
  const word = $derived(picked.map((i) => rack[i]).join(''));
  const best = $derived(words.from(rack, (w) => score(w, !!words.ja(w), false)?.total ?? 0).filter((w) => w.length >= minLen));

  function put(i: number) {
    if (done || picked.includes(i)) return;
    picked = [...picked, i];
    note = '';
  }
  function takeBack(k: number) {
    if (done) return;
    picked = picked.filter((_, j) => j !== k);
    note = '';
  }
  function clear() {
    picked = [];
    note = '';
  }
  function hint() {
    const w = best[0];
    if (!w) return void (note = s('noWord'));
    const left = rack.map((l, i) => ({ l, i }));
    picked = [...w].map((l) => left.splice(left.findIndex((x) => x.l === l), 1)[0].i);
    if (!hinted) onhint();
    hinted = true;
    note = hintHalf ? s('hintNote') : s('hintFree');
  }
  function check() {
    if (word.length < minLen) return void (note = s('minLen', { n: minLen }));
    if (!words.has(word)) return void (note = s('notWord'));
    const ja = words.ja(word);
    const sc = score(word, !!ja, hinted);
    if (sc) done = { word, sc, ja };
  }
  const why = (sc: Score) => [s('why', { l: sc.letters }), sc.lucky && s('whyLucky', { n: sc.lucky }), sc.mult > 1 && s('whyDouble'),
    sc.everyday && `${s('everyday')} +${sc.everyday}`, sc.half && s('whyHalf')].filter(Boolean).join(' · ');
</script>

<section class="turn" data-sg-word>
  <h3 class="ttl">{mult > 1 ? s('doubleTitle') : s('wordTitle')}</h3>
  {#if done}
    <div class="made" data-sg-made={done.word}>
      <p class="w" lang="en">{done.word}</p>
      {#if done.ja}<p class="ja">{done.ja}</p>{/if}
      <p class="pts"><Icon name="star" size={20} soft /><b>{done.sc.total}</b></p>
      <p class="why">{why(done.sc)}</p>
      <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => onplay(done!.word, hinted)}>{s('next')}</button>
    </div>
  {:else}
    <p class="ask">{s('wordAsk')}{#if minLen > 2}（{s('minLen', { n: minLen })}）{/if}</p>
    <p class="lucky">{s('lucky')} {#each lucky as l (l)}<b class="lt" lang="en">{l.toUpperCase()}</b>{/each}<span class="soft">{s('luckyNote')}</span></p>
    <div class="slots" lang="en" data-sg-slots={word}>
      {#each picked as i, k (k)}
        <button type="button" class="tile in" class:lucky={lucky.includes(rack[i])} data-sfx="tick" onclick={() => takeBack(k)}>{rack[i].toUpperCase()}<small>{VALUE[rack[i]]}</small></button>
      {/each}
      {#if !picked.length}<span class="empty"></span>{/if}
    </div>
    <div class="rack" lang="en">
      {#each rack as l, i (i)}
        <button type="button" class="tile" class:lucky={lucky.includes(l)} class:used={picked.includes(i)} disabled={picked.includes(i)}
          data-sfx="tick" data-sg-tile={l} onclick={() => put(i)}>{l.toUpperCase()}<small>{VALUE[l]}</small></button>
      {/each}
    </div>
    <p class="note" aria-live="polite">{note}</p>
    <div class="row">
      <button type="button" class="btn small" data-sfx="confirm" disabled={!picked.length} data-sg-play onclick={check}>{s('play')}</button>
      <button type="button" class="btn small paper" data-sfx="tick" disabled={!picked.length} onclick={clear}>{s('clear')}</button>
      <button type="button" class="btn small paper" data-sfx="tick" data-sg-hint onclick={hint}>{s('hint')}</button>
    </div>
    <button type="button" class="link" data-sfx="tick" data-sg-swap onclick={onswap}>{s('swap')}</button>
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ask, .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-align: center; min-height: 1.2em; text-wrap: pretty; }
  .lucky { display: flex; align-items: center; gap: 6px; margin: 0; font: 700 var(--fs-s)/1 var(--font-ui); }
  .lt { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--c-yuzu);
    box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 600 14px/1 var(--font-num); }
  .soft { color: var(--text-soft); font-weight: 500; }
  .slots, .rack { display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; }
  .slots { min-height: 52px; padding: 4px 8px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); min-width: 200px; }
  .empty { width: 40px; }
  .tile {
    position: relative; width: 40px; height: 44px; display: grid; place-items: center; padding: 0; margin: 0;
    appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    background: #f6e7c6; color: var(--c-ink); box-shadow: 0 3px 0 #b99364;
    font: 600 21px/1 var(--font-num); touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .tile small { position: absolute; right: 4px; bottom: 2px; font: 600 11px/1 var(--font-num); opacity: .75; }
  .tile.lucky { background: var(--c-yuzu); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .tile.used { opacity: .25; }
  .tile:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 #b99364; }
  .row { display: flex; gap: 8px; justify-content: center; }
  .row .btn:disabled { opacity: .55; }
  .link { appearance: none; border: 0; background: none; padding: 10px; min-height: 44px; color: var(--text-soft); font: 500 var(--fs-s)/1.2 var(--font-ui); text-decoration: underline; cursor: pointer; }
  .made { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .w { margin: 0; font: 600 34px/1.1 var(--font-num); letter-spacing: .04em; }
  .ja { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .pts { display: flex; align-items: center; gap: 4px; margin: 4px 0 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
  .why { margin: 0 0 8px; text-align: center; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
</style>
