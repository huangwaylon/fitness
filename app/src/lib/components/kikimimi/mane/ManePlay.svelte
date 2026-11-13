<script module lang="ts">
  /** How I said the last line (kept while the app is open): along with it (earphones) or right after it. */
  let lastWay: 'shadow' | 'after' = 'shadow';
</script>

<script lang="ts">
  import Icon from '../../ui/Icon.svelte';
  // A line of まねっこ シャドーイング (docs/kikimimi-mic.md "まねっこ シャドーイング"; games/mane/def.ts), its own chunk. The villager pops in
  // and says it once (the session's clip: listen only, the situation under them). Then, untimed: the line and its
  // Japanese, 重ねて言う (earphones: the mic's tap plays the line and I speak over it) or あとから言う (hear it with お手本,
  // then tap the mic and say it); my take ends by itself on the silence after it (MicButton). Then my melody and timing
  // over theirs (mic/Contour.svelte), the villager's reaction (spaced kana), at most two lines in kanji (lib/mic/prosody.ts
  // feedback: praise, then one thing to try), 自分の声を聞く (my take from memory), もう一回 or 次の文へ. Nothing is graded:
  // 次の文へ answers a bare 0, and the reveal moves on at once. The take lives in this page only: a new try, the next
  // line, leaving or the app hidden drops it.
  import { onDestroy, untrack } from 'svelte';
  import '#lib/i18n/kiki-mane.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import { lineJa } from '#lib/kikimimi/games/mane/def.ts';
  import type { Item } from '#lib/kikimimi/bank.ts';
  import { wordTimes } from '#lib/kikimimi/clips.ts';
  import { monoOf } from '#lib/mic/pitch.ts';
  import { FRAME_S, compare, feedback, reaction, trackOf, type Code, type Outcome, type Track } from '#lib/mic/prosody.ts';
  import type { Got } from '#lib/mic/session.ts';
  import { audioCtx, playVoice } from '#lib/sound/sound.svelte.ts';
  import { voiceClip } from '../packs.ts';
  import MicButton from '../mic/MicButton.svelte';
  import Contour from '../mic/Contour.svelte';
  import ClipBar from '../scene/ClipBar.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const it = $derived(game.items[v.i] as Item | undefined);
  const key = $derived(`${v.g}:${v.i}`);
  const speaking = $derived(v.phase === 'answer' && !v.answers[v.i] && !v.out);
  const last = $derived(v.i >= v.n - 1);

  let way = $state(lastWay);
  /** The line's clip and its track (once per line). */
  let ref = $state.raw<{ key: string; buf: AudioBuffer; track: Track } | null>(null);
  /** My latest try: its track, the comparison and the feedback (the track only: never the voice). */
  let tried = $state.raw<{ you: Track; o: Outcome; codes: Code[] } | null>(null);
  let tries = $state(0);
  /** My take, for 自分の声を聞く only: dropped with the try. */
  let take = $state.raw<AudioBuffer | null>(null);
  /** The clip sounding (お手本 or under a shadowing take), and when it began on the audio clock. */
  let sounding: { stop(): void; at: number } | null = null;

  function stopClip() {
    sounding?.stop();
    sounding = null;
  }
  function drop() {
    stopClip();
    take = null;
  }

  // a new line: what was tried before forgotten, its clip loaded and read (a tick later: the page first)
  $effect(() => {
    const k = key, id = it?.id;
    untrack(() => {
      drop();
      tried = null;
      tries = 0;
      if (!id || ref?.key === k) return;
      void voiceClip(id).then((buf) => {
        if (!buf || key !== k) return;
        setTimeout(() => key === k && (ref = { key: k, buf, track: trackOf(monoOf(buf)) }), 0);
      });
    });
  });
  // the reveal has nothing to show: on to the next line at once
  $effect(() => {
    if (v.phase === 'reveal' && v.amHost) untrack(() => game.next());
  });
  // the app hidden: my take gone
  $effect(() => {
    const hide = () => document.visibilityState === 'hidden' && drop();
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  });
  onDestroy(drop);

  function pick(w: 'shadow' | 'after') {
    way = lastWay = w;
  }
  /** The line now (お手本, or under my shadowing take). */
  function hear() {
    if (!ref) return;
    stopClip();
    const p = playVoice(ref.buf);
    if (p) sounding = { stop: p.stop, at: p.endsAt - ref.buf.duration };
  }
  /** The longest take: the line twice over and a breath (the session caps it at 15 s). */
  const maxS = $derived(Math.min(15, (ref?.buf.duration ?? 4) * 2 + 2));

  function heard(got: Got | null) {
    const r = ref, at = sounding?.at;
    stopClip();
    if (!r) return;
    tries++;
    if (!got) {
      take = null;
      tried = { you: trackOf(new Float32Array(0)), o: compare(r.track, trackOf(new Float32Array(0))), codes: ['quiet'] };
      return;
    }
    const you = trackOf(got.pcm);
    // shadowing: my first sound after theirs, less the output's delay (what the phone adds before it's heard)
    const ctx = audioCtx();
    const out = (ctx?.outputLatency ?? 0) + (ctx?.baseLatency ?? 0);
    const lag = way === 'shadow' && at !== undefined && got.at !== undefined ? got.at + you.a * FRAME_S - (at + r.track.a * FRAME_S) - out : undefined;
    const o = compare(r.track, you, lag !== undefined && lag > -0.3 ? Math.max(0, lag) : undefined);
    tried = { you, o, codes: feedback(o) };
    take = ctx ? bufferOf(ctx, got.pcm) : null;
  }
  function bufferOf(ctx: AudioContext, pcm: Float32Array): AudioBuffer {
    const b = ctx.createBuffer(1, pcm.length, 16_000);
    b.copyToChannel(new Float32Array(pcm), 0);
    return b;
  }
  function hearMine() {
    if (!take) return;
    stopClip();
    const p = playVoice(take);
    if (p) sounding = { stop: p.stop, at: p.endsAt - take.duration };
  }
  function again() {
    drop();
    tried = null;
  }
  function next() {
    drop();
    game.answer(0);
  }

  /** A feedback line's text: the end's direction where it depends on it, the lag in tenths. */
  function line(c: Code, o: Outcome): string {
    if (c === 'final' || c === 'finalTry') return t(`kiki.mane.fb.${c}.${o.final.ref === 'fall' ? 'fall' : 'rise'}`);
    if (c === 'keep') return (o.lag ?? 0) < 0.15 ? t('kiki.mane.fb.keepTight') : t('kiki.mane.fb.keep', { s: (o.lag ?? 0).toFixed(1) });
    return t(`kiki.mane.fb.${c}`);
  }
  const words = $derived.by(() => {
    if (!it) return [];
    const ws = it.en.split(/\s+/).filter(Boolean), ts = wordTimes(it.id, it.en);
    return ws.map((w, k) => ({ w, t: ts[k] ?? 0 }));
  });
  const bar = $derived(v.phase === 'play' ? { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` } : null);
</script>

{#if it}
  <div class="q" data-kiki-q={v.i} data-type="mane" data-phase={v.phase} data-mane-way={way}>
    <div class="stage">
      <span class="speaker" class:pop={v.phase === 'lead'} class:talk={!!bar}>
        <OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={speaking ? 56 : 68} eager />
      </span>
      <div class="bubble obj-cream" aria-live="polite">
        {#if speaking}
          {#if tried}
            <p class="react kana" data-mane-react={reaction(tried.codes)}>{t(`kiki.mane.react.${reaction(tried.codes)}`)}</p>
          {/if}
          <p class="en" lang="en" data-kiki-en>{it.en}</p>
          {#if it.tts && it.tts !== it.en}<p class="said"><small>{t('kiki.mane.said')}</small> <span lang="en">{it.tts}</span></p>{/if}
          <p class="ja">{lineJa(it)}</p>
        {:else}
          <p class="notes"><span aria-hidden="true">♪…</span><span class="sr-only">{t('kiki.listen')}</span></p>
          <ClipBar {bar} now={game.now} height={8} />
        {/if}
      </div>
      {#if it.ctx && !speaking}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
    </div>

    {#if !speaking}
      <p class="status" role="status">{t('kiki.mane.listen')}</p>
    {:else if tried}
      <!-- my try: the two lines, then praise and one thing to try -->
      {#if ref}<Contour ref={ref.track} you={tried.o.heard ? tried.you : null} {words} />{/if}
      <ul class="fb" data-mane-feedback={tried.codes.join(' ')}>
        {#each tried.codes as c (c)}<li data-code={c}>{line(c, tried.o)}</li>{/each}
      </ul>
      <div class="row">
        {#if take}<button type="button" class="btn small paper" data-mane-mine data-sfx="tick" onclick={hearMine}><Icon name="headphones" /> {t('kiki.mane.mine')}</button>{/if}
        <span class="tries" data-mane-tries={tries}>{t('kiki.mane.try', { n: tries })}</span>
      </div>
      <div class="level-acts">
        <button type="button" class="btn paper" data-mane-again data-sfx="tick" onclick={again}>{t('kiki.mane.again')}</button>
        <button type="button" class="btn" data-mane-next data-sfx="confirm" onclick={next}>{last ? t('kiki.mane.finish') : t('kiki.mane.next')}</button>
      </div>
    {:else}
      <p class="ask">{t('kiki.mane.ask')}</p>
      <div class="way" role="radiogroup" aria-label={t('kiki.mane.way')}>
        {#each ['shadow', 'after'] as const as w (w)}
          <button type="button" class="chip" role="radio" aria-checked={way === w} data-mane-pick={w} data-sfx="tick" onclick={() => pick(w)}>{#if w === 'shadow'}<Icon name="headphones" size={18} />{/if}{t(`kiki.mane.way.${w}`)}</button>
        {/each}
      </div>
      <p class="hint">{t(`kiki.mane.hint.${way}`)}</p>
      {#if ref}<Contour ref={ref.track} {words} />{/if}
      <div class="talk" data-mane-ready={ref ? 1 : 0}>
        {#if way === 'after'}<button type="button" class="btn small paper" data-mane-hear data-sfx="tick" aria-disabled={!ref} onclick={hear}><Icon name="replay" /> {t('kiki.mane.hear')}</button>{/if}
        {#if ref}
          {#key way}<MicButton onheard={heard} onstart={way === 'shadow' ? hear : stopClip} {maxS} />{/key}
        {/if}
      </div>
      <p class="hint small">{t('kiki.mane.private')}</p>
      <div class="level-acts">
        <button type="button" class="btn paper" data-mane-skip data-sfx="tick" onclick={next}>{t('kiki.mane.skip')}</button>
      </div>
    {/if}
  </div>
{/if}

<style>
  .q { display: grid; gap: 12px; align-content: start; }
  .stage { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 4px 2px; }
  .speaker { position: relative; line-height: 0; transform-origin: 50% 100%; }
  .speaker.pop { animation: if-pop-in 420ms var(--ease-bounce) both; }
  .speaker.talk { animation: if-speak 520ms ease-in-out infinite alternate; }
  .bubble {
    position: relative; min-height: 68px; display: grid; align-content: center; gap: 6px; padding: 12px 16px;
    border-radius: var(--r-game); background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream);
  }
  .bubble::before { content: ''; position: absolute; left: -9px; top: 50%; width: 20px; height: 20px; margin-top: -10px; rotate: 45deg; background: var(--c-card); border-radius: 4px; }
  .notes { margin: 0; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .1em; }
  .en { margin: 0; font: 700 var(--fs-en)/1.4 var(--font-ui); position: relative; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--c-ink-soft); position: relative; word-break: normal; line-break: strict; }
  .said { margin: 0; font: 700 var(--fs-body)/1.35 var(--font-ui); color: var(--c-ink-soft); position: relative; }
  .said small { font-size: var(--fs-s); }
  .react { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--coral-text); position: relative; }
  .ctx { grid-column: 1 / -1; margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .status { min-height: 1.4em; margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-talk)/1.4 var(--font-ui); }
  .way { display: flex; justify-content: center; gap: 8px; }
  .chip { min-height: var(--hit); padding: 6px 14px; border: 0; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text); font: 700 var(--fs-body)/1.2 var(--font-ui); cursor: pointer; }
  .chip[aria-checked='true'] { background: var(--ctl-sel); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-leaf-edge); }
  .hint { margin: 0 4px; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .talk { display: flex; align-items: center; justify-content: center; gap: 18px; min-height: 120px; }
  .fb { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .fb li { padding: 8px 12px; border-radius: 12px; background: var(--card); box-shadow: inset 0 0 0 2px var(--edge); font: 700 var(--fs-body)/1.45 var(--font-ui); }
  /* the praise first, the thing to try after it */
  .fb li:first-child { background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); box-shadow: none; }
  .row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .tries { margin-left: auto; font: 700 var(--fs-s)/1.2 var(--font-num); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .speaker.pop, .speaker.talk { animation: none; } }
</style>
