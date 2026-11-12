<script lang="ts">
  // A card of はつおん ききわけ (docs/kikimimi-mic.md "はつおん ききわけ"; games/pair/def.ts), its own chunk, in the round's frame. Two
  // pictures with their labels and words; both words play first (each lit as it's said). Then, solo: 「rice と言ってみよう」,
  // the mic (SayButton: the two words are the recogniser's candidates), and the villager shows what they heard, the
  // wrong word a joke (「え、 しらみ？！」), never a ✗; two tries a card, とばす. Hard to tell, nothing to tell it with
  // (no recogniser on this phone) or a failed take: 「聞いて選んでね」, the pictures then take my own pick. Co-op あてっこ:
  // the speaker of the round (role i % 2) sees the word and says it out loud (言えた); the other taps the picture they
  // heard. The reveal: 通じた！ or what it sounded like, 解説, and each word's mouth tip and line. 🔊 on a picture plays its
  // word again. What was heard lives in this page only, for the round.
  import { onDestroy, onMount, untrack } from 'svelte';
  import '#lib/i18n/kiki-pair.ts';
  import type { QuizGame } from '../game.svelte.ts';
  import { SAID, UNSURE, sayOf } from '#lib/kikimimi/games/pair/def.ts';
  import type { PairCard } from '#lib/kikimimi/games/pair/pairs.ts';
  import type { Outcome, Recogniser } from '#lib/mic/stt.ts';
  import { sttRound } from '../mic/sttRound.ts';
  import { heardOf, mySay, wordItem, type Heard } from './board.ts';
  import { isCoop } from '../listenView.ts';
  import SayButton from './SayButton.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import Why from '../frame/Why.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const it = $derived((game.items as PairCard[])[v.i] as PairCard | undefined);
  const words = $derived(it?.pair.words ?? []);
  const say = $derived(it ? sayOf(v.seed, it.id) : 0);
  const coop = $derived(isCoop(v));
  /** I say this round's word (solo: always; あてっこ: my role's turn). */
  const speaker = $derived(mySay(v, game.me, v.i));
  const reveal = $derived(v.phase === 'reveal');
  const sent = $derived(v.answers[v.i] ?? null);
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  const key = $derived(`${v.g}:${v.i}`);

  /** The recogniser (solo only), once ready; `readied`: the asking is over (null then: none on this phone). */
  const stt = sttRound();
  let r = $state.raw<Recogniser | null>(null);
  let readied = $state(false);
  let gone = false;
  onMount(async () => {
    if (isCoop(v)) return void (readied = true);
    const x = await stt.ready();
    if (x && !gone) r = x;
    readied = true;
  });
  onDestroy(() => {
    gone = true;
    stt.release();
  });

  /** This card's tries and what the villager made of the last one (this page's memory only). */
  let tries = $state(0);
  let last = $state.raw<Heard | null>(null);
  $effect.pre(() => {
    void key;
    untrack(() => ((tries = 0), (last = null)));
  });

  /** The pictures take my own pick: no recogniser, or the last take couldn't be told or failed. */
  const self = $derived(!coop && readied && (!r || (!!last && (('k' in last && last.k < 0) || 'miss' in last))));
  /** A picture's tap answers: my own pick (solo), the listener's (あてっこ). */
  const picks = $derived(open && (coop ? !speaker : self));

  function heard(o: Outcome) {
    if (!open) return;
    const h = heardOf(o, words.map((w) => w.en));
    last = h;
    if ('none' in h) return;
    tries++;
    // right, or the second try: the villager's word is my answer
    if ('k' in h && h.k >= 0 && (h.k === say || tries >= 2)) game.answer(h.k);
  }
  const choose = (k: number) => picks && game.answer(k);
  const hearWord = (k: number) => it && v.speaks && game.hear(wordItem(it, k));
  const tap = (k: number) => (picks ? choose(k) : (v.phase === 'answer' || reveal) && hearWord(k));

  /** At the reveal, the word heard: mine (solo) or the listener's tap (あてっこ); null: skipped, or none came. */
  const got = $derived.by((): number | null => {
    if (!reveal) return null;
    const k = coop ? (speaker ? v.players.find((p) => p.who !== game.me && p.pick && p.pick.k <= 1)?.pick?.k : sent?.k) : sent?.k;
    return k === 0 || k === 1 ? k : null;
  });
  const right = $derived(got === say);
  const verdict = $derived(v.out ? 'out' : right ? 'right' : got === null && !coop ? 'none' : 'wrong');
  /** The word the villager shows as heard: the reveal's, else this try's. */
  const shown = $derived(reveal ? got : last && 'k' in last && last.k >= 0 ? last.k : null);
  /** The talking word as the pair plays (the clip player's line), lit. */
  const talking = $derived(game.talk && game.talk.i === v.i ? game.talk.k : -1);

  /** The villager's reaction (spaced kana), on what was heard. */
  const react = $derived.by((): string | null => {
    const w = (k: number) => ({ kana: words[k].kana, w: words[k].en });
    if (reveal) return got === null ? t('kiki.pair.react.skip') : t(right ? 'kiki.pair.react.right' : 'kiki.pair.react.wrong', w(got));
    if (!last || reveal) return null;
    if ('none' in last) return t('kiki.pair.react.none');
    if ('miss' in last || last.k < 0) return t('kiki.pair.react.unsure');
    return t(last.k === say ? 'kiki.pair.react.right' : 'kiki.pair.react.wrong', w(last.k));
  });
  /** The line under the pictures while I answer. */
  const hint = $derived.by((): string | null => {
    if (!open || coop) return null;
    if (!readied) return t('kiki.pair.readying');
    if (!r) return t('kiki.pair.self');
    if (last && 'none' in last) return t('kiki.pair.none');
    if (last && 'miss' in last) return t('kiki.pair.miss');
    if (last && last.k < 0) return t('kiki.pair.unsure');
    if (last && last.k !== say) return t('kiki.pair.once');
    return null;
  });
  const missed = $derived(!!last && 'k' in last && last.k >= 0 && last.k !== say);
