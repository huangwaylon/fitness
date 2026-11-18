<script lang="ts">
  // 英語すごろく's board (docs/sugoroku.md "The board"): the island drawn (grass, the river, the beach and the sea), the
  // route a sandy path through it with the fork, each space a stepping stone in its kind's colour with its mark (A ことば,
  // ×2 ダブル, 文 ぶん, 絵 絵, ! イベント), each stretch's wooden sign, ふりだし and あがり; the players' heads over their stones
  // (the one whose turn it is ringed in yuzu), gliding a stone at a time as `shown` moves; the game's board (board.ts:
  // its route, river, house and trees). The route is long: the board is
  // a window onto it, under the whole screen (the 3D board's slot, its fallback), that follows whose turn it is (and
  // scrolls by hand), centred in the part the overlays leave (`top` and `bottom`: what they cover, CSS px).
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import { W, riverY, type Board } from '../board.ts';
  import type { Player } from '../game.ts';
  import { s } from '../i18n.ts';

  let { board, players, shown, turn, top = 0, bottom = 0, letters = {}, played = [] }: { board: Board; players: readonly Player[]; shown: readonly number[]; turn: number; top?: number; bottom?: number; letters?: Readonly<Record<number, string>>; played?: readonly number[] } = $props();
  const MARK = { start: '', word: 'A', double: '×2', sentence: '文', picture: '絵', event: '!', goal: '' } as const;
  const BOARD = $derived(board.spaces);
  const H = $derived(board.h);
  const edges = $derived(BOARD.flatMap((sp, i) => sp.next.map((j) => [i, j] as const)));
  const goalY = $derived(BOARD[board.goal].y);
  const river = $derived(Array.from({ length: 31 }, (_, k) => `${k * 12},${riverY(board, k * 12).toFixed(1)}`).join(' '));
  const trees = $derived(board.trees.filter(([x]) => x > -6 && x < W + 6));
  /** Each player's head: its stone, nudged apart when stones are shared. */
  const heads = $derived(players.map((p, k) => {
    const at = shown[k] ?? 0, sp = BOARD[at];
    const same = players.map((_, j) => j).filter((j) => (shown[j] ?? 0) === at);
    const n = same.indexOf(k), m = same.length;
    /** Apart in pixels (the small board's heads are small too). */
    const dx = m > 1 ? (n - (m - 1) / 2) * 18 : 0;
    // (on ふりだし and あがり below the stone: its name stays readable)
    const end = sp.kind === 'start' || sp.kind === 'goal';
    return { p, k, dx, x: sp.x, y: end ? sp.y + 26 : sp.y - 16 - (m > 2 && n % 2 ? 8 : 0) };
  }));
  // the window follows whose turn it is (its head in the middle of the part the overlays leave), smoothly
  let win: HTMLDivElement | undefined = $state();
  let boardEl: HTMLDivElement | undefined = $state();
  const focusY = $derived(heads[turn]?.y ?? 0);
  $effect(() => {
    const el = win, b = boardEl, y = focusY, hv = Math.max(80, (win?.clientHeight ?? 0) - top - bottom);
    if (!el || !b) return;
    el.scrollTo({ top: Math.max(0, (y / H) * b.offsetHeight - hv / 2), behavior: 'smooth' });
  });
</script>

