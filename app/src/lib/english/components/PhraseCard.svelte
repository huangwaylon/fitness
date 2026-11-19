<script lang="ts">
  // A phrase's flashcard, フレーズ's deck (Phrases) and home's フレーズの復習 (PhraseReview) alike (docs/english.md
  // "フレーズ", "Phrase review"). Front: `head`, the phrase (the words it shares with its line underlined), 意味を見る.
  // Back: its Japanese, 動画では + the clip's line and its 意味, the clip's player (mounted at the first 意味を見る, so
  // ▶ この場面を聞く meets a ready frame within the tap: iOS), then `actions`, scrolled into view if below the fold. A new `k` is the next card, face down; the
  // player stays mounted for the cards after (hidden on their fronts, paused), the next clip cued into the same frame:
  // one embed a deck, not one a card. Never a score.
  import { untrack, type Snippet } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Player from './Player.svelte';
  import KeyedText from './KeyedText.svelte';
  import type { Parts } from '../phrases.ts';
  import type { YtPlayer } from '../player.svelte.ts';
  import { s } from '../i18n.ts';

  interface Props {
    /** The specs' attribute names: `data-en-<tag>` (the card's key), `data-en-<tag>-show` … */
    tag: 'deck' | 'pr';
    k: string;
    en: Parts;
    ja: string;
    line?: string;
    mean?: string;
    /** After 動画では (the clip's title, where the head doesn't show it). */
    source?: string;
    /** The clip's video (none: no player). */
    video?: string;
    title: string;
    seg: readonly [number, number];
    /** 意味を見る tapped (the card turned). */
    onshow: () => void;
    onhear?: () => void;
    head: Snippet;
    actions: Snippet;
  }
  let { tag, k, en, ja, line, mean, source, video, title, seg, onshow, onhear, head, actions }: Props = $props();
  /** The card turned (its key: the next card comes face down). */
  let shown = $state<string | null>(null);
  const open = $derived(shown === k);
  /** The player's mounted (at the first 意味を見る), kept for the cards after. */
  let booted = $state(false);
  let player = $state<YtPlayer>();
  // a card face down: its player quiet
  $effect(() => {
    if (!open) untrack(() => (player?.state === 'playing' || player?.state === 'buffering') && player.pause());
  });
  const d = (part: string) => ({ [`data-en-${tag}-${part}`]: '' });
  function hear(): void {
    if (!player) return;
    player.play(seg[0], seg[1]);
    onhear?.();
  }
</script>

<article class="card pad pc" {...{ [`data-en-${tag}`]: k }} data-face={open ? 'back' : 'front'}>
  {@render head()}
  <p class="en" lang="en" {...d('en')}><KeyedText parts={en} /></p>
  {#if !open}
    <button type="button" class="btn sky" data-sfx="tick" {...d('show')} onclick={() => ((shown = k), (booted = true), onshow())}>{s('prShow')}</button>
  {:else}
    {#if ja}<p class="ja" {...d('ja')}>{ja}</p>{/if}
    {#if line}
      <div class="from">
        <p class="kicker">{s('deckFrom')}{#if source}{' · '}<span lang="en">{source}</span>{/if}</p>
        <p class="line" lang="en" {...d('line')}><KeyedText text={line} /></p>
        {#if mean}<p class="mean" {...d('mean')}>{mean}</p>{/if}
      </div>
    {/if}
  {/if}
  {#if video && booted}
    <div class="video" hidden={!open}><Player {video} {title} bind:player /></div>
  {/if}
  {#if open}
    {#if video}
      <button type="button" class="btn small sky hear" data-sfx="tick" {...d('hear')} disabled={!player || player.state === 'loading'} onclick={hear}>
        <Icon name="play" size={18} />{s('prHear')}
      </button>
    {/if}
    {@render actions()}
    <!-- turned: its actions brought above the tab bar when they fall below it (393×659: the player pushes ☆ / 次へ off) -->
    <span class="end" aria-hidden="true" {@attach (el) => void requestAnimationFrame(() => el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }))}></span>
  {/if}
</article>

<style>
  .pc { display: grid; gap: 8px; flex: none; }
  p { margin: 0; }
  .en { font: 700 var(--fs-talk)/1.35 var(--font-ui); margin: 4px 0; }
  /* the meaning: the kit's ok card */
  .ja { font-size: var(--fs-body); padding: 8px 10px; border-radius: var(--r-row); background: var(--ok-bg); color: var(--text); }
  .from { display: grid; gap: 2px; }
  .kicker { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .line { font-size: var(--fs-body); line-height: 1.45; font-style: italic; }
  .mean { font-size: var(--fs-s); line-height: 1.45; color: var(--text-soft); margin-top: 2px; }
  .video { border-radius: var(--r-row); overflow: hidden; }
  .btn { margin: 0; }
  .hear { justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
  .end { height: 0; margin-top: -8px; scroll-margin-bottom: 12px; }
</style>
