<script lang="ts">
  // 英語すごろく's ぶん turn (docs/sugoroku.md "Rules"): a line's words as tiles, its Japanese the clue (むずかしい: hidden
  // behind 意味を見る, +2 if never opened); tap them in order (tap a placed one to take it and the ones after it back).
  // All placed: in order → its stars; not → 「おしい！」, the order shown a moment, then the tiles back for one more go; a
  // second miss → 「答えはこれ」 (still a few stars). Never red, never ×.
  import { untrack } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { inOrder, tilesOf, type Sentence } from '../sentences.ts';
  import { sentenceStars, UNSEEN_BONUS } from '../game.ts';
  import { s } from '../i18n.ts';

  interface Props {
    line: Sentence;
    seed: string;
    /** むずかしい: the Japanese hidden till asked for. */
    hideJa: boolean;
    /** The turn so far (a sheet reopened mid-turn). */
    misses0?: number;
    peeked0?: boolean;
    /** A miss or 意味を見る, to keep. */
    ontry: (t: { misses: number; peeked: boolean }) => void;
    ondone: (o: { misses: number; unseen: boolean }) => void;
  }
  let { line, seed, hideJa, misses0 = 0, peeked0 = false, ontry, ondone }: Props = $props();

  const tiles = $derived(tilesOf(line, seed));
  let placed = $state<number[]>([]);
  let misses = $state(untrack(() => misses0));
  let stage = $state<'try' | 'miss' | 'right' | 'answer'>(untrack(() => (misses0 >= 2 ? 'answer' : 'try')));
  let peeked = $state(untrack(() => peeked0));
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));
  const unseen = $derived(hideJa && !peeked);
  const words = $derived(placed.map((id) => tiles.find((t) => t.id === id)!.w));

  function put(id: number) {
    if (stage !== 'try' || placed.includes(id)) return;
    placed = [...placed, id];
    if (placed.length < tiles.length) return;
    if (inOrder(line, words)) stage = 'right';
    else if (misses >= 1) (misses = 2), (stage = 'answer'), ontry({ misses, peeked });
    else {
      misses = 1;
      ontry({ misses, peeked });
      stage = 'miss';
      timer = setTimeout(() => ((placed = []), (stage = 'try')), 900);
    }
  }
  const takeBack = (k: number) => stage === 'try' && (placed = placed.slice(0, k));
</script>

<section class="turn" data-sg-sentence>
  <div class="head">
    <h3 class="ttl">{s('sentenceTitle')}</h3>
    {#if hideJa && !peeked && (stage === 'try' || stage === 'miss')}
      <span class="soft">{s('unseen', { n: UNSEEN_BONUS })}</span>
      <button type="button" class="chip" data-sfx="tick" data-sg-peek onclick={() => ((peeked = true), ontry({ misses, peeked }))}>{s('peek')}</button>
    {:else}
      <p class="ja">{line.ja}</p>
    {/if}
  </div>
  {#if stage === 'try' || stage === 'miss'}
    {#if misses && (stage === 'miss' || !placed.length)}<p class="toast" aria-live="polite">{s('nudge')}</p>{/if}
    <div class="line" class:miss={stage === 'miss'} lang="en" data-sg-line={words.join(' ')}>
      {#each placed as id, k (id)}<button type="button" class="wt in" data-sfx="tick" onclick={() => takeBack(k)}>{tiles.find((t) => t.id === id)!.w}</button>{/each}
    </div>
    <div class="pool" lang="en">
      {#each tiles as t (t.id)}
        <button type="button" class="wt" disabled={placed.includes(t.id)} data-sfx="tick" data-sg-wt={t.w} onclick={() => put(t.id)}>{t.w}</button>
      {/each}
    </div>
  {:else}
    <div class="res">
      {#if stage === 'answer'}<p class="soft">{s('answer')}</p>{/if}
      <p class="en" lang="en" data-sg-answer>{line.en}</p>
      <p class="pts"><Icon name="star" size={20} soft /><b>{sentenceStars(misses, unseen)}</b></p>
    </div>
    <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => ondone({ misses, unseen })}>{s('next')}</button>
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; gap: 8px; }
  /* the header: ぶん, then the meaning on a line or two */
  .head { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  .ttl { flex: none; margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ja { flex: 1; min-width: 0; margin: 0; font: 700 var(--fs-body)/1.35 var(--font-ui); text-wrap: pretty; }
  .soft { flex: 1; min-width: 0; margin: 0; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .chip { position: relative; flex: none; height: 32px; padding: 0 12px; margin: 0; appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); -webkit-tap-highlight-color: transparent; }
  .chip::after { content: ''; position: absolute; inset: -6px -2px; }
  .line, .pool { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .line { min-height: 52px; padding: 4px 8px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); align-content: center; }
  .line.miss { background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
  .wt {
    min-height: 44px; padding: 0 12px; margin: 0; appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    background: #f6e7c6; color: var(--c-ink); box-shadow: 0 3px 0 #b99364; font: 600 17px/1 var(--font-body);
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .wt:disabled { opacity: .25; }
  .wt.in { background: color-mix(in srgb, var(--c-mint) 50%, var(--c-cream)); }
  /* 「おしい！」: a pill 8 px over the sheet (the sheet is its containing block), never a line of its own */
  .toast { position: absolute; left: 50%; bottom: calc(100% + 8px); translate: -50% 0; width: max-content; max-width: calc(100% - 24px); margin: 0;
    padding: 8px 14px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge);
    font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink); pointer-events: none; }
  .res { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
  .res .soft { flex: none; }
  .en { margin: 0; font: 600 22px/1.3 var(--font-body); text-wrap: pretty; }
  .pts { display: flex; align-items: center; gap: 4px; margin: 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
  .btn { margin: 0; min-height: 48px; }
</style>
