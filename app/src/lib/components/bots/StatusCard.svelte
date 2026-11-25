<script lang="ts">
  // A page's status (docs/bots.md): Jobs' verdict card, at the top of its page (ジム's and 保養所's are rows in Jobs:
  // ServiceRow). Row 1: the dot (StatusDot: the tab's own), the word (a fine or idle one needing a look 要対応) and the
  // as-of (「12:00時点」, 更新中 while it's the last known one and a read is on its way). Row 2: what a person must do
  // (the driver's `act`, in ink), else the sentence (never the word again), else nothing. Filled by its tone (busy as
  // good). `attr`: its data-* (data-jobs-verdict="healthy").
  import Phrases from '../ui/Phrases.svelte';
  import StatusDot from './StatusDot.svelte';
  import { scoped } from '#lib/i18n/index.ts';
  import { timeOf } from '#lib/i18n/when.ts';
  import { shown, type BotVerdict } from '#lib/bots/types.ts';

  interface Props {
    verdict: Pick<BotVerdict, 'tone' | 'w' | 'word' | 'sentence' | 'needsLook' | 'act'>;
    attr: Record<string, string>;
    stale?: boolean;
    /** When the status shown was read, and the clock to word it by. */
    readAt?: number | null;
    now: number;
  }
  let { verdict, attr, stale = false, readAt = null, now }: Props = $props();
  const { t, at } = scoped();
  const dot = $derived(shown(verdict));
  /** The bot's own word; a fine or idle one needing a look is drawn as its dot: 要対応. */
  const word = $derived(dot.w === 'needsYou' ? t('bots.w.needsYou') : verdict.word);
  const act = $derived(verdict.needsLook && verdict.act ? verdict.act : null);
</script>

<div class="card pad status {dot.tone}" {...attr}>
  <div class="top">
    <StatusDot tone={dot.tone} look={dot.look} size={10} />
    <b class="word" data-bots-word>{word}</b>
    {#if stale}<span class="asof busy" data-bots-stale>{t('bots.updating')}</span>
    {:else if readAt !== null}<span class="asof" data-bots-asof>{t('bots.asOf', { time: at(() => timeOf(readAt!, now)) })}</span>{/if}
  </div>
  {#if act}<p class="act" data-bots-act><Phrases text={act} /></p>
  {:else if verdict.sentence}<p class="say" data-bots-say><Phrases text={verdict.sentence} /></p>{/if}
</div>

<style>
  .status { display: grid; gap: 2px; }
  .status.good { background: var(--ok-bg); }
  .status.warn { background: var(--warn-soft); }
  .status.bad { background: color-mix(in srgb, var(--c-coral) 24%, var(--card)); }
  .top { display: flex; align-items: center; gap: 8px; min-height: 24px; }
  .word { font: 700 15px/1.3 var(--font-ui); }
  .asof { font: 700 13px/1.3 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .asof.busy { padding: 0 7px; border-radius: var(--r-pill); background: var(--ctl-off); }
  .act { margin: 0; font: 700 var(--fs-body)/var(--lh) var(--font-ui); color: var(--text); text-wrap: pretty; }
  .say { margin: 0; font-size: var(--fs-s); line-height: var(--lh); font-weight: 700; color: var(--text-soft); text-wrap: pretty; }
</style>
