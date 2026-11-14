<script lang="ts" module>
  import type { StripCell, StripTick, CellState } from '#lib/strip.ts';
  /** 動作状況's strip (StatusStrip's props). */
  export interface BotStrip { cells: readonly StripCell[]; ticks: readonly StripTick[]; title: string; legend: Record<CellState, string>; summary: string; hint: string }
</script>

<script lang="ts">
  // A bot's page (docs/design.md "Bots"), one skeleton for the three: LoadError (a failed read), the verdict
  // (VerdictCard, full size, the bot's controls in its row: `act`), 確認が必要 (AttentionCard) while a person must look,
  // the bot's own sections (`children`: a sec-label and a `card pad` each), 動作状況 (the strip, else one hint,
  // まだ記録がありません: never a strip with nothing in it; the facts, くわしく), the foot (BotFoot; `saved` a line above it) and `tail` (保養所's
  // sticky 保存 bar). Until the first status (none kept), or when it failed, the controls stand alone in a row and the
  // bot's own sections show all the same (ジム's calendar never waits on /status); a skeleton in 動作状況's place. The
  // shared CSS of the pages lives here (.sec, .hint, .lbl). `attr`: the page's data-* prefix (data-gym-page, …).
  import type { Snippet } from 'svelte';
  import type { BotVerdict } from '#lib/bots/types.ts';
  import { t } from '#lib/i18n/index.ts';
  import VerdictCard from './VerdictCard.svelte';
  import AttentionCard from './AttentionCard.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import FactList from './FactList.svelte';
  import Skeleton from './Skeleton.svelte';
  import LoadError from './LoadError.svelte';
  import BotFoot from './BotFoot.svelte';

  interface Props {
    attr: string;
    busy: boolean;
    failed: string | null;
    onretry: () => void;
    verdict: BotVerdict | null;
    /** The verdict card's data-* value (data-<attr>-verdict). */
    vid?: string;
    stale: boolean;
    act?: Snippet;
    actAttr?: Record<string, string>;
    attention?: { lines: readonly string[]; links?: readonly { id: string; href: string; label: string }[] } | null;
    children?: Snippet;
    strip?: BotStrip | null;
    facts: readonly { id: string; label: string; value: string; href?: string; more?: boolean }[];
    foot: { parts: readonly (string | null | undefined)[]; at: number; today: string } | null;
    saved?: Snippet;
    tail?: Snippet;
    /** More data-* on the page (ジム's data-config). */
    rootAttr?: Record<string, string>;
  }
  let { rootAttr = {}, attr, busy, failed, onretry, verdict, vid, stale, act, actAttr, attention, children, strip, facts, foot, saved, tail }: Props = $props();
</script>

<div class="bpage" {...{ [`data-${attr}-page`]: '' }} {...rootAttr} aria-busy={busy}>
  {#if failed}<LoadError code={failed} {busy} {onretry} {attr} />{/if}
  {#if verdict}
    <VerdictCard {verdict} attr={{ [`data-${attr}-verdict`]: vid ?? verdict.w }} {stale} act={actAttr} children={act} />
    {#if attention && verdict.needsLook}
      <AttentionCard tone={verdict.tone === 'bad' ? 'bad' : 'warn'} lines={attention.lines} links={attention.links} {attr} />
    {/if}
  {:else if act}
    <div class="card pad actrow" {...actAttr}>{@render act()}</div>
  {/if}
  {@render children?.()}
  {#if verdict}
    <section class="sec" aria-labelledby="{attr}-status" {...{ [`data-${attr}-status`]: '' }}>
      <h3 id="{attr}-status" class="sec-label">{t('bots.sec.status')}</h3>
      <div class="card pad">
        {#if strip?.cells.some((c) => c.state !== 'none')}
          <StatusStrip {...strip} {attr} />
        {:else}
          <p class="hint empty" {...{ [`data-${attr}-empty`]: '' }}>{t('bots.empty')}</p>
        {/if}
        <FactList {facts} more={t('bots.more')} {attr} />
      </div>
    </section>
    {#if foot}<BotFoot {...foot} {attr} children={saved} />{/if}
    {@render tail?.()}
  {:else if !failed}
    <Skeleton {attr} />
  {/if}
</div>

<style>
  .bpage { display: flex; flex-direction: column; gap: 14px; }
  .bpage :global(.sec) { display: grid; gap: 8px; }
  .bpage :global(.hint) { margin: 0 4px; font-size: var(--fs-s); font-weight: 700; line-height: var(--lh); color: var(--text-soft); }
  .bpage :global(.lbl) { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); margin: 0 4px; }
  .hint.empty { margin: 0 0 12px; }
  .actrow { display: flex; align-items: center; gap: 10px; }
</style>
