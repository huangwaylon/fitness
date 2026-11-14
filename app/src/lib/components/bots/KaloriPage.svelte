<script lang="ts">
  // ボット's メニュー tab (docs/design.md "Bots"): the Kalori scraper (the weekly chain-menu scrape, its merge into main
  // and the deploy) as its workflows report it in status.json (lib/kalori/status.ts), on BotPage: the verdict (順調 ·
  // 取得中 · 保留 · 遅れ · 不調 · まだありません; 遅れ by the phone's clock too) with its key row (前回 · 次回 · 品目, 不調:
  // 最後の成功) and 実行を開く while a run is worth a look; 確認が必要 only for what its sentence leaves out (保留: the PR
  // to merge by hand); 直近8週 (a cell a week); 前回の変更 (ChangeBar: 追加 · 値の変更 · 終了 · 削除); くわしく. No email
  // nor issue: the card and the dot are the one signal; nothing to press but links (a run is started on GitHub). Read
  // while shown (useBot.svelte.ts).
  import { t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { alertCard, changeParts, factRows, keyRow, runLink, verdictOf, weekStrip, type KaloriStatus } from '#lib/kalori/status.ts';
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
  const run = $derived(data && runLink(data, now));
  const strip = $derived(data && !none ? weekStrip(data, now) : null);
  const change = $derived(data?.diff && !none ? changeParts(data.diff) : null);
  const legend = { ok: t('kalori.strip.legend.ok'), warn: t('kalori.strip.legend.avail'), fail: t('kalori.strip.legend.fail'), none: t('kalori.strip.legend.none') };
</script>

{#snippet act()}
  <a class="btn small paper" href={run} target="_blank" rel="noopener noreferrer" data-sfx="open" data-kalori-run-link>{t('bots.attn.run')}</a>
{/snippet}

<BotPage attr="kalori" busy={bot.poll.loading} failed={bot.failed} onretry={() => void bot.poll.refresh()} {verdict} {vid}
  stale={bot.stale} readAt={bot.readAt} {now} keys={data ? keyRow(data, now) : []} act={run ? act : undefined}
  attention={alert && { lines: alert.lines, links: alert.pr ? [{ id: 'pr', href: alert.pr, label: t('bots.attn.pr') }] : [] }}
  strip={strip && { ...strip, title: t('kalori.strip.title'), legend }}
  facts={data ? factRows(data, now) : []}>
  {#if change && data}
    <section class="sec" aria-labelledby="kalori-latest" data-kalori-latest>
      <h3 id="kalori-latest" class="sec-label">{t('kalori.sec.latest')}</h3>
      <div class="card pad"><ChangeBar segs={change.parts} attr="kalori" label={change.summary} /></div>
    </section>
  {/if}
</BotPage>
