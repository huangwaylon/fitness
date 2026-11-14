<script lang="ts">
  // ボット's メニュー tab (docs/design.md "Bots"): the Kalori scraper (the weekly chain-menu scrape, its merge into main
  // and the deploy) as its workflows report it in status.json (lib/kalori/status.ts), on BotPage's skeleton: the
  // verdict (順調 · 取得中 · 保留 · 遅れ · 不調 · まだありません; 遅れ by the phone's clock too), 確認が必要 while it's 保留
  // or 不調 or an alert stands (its reasons, the run's and the PR's links: no email nor issue, this card and the dot
  // are the one signal), 最新の更新 (ChangeBar: 追加 · 値の変更 · 終了 · 削除), 動作状況 (直近8週, a cell a week) and the
  // foot. Nothing to press but links: a run is started on GitHub. Read while shown (useBot.svelte.ts).
  import { t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { WORKFLOW, alertCard, changeParts, factRows, tokyoDay, verdictOf, weekStrip, type KaloriStatus } from '#lib/kalori/status.ts';
  import { driver } from '#lib/kalori/bot.ts';
  import BotPage from './BotPage.svelte';
  import ChangeBar from './ChangeBar.svelte';
  import { useBot } from './useBot.svelte.ts';

  const bot = useBot<KaloriStatus>('kalori', driver);

  const now = $derived(minuteNow().getTime());
  const data = $derived(bot.data);
  const verdict = $derived(data && driver.verdict(data, now));
  const vid = $derived(data ? verdictOf(data, now) : undefined);
  const none = $derived(vid === 'none');
  const alert = $derived(data && alertCard(data, now));
  const strip = $derived(data && !none ? weekStrip(data, now) : null);
  const change = $derived(data?.diff && !none ? changeParts(data.diff) : null);
  const legend = { ok: t('kalori.strip.legend.ok'), avail: t('kalori.strip.legend.avail'), fail: t('kalori.strip.legend.fail'), none: t('kalori.strip.legend.none') };
</script>

<BotPage attr="kalori" busy={bot.poll.loading} failed={bot.failed} onretry={() => void bot.poll.refresh()} {verdict} {vid}
  stale={bot.stale} attention={alert && { lines: alert.lines, links: [
    ...(alert.run ? [{ id: 'run', href: alert.run, label: t('bots.attn.run') }] : []),
    ...(alert.pr ? [{ id: 'pr', href: alert.pr, label: t('bots.attn.pr') }] : [])
  ] }}
  strip={strip && { ...strip, title: t('kalori.strip.title'), legend, hint: t('kalori.strip.pick') }}
  facts={data ? factRows(data, now) : []} foot={data && { parts: [WORKFLOW], at: data.at, today: tokyoDay(now) }}>
  {#if change && data}
    <section class="sec" aria-labelledby="kalori-latest" data-kalori-latest>
      <h3 id="kalori-latest" class="sec-label">{t('kalori.sec.latest')}</h3>
      <div class="card pad latest">
        {#if data.dataset}<span class="tag" data-kalori-tag>{data.dataset.tag}</span>{/if}
        <ChangeBar segs={change.parts} attr="kalori" label={change.summary} />
      </div>
    </section>
  {/if}
</BotPage>

<style>
  .latest { display: grid; gap: 10px; justify-items: start; }
  .latest > :global(.changes) { justify-self: stretch; }
</style>
