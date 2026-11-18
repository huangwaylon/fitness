<script lang="ts">
  // A phrase's flashcard, フレーズ's deck (Phrases) and home's フレーズの復習 (PhraseReview) alike (docs/english.md
  // "フレーズ", "Phrase review"). Front: `head`, the phrase (the words it shares with its line underlined), 意味を見る.
  // Back: its Japanese, 動画では + the clip's line and its 意味, the clip's player (mounted at 意味を見る, so ▶ この場面を聞く
  // meets a ready frame within the tap: iOS; one frame at most, none on the front), then `actions`. One card a mount:
  // the parent keys it by its phrase, so the next comes face down, its player new. Never a score.
  import type { Snippet } from 'svelte';
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
  let open = $state(false);
  let player = $state<YtPlayer>();
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
    <button type="button" class="btn sky" data-sfx="tick" {...d('show')} onclick={() => ((open = true), onshow())}>{s('prShow')}</button>
  {:else}
    {#if ja}<p class="ja" {...d('ja')}>{ja}</p>{/if}
    {#if line}
      <div class="from">
        <p class="kicker">{s('deckFrom')}{#if source}{' · '}<span lang="en">{source}</span>{/if}</p>
        <p class="line" lang="en" {...d('line')}><KeyedText text={line} /></p>
        {#if mean}<p class="mean" {...d('mean')}>{mean}</p>{/if}
      </div>
    {/if}
    {#if video}
      <div class="video"><Player {video} {title} bind:player /></div>
      <button type="button" class="btn small sky hear" data-sfx="tick" {...d('hear')} disabled={!player || player.state === 'loading'} onclick={hear}>
        <Icon name="play" size={18} />{s('prHear')}
      </button>
    {/if}
    {@render actions()}
  {/if}
</article>

<style>
  .pc { display: grid; gap: 8px; flex: none; }
  p { margin: 0; }
  .en { font: 700 var(--fs-talk)/1.35 var(--font-ui); margin: 4px 0; }
  .ja { font-size: var(--fs-body); padding: 8px 10px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); color: var(--c-ink); }
  .from { display: grid; gap: 2px; }
  .kicker { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .line { font-size: var(--fs-body); line-height: 1.45; font-style: italic; }
  .mean { font-size: var(--fs-s); line-height: 1.45; color: var(--text-soft); margin-top: 2px; }
  .video { border-radius: var(--r-row); overflow: hidden; }
  .btn { margin: 0; }
  .hear { justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
</style>
