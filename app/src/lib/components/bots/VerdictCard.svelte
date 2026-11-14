<script lang="ts">
  // A bot's verdict (docs/design.md "Bots"), full size at the top of every bot page: the dot (StatusDot: the tab's
  // own), the word and one sentence, tinted by its tone (busy as good); 更新中 while the status shown is the last known
  // one and a read is on its way or failed; `children`: the bot's controls under a dashed stitch (ジム's チェック中 ·
  // 今すぐ確認 · ⋯, 保養所's 開始 / 停止). `attr`: its data-* (data-its-verdict="healthy"), `act` its row's.
  import type { Snippet } from 'svelte';
  import Phrases from '../ui/Phrases.svelte';
  import StatusDot from './StatusDot.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { shown, type BotVerdict } from '#lib/bots/types.ts';

  interface Props {
    verdict: Pick<BotVerdict, 'tone' | 'w' | 'word' | 'sentence' | 'needsLook'>;
    attr: Record<string, string>;
    stale?: boolean;
    children?: Snippet;
    /** The bot's row's data-* (data-its-run="running"). */
    act?: Record<string, string>;
  }
  let { verdict, attr, stale = false, children, act = {} }: Props = $props();
  const dot = $derived(shown(verdict));
  const tint = $derived(verdict.tone === 'busy' ? 'good' : verdict.tone);
</script>

<div class="card pad verdict {tint}" {...attr}>
  <div class="vhead">
    <span class="vdot"><StatusDot tone={dot.tone} look={dot.look} size={14} /></span>
    <div class="vtxt"><b>{verdict.word}</b><p><Phrases text={verdict.sentence} /></p></div>
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
  .vdot { flex: none; display: flex; margin-top: 5px; }
  .vtxt { flex: 1; min-width: 0; }
  .vtxt b { font-size: var(--fs-title); line-height: 1.3; }
  .vtxt p { margin: 2px 0 0; font-size: var(--fs-body); line-height: var(--lh); color: var(--text-soft); font-weight: 700; }
  /* the last known status, a read on its way: a quiet sunk pill (the kit's .tag) */
  .stale {
    flex: none; display: inline-flex; align-items: center; padding: 2px 8px; border-radius: var(--r-pill); white-space: nowrap;
    font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); background: var(--ctl-off);
  }
  .act { display: flex; align-items: center; gap: 10px; padding-top: 10px; border-top: 1.5px dashed var(--stitch); }
</style>
