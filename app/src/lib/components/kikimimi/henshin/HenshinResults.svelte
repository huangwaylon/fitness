<script lang="ts">
  // 音の へんしん's results (docs/kikimimi.md "音の へんしん"), its own chunk, in the frame's (frame/Results.svelte: しずえ's
  // line, co-op's 「ふたりで k / n」, how many I got right, my いっぱつ, おわる / もういっかい). Then today's phenomenon and the
  // review list (frame/ReviewList.svelte), the misses first: each phrase as said with its sound mark, the full form beside
  // the spelling as said, the Japanese, the trap's note, and its three takes to compare (はっきり, ふつう, 速く). A miss
  // comes back in おさらい through another phrase of its phenomenon (srs.ts). もういっかい: the host a new deal.
  import type { QuizGame } from '../game.svelte.ts';
  import { henshinOk, type HenshinCard } from '#lib/kikimimi/games/henshin/def.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import { henshinOpts } from '#lib/kikimimi/games/henshin/def.ts';
  import { PHENOMENA } from '#lib/kikimimi/henshin.ts';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import { TAKES, roundFor, takeOf } from './round.ts';
  import { playAgain } from '../listenView.ts';
  import ResultsFrame from '../frame/Results.svelte';
  import ReviewList from '../frame/ReviewList.svelte';
  import ReviewRow from '../frame/ReviewRow.svelte';
  import HearButton from '../frame/HearButton.svelte';
  import Note from '../frame/Note.svelte';
  import SoundLine from '../scene/SoundLine.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, ondone }: { game: QuizGame; onagain: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as HenshinCard[]);
  const rows = $derived(cards.map((c, i) => {
    const a = v.answers[i], r = roundFor(v, c), ok = !!r && !!a && henshinOk(r, rawOf(a)!);
    return { c, i, ok, first: firstListen(ok, !!a?.rp, v.same) };
  }));
  const tally = $derived(rows.filter((r) => r.ok).length);
  const firsts = $derived(rows.filter((r) => r.first).length);
  const line = $derived(t(tally >= cards.length ? 'kiki.henshin.host.all' : tally * 2 >= cards.length ? 'kiki.henshin.host.some' : 'kiki.henshin.host.few'));
  const today = $derived(PHENOMENA[henshinOpts.decode(v.o)?.focus ?? 0]);

  // with misses, the list opens on them, the first one open
  // svelte-ignore state_referenced_locally
  let missedOnly = $state(rows.some((r) => !r.ok));
  // svelte-ignore state_referenced_locally
  let opened = $state<number[]>(rows.filter((r) => !r.ok).slice(0, 1).map((r) => r.i));
  const toggle = (i: number) => (opened = opened.includes(i) ? opened.filter((x) => x !== i) : [...opened, i]);
  const shown = $derived(rows.filter((r) => !missedOnly || !r.ok));
  const playing = (c: HenshinCard) => (game.sounding && game.sounding.i === -1 && game.sounding.at === c.id ? game.sounding.from : null);

  const again = () => playAgain(game, 'henshin', onagain);
</script>

<ResultsFrame {v} {tally} of={cards.length} {firsts} {line} {ondone} onagain={again}>
  <p class="today" data-kiki-henshin-today>{t('kiki.henshin.today', { ph: t(`kiki.henshin.ph.${today}`) })} <span lang="en">{t(`kiki.henshin.eg.${today}`)}</span></p>
  <ReviewList bind:missedOnly none={!shown.length}>
    <ul class="review">
      {#each shown as r (r.i)}
        {@const open = opened.includes(r.i)}
        <ReviewRow i={r.i} ok={r.ok} {open} ontoggle={() => toggle(r.i)} first={r.first}>
          {#snippet summary()}
            {#if open}<span class="en big" data-kiki-review-en><SoundLine en={r.c.en} marks={r.c.marks} clip={r.c.id} from={playing(r.c)} clock={() => game.clock()} /></span>
            {:else}<span class="en" lang="en">{r.c.en}</span>{/if}
          {/snippet}
          {#snippet hear()}<HearButton data-kiki-hear={r.i} onclick={() => game.hear(r.c)} />{/snippet}
          {#if r.c.hs}<p class="form" lang="en">{t('kiki.henshin.form', { red: r.c.hs.red, full: r.c.hs.full ?? r.c.focus ?? '' })}</p>{/if}
          <p class="ja">{r.c.ja}</p>
          <div class="takes" data-kiki-henshin-takes>
            {#each TAKES as [take, suffix] (take)}
              <button type="button" class="btn small paper" data-kiki-take={take} data-sfx="tick" onclick={() => game.hear(takeOf(r.c, suffix))}>{t(`kiki.henshin.${take}`)}</button>
            {/each}
          </div>
          {#if r.c.note}<Note text={r.c.note} />{/if}
        </ReviewRow>
      {/each}
    </ul>
  </ReviewList>
</ResultsFrame>

<style>
  .today { margin: 0 4px; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .review { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  .en { margin: 0; font: 700 17px/1.4 var(--font-ui); }
  .en.big { font-size: max(17px, var(--fs-talk)); }
  .form { margin: 0; justify-self: start; padding: 3px 10px; border-radius: var(--r-pill); background: var(--c-mint); color: var(--c-ink); font: 700 var(--fs-body)/1.3 var(--font-ui); }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .takes { display: flex; flex-wrap: wrap; gap: 8px; }
</style>
