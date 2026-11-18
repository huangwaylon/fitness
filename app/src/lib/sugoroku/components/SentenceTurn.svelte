<script lang="ts">
  // 英語すごろく's ぶん turn (docs/sugoroku.md "Rules"): a line's words as tiles, its Japanese the clue (むずかしい: hidden
  // behind 意味を見る, +2 if never opened); tap them in order (tap a placed one to take it and the ones after it back).
  // All placed: in order → its stars; not → 「おしい！」, the order shown a moment, then the tiles back for one more go; a
  // second miss → 「答えはこれ」 (still a few stars). Never red, never ×. Online, its state goes to the others at the table
  // (`onview`), and a phone watching shows it as the player's (`mirror`: view.ts, read-only).
  import { untrack } from 'svelte';
  import Nudge from './Nudge.svelte';
  import TurnResult from './TurnResult.svelte';
  import { inOrder, tilesOf, type Sentence } from '../sentences.ts';
  import { sentenceStars, UNSEEN_BONUS } from '../game.ts';
  import { s } from '../i18n.ts';
  import { stageOf, tries } from '../tries.svelte.ts';
  import type { SentenceView } from '../view.ts';

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
    /** Online, my turn: the turn as it is now, for the others to watch. */
    onview?: (v: SentenceView) => void;
    /** Online, another's turn: theirs as their sheet shows it. */
    mirror?: SentenceView | null;
  }
  let { line, seed, hideJa, misses0 = 0, peeked0 = false, ontry, ondone, onview, mirror = null }: Props = $props();

  const tiles = $derived(tilesOf(line, seed));
  /** The turn as it shows (and as the others watch it): the tiles placed, the stage, the misses, 意味を見る. */
  let v = $state<SentenceView>(untrack(() => ({ placed: [], stage: stageOf(misses0), misses: misses0, peeked: peeked0 })));
  const two = tries(() => v);
  $effect(() => two.stop);
  const unseen = $derived(hideJa && !v.peeked);
  const wordOf = (id: number) => tiles.find((t) => t.id === id)!.w;
  const words = $derived(v.placed.map(wordOf));

  function put(id: number) {
    if (v.stage !== 'try' || v.placed.includes(id)) return;
    v.placed.push(id);
    if (v.placed.length < tiles.length) return;
    if (inOrder(line, words)) v.stage = 'right';
    else two.miss((misses) => ontry({ misses, peeked: v.peeked }), () => (v.placed = []));
  }
  const takeBack = (k: number) => v.stage === 'try' && (v.placed = v.placed.slice(0, k));
  // online: the turn as it is, sent (my turn), or the player's shown (another's)
  $effect(() => void onview?.($state.snapshot(v)));
  $effect.pre(() => {
    const m = mirror;
    if (m) untrack(() => (v = { ...m, placed: [...new Set(m.placed)].filter((id) => tiles.some((t) => t.id === id)) }));
  });
</script>

<section class="turn" data-sg-sentence data-sg-stage={v.stage}>
  <div class="head">
    <h3 class="tag">{s('sentenceTitle')}</h3>
    {#if hideJa && !v.peeked && (v.stage === 'try' || v.stage === 'miss')}
      <span class="soft">{s('unseen', { n: UNSEEN_BONUS })}</span>
      <button type="button" class="chip" data-sfx="tick" data-sg-peek onclick={() => ((v.peeked = true), ontry({ misses: v.misses, peeked: true }))}>{s('peek')}</button>
    {/if}
  </div>
  {#if !hideJa || v.peeked || v.stage === 'right' || v.stage === 'answer'}<p class="ja">{line.ja}</p>{/if}
  {#if v.stage === 'try' || v.stage === 'miss'}
    {#if v.misses && (v.stage === 'miss' || !v.placed.length)}<Nudge text={s('nudge')} />{/if}
    <div class="line sg-strip" class:miss={v.stage === 'miss'} lang="en" data-sg-line={words.join(' ')}>
      {#each v.placed as id, k (id)}<button type="button" class="sg-wt in" data-sfx="tick" onclick={() => takeBack(k)}>{wordOf(id)}</button>{/each}
    </div>
    <div class="pool" lang="en">
      {#each tiles as t (t.id)}
        <button type="button" class="sg-wt" disabled={v.placed.includes(t.id)} data-sfx="tick" data-sg-wt={t.w} onclick={() => put(t.id)}>{t.w}</button>
      {/each}
    </div>
  {:else}
    <TurnResult answer={v.stage === 'answer'} text={line.en} stars={sentenceStars(v.misses, unseen)} kind="line" onnext={() => ondone({ misses: v.misses, unseen })} />
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; gap: 8px; }
  /* the header: the 文 tag (and むずかしい's 意味を見る); the meaning on its own line under it */
  .head { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  .head .tag { flex: none; margin: 0; }
  .ja { margin: 0; font: 700 var(--fs-body)/1.35 var(--font-ui); text-wrap: pretty; }
  .soft { flex: 1; min-width: 0; margin: 0; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .head .chip { flex: none; }
  .line, .pool { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .line { padding: 4px 8px; align-content: center; }
</style>
