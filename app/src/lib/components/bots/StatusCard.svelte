<script lang="ts">
  // A bot's status (docs/bots.md), one card at the top of every bot page. Row 1: the dot (StatusDot: the tab's own),
  // the word (the bot's own; a fine or idle one needing a look 要対応), the as-of (「12:00時点」, 更新中 while it's the
  // last known one and a read is on its way or failed) and the bot's ⋯ (`menu`: the page's ActionSheet holds its
  // actions). Row 2: what a person must do (the driver's `act`, in ink), else the sentence (never the word again), else
  // nothing. `note` (an action's answer: ジム's 今すぐ確認 line). Then the strip: the cells drawn 32 high in a 44 hit (ok
  // green, avail green full height, warn yellow capped, fail coral hatched, idle a low sunk bar (ran, nothing to
  // check), none a low tick: never colour alone) the card's width, 前回 ringed; the ticks (前回's time the right-hand
  // one, in ink); one line: each state's swatch and count (only those > 0) and the 成果 term, the picked cell's line
  // once one is tapped, and 次回 at its end (「次回 12:09ごろ」: never read as a range with 前回's time). The cells are drawn only: one hit layer the strip's full height, a slider and one tab stop (a tap or a drag picks the
  // cell nearest the finger's x; ← → Home End walk them); VoiceOver reads `summary`, then the picked cell's line.
  // Nothing kept: `empty` in the strip's place, else no strip. Filled by its tone (busy as good; at night only warn
  // and bad). `attr`: its data-* (data-its-verdict="healthy"); `page`: the page's data-* prefix (data-its-strip, …).
  import type { Snippet } from 'svelte';
  import Phrases from '../ui/Phrases.svelte';
  import NavButton from '../ui/NavButton.svelte';
  import StatusDot from './StatusDot.svelte';
  import { t, formatNum } from '#lib/i18n/index.ts';
  import { timeOf } from '#lib/i18n/when.ts';
  import { cue } from '#lib/sound/cues.ts';
  import { shown, type BotVerdict } from '#lib/bots/types.ts';
  import { pickIndex, type CardStrip, type CellState } from '#lib/strip.ts';

  interface Props {
    verdict: Pick<BotVerdict, 'tone' | 'w' | 'word' | 'sentence' | 'needsLook' | 'act'>;
    attr: Record<string, string>;
    page: string;
    stale?: boolean;
    /** When the status shown was read, and the clock to word it by. */
    readAt?: number | null;
    now: number;
    /** The ⋯: its accessible name (「ジムの操作」) and what it opens. */
    menu?: { label: string; onopen: () => void } | null;
    note?: Snippet;
    strip?: CardStrip | null;
  }
  let { verdict, attr, page, stale = false, readAt = null, now, menu = null, note, strip = null }: Props = $props();
  const dot = $derived(shown(verdict));
  /** The bot's own word; a fine or idle one needing a look is drawn as its dot: 要対応. */
  const word = $derived(dot.w === 'needsYou' ? t('bots.w.needsYou') : verdict.word);
  const act = $derived(verdict.needsLook && verdict.act ? verdict.act : null);
  const data = (k: string, v: string | number = '') => ({ [`data-${page}-${k}`]: v });

  const STATES: CellState[] = ['ok', 'avail', 'warn', 'fail'];
  const cells = $derived(strip?.cells ?? []);
  const n = $derived(cells.length);
  const blank = $derived(!cells.some((c) => c.state !== 'none'));
  const counts = $derived(strip ? STATES.flatMap((s) => {
    const k = cells.filter((c) => c.state === s).length;
    return k && strip.words[s] ? [{ s, label: strip.words[s]!, n: k }] : [];
  }) : []);
  /** The ticks: 前回's in ink, the others clear of it. */
  const ticks = $derived.by(() => {
    if (!strip) return [];
    const last = strip.last;
    const others = strip.ticks.filter((k) => !last || Math.abs(k.i - last.i) / n > 0.18).map((k) => ({ ...k, last: false }));
    return last ? [...others, { ...last, last: true }] : others;
  });

  /** The cell picked, by its start (a read that shifts the cells keeps it on its slot); gone from the window: none. */
  let pickedAt = $state<number | null>(null);
  const picked = $derived(pickIndex(cells, pickedAt));
  $effect(() => {
    if (pickedAt !== null && picked === null) pickedAt = null;
  });
  let el = $state<HTMLElement>();
  let dragging = false;
  /** The cell nearest the pointer's x (a tick when it changes). */
  function pickAt(e: PointerEvent) {
    if (!el || !n) return;
    const r = el.getBoundingClientRect();
    const i = Math.min(n - 1, Math.max(0, Math.floor(((e.clientX - r.left) / r.width) * n)));
    if (i !== picked) cue('tick');
    pickedAt = cells[i].start;
  }
  function down(e: PointerEvent) {
    dragging = true;
    el?.setPointerCapture?.(e.pointerId);
    el?.focus({ preventScroll: true });
    pickAt(e);
    e.preventDefault();
  }
  function onkey(e: KeyboardEvent) {
    const step = e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : e.key === 'Home' ? -n : e.key === 'End' ? n : 0;
    if (!step) return;
    e.preventDefault();
    pickedAt = cells[Math.min(n - 1, Math.max(0, (picked ?? n - 1) + step))].start;
  }
  /** A time at the edge kept inside the cells (left- or right-aligned to its cell). */
  const edge = (i: number) => ((i + 0.5) / n < 0.07 ? '0 0' : (i + 0.5) / n > 0.9 ? '-100% 0' : undefined);
  const left = (i: number) => ((i + 0.5) / n < 0.07 ? `${(i / n) * 100}%` : (i + 0.5) / n > 0.9 ? `${((i + 1) / n) * 100}%` : `${((i + 0.5) / n) * 100}%`);
