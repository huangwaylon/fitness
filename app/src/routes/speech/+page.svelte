<script lang="ts">
  // The speech test (docs/speech-test.md): read a sentence (or say anything), the relay's Whisper writes it down, and
  // the page shows what was heard, each word matched, and each step's time. ‹ goes back to English Study (its ⚙ opens it).
  import { onDestroy, onMount } from 'svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { english } from '#lib/english/open.svelte.ts';
  import { log } from '#lib/sync/log.ts';
  import { getKey } from '#lib/sync/storage.ts';
  import { matchOf, SENTENCES } from '#lib/speech/match.ts';
  import { Recorder } from '#lib/speech/recorder.svelte.ts';
  import { transcribe, warmStt, type Heard, type Miss } from '#lib/speech/stt.ts';
  import { missText, s as say } from '#lib/speech/i18n.ts';
  import Icon from '#lib/components/ui/Icon.svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import { audioState, micFocus } from '#lib/sound/sound.svelte.ts';

  type Done = { k: number; asked: string; heard: Extract<Heard, { ok: true }>; match: ReturnType<typeof matchOf> | null };
  let k = $state(0);
  const rec = new Recorder(() => void stop());
  let miss = $state<Miss | null>(null);
  let why = $state('');
  let takes = $state.raw<Done[]>([]);
  const free = $derived(k === SENTENCES.length);
  const last = $derived(takes.at(-1) ?? null);
  const paired = !!getKey();

  // what the log says about the phone's mic (docs/speech-test.md "What's logged"): the home-screen app or Safari, the
  // island's audio context and audio session as the page opened (WebKit refuses the mic under 'ambient'), the mic's
  // permission as the Permissions API says
  type AudioSessionNav = Navigator & { audioSession?: { type: string }; standalone?: boolean };
  const nav = navigator as AudioSessionNav;
  const pwa = matchMedia('(display-mode: standalone)').matches || !!nav.standalone;
  let opened = { ctx: 'none', sess: 'none' };
  onMount(() => {
    const ctx = audioState();
    opened = { ctx, sess: micFocus(true) ?? 'none' };
    warmStt();
  });
  // (a swipe back as much as ‹: the mic, the timer and the upload all stop)
  onDestroy(() => (rec.close(), micFocus(false)));
  const perm = async (): Promise<string> => {
    try {
      return (await navigator.permissions?.query({ name: 'microphone' as PermissionName }))?.state ?? 'none';
    } catch {
      return 'none';
    }
  };
  const env = () => ({ pwa, md: !!navigator.mediaDevices, ...opened, sessNow: nav.audioSession?.type ?? 'none' });
  const median = (xs: number[]) => (xs.length ? [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)] : 0);
  const summary = $derived.by(() => {
    const read = takes.filter((t) => t.match);
    return { n: takes.length, tot: median(takes.map((t) => t.heard.totMs)), match: median(read.map((t) => t.match!.score)) };
  });

  async function tap() {
    if (!paired || rec.phase === 'wait' || rec.phase === 'ask') return;
    if (rec.phase === 'rec') return stop();
    miss = null, why = '';
    micFocus(true); // (already, since the page opened: kept in the tap in case)
    const at = env();
    const t = await rec.start();
    if (t && t !== true) {
      miss = t.miss, why = t.gum;
      log('speech.test', { ok: false, err: t.miss, gum: t.gum, msg: t.msg, lvl: free ? -1 : k, perm: await perm(), ...at });
    }
  }

  async function stop() {
    const s = await rec.stop();
    if (!s) return;
    const p = s.pcm;
    const r = await transcribe(p.pcm, s.t0, rec.signal);
    if (rec.signal.aborted) return;
    rec.idle();
    const lvl = free ? -1 : k;
    const cap = { recKB: p.recKB, type: p.type, decoded: p.decoded, peak: Math.round(p.peak * 1000), muted: p.muted, pwa };
    if (!r.ok) return void ((miss = r.miss), log('speech.test', { ok: false, err: r.miss, lvl, audS: Math.round((p.pcm.length / 16_000) * 10) / 10, ...cap }));
    const asked = free ? '' : SENTENCES[k].en;
    const match = free ? null : matchOf(asked, r.text);
    takes = [...takes, { k: lvl, asked, heard: r, match }];
    const { ok: _ok, text: _text, ...times } = r;
    log('speech.test', { ...times, ok: true, lvl, ...cap, ...(match ? { match: Math.round(match.score * 100) } : {}) });
  }

  function leave() {
    // (back to English Study's home: its ⚙ row opens this page, ?from=en)
    const q = new URLSearchParams(location.search);
    q.delete('from');
    void goto(`${resolve('/')}${q.size ? `?${q}` : ''}`).then(() => english.show());
  }
  const step = (d: number) => {
    if (rec.phase !== 'idle') return;
    k = (k + d + SENTENCES.length + 1) % (SENTENCES.length + 1);
    miss = null;
  };
</script>

