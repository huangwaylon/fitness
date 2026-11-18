<script lang="ts">
  // A clip's lesson (docs/english.md "Lesson"): the player pinned on top, the watch card, the questions in order and
  // まとめ, never locked; ツール (StudySheet) and the levels it opens (この動画のセリフと解説, セリフ) under the same player.
  // The place is kept on this phone (session.ts); `listen` rows carry the study time; failures go to english.fail.
  import { onDestroy, untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { count } from '#lib/sync/log.ts';
  import Player from './Player.svelte';
  import Controls from './Controls.svelte';
  import FlagSheet from './FlagSheet.svelte';
  import ClipPhrases from './ClipPhrases.svelte';
  import Transcript from './Transcript.svelte';
  import Scenes from './Scenes.svelte';
  import KeyedText from './KeyedText.svelte';
  import StudySheet from './StudySheet.svelte';
  import NavButton from '#lib/components/ui/NavButton.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { videoFocus } from '#lib/sound/sound.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { TV_GM } from '#lib/contract/listen.ts';
  import type { CcMode, YtPlayer } from '../player.svelte.ts';
  import { againOf, answersOf, blank, clean, dictate, heard, pick, reveal, type QState } from '../lesson.ts';
  import { choiceOrder, draw, historyOf, seedOf } from '../draw.ts';
  import { newActive, sent, tick, touched, type Active } from '../active.ts';
  import { loadSaved, partWay, save } from '../session.ts';
  import { bankNow, loadBank } from '../data.ts';
  import { harderOn, scenesOn, setScenes } from '../prefs.ts';
  import { safeReload } from '#lib/ui-state/reload.ts';
  import { log } from '#lib/sync/log.ts';
  import { durText, s } from '../i18n.ts';
  import type { ClipMeta } from '../catalog.ts';
  import type { Bank, Question } from '../types.ts';
  import type { LocalDate, Who } from '#lib/types.ts';

  let { clip, onback, onclose }: { clip: ClipMeta; onback: () => void; onclose: () => void } = $props();

  const who: Who = untrack(() => week.model?.me ?? 'A');
  const v = untrack(() => clip.v);
  const saved = untrack(() => loadSaved(who, clip.id, v));
  /** This play: its number (1 + the plays finished), its seed, its questions (draw.ts: a play left part-way keeps its
   *  own ids; a finished one, at まとめ, draws the next). A saved place is of this very bank (its version). */
  const past = untrack(() => historyOf(week.model?.state.listen ?? [], who, clip.id));
  const resume = partWay(saved) && saved!.st.length === saved!.ids.length;
  const play = past.plays + 1;
  const seed = untrack(() => seedOf(who, clip.id, play));
  let qs = $state.raw<Question[]>([]);
  /** The whole bank, once in (この動画のセリフと解説). */
  let full = $state.raw<Bank | null>(null);
  /** 場面のあらすじ, when the bank has them, and its strip shown (this phone's). */
  const scenes = $derived(full?.scenes?.length ? full.scenes : null);
  const beats = $derived(full?.beats?.length ? full.beats : undefined);
  let showScenes = $state(scenesOn());
  const toggleScenes = () => setScenes((showScenes = !showScenes));
  const len = $derived(qs.length);
  /** The bank: 'ready' once drawn. */
  let bank = $state<'loading' | 'failed' | 'ready'>('loading');
  let fails = 0;
  /** −1 the watch card, a question's index, len まとめ. */
  let at = $state(resume ? saved!.at : -1);
  let st = $state<QState[]>([]);
  function begin(c: Bank): void {
    qs = resume ? saved!.ids.flatMap((id) => c.questions.filter((q) => q.id === id)) : draw(c, past.seen, play, seed, { harder: harderOn() });
    st = resume && qs.length === saved!.ids.length ? saved!.st : qs.map(blank);
    if (resume && qs.length !== saved!.ids.length) at = -1;
    full = c;
    bank = 'ready';
  }
  function fetchBank(): void {
    bank = 'loading';
    loadBank(clip).then(begin, () => {
      // a second failure online: the file is gone (a deploy since this page loaded), so the newer build
      if (++fails > 1 && navigator.onLine && safeReload(Date.now(), 'chunk')) return;
      bank = 'failed';
    });
  }
  untrack(() => {
    const now = bankNow(clip);
    if (now) begin(now);
    else fetchBank();
  });
  /** The day this play's まとめ wrote its row (a resumed play is one not finished: none yet). */
  let sentDay = $state<LocalDate | null>(null);
  let act: Active = newActive(saved?.unsent ?? 0, resume ? saved!.perQ : {});
  let player = $state<YtPlayer>();
  let watched = $state(false);
  /** The clip played (▶ 全部見る, or to its end): 質問へ the primary then. */
  const played = $derived(watched || player?.state === 'ended');
  let flagQ = $state<number | null>(null);
  let flagOpen = $state(false);
  let tools = $state(false);
  let sceneList = $state(false);
  /** 字幕 chosen (the chip or ツール), counted once a lesson (the log's act:english.cc). */
  let ccTold = false;
  function captions(m: CcMode): void {
    if (!player) return;
    player.setCaptions(m);
    if (m !== 'off' && !ccTold) (ccTold = true), count('act:english.cc');
  }
  let body: HTMLElement | undefined = $state();
  /** A level open over the lesson's place (kept): この動画のセリフと解説, or セリフ when the bank has transcript lines. */
  type Level = false | 'phrases' | 'lines';
  let study = $state<Level>(false);
  const toStudy = (on: Level) => ((study = on), body?.scrollTo({ top: 0 }));

  const q = $derived<Question | null>(at >= 0 && at < len ? qs[at] : null);
  /** まとめ (the bank in: till then a place past the watch card is its loading card). */
  const end = $derived(bank === 'ready' && at === len);
  /** 場面のあらすじ's line: on the watch card, at まとめ and in a level, never on a question. */
  const strip = $derived(showScenes && (at === -1 || end || !!study));
  const cur = $derived(q ? st[at] : null);
  const today = () => localDateAt(week.model?.now ?? Date.now());

  function keep(): void {
    if (bank !== 'ready') return;
    save(who, clip.id, { v, ids: qs.map((x) => x.id), at, st: $state.snapshot(st), unsent: act.unsent, perQ: act.perQ, sent: sentDay, t: Date.now() });
  }
  $effect(() => {
    void at;
    void JSON.stringify(st);
    void sentDay;
    void bank;
    untrack(keep);
  });

  // the active clock: a tick a second (and on each input), what's on screen with it
  const now = () => ({ playing: player?.state === 'playing', visible: document.visibilityState === 'visible', q: !study && at >= 0 && at < len ? at : null });
  const timer = setInterval(() => (act = tick(act, performance.now(), now())), 1000);
  function input() {
    act = touched(tick(act, performance.now(), now()), performance.now());
  }

  /** A `listen` row of this clip: finished (まとめ) or the minutes of one left part-way. */
  function writeRow(finished: boolean): void {
    act = tick(act, performance.now(), now());
    const ms = Math.round(Math.min(act.unsent, 3_600_000));
    const g = `tv${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')}`;
    // (the answers in a finished play's rows only up to its まとめ: a later one would read as the next play's, draw.ts historyOf)
    week.send('listen', { d: today(), g, gm: TV_GM, u: clip.id, lv: 7, n: 1, ms, ...(finished && { f: 1 }), r: finished || !sentDay ? answersOf(qs, st) : [] });
    act = sent(act);
    keep();
  }
  /** Leaving (‹, ✕, the phone put away): a row for a minute or more not yet sent. */
  function leaving(): void {
    act = tick(act, performance.now(), now());
    if (act.unsent >= 60_000) writeRow(false);
    else keep();
  }
  // the clip has the floor: the island's sound paused, iOS's session 'playback' so the silent switch doesn't mute it
  videoFocus(true);
  // put away (an app switch, the lock): the clip paused, or the 'playback' session plays it on the lock screen
  const away = () => (player?.pause(), leaving());
  const onHidden = () => document.visibilityState === 'hidden' && away();
  document.addEventListener('visibilitychange', onHidden);
  addEventListener('pagehide', away);
  onDestroy(() => {
    videoFocus(false);
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onHidden);
    removeEventListener('pagehide', away);
    player?.pause();
    leaving();
  });

  function go(n: number): void {
    at = Math.max(-1, bank === 'ready' ? Math.min(len, n) : Math.min(0, n));
    player?.pause();
    body?.scrollTo({ top: 0 });
    // まとめ reached: the play's row (once; もう一度 the same day is a play of its own and writes its own)
    if (at === len && !sentDay) {
      sentDay = today();
      writeRow(true);
    }
  }
  const seg = (x: Question) => player?.play(x.seg[0], x.seg[1]);
  /** What the learner just did on this card ('reveal' or 'nudge'), so only that scrolls into view, not a card come
   *  back to. On an iPhone the notes sit under the choices, below the fold: they're brought up, the ○ row on top (a
   *  dictation's: the notes'). The nudge only as far as it takes: the question and its choices stay for the retry. */
  let fresh = $state<'reveal' | 'nudge' | null>(null);
  const intoView = (el: HTMLElement, what: 'reveal' | 'nudge') => {
    if (fresh !== what) return;
    fresh = null;
    const to = what === 'reveal' ? (el.parentElement?.querySelector<HTMLElement>('[data-ans]') ?? el) : el;
    requestAnimationFrame(() => to.scrollIntoView({ behavior: 'smooth', block: what === 'nudge' ? 'nearest' : 'start' }));
  };

  function choose(i: number): void {
    if (!q || !cur) return;
    const r = pick(q, cur, i);
    fresh = r.st.r ? 'reveal' : r.replay ? 'nudge' : null;
    st[at] = r.st;
    if (r.replay) seg(q);
    // a predict's continuation, heard once it's settled
    else if (r.st.r) heardThen(q);
  }
  /** 答えを見る after a miss: settled, so a predict's continuation plays too. */
  function showAnswer(): void {
    if (!q || !cur) return;
    fresh = 'reveal';
    st[at] = reveal(cur);
    heardThen(q);
  }
  const heardThen = (x: Question) => x.then && player?.play(x.then[0], x.then[1]);

  // the embed's failures and a play that doesn't start (the first a lesson: iOS asks a tap on the video once), logged
  let stuckTold = false;
  $effect(() => {
    const p = player;
    if (!p) return;
    const on = navigator.onLine;
    if (p.state === 'error') untrack(() => log('english.fail', { what: p.error === null ? 'hello' : 'embed', clip: clip.id, ...(p.error !== null && { code: p.error }), on }, 2));
    else if (p.stuck && !stuckTold) (stuckTold = true), untrack(() => log('english.fail', { what: 'stuck', clip: clip.id, on }, 1));
  });
  let typed = $state('');
  $effect(() => {
    typed = untrack(() => cur?.typed ?? '');
    void at;
  });
  const head = (x: QState) => {
    const r = x.r!;
    if (r.k !== 'dict') return r.k === 'first' ? s('first') : r.k === 'second' ? s('second') : s('shown');
    // never a 0 (docs/english.md "A miss"): no word heard reads as the answer shown
    const h = heard(r);
    return h.hit ? s('heardWords', h) : s('shown');
  };
  const again = $derived(end ? againOf(qs, st) : []);
  /** An again row's words: the line heard there (the key words' stars dropped), else the phrase to use. */
  /** 訳: the choices' Japanese before answering (this lesson's; a form item's never: it would answer it), always at the reveal. */
  let tr = $state(false);
  const FORM = new Set<Question['skill']>(['marker', 'phrase', 'sound', 'dict']);
  const phrase = (x: Question) => x.line?.replaceAll('*', '') ?? x.use.split('（')[0];
  /** A segment as the sheet says it, in whole seconds (57.3–63.45 → 57–64). */
  const span = (x: Question) => ({ from: Math.floor(x.seg[0]), to: Math.ceil(x.seg[1]) });
  const flag = (i: number | null) => ((flagQ = i), (flagOpen = true));
  /** ツール's rows. What one opens is a level below ツール: its ‹ goes back to ツール (one level, as 図鑑's to 設定). */
  let viaTools = $state(false);
  const fromTools = (to: 'scenes' | 'lines' | 'phrases' | 'flag') => ((viaTools = true), to === 'scenes' ? (sceneList = true) : to === 'flag' ? flag(null) : toStudy(to));
  const toTools = () => ((viaTools = false), (tools = true));
  // closed by ✕ (or opened from elsewhere next time): no way back to ツール
  $effect(() => {
    if (!sceneList && !flagOpen && !study) untrack(() => (viaTools = false));
  });
  /** A level's ‹: back to where it was opened, the lesson's card or ツール. */
  const studyBack = () => (toStudy(false), viaTools && toTools());