</script>

<div class="card pad status {dot.tone}" {...attr}>
  <div class="top">
    <StatusDot tone={dot.tone} look={dot.look} size={10} />
    <b class="word" data-bots-word>{word}</b>
    {#if stale}<span class="asof busy" data-bots-stale>{t('bots.updating')}</span>
    {:else if readAt !== null}<span class="asof" data-bots-asof>{t('bots.asOf', { time: timeOf(readAt, now) })}</span>{/if}
    {#if menu}<span class="menu"><NavButton kind="tool" icon="more" label={menu.label} popup sfx="open" onclick={menu.onopen} {...data('menu')} /></span>{/if}
  </div>
  {#if act}<p class="act" data-bots-act><Phrases text={act} /></p>
  {:else if verdict.sentence}<p class="say" data-bots-say><Phrases text={verdict.sentence} /></p>{/if}
  {#if note}<div class="note">{@render note()}</div>{/if}

  {#if strip && blank && strip.empty}
    <p class="empty" class:plain={strip.empty.plain} role="status" {...data('empty')}>{strip.empty.text}</p>
  {:else if strip && !blank}
    <div class="scans" {...data('scans')}>
      <div class="strip" role="slider" tabindex="0" aria-label={strip.summary} aria-valuemin={0} aria-valuemax={n - 1} aria-valuenow={picked ?? n - 1}
        aria-valuetext={cells[picked ?? n - 1]?.label} bind:this={el} data-sfx="self" onkeydown={onkey} onpointerdown={down}
        onpointermove={(e) => dragging && pickAt(e)} onpointerup={() => (dragging = false)} onpointercancel={() => (dragging = false)} {...data('strip')}>
        {#each cells as c, i (c.start)}<i class="cell {c.state}" class:on={picked === i} class:last={strip.last?.i === i} data-on={picked === i || undefined}
          data-last={strip.last?.i === i || undefined} {...data('cell', c.state)}></i>{/each}
      </div>
      <div class="ticks" aria-hidden="true">{#each ticks as k (`${k.i}-${k.last}`)}<span class:last={k.last} style:left={left(k.i)} style:translate={edge(k.i)} data-last={k.last || undefined} {...data('tick')}>{k.label}</span>{/each}</div>
    </div>
    <div class="sline">
      <p class="line" aria-live="polite" {...data('scan-line')}>
        {#if picked !== null && cells[picked]}{cells[picked].label}
        {:else}
          {#each counts as c (c.s)}<span class="count" {...data('count', c.s)}><i class="cell {c.s}" aria-hidden="true"></i>{c.label}{formatNum(c.n)}</span>{/each}
          {#if strip.outcome}<span class="outcome" {...data('outcome')}>{strip.outcome}</span>{/if}
        {/if}
      </p>
      {#if strip.next}<span class="next" {...data('next')}>{t('bots.key.next')} {strip.next}</span>{/if}
    </div>
  {/if}
</div>

<style>
  .status { display: grid; gap: 2px; }
  .status.good { background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); }
  .status.warn { background: var(--warn-soft); }
  .status.bad { background: color-mix(in srgb, var(--c-coral) 24%, var(--card)); }
  /* night: only warn and bad filled (warn the night's amber, its cells edged in ink); good, busy and idle plain */
  :global(:root[data-tod='night']) .status.good { background: var(--card); }
  /* bad over the night's background, not its lighter card: the soft text 4.9:1 (4.06 over the card) */
  :global(:root[data-tod='night']) .status.bad { background: color-mix(in srgb, var(--c-coral) 24%, var(--bg)); }
  /* (the strip's cells only, never the none ticks or the swatches; warn keeps its cap, ink on yuzu: its shape tells it
     from avail) */
  :global(:root[data-tod='night']) .status.warn .strip .cell:not(.none) { box-shadow: inset 0 0 0 1px var(--text); }
  :global(:root[data-tod='night']) .status.warn .strip .cell.warn { box-shadow: inset 0 3px 0 var(--c-ink), inset 0 0 0 1px var(--text); }
  .top { display: flex; align-items: center; gap: 8px; min-height: 24px; }
  .word { font: 700 15px/1.3 var(--font-ui); }
  .asof { font: 700 13px/1.3 var(--font-ui); color: var(--text-soft); font-variant-numeric: tabular-nums; white-space: nowrap; }
  .asof.busy { padding: 0 7px; border-radius: var(--r-pill); background: var(--ctl-off); }
  /* the ⋯ disc (32 drawn, 44 hit), its hit spilling into the card's padding so row 1 stays a text line high */
  .menu { display: flex; margin: -12px -10px -12px auto; }
  .act { margin: 0; font: 700 var(--fs-body)/var(--lh) var(--font-ui); color: var(--text); text-wrap: pretty; }
  .say { margin: 0; font-size: var(--fs-s); line-height: var(--lh); font-weight: 700; color: var(--text-soft); text-wrap: pretty; }
  .note { margin-top: 2px; }

  /* the strip: the cells the card's width, the ticks under them */
  .scans { margin-top: 4px; }
  .strip { display: flex; align-items: flex-end; gap: 1px; height: var(--hit); padding: 6px 0; touch-action: pan-y; cursor: pointer; outline: none; border-radius: 4px; }
  .strip:focus-visible { outline: 3px solid var(--focus); outline-offset: 2px; }
  .strip .cell { flex: 1 1 0; min-width: 0; height: 60%; }
  .cell { border-radius: 2px; box-shadow: inset 0 0 0 1px var(--edge); background: var(--ctl-off); }
  .cell.ok, .cell.avail { background: var(--c-leaf); }
  .strip .cell.avail, .strip .cell.warn, .strip .cell.fail { height: 100%; }
  .cell.warn { background: var(--c-yuzu); box-shadow: inset 0 3px 0 var(--text-soft), inset 0 0 0 1px var(--edge); }
  .cell.fail { background: repeating-linear-gradient(135deg, var(--c-coral) 0 3px, color-mix(in srgb, var(--c-coral) 45%, var(--card)) 3px 5px); }
  .strip .cell.none { height: 4px; }
  /* idle: ran with nothing to check, a low sunk bar (neither none's tick nor ok's green) */
  .strip .cell.idle { height: 30%; box-shadow: inset 0 2px 0 var(--edge), inset 0 0 0 1px var(--edge); }
  .cell.none { box-shadow: none; background: color-mix(in srgb, var(--edge) 35%, var(--ctl-off)); }
  /* 前回 ringed; a picked cell outlined */
  .strip .cell.last, .strip .cell.on { outline: 2px solid var(--text); outline-offset: 1px; }
  .ticks { position: relative; height: 1.3em; font: 700 11px/1.3 var(--font-num); color: var(--text-soft); }
  .ticks span { position: absolute; translate: -50% 0; white-space: nowrap; }
  .ticks span.last { color: var(--text); }
  /* one row: the line (the counts and 成果, or the picked cell's), 次回 at its end as メニュー's info sits on its row */
  .sline { display: flex; align-items: baseline; gap: 10px; margin-top: 2px; min-height: 1.3em; font-size: var(--fs-s); font-weight: 700; color: var(--text); font-variant-numeric: tabular-nums; line-height: var(--lh); }
  .line { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 10px; margin: 0; min-width: 0; }
  .count { display: inline-flex; align-items: center; gap: 4px; color: var(--text-soft); }
  .count .cell { display: inline-block; width: 8px; height: 12px; flex: none; }
  .count .cell.ok { height: 8px; }
  .outcome { color: var(--text); }
  .next { margin-left: auto; color: var(--text-soft); white-space: nowrap; }
  /* nothing kept: a line the strip's height in its place (sunk; plain: neutral, uncoloured) */
  .empty { display: flex; align-items: center; min-height: 32px; margin: 6px 0 0; padding: 0 10px; border-radius: var(--r-chip); background: var(--ctl-off); color: var(--text-soft); font-size: var(--fs-s); font-weight: 700; }
  .empty.plain { background: none; padding: 0; }
</style>
