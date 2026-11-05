<script lang="ts">
  // A dialogue's transcript (docs/kikimimi.md "Dialogues"), at the reveal and in the review list: each line a bubble by
  // its speaker's head, the first speaker's on the left and the other's on the right, its English (the item's focus
  // marked in the line that has it) and its Japanese; the line being spoken (a replay) lifted. A `next` item's right
  // answer closes it as the next line, from the speaker whose turn it is (dashed: it was never said). Each line carries
  // its sound marks and, while it's spoken (`talk`, started at `from`), its karaoke (scene/SoundLine.svelte); the marks'
  // key under it.
  import type { Item, Line } from '#lib/kikimimi/bank.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import SoundLine from './scene/SoundLine.svelte';
  import MarkLegend from './scene/MarkLegend.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName as name } from './scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { it, talk = -1, from = null, clock = () => Date.now(), compact = false }: {
    it: Item & { lines: readonly Line[] }; talk?: number; from?: number | null; clock?: () => number; compact?: boolean;
  } = $props();
  const first = $derived(it.lines[0].who);
  const other = $derived(it.lines.find((l) => l.who !== first)?.who ?? first);
  /** Every line's marks (the key's). */
  const marks = $derived(it.lines.flatMap((l) => l.marks ?? []));
  /** A `next` item's answer, said by whoever didn't say the last line. */
  const next = $derived(it.type === 'next' ? { who: it.lines.at(-1)!.who === first ? other : first, en: it.choices[it.answer] } : null);
</script>

<ol class="tr" class:compact data-kiki-transcript={it.id}>
  {#each it.lines as l, k (k)}
    <li class="ln" class:right={l.who !== first} class:talk={talk === k} data-line={k}>
      <span class="head"><OfficialArt key={villagerArt(l.who, true)} alt={name(l.who)} size={compact ? 28 : 36} /></span>
      <div class="b">
        <p class="en"><SoundLine en={l.en} focus={it.focus} marks={l.marks} clip="{it.id}-{k + 1}" from={talk === k ? from : null} {clock} /></p>
        <p class="ja">{l.ja}</p>
      </div>
    </li>
  {/each}
  {#if next}
    <li class="ln next" class:right={next.who !== first} data-kiki-next-line>
      <span class="head"><OfficialArt key={villagerArt(next.who, true)} alt={name(next.who)} size={compact ? 28 : 36} /></span>
      <div class="b">
        <small>{t('kiki.nextLine')}</small>
        <p class="en" lang="en">{next.en}</p>
        <p class="ja">{it.ja}</p>
      </div>
    </li>
  {/if}
</ol>
{#if marks.length && !compact}<div class="key"><MarkLegend {marks} /></div>{/if}

<style>
  .tr { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  /* the heads' column a fixed 36px, so every bubble on a side starts and ends at one line */
  .ln { display: grid; grid-template-columns: 36px 1fr; align-items: end; gap: 8px; margin-right: 28px; }
  .ln.right { grid-template-columns: 1fr 36px; margin: 0 0 0 28px; }
  .ln.right .head { order: 2; }
  .head { line-height: 0; justify-self: center; }
  .b {
    position: relative; display: grid; gap: 2px; padding: 8px 12px; border-radius: 18px; background: var(--c-card); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); transition: transform var(--dur-quick);
  }
  .ln:not(.right) .b { border-bottom-left-radius: 6px; }
  .ln.right .b { border-bottom-right-radius: 6px; background: color-mix(in srgb, var(--c-mint) 45%, var(--c-card)); }
  .ln.talk .b { transform: translateY(-3px); }
  .next .b { background: transparent; box-shadow: none; outline: 2px dashed var(--c-leaf-edge); outline-offset: -2px; }
  .b small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--leaf-text); }
  .en { margin: 0; font: 700 max(16px, var(--fs-body))/1.4 var(--font-ui); }
  .key { margin-top: -2px; display: flex; justify-content: center; }
  .ja { margin: 0; font: 700 var(--fs-xs)/1.4 var(--font-ui); color: var(--c-ink-soft); }
  .compact .en { font-size: 15px; }
  .compact .b { padding: 6px 10px; }
  /* on a review card (the bubbles' own cream): the first speaker's a step darker, so it still reads as a bubble */
  .compact .ln:not(.right):not(.next) .b { background: color-mix(in srgb, var(--c-edge) 14%, var(--c-card)); }
  @media (prefers-reduced-motion: reduce) { .b { transition: none; } }
</style>