<div class="win" bind:this={win} style:padding-top="{top}px" style:padding-bottom="{bottom}px">
<div class="board" role="img" aria-label={s('board')} data-sg-board bind:this={boardEl} style:aspect-ratio="{W} / {H}">
  <svg viewBox="0 0 {W} {H}" aria-hidden="true">
    <!-- the island -->
    <rect width={W} height={H} rx="22" class="grass" />
    <polyline class="river" points={river} />
    <path class="sand" d="M0 {H} L0 {goalY + 30} C 120 {goalY + 18}, 240 {goalY + 30}, 360 {goalY + 20} L 360 {H} Z" />
    <path class="sea" d="M0 {H} L0 {goalY + 62} C 120 {goalY + 52}, 240 {goalY + 64}, 360 {goalY + 54} L 360 {H} Z" />
    {#each trees as [x, y, r], k (k)}<circle class="tree" cx={x} cy={y} {r} />{/each}
    <rect class="house" x={board.house.x - 20} y={board.house.y - 4} width="40" height="22" rx="4" /><path class="roof" d="M{board.house.x - 24} {board.house.y - 2} L{board.house.x} {board.house.y - 18} L{board.house.x + 24} {board.house.y - 2} Z" />
    <!-- the path -->
    {#each edges as [a, b] (`${a}-${b}`)}<line class="path" x1={BOARD[a].x} y1={BOARD[a].y} x2={BOARD[b].x} y2={BOARD[b].y} />{/each}
    <!-- the stones -->
    {#each BOARD as sp, i (i)}
      {#if sp.kind === 'start' || sp.kind === 'goal'}
        <circle class="stone k-{sp.kind}" cx={sp.x} cy={sp.y} r="22" />
        <text class="end" x={sp.x} y={sp.y + 4}>{s(`kind.${sp.kind}`)}</text>
      {:else if sp.mini && !played.includes(i)}
        <!-- みんなで！: two heads (a ことば once played) -->
        <circle class="stone k-mini" cx={sp.x} cy={sp.y} r="16" />
        <g class="heads" transform="translate({sp.x} {sp.y})"><circle cx="-5" cy="-4" r="3.6" /><circle cx="5" cy="-4" r="3.6" /><path d="M-11 9 a6 5.5 0 0 1 12 0 Z M-1 9 a6 5.5 0 0 1 12 0 Z" /></g>
      {:else}
        <circle class="stone k-{sp.kind}" cx={sp.x} cy={sp.y} r="16" />
        <text class="mark" x={sp.x} y={sp.y + 5}>{MARK[sp.kind]}</text>
        {#if letters[i]}<g class="lstone" transform="translate({sp.x + 13} {sp.y - 13})"><circle r="9" /><text y="4">{letters[i].toUpperCase()}</text></g>{/if}
      {/if}
    {/each}
    {#each board.signs as sg (sg.i)}
      <g class="sign" transform="translate({sg.x} {sg.y})"><rect x="-21" y="-7.5" width="42" height="15" rx="3" /><text x="0" y="3.5">{s(`area.${BOARD[sg.i].area}`)}</text></g>
    {/each}
  </svg>
  {#each heads as h (h.k)}
    <span class="head" class:now={h.k === turn} style:left="{(h.x / W) * 100}%" style:top="{(h.y / H) * 100}%" style:margin-left="{h.dx}px" data-sg-token={h.k} data-at={shown[h.k]}>
      <Avatar person={h.p.who} worn size={26} />
    </span>
  {/each}
  {#each BOARD as _, i (i)}<span class="hit" data-sg-space={i} data-kind={BOARD[i].mini && !played.includes(i) ? 'mini' : BOARD[i].kind} style:left="{(BOARD[i].x / W) * 100}%" style:top="{(BOARD[i].y / H) * 100}%"></span>{/each}
</div>
</div>

<style>
  /* a window onto the long route under the whole screen; the overlays' insets its padding, so both ends scroll clear */
  .win { position: absolute; inset: 0; overflow-y: auto; scrollbar-width: none; overscroll-behavior: contain; box-sizing: border-box; }
  .board { position: relative; width: 100%; }
  svg { display: block; width: 100%; height: 100%; filter: drop-shadow(0 3px 0 var(--c-edge)); }
  .grass { fill: color-mix(in srgb, var(--c-mint) 70%, #9fd38a); }
  .river { fill: none; stroke: color-mix(in srgb, var(--c-sky) 85%, white); stroke-width: 22; }
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
  .k-mini { fill: color-mix(in srgb, var(--c-rose) 55%, white); }
  .heads { fill: var(--c-ink); }
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
