<script lang="ts">
  // 英語すごろく's ことば turn (docs/sugoroku.md "Rules"): the rack's tiles (each its points in a corner, the lucky ones
  // yuzu), tap one to put it in the next slot, tap a slot to take it back; これにする checks the word: one on the list
  // shows its points in words (and its Japanese, an everyday word's) then 次へ; one not on it a soft note, the tiles kept.
  // ヒント fills in the rack's best everyday word (halved but at やさしい, for the rest of the turn); ↻入れかえ swaps the
  // whole rack (no points: asked once more, in the header). The seat's level sets the shortest word (game.ts LEVEL).
  // Laid out for the game's bottom sheet (SugorokuGame): the header (ことば, the lucky letters, ↻入れかえ), the slots
  // (⌫ takes them all back), the rack's 8 tiles on one row, then the action row (the pocket's tiles, ヒント, これにする);
  // a check's note a toast pill over the sheet. Never red, never ×.
  import { untrack } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { VALUE, type Score } from '../tiles.ts';
  import type { Words } from '../words.ts';
  import { s } from '../i18n.ts';

  interface Props {
    rack: readonly string[];
    /** Letters picked up on the way (any word may add them), and a letter another player sent (this word must use it). */
    pocket?: readonly string[];
    forced?: string | null;
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
  let { rack, pocket = [], forced = null, lucky, mult, minLen, hintHalf, hinted0 = false, onhint, words, score, onplay, onswap }: Props = $props();

  /** The rack's tiles in the slots, in order. */
  let picked = $state<number[]>([]);
  /** ヒント used this turn (sticks: taking a tile back doesn't undo it). */
  let hinted = $state(untrack(() => hinted0));
  /** The check's note (a toast over the sheet); a sent letter's ask to begin with. */
  let note = $state(untrack(() => (forced ? s('mustUse', { l: forced.toUpperCase() }) : '')));
  /** ↻入れかえ asked once more (no stars this turn). */
  let asking = $state(false);
  /** The word checked and on the list: its points shown till 次へ. */
  let done = $state<{ word: string; sc: Score; ja: string } | null>(null);
  /** Every tile this turn: the rack, the pocket, a sent letter. */
  const tiles = $derived([...rack.map((l) => ({ l, kind: 'rack' as const })), ...pocket.map((l) => ({ l, kind: 'pocket' as const })),
    ...(forced ? [{ l: forced, kind: 'forced' as const }] : [])]);
  const word = $derived(picked.map((i) => tiles[i].l).join(''));
  const best = $derived(words.from(tiles.map((t) => t.l), (w) => score(w, !!words.ja(w), false)?.total ?? 0)
    .filter((w) => w.length >= minLen && (!forced || w.includes(forced))));

  function put(i: number) {
    if (done || picked.includes(i)) return;
    picked = [...picked, i];
    note = '';
    asking = false;
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
    // (the sent letter's tile first, then the rack's, then the pocket's)
    const order = { forced: 0, rack: 1, pocket: 2 };
    const left = tiles.map((t, i) => ({ l: t.l, i, o: order[t.kind] })).sort((a, b) => a.o - b.o);
    picked = [...w].map((l) => left.splice(left.findIndex((x) => x.l === l), 1)[0].i);
    if (!hinted) onhint();
    hinted = true;
    note = hintHalf ? s('hintNote') : s('hintFree');
  }
  function check() {
    if (word.length < minLen) return void (note = s('minLen', { n: minLen }));
    if (forced && !word.includes(forced)) return void (note = s('mustUse', { l: forced.toUpperCase() }));
    if (!words.has(word)) return void (note = s('notWord'));
    const ja = words.ja(word);
    const sc = score(word, !!ja, hinted);
    if (sc) (done = { word, sc, ja }), (note = '');
  }
  const why = (sc: Score) => [s('why', { l: sc.letters }), sc.lucky && s('whyLucky', { n: sc.lucky }), sc.mult > 1 && s('whyDouble'),
    sc.everyday && `${s('everyday')} +${sc.everyday}`, sc.forced && s('whyForced', { n: sc.forced }), sc.half && s('whyHalf')].filter(Boolean).join(' · ');
</script>

<section class="turn" data-sg-word>
  {#if done}
    <div class="made" data-sg-made={done.word}>
      <p class="w" lang="en">{done.word}</p>
      {#if done.ja}<p class="ja">{done.ja}</p>{/if}
      <p class="pts"><Icon name="star" size={20} soft /><b>{done.sc.total}</b></p>
      <p class="why">{why(done.sc)}</p>
      <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => onplay(done!.word, hinted)}>{s('next')}</button>
    </div>
  {:else}
    <div class="head">
      <h3 class="ttl">{s('wordTitle')}</h3>
      {#if asking}
        <span class="ask">{s('swapAsk')}</span>
        <button type="button" class="chip" data-sfx="back" onclick={() => (asking = false)}>{s('cancel')}</button>
        <button type="button" class="chip yuzu" data-sfx="confirm" data-sg-swap-yes onclick={onswap}>{s('swapYes')}</button>
      {:else}
        {#if mult > 1}<span class="tag2">{s('doubleTag')}</span>{/if}
        <span class="lucky">{s('lucky')}{#each lucky as l (l)}<b class="lt" lang="en">{l.toUpperCase()}</b>{/each}<span class="soft">{s('luckyNote')}</span></span>
        <button type="button" class="chip" data-sfx="tick" data-sg-swap onclick={() => (asking = true)}><Icon name="refresh" size={16} />{s('swap')}</button>
      {/if}
    </div>
    <div class="slots" lang="en" data-sg-slots={word}>
      <span class="in-row">
        {#each picked as i, k (k)}
          <button type="button" class="tile in" class:lucky={lucky.includes(tiles[i].l)} class:pk={tiles[i].kind !== 'rack'} data-sfx="tick" onclick={() => takeBack(k)}>{tiles[i].l.toUpperCase()}<small>{VALUE[tiles[i].l]}</small></button>
        {/each}
        {#if !picked.length}<span class="empty" lang="ja">{s('minLen', { n: minLen })}</span>{/if}
      </span>
      <button type="button" class="del" aria-label={s('clear')} data-sfx="tick" disabled={!picked.length} onclick={clear}>⌫</button>
    </div>
    <div class="rack" lang="en">
      {#each tiles as t, i (i)}
        {#if t.kind === 'rack'}
          <button type="button" class="tile" class:lucky={lucky.includes(t.l)} class:used={picked.includes(i)} disabled={picked.includes(i)}
            data-sfx="tick" data-sg-tile={t.l} onclick={() => put(i)}>{t.l.toUpperCase()}<small>{VALUE[t.l]}</small></button>
        {/if}
      {/each}
    </div>
    {#if note}<p class="toast" aria-live="polite">{note}</p>{/if}
    <div class="row">
      {#if pocket.length || forced}
        <span class="extra" lang="en" data-sg-extra>
          {#each tiles as t, i (i)}
            {#if t.kind !== 'rack'}
              <button type="button" class="tile pk" class:must={t.kind === 'forced'} class:used={picked.includes(i)} disabled={picked.includes(i)}
                data-sfx="tick" data-sg-tile={t.l} data-sg-kind={t.kind} onclick={() => put(i)}>{t.l.toUpperCase()}<small>{VALUE[t.l]}</small></button>
            {/if}
          {/each}
        </span>
      {/if}
      <button type="button" class="btn paper hint" data-sfx="tick" data-sg-hint onclick={hint}>{s('hint')}</button>
      <button type="button" class="btn play" data-sfx="confirm" disabled={!picked.length} data-sg-play onclick={check}>{s('play')}</button>
    </div>
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; gap: 8px; }
  /* the header: 32 tall, its chips 32 drawn in a 44 hit */
  .head { display: flex; align-items: center; gap: 6px; min-height: 32px; }
  .ttl { margin: 0 2px 0 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); white-space: nowrap; }
  .tag2 { padding: 3px 8px; border-radius: var(--r-pill); background: var(--c-yuzu); font: 700 12px/1.2 var(--font-ui); white-space: nowrap; }
  .lucky { display: flex; align-items: center; gap: 4px; min-width: 0; font: 700 var(--fs-s)/1 var(--font-ui); white-space: nowrap; }
  .lt { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--c-yuzu);
    box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 600 14px/1 var(--font-num); }
  .soft { color: var(--text-soft); font: 600 var(--fs-s)/1 var(--font-num); }
  .ask { flex: 1; min-width: 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .chip { position: relative; display: inline-flex; align-items: center; gap: 3px; height: 32px; padding: 0 10px; margin: 0 0 0 auto; flex: none;
    appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer; background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge);
    color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; }
  .chip + .chip { margin-left: 0; }
  .chip::after { content: ''; position: absolute; inset: -6px -2px; }
  .chip.yuzu { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .chip :global(svg) { color: var(--text-soft); }
  /* the slots: full width, 52 tall, ⌫ at the right end */
  .slots { display: flex; align-items: center; min-height: 52px; padding-left: 6px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); }
  .in-row { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 3px; padding: 4px 0; }
  .empty { padding-left: 6px; font: 500 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .del { flex: none; width: 44px; height: 44px; margin: 0 2px; padding: 0; appearance: none; border: 0; background: none; cursor: pointer;
    color: var(--c-ink); font: 600 20px/1 var(--font-body); -webkit-tap-highlight-color: transparent; }
  .del:disabled { opacity: .3; cursor: default; }
  /* the rack: 8 tiles of 42 × 48 with 4 between (364 of 369), one row */
  .rack { display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; }
  .tile {
    position: relative; width: 42px; height: 48px; display: grid; place-items: center; padding: 0; margin: 0; flex: none;
    appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    background: #f6e7c6; color: var(--c-ink); box-shadow: 0 3px 0 #b99364;
    font: 600 20px/1 var(--font-num); touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  /* (each hit 46 × 52: neighbours touch, never overlap) */
  .tile::before { content: ''; position: absolute; inset: -2px; }
  .tile small { position: absolute; right: 4px; bottom: 3px; font: 600 10px/1 var(--font-num); opacity: .75; }
  .tile.in { width: 37px; height: 44px; font-size: 19px; }
  .tile.lucky { background: var(--c-yuzu); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .tile.used { opacity: .25; }
  /* a pocket letter (picked up on the way) and a sent one (it must be used: a lilac ring) */
  .tile.pk { background: color-mix(in srgb, var(--c-mint) 45%, #f6e7c6); box-shadow: 0 3px 0 color-mix(in srgb, var(--c-mint) 60%, #8a6d48); }
  .tile.must { background: color-mix(in srgb, var(--c-lilac) 60%, #f6e7c6); box-shadow: 0 0 0 2px var(--c-lilac), 0 3px 0 #8a6d48; }
  .tile:active:not(:disabled) { transform: translateY(2px); box-shadow: 0 1px 0 #b99364; }
  /* the action row, the sheet's last (the thumb's reach): the pocket's tiles, ヒント, これにする the rest */
  .row { display: flex; align-items: center; gap: 6px; }
  .extra { display: flex; flex: none; gap: 4px; }
  .row .btn { margin: 0; min-height: 48px; }
  .hint { flex: none; width: 72px; padding: 0; }
  .play { flex: 1; min-width: 0; padding: 0 8px; }
  .row .btn:disabled { opacity: .55; }
  /* a check's note: a pill 8 px over the sheet (the sheet is its containing block), never a line of its own */
  .toast { position: absolute; left: 50%; bottom: calc(100% + 8px); translate: -50% 0; width: max-content; max-width: calc(100% - 24px); margin: 0;
    padding: 8px 14px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); text-align: center;
    font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink); text-wrap: pretty; pointer-events: none; }
  .made { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .w { margin: 0; font: 600 34px/1.1 var(--font-num); letter-spacing: .04em; }
  .ja { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .pts { display: flex; align-items: center; gap: 4px; margin: 2px 0 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
  .why { margin: 0 0 4px; text-align: center; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .made .btn { margin: 0; min-height: 48px; }
</style>
