<script lang="ts">
  // A clip's lesson (docs/english.md "The page"): the player pinned on top, then the watch card (a suggestion: 質問へ
  // always works), the questions in order and まとめ; ‹ 前へ / 次へ › at the foot, never locked. A miss replays the
  // segment with the cue and a quiet 答えを見る; a second shows 「答えはこれ」. No red, no ×, no sound, no score.
  // The place is kept on this phone (session.ts). The study time (active.ts) goes into the `listen` rows: one when
  // まとめ is reached (once a day a clip), one for time not yet sent when the lesson is left (≥ 1 min).
  // It opens from the clip's index entry (the player and the watch card at once) and draws once its bank is in
  // (data.ts): till then the questions say 読み込み中…; a fetch that failed, why, and もう一度.
  import { onDestroy, untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Player from './Player.svelte';
  import Controls from './Controls.svelte';
  import FlagSheet from './FlagSheet.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { videoFocus } from '#lib/sound/sound.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { TV_GM } from '#lib/contract/listen.ts';
  import type { YtPlayer } from '../player.svelte.ts';
  import { againOf, answersOf, blank, dictate, heard, pick, reveal, type QState } from '../lesson.ts';
  import { choiceOrder, draw, historyOf, seedOf } from '../draw.ts';
  import { newActive, sent, tick, touched, type Active } from '../active.ts';
  import { loadSaved, partWay, save } from '../session.ts';
  import { bankNow, loadBank } from '../data.ts';
  import { harderOn } from '../prefs.ts';
  import { safeReload } from '#lib/ui-state/reload.ts';
  import { durText, s } from '../i18n.ts';
  import type { ClipMeta } from '../catalog.ts';
  import type { Clip, Question } from '../types.ts';
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
  const len = $derived(qs.length);
  /** The bank: 'ready' once drawn. */
  let bank = $state<'loading' | 'failed' | 'ready'>('loading');
  let fails = 0;
  /** −1 the watch card, a question's index, len まとめ. */
  let at = $state(resume ? saved!.at : -1);
  let st = $state<QState[]>([]);
  function begin(c: Clip): void {
    qs = resume ? saved!.ids.flatMap((id) => c.questions.filter((q) => q.id === id)) : draw(c, past.seen, play, seed, { harder: harderOn() });
    st = resume && qs.length === saved!.ids.length ? saved!.st : qs.map(blank);
    if (resume && qs.length !== saved!.ids.length) at = -1;
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
  let sentDay = $state<LocalDate | null>(saved?.sent ?? null);
  let act: Active = newActive(saved?.unsent ?? 0, resume ? saved!.perQ : {});
  let player = $state<YtPlayer>();
  let watched = $state(false);
  let flagQ = $state<number | null>(null);
  let flagOpen = $state(false);
  let body: HTMLElement | undefined = $state();

  const q = $derived<Question | null>(at >= 0 && at < len ? qs[at] : null);
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
  const now = () => ({ playing: player?.state === 'playing', visible: document.visibilityState === 'visible', q: at >= 0 && at < len ? at : null });
  const timer = setInterval(() => (act = tick(act, performance.now(), now())), 1000);
  function input() {
    act = touched(tick(act, performance.now(), now()), performance.now());
  }

  /** A `listen` row of this clip: finished (まとめ) or the minutes of one left part-way. */
  function writeRow(finished: boolean): void {
    act = tick(act, performance.now(), now());
    const ms = Math.round(Math.min(act.unsent, 3_600_000));
    const g = `tv${Date.now().toString(36).slice(-6)}${Math.floor(Math.random() * 1296).toString(36).padStart(2, '0')}`;
    week.send('listen', { d: today(), g, gm: TV_GM, u: clip.id, lv: 7, n: 1, ms, ...(finished && { f: 1 }), r: answersOf(qs, st) });
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
  const onHidden = () => document.visibilityState === 'hidden' && leaving();
  document.addEventListener('visibilitychange', onHidden);
  onDestroy(() => {
    videoFocus(false);
    clearInterval(timer);
    document.removeEventListener('visibilitychange', onHidden);
    player?.pause();
    leaving();
  });

  function go(n: number): void {
    at = Math.max(-1, bank === 'ready' ? Math.min(len, n) : Math.min(0, n));
    player?.pause();
    body?.scrollTo({ top: 0 });
    // まとめ reached: the day's row (once a day a clip; a re-watch another day counts again)
    if (at === len && sentDay !== today()) {
      sentDay = today();
      writeRow(true);
    }
  }
  const seg = (x: Question) => player?.play(x.seg[0], x.seg[1]);
  /** What the learner just did on this card ('reveal' or 'nudge'), so only that scrolls into view, not a card come
   *  back to. On an iPhone the notes sit under the choices, below the fold: they're brought up, the key row above. */
  let fresh = $state<'reveal' | 'nudge' | null>(null);
  const intoView = (el: HTMLElement, what: 'reveal' | 'nudge') => {
    if (fresh !== what) return;
    fresh = null;
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  function choose(i: number): void {
    if (!q || !cur) return;
    const r = pick(q, cur, i);
    fresh = r.st.r ? 'reveal' : r.replay ? 'nudge' : null;
    st[at] = r.st;
    if (r.replay) seg(q);
    // a predict's continuation, heard once it's settled
    else if (r.st.r && q.then) player?.play(q.then[0], q.then[1]);
  }
  let typed = $state('');
  $effect(() => {
    typed = untrack(() => cur?.typed ?? '');
    void at;
  });
  const keyed = (line: string) => line.split(/\*([^*]+)\*/g).map((t, i) => ({ t, key: i % 2 === 1 }));
  const head = (x: QState) => {
    const r = x.r!;
    return r.k === 'first' ? s('first') : r.k === 'second' ? s('second') : r.k === 'dict' ? s('heardWords', heard(r)) : s('shown');
  };
  const again = $derived(at === len ? againOf(qs, st) : []);
  const phrase = (x: Question) => x.use.split('（')[0];
  const flag = (i: number | null) => ((flagQ = i), (flagOpen = true));
</script>

<section class="screen" role="presentation" data-en-lesson={clip.id} data-en-at={at} onpointerdown={input} onkeydown={input}>
  <div class="top"><NavBar pad title={clip.title} {onback} {onclose} /></div>
  <Player video={clip.video} title={clip.title} bind:player />
  <Controls {player} seg={q?.seg ?? null} />
  <div class="body sheet-scroll" bind:this={body}>
    {#if at === -1}
      <article class="card pad" data-en-watch>
        <button type="button" class="flag" data-sfx="open" data-en-flag="clip" onclick={() => flag(null)}><Icon name="flag" size={14} />{s('flag')}</button>
        <p class="lead"><b>{s('watchHead')}</b><br /><span class="meta">{s('watchNote')}</span></p>
        <button type="button" class="btn sky" data-sfx="tick" data-en-watch-all onclick={() => ((watched = true), player?.play(0, null))}>
          {watched || player?.state === 'ended' ? s('watchAgain') : s('watchAll', { dur: durText(clip.dur) })}
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
        <article class="card pad" data-en-q={at} data-en-qid={q.id} data-result={cur.r?.k ?? 'open'}>
          <button type="button" class="flag" data-sfx="open" data-en-flag={at} onclick={() => flag(at)}><Icon name="flag" size={14} />{s('flag')}</button>
          <p class="meta">{s('qMeta', { i: at + 1, n: len, type: s(`skill.${q.skill}`), from: q.seg[0], to: q.seg[1] })}{#if (q.level as string) === 'C2'} <span class="tag hard" data-en-hard-tag>{s('hardTag')}</span>{/if}</p>
          <p class="stem" lang="en"><b>{q.stem}</b></p>
          <button type="button" class="btn sky small" data-sfx="tick" data-en-hear onclick={() => seg(q)}><Icon name="play" size={18} />{s('hear').replace('▶ ', '')}</button>
          {#if q.choices}
            <div class="choices">
              {#each choiceOrder(q, seed) as i (i)}{@const c = q.choices[i]}
                <button type="button" class="prow choice" class:ans={!!cur.r && i === q.a} lang="en" data-sfx="tick" data-choice={i} data-ans={(!!cur.r && i === q.a) || undefined}
                  aria-disabled={!!cur.r || undefined} onclick={() => !cur.r && choose(i)}><span class="prl">{c}</span></button>
              {/each}
            </div>
          {:else}
            <input type="text" bind:value={typed} placeholder={s('typeHere')} autocapitalize="off" autocomplete="off" spellcheck="false" lang="en" data-en-dict />
            <button type="button" class="btn small paper" data-sfx="tick" data-en-dict-go onclick={() => ((fresh = 'reveal'), (st[at] = dictate(q, cur, typed)))}>{cur.r ? s('answerAgain') : s('answer')}</button>
          {/if}
          {#if !cur.r && cur.miss === 1}
            <div class="nudge" data-en-nudge {@attach (el) => untrack(() => intoView(el, 'nudge'))}><p>{s('nudge')}</p><p class="meta">{q.cue}</p>
              <button type="button" class="quiet" data-sfx="tick" data-en-show onclick={() => ((fresh = 'reveal'), (st[at] = reveal(cur)))}>{s('showAnswer')}</button></div>
          {/if}
          {#if cur.r}
            <div class="reveal" data-en-reveal={cur.r.k} {@attach (el) => untrack(() => intoView(el, 'reveal'))}>
              <p class="rhead">{head(cur)}</p>
              {#if cur.r.k === 'dict'}<p class="words" lang="en">{#each cur.r.words as w, i (i)}<span class:hit={w.hit} class:gap={!w.hit}>{w.w}</span> {/each}</p>{/if}
              {#if q.line}<p class="line" lang="en">{#each keyed(q.line) as part, i (i)}{#if part.key}<u>{part.t}</u>{:else}{part.t}{/if}{/each}</p>{/if}
              <dl class="why">
                <dt>{s('said')}</dt><dd>{q.said}</dd>
                <dt>{s('mean')}</dt><dd>{q.mean}</dd>
                <dt>{s('trap')}</dt><dd>{q.trap}</dd>
              </dl>
              <p class="phrase"><b>{s('use')}</b> <span lang="en">{q.use}</span></p>
            </div>
          {/if}
        </article>
      {/key}
    {:else}
      <article class="card pad" data-en-end>
        <p class="lead"><b>{s('endHead')}</b></p>
        {#if again.length}
          <p class="meta">{s('endAgain')}</p>
          <ul class="again">
            {#each again as i (i)}
              <li><button type="button" class="btn small paper seg" data-sfx="tick" data-en-again={i} onclick={() => seg(qs[i])}>
                <span>{s('seg', { from: qs[i].seg[0], to: qs[i].seg[1] })}</span><span class="ph" lang="en">{phrase(qs[i])}</span></button></li>
            {/each}
          </ul>
        {:else}<p data-en-all-first>{s('endAll')}</p>{/if}
        <button type="button" class="btn sky" data-sfx="tick" data-en-rewatch onclick={() => player?.play(0, null)}>{s('endWatch')}</button>
      </article>
    {/if}
    <p class="credit">{s('credit', { credit: clip.credit })}</p>
  </div>
  <div class="foot">
    {#if at === -1}
      <button type="button" class="btn" data-sfx="page" data-en-to-q onclick={() => go(0)}>{s('toQuestions')}</button>
    {:else}
      <button type="button" class="btn paper" data-sfx="back" data-en-prev onclick={() => go(at - 1)}>{s('prev')}</button>
      {#if bank !== 'ready'}
        <span class="btn-gap"></span>
      {:else if at < len}
        <button type="button" class="btn" class:paper={!cur?.r} data-sfx="page" data-en-next onclick={() => go(at + 1)}>{at === len - 1 ? s('toEnd') : s('next')}</button>
      {:else}
        <button type="button" class="btn" data-sfx="back" data-en-done onclick={onback}>{s('endHome')}</button>
      {/if}
    {/if}
  </div>
</section>
<FlagSheet bind:open={flagOpen} {clip} q={flagQ === null ? null : (qs[flagQ] ?? null)} n={flagQ} time={() => (player ? player.now() : null)} />

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 10px; padding: 12px calc(12px + var(--safe-right)) 16px calc(12px + var(--safe-left)); scrollbar-width: none; }
  .card { position: relative; flex: none; display: grid; gap: 8px; }
  .card p { margin: 0; }
  .meta { font-size: var(--fs-s); color: var(--text-soft); }
  .tag.hard { padding: 0 7px; margin-left: 2px; }
  .lead, .stem { padding-right: 64px; }
  .stem { font-size: var(--fs-body); line-height: 1.45; }
  .flag { position: absolute; top: 6px; right: 6px; appearance: none; border: 0; background: none; display: inline-flex; align-items: center; gap: 3px; min-height: var(--hit);
    padding: 0 8px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); cursor: pointer; }
  .btn { margin: 0; }
  .btn.sky { --fill: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); --lip-c: var(--c-edge); color: var(--c-ink); }
  .btn.small { justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
  .choices { display: grid; gap: 8px; }
  .choice[aria-disabled='true'] { cursor: default; }
  .choice.ans { box-shadow: inset 0 0 0 2.5px var(--c-leaf), var(--sh-ctl); }
  .choice.ans .prl::before { content: '○ '; color: var(--c-leaf-text); font-weight: 700; }
  input { font-size: var(--fs-input); padding: 10px 12px; border-radius: var(--r-row); border: 2px solid var(--c-edge); background: var(--c-card); color: var(--c-ink); }
  .nudge { display: grid; gap: 4px; padding: 10px 12px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); color: var(--c-ink); }
  .nudge .meta { color: inherit; }
  .quiet { appearance: none; border: 0; background: none; color: var(--text-soft); font: inherit; font-size: var(--fs-s); padding: 10px 4px; cursor: pointer; justify-self: start; }
  .nudge .quiet { color: var(--c-ink-soft); text-decoration: underline; }
  .reveal, .nudge { scroll-margin-top: 72px; }
  .reveal { display: grid; gap: 6px; padding: 12px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); color: var(--c-ink); }
  .rhead { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--c-leaf-text); }
  .line { font-style: italic; }
  .line u { font-style: normal; font-weight: 700; text-decoration: underline 2px var(--c-leaf); text-underline-offset: 3px; }
  .words .hit { text-decoration: underline 2px var(--c-leaf); text-underline-offset: 3px; }
  .words .gap { color: var(--c-leaf-text); font-weight: 700; }
  .why { margin: 0; display: grid; gap: 2px; font-size: var(--fs-body); }
  .why dt { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); }
  .why dd { margin: 0 0 4px; }
  .phrase { padding: 8px 10px; border-radius: var(--r-row); background: var(--c-card); font-size: var(--fs-body); }
  .phrase b { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); margin-right: 4px; }
  .again { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .seg { width: 100%; justify-content: flex-start; text-align: left; flex-wrap: wrap; height: auto; padding: 8px 14px; }
  .ph { color: var(--text-soft); font-size: var(--fs-s); }
  .credit { margin: 4px 4px 0; font-size: 12px; color: var(--text-soft); }
  .foot { flex: none; display: flex; gap: 10px; padding: 10px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 10px) calc(12px + var(--safe-left)); background: var(--surface); }
  .foot .btn, .foot .btn-gap { flex: 1; }
</style>
