<script lang="ts">
  // The island's bulletin board (けいじばん, docs/board.md): NH's board on the front beach, a layout object (spot.ts).
  // A tap on it walks my villager up to it (the tent door's way: the user's exception to "interactables act in place"),
  // then the board opens (BoardView): on the 3D island the camera dollies to its face, else a sheet. Its face shows the
  // posts (face.ts, drawn on a canvas: on the 3D board its texture, through world.three.attach when the 3D island has
  // it). A 「！」 over it: someone else wrote since I last looked. The bird perches on top, by day and by night (3D).
  import { onMount, untrack } from 'svelte';
  import { useWorld } from '../island/camera.svelte.ts';
  import OfficialArt from '../characters/OfficialArt.svelte';
  import { su } from '../island/scene.ts';
  import { sendTo, turnTo } from '../island/avatar.ts';
  import { actors, inMotion, livePos } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { board } from './posts.svelte.ts';
  import { BOARD_H, BOARD_S, READ_AT, boardAt, inFront, type BoardProj } from './spot.ts';
  import { DRAFT_ID, PER_PAGE, drawFace, fontReady } from './face.ts';
  import type { Post } from '#lib/contract/board.ts';
  import { postDate } from './date.ts';
  import type { Face3 } from './face3d.ts';
  import type { Season } from '#lib/ui-state/season.ts';

  interface Props {
    /** Live, not covered by a sheet, page visible, not decorating. */
    enabled: () => boolean;
    night: boolean;
    season: Season;
  }
  let { enabled, night, season }: Props = $props();
  const w = useWorld();

  const at = $derived(boardAt());
  const winter = $derived(season === 'winter');
  const key = $derived(winter ? 'deco/bulletin-board-winter' : 'deco/bulletin-board');

  // ---- the face: one canvas, drawn when the posts, the page or the pick change ----
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  canvas?.setAttribute('data-board-face', '');
  /** What the face shows (BoardView pages and picks; `draft`: the note being written, drawn as typed). */
  const face = $state({ page: 0, selected: null as string | null, rev: 0, draft: null as { id: string | null; text: string } | null });
  let face3: Face3 | null = null;
  /** What the face last drew (the e2e's hook: window.__board). */
  let drawn: string[] = [];
  function draw() {
    if (!canvas) return;
    const posts = withDraft(board.posts, face.draft), pages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
    const page = Math.min(face.page, pages - 1);
    const shown = posts.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);
    drawn = shown.map((p) => p.t);
    drawFace(canvas, {
      posts: shown, author: (who) => board.author(who), date: (p) => postDate(p.p), empty: t('board.empty'), selected: face.selected,
      redraw: () => face.rev++
    });
    face3?.update();
  }
  /** The posts as they'll be once the draft is up: mine again with its new text, or a new one first (DRAFT_ID). */
  function withDraft(posts: readonly Post[], d: typeof face.draft): readonly Post[] {
    if (!d) return posts;
    if (d.id) return posts.map((p) => (p.id === d.id ? { ...p, t: d.text } : p));
    const now = Date.now();
    return [{ id: DRAFT_ID, who: board.me, t: d.text, p: now, at: now }, ...posts];
  }
  $effect(() => {
    void board.posts;
    void face.page;
    void face.selected;
    void face.rev;
    void face.draft?.text;
    void t('board.empty');
    untrack(() => {
      void fontReady(board.posts.map((p) => p.t).join('') + (face.draft?.text ?? '')).then(draw);
      draw();
    });
  });

  // ---- the 3D island: the face on the model (once the lead's attach is there) ----
  $effect(() => {
    // (`w.three` itself isn't reactive: `rest.three` is the flag that follows it, so the face goes on when the 3D island
    // comes up after the board did, which it always does)
    void w.rest.three;
    const three = w.three as BoardProj | null;
    if (!three?.attach || !canvas) return;
    let gone = false;
    void import('./face3d.ts').then(({ faceMesh }) => {
      if (gone) return;
      face3 = faceMesh(canvas);
      three.attach!('board', face3.mesh);
      draw();
    });
    return () => {
      gone = true;
      three.attach?.('board', null);
      face3?.dispose();
      face3 = null;
    };
  });

  // ---- the e2e's hook: what the face drew, and where it is in 3D ----
  onMount(() => {
    const W = window as unknown as { __board?: unknown };
    W.__board = {
      drawn: () => drawn,
      /** The 3D face's place in the scene (null: none, or not in it). */
      face3: () => face3?.box() ?? null
    };
    return () => void delete W.__board;
  });

  // ---- the bird: a tiny idle (it looks about now and then) ----
  let look = $state(0);
  onMount(() => {
    const id = setInterval(() => (look = [0, 0.5, 0, -0.5, 0][Math.floor(Math.random() * 5)]), 3800);
    return () => clearInterval(id);
  });

  // ---- walking up to it, then opening it ----
  let open = $state(false);
  let View = $state<typeof import('./BoardView.svelte').default | null>(null);
  let walking: object | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** My villager this near the reading spot (u) reads it at once. */
  const NEAR_U = 34;
  function tap() {
    if (!enabled() || open) return;
    // a little to its right, in front: the board stays in view (and in reach of a tap) beside my villager
    const b = at, [fx, fz] = inFront(b, READ_AT), d = inFront({ x: 0, z: 0, f: b.f }, 1);
    const spot: [number, number] = [fx - d[1] * 40, fz + d[0] * 40];
    void import('./BoardView.svelte').then((m) => (View = m.default));
    const near = () => {
      const [x, z] = livePos('mine');
      return Math.hypot(x - spot[0], z - spot[1]) <= NEAR_U;
    };
    if (near() || actors.mine.asleep) return openUp();
    const p = sendTo(spot[0], spot[1]);
    if (!p) return openUp();
    const token = (walking = {});
    let tries = 0;
    const check = () => {
      if (walking !== token) return;
      if (actors.mine.walking || inMotion('mine')) return void (timer = setTimeout(check, 80));
      if (near()) return openUp();
      // stopped short (a reaction held my villager): on up to it
      const again = tries++ < 3 && sendTo(spot[0], spot[1]);
      if (again) timer = setTimeout(check, Math.max(80, again.ms - 40));
      else openUp();
    };
    timer = setTimeout(check, Math.max(0, p.ms - 40));
  }
  function openUp() {
    walking = null;
    turnTo(at.x);
    face.page = 0;
    face.selected = null;
    open = true;
  }
  // another tap on the island since (anywhere but the board): no reading it
  onMount(() => {
    const down = (e: Event) => {
      if (walking && !(e.target instanceof Element && e.target.closest('[data-board]'))) walking = null;
    };
    document.addEventListener('pointerdown', down, true);
    return () => (document.removeEventListener('pointerdown', down, true), clearTimeout(timer));
  });
