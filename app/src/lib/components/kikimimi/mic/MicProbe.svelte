<script lang="ts">
  // せってい's 「マイク診断（テスト）」 (docs/kikimimi-mic.md §1.1): the probe, a screen a step, each with one button,
  // 「スキップ」 and a plain result line. 1 the page's capabilities; 2 the permission (2b, after a reopen: was it asked
  // again?); 3 play and record per earphone route (bleed with echo cancellation on and off, a click's round trip, the
  // user's rating); 4 whisper (M0w: skipped while it isn't there); 5 Safari's recogniser and 6 the relay's, each on the
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
  import { SENTENCES, wav16k, werPct, type Ear, type Loud } from '#lib/mic/probe/steps.ts';
  import {
    askMic, builtinMic, closeProbe, decode, duplex, openRec, permState, playBuf, probeCtx, probeEnv, relayOnce,
    relayReady, takeSpeech, webkitOnce, type Heard
  } from '#lib/mic/probe/run.ts';

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
  /** The relay take's length so far (s). */
  let recS = $state(0);
  let stt = $state<Partial<Record<'webkit' | 'relay', { pct: number; s: number }[]>>>({});

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
    if ((p === 'webkit' || p === 'relay') && !lines.length) {
      await load('ladder');
      const all = ladders();
      lines = SENTENCES.map((s) => ({ clip: s.clip, en: all.find((l) => l.id === s.ladder)?.line.en ?? '', ja: all.find((l) => l.id === s.ladder)?.line.ja ?? '' }));
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

  const hear = async () => {
    const b = await clipBuffer(lines[said].clip);
    if (b) await playBuf(b);
  };

  /** One sentence read aloud through the step's recogniser: its WER here, its numbers kept, the text shown only. */
  async function talk() {
    const be = phase as 'webkit' | 'relay';
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
        const { x, sr } = await take.done;
        stopTake = null;
        sayStep = 'sending';
        h = await relayOnce(wav16k(x, sr));
      }
    }
    const model = be === 'relay' ? 'turbo' : 'none';
    if ('err' in h) {
      keep('mic.stt', { be, model, step: 'spoken', ok: false, err: h.err });
      last = { err: h.err };
    } else {
      const pct = werPct(wer(lines[said].en, h.text));
      keep('mic.stt', { be, model, step: 'spoken', ms: h.ms, audS: h.audS, wer: pct, ok: true });
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
    stopTake?.();
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

  {:else if phase === 'whisper'}
    <div class="card box" data-mic-whisper="soon">
      <h3>{t('kiki.mic.whisper')}</h3>
      <p>{t('kiki.mic.whisper.soon')}</p>
    </div>
    <button type="button" data-sfx="tick" class="btn" data-mic-next onclick={next}>{t('kiki.mic.next')}</button>

  {:else if phase === 'webkit' || phase === 'relay'}
    {@const unusable = phase === 'webkit' ? !env?.wks : !relayReady()}
    <div class="card box">
      <h3>{t(`kiki.mic.${phase}`)}</h3>
      {#if phase === 'relay'}<p class="soft" data-mic-disclose>🔒 {t('kiki.mic.relay.disclose')}</p>{/if}
      {#if unusable}<p data-mic-unusable>{phase === 'webkit' ? t('kiki.mic.webkit.none') : t('kiki.mic.relay.none')}</p>
      {:else if lines[said]}
        <p>{t('kiki.mic.say.how', { n: said + 1 })}</p>
        <p class="en" lang="en" data-mic-line={lines[said].clip}>{lines[said].en}</p>
        <p class="soft">{lines[said].ja}</p>
        {#if sayStep === 'listening'}<p role="status" data-mic-listening data-mic-secs={Math.floor(recS)}>🎙️ {t('kiki.mic.say.listening')}{#if recS >= 1} {t('kiki.mic.say.secs', { s: Math.floor(recS) })}{/if}</p>
        {:else if sayStep === 'sending'}<p role="status">{t('kiki.mic.say.sending')}</p>
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
    {:else if sayStep === 'listening' && phase === 'relay'}
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
  .row2, .row3 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .row3 { grid-template-columns: repeat(3, 1fr); }
</style>
