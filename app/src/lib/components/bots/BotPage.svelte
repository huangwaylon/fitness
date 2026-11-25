<script lang="ts">
  // A bot's page (docs/bots.md), one order for the three: ui/LoadError (a failed read, 「読み込めませんでした（オフライン）」;
  // offline with a status shown, the last copy, a quiet line instead: 「オフラインのため、前回の内容を表示しています」 and
  // もう一度), then the status: Jobs' card (StatusCard: the word, the as-of, the act or the sentence), or ジム's and
  // 保養所's `head` (their status is a row in Jobs: ServiceRow): the page's heading, its dot inline (StatusDot, the
  // verdict's tone, dimmed while stale or failed; a button to the bot's row in Jobs when `head.jump`; it carries
  // data-<attr>-verdict) and the bot's ⋯ (`menu`), an answer `note` under it. Then 確認が必要 (AttentionCard: under
  // a head, the act or, while a person must look, the sentence first; under the card only what it doesn't say: steps
  // and links, `attn` more of the bot's own), the bot's own sections and 設定 (`children`: a sec-label and a card
  // each), くわしく last (FactList: the facts, the page's `more` rows at its bottom), and `tail` (保養所's sticky 保存
  // bar). Until the first status (none kept) a skeleton, unless it failed; the bot's own sections show all the same
  // (ジム's calendar never waits on /status). The shared CSS of the pages lives here (.sec, .hint, .lbl). `attr`: the
  // page's data-* prefix (data-gym-page, …).
  import type { Snippet } from 'svelte';
  import { shown, type BotVerdict } from '#lib/bots/types.ts';
  import type { BotState } from './useBot.svelte.ts';
  import NavButton from '../ui/NavButton.svelte';
  import StatusCard from './StatusCard.svelte';
  import StatusDot from './StatusDot.svelte';
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
    /** The verdict's data-* value (data-<attr>-verdict). */
    vid?: string;
    now?: number;
    /** A head instead of the card: the heading, the tab's name (the dot's 「ジムの状態：順調」) and the jump to Jobs. */
    head?: { title: string; bot: string; jump?: () => void } | null;
    menu?: { label: string; onopen: () => void } | null;
    note?: Snippet;
    attention?: { lines: readonly string[]; links?: readonly { id: string; href: string; label: string }[] } | null;
    attn?: Snippet;
    children?: Snippet;
    facts?: readonly { id: string; label: string; value: string; href?: string }[];
    /** Rows at the bottom of くわしく. */
    more?: readonly MoreRow[];
    tail?: Snippet;
    /** More data-* on the page (ジム's data-config). */
    rootAttr?: Record<string, string>;
  }
  let { rootAttr = {}, attr, busy, bot, onretry, verdict, vid, now = Date.now(), head = null, menu = null, note, attention, attn, children, facts = [], more, tail }: Props = $props();
  // (a page may pin its language: Jobs is English only, i18n pinLocale)
  const { t } = scoped();
  /** 確認が必要's lead (under a head): what a person must do, else the sentence while they must look. */
  const act = $derived(head && verdict?.needsLook ? (verdict.act || verdict.sentence || null) : null);
  /** Its lines: the sentence when the act (the card's, the lead's) took its place, under a head the sentence before
   *  the page's own lines, then the page's. */
  const lines = $derived.by(() => {
    const own = attention?.lines ?? [];
    const say = verdict?.sentence;
    if (!say) return own;
    if (head) return act === say || !(act || own.length) ? own : [say, ...own];
    return verdict.needsLook && verdict.act ? [say, ...own] : own;
  });
  const showAttn = $derived(!!attn || !!act || !!lines.length || !!attention?.links?.length);
  const dot = $derived(verdict ? shown(verdict) : { tone: 'unknown' as const, look: false, w: 'unknown' as const });
  const dim = $derived(!!verdict && (bot.stale || !!bot.failed));
  const dotName = $derived(head && [
    t('bots.dot.say', { bot: head.bot, word: dot.w === 'needsYou' || !verdict ? t(`bots.w.${dot.w}`) : verdict.word }),
    dim ? t('bots.stale') : '',
    head.jump ? t('bots.dot.jump') : ''
  ].join(''));
  const dotAttr = $derived({ 'data-bots-dot': '', ...(verdict ? { [`data-${attr}-verdict`]: vid ?? verdict.w } : {}) });
</script>

<div class="bpage" {...{ [`data-${attr}-page`]: '' }} {...rootAttr} aria-busy={busy}>
  {#if bot.failed === 'offline' && verdict}
    <p class="hint quiet" role="status" {...{ [`data-${attr}-error`]: '', 'data-offline': '' }}>
      <span>{t('bots.offlineKept')}</span><button type="button" class="btn small paper" data-sfx="tick" aria-disabled={busy} onclick={() => busy || onretry()}>{t('state.retry')}</button>
    </p>
  {:else if bot.failed}<LoadError text={t('bots.loadFailed', { code: bot.failed === 'offline' ? t('bots.offline') : bot.failed === 'timeout' ? t('bots.timeout') : bot.failed })} {busy} {onretry} {...{ [`data-${attr}-error`]: '' }} />{/if}
  {#if head}
    <div class="phead">
      <h3 class="sec-label ptitle">{head.title}</h3>
      {#if head.jump}
        <button type="button" class="dotbtn" aria-label={dotName} data-sfx="tick" onclick={head.jump} {...dotAttr}><StatusDot tone={dot.tone} look={dot.look} stale={dim} /></button>
      {:else}
        <span class="dotbtn" role="img" aria-label={dotName} {...dotAttr}><StatusDot tone={dot.tone} look={dot.look} stale={dim} /></span>
      {/if}
      {#if menu}<span class="menu"><NavButton kind="tool" icon="more" label={menu.label} popup sfx="open" onclick={menu.onopen} {...{ [`data-${attr}-menu`]: '' }} /></span>{/if}
    </div>
    {#if note}<div class="pnote">{@render note()}</div>{/if}
  {:else if verdict}
    <StatusCard {verdict} attr={{ [`data-${attr}-verdict`]: vid ?? verdict.w }} stale={bot.stale} readAt={bot.readAt} {now} />
  {/if}
  {#if verdict && showAttn}
    <AttentionCard tone={verdict.tone === 'bad' ? 'bad' : 'warn'} {act} {lines} links={attention?.links} {attr} children={attn} />
  {/if}
  {#if !verdict && !bot.failed}<Skeleton {attr} />{/if}
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
  /* (no tinted row: the status under it is the last copy, as the card's 「12:00時点」 or the head's dimmed dot says) */
  .quiet { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 10px; }
  .quiet .btn { margin: 0; }
  /* the head: the heading, its dot inline (12px drawn in a 44px hit, spilling into the gaps), ⋯ at the row's end */
  .phead { display: flex; align-items: center; min-height: var(--hit); margin-top: -4px; }
  /* the page's heading, in ink (not a section's soft label: nothing sits under it but the page) */
  .ptitle { margin: 0 2px 0 4px; font-size: var(--fs-body); color: var(--text); letter-spacing: 0; }
  .dotbtn { appearance: none; display: inline-grid; place-items: center; width: var(--hit); height: var(--hit); margin: -2px 0 -2px -12px; padding: 0; border: 0; background: none; cursor: pointer; }
  span.dotbtn { cursor: default; }
  .dotbtn:focus-visible { outline: 3px solid var(--focus); outline-offset: -6px; border-radius: 50%; }
  .menu { display: flex; margin: 0 -6px 0 auto; }
  .pnote { margin: -6px 4px 0; }
</style>
