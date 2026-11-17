<script lang="ts">
  // フレーズの復習 (docs/english.md "Phrase review"): home's card above today's clip, when phrases are due
  // (phrase-review.ts). One at a time: the English, 意味を見る → its Japanese, the clip's line it came from and the clip's
  // player (この場面を聞く plays the question's segment), then もう一回 / 覚えた (the spacing only: never a mark). 今日はスキップ
  // ends today's. Nothing shown when none are due or their banks don't load; today's clip never waits for it.
  import { onMount, untrack } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Player from './Player.svelte';
  import { loadBank, metaById } from '../data.ts';
  import { dueOf, leftToday, metOf, mineOf, rated, saveMine, skipped, splitUse, type Key } from '../phrase-review.ts';
  import { s } from '../i18n.ts';
  import { count } from '#lib/sync/log.ts';
  import type { YtPlayer } from '../player.svelte.ts';
  import type { EventRow } from '#lib/contract/api.ts';
  import type { LocalDate, Who } from '#lib/types.ts';
  import type { Question } from '../types.ts';

  let { rows, me, today }: { rows: readonly EventRow[]; me: Who; today: LocalDate } = $props();

  interface Card { k: Key; video: string; title: string; q: Question; en: string; ja: string }
  /** Banks fetched for the cards, at most (the due ones beyond wait for another day). */
  const BANKS = 4;

  let mine = $state.raw(untrack(() => mineOf(me)));
  let cards = $state<Card[]>([]);
  let i = $state(0);
  let open = $state(false);
  let player = $state<YtPlayer>();
  const c = $derived(cards[i]);

  onMount(() => {
    const left = leftToday(mine, today), due = dueOf(metOf(rows, me), mine, today);
    if (left <= 0 || !due.length) return;
    let gone = false;
    void (async () => {
      const out: Card[] = [], seen = new Set<string>(), tried = new Set<string>();
      for (const k of due) {
        if (out.length >= left) break;
        const [id, qid] = k.split('/'), m = metaById(id);
        if (!m || (!tried.has(id) && tried.size >= BANKS)) continue;
        tried.add(id);
        const bank = await loadBank(m).catch(() => null);
        const q = bank?.questions.find((x) => x.id === qid);
        if (!q || q.retired || !q.use) continue;
        const u = splitUse(q.use), key = u.en.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({ k, video: m.video, title: m.title, q, ...u });
      }
      if (!gone) cards = out;
    })();
    return () => (gone = true);
  });

  function next(m: typeof mine, what: string): void {
    mine = m;
    saveMine(me, m);
    count(`act:english.phrase.${what}`);
    player = undefined;
    open = false;
    i++;
  }
  function skip(): void {
    next(skipped(mine, today), 'skip');
    cards = [];
  }
  const keyed = (line: string) => line.split(/\*([^*]+)\*/g).map((t, j) => ({ t, key: j % 2 === 1 }));
</script>

{#if c}
  <article class="card pad pr" data-en-pr={c.k}>
    <div class="head">
      <p class="kicker">{s('prTitle')} <span class="n">{i + 1}/{cards.length}</span></p>
      <button type="button" class="quiet" data-sfx="tick" data-en-pr-skip onclick={skip}>{s('prSkip')}</button>
    </div>
    <p class="en" lang="en">{c.en}</p>
    {#if !open}
      <button type="button" class="btn sky" data-sfx="tick" data-en-pr-show onclick={() => ((open = true), count('act:english.phrase.show'))}>{s('prShow')}</button>
    {:else}
      {#if c.ja}<p class="ja" data-en-pr-ja>{c.ja}</p>{/if}
      {#if c.q.line}
        <div class="from">
          <p class="kicker">{s('prFrom')} · <span lang="en">{c.title}</span></p>
          <p class="line" lang="en">{#each keyed(c.q.line) as part, j (j)}{#if part.key}<u>{part.t}</u>{:else}{part.t}{/if}{/each}</p>
        </div>
      {/if}
      <div class="video"><Player video={c.video} title={c.title} bind:player /></div>
      <button type="button" class="btn small paper hear" data-sfx="tick" data-en-pr-hear disabled={!player || player.state === 'loading'} onclick={() => player?.play(c.q.seg[0], c.q.seg[1])}>
        <Icon name="play" size={18} />{s('prHear')}
      </button>
      <div class="pair">
        <button type="button" class="btn paper" data-sfx="tick" data-en-pr-again onclick={() => next(rated(mine, c.k, today, false), 'again')}>{s('prAgain')}</button>
        <button type="button" class="btn" data-sfx="tick" data-en-pr-kept onclick={() => next(rated(mine, c.k, today, true), 'kept')}>{s('prKept')}</button>
      </div>
    {/if}
  </article>
{/if}

<style>
  .pr { display: grid; gap: 8px; flex: none; animation: if-lvl var(--dur-sheet) var(--ease-out); }
  .pr p { margin: 0; }
  .head { display: flex; align-items: center; justify-content: space-between; margin: -8px -8px -4px 0; }
  .kicker { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .n { font-family: var(--font-num); font-variant-numeric: tabular-nums; margin-left: 4px; }
  .quiet { appearance: none; border: 0; background: none; color: var(--text-soft); font: inherit; font-size: var(--fs-s); min-height: var(--hit); padding: 0 8px; cursor: pointer; }
  .en { font: 700 var(--fs-talk)/1.35 var(--font-ui); }
  .ja { font-size: var(--fs-body); padding: 8px 10px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); color: var(--c-ink); }
  .from { display: grid; gap: 2px; }
  .line { font-size: var(--fs-body); line-height: 1.45; font-style: italic; }
  .line u { font-style: normal; font-weight: 700; text-decoration: underline 2px var(--c-leaf); text-underline-offset: 3px; }
  .video { border-radius: var(--r-row); overflow: hidden; }
  .btn { margin: 0; }
  .btn.sky { --fill: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); --lip-c: var(--c-edge); color: var(--c-ink); }
  .hear { justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 2px; }
</style>
