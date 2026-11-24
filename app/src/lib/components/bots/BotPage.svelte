<script lang="ts">
  // A bot's page (docs/bots.md), one order for the three: ui/LoadError (a failed read, 「読み込めませんでした（オフライン）」;
  // offline with a status shown, the last copy, a quiet line instead: 「オフラインのため、前回の内容を表示しています」 and
  // もう一度, the card's 「12:00時点」 saying how old), the status (StatusCard:
  // the word, the as-of, the act or the sentence, an answer `note`, the bot's ⋯ `menu`, the history `strip`), 要対応
  // (AttentionCard, only for what the card doesn't say: steps and links, the sentence an act took the place of, `attn`
  // more of the bot's own), the bot's own sections and 設定
  // (`children`: a sec-label and a card each), くわしく last (FactList, the page's `more` rows at its bottom), and `tail` (保養所's sticky 保存 bar). Until the
  // first status (none kept), or when it failed, the ⋯ stands alone in a row and the bot's own sections show all
  // the same (ジム's calendar never waits on /status); a skeleton in the card's place. The shared CSS of the pages
  // lives here (.sec, .hint, .lbl). `attr`: the page's data-* prefix (data-gym-page, …).
  import type { Snippet } from 'svelte';
  import type { BotVerdict } from '#lib/bots/types.ts';
  import type { BotState } from './useBot.svelte.ts';
  import NavButton from '../ui/NavButton.svelte';
  import StatusCard from './StatusCard.svelte';
  import type { CardStrip } from '#lib/strip.ts';
  import AttentionCard from './AttentionCard.svelte';
  import FactList, { type MoreRow } from './FactList.svelte';
  import Skeleton from './Skeleton.svelte';
  import LoadError from '../ui/LoadError.svelte';
  import { scoped } from '#lib/i18n/index.ts';

  interface Props {
    attr: string;
    busy: boolean;
    /** The bot's state (useBot): its failure, staleness and read time. */
    bot: Pick<BotState<unknown>, 'failed' | 'stale' | 'readAt'>;
    onretry: () => void;
    verdict: BotVerdict | null;
    /** The verdict card's data-* value (data-<attr>-verdict). */
    vid?: string;
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
  let { rootAttr = {}, attr, busy, bot, onretry, verdict, vid, now = Date.now(), menu = null, note, attention, attn, children, strip, facts, more, tail }: Props = $props();
  // (a page may pin its language: Jobs is English only, i18n pinLocale)
  const { t } = scoped();
  /** 確認が必要's lines: the sentence when the card shows the act in its place, then the page's. */
  const lines = $derived([...(verdict?.needsLook && verdict.act && verdict.sentence ? [verdict.sentence] : []), ...(attention?.lines ?? [])]);
  const showAttn = $derived(!!attn || !!lines.length || !!attention?.links?.length);
</script>

<div class="bpage" {...{ [`data-${attr}-page`]: '' }} {...rootAttr} aria-busy={busy}>
  {#if bot.failed === 'offline' && verdict}
    <p class="hint quiet" role="status" {...{ [`data-${attr}-error`]: '', 'data-offline': '' }}>
      <span>{t('bots.offlineKept')}</span><button type="button" class="btn small paper" data-sfx="tick" aria-disabled={busy} onclick={() => busy || onretry()}>{t('state.retry')}</button>
    </p>
  {:else if bot.failed}<LoadError text={t('bots.loadFailed', { code: bot.failed === 'offline' ? t('bots.offline') : bot.failed === 'timeout' ? t('bots.timeout') : bot.failed })} {busy} {onretry} {...{ [`data-${attr}-error`]: '' }} />{/if}
  {#if verdict}
    <StatusCard {verdict} attr={{ [`data-${attr}-verdict`]: vid ?? verdict.w }} stale={bot.stale} readAt={bot.readAt} {now} page={attr} {menu} {note} {strip} />
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
    {#if !bot.failed}<Skeleton {attr} />{/if}
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
  /* (no tinted row: the status under it is the last copy, its 「12:00時点」 on the card) */
  .quiet { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; }
  .quiet .btn { margin: 0; }
  .actrow { display: flex; align-items: center; gap: 10px; padding-block: 4px; }
  .anote { flex: 1; min-width: 0; }
</style>
