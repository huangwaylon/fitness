<script lang="ts">
  // The speech test (docs/speech-test.md): read a sentence (or say anything), the relay's Whisper writes it down, and
  // the page shows what was heard, each word matched, and each step's time. ‹ goes back to English Study's すごろく tab.
  import { onDestroy, onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { english } from '#lib/english/open.svelte.ts';
  import { log } from '#lib/sync/log.ts';
  import { getKey } from '#lib/sync/storage.ts';
  import { matchOf, SENTENCES } from '#lib/speech/match.ts';
  import { Recorder } from '#lib/speech/recorder.svelte.ts';
  import { transcribe, type Heard, type Miss } from '#lib/speech/stt.ts';
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

  const MISS: Record<Miss, string> = {
    refused: 'マイクが許可されていません。「許可しない」を選んだときは、アプリを閉じて開き直すと、もう一度聞かれます。設定 › アプリ › Safari › マイク が「拒否」でないかも確かめてください。',
    nomic: 'マイクが見つかりませんでした', busy: 'マイクをほかのアプリが使っています。通話や録音を終えてから、もう一度どうぞ。',
    session: 'アプリの音とマイクがぶつかりました。もう一度録音してください。', insecure: 'このページではマイクが使えません',
    empty: '録音が短すぎました。もう少し長く話してください。', silent: '音が録れていませんでした（マイクが止まっていたようです）。もう一度どうぞ。',
    off: 'サーバーの音声認識が止まっています', capped: '今日の回数を使い切りました',
    network: 'つながりませんでした', timeout: '返事がありませんでした', ai: '認識に失敗しました', other: 'うまくいきませんでした'
  };
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
    const q = new URLSearchParams(location.search);
    void goto(`${resolve('/')}${q.size ? `?${q}` : ''}`).then(() => english.show('game'));
  }
  const step = (d: number) => {
    if (rec.phase !== 'idle') return;
    k = (k + d + SENTENCES.length + 1) % (SENTENCES.length + 1);
    miss = null;
  };
</script>

