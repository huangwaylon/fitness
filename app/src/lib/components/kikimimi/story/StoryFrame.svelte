<script lang="ts">
  // おやすみ ものがたり's frame (docs/kikimimi.md "おやすみ ものがたり"): a calm night page, whatever the island's hour (the sheet
  // takes the night palette while it's up: data-kiki-night). The serial and chapter, the scene dimmed with the heads of
  // who's in it (the one speaking lit, nothing bobbing), the English title and its Japanese caption, the bar with the
  // time, ⏮ ⏯ ⏭, the おやすみ タイマー (10 / 20 / 30 ぷん of listening, or ぜんぶ: to the chapter's end) and, hidden by
  // default, the words as they're said (ほんぶん) and the Japanese summary with the chapter's phrases (くわしく). No score
  // and no questions. A chapter's end shows the end card (the next one unlocked, the morning's guess revealed); the
  // timer's end fades the voice over 20 s, then the sheet over 2 s (`onclose`). It writes a `listen` row of its minutes
  // (gm story) as it goes. The page hidden (a lock, an app switch) pauses it: Web Audio doesn't play on in the
  // background, and the chapter's place is kept. Its own chunk.
  import { onMount } from 'svelte';
  import type { Chapter } from '#lib/kikimimi/story.ts';
  import { loadChapter } from '#lib/kikimimi/pool.ts';
  import { wordTimes } from '#lib/kikimimi/clips.ts';
  import { wordSpans } from '#lib/kikimimi/marks.ts';
  import { CLOSE_MS, SLEEP_TIMERS, finish, keepPlace, revealOf, type SleepTimer } from '#lib/kikimimi/bedtime.ts';
  import { STORY_GM } from '#lib/contract/listen.ts';
  import { localDateAt } from '#lib/contract/tokyo.ts';
  import { now as sceneNow } from '#lib/time/clock.ts';
  import type { Who } from '#lib/types.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import { artUrl, villagerArt } from '#lib/art.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { SCENE_SIZES, rosterName, sceneArt, sceneSrcset } from '../scene/stage.ts';
  import { karaoke } from '../scene/karaoke.svelte.ts';
  import { recordGame } from '../progress.svelte.ts';
  import { keepSerial, keepSleepTimer, lastSleepTimer, serialOf, storyProgress } from './serials.svelte.ts';
  import { StoryPlayer } from './player.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import ProgressBar from '../../ui/ProgressBar.svelte';

  interface Props {
    me: Who;
    unit: string;
    ch: number;
    seg?: number;
    /** The timer ran out: the sheet closes (after the 2 s fade). */
    onclose: () => void;
    /** The end card's もくじ: the serial's chapters. */
    onlist: () => void;
  }
  let { me, unit, ch, seg = 0, onclose, onlist }: Props = $props();

  const serial = $derived(serialOf(unit));
  let player = $state.raw<StoryPlayer | null>(null);
  let failed = $state(false);
  let showText = $state(false);
  let closing = $state(false);
  /** The guess revealed at a chapter's end (the morning card's), with the prediction it answered. */
  let reveal = $state.raw<{ right: boolean; pick: string; answer: string; ja: string } | null>(null);
  const day = () => localDateAt(sceneNow().getTime());
  const progress = () => storyProgress(me)[unit];
  const partOf = (n: number) => serial?.chapters[n - 1]?.part;
  /** A game id of this sitting's own (the `listen` row's `g`). */
  const g = `s${Math.random().toString(36).slice(2, 10).padEnd(8, '0')}`;

  /** The chapter before's prediction, revealed when this one is finished with a guess made about it. */
  async function revealFor(n: number): Promise<void> {
    const r = revealOf(progress(), n), part = partOf(n - 1);
    if (!r || !part) return;
    const before = await loadChapter(part).catch(() => null);
    const p = before?.predict;
    if (p) reveal = { right: r.right, pick: p.choices[r.pick] ?? '', answer: p.choices[p.answer], ja: p.ja };
  }

  /** The minutes heard so far written (a `listen` row of the story, no answers: the week, the quest), as a row of the
   *  time since the last one at each stop (a pause, a lock, a chapter's or the timer's end, the sheet closed): rows of
   *  one game id are one sitting on the record (progress.ts gamesOf sums them), and a phone that never comes back from
   *  a lock has written what it heard. */
  let written = 0;
  function flush(p: StoryPlayer | null): void {
    const ms = Math.round((p?.heard ?? 0) - written);
    if (!p || ms < 10_000) return;
    written += ms;
    recordGame(me, { d: day(), g, gm: STORY_GM, u: unit, lv: 4, n: 1, ms: Math.min(3_600_000, ms), r: [] });
  }

  onMount(() => {
    let gone = false, p: StoryPlayer | null = null;
    const part = partOf(ch);
    if (!part) failed = true;
    else
      void loadChapter(part).then((chapter: Chapter) => {
        if (gone) return;
        p = new StoryPlayer(chapter, seg, lastSleepTimer(), {
          finished: (n) => {
            keepSerial(me, unit, finish(progress(), n, day(), Date.now()));
            flush(p);
            void revealFor(n);
          },
          place: (n, k) => {
            keepSerial(me, unit, keepPlace(progress(), n, k, Date.now()));
            flush(p);
          },
          next: (n) => {
            const nx = partOf(n + 1);
            return nx ? loadChapter(nx) : Promise.resolve(null);
          }
        });
        player = p;
        p.play();
      }, () => (failed = true));
    // the page hidden: Web Audio stops in the background (sound.svelte.ts), so the story pauses where it is
    const onHide = () => document.hidden && p?.pause();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      gone = true;
      document.removeEventListener('visibilitychange', onHide);
      p?.dispose();
      flush(p);
    };
  });

  // the timer's end: the voice has faded; the sheet fades out over 2 s and closes
  $effect(() => {
    if (player?.ended !== 'timer') return;
    closing = true;
    const h = setTimeout(onclose, CLOSE_MS);
    return () => clearTimeout(h);
  });

  const chapter = $derived(player?.chapter ?? null);
  const segNow = $derived(chapter && player ? chapter.segments[player.seg] : null);
  /** Who's in the chapter: the host first (the narrator's lines are theirs), then each villager who speaks. */
  const heads = $derived<RosterId[]>(chapter ? [chapter.host, ...new Set(chapter.segments.map((s) => s.who as RosterId).filter((w) => (w as string) !== 'narrator' && w !== chapter.host))] : []);
  const speaking = $derived(segNow && player?.from !== null ? (segNow.who === 'narrator' ? chapter!.host : segNow.who) : null);
  const total = $derived(player ? player.line.total : 0);
  const pos = $derived(player ? player.pos : 0);
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
  const nextLine = $derived(chapter && serial ? serial.chapters[chapter.chapter] ?? null : null);

  // the words being said (ほんぶん): the sounding segment's, from its clip's timings
  const times = $derived(segNow ? wordTimes(segNow.clip, segNow.en) : []);
  const words = $derived(segNow ? wordSpans(segNow.en).map(([a, b]) => segNow.en.slice(a, b)) : []);
  const k = karaoke({ from: () => (showText ? (player?.from ?? null) : null), times: () => times, clock: () => performance.now() });
  const wordState = (w: number) => (k.at === null ? 'said' : w < k.at ? 'said' : w === k.at ? 'now' : 'yet');

  function pickTimer(x: SleepTimer) {
    player?.setTimer(x);
    keepSleepTimer(x);
  }
  async function nextChapter() {
    const part = nextLine?.part;
    if (!part || !player) return;
    reveal = null;
    player.open(await loadChapter(part));
  }
