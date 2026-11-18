<script lang="ts">
  // 英語すごろく's ことば turn (docs/sugoroku.md "Rules"): the rack's tiles (each its points in a corner, the lucky ones
  // yuzu), tap one to put it in the next slot, tap a slot to take it back; これにする checks the word: one on the list
  // shows its points in words (and its Japanese, an everyday word's) then 次へ; one not on it a soft note, the tiles kept.
  // ヒント fills in the rack's best everyday word (halved but at やさしい, for the rest of the turn); ↻入れかえ swaps the
  // whole rack (no points: asked once more, in the header). The seat's level sets the shortest word (game.ts LEVEL).
  // Laid out for the game's bottom sheet (SugorokuPlay): the header (ことば, the lucky letters, ↻入れかえ), the slots
  // (⌫ takes the last one back), the rack's 8 tiles on one row, then the action row (the pocket's tiles, ヒント, これにする);
  // a check's note a toast pill over the sheet. Never red, never ×. Online, its state goes to the others at the table
  // (`onview`), and a phone watching shows it as the player's (`mirror`: view.ts, read-only).
  import { untrack } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Nudge from './Nudge.svelte';
  import { VALUE, type Score } from '../tiles.ts';
  import type { Words } from '../words.ts';
  import type { WordView } from '../view.ts';
  import { s } from '../i18n.ts';
  import { t } from '#lib/i18n/index.ts';

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
    /** Online, my turn: the turn as it is now, for the others to watch. */
    onview?: (v: WordView) => void;
    /** Online, another's turn: theirs as their sheet shows it (the tiles, ヒント, the ask, the check). */
    mirror?: WordView | null;
  }
  let { rack, pocket = [], forced = null, lucky, mult, minLen, hintHalf, hinted0 = false, onhint, words, score, onplay, onswap, onview, mirror = null }: Props = $props();

  /** The turn as it shows (and as the others watch it): the rack's tiles in the slots, in order; ヒント used (sticks:
   *  taking a tile back doesn't undo it); ↻入れかえ asked once more (no stars this turn); the word checked and on the
   *  list (its points shown till 次へ); the check's note (a toast over the sheet), a sent letter's ask to begin with. */
  let v = $state<WordView>(untrack(() => ({ picked: [], hinted: hinted0, asking: false, done: false, note: forced ? 'mustUse' : '' })));
  const noteText = $derived(v.note === 'mustUse' ? s('mustUse', { l: (forced ?? '').toUpperCase() }) : v.note === 'minLen' ? s('minLen', { n: minLen }) : v.note ? s(v.note) : '');
  /** Every tile this turn: the rack, the pocket, a sent letter. */
  const tiles = $derived([...rack.map((l) => ({ l, kind: 'rack' as const })), ...pocket.map((l) => ({ l, kind: 'pocket' as const })),
    ...(forced ? [{ l: forced, kind: 'forced' as const }] : [])]);
  const word = $derived(v.picked.map((i) => tiles[i].l).join(''));
  const done = $derived(v.done ? doneOf(word) : null);
  const best = $derived(words.from(tiles.map((t) => t.l), (w) => score(w, !!words.ja(w), false)?.total ?? 0)
    .filter((w) => w.length >= minLen && (!forced || w.includes(forced))));

  function put(i: number) {
    if (done || v.picked.includes(i)) return;
    v.picked.push(i);
    v.note = '';
    v.asking = false;
  }
  function takeBack(k: number) {
    if (done) return;
    v.picked.splice(k, 1);
    v.note = '';
  }
  /** ⌫: the last tile placed back on the rack (one at a time, like a keyboard's delete). */
  function back() {
    if (done) return;
    v.picked.pop();
    v.note = '';
  }
  function hint() {
    const w = best[0];
    if (!w) return void (v.note = 'noWord');
    // (the sent letter's tile first, then the rack's, then the pocket's)
    const order = { forced: 0, rack: 1, pocket: 2 };
    const left = tiles.map((t, i) => ({ l: t.l, i, o: order[t.kind] })).sort((a, b) => a.o - b.o);
    v.picked = [...w].map((l) => left.splice(left.findIndex((x) => x.l === l), 1)[0].i);
    if (!v.hinted) onhint();
    v.hinted = true;
    v.note = hintHalf ? 'hintNote' : 'hintFree';
  }
  function check() {
    if (word.length < minLen) return void (v.note = 'minLen');
    if (forced && !word.includes(forced)) return void (v.note = 'mustUse');
    if (!words.has(word)) return void (v.note = 'notWord');
    if (doneOf(word)) (v.done = true), (v.note = '');
  }
  /** A word checked: its points (its Japanese, an everyday word's). */
  function doneOf(w: string): { word: string; sc: Score; ja: string } | null {
    const ja = words.ja(w), sc = score(w, !!ja, v.hinted);
    return sc ? { word: w, sc, ja } : null;
  }
  // online: the turn as it is, sent (my turn), or the player's shown (another's)
  $effect(() => void onview?.($state.snapshot(v)));
  $effect.pre(() => {
    const m = mirror;
    if (m) untrack(() => (v = { ...m, picked: m.picked.filter((i) => i < tiles.length) }));
  });
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
      <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => onplay(done.word, v.hinted)}>{s('next')}</button>
    </div>
  {:else}
    <div class="head">
      <h3 class="ttl">{s('wordTitle')}</h3>
      {#if v.asking}
        <span class="ask">{s('swapAsk')}</span>
        <button type="button" class="chip" data-sfx="back" onclick={() => (v.asking = false)}>{t('common.cancel')}</button>
        <button type="button" class="chip" aria-pressed="true" data-sfx="confirm" data-sg-swap-yes onclick={onswap}>{s('swapYes')}</button>
      {:else}
        {#if mult > 1}<span class="tag new">{s('doubleTag')}</span>{/if}
        <span class="lucky">{s('lucky')}{#each lucky as l (l)}<b class="lt" lang="en">{l.toUpperCase()}</b>{/each}<span class="soft">{s('luckyNote')}</span></span>
        <button type="button" class="chip" data-sfx="tick" data-sg-swap onclick={() => (v.asking = true)}><Icon name="refresh" size={16} />{s('swap')}</button>
      {/if}
    </div>
    <div class="slots sg-strip" lang="en" data-sg-slots={word}>
      <span class="in-row">
        {#each v.picked as i, k (k)}
          <button type="button" class="sg-tile in" class:lucky={lucky.includes(tiles[i].l)} class:pk={tiles[i].kind !== 'rack'} data-sfx="tick" onclick={() => takeBack(k)}>{tiles[i].l.toUpperCase()}<small>{VALUE[tiles[i].l]}</small></button>
        {/each}
        {#if !v.picked.length}<span class="empty" lang="ja">{s('minLen', { n: minLen })}</span>{/if}
      </span>
      <button type="button" class="del" aria-label={s('back1')} data-sfx="tick" data-sg-del disabled={!v.picked.length} onclick={back}><Icon name="delete-left" size={24} /></button>
    </div>
    <div class="rack" lang="en">
      {#each tiles as t, i (i)}
        {#if t.kind === 'rack'}
          <button type="button" class="sg-tile" class:lucky={lucky.includes(t.l)} disabled={v.picked.includes(i)}
            data-sfx="tick" data-sg-tile={t.l} onclick={() => put(i)}>{t.l.toUpperCase()}<small>{VALUE[t.l]}</small></button>
        {/if}
      {/each}
    </div>
    {#if noteText}<Nudge text={noteText} />{/if}
    <div class="row">
      {#if pocket.length || forced}
        <span class="extra" lang="en" data-sg-extra>
          {#each tiles as t, i (i)}
            {#if t.kind !== 'rack'}
              <button type="button" class="sg-tile pk" class:must={t.kind === 'forced'} disabled={v.picked.includes(i)}
                data-sfx="tick" data-sg-tile={t.l} data-sg-kind={t.kind} onclick={() => put(i)}>{t.l.toUpperCase()}<small>{VALUE[t.l]}</small></button>
            {/if}
          {/each}
        </span>
      {/if}
      <button type="button" class="btn paper hint" data-sfx="tick" data-sg-hint onclick={hint}>{s('hint')}</button>
      <button type="button" class="btn play" data-sfx="confirm" disabled={!v.picked.length} data-sg-play onclick={check}>{s('play')}</button>
    </div>
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; gap: 8px; }
  /* the header: 32 tall, its chips (the kit's) 32 drawn in a 44 hit */
  .head { display: flex; align-items: center; gap: 6px; min-height: 32px; }
  .ttl { margin: 0 2px 0 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); white-space: nowrap; }
  .lucky { display: flex; align-items: center; gap: 4px; min-width: 0; font: 700 var(--fs-s)/1 var(--font-ui); white-space: nowrap; }
  .lt { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--c-yuzu);
    box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 600 14px/1 var(--font-num); }
  .soft { color: var(--text-soft); font: 600 var(--fs-s)/1 var(--font-num); }
  .ask { flex: 1; min-width: 0; font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .head .chip { flex: none; margin-left: auto; padding: 0 10px; }
  .head .chip + .chip { margin-left: 0; }
  .head .chip :global(svg) { color: var(--text-soft); }
  /* the slots: full width, 52 tall, ⌫ at the right end */
  .slots { display: flex; align-items: center; padding-left: 6px; }
  .in-row { flex: 1; min-width: 0; display: flex; flex-wrap: wrap; gap: 3px; padding: 4px 0; }
  .empty { padding-left: 6px; font: 500 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .del { flex: none; display: grid; place-items: center; width: 44px; height: 44px; margin: 0 2px; padding: 0; appearance: none; border: 0; border-radius: var(--r-chip);
    background: none; cursor: pointer; color: var(--c-ink); -webkit-tap-highlight-color: transparent; }
  .del:active:not(:disabled) { background: var(--hl); }
  .del:disabled { opacity: .3; cursor: default; }
  /* the rack: 8 tiles of 42 × 48 with 4 between (364 of 369), one row */
  .rack { display: flex; justify-content: center; gap: 4px; flex-wrap: wrap; }
  .sg-tile small { position: absolute; right: 4px; bottom: 3px; font: 600 10px/1 var(--font-num); opacity: .75; }
  .sg-tile.lucky { background: var(--c-yuzu); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  /* a pocket letter (picked up on the way) and a sent one (it must be used: a lilac ring) */
  .sg-tile.pk { background: color-mix(in srgb, var(--c-mint) 45%, var(--c-paper)); box-shadow: 0 3px 0 color-mix(in srgb, var(--c-mint) 60%, var(--c-edge)); }
  .sg-tile.must { background: color-mix(in srgb, var(--c-lilac) 60%, var(--c-paper)); box-shadow: 0 0 0 2px var(--c-lilac), 0 3px 0 var(--c-edge); }
  /* the action row, the sheet's last (the thumb's reach): the pocket's tiles, ヒント, これにする the rest */
  .row { display: flex; align-items: center; gap: 6px; }
  .extra { display: flex; flex: none; gap: 4px; }
  .row .btn { margin: 0; min-height: 48px; }
  .hint { flex: none; width: 72px; padding: 0; }
  .play { flex: 1; min-width: 0; padding: 0 8px; }
  .row .btn:disabled { opacity: .55; }
  .made { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .w { margin: 0; font: 600 34px/1.1 var(--font-num); letter-spacing: .04em; }
  .ja { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .pts { display: flex; align-items: center; gap: 4px; margin: 2px 0 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
  .why { margin: 0 0 4px; text-align: center; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .made .btn { margin: 0; min-height: 48px; }
</style>
