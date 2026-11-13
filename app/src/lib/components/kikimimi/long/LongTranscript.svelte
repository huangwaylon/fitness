<script lang="ts">
  // まるごと 聞く's transcript at the results (docs/kikimimi.md "まるごと 聞く"): every line of the piece with who says it
  // (a villager's head, or a real speaker's name), its English and its Japanese (にほんごやく: hidden with みない); a tap
  // plays that line alone (its clip), the one sounding lifted; the lines that answer the questions carry their number
  // (coral where I missed it). A dictation's words stay blanked until it's done, so the transcript never gives it away.
  import type { LongCard } from '#lib/kikimimi/games/long/def.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import { rosterName } from '../scene/stage.ts';
  import { villagerArt } from '#lib/art.ts';
  import { nameOf, speakerAt } from './board.ts';
  import { t } from '#lib/i18n/index.ts';

  let { piece, marks, blanks, sounding, showJa, canHear, onhear }: {
    piece: LongCard;
    /** Each question's line: its number (from 1) and whether I got it. */
    marks: readonly { line: number; n: number; ok: boolean }[];
    /** The dictation's lines not done yet: their words blanked. */
    blanks: ReadonlyMap<number, string>;
    /** The line sounding now (-1: none). */
    sounding: number;
    showJa: boolean;
    canHear: boolean;
    onhear: (k: number) => void;
  } = $props();
  const lines = $derived(piece.lines ?? []);
  /** A line's English with its blank (the dictation's words, the first time they're said). */
  function parts(en: string, words: string | undefined): [string, string, string] | null {
    if (!words) return null;
    const at = en.indexOf(words);
    return at < 0 ? null : [en.slice(0, at), words, en.slice(at + words.length)];
  }
</script>

<ol class="tr" data-kiki-long-script={piece.long.of}>
  {#each lines as l, k (k)}
    {@const who = piece.long.speakers[speakerAt(piece, k)]}
    {@const split = parts(l.en, blanks.get(k))}
    <li class="ln" class:on={sounding === k} data-line={k}>
      <button type="button" class="tap tile-btn" aria-disabled={!canHear} data-sfx={canHear ? 'tick' : 'none'} onclick={() => canHear && onhear(k)}>
        <span class="who">
          {#if who?.villager}<span class="head"><OfficialArt key={villagerArt(who.villager, true)} alt={rosterName(who.villager)} size={24} /></span>{/if}
          <span class="nm">{who ? nameOf(who, (id) => rosterName(id as never)) : ''}</span>
          {#each marks.filter((m) => m.line === k) as m (m.n)}<span class="q" class:miss={!m.ok} data-kiki-long-q={m.n}>Q{m.n}</span>{/each}
          {#if canHear}<span class="play" aria-hidden="true">▶︎</span>{/if}
        </span>
        <span class="en" lang="en">
          {#if split}{split[0]}<span class="blank" data-kiki-long-blank={k}><span aria-hidden="true">＿＿＿</span><span class="sr-only">{t('kiki.long.blank')}</span></span>{split[2]}{:else}{l.en}{/if}
        </span>
        {#if showJa && !split}<span class="ja">{l.ja}</span>{/if}
      </button>
    </li>
  {/each}
</ol>

<style>
  .tr { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
  .tap { width: 100%; display: grid; gap: 2px; padding: 8px 10px; border-radius: 14px; text-align: left; min-height: var(--hit); }
  .tap[aria-disabled='true'] { cursor: default; }
  .on .tap { box-shadow: var(--sh-sel); background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); }
  .who { display: flex; align-items: center; gap: 6px; }
  .head { line-height: 0; }
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  .q { padding: 0 6px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--c-card)); font: 700 12px/1.6 var(--font-num); }
  .q.miss { background: color-mix(in srgb, var(--c-coral) 35%, var(--c-card)); }
  .play { margin-left: auto; font-size: .8em; color: var(--text-soft); }
  .en { font: 600 var(--fs-body)/1.5 var(--font-ui); }
  .blank { padding: 0 2px; border-bottom: 2px dashed var(--text-soft); color: var(--text-soft); }
  .ja { font: 500 var(--fs-s)/1.5 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
</style>
