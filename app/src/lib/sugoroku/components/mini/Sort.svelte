<script lang="ts">
  // ★4 なかま分け (mini/sort.ts): two bins (the seat's pair by its level: やさしい・ふつう far apart, むずかしい close), and
  // the seat's own stream of words to sort (やさしい・ふつう with the picture, むずかしい the word only): tap the bin it
  // belongs in. Right counts; a miss shows the right bin a moment and moves on (never a lost point). The team's total
  // live on every phone (online: each seat's `mini` frame `so<n>`, at most one a second); the count played as the time
  // is up (`over`), once: the first counts.
  import { PICTURES, pictureSrc } from '../../pictures.ts';
  import { SETS } from '../../mini/categories.ts';
  import { binOf, sortStream, type SortState } from '../../mini/sort.ts';
  import type { Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';

  interface Props {
    s: SortState; seat: Who | null; live: boolean; over: boolean; nameOf: (w: Who) => string; play: (p: Play, who?: Who) => void;
    views: Partial<Record<Who, string>>; onview?: (v: string) => void;
  }
  let { s, seat, live, over, play, views, onview }: Props = $props();

  const pair = $derived(seat ? (s.pairs[seat] ?? null) : null);
  const level = $derived(s.seats.find((x) => x.who === seat)?.level ?? 2);
  const stream = $derived(seat ? sortStream(s, seat) : []);
  let at = $state(0);
  /** Pictures that didn't load (offline, blocked): the word alone, no broken frame. */
  let broken = $state<number[]>([]);
  let count = $state(0);
  let flash = $state<{ bin: number; right: boolean } | null>(null);
  let flashTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(flashTimer));
  // (a new seat at the phone: its own stream from the start)
  $effect(() => {
    void seat;
    at = 0;
    count = 0;
    sentFor = null;
  });
  const item = $derived(stream.length ? stream[at % stream.length] : null);
  function sortTo(bin: number) {
    if (!live || !pair || item === null || flash?.right === false) return;
    const right = binOf(pair, item) === bin;
    if (right) count++;
    flash = { bin: right ? bin : 1 - bin, right };
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => (flash = null), right ? 180 : 600);
    at++;
  }
  // the count as the time is up: played once (the seat's)
  let sentFor: Who | null = null;
  $effect(() => {
    if (!over || !seat || sentFor === seat || s.counts[seat] !== undefined) return;
    sentFor = seat;
    play({ n: count }, seat);
  });
  // online: my count for the others, at most one a second
  let lastSent = 0, viewTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    const n = count;
    if (!onview || !seat) return;
    const wait = Math.max(0, lastSent + 1000 - performance.now());
    clearTimeout(viewTimer);
    viewTimer = setTimeout(() => ((lastSent = performance.now()), onview?.(`so${n}`)), wait);
  });
  $effect(() => () => clearTimeout(viewTimer));
  /** The team's so far: each seat's count in, else its live frame, mine as it is. */
  const team = $derived(s.seats.reduce((n, x) => {
    if (s.counts[x.who] !== undefined) return n + s.counts[x.who]!;
    if (x.who === seat) return n + count;
    const m = /^so(\d+)$/.exec(views[x.who] ?? '');
    return n + (m ? Number(m[1]) : 0);
  }, 0));
</script>

<div class="so" data-sg-sort={count}>
  <p class="team" data-sg-sort-team={team}>{tr('soTeam', { n: team })}{#if seat}<small>（{tr('soMine', { n: count })}）</small>{/if}</p>
  {#if seat && pair && item !== null}
    {@const p = PICTURES[item]}
    <div class="card" class:ok={flash?.right} data-sg-sort-item={p.w}>
      {#if level < 3 && !broken.includes(item)}<img src={pictureSrc(p)} alt="" width="56" height="56" referrerpolicy="no-referrer" onerror={() => (broken = [...broken, item])} />{/if}
      <b lang="en">{p.w}</b>
    </div>
    <p class="note">{tr('soAsk')}</p>
    <div class="bins">
      {#each pair as set, b (set)}
        <button type="button" class="bin" class:hint={flash && !flash.right && flash.bin === b} disabled={!live} data-sfx="tick" data-sg-bin={set} onclick={() => sortTo(b)}>
          <b lang="en">{SETS[set].en}</b><small>{SETS[set].ja}</small>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .so { display: flex; flex-direction: column; gap: 8px; }
  .so > :global(*) { flex-shrink: 0; }
  .team { margin: 0; text-align: center; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--c-ink); }
  .team small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .card { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 72px; border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); transition: scale 120ms; }
  .card.ok { scale: 1.04; }
  .card img { object-fit: contain; filter: drop-shadow(0 2px 0 rgb(0 0 0 / .12)); }
  .card b { font: 600 26px/1.2 var(--font-body); color: var(--c-ink); }
  .note { margin: 0; text-align: center; font-size: var(--fs-s); color: var(--text-soft); }
  .bins { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .bin { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; min-height: 72px; margin: 0 0 3px; appearance: none; border: 0; cursor: pointer;
    border-radius: var(--r-card); background: color-mix(in srgb, var(--c-sky) 25%, var(--c-card)); box-shadow: var(--sh-ctl); color: var(--c-ink); touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  .bin:last-child { background: color-mix(in srgb, var(--c-mint) 35%, var(--c-card)); }
  .bin:active:not(:disabled) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .bin.hint { outline: 3px solid var(--c-yuzu-lip); background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); }
  .bin b { font: 700 18px/1.2 var(--font-body); }
  .bin small { font: 500 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
</style>
