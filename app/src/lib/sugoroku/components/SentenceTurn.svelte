<script lang="ts">
  // 英語すごろく's ぶん turn (docs/sugoroku.md "Rules"): a line's words as tiles, its Japanese the clue (むずかしい: hidden
  // behind 意味を見る, +2 if never opened); tap them in order (tap a placed one to take it and the ones after it back).
  // All placed: in order → its stars; not → 「おしい！」, the order shown a moment, then the tiles back for one more go; a
  // second miss → 「答えはこれ」 (still a few stars). Never red, never ×.
  import Icon from '#lib/components/ui/Icon.svelte';
  import { inOrder, tilesOf, type Sentence } from '../sentences.ts';
  import { sentenceStars, UNSEEN_BONUS } from '../game.ts';
  import { s } from '../i18n.ts';

  interface Props {
    line: Sentence;
    seed: string;
    /** むずかしい: the Japanese hidden till asked for. */
    hideJa: boolean;
    ondone: (o: { misses: number; unseen: boolean }) => void;
  }
  let { line, seed, hideJa, ondone }: Props = $props();

  const tiles = $derived(tilesOf(line, seed));
  let placed = $state<number[]>([]);
  let misses = $state(0);
  let stage = $state<'try' | 'miss' | 'right' | 'answer'>('try');
  let peeked = $state(false);
  const unseen = $derived(hideJa && !peeked);
  const words = $derived(placed.map((id) => tiles.find((t) => t.id === id)!.w));

  function put(id: number) {
    if (stage !== 'try' || placed.includes(id)) return;
    placed = [...placed, id];
    if (placed.length < tiles.length) return;
    if (inOrder(line, words)) stage = 'right';
    else if (misses >= 1) (misses = 2), (stage = 'answer');
    else {
      misses = 1;
      stage = 'miss';
      setTimeout(() => ((placed = []), (stage = 'try')), 900);
    }
  }
  const takeBack = (k: number) => stage === 'try' && (placed = placed.slice(0, k));
</script>

<section class="turn" data-sg-sentence>
  <h3 class="ttl">{s('sentenceTitle')}</h3>
  {#if hideJa && !peeked && stage !== 'answer'}
    <button type="button" class="btn small paper" data-sfx="tick" data-sg-peek onclick={() => (peeked = true)}>{s('peek')}</button>
    <p class="ask">{s('unseen', { n: UNSEEN_BONUS })}</p>
  {:else}
    <p class="ja"><span class="lbl">{s('sentenceMeaning')}</span>{line.ja}</p>
  {/if}
  {#if stage === 'try' || stage === 'miss'}
    <p class="ask" aria-live="polite">{misses ? s('nudge') : s('sentenceAsk')}</p>
    <div class="line" class:miss={stage === 'miss'} lang="en" data-sg-line={words.join(' ')}>
      {#each placed as id, k (id)}<button type="button" class="wt in" data-sfx="tick" onclick={() => takeBack(k)}>{tiles.find((t) => t.id === id)!.w}</button>{/each}
    </div>
    <div class="pool" lang="en">
      {#each tiles as t (t.id)}
        <button type="button" class="wt" disabled={placed.includes(t.id)} data-sfx="tick" data-sg-wt={t.w} onclick={() => put(t.id)}>{t.w}</button>
      {/each}
    </div>
  {:else}
    <p class="ask">{stage === 'answer' ? s('answer') : ''}</p>
    <p class="en" lang="en" data-sg-answer>{line.en}</p>
    <p class="pts"><Icon name="star" size={20} soft /><b>{sentenceStars(misses, unseen)}</b></p>
    <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => ondone({ misses, unseen })}>{s('next')}</button>
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ja { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); text-align: center; text-wrap: pretty; }
  .lbl { display: inline-block; margin-right: 6px; padding: 2px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-edge) 40%, transparent); font-size: var(--fs-s); }
  .ask { margin: 0; font-size: var(--fs-s); color: var(--text-soft); min-height: 1.2em; text-align: center; }
  .line, .pool { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .line { min-height: 52px; width: 100%; padding: 4px 8px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); align-content: center; }
  .line.miss { background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
  .wt {
    min-height: 44px; padding: 0 12px; margin: 0; appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    background: #f6e7c6; color: var(--c-ink); box-shadow: 0 3px 0 #b99364; font: 600 18px/1 var(--font-body);
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .wt:disabled { opacity: .25; }
  .wt.in { background: color-mix(in srgb, var(--c-mint) 50%, var(--c-cream)); }
  .en { margin: 0; font: 600 22px/1.3 var(--font-body); text-align: center; }
  .pts { display: flex; align-items: center; gap: 4px; margin: 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
</style>
