<script lang="ts">
  // ききみみ's せってい › マイク (docs/kikimimi-mic.md "Where they show", "The privacy rule"): 「マイクを使う」 (off by default; turning it on asks the
  // permission first), kept on this phone (DEVICE.mic). On: the rule (nothing kept or sent, earphones), 「マイクのチェック」
  // (a take through MicButton, only its length shown), 「音声認識」 (自動 / このiPhone / Safari / サーバー, each with its
  // disclosure; one that can't run here is off), the model's download with progress when whisper is the one, and
  // 「音声認識データを削除」 whenever it's on the phone. Under it, small, the probe's row (M0's 「マイク診断（テスト）」).
  import { onMount } from 'svelte';
  import '#lib/i18n/kiki-mic.ts';
  import { t } from '#lib/i18n/index.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { localKV } from '#lib/sync/storage.ts';
  import { CHOICES, keepMic, pickBackend, readMic, type Can, type Choice, type MicPrefs } from '#lib/mic/pick.ts';
  import type { Allowed } from '#lib/mic/capture.ts';
  import { deleteWhisper, downloadWhisper, whisperCached, whisperServed } from '#lib/mic/backends/whisper.ts';
  import { relayReady } from '#lib/mic/backends/relay.ts';
  import { sttMB } from '#lib/mic/models.ts';
  import type { Got } from '#lib/mic/session.ts';
  import { deniedKey, micReturn, retryMic } from '#lib/mic/retry.ts';
  import { reloadNow } from '#lib/ui-state/reload.ts';
  import { isStandalone } from '#lib/ui-state/standalone.ts';
  import { log } from '#lib/sync/log.ts';
  import MicButton from './MicButton.svelte';

  let { onprobe }: { onprobe: () => void } = $props();

  let prefs = $state<MicPrefs>(readMic(localKV()));
  let asking = $state(false);
  let refused = $state<Exclude<Allowed, 'granted'> | null>(null);
  /** The model: being looked for, not served, ready to download, downloading, on the phone, failed. */
  let model = $state<'check' | 'none' | 'ready' | 'dl' | 'have' | 'fail'>('check');
  let got = $state(0), of = $state(0);
  let deleted = $state(false);
  let heard = $state<Got | null | undefined>(undefined);
  const can = $derived<Can>({
    whisper: model === 'ready' || model === 'have' || model === 'dl' || model === 'fail',
    webkit: typeof window !== 'undefined' && 'webkitSpeechRecognition' in window,
    relay: relayReady()
  });
  const be = $derived(pickBackend(prefs.be, can));
  const mb = (n: number) => Math.round(n / 1e5) / 10;

  // the mic core fetched ahead (the switch's permission ask, the check), kept so the tap asks before any await
  let mic: typeof import('#lib/mic/session.ts') | null = null;
  const core = () => import('#lib/mic/session.ts').then((m) => (mic = m));
  /** Back from a refusal's 「もう一度試す」 (its reload): the switch's next tap asks afresh. */
  const retried = micReturn({ take: true }) === 'optin';
  const pwa = isStandalone();
  let sec = $state<HTMLElement>();
  onMount(() => {
    void (lookModel(), core());
    if (retried) sec?.scrollIntoView({ block: 'center' });
  });
  const retry = () => retryMic('optin', { reload: () => reloadNow('mic') });

  async function lookModel() {
    model = (await whisperCached()) ? 'have' : (await whisperServed()) ? 'ready' : 'none';
  }
  function keep(p: MicPrefs) {
    prefs = p;
    keepMic(localKV(), p);
  }
  async function toggle() {
    if (asking) return;
    if (prefs.on) {
      cue('toggle-off');
      heard = undefined;
      return keep({ ...prefs, on: false });
    }
    // the permission asked first, inside the tap (an await before it may lose the tap: WebKit then refuses unasked)
    const t0 = performance.now(), ask = mic ? mic.micAllowed() : core().then((m) => m.micAllowed());
    asking = true;
    refused = null;
    const a = await ask;
    asking = false;
    log('mic.perm', { st: a, ms: Math.round(performance.now() - t0), at: 'optin', retry: retried, pwa });
    if (a !== 'granted') {
      refused = a;
      return cue('boop');
    }
    cue('toggle-on');
    keep({ ...prefs, on: true });
  }
  function choose(c: Choice) {
    if (c !== prefs.be) keep({ ...prefs, be: c });
  }
  async function download() {
    if (model === 'dl') return;
    model = 'dl';
    got = of = 0;
    deleted = false;
    try {
      await downloadWhisper((g, o) => ((got = g), (of = o)));
      model = 'have';
    } catch {
      model = 'fail';
    }
  }
  async function del() {
    await deleteWhisper();
    deleted = true;
    await lookModel();
  }
</script>

