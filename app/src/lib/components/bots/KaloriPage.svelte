<script lang="ts">
  // ボット's メニュー tab (docs/bots.md): the Kalori scraper (the weekly chain-menu scrape, its merge into main
  // and the deploy) as its workflows report it in status.json (lib/kalori/status.ts), on BotPage: the verdict (順調 ·
  // 取得中 · 保留 · 遅れ · 不調 · まだありません; 遅れ by the phone's clock too) with 直近8週 (a cell a week; 前回 · 次回 · 品目, 不調:
  // 最後の成功) and its ⋯ (links only: 実行を開く while a run is worth a look, PRを開く while 保留, ワークフローを開く; a
  // run is started on GitHub); 確認が必要 only for what its sentence leaves out (保留: the PR to merge by hand);
  // くわしく, 前回の変更 at its bottom (ChangeBar: 追加 · 値の変更 · 終了 · 削除). No email nor issue: the card and the
  // dot are the one signal. Read while shown (useBot.svelte.ts).
  import { t } from '#lib/i18n/index.ts';
  import { minuteNow } from '#lib/time/clock.ts';
  import { alertLines, changeParts, edges, factRows, menuLinks, verdictOf, weekStrip, type KaloriStatus } from '#lib/kalori/status.ts';
  import { driver } from '#lib/kalori/bot.ts';
  import ActionSheet from '../ui/ActionSheet.svelte';
  import BotPage from './BotPage.svelte';
  import ChangeBar from './ChangeBar.svelte';
  import { useBot } from './useBot.svelte.ts';

  const bot = useBot<KaloriStatus>('kalori', driver);

  const now = $derived(minuteNow().getTime());
  const data = $derived(bot.data);
  const verdict = $derived(data && driver.verdict(data, now));
  const vid = $derived(data ? verdictOf(data, now) : undefined);
  const none = $derived(vid === 'none');
  const lines = $derived(data ? alertLines(data, now) : []);
  const links = $derived(data ? menuLinks(data, now) : []);
  const LABEL = { run: 'bots.attn.run', pr: 'bots.attn.pr', workflow: 'kalori.menu.workflow' } as const;
  let menuOpen = $state(false);
  const strip = $derived(data && { ...weekStrip(data, now), ...edges(data, now) });
  const change = $derived(data?.diff && !none ? changeParts(data.diff) : null);
</script>

<!-- 前回の変更: a row at the bottom of くわしく -->
{#snippet latestRow()}
  {#if change}<ChangeBar segs={change.parts} attr="kalori" label={change.summary} />{/if}
{/snippet}

<BotPage attr="kalori" busy={bot.poll.loading} {bot} onretry={() => void bot.poll.refresh()} {verdict} {vid}
  {now} menu={data ? { label: t('kalori.menu.label'), onopen: () => (menuOpen = true) } : null}
  attention={{ lines, links: links.filter((l) => l.id === 'pr').map((l) => ({ id: 'pr', href: l.href, label: t('bots.attn.pr') })) }}
  {strip}
  facts={data ? factRows(data, now) : []} more={change ? [{ id: 'latest', label: t('kalori.sec.latest'), n: change.parts.reduce((a, p) => a + p.n, 0), body: latestRow }] : []} />

<!-- ⋯: links only, each opening GitHub in a new tab -->
<ActionSheet name="kalori.menu" bind:open={menuOpen} title={t('kalori.menu.label')} groups={[links.map((l) => ({ id: l.id, label: t(LABEL[l.id]) }))]}
  onpick={(id) => { const l = links.find((x) => x.id === id); if (l) window.open(l.href, '_blank', 'noopener,noreferrer'); }} />
