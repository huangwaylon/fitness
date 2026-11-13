<script lang="ts">
  // A bot's verdict (docs/design.md "Bots"), one card for both tabs: the dot, the word and one sentence, tinted by its
  // tone (strip.ts Tone); 更新中 while the status shown is the last known one and the read is on its way (the page's
  // poll: a status kept from before shows at once); `children`: the bot's own row under a dashed stitch (保養所's 開始 /
  // 停止). `compact`: the smaller one (ジム's, at its page's foot). `attr`: its data-* (the
  // verdict's id: data-its-verdict="healthy").
  import type { Snippet } from 'svelte';
  import Phrases from '../ui/Phrases.svelte';
  import { t } from '#lib/i18n/index.ts';
  import type { Tone } from '#lib/strip.ts';

  interface Props {
    tone: Tone;
    word: string;
    sentence: string;
    attr: Record<string, string>;
    stale?: boolean;
    compact?: boolean;
    children?: Snippet;
    /** The bot's row's data-* (data-its-run="running"). */
    act?: Record<string, string>;
  }
  let { tone, word, sentence, attr, stale = false, compact = false, children, act = {} }: Props = $props();
</script>

<div class="card pad verdict {tone}" class:compact {...attr}>
  <div class="vhead">
    <span class="dot {tone}" aria-hidden="true"></span>
    <div class="vtxt"><b>{word}</b><p><Phrases text={sentence} /></p></div>
    {#if stale}<span class="stale" data-bots-stale>{t('bots.updating')}</span>{/if}
  </div>
  {#if children}<div class="act" {...act}>{@render children()}</div>{/if}
</div>

<style>
  .verdict { display: grid; gap: 10px; }
  .verdict.good { background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  .verdict.warn { background: color-mix(in srgb, var(--c-yuzu) 30%, var(--card)); }
  .verdict.bad { background: color-mix(in srgb, var(--c-coral) 24%, var(--card)); }
  .vhead { display: flex; align-items: flex-start; gap: 12px; }
  .vtxt { flex: 1; min-width: 0; }
  .vtxt b { font-size: var(--fs-title); line-height: 1.3; }
  .vtxt p { margin: 2px 0 0; font-size: var(--fs-body); line-height: var(--lh); color: var(--text-soft); font-weight: 700; }
  .compact .vtxt b { font-size: var(--fs-body); }
  .compact .vtxt p { font-size: var(--fs-s); }
  .compact .dot { margin-top: 3px; }
  .dot { flex: none; width: 14px; height: 14px; margin-top: 5px; border-radius: 50%; box-shadow: 0 0 0 2px var(--card), 0 0 0 3px var(--edge); }
  .dot.good { background: var(--c-leaf); }
  .dot.warn { background: var(--c-yuzu); }
  .dot.bad { background: var(--c-coral); }
  .dot.idle { background: var(--ctl-off); }
  /* the last known status, a read on its way: a quiet sunk pill (the kit's .tag) */
  .stale {
    flex: none; display: inline-flex; align-items: center; padding: 2px 8px; border-radius: var(--r-pill); white-space: nowrap;
    font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); background: var(--ctl-off);
  }
  .act { display: flex; align-items: center; gap: 10px; padding-top: 10px; border-top: 1.5px dashed var(--stitch); }
</style>
