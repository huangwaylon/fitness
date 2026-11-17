<script lang="ts">
  // 英語すごろく's ことば turn (docs/sugoroku.md "Words"): the rack's tiles (each its points in a corner, the lucky ones
  // yuzu), tap one to put it in the next slot, tap a slot to take it back; 決定 checks the word: one on the list shows
  // its points (and its Japanese, an everyday word's) then 次へ; one not on it a soft note, the tiles kept. ヒント fills in
  // the rack's best everyday word (its points halved); 交換 swaps the whole rack (no points). Never red, never ×.
  import Icon from '#lib/components/ui/Icon.svelte';
  import { VALUE, type Score } from '../tiles.ts';
  import type { Words } from '../words.ts';
  import { s } from '../i18n.ts';

  interface Props {
    rack: readonly string[];
    lucky: readonly string[];
    mult: number;
    words: Words;
    score: (word: string, common: boolean, hinted: boolean) => Score | null;
    onplay: (word: string, hinted: boolean) => void;
    onswap: () => void;
  }
  let { rack, lucky, mult, words, score, onplay, onswap }: Props = $props();

  /** The rack's tiles in the slots, in order. */
  let picked = $state<number[]>([]);
  let hinted = $state(false);
  let note = $state('');
  /** The word checked and on the list: its points shown till 次へ. */
  let done = $state<{ word: string; sc: Score; ja: string } | null>(null);
  const word = $derived(picked.map((i) => rack[i]).join(''));
  const best = $derived(words.from(rack, (w) => score(w, !!words.ja(w), false)?.total ?? 0));

  function put(i: number) {
    if (done || picked.includes(i)) return;
    picked = [...picked, i];
    note = '';
  }
  function takeBack(k: number) {
    if (done) return;
    picked = picked.filter((_, j) => j !== k);
    hinted = false;
    note = '';
  }
  function clear() {
    picked = [];
    hinted = false;
    note = '';
  }
  function hint() {
    const w = best[0];
    if (!w) return void (note = s('noWord'));
    const left = rack.map((l, i) => ({ l, i }));
    picked = [...w].map((l) => left.splice(left.findIndex((x) => x.l === l), 1)[0].i);
    hinted = true;
    note = s('hintNote');
  }
  function check() {
    if (word.length < 2) return;
    if (!words.has(word)) return void (note = s('notWord'));
    const ja = words.ja(word);
    const sc = score(word, !!ja, hinted);
    if (sc) done = { word, sc, ja };
  }
</script>

<section class="turn" data-sg-word>
  <h3 class="ttl">{mult > 1 ? s('doubleTitle') : s('wordTitle')}</h3>
  {#if done}
    <div class="made" data-sg-made={done.word}>
      <p class="w" lang="en">{done.word}</p>
      {#if done.ja}<p class="ja">{done.ja}</p>{/if}
      <p class="pts"><Icon name="star" size={20} soft /><b>{done.sc.total}</b></p>
      <p class="why">
        {done.sc.letters}{#if done.sc.lucky} + {done.sc.lucky}{/if}{#if done.sc.mult > 1} ×{done.sc.mult}{/if}{#if done.sc.common} + {done.sc.common}（{s('everyday')}）{/if}{#if done.sc.hinted} ÷ 2{/if}
      </p>
      <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => onplay(done!.word, done!.sc.hinted)}>{s('next')}</button>
    </div>
  {:else}
    <p class="ask">{s('wordAsk')}</p>
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
      <button type="button" class="btn small" data-sfx="confirm" disabled={word.length < 2} data-sg-play onclick={check}>{s('play')}</button>
      <button type="button" class="btn small paper" data-sfx="tick" disabled={!picked.length} onclick={clear}>{s('clear')}</button>
      <button type="button" class="btn small paper" data-sfx="tick" data-sg-hint onclick={hint}>{s('hint')}</button>
    </div>
    <button type="button" class="link" data-sfx="tick" data-sg-swap onclick={onswap}>{s('swap')}</button>
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ask, .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-align: center; min-height: 1.2em; text-wrap: pretty; }
  .slots, .rack { display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; }
  .slots { min-height: 52px; padding: 4px 8px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); min-width: 200px; }
  .empty { width: 44px; }
  .tile {
    position: relative; width: 44px; height: 44px; display: grid; place-items: center; padding: 0; margin: 0;
    appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    background: var(--c-cream); color: var(--c-ink); box-shadow: 0 3px 0 var(--c-edge);
    font: 600 22px/1 var(--font-num); touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .tile small { position: absolute; right: 4px; bottom: 2px; font: 600 10px/1 var(--font-num); opacity: .7; }
  .tile.lucky { background: var(--c-yuzu); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .tile.used { opacity: .25; }
  .tile:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 var(--c-edge); }
  .row { display: flex; gap: 8px; justify-content: center; }
  .link { appearance: none; border: 0; background: none; padding: 10px; min-height: 44px; color: var(--text-soft); font: 500 var(--fs-s)/1.2 var(--font-ui); text-decoration: underline; cursor: pointer; }
  .made { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .w { margin: 0; font: 600 34px/1.1 var(--font-num); letter-spacing: .04em; }
  .ja { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .pts { display: flex; align-items: center; gap: 4px; margin: 4px 0 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
  .why { margin: 0 0 8px; font: 500 var(--fs-s)/1.2 var(--font-num); color: var(--text-soft); }
</style>
