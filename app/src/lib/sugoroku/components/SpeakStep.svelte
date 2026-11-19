<script lang="ts">
  // 英語すごろく's speaking step (docs/sugoroku.md "Speaking"), after a 絵 turn's answer, before 次へ, always skippable:
  // 「この絵で一文言ってみよう」 (+2): 話す (tap to record, tap to stop, 10 s at most: lib/speech/stt.ts) or 書く →
  // 聞こえた文, editable (これでOK; もう一回 twice, then the keyboard) → the feedback: their sentence, 「こう言うともっと
  // 自然」 with the recast, the tip folded, praise. /grade is asked as soon as the words arrive (again only if edited), and
  // never waited on with a label: the stars come at これでOK, the recast slides in, nothing after GRADE_WAIT_MS (praise
  // only). Its own chunk (PictureTurn imports it only with the switch on). Never red, ×, % or 間違い. Online, its state
  // and words go to the others at the table (`onview`: never kept), and a phone watching shows the player's (`mirror`:
  // read-only, 録音中… for the take).
  import Icon from '#lib/components/ui/Icon.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { log } from '#lib/sync/log.ts';
  import { Recorder } from '#lib/speech/recorder.svelte.ts';
  import { transcribe, warmStt } from '#lib/speech/stt.ts';
  import { micFocus } from '#lib/sound/sound.svelte.ts';
  import { grade, type Grade, type Graded } from '#lib/speech/grade.ts';
  import { s } from '../i18n.ts';
  import type { Level } from '../game.ts';
  import type { SpeakView } from '../view.ts';
  import { check, cheerOf, diffWords, nextCheer, FRAMES, GRADE_WAIT_MS, HARD_WORDS, longEnough, noteTip, onlySmall, recastOf, RESAYS, saidStars, say, tipOpens, tipsOf } from '../speak.ts';

  interface Props {
    /** The picture's English (the word the sentence should use). */
    target: string;
    level: Level;
    /** The game and seat (the tip opens by itself at most once in three sentences, each player's own). */
    tipKey: string;
    /** The step started (the picture's result folds to a line). */
    onengage?: () => void;
    /** 次へ: the stars the sentence earned (0: skipped or not on task). */
    onnext?: (said: number) => void;
    /** Online, my turn: the step as it is now, for the others to watch. */
    onview?: (v: SpeakView) => void;
    /** Online, another's turn: theirs as their sheet shows it (read-only). */
    mirror?: SpeakView | null;
  }
  let { target, level, tipKey, onengage = () => {}, onnext = () => {}, onview, mirror = null }: Props = $props();

  /** What the screen shows (and the others at the table watch): `text` the field's words on the 聞こえた文 screen, the
   *  sentence said on the feedback's; `heard` whether the words came from the mic; the recast, tip and other way as
   *  shown once settled. A watching phone's is the player's (`mirror`). */
  let v = $state<SpeakView>({
    phase: 'ask', typed: false, heard: false, note: '', resays: 0, settled: false, graded: false, tipOpen: false, resaid: false,
    stars: 0, cheer: -1, text: '', recast: '', tip: '', also: ''
  });
  $effect.pre(() => void (mirror && (v = { ...mirror })));
  $effect(() => void onview?.($state.snapshot(v)));

  /** The words as heard (what an edit is told from), the sentence confirmed and its grade (null: none yet or coming). */
  let raw = '', said = '';
  let graded: Grade | null = null;
  /** 🎤 takes this sentence; saying the recast again after a tip (+1). */
  let takes = 0, resaying = false;
  let field = $state<HTMLInputElement | null>(null);
  /** The step's height never shrinks while it's on (the sheet's height is the board's inset: each change moves the
   *  camera; a shorter phase, the take or a folded tip, leaves the room as it was). */
  let h = $state(0), floor = $state(0);
  $effect(() => void (h > floor && (floor = h)));
  // the log's line for the step (sg.grade: never the text)
  let edited = false, err: string | undefined, layer: 'task' | 'wasei' | 'ai' | 'none' = 'none', ms = 0, tStop = 0;

  const rec = new Recorder(() => void stop());
  /** /grade asked for one text (at `t0`): its answer, once in. */
  let ask: { text: string; p: Promise<Graded>; r: Graded | null; t0: number } | null = null;
  $effect(() => () => (rec.close(), micFocus(false)));
  // (the relay readied as the step opens, for the player's phone: the take's upload one round trip)
  $effect(() => void (!mirror && warmStt()));

  function prefetch(t: string) {
    if (ask?.text === t) return ask;
    const a: NonNullable<typeof ask> = { text: t, p: grade(t, target, rec.signal), r: null, t0: performance.now() };
    a.p.then((r) => (a.r = r));
    return (ask = a);
  }

  async function mic() {
    if (v.phase === 'rec') return stop();
    if (v.phase === 'stt' || rec.phase !== 'idle') return;
    onengage();
    v.note = '';
    // the island's sound paused and the audio session one that allows the mic, in this tap, before the mic is asked for
    micFocus(true);
    const t = await rec.start();
    if (!t) return;
    if (t !== true) return void (micFocus(false), (v.note = 'denied'), (err = 'denied'), toType());
    v.phase = 'rec';
    takes++;
  }
  async function stop() {
    if (v.phase !== 'rec') return;
    v.phase = 'stt';
    const p = await rec.stop();
    if (!p) return;
    tStop = p.t0;
    micFocus(false);
    const r = await transcribe(p.pcm.pcm, tStop, rec.signal);
    if (rec.signal.aborted) return;
    rec.idle();
    v.typed = false;
    if (!r.ok) {
      err = r.miss;
      v.note = 'missed';
      return toType();
    }
    raw = v.text = r.text.trim();
    v.heard = !!raw;
    v.note = check(raw, target) === 'again' ? 'again' : '';
    // (asked for while they read it: unchanged, the answer is often in by これでOK)
    if (v.note !== 'again' && !resaying) prefetch(raw);
    v.phase = 'confirm';
    // (the re-says used: the keyboard)
    if (v.resays >= RESAYS) focusField();
  }
  function toType() {
    onengage();
    v.typed = true;
    if (!resaying && v.phase !== 'confirm') v.text = '';
    v.phase = 'confirm';
    focusField();
  }
  const focusField = () => queueMicrotask(() => field?.focus());
  function again() {
    v.resays++;
    void mic();
  }
  /** The feedback shows the sentence said. */
  const toFeedback = () => ((v.text = said), (v.phase = 'feedback'));

  async function confirm() {
    const t = v.text.trim();
    if (!t) return focusField();
    // the relay's `used` credits a misheard word too, if its answer is in
    const used = ask?.text === t && ask.r?.ok ? ask.r.grade.used : false;
    const c = check(t, target, used);
    if (c !== 'ok') {
      v.note = c;
      layer = 'task';
      return focusField();
    }
    v.note = '';
    if (resaying) {
      resaying = false;
      v.resaid = true;
      v.stars = saidStars(true, true);
      return toFeedback();
    }
    edited = !v.typed && t !== raw;
    if (v.typed) tStop = performance.now();
    said = t;
    graded = null;
    Object.assign(v, { stars: saidStars(true, false), graded: false, cheer: -1, settled: false, recast: '', tip: '', also: '' });
    toFeedback();
    // (GRADE_WAIT_MS from when it was asked for, the words' arrival: the relay's slow tail never holds the sheet; an
    // answer after it is let go, never swapped in late)
    const a = prefetch(t);
    const r = await Promise.race([a.p, new Promise<null>((done) => setTimeout(done, Math.max(0, GRADE_WAIT_MS - (performance.now() - a.t0)), null))]);
    if (rec.signal.aborted || said !== t) return;
    ms = Math.round(performance.now() - tStop);
    if (r?.ok) {
      const g = (graded = r.grade);
      const recast = recastOf(t, g);
      // the tip shown: one there is, and at やさしい not for an article or an -s alone (Whisper changes those itself)
      const tip = g.tip && !(level === 1 && recast && onlySmall(t, recast)) ? g.tip : '';
      const open = !!tip && tipOpens(tipsOf(tipKey));
      if (tip) noteTip(tipKey, open);
      Object.assign(v, { graded: true, recast, tip, also: g.also, tipOpen: open, cheer: g.verdict === 'great' ? nextCheer() : -1 });
      layer = g.src;
      err = undefined;
    } else {
      layer = 'none';
      err = r ? r.miss : 'timeout';
    }
    v.settled = true;
  }

  const diff = $derived(v.phase === 'feedback' && v.recast ? diffWords(v.text, v.recast) : null);
  /** The one leaf action: 次へ once the sentence is said (the feedback), else the step's own (話す, これでOK). */
  const done = $derived(v.phase === 'feedback');

  function resay() {
    resaying = true;
    v.resays = 0;
    if (v.typed) return toType();
    v.text = '';
    void mic();
  }
  function next() {
    rec.cancel();
    if (v.phase !== 'ask' || err)
      log('sg.grade', {
        layer, verdict: graded?.verdict ?? 'none', ms, takes, edited, resaid: v.resaid,
        ...(err ? { err: (['denied', 'off', 'capped', 'network', 'ai', 'timeout'].includes(err) ? err : 'other') as 'other' } : {})
      });
    onnext(v.stars);
  }