</script>

<section class="screen" role="presentation" data-en-lesson={clip.id} data-en-at={at} onpointerdown={input} onkeydown={input}>
  <div class="top">
    {#if study}<NavBar pad title={study === 'lines' ? s('transcript') : s('phrases')} onback={studyBack} {onclose} />
    {:else}<NavBar pad title={clip.title} {onback} {onclose} {trailing} />{/if}
  </div>
  {#snippet trailing()}
    <NavButton kind="tool" icon="list" label={s('tools')} sfx="open" popup data-en-tools onclick={() => (tools = true)} />
  {/snippet}
  <Player video={clip.video} title={clip.title} bind:player />
  {#if scenes}<Scenes {scenes} {beats} {strip} bind:open={sceneList} onback={viaTools ? toTools : null} time={player?.time ?? 0} onplay={(t) => player?.play(t, null)} />{/if}
  <Controls {player} oncc={captions} compact={!!q && !study} />
  <div class="body sheet-scroll" bind:this={body}>
    {#if study && full}
      {#if study === 'lines' && full.lines}
        <Transcript lines={full.lines} time={player?.time ?? 0} onplay={(t) => player?.play(t, null)} />
      {:else}
        <ClipPhrases clip={full} onplay={(from, to) => player?.play(from, to)} />
      {/if}
    {:else if at === -1 && !study}
      <article class="card pad" data-en-watch>
        <p class="lead"><b>{s('watchHead')}</b><span class="meta">{s('watchNote')}</span></p>
        <button type="button" class="btn" class:sky={!played} class:paper={played} data-sfx="tick" data-en-watch-all onclick={() => ((watched = true), player?.play(0, null))}>
          <Icon name="play" />{played ? s('watchAgain') : s('watchAll', { dur: durText(clip.dur) })}
        </button>
      </article>
    {:else if bank !== 'ready'}
      <article class="card pad" data-en-bank={bank} aria-live="polite">
        {#if bank === 'loading'}<p class="meta">{s('loading')}</p>
        {:else}
          <p>{navigator.onLine ? s('bankFailed') : s('bankOffline')}</p>
          <button type="button" class="btn small paper" data-sfx="tick" data-en-bank-retry onclick={fetchBank}>{s('retryBank')}</button>
        {/if}
      </article>
    {:else if q && cur}
      {#key at}
        <article class="card pad q" data-en-q={at} data-en-qid={q.id} data-result={cur.r?.k ?? 'open'}>
          <div class="qhead">
            <p class="meta">{s('qMeta', { i: at + 1, n: len, type: s(`skill.${q.skill}`) })}{#if q.level === 'C2'}{' '}<span class="tag hard" data-en-hard-tag>{s('hardTag')}</span>{/if}</p>
            {#if q.choicesJa && !cur.r && !FORM.has(q.skill)}
              <button type="button" class="chip s" aria-pressed={tr} aria-label={s('trLabel')} data-sfx="tick" data-en-tr={tr ? 'on' : 'off'} onclick={() => (tr = !tr)}>{s('tr')}</button>
            {/if}
          </div>
          <p class="stem" lang="en"><b><KeyedText text={q.stem} /></b></p>
          {#if q.ja}<p class="meta" data-en-stem-ja>{q.ja}</p>{/if}
          {#if at === 0 && q.choices && !cur.r && !cur.miss}<p class="meta" data-en-howto>{s('howTo')}</p>{/if}
          <button type="button" class="btn small hear" class:sky={!cur.r} class:paper={!!cur.r} data-sfx="tick" data-en-hear onclick={() => seg(q)}><Icon name="play" size={18} />{s('hear')}</button>
          {#if q.choices}
            <div class="choices">
              {#each choiceOrder(q, seed) as i (i)}{@const c = q.choices[i]}{@const ja = cur.r || (tr && !FORM.has(q.skill)) ? q.choicesJa?.[i] : undefined}
                <button type="button" class="prow choice" class:ans={!!cur.r && i === q.a} lang="en" data-sfx="tick" data-choice={i} data-ans={(!!cur.r && i === q.a) || undefined}
                  aria-disabled={!!cur.r || undefined} onclick={() => !cur.r && choose(i)}><span class="prl">{c}{#if ja}<small lang="ja" data-en-choice-ja>{ja}</small>{/if}</span></button>
              {/each}
            </div>
          {:else}
            <input type="text" bind:value={typed} placeholder={s('typeHere')} autocapitalize="off" autocomplete="off" spellcheck="false" lang="en" data-en-dict />
            <button type="button" class="btn small paper" data-sfx="tick" data-en-dict-go onclick={() => ((fresh = 'reveal'), (st[at] = dictate(q, cur, typed)))}>{cur.r ? s('answerAgain') : s('answer')}</button>
          {/if}
          {#if !cur.r && cur.miss === 1}
            <div class="nudge" data-en-nudge {@attach (el) => untrack(() => intoView(el, 'nudge'))}><p>{s('nudge')}</p><p class="meta">{q.cue}</p>
              <button type="button" class="quiet" data-sfx="tick" data-en-show onclick={showAnswer}>{s('showAnswer')}</button></div>
          {/if}
          {#if cur.r}
            <div class="reveal" data-en-reveal={cur.r.k} {@attach (el) => untrack(() => intoView(el, 'reveal'))}>
              <p class="rhead">{head(cur)}</p>
              {#if cur.r.k === 'dict'}<p class="words" lang="en">{#each cur.r.words as w, i (i)}<span class:hit={w.hit} class:gap={!w.hit}>{w.w}</span>{' '}{/each}</p>{/if}
              {#if q.line}<p class="line" lang="en"><KeyedText text={q.line} /></p>{/if}
              <dl class="why"><dt>{s('mean')}</dt><dd>{q.mean}</dd></dl>
              <p class="phrase"><b>{s('use')}</b> <span lang="en">{q.use}</span></p>
              <!-- the deeper notes folded; open by themselves after a miss, when the trap matters most -->
              <details class="more" open={!clean(cur.r)} data-en-more>
                <summary data-sfx="tick">{s('details')}<Icon name="chevron-down" size={16} /></summary>
                <dl class="why">
                  <dt>{s('said')}</dt><dd data-en-said>{q.said}</dd>
                  <dt>{s('trap')}</dt><dd>{q.trap}</dd>
                </dl>
              </details>
            </div>
          {/if}
          <button type="button" class="quiet flag" aria-label={s('flagQRow')} data-sfx="open" data-en-flag={at} onclick={() => flag(at)}><Icon name="flag" size={14} />{s('flag')}</button>
        </article>
      {/key}
    {:else}
      <article class="card pad" data-en-end>
        <p class="lead"><b>{s('endHead')}</b><span class="meta">{s('endDone')}</span></p>
        {#if again.length}
          <p class="meta">{s('endAgain')}</p>
          <ul class="again">
            {#each again as i (i)}
              <li><button type="button" class="btn small paper seg" data-sfx="tick" data-en-again={i} onclick={() => seg(qs[i])}>
                <span class="at"><Icon name="play" size={16} />{s('seg', span(qs[i]))}</span><span class="ph" lang="en">{phrase(qs[i])}</span></button></li>
            {/each}
          </ul>
        {:else}<p data-en-all-first>{s('endAll')}</p>{/if}
        <button type="button" class="btn small paper" data-sfx="tick" data-en-rewatch onclick={() => player?.play(0, null)}><Icon name="play" size={18} />{s('endWatch')}</button>
        <button type="button" class="prow" data-sfx="open" data-en-end-phrases onclick={() => toStudy('phrases')}>
          <span class="prl">{s('phrases')}</span><Icon name="chevron-right" size={18} />
        </button>
      </article>
    {/if}
    {#if !study && (at === -1 || end)}<p class="credit">{s('credit', { credit: clip.credit })}</p>{/if}
  </div>
  <div class="foot" class:off={study}>
    {#if at === -1}
      <button type="button" class="btn" class:paper={!played} data-sfx="page" data-en-to-q onclick={() => go(0)}>{s('toQuestions')}<Icon name="chevron-right" /></button>
    {:else}
      <button type="button" class="btn paper" data-sfx="back" data-en-prev onclick={() => go(at - 1)}><Icon name="back" />{s('prev')}</button>
      {#if bank !== 'ready'}
        <span class="btn-gap"></span>
      {:else if at < len}
        <button type="button" class="btn" class:paper={!cur?.r} data-sfx="page" data-en-next onclick={() => go(at + 1)}>{at === len - 1 ? s('toEnd') : s('next')}<Icon name="chevron-right" /></button>
      {:else}
        <button type="button" class="btn" data-sfx="back" data-en-done onclick={onback}>{s('endHome')}</button>
      {/if}
    {/if}
  </div>
</section>
<StudySheet bind:open={tools} {player} onmode={captions} scenes={scenes ? { on: showScenes, toggle: toggleScenes } : undefined} lines={!!full?.lines?.length} ongo={fromTools} credit={clip.credit} />
<FlagSheet bind:open={flagOpen} {clip} q={flagQ === null ? null : (qs[flagQ] ?? null)} n={flagQ} time={() => (player ? player.now() : null)} onback={viaTools && flagQ === null ? toTools : null} />

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 10px; padding: 12px calc(12px + var(--safe-right)) 16px calc(12px + var(--safe-left)); scrollbar-width: none; }
  .card { position: relative; flex: none; display: grid; gap: 8px; }
  .card p { margin: 0; }
  .meta { font-size: var(--fs-s); color: var(--text-soft); }
  .tag.hard { padding: 0 7px; margin-left: 2px; }
  .lead b { display: block; }
  .stem { font-size: var(--fs-body); line-height: 1.45; }
  /* a question card: as tight as it reads, so the choices and ⚑ are above the fold (393×852 all; 375×667 two at least) */
  .q { gap: 6px; }
  .qhead { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  /* (訳 drawn over the card's padding: the row as tall as its meta, the chip's hit 44 all the same) */
  .qhead .chip { margin: -7px 0; }
  .hear:not(.paper) { width: 100%; justify-self: stretch; justify-content: center; }
  /* ⚑ at the card's foot: quiet, out of the way of the stem and the choices */
  .quiet.flag { justify-self: end; display: inline-flex; align-items: center; gap: 3px; margin: -4px -4px -8px 0; padding: 0 8px; font: 700 var(--fs-s)/1 var(--font-ui); }
  .btn { margin: 0; }
  .btn.small { justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
  .choices { display: grid; gap: 6px; }
  .choice[aria-disabled='true'] { cursor: default; }
  .choice.ans { box-shadow: inset 0 0 0 2.5px var(--c-leaf), var(--sh-ctl); }
  .choice.ans .prl::before { content: '○ '; color: var(--c-leaf-text); font-weight: 700; }
  input { font-size: var(--fs-input); padding: 10px 12px; border-radius: var(--r-row); border: 2px solid var(--c-edge); background: var(--c-card); color: var(--c-ink); }
  .nudge { display: grid; gap: 4px; padding: 10px 12px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); color: var(--c-ink); }
  .nudge .meta { color: inherit; }
  .quiet { padding: 0 4px; justify-self: start; }
  .nudge .quiet { color: var(--c-ink-soft); text-decoration: underline; }
  .reveal, .nudge, .choice { scroll-margin-top: 8px; }
  .reveal { display: grid; gap: 6px; padding: 12px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); color: var(--c-ink); }
  .rhead { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--c-leaf-text); }
  .line { font-style: italic; }
  .words .hit { text-decoration: underline 2px var(--c-leaf); text-underline-offset: 3px; }
  .words .gap { color: var(--c-leaf-text); font-weight: 700; }
  .why { margin: 0; display: grid; gap: 2px; font-size: var(--fs-body); }
  .why dt { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); }
  .why dd { margin: 0 0 4px; }
  .phrase { padding: 8px 10px; border-radius: var(--r-row); background: var(--c-card); font-size: var(--fs-body); }
  .phrase b { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); margin-right: 4px; }
  .more summary { display: flex; align-items: center; gap: 4px; min-height: var(--hit); margin: -6px 0; list-style: none; cursor: pointer;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink-soft); -webkit-tap-highlight-color: transparent; }
  .more summary::-webkit-details-marker { display: none; }
  .more[open] summary :global(svg) { rotate: 180deg; }
  .more[open] .why { margin-top: 6px; }
  .again { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .seg { width: 100%; justify-content: flex-start; text-align: left; flex-wrap: wrap; height: auto; padding: 8px 14px; }
  .at { display: inline-flex; align-items: center; gap: 6px; }
  .ph { color: var(--text-soft); font-size: var(--fs-s); }
  .prow :global(svg) { flex: none; color: var(--text-soft); }
  .credit { margin: 4px 4px 0; font-size: var(--fs-s); color: var(--text-soft); }
  .foot { flex: none; display: flex; gap: 10px; padding: 10px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 10px) calc(12px + var(--safe-left)); background: var(--surface); }
  .foot .btn, .foot .btn-gap { flex: 1; }
  .foot.off { display: none; }
  @media (max-height: 700px) {
    .body { padding-top: 8px; }
    .choice { min-height: 46px; }
  }
</style>
