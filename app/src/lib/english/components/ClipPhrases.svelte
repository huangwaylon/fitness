<script lang="ts">
  // この動画のフレーズ (docs/english.md "The page"): a level of the lesson, under its pinned player. The bank's quoted
  // lines by moment, in time order (phrases.ts): a card a moment, its time on the ▶ that plays it, then each line (its
  // key words underlined), 言っていること, 意味 and the phrase to use. The lines are the questions' own short quotes,
  // never a transcript.
  import Icon from '#lib/components/ui/Icon.svelte';
  import { momentsOf } from '../phrases.ts';
  import { clock, s } from '../i18n.ts';
  import type { Clip } from '../types.ts';

  let { clip, onplay }: { clip: Clip; onplay: (from: number, to: number) => void } = $props();
  const moments = $derived(momentsOf(clip));
  const keyed = (line: string) => line.split(/\*([^*]+)\*/g).map((t, i) => ({ t, key: i % 2 === 1 }));
  const at = (t: number) => clock(Math.floor(t));
</script>

<div class="lvl" data-en-phrases>
  <p class="note">{moments.length ? s('phrasesNote') : s('phrasesNone')}</p>
  {#each moments as m (m.from)}
    <article class="card pad" data-en-moment={m.from}>
      <button type="button" class="btn sky small" data-sfx="tick" aria-label={s('phrasePlay', { t: at(m.from) })} data-en-moment-play onclick={() => onplay(m.from, m.to)}>
        <Icon name="play" size={18} /><span class="t">{at(m.from)}</span>
      </button>
      {#each m.qs as q (q.id)}
        <div class="item" data-en-phrase={q.id}>
          <p class="line" lang="en">{#each keyed(q.line ?? '') as part, i (i)}{#if part.key}<u>{part.t}</u>{:else}{part.t}{/if}{/each}</p>
          <dl class="why">
            <dt>{s('said')}</dt><dd>{q.said}</dd>
            <dt>{s('mean')}</dt><dd>{q.mean}</dd>
          </dl>
          <p class="phrase"><b>{s('use')}</b> <span lang="en">{q.use}</span></p>
        </div>
      {/each}
    </article>
  {/each}
</div>

<style>
  .lvl { display: flex; flex-direction: column; gap: 10px; animation: if-lvl var(--dur-sheet) var(--ease-out); }
  .note { margin: 0 4px; font-size: var(--fs-s); color: var(--text-soft); }
  .card { display: grid; gap: 10px; }
  .card p { margin: 0; }
  .btn { margin: 0; justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
  .btn.sky { --fill: color-mix(in srgb, var(--c-sky) 22%, var(--c-card)); --lip-c: var(--c-edge); color: var(--c-ink); }
  .t { font-family: var(--font-num); font-variant-numeric: tabular-nums; }
  .item { display: grid; gap: 6px; }
  .item + .item { padding-top: 10px; border-top: 2px dashed var(--edge); }
  .line { font-size: var(--fs-talk); line-height: 1.45; font-style: italic; }
  .line u { font-style: normal; font-weight: 700; text-decoration: underline 2px var(--c-leaf); text-underline-offset: 3px; }
  .why { margin: 0; display: grid; gap: 2px; font-size: var(--fs-body); }
  .why dt { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .why dd { margin: 0 0 4px; }
  .phrase { padding: 8px 10px; border-radius: var(--r-row); background: color-mix(in srgb, var(--c-leaf) 18%, var(--c-card)); color: var(--c-ink); font-size: var(--fs-body); }
  .phrase b { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); margin-right: 4px; }
</style>
