<script lang="ts">
  // 英語すごろく's speaking step (docs/sugoroku.md "Speaking"), after a 絵 turn's answer, before 次へ, always skippable:
  // 「この絵で一文言ってみよう」 (+2): 話す (tap to record, tap to stop, 10 s at most: lib/speech/stt.ts) or 書く →
  // 聞こえた文, editable (これでOK; もう一回 twice, then the keyboard) → the feedback: their sentence, 「こう言うともっと
  // 自然」 with the recast, the tip folded, praise. /grade is asked as soon as the words arrive (again only if edited), and
  // never waited on with a label: the stars come at これでOK, the recast slides in, nothing after GRADE_WAIT_MS (praise
  // only). Its own chunk (PictureTurn imports it only with the switch on). Never red, ×, % or 間違い. Online, its state
  // and words go to the others at the table (`onview`: never kept), and a phone watching shows the player's (`mirror`:
  // read-only, 録音中… for the take).
  import { untrack } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { log } from '#lib/sync/log.ts';
  import { MAX_S, record, transcribe, type Take } from '#lib/speech/stt.ts';
  import { micFocus } from '#lib/sound/sound.svelte.ts';
  import { grade, type Graded } from '../grade.ts';
  import { s } from '../i18n.ts';
  import type { Level } from '../game.ts';
  import type { SpeakView } from '../view.ts';
  import { check, cheerOf, diffWords, nextCheer, FRAMES, GRADE_WAIT_MS, HARD_WORDS, longEnough, noteTip, onlySmall, recastOf, RESAYS, saidStars, say, tipOpens, tipsOf, type Check, type Grade } from '../speak.ts';

  interface Props {
    /** The picture's English (the word the sentence should use). */
    target: string;
    level: Level;
    /** The game and seat (the tip opens by itself at most once in three sentences, each player's own). */
    tipKey: string;
    /** The step started (the picture's result folds to a line). */
    onengage: () => void;
    /** 次へ: the stars the sentence earned (0: skipped or not on task). */
    onnext: (said: number) => void;
    /** Online, my turn: the step as it is now, for the others to watch. */
    onview?: (v: SpeakView) => void;
    /** Online, another's turn: theirs as their sheet shows it. */
    mirror?: SpeakView | null;
  }
  let { target, level, tipKey, onengage, onnext, onview, mirror = null }: Props = $props();

  type Phase = 'ask' | 'rec' | 'stt' | 'confirm' | 'feedback';
  let phase = $state<Phase>('ask');
  let secs = $state(0);
  /** The words as heard (or ''), and the field's (what これでOK sends). */
  let raw = $state('');
  let text = $state('');
  let typed = $state(false);
  /** The note on the 聞こえた文 screen: why not yet (no sentence heard, the word missing, no verb), or the mic's miss. */
  let note = $state<Check | 'denied' | 'missed' | null>(null);
  /** 🎤 takes this sentence; re-says on the confirm screen. */
  let takes = 0, resays = $state(0);
  /** The sentence confirmed, its grade (null: none yet or none coming), and whether the feedback has settled. */
  let said = $state('');
  let graded = $state.raw<Grade | null>(null);
  let settled = $state(false);
  /** A great sentence's cheer (the phone's: the relay's tip is empty then; speak.ts cheerOf, -1 none). */
  let cheer = $state(-1);
  let onTask = $state(false);
  /** Saying the recast again after a tip (+1). */
  let resaying = $state(false), resaid = $state(false);
  let tipOpen = $state(false);
  let field = $state<HTMLInputElement | null>(null);
  /** The step's height never shrinks while it's on (the sheet's height is the board's inset: each change moves the
   *  camera; a shorter phase, the take or a folded tip, leaves the room as it was). */
  let h = $state(0), floor = $state(0);
  $effect(() => void (h > floor && (floor = h)));
  // the log's line for the step (sg.grade: never the text)
  let edited = false, err: string | undefined, layer: 'task' | 'wasei' | 'ai' | 'none' = 'none', ms = 0, tStop = 0;

  let take: Take | null = null;
  let timer: ReturnType<typeof setInterval> | undefined;
  /** /grade asked for one text (at `t0`): its answer, once in. */
  let ask: { text: string; p: Promise<Graded>; r: Graded | null; t0: number } | null = null;
  const abort = new AbortController();
  $effect(() => () => (clearInterval(timer), take?.cancel(), micFocus(false), abort.abort()));

  const lv = untrack(() => level);
  function prefetch(t: string) {
    if (ask?.text === t) return ask;
    const a: NonNullable<typeof ask> = { text: t, p: grade(t, target, lv, abort.signal), r: null, t0: performance.now() };
    a.p.then((r) => (a.r = r));
    return (ask = a);
  }

  /** The mic asked for and not yet answered (the permission's prompt): further taps wait. */
  let asking = false;
  async function mic() {
    if (phase === 'rec') return stop();
    if (phase === 'stt' || asking) return;
    onengage();
    note = null;
    // the island's sound paused and the audio session one that allows the mic, in this tap, before the mic is asked for
    micFocus(true);
    asking = true;
    const t = await record(abort.signal);
    asking = false;
    if (abort.signal.aborted) return;
    if ('miss' in t) return void (micFocus(false), (note = 'denied'), (err = 'denied'), toType());
    take = t;
    phase = 'rec';
    secs = 0;
    takes++;
    const t0 = performance.now();
    timer = setInterval(() => {
      secs = (performance.now() - t0) / 1000;
      if (secs >= MAX_S) void stop();
    }, 100);
  }
  async function stop() {
    if (!take || phase !== 'rec') return;
    clearInterval(timer);
    const t = take;
    take = null;
    phase = 'stt';
    tStop = performance.now();
    const p = await t.stop();
    micFocus(false);
    const r = await transcribe(p.pcm, tStop, abort.signal);
    if (abort.signal.aborted) return;
    typed = false;
    if (!r.ok) {
      err = r.miss;
      note = 'missed';
      return toType();
    }
    raw = text = r.text.trim();
    note = check(raw, target) === 'again' ? 'again' : null;
    // (asked for while they read it: unchanged, the answer is often in by これでOK)
    if (note !== 'again' && !resaying) prefetch(raw);
    phase = 'confirm';
    // (the re-says used: the keyboard)
    if (resays >= RESAYS) focusField();
  }
  function toType() {
    onengage();
    typed = true;
    if (!resaying && phase !== 'confirm') text = '';
    phase = 'confirm';
    focusField();
  }
  const focusField = () => queueMicrotask(() => field?.focus());
  function again() {
    resays++;
    void mic();
  }

  async function confirm() {
    const t = text.trim();
    if (!t) return focusField();
    // the relay's `used` credits a misheard word too, if its answer is in
    const used = ask?.text === t && ask.r?.ok ? ask.r.grade.used : false;
    const c = check(t, target, used);
    if (c !== 'ok') {
      note = c;
      layer = 'task';
      return focusField();
    }
    note = null;
    if (resaying) return void ((resaid = true), (resaying = false), (phase = 'feedback'));
    edited = !typed && t !== raw;
    if (typed) tStop = performance.now();
    said = t;
    onTask = true;
    graded = null;
    cheer = -1;
    settled = false;
    phase = 'feedback';
    // (GRADE_WAIT_MS from when it was asked for, the words' arrival: the relay's slow tail never holds the sheet; an
    // answer after it is let go, never swapped in late)
    const a = prefetch(t);
    const r = await Promise.race([a.p, new Promise<null>((done) => setTimeout(done, Math.max(0, GRADE_WAIT_MS - (performance.now() - a.t0)), null))]);
    if (abort.signal.aborted || said !== t) return;
    ms = Math.round(performance.now() - tStop);
    if (r?.ok) {
      graded = r.grade;
      cheer = r.grade.verdict === 'great' ? nextCheer() : -1;
      layer = r.grade.src;
      err = undefined;
      const tip = shownTip;
      tipOpen = !!tip && tipOpens(tipsOf(tipKey));
      if (tip) noteTip(tipKey, tipOpen);
    } else {
      layer = 'none';
      err = r ? r.miss : 'timeout';
    }
    settled = true;
  }

  const recast = $derived(mirror ? mirror.recast : recastOf(said, graded));
  const diff = $derived(recast ? diffWords(said, recast) : null);
  /** The tip shown: one there is, and at やさしい not for an article or an -s alone (Whisper changes those itself). */
  const shownTip = $derived(mirror ? mirror.tip : graded?.tip && !(level === 1 && recast && onlySmall(said, recast)) ? graded.tip : '');
  const also = $derived(mirror ? mirror.also : (graded?.also ?? ''));
  const stars = $derived(mirror ? mirror.stars : saidStars(onTask, resaid));
  // online: the step as it is, sent (my turn: its words too, never kept), or the player's shown (another's)
  $effect(() => void onview?.({
    phase, typed, heard: !!raw, note: note ?? '', resays, settled, graded: !!graded, tipOpen, resaid, stars, cheer,
    text: phase === 'confirm' ? text : said, recast, tip: shownTip, also
  }));
  $effect.pre(() => {
    const m = mirror;
    if (!m) return;
    untrack(() => {
      (phase = m.phase), (typed = m.typed), (raw = m.heard ? '-' : ''), (note = m.note || null), (resays = m.resays);
      (settled = m.settled), (tipOpen = m.tipOpen), (resaid = m.resaid), (cheer = m.cheer);
      if (m.phase === 'confirm') text = m.text;
      else said = m.text;
    });
  });

  function resay() {
    resaying = true;
    resays = 0;
    if (typed) return toType();
    text = '';
    void mic();
  }
  function next() {
    take?.cancel();
    take = null;
    clearInterval(timer);
    if (phase !== 'ask' || err)
      log('sg.grade', {
        layer, verdict: graded?.verdict ?? 'none', ms, takes, edited, resaid,
        ...(err ? { err: (['denied', 'off', 'capped', 'network', 'ai', 'timeout'].includes(err) ? err : 'other') as 'other' } : {})
      });
    onnext(stars);
  }
