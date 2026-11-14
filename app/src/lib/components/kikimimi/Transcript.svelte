<script lang="ts">
  // A dialogue's transcript (docs/kikimimi.md "Dialogues"), at the reveal and in the review list: each line a bubble by
  // its speaker's head, its English (the item's focus marked in the line that has it) and its Japanese; the line being
  // spoken (a replay) lifted. Each speaker has a seat, by order of first line: two, the first's on the left and the
  // other's on the right; three (a たちぎき), left, centre and right, each its own tint, the centre's head on the left
  // and its bubble set in from both sides. A `next` item's right answer closes it as the next line, from the speaker
  // whose turn it is (dashed: it was never said). Each line carries its sound marks and, while it's spoken (`talk`,
  // started at `from`; or every line in `all`, two at once where they overlap), its karaoke (scene/SoundLine.svelte);
  // the marks' key under it.
  import type { Item, Line } from '#lib/kikimimi/bank.ts';
  import type { RosterId } from '#lib/villagers/roster.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import Phrases from '../ui/Phrases.svelte';
  import SoundLine from './scene/SoundLine.svelte';
  import MarkLegend from './scene/MarkLegend.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { rosterName as name, speakersOf } from './scene/stage.ts';
  import { t } from '#lib/i18n/index.ts';

  let { it, talk = -1, from = null, all, clock = () => Date.now(), compact = false }: {
    it: Item & { lines: readonly Line[] }; talk?: number; from?: number | null;
    /** Every line speaking now and its start (overlapping lines), in place of `talk` and `from`. */
    all?: readonly { k: number; from: number }[];
    clock?: () => number; compact?: boolean;
  } = $props();
  const who = $derived(speakersOf(it));
  const first = $derived(who[0]);
  const other = $derived(who[1] ?? first);
  /** A speaker's seat: the first left, the last right, a third's between them. */
  const seatOf = (w: RosterId): 'left' | 'centre' | 'right' => {
    const k = who.indexOf(w);
    return k <= 0 ? 'left' : k === who.length - 1 ? 'right' : 'centre';
  };
  /** Where line k is spoken from, if it is now. */
  const live = (k: number): number | null => (all ? (all.find((x) => x.k === k)?.from ?? null) : talk === k ? from : null);
  /** Every line's marks (the key's). */
  const marks = $derived(it.lines.flatMap((l) => l.marks ?? []));
  /** A `next` item's answer, said by whoever didn't say the last line. */
  const next = $derived(it.type === 'next' ? { who: it.lines.at(-1)!.who === first ? other : first, en: it.choices[it.answer] } : null);
</script>

<ol class="tr" class:compact data-kiki-transcript={it.id}>
  {#each it.lines as l, k (k)}
    {@const at = live(k)}
    <li class="ln {seatOf(l.who)}" class:talk={at !== null} data-line={k} data-seat={seatOf(l.who)}>
      <span class="head"><OfficialArt key={villagerArt(l.who, true)} alt={name(l.who)} size={compact ? 28 : 36} /></span>
      <div class="b obj-cream">
        <p class="en"><SoundLine en={l.en} focus={it.focus} marks={l.marks} clip={l.clip ?? `${it.id}-${k + 1}`} from={at} {clock} /></p>
        <p class="ja"><Phrases text={l.ja} /></p>
      </div>
    </li>
  {/each}
  {#if next}
    <li class="ln next {seatOf(next.who)}" data-kiki-next-line>
      <span class="head"><OfficialArt key={villagerArt(next.who, true)} alt={name(next.who)} size={compact ? 28 : 36} /></span>
      <div class="b obj-cream">
        <small>{t('kiki.nextLine')}</small>
        <p class="en" lang="en">{next.en}</p>
        <p class="ja"><Phrases text={it.ja} /></p>
      </div>
    </li>
  {/if}
</ol>
{#if marks.length && !compact}<div class="key"><MarkLegend {marks} /></div>{/if}

<style>
  .tr { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
  /* the heads' column a fixed 36px, so every bubble on a side starts and ends at one line */
  .ln { display: grid; grid-template-columns: 36px minmax(0, 1fr); align-items: end; gap: 8px; margin-right: 28px; }
  .ln.right { grid-template-columns: minmax(0, 1fr) 36px; margin: 0 0 0 28px; }
  .ln.right .head { order: 2; }
  /* a third speaker between them: set in from both sides */
  .ln.centre { margin: 0 14px; }
  .head { line-height: 0; justify-self: center; }
  .b {
    position: relative; display: grid; gap: 2px; padding: 8px 12px; border-radius: 18px; background: var(--c-card); color: var(--c-ink);
    box-shadow: var(--sh-lip-cream); transition: transform var(--dur-quick);
  }
  .ln:not(.right) .b { border-bottom-left-radius: 6px; }
  .ln.right .b { border-bottom-right-radius: 6px; background: color-mix(in srgb, var(--c-mint) 45%, var(--c-card)); }
  .ln.centre .b { background: color-mix(in srgb, var(--c-yuzu) 35%, var(--c-card)); }
  .ln.talk .b { transform: translateY(-3px); }
  .next .b { box-shadow: none; outline: 2px dashed var(--c-leaf-edge); outline-offset: -2px; }
  .b small { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--leaf-text); }
  .en { margin: 0; font: 700 max(16px, var(--fs-body))/1.4 var(--font-ui); }
  .key { margin-top: -2px; display: flex; justify-content: center; }
  /* adult Japanese with no spaces between words: keep-all (theme.css) would never break it; ordinary CJK breaks, kinsoku kept */
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
  .compact .en { font-size: 15px; }
  .compact .b { padding: 6px 10px; }
  /* on a review card (the bubbles' own cream): the first speaker's a step darker, so it still reads as a bubble */
  .compact .ln.left:not(.next) .b { background: color-mix(in srgb, var(--c-edge) 14%, var(--c-card)); }
</style>