<div class="screen" data-speech>
  <header class="top">
    <button type="button" class="back" aria-label="戻る" data-sfx="back" onclick={leave}>‹</button>
    <h1>音声認識テスト</h1>
  </header>

  <main class="body">
    {#if !paired}
      <p class="note">このiPhoneはペアリングされていないので、テストできません。</p>
    {/if}

    <section class="card ask obj-cream">
      <div class="nav">
        <button type="button" class="arrow" aria-label="前の文" data-sfx="tick" onclick={() => step(-1)} aria-disabled={rec.phase !== 'idle'}>◀</button>
        <span class="count" data-speech-at={free ? 'free' : k}>{free ? '自由に話す' : `${k + 1} / ${SENTENCES.length}`}</span>
        <button type="button" class="arrow" aria-label="次の文" data-sfx="tick" onclick={() => step(1)} aria-disabled={rec.phase !== 'idle'}>▶</button>
      </div>
      {#if free}
        <p class="en">好きな英語を話してください</p>
      {:else}
        <p class="en" lang="en">{SENTENCES[k].en}</p>
        <p class="ja">{SENTENCES[k].ja}</p>
      {/if}
    </section>

    <button type="button" class="mic" class:rec={rec.phase === 'rec'} aria-disabled={!paired || rec.phase === 'wait' || rec.phase === 'ask'} data-sfx="none" data-speech-mic onclick={tap}>
      {rec.phase === 'rec' ? `■ 止める（${rec.secs.toFixed(1)} 秒）` : rec.phase === 'wait' ? '認識中…' : '● 録音'}
    </button>

    {#if miss}<p class="note miss" data-speech-miss={miss}>{MISS[miss]}{#if why}<span class="why">（{why}）</span>{/if}</p>{/if}

    {#if last}
      <section class="card result obj-cream" data-speech-result>
        <p class="heard" lang="en">“{last.heard.text || '（何も聞こえませんでした）'}”</p>
        {#if last.match}
          <p class="words" lang="en">
            {#each last.match.words as w, i (i)}<span class:ok={w.ok}>{w.w}</span>{' '}{/each}
          </p>
          <p class="score">一致 {Math.round(last.match.score * 100)}%</p>
        {/if}
        <dl class="times">
          <div><dt>録音</dt><dd>{last.heard.audS} 秒</dd></div>
          <div><dt>変換</dt><dd>{last.heard.encMs} ms</dd></div>
          <div><dt>通信</dt><dd>{last.heard.netMs} ms</dd></div>
          <div><dt>認識</dt><dd>{last.heard.aiMs} ms</dd></div>
          <div class="tot"><dt>合計</dt><dd>{(last.heard.totMs / 1000).toFixed(1)} 秒</dd></div>
        </dl>
      </section>
    {/if}

    {#if summary.n > 1}
      <p class="sum">{summary.n} 回：合計の中央値 {(summary.tot / 1000).toFixed(1)} 秒{#if takes.some((t) => t.match)}、一致の中央値 {Math.round(summary.match * 100)}%{/if}</p>
    {/if}

    <p class="fine">録音はサーバーで文字にするだけで、音声も文字も保存しません。記録されるのは時間と一致率だけです。</p>
  </main>
</div>

<style>
  .screen { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--surface); color: var(--text); }
  .top { display: flex; align-items: center; gap: 8px; padding: calc(env(safe-area-inset-top) + 8px) 12px 8px; }
  .top h1 { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .back { width: 44px; height: 44px; border: 0; border-radius: 50%; background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); font-size: 26px; color: var(--c-ink); }
  .body { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 12px; padding: 4px 16px calc(env(safe-area-inset-bottom) + 16px); }
  /* the page follows the hour (--surface, --text); its cards stay cream (.obj-cream: the day's text inside) */
  .card { background: var(--c-card); color: var(--text); border-radius: 16px; box-shadow: 0 2px 0 var(--c-edge); padding: 12px 14px; }
  .nav { display: flex; align-items: center; justify-content: space-between; }
  .arrow { width: 44px; height: 44px; border: 0; background: none; color: var(--c-ink); font-size: 18px; }
  .arrow[aria-disabled='true'] { opacity: .3; }
  .count { font: 600 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .en { margin: 6px 0 2px; font: 700 20px/1.35 var(--font-body); text-align: center; text-wrap: pretty; }
  .ja { margin: 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .mic { min-height: 64px; border: 0; border-radius: 32px; background: var(--c-yuzu); box-shadow: 0 3px 0 var(--c-yuzu-lip); color: var(--c-ink);
    font: 700 20px/1 var(--font-ui); }
  .mic.rec { background: #f08c7a; box-shadow: 0 3px 0 #c8604f; }
  .mic[aria-disabled='true'] { opacity: .5; }
  .note { margin: 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .why { display: block; font-size: 11px; }
  .heard { margin: 0 0 6px; font: 600 18px/1.35 var(--font-body); }
  .words { margin: 0 0 4px; font-size: var(--fs-s); }
  .words span { color: #c8604f; text-decoration: line-through; }
  .words span.ok { color: var(--c-ink); text-decoration: none; }
  .score { margin: 0 0 8px; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .times { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; margin: 0; }
  .times div { text-align: center; }
  .times dt { font-size: 11px; color: var(--text-soft); }
  .times dd { margin: 2px 0 0; font: 600 var(--fs-s)/1.2 var(--font-ui); }
  .times .tot dd { font-weight: 800; }
  .sum { margin: 0; text-align: center; font: 600 var(--fs-s)/1.4 var(--font-ui); }
  .fine { margin: auto 0 0; font-size: 11px; line-height: 1.5; color: var(--text-soft); text-align: center; }
</style>
