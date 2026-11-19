<script lang="ts">
  // 英語すごろく's ふりかえり (docs/sugoroku.md "Rules"): the game's words, lines and pictures that have Japanese, up to
  // five, as two columns to match (tap one, then its other half: either column first); a pair found fades out, a mismatch just lets go
  // (no mark, no sound of failure). All found: できた！ Skippable: it's only on the results.
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { seeded, shuffle } from '#lib/random.ts';
  import { s } from '../i18n.ts';

  let { pairs, seed }: { pairs: readonly { en: string; ja: string }[]; seed: string } = $props();
  const left = $derived(pairs.map((p, i) => ({ i, t: p.en })));
  // (never left in the English's order: a shuffle that changed nothing goes again)
  const right = $derived.by(() => {
    const r = seeded(`${seed}:review`);
    let out = pairs.map((p, i) => ({ i, t: p.ja }));
    for (let k = 0; k < 5 && (k === 0 || out.every((x, j) => x.i === j)); k++) out = shuffle([...out], r);
    return out;
  });
  /** The one held (either column first), till its pair's other half is tapped. */
  let held = $state<{ side: 'en' | 'ja'; i: number } | null>(null);
  let found = $state<number[]>([]);
  function tap(side: 'en' | 'ja', i: number) {
    if (!held || held.side === side) return void (held = held?.side === side && held.i === i ? null : { side, i });
    // (the pairs' Japanese are all different: results.ts pairsOf)
    if (held.i === i) found = [...found, i];
    held = null;
  }
  const on = (side: 'en' | 'ja', i: number) => held?.side === side && held.i === i;
</script>

<section class="review card pad" data-sg-review>
  <h3 class="ttl">{s('review')}</h3>
  {#if found.length === pairs.length}
    <p class="done" data-sg-review-done><Phrases text={s('reviewDone')} /></p>
  {:else}
    <p class="ask"><Phrases text={s('reviewAsk')} /></p>
    <div class="cols">
      <div class="col" lang="en">
        {#each left as x (x.i)}
          <button type="button" class="chip big pair" aria-pressed={on('en', x.i)} class:gone={found.includes(x.i)} disabled={found.includes(x.i)}
            data-sfx="tick" data-sg-review-en={x.i} onclick={() => tap('en', x.i)}>{x.t}</button>
        {/each}
      </div>
      <div class="col">
        {#each right as x (x.i)}
          <button type="button" class="chip big pair" aria-pressed={on('ja', x.i)} class:gone={found.includes(x.i)} disabled={found.includes(x.i)}
            data-sfx="tick" data-sg-review-ja={x.i} onclick={() => tap('ja', x.i)}>{x.t}</button>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .review { display: flex; flex-direction: column; gap: 8px; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); text-align: center; }
  .ask, .done { margin: 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .done { font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--text); }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .col { display: flex; flex-direction: column; gap: 8px; }
  /* the kit's big chip (its edge, the press, yuzu held), a word or two a line */
  .pair { width: 100%; height: auto; padding: 6px 8px; font: 600 var(--fs-s)/1.25 var(--font-body); text-wrap: pretty; transition: opacity 200ms; }
  .pair.gone { opacity: .2; box-shadow: none; }
</style>