<section class="sec" aria-labelledby="kk-mic" data-mic-optin data-mic-on={prefs.on ? 1 : 0} bind:this={sec}>
  <h3 id="kk-mic" class="sec-label">{t('kiki.mic.title')}</h3>
  <button type="button" class="prow" role="switch" aria-checked={prefs.on} data-mic-switch data-sfx="self" aria-disabled={asking} onclick={toggle}>
    <span class="prl">🎤 {t('kiki.mic.use')}<small>{asking ? t('kiki.mic.asking') : t('kiki.mic.useSub')}</small></span>
    <span class="sw" aria-hidden="true"><i></i></span>
  </button>
  {#if refused}<p class="hint warn" role="alert" data-mic-refused={refused}>{refused === 'denied' ? t(deniedKey(pwa, retried)) : t('kiki.mic.unsupported')}</p>
  {:else if retried && !prefs.on}<p class="hint" role="status" data-mic-retried>{t('kiki.mic.retried')}</p>{/if}
  {#if refused === 'denied'}<button type="button" class="btn small" data-mic-retry data-sfx="confirm" onclick={retry}>↻ {t('kiki.mic.retry')}</button>{/if}

  {#if prefs.on}
    <p class="hint">🔒 {t('kiki.mic.rule')}</p>
    <div class="card box check">
      <h4>{t('kiki.mic.check')}</h4>
      <p class="soft">{t('kiki.mic.check.how')}</p>
      <MicButton onheard={(g) => (heard = g)} onretry={retry} />
      {#if heard !== undefined}
        <p class="res" role="status" data-mic-heard={heard ? 'yes' : 'no'}>{heard ? `✓ ${t('kiki.mic.check.heard', { s: Math.round(heard.s * 10) / 10 })}` : t('kiki.mic.check.none')}</p>
      {/if}
    </div>

    <h4 id="kk-stt" class="sec-label">{t('kiki.mic.stt')}</h4>
    <div class="chips" role="radiogroup" aria-labelledby="kk-stt" data-mic-be={prefs.be} data-mic-uses={be ?? 'none'}>
      {#each CHOICES as c (c)}
        <button type="button" class="chip big" role="radio" aria-checked={prefs.be === c} data-be={c} data-sfx={prefs.be === c ? 'none' : 'tick'}
          onclick={() => choose(c)}>{t(`kiki.mic.be.${c}`)}</button>
      {/each}
    </div>
    <p class="hint" data-mic-disclose={prefs.be}>{t(`kiki.mic.be.${prefs.be}.say`)}{#if prefs.be !== 'auto' && !be}<br /><span class="warn">{t('kiki.mic.be.cant')}</span>{/if}</p>

    {#if prefs.be === 'auto' || prefs.be === 'whisper'}
      <div class="card box" data-mic-model={model}>
        <h4>{t('kiki.mic.model')}</h4>
        {#if model === 'check'}<p class="soft" role="status">{t('kiki.mic.working')}</p>
        {:else if model === 'none'}<p class="soft">{t('kiki.mic.whisper.none')}</p>
        {:else if model === 'have'}<p class="soft">✓ {t('kiki.mic.model.have', { mb: sttMB() })}</p>
        {:else if model === 'dl'}
          <p class="soft" role="status">{t('kiki.mic.whisper.got', { got: mb(got), of: of ? mb(of) : sttMB() })}</p>
          <progress max={of || 1} value={got}></progress>
        {:else}
          <p class="soft">{t('kiki.mic.model.how', { mb: sttMB() })}</p>
          {#if model === 'fail'}<p class="soft warn" role="alert">{t('kiki.mic.model.fail')}</p>{/if}
          <button type="button" class="btn small" data-mic-dl data-sfx="confirm" onclick={download}>⬇ {t('kiki.mic.whisper.start')}</button>
        {/if}
      </div>
    {/if}
  {/if}

  {#if model === 'have'}
    <button type="button" class="btn paper small del" data-mic-del data-sfx="confirm" onclick={del}>🗑 {t('kiki.mic.del', { mb: sttMB() })}</button>
  {:else if deleted}<p class="hint" role="status" data-mic-deleted>{t('kiki.mic.deleted')}</p>{/if}

  <button type="button" class="prow probe" data-kiki-set-mic data-sfx="confirm" onclick={onprobe}>
    <span class="prl">{t('kiki.mic.probe')}<small>{t('kiki.mic.probeSub')}</small></span>
    <span class="chev" aria-hidden="true">›</span>
  </button>
</section>

<style>
  .sec { display: grid; gap: 8px; }
  .box { display: grid; gap: 8px; padding: 14px; }
  .box h4 { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .box p { margin: 0; }
  .check { justify-items: stretch; }
  .soft { font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .res { font: 700 var(--fs-body)/1.4 var(--font-ui); text-align: center; }
  .hint { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .warn, .hint.warn { color: var(--coral-text); }
  .chips .chip { flex: 1 1 auto; padding: 0 6px; white-space: nowrap; } /* (このiPhone on one line) */
  .btn.small { justify-self: start; }
  .btn.small.del { width: 100%; }
  progress { width: 100%; height: 8px; accent-color: var(--c-leaf); }
  .prow.probe { min-height: 48px; padding: 6px 12px; }
  .probe .prl { font-size: var(--fs-s); }
  .chev { flex: none; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--text-soft); }
</style>
