<script lang="ts">
  // ボット's ジム tab (docs/design.md "Bots"): on top 現在の設定 (📋 設定を見る's answer in the LINE group, in the bot's own
  // words: GET /gym/config with this phone's key, gym/config.ts; the gym's settings will go there too), and at the foot,
  // quiet, 動作状況: the gym bot's health as its Worker reports it (GET /status, gym/status.ts): the verdict (compact),
  // 直近12時間 (a cell a check interval, the shared strip: StatusStrip), the facts (くわしく folds the rest) and the
  // foot — 保養所's look (VerdictCard, StatusStrip, FactList, Skeleton). Both read on open, then every minute while it's
  // shown (poll.svelte.ts; each read sets the tab's dot: open.svelte.ts); leaving it (the other tab or ✕ unmounts it)
  // stops that. The last status read shows at once, marked 更新中 (lastKnown.ts). A failed read keeps the last answer
  // shown (its foot says when it was) under a row with もう一度; 現在の設定 has its own (the status stays), and stays out of
  // sight while the Worker doesn't serve it (config.ts settle).
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { checkStrip, factRows, fetchStatus, needsAttention, parseStatus, verdictView, type GymStatus } from '#lib/gym/status.ts';
  import { fetchConfig, settle, type GymConfig } from '#lib/gym/config.ts';
  import { setBadge } from './open.svelte.ts';
  import VerdictCard from './VerdictCard.svelte';
  import StatusStrip from './StatusStrip.svelte';
  import FactList from './FactList.svelte';
  import Skeleton from './Skeleton.svelte';
  import { statusPoll } from './poll.svelte.ts';
  import { recall, remember } from './lastKnown.ts';

  const EVERY_MS = 60_000;

  /** The status shown: the last read (the one kept from before until this page's first answer: `fresh` false). */
  let data = $state<GymStatus | null>(recall('gym', parseStatus));
  let fresh = $state(false);
  let failed = $state(false);
  /** 現在の設定: the last good answer; `cfgState` 'hidden' until one comes (or while the Worker won't serve it). */
  let cfg = $state<GymConfig | null>(null);
  let cfgState = $state<'hidden' | 'ok' | 'failed'>('hidden');
  let cfgLoading = $state(false);
  let cfgCtl: AbortController | null = null;

  async function loadConfig() {
    if (week.guest) return; // members only: the guest asks nothing
    cfgCtl?.abort();
    const c = (cfgCtl = new AbortController());
    const signal = AbortSignal.any([c.signal, poll.life]);
    cfgLoading = true;
    const r = await fetchConfig(signal);
    if (cfgCtl === c) cfgLoading = false;
    if (signal.aborted) return;
    const s = settle(cfg, r);
    [cfg, cfgState] = [s.cfg, s.state];
  }

  const poll = statusPoll(async (signal) => {
    void loadConfig();
    const r = await fetchStatus(signal);
    if (signal.aborted) return;
    failed = !r.ok;
    if (!r.ok) return;
    [data, fresh] = [r.status, true];
    remember('gym', r.status);
    setBadge('gym', needsAttention(r.status));
  }, () => EVERY_MS);

  const today = $derived(dayKey(minuteNow()));
  const verdict = $derived(data && verdictView(data));
  const facts = $derived(data ? factRows(data, today) : []);
  const strip = $derived(data && checkStrip(data));
  const legend = { ok: t('gym.strip.legend.ok'), avail: t('gym.strip.legend.avail'), fail: t('gym.strip.legend.fail'), none: t('gym.strip.legend.none') };
</script>

<div class="gym" data-gym-page aria-busy={poll.loading} data-config={cfgLoading ? 'loading' : cfgState}>
  {#if cfgState !== 'hidden'}
    <section class="sec" aria-labelledby="gym-config" data-gym-config>
      <h3 id="gym-config" class="sec-label">{t('gym.config')}</h3>
      {#if cfgState === 'failed'}
        <div class="prow static" data-gym-config-error>
          <span class="prl">{t('gym.configFailed')}</span>
          <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={cfgLoading} onclick={() => cfgLoading || void loadConfig()}>{t('state.retry')}</button>
        </div>
      {/if}
      {#if cfg}
        <div class="card config">
          <b class="ctitle">{cfg.title}</b>
          <dl class="days">
            {#each cfg.days as d (d.day)}
              <div data-gym-day={d.day} class:soft={d.soft}><dt>{d.date}</dt><dd>{d.rule}{#if d.from}<small>{d.from}</small>{/if}</dd></div>
            {/each}
          </dl>
          {#if cfg.notice}<p class="notice" data-gym-notice>{cfg.notice}</p>{/if}
          <p class="cline" data-gym-config-check data-paused={cfg.paused ? '' : undefined}>{cfg.check}</p>
        </div>
      {/if}
    </section>
  {/if}

  <section class="sec status" aria-labelledby="gym-status" data-gym-status>
    <h3 id="gym-status" class="sec-label">{t('gym.status')}</h3>
    {#if failed}
      <div class="prow static" data-gym-error>
        <span class="prl">{t('common.loadFailed')}</span>
        <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={poll.loading} onclick={() => poll.loading || void poll.refresh()}>{t('state.retry')}</button>
      </div>
    {/if}
    {#if data && verdict && strip}
      <VerdictCard tone={verdict.tone} word={verdict.word} sentence={verdict.sentence} attr={{ 'data-gym-verdict': data.verdict }} stale={!fresh && poll.loading} compact />
      <div class="card">
        <StatusStrip cells={strip.cells} ticks={strip.ticks} title={t('gym.strip.title')} {legend} summary={strip.summary} hint={t('gym.strip.pick')} attr="gym" />
        <FactList {facts} more={t('gym.more')} attr="gym" />
      </div>
      <p class="foot" data-gym-foot>{[data.mode, data.sha?.slice(0, 7), t('gym.updated', { time: formatSyncTime(new Date(data.now), today) })].filter(Boolean).join(' · ')}</p>
    {:else if !failed}
      <Skeleton attr="gym" />
    {/if}
  </section>
</div>

<style>
  .gym { display: flex; flex-direction: column; gap: 14px; }
  .card { margin: 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .sec { display: grid; gap: 8px; }
  /* 動作状況: the page's foot (its top is the settings'), set apart a little */
  .status { margin-top: 6px; }

  .config { display: grid; gap: 8px; }
  .ctitle { font-size: var(--fs-body); }
  .days { margin: 0; display: grid; gap: 6px; }
  .days div { display: flex; gap: 12px; font-size: var(--fs-body); font-weight: 700; }
  .days dt { flex: none; min-width: 5.5em; font-variant-numeric: tabular-nums; }
  .days dd { margin: 0; min-width: 0; overflow-wrap: anywhere; }
  .days dd small { display: block; font-size: var(--fs-s); color: var(--text-soft); }
  .days .soft dd { color: var(--text-soft); }
  .notice { margin: 0; font-size: var(--fs-s); font-weight: 700; color: var(--coral-text); }
  .cline { margin: 0; padding-top: 8px; border-top: 1px dashed color-mix(in srgb, var(--text-soft) 40%, transparent); font-size: var(--fs-s); font-weight: 700; color: var(--text-soft); }

  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; line-height: var(--lh); }
</style>