</script>

{#if it}
{#snippet picture(k: number)}
  {@const w = words[k]}
  {@const target = speaker && !v.out && (v.phase === 'answer' || reveal) || (reveal && coop)}
  <div class="pic-card" class:target={target && k === say} class:lit={talking === k} class:heard={shown === k} class:dim={target && k !== say && !reveal && !picks}
    data-pair-word={k} data-pair-target={target && k === say ? 1 : 0} data-pair-heard={shown === k ? 1 : 0}>
    <button type="button" class="face" data-pair-pick={k} aria-disabled={!picks && !v.speaks} data-sfx="tick" onclick={() => tap(k)}
      aria-label={picks ? `${w.ja} ${w.en}` : t('kiki.pair.hear', { w: w.en })}>
      <span class="emoji" class:num={/^\d+$/.test(w.pic)} aria-hidden="true">{w.pic}</span>
      {#if w.ja !== w.pic}<span class="ja">{w.ja}</span>{/if}
      <span class="en" lang="en">{w.en}</span>
    </button>
    {#if target && k === say && !reveal}<span class="tag">{t('kiki.pair.target')}</span>{/if}
    {#if picks}
      <button type="button" class="ear" aria-label={t('kiki.pair.hear', { w: w.en })} aria-disabled={!v.speaks} data-pair-hear={k} data-sfx="tick" onclick={() => hearWord(k)}>🔊</button>
    {/if}
  </div>
{/snippet}

{#snippet stage()}
  <div class="stage">
    <span class="speaker" class:pop={v.phase === 'lead'} class:talk={v.phase === 'play'}>
      <OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={56} eager />
    </span>
    <div class="bubble obj-cream" aria-live="polite">
      {#if react}
        <p class="react kana" class:ok={reveal ? right : !!last && 'k' in last && last.k === say} data-pair-react>{react}</p>
      {:else if v.phase === 'lead' || v.phase === 'play'}
        <p class="ask" data-pair-listen><small>{t('kiki.pair.listen')}</small><span class="notes" aria-hidden="true">♪…</span></p>
      {:else if coop && !speaker && !reveal}
        <p class="ask">{t('kiki.pair.coop.listen')}</p>
      {:else if coop && !reveal}
        <p class="ask"><small>{t('kiki.pair.coop.say')}</small> <b lang="en" data-pair-say>{words[say].en}</b></p>
      {:else}
        <p class="ask" data-pair-ask>{t('kiki.pair.ask', { w: words[say].en })}</p>
      {/if}
    </div>
    {#if it.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
  </div>
{/snippet}

{#snippet line()}
  <p class:ok={right} data-pair-verdict={right ? 'right' : got === null ? 'skip' : 'wrong'}>
    {#if right}{t('kiki.pair.verdict.right')}
    {:else if got !== null}{t(coop ? 'kiki.pair.coop.wrong' : 'kiki.pair.verdict.wrong', { w: words[got].ja })}
    {:else}{t(coop ? 'kiki.pair.coop.none' : 'kiki.pair.verdict.skip')}{/if}
  </p>
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} {right} picked={got !== null} pts={0} coop={false} rightNow={0} {line} />
  {/if}
  <div class="pics" data-pair-pics={picks ? 'pick' : 'hear'}>{@render picture(0)}{@render picture(1)}</div>

  {#if open && coop}
    <p class="hint">{speaker ? t('kiki.pair.coop.sayHint') : t('kiki.pair.coop.tap')}</p>
    {#if speaker}
      <div class="acts"><button type="button" class="btn" data-pair-said data-sfx="confirm" onclick={() => game.answer(SAID)}>✓ {t('kiki.pair.coop.said')}</button></div>
    {/if}
  {:else if open}
    {#if hint}<p class="hint" role="status" data-pair-hint>{hint}</p>{/if}
    {#if missed}<p class="tip" data-pair-tip><b>{t('kiki.pair.tip')}</b> {words[say].how}</p>{/if}
    {#if r}
      <div class="talk" data-pair-ready="1">
        <SayButton {r} words={words.map((w) => w.en)} onheard={heard} />
        {#if tries}<span class="tries" data-pair-tries={tries}>{t('kiki.pair.try', { n: tries })}</span>{/if}
      </div>
    {/if}
    <p class="hint small">{t('kiki.pair.private')}</p>
    <div class="acts"><button type="button" class="btn paper" data-pair-skip data-sfx="tick" onclick={() => game.answer(UNSURE)}>{t('kiki.pair.skip')}</button></div>
  {/if}
{/snippet}

{#snippet after()}
  {#if reveal && !v.out}
    {#if it.why}<Why text={it.why} />{/if}
    <section class="hows card" aria-label={t('kiki.pair.how')}>
      {#each words as w, k (w.en)}
        <div class="how" data-pair-how={k}>
          <button type="button" class="ib" aria-label={t('kiki.pair.hear', { w: w.en })} aria-disabled={!v.speaks} data-sfx="tick" onclick={() => hearWord(k)}>▶︎</button>
          <div>
            <p class="w"><b lang="en">{w.en}</b> <span>{w.ja}</span></p>
            <p class="mouth">{w.how}</p>
            <p class="ex"><span lang="en">{w.ex}</span><small>{w.exJa}</small></p>
          </div>
        </div>
      {/each}
    </section>
  {/if}
{/snippet}

<RoundFrame {game} {v} now={game.now} me={game.me} type="pair" answered={!!sent} {verdict} {stage} {input} {after} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 4px 2px; }
  .speaker { position: relative; line-height: 0; transform-origin: 50% 100%; }
  .speaker.pop { animation: pop-in 420ms var(--ease-bounce) both; }
  .speaker.talk { animation: bob 520ms ease-in-out infinite alternate; }
  .bubble {
    position: relative; min-height: 60px; display: grid; align-content: center; gap: 4px; padding: 10px 16px;
    border-radius: 28px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream);
  }
  .bubble::before { content: ''; position: absolute; left: -9px; top: 50%; width: 20px; height: 20px; margin-top: -10px; rotate: 45deg; background: var(--c-card); border-radius: 4px; }
  .notes { font: 700 var(--fs-title)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .1em; }
  .ask { margin: 0; font: 700 var(--fs-talk)/1.35 var(--font-ui); position: relative; }
  .ask small { display: block; font-size: var(--fs-s); color: var(--c-ink-soft); }
  .ask b { font-size: 1.25em; }
  .react { margin: 0; font: 700 var(--fs-talk)/1.35 var(--font-ui); color: var(--coral-text); position: relative; }
  .react.ok { color: var(--leaf-text); }
  .ctx { grid-column: 1 / -1; margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .pics { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .pic-card { position: relative; display: grid; transition: transform var(--dur-quick) var(--ease-bounce), opacity var(--dur-quick); }
  .face {
    display: grid; justify-items: center; gap: 2px; padding: 14px 8px 12px; border: 0; border-radius: 22px; cursor: pointer;
    background: var(--card); color: var(--text); box-shadow: inset 0 0 0 2px var(--edge), 0 var(--lip-h) 0 var(--edge);
  }
  .emoji { font: 400 56px/1.1 var(--font-ui); }
  .emoji.num { font: 700 46px/1.3 var(--font-num); color: var(--text); }
  .ja { font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .en { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .pic-card.lit .face { box-shadow: inset 0 0 0 3px var(--c-yuzu), 0 var(--lip-h) 0 var(--edge); }
  .pic-card.target .face { box-shadow: inset 0 0 0 3px var(--c-leaf-edge), 0 var(--lip-h) 0 var(--c-leaf-edge); background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  .pic-card.dim { opacity: .55; }
  /* what the villager heard pops up */
  .pic-card.heard { transform: translateY(-6px) scale(1.04); }
  .pic-card.heard:not(.target) .face { box-shadow: inset 0 0 0 3px var(--c-coral), 0 var(--lip-h) 0 var(--c-coral); }
  .tag { position: absolute; top: -10px; left: 50%; translate: -50% 0; padding: 2px 10px; border-radius: var(--r-pill); background: var(--c-leaf-edge); color: var(--c-card); font: 700 var(--fs-s)/1.4 var(--font-ui); white-space: nowrap; }
  .ear { position: absolute; top: 6px; right: 6px; width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--ctl-off); font: 400 18px/1 var(--font-ui); cursor: pointer; }
  .hint { margin: 0 4px; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .tip { margin: 0; padding: 8px 12px; border-radius: 12px; background: color-mix(in srgb, var(--c-yuzu) 35%, var(--card)); font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .tip b { margin-right: 6px; font-size: var(--fs-s); color: var(--text-soft); }
  .talk { position: relative; display: flex; justify-content: center; min-height: 112px; align-items: center; }
  .tries { position: absolute; right: 8px; bottom: 8px; font: 700 var(--fs-s)/1.2 var(--font-num); color: var(--text-soft); }
  .acts { display: flex; justify-content: center; }
  .acts .btn { min-width: 9em; }
  :global([data-pair-verdict]) { margin: 0; font: 700 var(--fs-title)/1.2 var(--font-ui); color: var(--coral-text); text-align: center; }
  :global([data-pair-verdict].ok) { color: var(--leaf-text); }
  .hows { display: grid; gap: 10px; padding: 12px 14px; }
  .how { display: grid; grid-template-columns: var(--hit) 1fr; gap: 10px; align-items: start; }
  .how p { margin: 0; }
  .ib { width: var(--hit); height: var(--hit); border: 0; border-radius: 50%; background: var(--ctl-off); color: var(--text); font: 700 var(--fs-body)/1 var(--font-ui); cursor: pointer; }
  .w { font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .w span { margin-left: 6px; font-size: var(--fs-s); color: var(--text-soft); }
  .mouth { font: 700 var(--fs-s)/1.5 var(--font-ui); }
  .ex { display: grid; font: 600 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @media (prefers-reduced-motion: reduce) { .speaker.pop, .speaker.talk, .pic-card { animation: none; transition: none; } }
</style>
