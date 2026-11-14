<script lang="ts" module>
  import type { StripCell, StripTick, CellState } from '#lib/strip.ts';
  /** The history strip (StatusStrip's props). */
  export interface BotStrip { cells: readonly StripCell[]; ticks: readonly StripTick[]; title: string; legend: Partial<Record<CellState, string>>; summary: string; line: string; empty?: string }
</script>

<script lang="ts">
  // A bot's page (docs/design.md "Bots"), one order for the three: LoadError (a failed read), the verdict (VerdictCard:
  // the word, the as-of, the sentence, the key row, the one action `act`, an answer under it `note`), 要対応
  // (AttentionCard, only for what the sentence doesn't say: steps and links, `attn` more of the bot's own), the
  // history strip (StatusStrip; left out with nothing in it, unless `empty` warns), the bot's own sections and 設定
  // (`children`: a sec-label and a card each), くわしく last (FactList), and `tail` (保養所's sticky 保存 bar). Until the
  // first status (none kept), or when it failed, the action stands alone in a row and the bot's own sections show all
  // the same (ジム's calendar never waits on /status); a skeleton in the verdict's place. The shared CSS of the pages
  // lives here (.sec, .hint, .lbl). `attr`: the page's data-* prefix (data-gym-page, …).
  import type { Snippet } from 'svelte';
  import type { BotVerdict } from '#lib/bots/types.ts';
  import VerdictCard, { type BotKey } from './VerdictCard.svelte';
  import AttentionCard from './AttentionCard.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import FactList from './FactList.svelte';
  import Skeleton from './Skeleton.svelte';
  import LoadError from './LoadError.svelte';

  interface Props {
    attr: string;
    busy: boolean;
    failed: string | null;
    onretry: () => void;
    verdict: BotVerdict | null;
    /** The verdict card's data-* value (data-<attr>-verdict). */
    vid?: string;
    stale: boolean;
    readAt?: number | null;
    now?: number;
    keys?: readonly BotKey[];
    act?: Snippet;
    actAttr?: Record<string, string>;
    note?: Snippet;
    attention?: { lines: readonly string[]; links?: readonly { id: string; href: string; label: string }[] } | null;
    attn?: Snippet;
    children?: Snippet;
    strip?: BotStrip | null;
    facts: readonly { id: string; label: string; value: string; href?: string }[];
    tail?: Snippet;
    /** More data-* on the page (ジム's data-config). */
    rootAttr?: Record<string, string>;
  }
  let { rootAttr = {}, attr, busy, failed, onretry, verdict, vid, stale, readAt = null, now = Date.now(), keys = [], act, actAttr, note, attention, attn, children, strip, facts, tail }: Props = $props();
  const showStrip = $derived(!!strip && (!!strip.empty || strip.cells.some((c) => c.state !== 'none')));
  const showAttn = $derived(!!attn || !!attention?.lines.length || !!attention?.links?.length);
</script>

<div class="bpage" {...{ [`data-${attr}-page`]: '' }} {...rootAttr} aria-busy={busy}>
  {#if failed}<LoadError code={failed} {busy} {onretry} {attr} />{/if}
  {#if verdict}
    <VerdictCard {verdict} attr={{ [`data-${attr}-verdict`]: vid ?? verdict.w }} {stale} {readAt} {now} {keys} page={attr} {act} {actAttr} {note} />
    {#if showAttn}
      <AttentionCard tone={verdict.tone === 'bad' ? 'bad' : 'warn'} lines={attention?.lines ?? []} links={attention?.links} {attr} children={attn} />
    {/if}
    {#if showStrip && strip}<StatusStrip {...strip} {attr} />{/if}
  {:else}
    {#if act}<div class="card pad actrow" {...actAttr}>{@render act()}</div>{/if}
    {#if note}{@render note()}{/if}
    {#if !failed}<Skeleton {attr} />{/if}
  {/if}
  {@render children?.()}
  {#if verdict}
    <FactList {facts} {attr} />
    {@render tail?.()}
  {/if}
</div>

<style>
  .bpage { display: flex; flex-direction: column; gap: 10px; }
  .bpage :global(.sec) { display: grid; gap: 6px; }
  .bpage :global(.sec-label) { margin: 0 4px; }
  .bpage :global(.hint) { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .bpage :global(.lbl) { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); margin: 0 4px; }
  .actrow { display: flex; align-items: center; justify-content: flex-end; gap: 10px; }
</style>