<div class="screen kit" data-speech>
  <div class="top"><NavBar pad title={say('title')} onback={leave} /></div>

  <main class="body">
    {#if !paired}
      <p class="note"><Phrases text={say('unpaired')} /></p>
    {/if}

    <section class="card pad ask">
      <div class="nav">
        <button type="button" class="btn small paper arrow" aria-label={say('prev')} data-sfx="tick" onclick={() => step(-1)} aria-disabled={rec.phase !== 'idle'}><Icon name="back" /></button>
        <span class="count" data-speech-at={free ? 'free' : k}>{free ? say('free') : `${k + 1} / ${SENTENCES.length}`}</span>
        <button type="button" class="btn small paper arrow" aria-label={say('next')} data-sfx="tick" onclick={() => step(1)} aria-disabled={rec.phase !== 'idle'}><Icon name="chevron-right" /></button>
      </div>
      {#if free}
        <p class="en">{say('freeAsk')}</p>
      {:else}
        <p class="en" lang="en">{SENTENCES[k].en}</p>
        <p class="ja">{SENTENCES[k].ja}</p>
      {/if}
    </section>

    <button type="button" class="btn" class:rec={rec.phase === 'rec'} aria-disabled={!paired || rec.phase === 'wait' || rec.phase === 'ask'} data-sfx="none" data-speech-mic onclick={tap}>
      {#if rec.phase !== 'rec'}<Icon name="mic" />{/if}{rec.phase === 'rec' ? say('stop', { s: rec.secs.toFixed(1) }) : rec.phase === 'wait' ? say('wait') : say('record')}
    </button>

    {#if miss}<p class="note miss" data-speech-miss={miss}><Phrases text={missText(miss)} />{#if why}<span class="why">（{why}）</span>{/if}</p>{/if}

    {#if last}
      <section class="card pad result" data-speech-result>
        <p class="heard" lang="en">“{last.heard.text || say('nothing')}”</p>
        {#if last.match}
          <!-- a word not heard: soft, a yuzu underline (never red or struck through) -->
          <p class="words" lang="en">
            {#each last.match.words as w, i (i)}<span class:miss={!w.ok}>{w.w}</span>{' '}{/each}
          </p>
          <p class="score">{say('match', { n: Math.round(last.match.score * 100) })}</p>
        {/if}
        <dl class="times">
          <div><dt>{say('time.rec')}</dt><dd>{say('sec', { n: last.heard.audS })}</dd></div>
          <div><dt>{say('time.enc')}</dt><dd>{say('ms', { n: last.heard.encMs })}</dd></div>
          <div><dt>{say('time.net')}</dt><dd>{say('ms', { n: last.heard.netMs })}</dd></div>
          <div><dt>{say('time.ai')}</dt><dd>{say('ms', { n: last.heard.aiMs })}</dd></div>
          <div class="tot"><dt>{say('time.tot')}</dt><dd>{say('sec', { n: (last.heard.totMs / 1000).toFixed(1) })}</dd></div>
        </dl>
      </section>
    {/if}

    {#if summary.n > 1}
      <p class="sum">{say('summary', { n: summary.n, t: (summary.tot / 1000).toFixed(1) })}{#if takes.some((t) => t.match)}{say('summaryMatch', { m: Math.round(summary.match * 100) })}{/if}</p>
    {/if}

    <p class="fine"><Phrases text={say('fine')} /></p>
  </main>
</div>

<style>
  .screen { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--surface); color: var(--text); }
  .top { padding: 0 calc(var(--side) - 6px); }
  .body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 4px calc(var(--side) + var(--safe-right)) var(--pad-foot) calc(var(--side) + var(--safe-left)); }
  .nav { display: flex; align-items: center; justify-content: space-between; }
  .nav .arrow { width: 44px; padding: 0; margin: 0; }
  .count { font: 600 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .en { margin: 6px 0 2px; font: 700 var(--fs-talk)/1.35 var(--font-body); text-align: center; text-wrap: pretty; }
  .ja { margin: 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .btn { margin: 0; }
  .note { margin: 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .why { display: block; }
  .heard { margin: 0 0 6px; font: 600 var(--fs-talk)/1.35 var(--font-body); }
  .words { margin: 0 0 4px; font-size: var(--fs-s); }
  .words .miss { color: var(--text-soft); text-decoration: underline 3px color-mix(in srgb, var(--c-yuzu) 85%, transparent); text-underline-offset: 4px; }
  .score { margin: 0 0 8px; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .times { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 0; }
  .times div { text-align: center; }
  .times dt { font-size: var(--fs-s); color: var(--text-soft); }
  .times dd { margin: 2px 0 0; font: 600 var(--fs-s)/1.2 var(--font-ui); }
  .times .tot dd { font-weight: 800; }
  .sum { margin: 0; text-align: center; font: 600 var(--fs-s)/1.4 var(--font-ui); }
  .fine { margin: auto 0 0; font-size: var(--fs-s); line-height: 1.5; color: var(--text-soft); text-align: center; }
</style>
