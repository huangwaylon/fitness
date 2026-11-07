<script lang="ts">
  // A sentence of くりかえし チャレンジ (docs/kikimimi-mic.md §2.2; games/kuri/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte). Over the stage, the ladder (8 steps by length, this sentence's lit) and the speaker. The
  // clip plays once, then a one-second beat; then your turn: the mic (KuriMic: tap, say it, it stops on the silence
  // after), 「もう一回聞く」 (free, but that sentence can't climb) and, after a miss, the reason in Japanese, 「もう一度話す」
  // and 「この文はとばす」. What was heard is checked against the sentence on the phone (board.ts) and answered as its
  // content words' count; the reveal: the climb (or not), the sentence with the words you said lit and the others
  // grey, the missed ones named, what came through, the Japanese, then the note or 解説. What was heard lives in this
  // view's state only.
  import { onDestroy, onMount } from 'svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { BEAT, RUNGS, answerOf, climbOf, kuriAnswer, saidOk, skipAnswer, type Said } from '#lib/kikimimi/games/kuri/def.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import { clipDur } from '#lib/kikimimi/clips.ts';
  import type { Miss, Recogniser } from '#lib/mic/stt.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { bare, heardAgainst, jaOf } from './board.ts';
  import KuriMic from './KuriMic.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import Why from '../frame/Why.svelte';
  import ClipBar from '../scene/ClipBar.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const it = $derived(game.items[v.i]);
  const key = $derived(`${v.g}:${v.i}`);
  const reveal = $derived(v.phase === 'reveal');
  const sent = $derived(v.answers[v.i] ?? null);
  const a = $derived(answerOf(rawOf(sent)));
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  const listening = $derived(v.phase === 'lead' || v.phase === 'play');

  /** The phone's recogniser: looking, ready, or none can run here. */
  let rec = $state<Recogniser | 'none' | null>(null);
  /** The recogniser's module (lazy: the mic core's chunk), its release() when the round goes (whisper's Worker ends). */
  const stt = import('#lib/mic/stt.ts');
  onMount(() => {
    let gone = false;
    void stt.then(async ({ recogniser }) => {
      const r = await recogniser();
      const ok = !!r && (await r.ready());
      if (!gone) rec = ok ? r : 'none';
    }, () => !gone && (rec = 'none'));
    return () => (gone = true);
  });
  onDestroy(() => void stt.then(({ release }) => release(), () => {}));

  /** The mic's state (no replay while it listens: the clip would go into the take). */
  let mic = $state<'idle' | 'listening' | 'checking'>('idle');
  /** This sentence's take: what came through, or why nothing did (by round). */
  let took = $state<{ key: string; text?: string; miss?: Miss } | null>(null);
  const mine = $derived(took?.key === key ? took : null);
  const checked = $derived(it && mine?.text !== undefined ? heardAgainst(it.en, mine.text) : null);
  function heard(text: string) {
    if (!it || !open) return;
    took = { key, text };
    const h = heardAgainst(it.en, text);
    game.answer(kuriAnswer(h.hit, h.of));
  }
  const missed = (m: Miss) => open && (took = { key, miss: m });
  const skip = () => it && open && game.answer(skipAnswer(heardAgainst(it.en, '').of));

  /** The sentences so far as the ladder reads them (each answer and whether it was heard again first). */
  const said = (upTo: number): Said[] => v.answers.slice(0, upTo).map((x) => {
    const y = answerOf(rawOf(x));
    return { ok: saidOk(y), rp: x?.rp ? 1 : 0, skipped: !y || !y.heard };
  });
  const before = $derived(climbOf(said(v.i)));
  const after = $derived(climbOf(said(v.i + 1)));
  const line = $derived.by(() => {
    if (!a?.heard) return 'skipped';
    if (!saidOk(a)) return after.stop ? 'end' : 'stay';
    if (sent?.rp) return 'replayed';
    return after.rung > before.rung ? 'up' : 'top';
  });

  // the beat's end: a soft tick, your turn
  let ticked = '';
  $effect(() => {
    if (open && ticked !== key) {
      ticked = key;
      cue('tick');
    }
  });

  /** The take's cap: the clip twice and 2 s, 15 s at most. */
  const maxS = $derived(Math.min(15, Math.ceil((clipDur(it?.id ?? '') ?? 4) * 2 + 2)));
  const bar = $derived(v.phase === 'play' ? { from: v.playAt, until: v.playEnd - BEAT, key: `p${v.i}:${v.playAt}` } : null);
  const beatIn = $derived(Math.max(0, v.playEnd - BEAT - game.now));
  const verdict = $derived(v.out ? 'out' : a?.heard && saidOk(a) ? 'right' : sent ? 'wrong' : 'none');
  const help = $derived(it?.note ?? it?.why);
