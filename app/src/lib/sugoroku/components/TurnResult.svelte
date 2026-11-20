<script lang="ts">
  // A ぶん or 絵 turn's result: 答えはこれ after two misses, the English, its stars, and 次へ (when the turn has no step
  // after it); `line`: folded to one row (the speaking step under it).
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { s } from '../i18n.ts';

  interface Props {
    /** The answer shown after two misses (答えはこれ). */
    answer: boolean;
    text: string;
    stars: number;
    /** The English as a word (the 絵's spelling) or a line (the ぶん's sentence). */
    kind: 'word' | 'line';
    line?: boolean;
    onnext?: () => void;
  }
  let { answer, text, stars, kind, line = false, onnext }: Props = $props();
</script>

<div class="res" class:line>
  {#if answer && !line}<p class="soft"><Phrases text={s('answer')} /></p>{/if}
  <p class="en {kind}" lang="en" data-sg-answer>{text}</p>
  <p class="pts"><Icon name="star" size={20} soft /><b>{stars}</b></p>
</div>
{#if onnext}<button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={onnext}>{s('next')}</button>{/if}

<style>
  /* the result is an ok card: the kit token, the day leaf on the always-cream sheet (.obj-cream resets it) */
  .res { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 8px 12px; border-radius: var(--r-card); background: var(--ok-bg); box-shadow: inset 0 0 0 2px var(--ok-edge); text-align: center; }
  .res.line { flex-direction: row; justify-content: center; gap: 12px; }
  .soft { margin: 0; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .en { margin: 0; text-wrap: pretty; }
  .en.line { font: 600 22px/1.3 var(--font-body); }
  .en.word { font: 600 28px/1.2 var(--font-num); letter-spacing: .04em; }
  .res.line .en { font-size: 22px; }
  .pts { display: flex; align-items: center; gap: 4px; margin: 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
  .btn { margin: 0; min-height: 48px; }
</style>
