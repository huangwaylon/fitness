<script lang="ts">
  // 設定's ジムボット level (docs/design.md "Settings"): the gym bot's health as its Worker reports it (gym/: GET
  // /status, gym/status.ts): the verdict card, the facts, 現在の設定 (📋 設定を見る's answer in the LINE group, in the
  // bot's own words: GET /gym/config with this phone's key, gym/config.ts), the recent checks and a soft footer. Both
  // fetched on open, then every minute while it's open and on screen; leaving it (‹ or ✕ unmounts it) stops that. A
  // failed fetch keeps the last answer shown (its footer says when it was) under a row with もう一度; 現在の設定 has
  // its own (the status stays), and stays out of sight while the Worker doesn't serve it (config.ts settle).
  import { untrack } from 'svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { formatSyncTime } from '#lib/i18n/format.ts';
  import { dayKey, minuteNow } from '#lib/time/clock.ts';
  import { checkLine, factRows, fetchStatus, verdictView, type GymStatus } from '#lib/gym/status.ts';
  import { fetchConfig, settle, type GymConfig } from '#lib/gym/config.ts';

  const EVERY_MS = 60_000;

  let data = $state<GymStatus | null>(null);
  let failed = $state(false);
  let loading = $state(false);
  let ctl: AbortController | null = null;
  /** 現在の設定: the last good answer; `cfgState` 'hidden' until one comes (or while the Worker won't serve it). */
  let cfg = $state<GymConfig | null>(null);
  let cfgState = $state<'hidden' | 'ok' | 'failed'>('hidden');
  let cfgLoading = $state(false);
  let cfgCtl: AbortController | null = null;

  async function loadConfig() {
    if (week.guest) return; // members only: the guest asks nothing
    cfgCtl?.abort();
    const c = (cfgCtl = new AbortController());
    cfgLoading = true;
    const r = await fetchConfig(c.signal);
    if (cfgCtl === c) cfgLoading = false;
    if (c.signal.aborted) return;
    const s = settle(cfg, r);
    [cfg, cfgState] = [s.cfg, s.state];
  }

  async function load() {
    void loadConfig();
    ctl?.abort();
    const c = (ctl = new AbortController());
    loading = true;
    try {
      data = await fetchStatus(c.signal);
      failed = false;
    } catch {
      if (!c.signal.aborted) failed = true;
    } finally {
      if (ctl === c) loading = false;
    }
  }

  $effect(() => {
    untrack(() => void load());
    const id = setInterval(() => document.hidden || void load(), EVERY_MS);
    const onVisible = () => document.hidden || void load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      ctl?.abort();
      cfgCtl?.abort();
    };
  });

  const today = $derived(dayKey(minuteNow()));
  const verdict = $derived(data && verdictView(data));
  const facts = $derived(data ? factRows(data, today) : []);
  const checks = $derived(data ? data.checks.map((c) => checkLine(c, today)) : []);
</script>

{#snippet current()}
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
{/snippet}

<div class="gym" data-gym-page aria-busy={loading} data-config={cfgLoading ? 'loading' : cfgState}>
  {#if failed}
    <div class="prow static" data-gym-error>
      <span class="prl">{t('common.loadFailed')}</span>
      <button type="button" class="btn small paper" data-sfx="tick" aria-disabled={loading} onclick={() => loading || void load()}>{t('state.retry')}</button>
    </div>
  {/if}
  {#if data && verdict}
    <div class="card verdict" data-gym-verdict={data.verdict}>
      <span class="dot {verdict.tone}" aria-hidden="true"></span>
      <div><b>{verdict.word}</b><p>{verdict.sentence}</p></div>
    </div>
    <dl class="card facts">
      {#each facts as f (f.id)}
        <div data-gym-fact={f.id}><dt>{f.label}</dt><dd>{f.value}</dd></div>
      {/each}
    </dl>
    {@render current()}
    {#if checks.length}
      <section class="sec" aria-labelledby="gym-recent">
        <h3 id="gym-recent" class="sec-label">{t('gym.recent')}</h3>
        <ol class="card checks">
          {#each checks as c, i (i)}
            <li data-gym-check={i} data-failed={c.problems.length ? '' : undefined}>
              <div class="line">
                <span class="time">{c.time}</span><span class="by">{c.by}</span>
                {#if c.idle}<span class="soft">{t('gym.idle')}</span>
                {:else}
                  {#each c.marks as m (m.id)}<span class="mark" class:bad={!m.ok} data-ok={m.ok}>{m.name} {m.ok ? '○' : '✕'}</span>{/each}
                  <span class="open">{c.open}</span>
                {/if}
              </div>
              {#each c.problems as p, j (j)}<small>{p}</small>{/each}
            </li>
          {/each}
        </ol>
      </section>
    {/if}
    <p class="foot" data-gym-foot>{[data.mode, data.sha?.slice(0, 7), t('gym.updated', { time: formatSyncTime(new Date(data.now), today) })].filter(Boolean).join(' · ')}</p>
  {:else if !failed}
    {#each [0, 1, 2] as i (i)}<div class="card skel" data-gym-skeleton aria-hidden="true"><span></span></div>{/each}
  {:else}
    {@render current()}
  {/if}
</div>

<style>
  .gym { display: flex; flex-direction: column; gap: 14px; }
  .card { margin: 0; padding: 12px 14px; border-radius: var(--r-card); background: var(--card); box-shadow: var(--sh-lip); }
  .sec { display: grid; gap: 8px; }

  .verdict { display: flex; align-items: flex-start; gap: 12px; }
  .verdict b { font-size: var(--fs-title); line-height: 1.3; }
  .verdict p { margin: 2px 0 0; font-size: var(--fs-body); line-height: var(--lh); color: var(--text-soft); font-weight: 700; }
  .dot { flex: none; width: 14px; height: 14px; margin-top: 5px; border-radius: 50%; box-shadow: 0 0 0 2px var(--card), 0 0 0 3px var(--edge); }
  .dot.good { background: var(--c-leaf); }
  .dot.warn { background: var(--c-yuzu); }
  .dot.bad { background: var(--c-coral); }
  .dot.idle { background: var(--ctl-off); }

  .facts { display: grid; gap: 8px; }
  .facts div { display: flex; justify-content: space-between; gap: 12px; font-size: var(--fs-body); }
  .facts dt { color: var(--text-soft); font-weight: 700; }
  .facts dd { margin: 0; font-weight: 700; text-align: right; font-variant-numeric: tabular-nums; }

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

  .checks { list-style: none; display: grid; gap: 8px; }
  .checks li + li { padding-top: 8px; border-top: 1px dashed color-mix(in srgb, var(--text-soft) 40%, transparent); }
  .line { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font-size: var(--fs-s); font-weight: 700; }
  .time { font-size: var(--fs-body); font-variant-numeric: tabular-nums; }
  .by, .soft { color: var(--text-soft); }
  .mark.bad, small { color: var(--coral-text); }
  .open { margin-left: auto; }
  small { display: block; margin-top: 2px; font-size: var(--fs-s); font-weight: 700; }

  .foot { margin: 0 4px; text-align: center; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; }

  .skel { height: 52px; display: flex; align-items: center; }
  .skel span { width: 60%; height: 12px; border-radius: 6px; background: var(--ctl-off); animation: pulse 1.2s ease-in-out infinite alternate; }
  @keyframes pulse { from { opacity: .45; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .skel span { animation: none; } }
</style>
