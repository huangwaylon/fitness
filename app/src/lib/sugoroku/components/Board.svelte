<script lang="ts">
  // 英語すごろく's board (docs/sugoroku.md "The board"): the island drawn (grass, the river, the beach and the sea), the
  // route a sandy path through it with the fork, each space a stepping stone in its kind's colour with its mark (A ことば,
  // ×2 ダブル, 文 ぶん, 絵 絵, ! イベント), each stretch's wooden sign, ふりだし and あがり; the players' heads over their stones
  // (the one whose turn it is ringed in yuzu), gliding a stone at a time as `shown` moves. The route is long: the board is
  // a window onto it that follows whose turn it is (and scrolls by hand). `compact`: a smaller window during a turn's
  // English, so the turn's controls stay on screen.
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import { BOARD, GOAL, H, W } from '../board.ts';
  import type { Player } from '../game.ts';
  import { s } from '../i18n.ts';

  let { players, shown, turn, compact = false, letters = {} }: { players: readonly Player[]; shown: readonly number[]; turn: number; compact?: boolean; letters?: Readonly<Record<number, string>> } = $props();
  const MARK = { start: '', word: 'A', double: '×2', sentence: '文', picture: '絵', event: '!', goal: '' } as const;
  const edges = BOARD.flatMap((sp, i) => sp.next.map((j) => [i, j] as const));
  const signs = BOARD.map((sp, i) => ({ sp, i })).filter(({ sp, i }) => i > 0 && i < GOAL && BOARD[i - 1].area !== sp.area);
  /** Each player's head: its stone, nudged apart when stones are shared. */
  const heads = $derived(players.map((p, k) => {
    const at = shown[k] ?? 0, sp = BOARD[at];
    const same = players.map((_, j) => j).filter((j) => (shown[j] ?? 0) === at);
    const n = same.indexOf(k), m = same.length;
    /** Apart in pixels (the small board's heads are small too). */
    const dx = m > 1 ? (n - (m - 1) / 2) * (compact ? 12 : 18) : 0;
    // (on ふりだし and あがり below the stone: its name stays readable)
    const end = sp.kind === 'start' || sp.kind === 'goal';
    return { p, k, dx, x: sp.x, y: end ? sp.y + 26 : sp.y - 16 - (m > 2 && n % 2 ? 8 : 0) };
  }));
  // the window follows whose turn it is (its head in the middle), smoothly
  let win: HTMLDivElement | undefined = $state();
  const focusY = $derived(heads[turn]?.y ?? 0);
  $effect(() => {
    const el = win, y = focusY;
    if (!el) return;
    const top = (y / H) * el.scrollHeight - el.clientHeight / 2;
    el.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
  });
</script>

