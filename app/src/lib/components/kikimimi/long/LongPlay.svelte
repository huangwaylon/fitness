<script lang="ts">
  // A round of まるごと 聞く (docs/kikimimi.md "まるごと 聞く"; games/long/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte). The piece plays whole before the first question (LongStage: its speakers, the one talking
  // lifted, its bar; the situation, `ctx`, under it): nothing to answer while it plays. Then a question a round: its
  // angle (話の中心, 言外の意味, 気持ち, 次の行動), one tap on an English choice (ChoiceGrid; easy, the answer and one wrong
  // one). After the first play 「通しで もう一度」 plays it all again (not a replay of the question's: the first's 🔁 is).
  // The reveal: ○ / ×, each choice's Japanese, 解説, and the line that answers it (ここで わかる) with ▶︎. The transcript and
  // the dictation come at the results (LongResults).
  import type { QuizGame } from '../game.svelte.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import type { LongCard } from '#lib/kikimimi/games/long/def.ts';
  import { RIGHT, firstListen } from '#lib/kikimimi/score.ts';
  import { lineItem, minutesOf, okFor, shownFor, speakerAt } from './board.ts';
  import { isCoop } from '../listenView.ts';
  import LongStage from './LongStage.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import ChoiceGrid from '../frame/ChoiceGrid.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Why from '../frame/Why.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as LongCard[]);
  const it = $derived(cards[v.i] as LongCard | undefined);
  /** The piece (the first card: its lines). */
  const piece = $derived(cards[0]);
  const reveal = $derived(v.phase === 'reveal');
  const sent = $derived(v.answers[v.i] ?? null);
  const raw = $derived(rawOf(sent));
  /** The piece playing: nothing to answer yet. */
  const listening = $derived(v.i === 0 && (v.phase === 'lead' || v.phase === 'play'));
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  const shown = $derived(it ? shownFor(v, it) : []);
  const pick = (k: number) => open && game.answer(shown[k]);
  const ok = $derived(!!it && okFor(it, sent));
  const verdict = $derived(v.out ? 'out' : ok ? 'right' : sent ? 'wrong' : 'none');
  const pickedAt = $derived(typeof raw === 'number' ? shown.indexOf(raw) : -1);

  const bar = $derived.by(() => {
    const s = game.sounding;
    if (s && s.at === piece?.id) return { from: s.from, until: s.until, key: `r${s.from}` };
    return listening && v.phase === 'play' ? { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` } : null;
  });
  /** Who's talking now: the lines under way of the piece (its first play, or it all again). */
  const talking = $derived(piece && game.talk && game.talk.at === piece.id ? game.talk.all.map((x) => speakerAt(piece, x.k)).filter((k) => k >= 0) : []);
  const canHear = $derived(v.speaks && !v.out && !listening && !!piece);
  const minutes = $derived(minutesOf(v.playEnd - v.playAt));
  const line = $derived(it && piece?.lines ? piece.lines[it.long.line] : null);
</script>

{#if it && piece}
{#snippet stage()}
  <div class="stage">
    <LongStage speakers={piece.long.speakers} real={piece.long.real} {talking} {bar} now={game.now} small={!listening} />
    {#if listening && it.ctx}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
    {#if canHear && !reveal}
      <div class="again"><HearButton label={t('kiki.long.again')} data-kiki-long-again onclick={() => game.hear(piece)} /></div>
    {/if}
  </div>
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} right={ok} picked={!!sent} pts={RIGHT} badge={firstListen(ok, !!sent?.rp, v.same)} coop={isCoop(v)} rightNow={v.rightNow} />
  {:else if listening}
    <p class="ask" data-kiki-long-wait>{t('kiki.long.wait', { m: minutes })}</p>
  {:else if !v.out}
    <p class="type" data-kiki-long-type={it.long.q}>{t(`kiki.long.type.${it.long.q}`)}</p>
    <p class="ask" data-kiki-long-ask>{it.long.ask}</p>
  {/if}
  {#if !listening && !v.out}
    <ChoiceGrid choices={shown.map((k) => it.choices[k])} right={shown.indexOf(it.answer)} ja={it.cja && shown.map((k) => it.cja![k])} {open} {reveal} dim={false}
      picked={pickedAt >= 0 ? pickedAt : null} onpick={pick} />
  {/if}
  {#if reveal && it.why}<Why text={it.why} />{/if}
  {#if reveal && line && !v.out}
    <div class="evidence obj-cream" data-kiki-long-evidence={it.long.line}>
      <div class="eh">
        <small>{t('kiki.long.evidence')}</small>
        {#if v.speaks}<HearButton label={t('kiki.long.hearLine')} data-kiki-long-hear-line onclick={() => game.hear(lineItem(piece, it.long.line))} />{/if}
      </div>
      <p class="en" lang="en">{line.en}</p>
      <p class="ja">{line.ja}</p>
    </div>
  {/if}
{/snippet}

<RoundFrame {game} {v} now={game.now} me={game.me} type="long-{it.long.q}" answered={!!sent} {verdict} {stage} {input} peek={false} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; gap: 8px; }
  .ctx { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .again { display: flex; justify-content: center; }
  .type { margin: 0; justify-self: center; text-align: center; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .evidence { display: grid; gap: 4px; padding: 10px 12px; border-radius: 16px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .eh { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .eh small { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .en { margin: 0; font: 600 var(--fs-body)/1.5 var(--font-ui); }
  .ja { margin: 0; font: 500 var(--fs-s)/1.5 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
</style>