</script>

<div class="speak" data-sg-speak={v.phase} bind:offsetHeight={h} style:min-height={floor ? `${floor}px` : undefined}>
  {#if v.phase === 'ask'}
    <div class="ask card">
      <p class="q"><Icon name="mic" size={18} />{say('ask')}<span class="tag plus">{say('stars', { n: 2 })}</span></p>
      {#if level === 1}<p class="hint" lang="en"><span class="lab">{say('frames')}</span>{FRAMES.join(' / ')}</p>
      {:else if level === 3}<p class="hint"><Phrases text={say('hard', { n: HARD_WORDS })} /></p>{/if}
      <div class="row2">
        <button type="button" class="btn small" data-sfx="none" data-sg-say onclick={mic}><Icon name="mic" size={20} />{say('say')}</button>
        <button type="button" class="btn small paper" data-sfx="tick" data-sg-type onclick={toType}><Icon name="keyboard" size={20} />{say('type')}</button>
      </div>
    </div>
  {:else if v.phase === 'rec' || v.phase === 'stt'}
    <button type="button" class="btn" class:rec={v.phase === 'rec'} aria-disabled={v.phase === 'stt'} data-sfx="none" data-sg-stop onclick={mic}>
      {#if v.phase === 'stt'}<Icon name="mic" size={20} />{/if}{v.phase === 'rec' ? (mirror ? say('recording') : say('stop', { s: rec.secs.toFixed(1) })) : say('listening')}
    </button>
  {:else if v.phase === 'confirm'}
    <form class="confirm card" data-kb-scroll onsubmit={(e) => (e.preventDefault(), confirm())}>
      <label class="lab" for="sg-said">{v.typed && !v.heard ? say('typeHere') : say('heard')}</label>
      <input id="sg-said" class="input said" readonly={!!mirror} lang="en" type="text" bind:this={field} bind:value={v.text} maxlength="200" autocomplete="off" autocapitalize="sentences"
        spellcheck="false" enterkeyhint="done" data-sg-said />
      {#if v.note}<p class="note" aria-live="polite" data-sg-note={v.note}><Phrases text={v.note === 'again' ? say('silence') : v.note === 'target' ? say('useWord', { w: target })
        : v.note === 'verb' ? say('addVerb') : v.note === 'denied' ? say('denied') : v.note === 'missed' ? say('missed') : ''} /></p>
      {:else if !v.typed}<p class="soft"><Phrases text={say('editNote')} /></p>{/if}
      <div class="row2">
        <button type="submit" class="btn small" data-sfx="confirm" data-sg-ok>{say('ok')}</button>
        {#if !v.typed && v.resays < RESAYS && v.note !== 'denied'}
          <button type="button" class="btn small paper" data-sfx="none" data-sg-again onclick={again}><Icon name="mic" size={20} />{say('again')}</button>
        {/if}
      </div>
    </form>
  {:else}
    <div class="fb card" data-sg-feedback={v.settled ? (v.graded ? 'graded' : 'praise') : 'wait'}>
      <p class="mine" class:shimmer={!v.settled} lang="en" data-sg-mine>
        {#if diff}{#each diff.mine as w, i (i)}<span class:chg={w.changed}>{w.w}</span>{' '}{/each}{:else}{v.text}{/if}
      </p>
      {#if v.settled}
        {#if v.recast && diff}
          <p class="lab">{say('better')}</p>
          <p class="better" lang="en" data-sg-recast>{#each diff.better as w, i (i)}{#if w.changed}<b>{w.w}</b>{:else}{w.w}{/if}{' '}{/each}</p>
        {:else}
          <p class="praise" data-sg-praise>{cheerOf(v.cheer) || say('praise')}</p>
        {/if}
        {#if v.also}<p class="lab">{say('also')}</p><p class="better" lang="en" data-sg-also>{v.also}</p>{/if}
        {#if v.tip}
          <button type="button" class="btn small paper tipbtn" aria-expanded={v.tipOpen} data-sfx="tick" data-sg-tip onclick={() => (v.tipOpen = !v.tipOpen)}>
            <Icon name="bulb" size={18} />{say('tip')}<Icon name={v.tipOpen ? 'chevron-up' : 'chevron-down'} size={16} />
          </button>
          {#if v.tipOpen}<p class="tip" data-sg-tip-text><Phrases text={v.tip} /></p>{/if}
        {/if}
        {#if !longEnough(v.text, level)}<p class="soft"><Phrases text={say('longer', { n: HARD_WORDS })} /></p>{/if}
      {/if}
      <div class="foot">
        <span class="pts" data-sg-said-stars={v.stars}><Icon name="star" size={18} soft /><b>+{v.stars}</b>{#if v.resaid}<span class="resaid" data-sg-resaid>{say('resaid')}</span>{/if}</span>
        {#if v.settled && v.recast && !v.resaid}
          <button type="button" class="btn small paper" data-sfx="tick" data-sg-resay onclick={resay}><Icon name={v.typed ? 'keyboard' : 'mic'} size={20} />{say('resay')}</button>
        {/if}
      </div>
    </div>
  {/if}
  <button type="button" class="btn next" class:paper={!done} data-sfx="confirm" data-sg-next onclick={next}>{s('next')}</button>
</div>

<style>
  .speak { display: flex; flex-direction: column; gap: 8px; }
  .speak .next { margin-top: auto; }
  .card { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: var(--r-row); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); }
  .q { display: flex; align-items: center; gap: 6px; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .plus { margin-left: auto; }
  .hint { margin: 0; font: 500 var(--fs-s)/1.4 var(--font-body); color: var(--text-soft); }
  .hint .lab { margin-right: 6px; }
  .lab { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .row2 { display: flex; gap: 8px; }
  .row2 .btn { flex: 1; min-width: 0; gap: 6px; }
  /* (the kit's field; the sentence in the body font, as typed English) */
  .said { font: 600 17px/1.3 var(--font-body); }
  .note { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink); text-wrap: pretty; }
  .soft { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .mine { margin: 0; font: 600 17px/1.4 var(--font-body); text-wrap: pretty; }
  /* a changed word: a soft yuzu underline, never red */
  .chg { text-decoration: underline 3px color-mix(in srgb, var(--c-yuzu) 85%, transparent); text-underline-offset: 4px; }
  .shimmer { animation: shimmer 1.2s ease-in-out infinite alternate; }
  @keyframes shimmer { from { opacity: 1; } to { opacity: .55; } }
  .better { margin: 0; font: 500 17px/1.4 var(--font-body); text-wrap: pretty; }
  .better b { font-weight: 800; }
  .praise { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .tipbtn { align-self: flex-start; gap: 4px; margin: 0; }
  .tip { margin: 0; font: 500 var(--fs-s)/1.5 var(--font-body); text-wrap: pretty; }
  .foot { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  .foot .btn { margin-left: auto; gap: 6px; }
  .pts { display: inline-flex; align-items: center; gap: 4px; color: var(--c-gold); }
  .pts b { font: 600 20px/1 var(--font-num); color: var(--c-ink); }
  .resaid { margin-left: 4px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink); }
</style>
