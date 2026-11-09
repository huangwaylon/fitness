<script lang="ts">
  // まるごと 聞く's results (docs/kikimimi.md "まるごと 聞く"), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, the team's tally, how many I got right, おわる / もういっかい): co-op's 「ふたりで k / n」 counts the questions
  // everyone got (the session's `team.all`). Then the review list (a row per question, the misses first open: the right
  // answer and mine in Japanese, 解説), where a real recording comes from (its credit), the transcript (LongTranscript:
  // each line to hear alone, the questions' lines marked) and the dictation (LongDictation: a line or two near my misses,
  // its words blanked in the transcript until it's done), whose answers are a row of their own (QuizGame.keepMore).
  import type { QuizGame } from '../game.svelte.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import { dictFor, longOpts, longTier, type LongCard } from '#lib/kikimimi/games/long/def.ts';
  import { lineItem, okFor } from './board.ts';
  import { isCoop, playAgain } from '../listenView.ts';
  import { jaMode } from '../prefs.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Why from '../frame/Why.svelte';
  import Note from '../frame/Note.svelte';
  import LongTranscript from './LongTranscript.svelte';
  import LongDictation from './LongDictation.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as LongCard[]);
  const piece = $derived(cards[0]);
  const coop = $derived(isCoop(v));
  /** A choice in Japanese (its `cja`), else as said. */
  const said = (c: LongCard, k: number | null): string | null => (k === null ? null : (c.cja?.[k] ?? c.choices[k] ?? null));
  const mine = $derived(cards.map((_, i) => {
    const x = rawOf(v.answers[i]);
    return typeof x === 'number' ? x : null;
  }));
  const rows = $derived(cards.map((c, i) => ({ c, i, ok: okFor(c, v.answers[i]), right: said(c, c.answer), mine: said(c, mine[i]) })));
  const tally = $derived(rows.filter((r) => r.ok).length);
  const made = $derived(coop ? v.team.all : tally);
  const line = $derived(t(made >= cards.length ? 'kiki.long.host.all' : made * 2 >= cards.length ? 'kiki.long.host.some' : 'kiki.long.host.few'));
  const frameV = $derived({ ...v, team: { ...v.team, right: v.team.all, all: 0 } });

  // with misses, the list opens on them, the first one open (the filter and the rows are mine after)
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(rows.some((r) => !r.ok));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>(rows.filter((r) => !r.ok).slice(0, 1).map((r) => r.i));
  const toggle = (i: number) => (opened = opened.includes(i) ? opened.filter((x) => x !== i) : [...opened, i]);
  const shown = $derived(rows.filter((r) => !missedOnly || !r.ok));

  // the dictation: picked once from my answers as the results open (game.svelte.ts keeps the view's answers)
  // svelte-ignore state_referenced_locally
  const dicts = dictFor(cards, mine);
  // svelte-ignore state_referenced_locally
  const missed = rows.some((r) => !r.ok);
  const tier = $derived.by(() => {
    const o = longOpts.decode(v.o);
    return o ? longTier(o.ear) : undefined;
  });
  let written = $state<boolean[][] | null>(null);
  const began = Date.now();
  const blanks = $derived(new Map(written ? [] : dicts.map((d) => [d.line, d.words] as const)));
  function dictated(r: [string, 0 | 1, number, number][], ok: boolean[][]) {
    written = ok;
    game.keepMore(r, Date.now() - began);
  }

  const marks = $derived(cards.map((c, i) => ({ line: c.long.line, n: i + 1, ok: rows[i].ok })));
  const canHear = $derived(v.speaks && !!piece?.lines);
  const sounding = $derived.by(() => {
    const s = game.sounding;
    if (!s || !piece?.lines || s.i !== -1) return -1;
    if (s.at === piece.id) return game.talk && game.talk.at === piece.id ? game.talk.k : -1;
    return piece.lines.findIndex((l) => l.clip === s.at);
  });
  const hearLine = (k: number) => piece && game.hear(lineItem(piece, k));
  const credit = $derived(piece?.long.credit);
  const again = () => playAgain(game, 'long', onagain);
</script>

<ResultsFrame v={frameV} {tally} of={cards.length} firsts={0} {line} {ondone} onagain={again}>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        <ReviewRow i={r.i} ok={r.ok} open={opened.includes(r.i)} ontoggle={() => toggle(r.i)}>
          {#snippet summary()}{r.c.long.ask}{/snippet}
          <p class="ans">{t('kiki.long.answer', { a: r.right ?? '' })}</p>
          {#if !r.ok}<p class="picked" data-kiki-long-mine>{t('kiki.long.mine', { a: r.mine ?? t('kiki.timeUp') })}</p>{/if}
          {#if r.c.why}<Why text={r.c.why} />{/if}
        </ReviewRow>
      {/each}
    </ul>
  </ReviewList>
  {#if piece?.lines}
    <section class="card sec" data-kiki-long-script-card>
      <div class="sh">
        <h3>{t('kiki.long.script')}</h3>
        {#if canHear}<HearButton label={t('kiki.long.again')} data-kiki-hear="long" onclick={() => game.hear(piece)} />{/if}
      </div>
      {#if credit}
        <p class="credit" data-kiki-long-credit>
          {t('kiki.long.credit', { by: credit.by })}<br />
          <a href={credit.url} target="_blank" rel="noopener noreferrer" data-sfx="open">{credit.title}</a> ·
          <a href={credit.licenceUrl} target="_blank" rel="noopener noreferrer" data-sfx="open">{t('kiki.long.licence', { l: credit.licence })}</a>
        </p>
      {/if}
      {#if piece.note}<Note text={piece.note} />{/if}
      <p class="hint">{t('kiki.long.scriptHint')}</p>
      <LongTranscript {piece} {marks} {blanks} {sounding} showJa={jaMode() !== 'never'} {canHear} onhear={hearLine} />
    </section>
    {#if dicts.length}
      <section class="card sec" data-kiki-long-dict-card>
        <h3>{t('kiki.long.dict')}</h3>
        <LongDictation {piece} {dicts} {tier} {missed} {canHear} onhear={hearLine} ondone={dictated} />
      </section>
    {/if}
  {/if}
</ResultsFrame>

<style>
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .ans, .picked { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .picked { color: var(--coral-text); }
  .sec { display: grid; gap: 8px; padding: 12px; }
  .sec h3 { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .sh { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .credit { margin: 0; font: 500 13px/1.5 var(--font-ui); color: var(--text-soft); overflow-wrap: anywhere; }
  .credit a { color: inherit; }
  .hint { margin: 0; font: 600 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
</style>