</script>

<div class="speak" data-sg-speak={phase} bind:offsetHeight={h} style:min-height={floor ? `${floor}px` : undefined}>
  {#if phase === 'ask'}
    <div class="ask card">
      <p class="q"><Icon name="mic" size={18} />{say('ask')}<span class="plus">{say('stars', { n: 2 })}</span></p>
      {#if level === 1}<p class="hint" lang="en"><span class="lab">{say('frames')}</span>{FRAMES.join(' / ')}</p>
      {:else if level === 3}<p class="hint">{say('hard', { n: HARD_WORDS })}</p>{/if}
      <div class="row2">
        <button type="button" class="btn small" data-sfx="none" data-sg-say onclick={mic}><Icon name="mic" size={20} />{say('say')}</button>
        <button type="button" class="btn small paper" data-sfx="tick" data-sg-type onclick={toType}><Icon name="keyboard" size={20} />{say('type')}</button>
      </div>
    </div>
  {:else if phase === 'rec' || phase === 'stt'}
    <button type="button" class="btn rec" class:wait={phase === 'stt'} aria-disabled={phase === 'stt'} data-sfx="none" data-sg-stop onclick={mic}>
      <Icon name="mic" size={20} />{phase === 'rec' ? (mirror ? say('recording') : say('stop', { s: secs.toFixed(1) })) : say('listening')}
    </button>
  {:else if phase === 'confirm'}
    <form class="confirm card" data-kb-scroll onsubmit={(e) => (e.preventDefault(), confirm())}>
      <label class="lab" for="sg-said">{typed && !raw ? say('typeHere') : say('heard')}</label>
      <input id="sg-said" class="said" readonly={!!mirror} lang="en" type="text" bind:this={field} bind:value={text} maxlength="200" autocomplete="off" autocapitalize="sentences"
        spellcheck="false" enterkeyhint="done" data-sg-said />
      {#if note}<p class="note" aria-live="polite" data-sg-note={note}>{note === 'again' ? say('silence') : note === 'target' ? say('useWord', { w: target })
        : note === 'verb' ? say('addVerb') : note === 'denied' ? say('denied') : note === 'missed' ? say('missed') : ''}</p>
      {:else if !typed}<p class="soft">{say('editNote')}</p>{/if}
      <div class="row2">
        <button type="submit" class="btn small" data-sfx="confirm" data-sg-ok>{say('ok')}</button>
        {#if !typed && resays < RESAYS && note !== 'denied'}
          <button type="button" class="btn small paper" data-sfx="none" data-sg-again onclick={again}><Icon name="mic" size={20} />{say('again')}</button>
        {/if}
      </div>
    </form>
  {:else}
    <div class="fb card" data-sg-feedback={settled ? ((mirror ? mirror.graded : graded) ? 'graded' : 'praise') : 'wait'}>
      <p class="mine" class:shimmer={!settled} lang="en" data-sg-mine>
        {#if diff}{#each diff.mine as w, i (i)}<span class:chg={w.changed}>{w.w}</span>{' '}{/each}{:else}{said}{/if}
      </p>
      {#if settled}
        {#if recast && diff}
          <p class="lab">{say('better')}</p>
          <p class="better" lang="en" data-sg-recast>{#each diff.better as w, i (i)}{#if w.changed}<b>{w.w}</b>{:else}{w.w}{/if}{' '}{/each}</p>
        {:else}
          <p class="praise" data-sg-praise>{cheerOf(cheer) || say('praise')}</p>
        {/if}
        {#if also}<p class="lab">{say('also')}</p><p class="better" lang="en" data-sg-also>{also}</p>{/if}
        {#if shownTip}
          <button type="button" class="tipbtn" aria-expanded={tipOpen} data-sfx="tick" data-sg-tip onclick={() => (tipOpen = !tipOpen)}>
            <Icon name="bulb" size={18} />{say('tip')}<Icon name={tipOpen ? 'chevron-up' : 'chevron-down'} size={16} />
          </button>
          {#if tipOpen}<p class="tip" data-sg-tip-text>{shownTip}</p>{/if}
        {/if}
        {#if !longEnough(said, level)}<p class="soft">{say('longer', { n: HARD_WORDS })}</p>{/if}
      {/if}
      <div class="foot">
        <span class="pts" data-sg-said-stars={stars}><Icon name="star" size={18} soft /><b>+{stars}</b>{#if resaid}<span class="resaid" data-sg-resaid>{say('resaid')}</span>{/if}</span>
        {#if settled && recast && !resaid}
          <button type="button" class="btn small paper" data-sfx="tick" data-sg-resay onclick={resay}><Icon name={typed ? 'keyboard' : 'mic'} size={20} />{say('resay')}</button>
        {/if}
      </div>
    </div>
  {/if}
  <button type="button" class="btn next" data-sfx="confirm" data-sg-next onclick={next}>{s('next')}</button>
</div>

<style>
  .speak { display: flex; flex-direction: column; gap: 8px; }
  .speak .next { margin-top: auto; }
  .card { display: flex; flex-direction: column; gap: 6px; padding: 10px 12px; border-radius: var(--r-row); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); }
  .q { display: flex; align-items: center; gap: 6px; margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .plus { margin-left: auto; padding: 2px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-cream)); font: 700 12px/1.3 var(--font-ui); white-space: nowrap; }
  .hint { margin: 0; font: 500 var(--fs-s)/1.4 var(--font-body); color: var(--text-soft); }
  .hint .lab { margin-right: 6px; }
  .lab { margin: 0; font: 700 12px/1.3 var(--font-ui); color: var(--text-soft); }
  .row2 { display: flex; gap: 8px; }
  .row2 .btn { flex: 1; min-width: 0; gap: 6px; }
  .rec { gap: 8px; --fill: var(--sg-rec); --lip-c: var(--sg-rec-lip); }
  .rec.wait { --fill: var(--c-card); --lip-c: var(--c-edge); }
  .said { width: 100%; box-sizing: border-box; min-height: 44px; padding: 8px 10px; border: 0; border-radius: var(--r-chip); background: var(--c-cream);
    box-shadow: inset 0 2px 0 color-mix(in srgb, var(--c-edge) 60%, transparent); color: var(--c-ink); font: 600 17px/1.3 var(--font-body); }
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
  .tipbtn { display: inline-flex; align-items: center; gap: 4px; align-self: flex-start; min-height: 36px; padding: 0 10px; margin: 0; appearance: none; border: 0;
    border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-cream)); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); cursor: pointer; }
  .tip { margin: 0; font: 500 var(--fs-s)/1.5 var(--font-body); text-wrap: pretty; }
  .foot { display: flex; align-items: center; gap: 8px; min-height: 44px; }
  .foot .btn { margin-left: auto; gap: 6px; }
  .pts { display: inline-flex; align-items: center; gap: 4px; color: var(--c-gold); }
  .pts b { font: 600 20px/1 var(--font-num); color: var(--c-ink); }
  .resaid { margin-left: 4px; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--c-ink); }
</style>
