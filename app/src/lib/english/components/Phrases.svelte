<script lang="ts">
  // フレーズ (docs/english.md "フレーズ"): English Study's second tab, the deck (deck.ts) one card at a time, SET a set.
  // The card is PhraseCard's: its head the clip's thumbnail with 1/5 and show · title; on its back a say-it hint, then
  // ☆ 復習に入れる beside 次へ ›. After SET: 「5枚見ました · これまで N」, もう5枚 / ホームへ.
  // Never a score. The place is this phone's (deck.ts), so the tab comes back to the same card, face down.
  import { onMount, untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import PhraseCard from './PhraseCard.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Thumb from './Thumb.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { localDateAt } from '#lib/time/dates.ts';
  import { count } from '#lib/sync/log.ts';
  import { LIBRARY, loadShard, metaById } from '../data.ts';
  import { cursorOf, heldOf, keyOf, newSet, nextShard, onCard, ordered, passed, revealed, saveCursor, SET, shardAt, type Cursor } from '../deck.ts';
  import { mineOf, saved, saveMine, unsaved } from '../phrase-review.ts';
  import { keyWordsOf, markedIn, splitUse } from '../phrases.ts';
  import { dailyOf, studyOf } from '../progress.ts';
  import { skipsOf } from '../prefs.ts';
  import { SHARDS, type PhraseEntry } from '../catalog.ts';
  import { s } from '../i18n.ts';
  import type { Who } from '#lib/types.ts';

  let { onhome, onclose }: { onhome: () => void; onclose: () => void } = $props();

  const me = untrack(() => (week.model?.me ?? 'A') as Who);
  const today = untrack(() => localDateAt(week.model?.now ?? Date.now()));
  /** Today's clip and the next two in the plan: their cards wait for their lessons. */
  const held = untrack(() => {
    const mine = studyOf(week.model?.state.listen ?? [], me, me), skipped = skipsOf(me, today);
    const daily = dailyOf(LIBRARY, mine, skipped);
    return daily ? heldOf(LIBRARY.map((c) => c.id), daily.id, (id) => !mine.clips.has(id) && !skipped.has(id)) : new Set<string>();
  });

  let c = $state.raw<Cursor>(untrack(() => cursorOf(me)));
  /** The cursor's shard, in my order. */
  let cards = $state.raw<PhraseEntry[]>([]);
  let status = $state<'loading' | 'ok' | 'failed'>('loading');
  let review = $state.raw(untrack(() => mineOf(me)));
  let online = $state(typeof navigator === 'undefined' || navigator.onLine !== false);

  const ended = $derived(c.set.length >= SET);
  const card = $derived(status === 'ok' && !ended ? cards[c.i] : undefined);
  const view = $derived.by(() => {
    if (!card) return null;
    const m = metaById(card[0]), u = splitUse(card[4]);
    return { k: keyOf(card), m, ja: u.ja, en: markedIn(u.en, keyWordsOf(card[5])), mean: card[6], line: card[5], seg: [card[2], card[3]] as const };
  });
  const isSaved = $derived(!!view && !!review.k?.[view.k]);

  function move(to: Cursor): void {
    c = to;
    saveCursor(me, to);
  }
  /** The cursor onto the next card it may show: this shard's now if one's left, else the next shards' (fetched). */
  async function settle(): Promise<void> {
    let x = c;
    const now = cards.length && onCard(x, cards, held);
    if (now) return move(now);
    status = 'loading';
    for (let tries = 0; tries <= SHARDS; tries++) {
      let list: PhraseEntry[];
      try {
        list = ordered(me, x.r, await loadShard(shardAt(me, x)));
      } catch {
        status = 'failed';
        return;
      }
      const at = onCard(x, list, held);
      if (at) {
        cards = list;
        move(at);
        status = 'ok';
        return;
      }
      x = nextShard(x);
    }
    status = 'failed';
  }

  onMount(() => {
    count('act:english.deck.show');
    if (!ended) void settle();
    const on = () => (online = true), off = () => (online = false);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => (removeEventListener('online', on), removeEventListener('offline', off));
  });

  function reveal(): void {
    if (card) move(revealed(c, card));
    count('act:english.deck.reveal');
  }
  function next(): void {
    if (!card) return;
    move(passed(c, card));
    if (!ended) void settle();
  }
  function more(): void {
    count('act:english.deck.more');
    move(newSet(c));
    void settle();
  }
  function save(): void {
    if (!view) return;
    const was = mineOf(me);
    review = was.k?.[view.k] ? unsaved(was, view.k) : saved(was, view.k, today);
    saveMine(me, review);
    if (review.k?.[view.k]) count('act:english.deck.save');
  }
</script>

<section class="screen" data-en-phrases-tab>
  <div class="top"><NavBar pad title={s('tabPhrases')} {onclose} /></div>
  <div class="body sheet-scroll">
    {#if ended}
      <article class="card pad end" data-en-deck-end>
        <p class="done">{s('deckDone', { n: SET })} · {s('deckSoFar', { n: c.n })}</p>
        <div class="pair">
          <button type="button" class="btn paper" data-sfx="tick" data-en-deck-home onclick={onhome}>{s('deckHome')}</button>
          <button type="button" class="btn" data-sfx="tick" data-en-deck-more onclick={more}>{s('deckMore', { n: SET })}</button>
        </div>
      </article>
    {:else if view}
      {#key view.k}
        <PhraseCard tag="deck" k={view.k} en={view.en} ja={view.ja} line={view.line} mean={view.mean} video={view.m?.video} title={view.m?.title ?? ''} seg={view.seg}
          onshow={reveal} onhear={() => count('act:english.deck.play')}>
          {#snippet head()}
            <div class="head">
              {#if view.m}<Thumb video={view.m.video} show={view.m.show} />{/if}
              <p class="kicker"><span class="n">{c.set.length + 1}/{SET}</span>{#if view.m}<span class="t" lang="en">{`${view.m.show} · ${view.m.title}`}</span>{/if}</p>
            </div>
          {/snippet}
          {#snippet actions()}
            <p class="say">{s('deckSay')}</p>
            <div class="pair save">
              <button type="button" class="btn paper" data-sfx="tick" data-en-deck-save aria-pressed={isSaved} onclick={save}>{isSaved ? s('deckSaved') : s('deckSave')}</button>
              <button type="button" class="btn" data-sfx="page" data-en-deck-next onclick={next}>{s('next')}<Icon name="chevron-right" /></button>
            </div>
          {/snippet}
        </PhraseCard>
      {/key}
    {:else if status === 'failed'}
      <div class="card pad note" data-en-deck-failed>
        <p>{online ? s('deckFailed') : s('deckOffline')}</p>
        <button type="button" class="btn small paper" data-sfx="tick" onclick={settle}>{s('retryBank')}</button>
      </div>
    {:else}
      <p class="wait">{s('loading')}</p>
    {/if}
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .body { display: flex; flex-direction: column; gap: 12px; padding: 4px calc(12px + var(--safe-right)) 24px calc(12px + var(--safe-left)); scrollbar-width: none; }
  .card { flex: none; }
  .end, .note { display: grid; gap: 8px; }
  p { margin: 0; }
  .head { display: flex; gap: 10px; align-items: center; min-width: 0; }
  .kicker { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .head .kicker { display: grid; white-space: normal; }
  .t { font-weight: 600; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
  .n { font-family: var(--font-num); font-variant-numeric: tabular-nums; }
  .btn { margin: 0; }
  .say { font-size: var(--fs-s); color: var(--text-soft); }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px; }
  .pair.save { grid-template-columns: 3fr 2fr; }
  .pair .btn { white-space: nowrap; padding-inline: 8px; }
  .done { font-weight: 700; text-align: center; padding: 8px 0; }
  .note { justify-items: center; text-align: center; }
  .wait { color: var(--text-soft); text-align: center; padding: 24px 0; }
</style>