</script>

<div class="story" class:closing data-kiki-page="story-frame" data-kiki-story={chapter?.id} data-kiki-story-seg={player?.seg}
  data-kiki-story-playing={player?.playing || undefined} data-kiki-story-ended={player?.ended ?? undefined}>
  {#if failed}
    <p class="note">{t('kiki.story.failed')}</p>
  {:else if !chapter || !player}
    <p class="note" aria-live="polite">{t('kiki.story.loading')}</p>
  {:else}
    <p class="where">{serial?.name ?? chapter.name} · {t('kiki.story.chapter', { n: chapter.chapter })}</p>
    <div class="scene" class:paper={!chapter.scene} aria-hidden="true">
      {#if chapter.scene && artUrl(sceneArt(chapter.scene))}
        <img class="bd" src={artUrl(sceneArt(chapter.scene))} srcset={sceneSrcset(chapter.scene)} sizes={SCENE_SIZES} width="393" height="224" alt="" decoding="async" draggable="false" />
      {/if}
      <span class="moon">☾</span>
      <div class="heads">
        {#each heads as w (w)}
          <span class="head" class:on={speaking === w} data-kiki-head={w}><OfficialArt key={villagerArt(w, true)} alt={rosterName(w)} size={w === chapter.host ? 64 : 48} eager /></span>
        {/each}
      </div>
    </div>
    <hgroup class="titles">
      <h3 lang="en" data-kiki-story-title>{chapter.title}</h3>
      <p>{chapter.line}</p>
    </hgroup>

    {#if player.between && nextLine}
      <p class="between" aria-live="polite" data-kiki-story-between>{t('kiki.story.between', { n: nextLine.ch })}</p>
    {/if}

    {#if player.ended === 'end'}
      <section class="end card" aria-live="polite" data-kiki-story-end>
        <b>{t('kiki.story.end', { n: chapter.chapter })}</b>
        {#if reveal}
          <div class="reveal" data-kiki-story-reveal={reveal.right ? 'right' : 'miss'}>
            <small>{t(reveal.right ? 'kiki.story.revealRight' : 'kiki.story.revealMiss')}</small>
            {#if !reveal.right}<span lang="en" class="pick">{t('kiki.story.yourGuess')} {reveal.pick}</span>{/if}
            <span lang="en">{reveal.answer}</span>
            <span class="ja">{reveal.ja}</span>
          </div>
        {/if}
        {#if nextLine}
          <p>{t('kiki.story.unlocked')}</p>
          <div class="row">
            <button type="button" class="btn paper small" data-kiki-story-list data-sfx="back" onclick={onlist}>{t('kiki.story.list')}</button>
            <button type="button" class="btn small" data-kiki-story-next-chapter data-sfx="confirm" onclick={nextChapter}>{t('kiki.story.next')}</button>
          </div>
        {:else}
          <p>{t('kiki.story.last')}</p>
          <button type="button" class="btn paper small" data-kiki-story-list data-sfx="back" onclick={onlist}>{t('kiki.story.list')}</button>
        {/if}
      </section>
    {:else}
      <div class="bar" role="progressbar" aria-label={t('kiki.story.progress')} aria-valuemin={0} aria-valuemax={Math.round(total)} aria-valuenow={Math.round(pos)}
        aria-valuetext="{mmss(pos)} / {mmss(total)}">
        <ProgressBar value={pos} max={total} h={6} track="color-mix(in srgb, var(--text-soft) 22%, transparent)" fill="color-mix(in srgb, var(--text-soft) 75%, transparent)" decor />
        <span class="time"><span data-kiki-story-pos>{mmss(pos)}</span> / {mmss(total)}</span>
      </div>
      <div class="controls">
        <button type="button" class="ctl" aria-label={t('kiki.story.back')} data-kiki-story-back data-sfx="none" onclick={() => player?.back()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9.5 12z" /></svg>
        </button>
        <button type="button" class="ctl main" aria-label={t(player.playing ? 'kiki.story.pause' : 'kiki.story.play')} aria-pressed={player.playing}
          data-kiki-story-play data-sfx="none" onclick={() => player?.toggle()}>
          {#if player.playing}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
          {:else}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" /></svg>{/if}
        </button>
        <button type="button" class="ctl" aria-label={t('kiki.story.forward')} data-kiki-story-forward data-sfx="none" aria-disabled={player.seg >= chapter.segments.length - 1}
          onclick={() => player?.forward()}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l10.5-7z" /></svg>
        </button>
      </div>

      <section class="timer" aria-labelledby="kk-sleep">
        <h4 id="kk-sleep">{t('kiki.story.timer')}{#if player.left !== null}<small data-kiki-story-left>{t('kiki.story.left', { t: mmss(player.left / 1000) })}</small>{/if}</h4>
        <div class="chips" role="radiogroup" aria-labelledby="kk-sleep">
          {#each SLEEP_TIMERS as x (x)}
            <button type="button" class="chip" role="radio" aria-checked={player.timer === x} data-kiki-story-timer={x} data-sfx="none"
              onclick={() => pickTimer(x)}>{x ? t('kiki.chip.mins', { n: x }) : t('kiki.story.all')}</button>
          {/each}
        </div>
      </section>
    {/if}

    <div class="more">
      <button type="button" class="link" aria-expanded={showText} data-kiki-story-text-toggle data-sfx="none" onclick={() => (showText = !showText)}>
        {t(showText ? 'kiki.story.textHide' : 'kiki.story.textShow')}
      </button>
      {#if showText && segNow}
        <p class="words" lang="en" data-kiki-story-text>
          {#if segNow.who !== 'narrator'}<small class="who">{rosterName(segNow.who as RosterId)}</small>{/if}
          {#each words as w, i (i)}<span class="w {wordState(i)}">{w}</span>{' '}{/each}
        </p>
      {/if}
      <details data-kiki-story-more>
        <summary>{t('kiki.story.more')}</summary>
        <p class="ja-sum">{chapter.ja}</p>
        {#if chapter.ph.length}
          <ul class="ph">
            {#each chapter.ph as ph (ph.id)}<li><span lang="en">{ph.en}</span> <small>{ph.ja}</small></li>{/each}
          </ul>
        {/if}
      </details>
    </div>
    <p class="note">{t('kiki.story.note')}</p>
  {/if}
</div>

<style>
  .story { display: flex; flex-direction: column; gap: 12px; flex: 1 0 auto; transition: opacity 2s linear; }
  .story.closing { opacity: 0; }
  .where { margin: 0; text-align: center; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .scene {
    position: relative; height: 176px; border-radius: var(--r-card); overflow: hidden; background: #232C5C;
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--edge) 30%, transparent);
  }
  .bd { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .42; filter: saturate(.7) brightness(.8); }
  .moon { position: absolute; top: 8px; right: 14px; font-size: 22px; color: #F3E3A8; opacity: .8; }
  .heads { position: absolute; inset: auto 0 10px; display: flex; justify-content: center; align-items: flex-end; gap: 10px; }
  .head { line-height: 0; border-radius: 50%; opacity: .5; transition: opacity 600ms ease; }
  /* the one speaking: lit, with a soft ring (no bob) */
  .head.on { opacity: 1; box-shadow: 0 0 0 3px color-mix(in srgb, #F3E3A8 55%, transparent); }
  .titles { margin: 0; text-align: center; display: grid; gap: 4px; }
  .titles h3 { margin: 0; font: 700 var(--fs-talk)/1.25 var(--font-ui); color: var(--text); }
  .titles p { margin: 0; font: 700 var(--fs-body)/1.45 var(--font-ui); color: var(--text-soft); }
  .between { margin: 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  .bar { display: grid; gap: 4px; }
  .time { justify-self: end; font: 600 var(--fs-s)/1 var(--font-num); color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .controls { display: flex; justify-content: center; align-items: center; gap: 28px; }
  .ctl {
    appearance: none; border: 0; cursor: pointer; width: 56px; height: 56px; border-radius: 50%; display: grid; place-items: center; padding: 0;
    background: color-mix(in srgb, var(--card) 80%, transparent); color: var(--text); box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--edge) 35%, transparent);
  }
  .ctl svg { width: 24px; height: 24px; fill: currentColor; }
  .ctl.main { width: 92px; height: 92px; background: var(--card); }
  .ctl.main svg { width: 40px; height: 40px; }
  .ctl[aria-disabled='true'] { opacity: .35; cursor: default; }
  .timer { display: grid; gap: 8px; }
  .timer h4 { margin: 0; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text-soft); }
  .timer h4 small { margin-left: 8px; font: 600 var(--fs-s)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .chips { display: grid; grid-template-columns: repeat(4, 1fr); gap: 6px; }
  .chip {
    appearance: none; border: 0; cursor: pointer; min-height: var(--hit); border-radius: var(--r-pill); padding: 0 4px;
    font: 700 var(--fs-s)/1.1 var(--font-ui); color: var(--text-soft); background: color-mix(in srgb, var(--card) 70%, transparent);
    box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--edge) 25%, transparent);
  }
  /* the picked one: a soft cream ring, not the day's bright yuzu */
  .chip[aria-checked='true'] { color: var(--text); background: var(--card); box-shadow: inset 0 0 0 2px var(--text-soft); }
  .end { display: grid; justify-items: center; gap: 8px; padding: 14px; text-align: center; box-shadow: none; }
  /* the day's bright buttons dimmed for the night */
  .end :global(.btn) { filter: brightness(.8) saturate(.8); }
  .end b { font: 700 var(--fs-talk)/1.3 var(--font-ui); }
  .end p { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text-soft); }
  .end .row { display: flex; gap: 10px; width: 100%; }
  .end .row .btn { flex: 1; }
  .reveal { display: grid; gap: 4px; padding: 10px 12px; border-radius: 16px; background: color-mix(in srgb, var(--surface) 60%, transparent); width: 100%; box-sizing: border-box; }
  .reveal small { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--leaf-text); }
  .reveal[data-kiki-story-reveal='miss'] small { color: var(--coral-text); }
  .reveal span { font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .reveal .pick { color: var(--text-soft); text-decoration: line-through; font-size: var(--fs-s); }
  .reveal .ja { word-break: normal; font-size: var(--fs-s); color: var(--text-soft); }
  .more { display: grid; grid-template-columns: minmax(0, 1fr); gap: 8px; }
  .link {
    appearance: none; border: 0; background: none; cursor: pointer; justify-self: center; min-height: var(--hit); padding: 0 12px;
    font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); text-decoration: underline 1px; text-underline-offset: 4px;
  }
  .words { margin: 0; padding: 12px 14px; border-radius: 16px; background: color-mix(in srgb, var(--card) 60%, transparent); font: 700 var(--fs-body)/1.6 var(--font-ui); }
  .words .who { display: block; font-size: var(--fs-s); color: var(--text-soft); }
  .w.yet { color: color-mix(in srgb, var(--text) 45%, transparent); }
  .w.now { text-decoration: underline 2px color-mix(in srgb, var(--text-soft) 80%, transparent); text-underline-offset: 4px; }
  details { border-radius: 16px; background: color-mix(in srgb, var(--card) 45%, transparent); padding: 0 14px; }
  summary { cursor: pointer; min-height: var(--hit); display: flex; align-items: center; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .ja-sum { word-break: normal; overflow-wrap: anywhere; margin: 0 0 10px; font: 500 var(--fs-body)/1.6 var(--font-ui); }
  .ph { word-break: normal; list-style: none; margin: 0 0 12px; padding: 0; display: grid; gap: 4px; font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .ph small { color: var(--text-soft); font-weight: 500; }
  .note { margin: 0 6px; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  @media (prefers-reduced-motion: reduce) { .story, .head { transition: none; } }
</style>
