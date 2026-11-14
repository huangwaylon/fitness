<script lang="ts">
  // ボット's メニュー tab (docs/design.md "Bots"): the Kalori scraper (the weekly chain-menu scrape, its merge into main
  // and the deploy) as its workflows report it in status.json (lib/kalori/status.ts). Top to bottom: a failed read's
  // row (its code, もう一度), the verdict card (順調 · 取得中 · 保留 · 遅れ · 不調 · まだありません; 遅れ by the phone's
  // clock too), 確認が必要 while it's 保留 or 不調 or an alert stands (its reasons, the run's and the PR's links: there is
  // no email nor issue, this card and the tab's dot are the one signal), 最新の更新 (ChangeBar: 追加 · 値の変更 · 終了 ·
  // 削除), 動作状況 (直近8週: StatusStrip, a cell a week; the facts: FactList) and the foot. Nothing to press but links:
  // a run is started on GitHub. Read on open, then every minute while shown (poll.svelte.ts; each read sets the tab's
  // dot: open.svelte.ts); the last status read shows at once, marked 更新中 (lastKnown.ts), and stays under a failed
  // read's row.
  import { t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { alertCard, changeParts, factRows, fetchStatus, footLine, needsAttention, parseStatus, verdictView, weekStrip, type KaloriStatus } from '#lib/kalori/status.ts';
  import { setBadge } from './open.svelte.ts';
  import VerdictCard from './VerdictCard.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import FactList from './FactList.svelte';
  import ChangeBar from './ChangeBar.svelte';
  import Skeleton from './Skeleton.svelte';
  import { statusPoll } from './poll.svelte.ts';
  import { recall, remember } from './lastKnown.ts';

  const EVERY_MS = 60_000;

  /** The status shown: the last read (the one kept from before until this page's first answer: `fresh` false). */
  let data = $state<KaloriStatus | null>(recall('kalori', parseStatus));
  let fresh = $state(false);
  /** The last read's failure code (offline, http 404, …), or null. */
  let failed = $state<string | null>(null);

  const poll = statusPoll(async (signal) => {
    const r = await fetchStatus(signal);
    if (signal.aborted) return;
    failed = r.ok ? null : [r.err, r.http].filter((x) => x !== null).join(' ');
    if (!r.ok) return;
    [data, fresh] = [r.status, true];
    remember('kalori', r.status);
    setBadge('kalori', needsAttention(r.status, Date.now()));
  }, () => EVERY_MS);

  const now = $derived(minuteNow().getTime());
  const verdict = $derived(data && verdictView(data, now));
  const alert = $derived(data && alertCard(data, now));
  const facts = $derived(data ? factRows(data, now) : []);
  const strip = $derived(data && verdict?.verdict !== 'none' ? weekStrip(data, now) : null);
  const change = $derived(data?.diff && verdict?.verdict !== 'none' ? changeParts(data.diff) : null);
  const legend = { ok: t('kalori.strip.legend.ok'), avail: t('kalori.strip.legend.avail'), fail: t('kalori.strip.legend.fail'), none: t('kalori.strip.legend.none') };
</script>

<div class="kalori" data-kalori-page aria-busy={poll.loading}>
  {#if failed}
    <div class="prow static note" data-kalori-error>
      <span class="prl">{t('kalori.loadFailed', { code: failed })}</span>
      <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={poll.loading} onclick={() => poll.loading || void poll.refresh()}>{t('state.retry')}</button>
    </div>
  {/if}
  {#if data && verdict}
    <VerdictCard tone={verdict.tone} word={verdict.word} sentence={verdict.sentence} attr={{ 'data-kalori-verdict': verdict.verdict }}
      stale={!fresh && (poll.loading || !!failed)} />

    {#if alert}
      <div class="card pad alert {verdict.tone}" role="status" aria-labelledby="kalori-alert" data-kalori-alert>
        <h3 id="kalori-alert">{t('kalori.alert.title')}</h3>
        <ul>{#each alert.lines as l (l)}<li data-kalori-reason>{l}</li>{/each}</ul>
        {#if alert.run || alert.pr}
          <div class="links">
            {#if alert.run}<a class="btn small paper" href={alert.run} target="_blank" rel="noopener noreferrer" data-sfx="open" data-kalori-link="run">{t('kalori.alert.run')}</a>{/if}
            {#if alert.pr}<a class="btn small paper" href={alert.pr} target="_blank" rel="noopener noreferrer" data-sfx="open" data-kalori-link="pr">{t('kalori.alert.pr')}</a>{/if}
          </div>
        {/if}
      </div>
    {/if}

    {#if change}
      <section class="sec" aria-labelledby="kalori-latest" data-kalori-latest>
        <h3 id="kalori-latest" class="sec-label">{t('kalori.sec.latest')}</h3>
        <div class="card pad latest">
          {#if data.dataset}<span class="tag" data-kalori-tag>{data.dataset.tag}</span>{/if}
          <ChangeBar segs={change.parts} attr="kalori" label={change.summary} />
        </div>
      </section>
    {/if}

    <section class="sec" aria-labelledby="kalori-status" data-kalori-status>
      <h3 id="kalori-status" class="sec-label">{t('kalori.sec.status')}</h3>
      <div class="card pad">
        {#if strip}
          <StatusStrip cells={strip.cells} ticks={strip.ticks} title={t('kalori.strip.title')} {legend} summary={strip.summary} hint={t('kalori.strip.pick')} attr="kalori" />
        {/if}
        <FactList {facts} more={t('kalori.fact.more')} attr="kalori" />
      </div>
    </section>
    <p class="foot" data-kalori-foot>{footLine(data, now)}</p>
  {:else if !failed}
    <Skeleton attr="kalori" />
  {/if}
</div>

<style>
  .kalori { display: flex; flex-direction: column; gap: 14px; }
  .sec { display: grid; gap: 8px; }
  /* a failed read: yuzu-tinted, 保養所's notice */
  .kalori .note { background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); }
  /* 確認が必要: the verdict's tint, a little paler; its links 44px, side by side */
  .alert { display: grid; gap: 8px; }
  .alert.warn { background: color-mix(in srgb, var(--c-yuzu) 18%, var(--card)); }
  .alert.bad { background: color-mix(in srgb, var(--c-coral) 14%, var(--card)); }
  .alert h3 { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .alert ul { margin: 0; padding-left: 1.2em; display: grid; gap: 2px; font-size: var(--fs-body); font-weight: 700; line-height: var(--lh); }
  .links { display: flex; flex-wrap: wrap; gap: 8px; }
  .links .btn { margin: 0; min-height: var(--hit); }
  .latest { display: grid; gap: 10px; justify-items: start; }
  .latest > :global(.changes) { justify-self: stretch; }
  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; line-height: var(--lh); }
</style>
