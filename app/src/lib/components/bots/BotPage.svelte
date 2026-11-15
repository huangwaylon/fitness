<script lang="ts">
  // A bot's page (docs/design.md "Bots"), one order for the three: LoadError (a failed read), the status (StatusCard:
  // the word, the as-of, the act or the sentence, an answer `note`, the bot's ⋯ `menu`, the history `strip`), 要対応
  // (AttentionCard, only for what the card doesn't say: steps and links, the sentence an act took the place of, `attn`
  // more of the bot's own), the bot's own sections and 設定
  // (`children`: a sec-label and a card each), くわしく last (FactList, the page's `more` rows at its bottom), and `tail` (保養所's sticky 保存 bar). Until the
  // first status (none kept), or when it failed, the ⋯ stands alone in a row and the bot's own sections show all
  // the same (ジム's calendar never waits on /status); a skeleton in the card's place. The shared CSS of the pages
  // lives here (.sec, .hint, .lbl). `attr`: the page's data-* prefix (data-gym-page, …).
  import type { Snippet } from 'svelte';
  import type { BotVerdict } from '#lib/bots/types.ts';
  import NavButton from '../ui/NavButton.svelte';
  import StatusCard from './StatusCard.svelte';
  import type { CardStrip } from '#lib/strip.ts';
  import AttentionCard from './AttentionCard.svelte';
  import FactList, { type MoreRow } from './FactList.svelte';
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
    menu?: { label: string; onopen: () => void } | null;
    note?: Snippet;
    attention?: { lines: readonly string[]; links?: readonly { id: string; href: string; label: string }[] } | null;
    attn?: Snippet;
    children?: Snippet;
    strip?: CardStrip | null;
    facts: readonly { id: string; label: string; value: string; href?: string }[];
    /** Rows at the bottom of くわしく. */
    more?: readonly MoreRow[];
    tail?: Snippet;
    /** More data-* on the page (ジム's data-config). */
    rootAttr?: Record<string, string>;
  }
  let { rootAttr = {}, attr, busy, failed, onretry, verdict, vid, stale, readAt = null, now = Date.now(), menu = null, note, attention, attn, children, strip, facts, more, tail }: Props = $props();
  /** 確認が必要's lines: the sentence when the card shows the act in its place, then the page's. */
  const lines = $derived([...(verdict?.needsLook && verdict.act && verdict.sentence ? [verdict.sentence] : []), ...(attention?.lines ?? [])]);
  const showAttn = $derived(!!attn || !!lines.length || !!attention?.links?.length);
</script>

<div class="bpage" {...{ [`data-${attr}-page`]: '' }} {...rootAttr} aria-busy={busy}>
  {#if failed}<LoadError code={failed} {busy} {onretry} {attr} />{/if}
  {#if verdict}
    <StatusCard {verdict} attr={{ [`data-${attr}-verdict`]: vid ?? verdict.w }} {stale} {readAt} {now} page={attr} {menu} {note} {strip} />
    {#if showAttn}
      <AttentionCard tone={verdict.tone === 'bad' ? 'bad' : 'warn'} {lines} links={attention?.links} {attr} children={attn} />
    {/if}
  {:else}
    {#if menu || note}
      <div class="card pad actrow">
        <div class="anote">{@render note?.()}</div>
        {#if menu}<NavButton kind="tool" icon="more" label={menu.label} popup sfx="open" onclick={menu.onopen} {...{ [`data-${attr}-menu`]: '' }} />{/if}
      </div>
    {/if}
    {#if !failed}<Skeleton {attr} />{/if}
  {/if}
  {@render children?.()}
  {#if verdict}
    <FactList {facts} {more} {attr} />
    {@render tail?.()}
  {/if}
</div>

<style>
  .bpage { display: flex; flex-direction: column; gap: 10px; }
  .bpage :global(.sec) { display: grid; gap: 6px; }
  .bpage :global(.sec-label) { margin: 0 4px; }
  .bpage :global(.hint) { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .bpage :global(.lbl) { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); margin: 0 4px; }
  .actrow { display: flex; align-items: center; gap: 10px; padding-block: 4px; }
  .anote { flex: 1; min-width: 0; }
</style>
