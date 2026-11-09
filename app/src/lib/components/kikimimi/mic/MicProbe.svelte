<script lang="ts">
  // せってい's 「マイク診断（テスト）」 (docs/kikimimi-mic.md "The probe"): the probe, a screen a step, each with one button,
  // 「スキップ」 and a plain result line. 1 the page's capabilities; 2 the permission (2b, after a reopen: was it asked
  // again?); 3 play and record per earphone route (bleed with echo cancellation on and off, a click's round trip, the
  // user's rating); 4 whisper on this phone (the download on a tap, with progress; its load on WebGPU, then on the WASM
  // runtime, each timed on our 3 clips' PCM; the 3 sentences read aloud on the faster); 5 Safari's recogniser and 6 the
  // relay's, each on the
  // 3 sentences read aloud, the WER computed here; 7 the results on screen and 「結果を送信」: the `mic.*` events
  // (numbers and closed sets) through the log. The heard text shows on screen only; the takes live in memory for
  // their step. Its own chunk.
  import { onDestroy } from 'svelte';
  import '#lib/i18n/kiki-mic.ts';
  import { t } from '#lib/i18n/index.ts';
  import { flushLog, log } from '#lib/sync/log.ts';
  import { ladders, load } from '#lib/kikimimi/pool.ts';
  import { clipAt } from '#lib/kikimimi/clips.ts';
  import { packs } from '../packs.ts';
  import type { LogEventName } from '#lib/contract/log.ts';
  import { wer } from '#lib/mic/match.ts';
  import { SENTENCES, to16k, wav16k, werPct, type Ear, type Loud } from '#lib/mic/probe/steps.ts';
  import { downloadWhisper, openWhisper, whisperServed, type Device, type Whisper } from '#lib/mic/backends/whisper.ts';
  import { WHISPER, sttMB } from '#lib/mic/models.ts';
  import {
    askMic, builtinMic, closeProbe, decode, duplex, openProbe, openRec, permState, playBuf, probeCtx, probeEnv, relayOnce,
    takeSpeech, webkitOnce, type Heard
  } from '#lib/mic/probe/run.ts';
  import { relayReady } from '#lib/mic/backends/relay.ts';

  let { onback }: { onback: () => void } = $props();

  /** A probe sentence's clip (the ladders' chunk, its pack), decoded on the probe's context; null offline. */
  async function clipBuffer(id: string): Promise<AudioBuffer | null> {
    await load('ladder');
    const at = clipAt(id);
    return decode(at ? await packs.bytes(at) : null);
  }

  /** Set once the mic was granted here: the next open offers 2b. Numbers only. */
  const MARK = 'island.micProbe';
  const STEPS = ['env', 'perm', 'duplex', 'whisper', 'webkit', 'relay'] as const;
  type Phase = 'intro' | 'again' | (typeof STEPS)[number] | 'result';
  const EARS: readonly Ear[] = ['none', 'wired', 'bluetooth'];
  const LOUD: readonly Loud[] = ['none', 'quiet', 'ok'];

  let phase = $state<Phase>('intro');
  let busy = $state(false);
  const before = (() => { try { return !!localStorage.getItem(MARK); } catch { return false; } })();
  /** What goes to the log on 「結果を送信」. */
  const events: [LogEventName, Record<string, unknown>][] = [];
  const keep = (e: LogEventName, d: Record<string, unknown>) => void events.push([e, d]);

  // the results on screen
  let env = $state<Awaited<ReturnType<typeof probeEnv>> | null>(null);
  let perm = $state<Awaited<ReturnType<typeof askMic>> | null>(null);
  let againStep = $state<'open' | 'ask'>('open');
  let ear = $state(0);
  let earStep = $state<'ready' | 'measuring' | 'rate'>('ready');
  let earRows = $state<Partial<Record<Ear, { bleed: number; loud?: Loud } | 'skipped' | 'fail'>>>({});
  let measured: Awaited<ReturnType<typeof duplex>> & { pick?: boolean } = { rows: [] };
  let sent = $state<'no' | 'yes' | 'queued'>('no');

  /** The 3 sentences (the ladders' chunk), with their Japanese. */
  let lines = $state<{ clip: string; en: string; ja: string }[]>([]);
  let said = $state(0);
  let sayStep = $state<'ready' | 'listening' | 'sending' | 'done'>('ready');
  let last = $state<{ pct?: number; text?: string; err?: string } | null>(null);
  let stopTake: (() => void) | null = null;
  /** The probe was left (a take that opens after it is let go at once). */
  let gone = false;
  openProbe();
  /** The relay take's length so far (s). */
  let recS = $state(0);
  let stt = $state<Partial<Record<'whisper' | 'webkit' | 'relay', { pct: number; s: number }[]>>>({});

  /** Step 4: is the model served, its download, the loads and our clips per device, then the sentences spoken. */
  let wStep = $state<'check' | 'none' | 'ready' | 'dl' | 'load' | 'fail' | 'say'>('check');
  let wGot = $state(0), wOf = $state(0), wClip = $state(0);
  let wDev = $state<Device>('wasm');
  let wClips = $state<{ pct: number; s: number } | null>(null);
  let whisper: Whisper | null = null;
  const beOf = (d: Device) => (d === 'webgpu' ? 'whisper-gpu' : 'whisper-wasm');
  const devName = (d: Device) => (d === 'webgpu' ? 'WebGPU' : 'WASM');
  const mb = (n: number) => Math.round(n / 1e5) / 10;
  const s1 = (ms: number) => Math.round(ms / 100) / 10;

  const stepN = $derived((STEPS as readonly string[]).indexOf(phase) + 1);

  async function go(p: Phase) {
    phase = p;
    said = 0;
    sayStep = 'ready';
    last = null;
    if (p === 'env') {
      busy = true;
      env = await probeEnv();
      keep('mic.env', env);
      busy = false;
    }
    if (p !== 'whisper') {
      whisper?.dispose();
      whisper = null;
    }
    if ((p === 'whisper' || p === 'webkit' || p === 'relay') && !lines.length) {
      await load('ladder');
      const all = ladders();
      lines = SENTENCES.map((s) => ({ clip: s.clip, en: all.find((l) => l.id === s.ladder)?.line.en ?? '', ja: all.find((l) => l.id === s.ladder)?.line.ja ?? '' }));
    }
    if (p === 'whisper') {
      wStep = 'check';
      wStep = (await whisperServed()) ? 'ready' : 'none';
    }
  }
  const next = () => go(phase === 'intro' ? 'env' : phase === 'relay' ? 'result' : STEPS[STEPS.indexOf(phase as (typeof STEPS)[number]) + 1]);

  async function allow() {
    busy = true;
    const st0 = await permState();
    perm = await askMic();
    keep('mic.perm', { st: perm.st, ms: perm.ms, again: before, asked: st0 === 'prompt', ec: perm.ec, sr: perm.sr, inp: perm.inp });
    if (perm.st === 'granted') try { localStorage.setItem(MARK, '1'); } catch { /* private mode */ }
    busy = false;
  }

  async function againOpen() {
    busy = true;
    perm = await askMic();
    againStep = 'ask';
    busy = false;
  }
  function againAnswer(asked: boolean) {
    keep('mic.perm', { st: perm!.st, ms: perm!.ms, again: true, asked, ec: perm!.ec, sr: perm!.sr, inp: perm!.inp });
    void go('result');
  }

  async function measure() {
    busy = true;
    earStep = 'measuring';
    const e = EARS[ear];
    try {
      probeCtx();
      const clip = await clipBuffer(SENTENCES[0].clip);
      if (!clip) throw new Error('noclip');
      measured = await duplex(clip, { click: e === 'none' });
      if (e === 'bluetooth') {
        const id = await builtinMic();
        const r = id ? await openRec({ aec: true, deviceId: id }).catch(() => null) : null;
        measured.pick = r?.inp === 'builtin';
        r?.stop();
      }
      earStep = 'rate';
    } catch (x) {
      keep('mic.duplex', { ear: e, err: x instanceof Error ? (x.message === 'noclip' ? 'noclip' : x.name) : 'Error' });
      earRows[e] = 'fail';
      nextEar();
    }
    busy = false;
  }
  function rate(loud: Loud) {
    const e = EARS[ear];
    for (const r of measured.rows) keep('mic.duplex', { ear: e, aec: r.aec, bleed: r.bleed, rtl: r.rtl, loud, pick: measured.pick, restored: measured.restored });
    earRows[e] = { bleed: measured.rows[0]?.bleed ?? 0, loud };
    nextEar();
  }
  function noEar() {
    earRows[EARS[ear]] = 'skipped';
    nextEar();
  }
  function nextEar() {
    earStep = 'ready';
    if (ear < EARS.length - 1) ear++;
    else void go('whisper');
  }

  /** Step 4 on the tap: the download (progress), then per device (WebGPU when a Worker has it, then WASM) its load and
   *  our 3 clips' PCM transcribed (decoded only, never played), the WER against their English; the faster stays
   *  loaded for the sentences spoken. */
  async function startWhisper() {
    busy = true;
    wStep = 'dl';
    const t0 = performance.now(), model = WHISPER.model;
    try {
      const got = await downloadWhisper((g, of) => ((wGot = g), (wOf = of)));
      keep('mic.stt', { be: 'whisper-wasm', model, step: 'dl', ms: Math.round(performance.now() - t0), mb: mb(got), ok: true });
    } catch {
      keep('mic.stt', { be: 'whisper-wasm', model, step: 'dl', ms: Math.round(performance.now() - t0), ok: false, err: 'network' });
      wStep = 'fail';
      busy = false;
      return;
    }
    wStep = 'load';
    const pcm = await Promise.all(SENTENCES.map(async (s) => {
      const b = await clipBuffer(s.clip);
      return b ? to16k(b.getChannelData(0), b.sampleRate) : null;
    }));
    const w = (whisper = openWhisper());
    let best: { dev: Device; ms: number; pct: number } | null = null;
    for (const dev of (env?.gpuW ? ['webgpu', 'wasm'] : ['wasm']) as Device[]) {
      wDev = dev;
      wClip = 0;
      const be = beOf(dev), l = await w.load(dev);
      keep('mic.stt', l.ok ? { be, model, step: 'load', ms: l.ms, ok: true } : { be, model, step: 'load', ok: false, err: l.err });
      if (!l.ok) continue;
      const ms: number[] = [], pcts: number[] = [];
      for (let i = 0; i < pcm.length; i++) {
        const x = pcm[i];
        wClip = i + 1;
        if (!x) continue;
        const audS = Math.round(x.length / 1600) / 10, r = await w.run(x.slice());
        if (!r.ok) {
          keep('mic.stt', { be, model, step: 'clip', audS, ok: false, err: r.err });
          continue;
        }
        const pct = werPct(wer(lines[i].en, r.text ?? ''));
        keep('mic.stt', { be, model, step: 'clip', ms: r.ms, audS, wer: pct, ok: true });
        ms.push(r.ms);
        pcts.push(Math.max(0, 100 - pct));
      }
      const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
      if (ms.length && (!best || mean(ms) < best.ms)) best = { dev, ms: mean(ms), pct: Math.round(mean(pcts)) };
    }
    if (!best || (best.dev !== wDev && !(await w.load(best.dev)).ok)) {
      wStep = 'fail';
      busy = false;
      return;
    }
    wDev = best.dev;
    wClips = { pct: best.pct, s: s1(best.ms) };
    wStep = 'say';
    busy = false;
  }

  /** A take through the loaded whisper (16 kHz). */
  async function whisperOnce(x: Float32Array, sr: number): Promise<Heard> {
    const y = to16k(x, sr), r = whisper ? await whisper.run(y) : null;
    if (!r?.ok) return { err: r ? r.err : 'other' };
    return { text: r.text ?? '', ms: r.ms, audS: Math.round(y.length / 1600) / 10 };
  }

  const hear = async () => {
    const b = await clipBuffer(lines[said].clip);
    if (b) await playBuf(b);
  };

  /** One sentence read aloud through the step's recogniser: its WER here, its numbers kept, the text shown only. */
  async function talk() {
    const be = phase as 'whisper' | 'webkit' | 'relay';
    probeCtx();
    sayStep = 'listening';
    let h: Heard;
    if (be === 'webkit') h = await webkitOnce(said === 0);
    else {
      recS = 0;
      const take = await takeSpeech((s) => (recS = s)).catch(() => null);
      if (!take) h = { err: 'audio-capture' };
      else {
        stopTake = take.stop;
        // left while the mic was opening: let it go at once
        if (gone) take.stop();
        const { x, sr } = await take.done;
        stopTake = null;
        sayStep = 'sending';
        h = be === 'relay' ? await relayOnce(wav16k(x, sr)) : await whisperOnce(x, sr);
      }
    }
    const model = be === 'relay' ? 'turbo' : be === 'whisper' ? WHISPER.model : 'none', ev = be === 'whisper' ? beOf(wDev) : be;
    if ('err' in h) {
      keep('mic.stt', { be: ev, model, step: 'spoken', ok: false, err: h.err });
      last = { err: h.err };
    } else {
      const pct = werPct(wer(lines[said].en, h.text));
      keep('mic.stt', { be: ev, model, step: 'spoken', ms: h.ms, audS: h.audS, wer: pct, ok: true });
      stt[be] = [...(stt[be] ?? []), { pct: Math.max(0, Math.round(100 - pct)), s: Math.round(h.ms / 100) / 10 }];
      last = { pct: Math.max(0, Math.round(100 - pct)), text: h.text };
    }
    sayStep = 'done';
  }
  function nextLine() {
    last = null;
    sayStep = 'ready';
    if (said < lines.length - 1) said++;
    else next();
  }

  async function send() {
    busy = true;
    for (const [e, d] of events) log(e, d);
    sent = (await flushLog()) ? 'yes' : 'queued';
    busy = false;
  }

  const yn = (b: boolean | undefined) => t(b ? 'kiki.mic.yes' : 'kiki.mic.no');
  const sttLine = (rows: { pct: number; s: number }[] | undefined) => rows?.length
    ? t('kiki.mic.row.stt', { pct: Math.round(rows.reduce((a, r) => a + r.pct, 0) / rows.length), s: Math.round((rows.reduce((a, r) => a + r.s, 0) / rows.length) * 10) / 10 })
    : t('kiki.mic.result.skipped');
  const earLine = (r: (typeof earRows)[Ear]) => !r || r === 'skipped' ? t('kiki.mic.result.skipped') : r === 'fail' ? t('kiki.mic.duplex.fail')
    : t('kiki.mic.row.duplex', { bleed: r.bleed, loud: r.loud ? t(`kiki.mic.loud.${r.loud}`) : '' });

  onDestroy(() => {
    gone = true;
    stopTake?.();
    whisper?.dispose();
    closeProbe();
  });