</script>

<div class="node" {@attach w.at({ x: at.x, z: at.z, h: BOARD_H, m3: { key, id: 'board', yaw: (at.f * Math.PI) / 2 } })}>
  <button type="button" class="board" data-board data-sfx="open" data-unseen={board.unseen || undefined} aria-label={t('board.open')} onclick={tap}>
    <span class="art"><OfficialArt {key} size={su(BOARD_H)} /></span>
    {#if board.unseen}<span class="news" aria-label={t('board.new')}>！</span>{/if}
  </button>
</div>
<!-- the bird on its top (the 3D island's: the 2D board has none) -->
<div class="node bird" aria-hidden="true"
  {@attach w.at({ x: at.x, z: at.z + 2, h: 14, lift: BOARD_H + 1.4 * BOARD_S, m3: { key: `deco/bbs-bird-${night ? 'night' : 'day'}`, id: 'board-bird', yaw: look } })}></div>

{#if open && View && canvas}
  <View {canvas} {face} {night} at={at} three={w.three as BoardProj | null} onclose={() => (open = false)} />
{/if}

<style>
  .node { width: 0; height: 0; pointer-events: none; }
  .board {
    position: absolute; left: 0; top: 0; padding: 0; border: 0; background: none; pointer-events: auto; cursor: pointer;
    translate: -50% -94%; line-height: 0; -webkit-tap-highlight-color: transparent;
  }
  .art :global(.official) { max-width: none; filter: var(--leaf-tint,) drop-shadow(0 2px 1px rgba(60, 70, 40, .3)); }
  /* someone wrote: NH's 「！」 bobbing over the board */
  .news {
    position: absolute; left: 50%; top: calc(-14 * var(--su)); translate: -50% 0; display: grid; place-items: center;
    width: calc(16 * var(--su)); height: calc(16 * var(--su)); min-width: 22px; min-height: 22px; border-radius: 50%;
    background: #FFF6D8; color: #E8603C; font: 800 calc(12 * var(--su)) / 1 var(--font-ui); box-shadow: 0 2px 0 rgba(120, 80, 30, .35);
    animation: news 1.4s ease-in-out infinite;
  }
  @keyframes news { 50% { transform: translateY(calc(-3 * var(--su))); } }
  @media (prefers-reduced-motion: reduce) { .news { animation: none; } }
</style>
