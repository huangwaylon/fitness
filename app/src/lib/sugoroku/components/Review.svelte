<script lang="ts">
  // 英語すごろく's ふりかえり (docs/sugoroku.md "Rules"): the game's words, lines and pictures that have Japanese, up to
  // five, as two columns to match (tap an English, then its Japanese); a pair found fades out, a mismatch just lets go
  // (no mark, no sound of failure). All found: できた！ Skippable: it's only on the results.
  import { seeded, shuffle } from '#lib/random.ts';
  import { s } from '../i18n.ts';

  let { pairs, seed }: { pairs: readonly { en: string; ja: string }[]; seed: string } = $props();
  const left = $derived(pairs.map((p, i) => ({ i, t: p.en })));
  const right = $derived(shuffle(pairs.map((p, i) => ({ i, t: p.ja })), seeded(`${seed}:review`)));
  let held = $state<number | null>(null);
  let found = $state<number[]>([]);
  function pickJa(i: number) {
    if (held === null) return;
    if (held === i) found = [...found, i];
    held = null;
  }
</script>

<section class="review card pad" data-sg-review>
  <h3 class="ttl">{s('review')}</h3>
  {#if found.length === pairs.length}
    <p class="done" data-sg-review-done>{s('reviewDone')}</p>
  {:else}
    <p class="ask">{s('reviewAsk')}</p>
    <div class="cols">
      <div class="col" lang="en">
        {#each left as x (x.i)}
          <button type="button" class="pair" class:held={held === x.i} class:gone={found.includes(x.i)} disabled={found.includes(x.i)}
            data-sfx="tick" data-sg-review-en={x.i} onclick={() => (held = x.i)}>{x.t}</button>
        {/each}
      </div>
      <div class="col">
        {#each right as x (x.i)}
          <button type="button" class="pair" class:gone={found.includes(x.i)} disabled={found.includes(x.i) || held === null}
            data-sfx="tick" data-sg-review-ja={x.i} onclick={() => pickJa(x.i)}>{x.t}</button>
        {/each}
      </div>
    </div>
  {/if}
</section>

<style>
  .review { display: flex; flex-direction: column; gap: 8px; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); text-align: center; }
  .ask, .done { margin: 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .done { font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--c-ink); }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .col { display: flex; flex-direction: column; gap: 6px; }
  .pair { min-height: 44px; padding: 6px 8px; margin: 0; appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-ink); font: 600 var(--fs-s)/1.25 var(--font-body);
    transition: opacity 200ms; text-wrap: pretty; }
  .pair.held { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .pair.gone { opacity: .2; }
  .pair:disabled:not(.gone) { cursor: default; }
</style>
