<script lang="ts">
  // The revealed English (docs/kikimimi.md "Visuals", docs/curriculum.md §8): its words with the item's focus marked and
  // its sound marks over them (marks.ts soundLine: the shape it's said in above a reduced run, ‿ arcs where words join,
  // swallowed letters greyed, ● over a stressed word), and the karaoke while its clip replays: the words said so far in
  // ink, the one being said underlined, the rest soft but the focus (clips.ts wordTimes: whisper's alignment, else the clip spread over
  // the words; karaoke.svelte.ts). `from`: when the clip started on the relay's clock (null: not playing, every word in ink). A frame loop
  // runs only while it plays and only re-renders when the word changes; under reduced motion the word doesn't hop.
  import type { SoundMark } from '#lib/kikimimi/bank.ts';
  import { soundLine } from '#lib/kikimimi/marks.ts';
  import { wordTimes } from '#lib/kikimimi/clips.ts';
  import { karaoke } from './karaoke.svelte.ts';

  let { en, focus, marks, clip, from = null, clock }: {
    en: string; focus?: string; marks?: readonly SoundMark[]; clip: string; from?: number | null; clock: () => number;
  } = $props();
  const groups = $derived(soundLine(en, focus, marks));
  const times = $derived(wordTimes(clip, en));
  /** The word being said (-1 before the first; past the last: every word said); null when not playing. */
  const k = karaoke({ from: () => from, times: () => times, clock: () => clock() });
  const at = $derived(k.at);
  const wordState = (w: number) => (at === null || w < at ? 'said' : w === at ? 'now' : 'yet');
</script>

<span class="sl" class:playing={at !== null} lang="en" data-kiki-words={times.length - 1} data-kiki-at={at ?? undefined}>
  {#each groups as g, gi (gi)}
    {#if g.say}
      <span class="rd" data-say={g.say} data-kiki-say>{@render segs(g.segs)}</span>
    {:else}{@render segs(g.segs)}{/if}
  {/each}
</span>

{#snippet segs(list: typeof groups[number]['segs'])}
  {#each list as s, k (k)}
    {#if s.link}<i class="arc" aria-hidden="true" data-kiki-link></i><span class="sr-only"> </span>
    {:else if s.w < 0}{s.t}
    {:else}<span class="w {wordState(s.w)}" class:focus={s.focus} class:drop={s.drop} class:st={s.stress} data-w={s.w}>{s.t}</span>{/if}
  {/each}
{/snippet}

<style>
  .sl { overflow-wrap: anywhere; }
  .w { border-radius: 4px; transition: color var(--dur-quick); }
  .w.focus { background: linear-gradient(transparent 55%, color-mix(in srgb, var(--c-yuzu) 85%, transparent) 55%); padding: 0 1px; }
  .playing .w.yet { color: color-mix(in srgb, var(--c-ink) 40%, transparent); }
  /* the key word stays in full ink through the karaoke (its fill already says where it is) */
  .playing .w.yet.focus { color: var(--c-ink); }
  .playing .w.now { color: var(--c-ink); text-decoration: underline 3px var(--c-leaf-edge); text-underline-offset: 4px; display: inline-block; animation: hop 180ms var(--ease-bounce); }
  /* swallowed letters: greyed, softly struck */
  .w.drop { color: color-mix(in srgb, var(--c-ink) 30%, transparent); text-decoration: line-through 2px color-mix(in srgb, var(--c-coral) 70%, transparent); }
  /* ● over a stressed word */
  .w.st { position: relative; display: inline-block; }
  .w.st::before { content: '●'; position: absolute; left: 50%; translate: -50% 0; top: -.62em; font-size: 9px; line-height: 1; color: var(--c-ink); }
  /* the shape it's said in, above the run; a dotted line under the run */
  /* a word under a say mark has its pill and dotted line already: no focus fill on top */
  .rd .w.focus { background: none; }
  .rd { position: relative; display: inline-block; border-bottom: 2.5px dotted var(--c-leaf-edge); line-height: 1.25; margin-top: .9em; }
  .rd::before {
    content: attr(data-say); position: absolute; left: 50%; translate: -50% 0; bottom: calc(100% + 1px); white-space: nowrap;
    font: italic 700 13px/1 var(--font-ui); color: var(--c-leaf-text); background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); padding: 2px 6px; border-radius: 8px;
  }
  /* ‿ where two words join (the space kept for copy and VoiceOver, unseen) */
  .arc { display: inline-block; width: .5em; height: .3em; margin: 0 .04em; vertical-align: -.16em; border: 2.5px solid var(--c-leaf-edge); border-top: 0; border-radius: 0 0 .5em .5em; }
  @keyframes hop { from { transform: translateY(3px); } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .playing .w.now { animation: none; } .w { transition: none; } }
</style>