<div class="win" class:compact bind:this={win}>
<div class="board" role="img" aria-label={s('board')} data-sg-board>
  <svg viewBox="0 0 {W} {H}" aria-hidden="true">
    <!-- the island -->
    <rect width={W} height={H} rx="22" class="grass" />
    <path class="river" d="M0 222 C 60 214, 110 246, 170 236 S 260 214, 300 240 L 300 250 C 250 228, 210 252, 168 250 S 70 230, 0 238 Z" />
    <path class="sand" d="M80 {H} C 120 650, 260 628, 360 618 L 360 {H} Z" />
    <path class="sea" d="M170 {H} C 220 684, 300 676, 360 670 L 360 {H} Z" />
    <circle class="tree" cx="20" cy="80" r="11" /><circle class="tree" cx="342" cy="150" r="10" /><circle class="tree" cx="200" cy="330" r="9" />
    <circle class="tree" cx="18" cy="420" r="12" /><circle class="tree" cx="340" cy="500" r="10" /><circle class="tree" cx="24" cy="580" r="11" />
    <rect class="house" x="186" y="314" width="40" height="22" rx="4" /><path class="roof" d="M182 316 L206 300 L230 316 Z" />
    <!-- the path -->
    {#each edges as [a, b] (`${a}-${b}`)}<line class="path" x1={BOARD[a].x} y1={BOARD[a].y} x2={BOARD[b].x} y2={BOARD[b].y} />{/each}
    <!-- the stones -->
    {#each BOARD as sp, i (i)}
      {#if sp.kind === 'start' || sp.kind === 'goal'}
        <circle class="stone k-{sp.kind}" cx={sp.x} cy={sp.y} r="22" />
        <text class="end" x={sp.x} y={sp.y + 4}>{s(`kind.${sp.kind}`)}</text>
      {:else}
        <circle class="stone k-{sp.kind}" cx={sp.x} cy={sp.y} r="16" />
        <text class="mark" x={sp.x} y={sp.y + 5}>{MARK[sp.kind]}</text>
        {#if letters[i]}<g class="lstone" transform="translate({sp.x + 13} {sp.y - 13})"><circle r="9" /><text y="4">{letters[i].toUpperCase()}</text></g>{/if}
      {/if}
    {/each}
    {#each signs as { sp } (sp.area)}
      <g class="sign" transform="translate({sp.x} {sp.y + 22})"><rect x="-21" y="0" width="42" height="15" rx="3" /><text x="0" y="11">{s(`area.${sp.area}`)}</text></g>
    {/each}
  </svg>
  {#each heads as h (h.k)}
    <span class="head" class:now={h.k === turn} style:left="{(h.x / W) * 100}%" style:top="{(h.y / H) * 100}%" style:margin-left="{h.dx}px" data-sg-token={h.k} data-at={shown[h.k]}>
      <Avatar person={h.p.who} worn size={compact ? 18 : 26} />
    </span>
  {/each}
  {#each BOARD as _, i (i)}<span class="hit" data-sg-space={i} data-kind={BOARD[i].kind} style:left="{(BOARD[i].x / W) * 100}%" style:top="{(BOARD[i].y / H) * 100}%"></span>{/each}
</div>
</div>

<style>
  /* a window onto the long route, short enough that the turn's panel stays above Safari's fold (the sheet's ~330 px
     besides it); smaller during a turn's English */
  .win { flex: none; height: max(200px, calc(100svh - 360px)); overflow-y: auto; border-radius: 22px; scrollbar-width: none; overscroll-behavior: contain; }
  .win.compact { height: max(130px, calc(100svh - 600px)); }
  .board { position: relative; width: 100%; aspect-ratio: 360 / 700; }
  svg { display: block; width: 100%; height: 100%; filter: drop-shadow(0 3px 0 var(--c-edge)); }
  .grass { fill: color-mix(in srgb, var(--c-mint) 70%, #9fd38a); }
  .river { fill: color-mix(in srgb, var(--c-sky) 85%, white); }
  .sand { fill: #f3dfa8; }
  .sea { fill: color-mix(in srgb, var(--c-sky) 90%, #5aa9d6); }
  .tree { fill: #5f9e54; }
  .house { fill: #e8d6b8; }
  .roof { fill: #b9785a; }
  .path { stroke: #efe0b8; stroke-width: 20; stroke-linecap: round; }
  .stone { stroke: var(--c-edge); stroke-width: 2.5; fill: var(--c-cream); }
  .k-double { fill: color-mix(in srgb, var(--c-sky) 70%, white); }
  .k-sentence { fill: color-mix(in srgb, var(--c-mint) 75%, white); }
  .k-event { fill: color-mix(in srgb, var(--c-lilac) 80%, white); }
  .k-picture { fill: #f7c9a8; }
  .k-start, .k-goal { fill: var(--c-yuzu); stroke: var(--c-yuzu-lip); }
  text { text-anchor: middle; fill: var(--c-ink); font-family: var(--font-ui); font-weight: 700; }
  .mark { font: 600 14px var(--font-num); }
  .end { font-size: 11px; }
  /* a letter stone's letter (picked up by whoever walks over it) */
  .lstone circle { fill: color-mix(in srgb, var(--c-mint) 60%, white); stroke: var(--c-ink); stroke-width: 1.5; }
  .lstone text { font: 600 11px var(--font-num); }
  .sign rect { fill: #a8835a; }
  .sign text { fill: #fff8e8; font-size: 10px; }
  .head { position: absolute; translate: -50% -50%; display: inline-flex; border-radius: 50%; pointer-events: none;
    transition: left 150ms var(--ease-soft), top 150ms var(--ease-soft), scale 150ms; box-shadow: 0 2px 0 rgb(0 0 0 / .18); }
  .head.now { box-shadow: 0 0 0 2px var(--c-yuzu), 0 0 0 4px var(--c-ink); scale: 1.12; z-index: 1; }
  .hit { position: absolute; width: 1px; height: 1px; pointer-events: none; }
</style>