</script>

{#if it}
{#snippet stage()}
  <div class="stage">
    <ol class="ladder" aria-label={t('kiki.kuri.ladder')} data-kuri-rung={before.rung}>
      {#each RUNGS as _, k (k)}<li data-step={k < before.rung ? 'up' : k === before.rung ? 'now' : 'ahead'} style:--h="{30 + k * 10}%"></li>{/each}
    </ol>
    <p class="step">{t('kiki.kuri.count', { k: v.i + 1 })} ・ {t('kiki.kuri.rung', { n: before.rung + 1 })}</p>
    <div class="who" class:talk={v.phase === 'play' && beatIn > 0} class:pop={v.phase === 'lead'}>
      <OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={76} eager />
      <span class="nm">{name(it.speaker)}</span>
    </div>
    {#if it.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
  </div>
{/snippet}

{#snippet climb()}
  <p class="climb" data-kuri-line={line}>{t(`kiki.kuri.${line}`)}</p>
{/snippet}
{#snippet got()}
  {#if a?.heard}<span class="got" data-kuri-got="{a.hit}/{a.of}">{t('kiki.kuri.got', { k: a.hit, n: a.of })}</span>{/if}
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} right={verdict === 'right'} picked={!!sent} pts={0} coop={false} rightNow={0} line={climb} extra={got} />
    {#if !v.out}
      <section class="said obj-cream" data-kuri-said lang="en">
        <p class="en">
          {#each checked?.marks ?? heardAgainst(it.en, '').marks as m, k (k)}<span class="w" data-got={checked ? m.got : undefined}>{m.w}</span>{' '}{/each}
        </p>
        <p class="ja" lang="ja">{jaOf(it)}</p>
      </section>
      {#if checked}
        {@const miss = checked.marks.filter((m) => m.key && !m.got)}
        {#if miss.length}
          <div class="missed" data-kuri-missed={miss.length}>
            <small>{t('kiki.kuri.missed')}</small>
            {#each miss as m, k (k)}<span class="chip" lang="en">{bare(m.w)}</span>{/each}
          </div>
        {/if}
        <p class="heard" data-kuri-heard><small>{t('kiki.kuri.heard')}</small> <span lang="en">{mine?.text || t('kiki.kuri.nothing')}</span></p>
      {/if}
      {#if help}<Why text={help} />{/if}
    {/if}
  {:else if listening}
    <p class="ask" data-kuri-once>{t('kiki.kuri.once')}</p>
    <ClipBar {bar} now={game.now} height={8} />
    {#if v.phase === 'play'}<p class="beat" style:animation-delay="{beatIn}ms" data-kuri-beat>{t('kiki.kuri.beat')}</p>{/if}
  {:else if open}
    {#if rec === 'none'}
      <p class="warn" data-kuri-unavailable>{t('kiki.kuri.unavailable')}</p>
    {:else if !rec}
      <p class="ask" data-kuri-preparing>{t('kiki.kuri.preparing')}</p>
    {:else}
      <p class="ask">{t('kiki.kuri.say')}</p>
      {#if mine?.miss}<p class="warn" data-kuri-miss={mine.miss}>{t(`kiki.kuri.miss.${mine.miss}`)}</p>{/if}
      <KuriMic {rec} {maxS} bind:st={mic} idle={mine?.miss ? t('kiki.kuri.retry') : undefined} onheard={heard} onmiss={missed} />
      <p class="hint">{t('kiki.kuri.earphones')}</p>
    {/if}
    <div class="acts">
      {#if rec === 'none'}
        <button type="button" class="btn small paper" data-kuri-quit data-sfx="back" onclick={() => game.leave()}>{t('kiki.quitYes')}</button>
      {:else if mic === 'idle'}
        <button type="button" class="btn small paper" data-kuri-again data-sfx="tick" onclick={() => game.replay()}>🔁 {t('kiki.kuri.again')}</button>
        {#if mine?.miss}<button type="button" class="btn small paper" data-kuri-skip data-sfx="tick" onclick={skip}>{t('kiki.kuri.skip')}</button>{/if}
      {/if}
    </div>
    {#if game.replayed[v.i]}<p class="hint" data-kuri-replayed>{t('kiki.kuri.againNote')}</p>{/if}
  {/if}
{/snippet}

<RoundFrame {v} now={game.now} me={game.me} type="kuri" answered={!!sent} {verdict} {stage} {input} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; gap: 6px; justify-items: center; }
  /* the ladder: 8 steps rising left to right, climbed leaf, this one yuzu */
  .ladder { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(8, 22px); gap: 4px; align-items: end; height: 40px; }
  .ladder li { height: var(--h); border-radius: 6px 6px 3px 3px; background: var(--ctl-off); }
  .ladder li[data-step='up'] { background: var(--c-leaf); }
  .ladder li[data-step='now'] { background: var(--c-yuzu); box-shadow: inset 0 0 0 2px var(--c-edge); }
  .step { margin: 0; padding: 2px 12px; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text-soft); font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .who { display: grid; justify-items: center; gap: 2px; line-height: 0; transform-origin: 50% 100%; }
  .who.pop { animation: pop-in 420ms var(--ease-bounce) both; }
  .who.talk { animation: bob 520ms ease-in-out infinite alternate; }
  .nm { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text); }
  .ctx { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .beat { margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); animation: fade-in 300ms ease-out both; }
  .hint { margin: 0; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .warn { margin: 0; padding: 8px 12px; border-radius: 12px; text-align: center; font: 700 var(--fs-s)/1.5 var(--font-ui); color: var(--c-ink); background: color-mix(in srgb, var(--c-coral) 22%, var(--c-card)); }
  .acts { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; }
  .acts .btn { min-height: var(--hit); }

  /* the reveal: the climb in the verdict's colours, the sentence (said words lit, the rest grey), the misses, what came through */
  .climb { margin: 0; text-align: center; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); }
  [data-kuri-line='up'], [data-kuri-line='top'] { color: var(--leaf-text); }
  .got { padding: 4px 12px; border-radius: var(--r-pill); background: var(--ctl-off); font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text); }
  .said { display: grid; gap: 6px; padding: 12px 14px; border-radius: 16px; background: var(--c-card); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip); }
  .en { margin: 0; font: 700 var(--fs-talk)/1.45 var(--font-ui); overflow-wrap: anywhere; }
  .w[data-got='true'] { color: var(--c-ink); background: color-mix(in srgb, var(--c-yuzu) 55%, transparent); border-radius: 4px; }
  .w[data-got='false'] { color: color-mix(in srgb, var(--c-ink) 55%, transparent); }
  .ja { margin: 0; font: 700 var(--fs-body)/1.5 var(--font-ui); color: var(--text-soft); }
  .missed { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 6px; }
  .missed small, .heard small { width: 100%; text-align: center; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .missed .chip { padding: 4px 10px; border-radius: var(--r-pill); background: var(--ctl-off); font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text); }
  .heard { margin: 0; display: grid; gap: 2px; text-align: center; font: 700 var(--fs-body)/1.45 var(--font-ui); color: var(--text); overflow-wrap: anywhere; }

  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .who.pop, .who.talk { animation: none; } }
</style>