</script>

<div class="probe" data-mic-probe data-mic-phase={phase}>
  {#if phase !== 'intro' && phase !== 'result' && phase !== 'again'}
    <p class="of">{t('kiki.mic.stepOf', { n: stepN, of: STEPS.length })}</p>
  {/if}

  {#if phase === 'intro'}
    <div class="card box">
      <h3>{t('kiki.mic.probe')}</h3>
      <p>{t('kiki.mic.intro')}</p>
      <p class="soft">🔒 {t('kiki.mic.privacy')}</p>
    </div>
    {#if before}
      <p class="soft">{t('kiki.mic.againIntro')}</p>
      <button type="button" class="btn" data-mic-again-start data-sfx="confirm" onclick={() => go('again')}>{t('kiki.mic.againStart')}</button>
      <button type="button" class="btn paper" data-mic-start data-sfx="tick" onclick={next}>{t('kiki.mic.restart')}</button>
    {:else}
      <button type="button" class="btn" data-mic-start data-sfx="confirm" onclick={next}>{t('kiki.mic.start')}</button>
    {/if}
    <button type="button" class="btn paper" data-mic-back data-sfx="back" onclick={onback}>{t('kiki.mic.back')}</button>

  {:else if phase === 'env'}
    <div class="card box">
      <h3>{t('kiki.mic.env')}</h3>
      {#if !env}<p role="status">{t('kiki.mic.working')}</p>
      {:else}
        <ul class="facts" data-mic-env>
          <li>{t('kiki.mic.env.pwa')}<b>{yn(env.pwa)}</b></li>
          <li>{t('kiki.mic.env.gpu')}<b>{yn(env.gpu)}</b></li>
          <li>{t('kiki.mic.env.wks')}<b>{yn(env.wks)}</b></li>
        </ul>
      {/if}
    </div>
    {#if env}<button type="button" class="btn" data-mic-next data-sfx="tick" onclick={next}>{t('kiki.mic.next')}</button>{/if}

  {:else if phase === 'perm'}
    <div class="card box">
      <h3>{t('kiki.mic.perm')}</h3>
      {#if !perm}<p>{t('kiki.mic.perm.how')}</p>
      {:else}<p class="res" data-mic-perm={perm.st}>{perm.st === 'granted' ? `✓ ${t('kiki.mic.perm.granted')}` : t('kiki.mic.perm.denied')}</p>{/if}
    </div>
    {#if !perm}
      <button type="button" class="btn" data-mic-allow data-sfx="confirm" aria-disabled={busy} onclick={() => !busy && allow()}>🎤 {t('kiki.mic.perm.ask')}</button>
      <button type="button" data-sfx="tick" class="btn paper" data-mic-skip onclick={next}>{t('kiki.mic.skip')}</button>
    {:else}
      <button type="button" data-sfx="tick" class="btn" data-mic-next onclick={() => go(perm?.st === 'granted' ? 'duplex' : 'result')}>{t('kiki.mic.next')}</button>
    {/if}

  {:else if phase === 'again'}
    <div class="card box">
      <h3>{t('kiki.mic.again')}</h3>
      <p>{againStep === 'open' ? t('kiki.mic.again.how') : t('kiki.mic.again.q')}</p>
    </div>
    {#if againStep === 'open'}
      <button type="button" class="btn" data-mic-again-open data-sfx="confirm" aria-disabled={busy} onclick={() => !busy && againOpen()}>🎤 {t('kiki.mic.again.open')}</button>
    {:else}
      <div class="row2">
        <button type="button" data-sfx="tick" class="btn paper" data-mic-asked="1" onclick={() => againAnswer(true)}>{t('kiki.mic.again.asked')}</button>
        <button type="button" data-sfx="tick" class="btn paper" data-mic-asked="0" onclick={() => againAnswer(false)}>{t('kiki.mic.again.notAsked')}</button>
      </div>
    {/if}

  {:else if phase === 'duplex'}
    <div class="card box" data-mic-ear={EARS[ear]}>
      <h3>{t('kiki.mic.duplex')}・{t(`kiki.mic.row.${EARS[ear] === 'none' ? 'speaker' : EARS[ear]}`)}</h3>
      {#if earStep === 'ready'}<p>{t(`kiki.mic.duplex.${EARS[ear]}`)}</p>
      {:else if earStep === 'measuring'}<p role="status">🎧 {t('kiki.mic.working')}</p>
      {:else}<p>{t('kiki.mic.duplex.q')}</p>{/if}
    </div>
    {#if earStep === 'ready'}
      <button type="button" class="btn" data-mic-play data-sfx="confirm" aria-disabled={busy} onclick={() => !busy && measure()}>▶ {t('kiki.mic.duplex.play')}</button>
      <button type="button" data-sfx="tick" class="btn paper" data-mic-noear onclick={noEar}>{EARS[ear] === 'none' ? t('kiki.mic.skip') : t('kiki.mic.duplex.noEar')}</button>
    {:else if earStep === 'rate'}
      <div class="row3">
        {#each LOUD as l (l)}<button type="button" data-sfx="tick" class="btn paper" data-mic-loud={l} onclick={() => rate(l)}>{t(`kiki.mic.loud.${l}`)}</button>{/each}
      </div>
    {/if}

  {:else if phase === 'whisper' && wStep !== 'say'}
    <div class="card box" data-mic-whisper={wStep}>
      <h3>{t('kiki.mic.whisper')}</h3>
      {#if wStep === 'check'}<p role="status">{t('kiki.mic.working')}</p>
      {:else if wStep === 'none'}<p>{t('kiki.mic.whisper.none')}</p>
      {:else if wStep === 'ready'}<p>{t('kiki.mic.whisper.how', { mb: sttMB() })}</p><p class="soft">🔒 {t('kiki.mic.whisper.local')}</p>
      {:else if wStep === 'dl'}<p role="status">{t('kiki.mic.whisper.got', { got: mb(wGot), of: wOf ? mb(wOf) : sttMB() })}</p><progress max={wOf || 1} value={wGot}></progress>
      {:else if wStep === 'load'}<p role="status">{wClip ? t('kiki.mic.whisper.clips', { dev: devName(wDev), n: wClip }) : t('kiki.mic.whisper.load', { dev: devName(wDev) })}</p>
      {:else}<p data-mic-unusable>{t('kiki.mic.whisper.fail')}</p>{/if}
    </div>
    {#if wStep === 'ready'}
      <button type="button" class="btn" data-mic-dl data-sfx="confirm" aria-disabled={busy} onclick={() => !busy && startWhisper()}>⬇ {t('kiki.mic.whisper.start')}</button>
      <button type="button" data-sfx="tick" class="btn paper" data-mic-skip onclick={next}>{t('kiki.mic.skip')}</button>
    {:else if wStep === 'none' || wStep === 'fail'}
      <button type="button" data-sfx="tick" class="btn" data-mic-next onclick={next}>{t('kiki.mic.next')}</button>
    {/if}

  {:else if phase === 'whisper' || phase === 'webkit' || phase === 'relay'}
    {@const unusable = phase === 'webkit' ? !env?.wks : phase === 'relay' ? !relayReady() : false}
    <div class="card box">
      <h3>{t(`kiki.mic.${phase}`)}</h3>
      {#if phase === 'relay'}<p class="soft" data-mic-disclose>🔒 {t('kiki.mic.relay.disclose')}</p>{/if}
      {#if phase === 'whisper' && wClips}<p class="soft" data-mic-clips={wDev}>{t('kiki.mic.whisper.clipsDone', wClips)}</p>{/if}
      {#if unusable}<p data-mic-unusable>{phase === 'webkit' ? t('kiki.mic.webkit.none') : t('kiki.mic.relay.none')}</p>
      {:else if lines[said]}
        <p>{t('kiki.mic.say.how', { n: said + 1 })}</p>
        <p class="en" lang="en" data-mic-line={lines[said].clip}>{lines[said].en}</p>
        <p class="soft">{lines[said].ja}</p>
        {#if sayStep === 'listening'}<p role="status" data-mic-listening data-mic-secs={Math.floor(recS)}>🎙️ {t('kiki.mic.say.listening')}{#if recS >= 1} {t('kiki.mic.say.secs', { s: Math.floor(recS) })}{/if}</p>
        {:else if sayStep === 'sending'}<p role="status">{phase === 'whisper' ? t('kiki.mic.working') : t('kiki.mic.say.sending')}</p>
        {:else if last}
          {#if last.err}<p class="res" data-mic-heard="err">{t('kiki.mic.say.fail', { err: last.err })}</p>
          {:else}<p class="res" data-mic-heard={last.pct}>{t('kiki.mic.say.match', { pct: last.pct })}<small>{t('kiki.mic.say.heard', { text: last.text })}</small></p>{/if}
        {/if}
      {/if}
    </div>
    {#if unusable}
      <button type="button" data-sfx="tick" class="btn" data-mic-next onclick={next}>{t('kiki.mic.next')}</button>
    {:else if sayStep === 'ready'}
      <button type="button" data-sfx="tick" class="btn talk" data-mic-talk onclick={talk}>🎤 {t('kiki.mic.say.talk')}</button>
      <div class="row2">
        <button type="button" data-sfx="tick" class="btn paper" data-mic-hear onclick={hear}>🔊 {t('kiki.mic.say.hear')}</button>
        <button type="button" data-sfx="tick" class="btn paper" data-mic-skip onclick={next}>{t('kiki.mic.skip')}</button>
      </div>
    {:else if sayStep === 'listening' && phase !== 'webkit'}
      <button type="button" data-sfx="tick" class="btn talk" data-mic-stop onclick={() => stopTake?.()}>■ {t('kiki.mic.say.stop')}</button>
    {:else if sayStep === 'done'}
      <button type="button" data-sfx="tick" class="btn" data-mic-next onclick={nextLine}>{t('kiki.mic.next')}</button>
    {/if}

  {:else}
    <div class="card box" data-mic-result>
      <h3>{t('kiki.mic.result')}</h3>
      <ul class="facts">
        {#if env}<li>{t('kiki.mic.env.gpu')}<b>{yn(env.gpu)}</b></li>{/if}
        <li data-mic-row="perm">{t('kiki.mic.row.mic')}<b>{perm ? (perm.st === 'granted' ? '✓' : perm.st) : t('kiki.mic.result.skipped')}</b></li>
        {#each EARS as e (e)}
          {#if earRows[e]}<li data-mic-row={e}>{t(`kiki.mic.row.${e === 'none' ? 'speaker' : e}`)}<b>{earLine(earRows[e])}</b></li>{/if}
        {/each}
        <li data-mic-row="whisper">{t('kiki.mic.whisper')}<b>{sttLine(stt.whisper)}</b></li>
        {#if env?.wks}<li data-mic-row="webkit">{t('kiki.mic.webkit')}<b>{sttLine(stt.webkit)}</b></li>{/if}
        <li data-mic-row="relay">{t('kiki.mic.relay')}<b>{sttLine(stt.relay)}</b></li>
      </ul>
      <p class="soft">🔒 {t('kiki.mic.privacy')}</p>
    </div>
    {#if sent === 'no'}
      <button type="button" class="btn" data-mic-send data-sfx="confirm" aria-disabled={busy} onclick={() => !busy && send()}>{t('kiki.mic.result.send')}</button>
    {:else}
      <p class="res" role="status" data-mic-sent={sent}>{sent === 'yes' ? t('kiki.mic.result.sent') : t('kiki.mic.result.queued')}</p>
      {#if perm?.st === 'granted'}<p class="soft">{t('kiki.mic.result.reopen')}</p>{/if}
    {/if}
    <button type="button" class="btn paper" data-mic-back data-sfx="back" onclick={onback}>{t('kiki.mic.back')}</button>
  {/if}
</div>

<style>
  .probe { display: grid; gap: 12px; }
  .of { margin: 0 4px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .box { display: grid; gap: 8px; padding: 16px; }
  .box h3 { font-size: var(--fs-talk); }
  .box p { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .soft, .box .soft { font-size: var(--fs-s); color: var(--text-soft); }
  .en { font-size: var(--fs-talk) !important; line-height: 1.4 !important; }
  .res small { display: block; margin-top: 4px; font-size: var(--fs-s); color: var(--text-soft); overflow-wrap: anywhere; }
  .facts { display: grid; gap: 6px; margin: 0; padding: 0; list-style: none; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .facts li { display: flex; justify-content: space-between; gap: 12px; }
  .facts b { text-align: right; }
  .talk { min-height: 72px; }
  progress { width: 100%; height: 8px; accent-color: var(--c-leaf); }
  .row2, .row3 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .row3 { grid-template-columns: repeat(3, 1fr); }
</style>
