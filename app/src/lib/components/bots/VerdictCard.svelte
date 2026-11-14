<script lang="ts" module>
  /** A key row cell: 前回 · 次回 · 成果. */
  export interface BotKey { id: string; label: string; value: string; sub?: string }
</script>

<script lang="ts">
  // A bot's verdict (docs/design.md "Bots"), at the top of every bot page. Row 1: the dot (StatusDot: the tab's own),
  // the word (保留, 不調: the bot's own, never raised to 要対応), the as-of tag (「12:00時点」: when the status shown was
  // read; 更新中 while it's the last known one and a read is on its way or failed), and the one action the state calls
  // for (`act`, trailing). Then the sentence (the state or the cause, no figure the key row has), a dashed stitch and
  // the key row (StatStrip dense: 前回 · 次回 · 成果), and `note` (an action's answer: ジム's 今すぐ確認). Tinted by its
  // tone (busy as good). VoiceOver: the word, the as-of, the sentence, the key row, then the action (the grid draws
  // the action on row 1). `attr`: its data-* (data-its-verdict="healthy"), `actAttr` the action's wrapper's.
  import type { Snippet } from 'svelte';
  import Phrases from '../ui/Phrases.svelte';
  import StatStrip from '../ui/StatStrip.svelte';
  import StatusDot from './StatusDot.svelte';
  import { t } from '#lib/i18n/index.ts';
  import { timeOf } from '#lib/i18n/when.ts';
  import { shown, type BotVerdict } from '#lib/bots/types.ts';

  interface Props {
    verdict: Pick<BotVerdict, 'tone' | 'w' | 'word' | 'sentence' | 'needsLook'>;
    attr: Record<string, string>;
    stale?: boolean;
    /** When the status shown was read, and the clock to word it by. */
    readAt?: number | null;
    now: number;
    keys?: readonly BotKey[];
    /** The page's data-* prefix (data-gym-key="last"). */
    page: string;
    act?: Snippet;
    actAttr?: Record<string, string>;
    note?: Snippet;
  }
  let { verdict, attr, stale = false, readAt = null, now, keys = [], page, act, actAttr = {}, note }: Props = $props();
  const dot = $derived(shown(verdict));
  const tint = $derived(dot.tone);
  /** The bot's own word; a fine or idle one needing a look is drawn as its dot: 要対応. */
  const word = $derived(dot.w === 'needsYou' ? t('bots.w.needsYou') : verdict.word);
</script>

<div class="card pad verdict {tint}" {...attr}>
  <span class="vdot"><StatusDot tone={dot.tone} look={dot.look} size={10} /></span>
  <b class="word">{word}</b>
  {#if stale}<span class="asof busy" data-bots-stale>{t('bots.updating')}</span>
  {:else if readAt !== null}<span class="asof" data-bots-asof>{t('bots.asOf', { time: timeOf(readAt, now) })}</span>{/if}
  <p class="say"><Phrases text={verdict.sentence} /></p>
  {#if keys.length}<div class="keys"><StatStrip dense items={keys} attr={page} /></div>{/if}
  {#if act}<div class="act" {...actAttr}>{@render act()}</div>{/if}
  {#if note}<div class="note">{@render note()}</div>{/if}
</div>

<style>
  .verdict {
    display: grid; grid-template-columns: auto auto minmax(0, 1fr) auto; align-items: center; column-gap: 8px;
  }
  .verdict.good { background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  .verdict.warn { background: color-mix(in srgb, var(--c-yuzu) 30%, var(--card)); }
  .verdict.bad { background: color-mix(in srgb, var(--c-coral) 24%, var(--card)); }
  .vdot { grid-area: 1 / 1; display: flex; }
  .word { grid-area: 1 / 2; font: 700 var(--fs-body)/1.3 var(--font-ui); white-space: nowrap; }
  /* the as-of: a quiet tag (the kit's .tag look); 更新中 the same, sunk */
  .asof {
    grid-area: 1 / 3; justify-self: start; padding: 1px 7px; border-radius: var(--r-pill); white-space: nowrap;
    font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums;
  }
  .asof.busy { background: var(--ctl-off); }
  .act { grid-area: 1 / 4; display: flex; align-items: center; gap: 6px; margin: -6px -4px -6px 0; }
  .act :global(.btn) { margin: 0; }
  .say {
    grid-column: 1 / -1; margin: 2px 0 0; font-size: var(--fs-s); line-height: var(--lh); font-weight: 700; color: var(--text-soft);
    text-wrap: pretty;
  }
  .keys { grid-column: 1 / -1; margin-top: 8px; border-top: 1.5px dashed var(--stitch); }
  .note { grid-column: 1 / -1; margin-top: 8px; }
</style>
