<script lang="ts">
  // フレーズの復習 (docs/english.md "Phrase review"): home's card above today's clip, when phrases are due
  // (phrase-review.ts). One at a time on a PhraseCard (この場面を聞く plays the question's segment), then もう一度 / 覚えた
  // (the spacing only: never a mark). 今日はスキップ ends today's. Nothing shown when none are due or their banks don't load; today's clip never waits for it.
  import { onMount, untrack } from 'svelte';
  import PhraseCard from './PhraseCard.svelte';
  import { loadBank, metaById } from '../data.ts';
  import { dueOf, leftToday, metOf, mineOf, rated, saveMine, skipped, unsaved, type Key } from '../phrase-review.ts';
  import { keyWordsOf, markedIn, splitUse, type Parts } from '../phrases.ts';
  import { s } from '../i18n.ts';
  import { count } from '#lib/sync/log.ts';
  import type { EventRow } from '#lib/contract/api.ts';
  import type { LocalDate, Who } from '#lib/types.ts';
  import type { Question } from '../types.ts';

  let { rows, me, today }: { rows: readonly EventRow[]; me: Who; today: LocalDate } = $props();

  interface Card { k: Key; video: string; title: string; q: Question; en: Parts; ja: string }
  /** Banks fetched for the cards, at most (the due ones beyond wait for another day). */
  const BANKS = 4;

  let mine = $state.raw(untrack(() => mineOf(me)));
  let cards = $state<Card[]>([]);
  let i = $state(0);
  const c = $derived(cards[i]);

  onMount(() => {
    const left = leftToday(mine, today), due = dueOf(metOf(rows, me), mine, today);
    if (left <= 0 || !due.length) return;
    let closed = false;
    void (async () => {
      const out: Card[] = [], seen = new Set<string>(), tried = new Set<string>(), lost: Key[] = [];
      for (const k of due) {
        if (out.length >= left) break;
        const [id, qid] = k.split('/'), m = metaById(id);
        if (!m) lost.push(k);
        if (!m || (!tried.has(id) && tried.size >= BANKS)) continue;
        tried.add(id);
        const bank = await loadBank(m).catch(() => null);
        const q = bank?.questions.find((x) => x.id === qid);
        if (bank && (!q || q.retired || !q.use)) lost.push(k);
        if (!q || q.retired || !q.use) continue;
        const u = splitUse(q.use), key = u.en.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ k, video: m.video, title: m.title, q, en: markedIn(u.en, keyWordsOf(q.line ?? '')), ja: u.ja });
      }
      // a saved phrase whose clip or question is gone since: out of the saved list (it could never show again)
      const dead = lost.filter((k) => mine.k?.[k]);
      if (dead.length) saveMine(me, (mine = dead.reduce(unsaved, mineOf(me))));
      if (!closed) cards = out;
    })();
    return () => (closed = true);
  });

  function next(m: typeof mine, what: string): void {
    mine = m;
    saveMine(me, m);
    count(`act:english.phrase.${what}`);
    i++;
  }
  function skip(): void {
    next(skipped(mine, today), 'skip');
    cards = [];
  }
</script>

{#if c}
  <div class="pr">
    {#key c.k}
      <PhraseCard tag="pr" k={c.k} en={c.en} ja={c.ja} line={c.q.line} source={c.title} video={c.video} title={c.title} seg={c.q.seg}
        onshow={() => count('act:english.phrase.show')}>
        {#snippet head()}
          <div class="head">
            <p class="kicker">{s('prTitle')} <span class="n">{i + 1}/{cards.length}</span></p>
            <button type="button" class="quiet" data-sfx="tick" data-en-pr-skip onclick={skip}>{s('prSkip')}</button>
          </div>
        {/snippet}
        {#snippet actions()}
          <div class="pair">
            <button type="button" class="btn paper" data-sfx="tick" data-en-pr-again onclick={() => next(rated(mine, c.k, today, false), 'again')}>{s('prAgain')}</button>
            <button type="button" class="btn" data-sfx="tick" data-en-pr-kept onclick={() => next(rated(mine, c.k, today, true), 'kept')}>{s('prKept')}</button>
          </div>
        {/snippet}
      </PhraseCard>
    {/key}
  </div>
{/if}

<style>
  .pr { display: grid; flex: none; animation: if-lvl var(--dur-sheet) var(--ease-out); }
  .head { display: flex; align-items: center; justify-content: space-between; margin: -8px -8px -4px 0; }
  .kicker { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .n { font-family: var(--font-num); font-variant-numeric: tabular-nums; margin-left: 4px; }
  .btn { margin: 0; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px; }
</style>
