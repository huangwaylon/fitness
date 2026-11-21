<script lang="ts">
  // The island's bulletin board (けいじばん, docs/board.md): NH's board on the front beach, a layout object (spot.ts).
  // A tap on it walks my villager up to it (the tent door's way: the user's exception to "interactables act in place"),
  // then the board opens (BoardView): on the 3D island the camera dollies to its face, else a sheet. Its face shows the
  // posts (face.ts, drawn on a canvas: on the 3D board its texture, through world.three.attach when the 3D island has
  // it). A 「！」 over it: someone else wrote since I last looked (NH's, the bite's model hopping: things3 emit 'bang'
  // held while there are). The bird perches on top, by day and by night. No DOM on the island (R4 step 7): its model,
  // the 「！」 and the bird are things3 things, its tap areas Tap3 (the canvas router's); BoardView is the overlay.
  import { onMount, untrack } from 'svelte';
  import { useWorld } from '../island/camera.svelte.ts';
  import { tap as tap3, thing, things3 } from '../world3d/things3.ts';
  import { art } from '#lib/art.ts';
  import { sendTo, turnTo } from '../island/avatar.ts';
  import { actors, inMotion, livePos } from '../motion/director.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { board } from './posts.svelte.ts';
  import { BOARD_H, BOARD_S, READ_AT, boardAt, inFront, type BoardProj } from './spot.ts';
  import { DRAFT_ID, PER_PAGE, drawFace, fontReady } from './face.ts';
  import type { Post } from '#lib/contract/board.ts';
  import { postDate } from './date.ts';
  import type { Face3 } from './face3d.ts';
  import type { Season } from '#lib/ui-state/season.ts';
  import { testHooks } from '#lib/ui-state/testMode.ts';
  import { cue } from '#lib/sound/cues.ts';

  interface Props {
    /** Live, not covered by a sheet, page visible. */
    enabled: () => boolean;
    night: boolean;
    season: Season;
  }
  let { enabled, night, season }: Props = $props();
  const w = useWorld();

  const at = $derived(boardAt());
  const winter = $derived(season === 'winter');
  const key = $derived(winter ? 'deco/bulletin-board-winter' : 'deco/bulletin-board');
  /** The 「！」's middle over the ground (u): just over the bird on top (its 14 u). */
  const NEWS_AT = BOARD_H + 1.4 * BOARD_S + 26;
  /** Its art's width (u), for its tap area. */
  const bw = $derived(((a) => (a ? (BOARD_H * a.w) / a.h : BOARD_H))(art(key)));

  // ---- the face: one canvas, drawn when the posts, the page or the pick change ----
  const canvas = typeof document !== 'undefined' ? document.createElement('canvas') : null;
  canvas?.setAttribute('data-board-face', '');
  /** What the face shows (BoardView pages and picks; `draft`: the note being written, drawn as typed). */
  const face = $state({ page: 0, selected: null as string | null, rev: 0, draft: null as { id: string | null; text: string } | null });
  let face3: Face3 | null = null;
  // (read untracked where the face is made: the night only sets its glow, it never makes the face again)
  let nightNow = false;
  $effect(() => {
    nightNow = night;
    face3?.night(night);
  });
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
      face3.night(nightNow);
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
    if (!testHooks()) return; // never on a live phone
    window.__board = {
      drawn: () => drawn,
      /** The 3D face's place in the scene (null: none, or not in it). */
      face3: () => face3?.box() ?? null
    };
    return () => void delete window.__board;
  });

  // ---- the bird: a tiny idle (it looks about now and then), only while the island is seen ----
  let look = $state(0);
  $effect(() => {
    if (!enabled()) return;
    const id = setInterval(() => (look = [0, 0.5, 0, -0.5, 0][Math.floor(Math.random() * 5)]), 3800);
    return () => clearInterval(id);
  });

  // ---- on the island: its model, the 「！」 over it, the bird on top, its tap areas (the 2D button's: its art drawn at
  // translate(−50%, −94%); the 「！」's) ----
  $effect(() => {
    const { x, z, f } = at, m3 = { key, id: 'board', yaw: (f * Math.PI) / 2 };
    return untrack(() => thing(w, { x, z, h: BOARD_H, m3 })());
  });
  $effect(() => {
    if (!board.unseen) return;
    const { x, z } = at;
    // (NH's 「！」 at 0.7: over the bird's head, `NEWS_AT` its middle; the bite's model pops up 8 u over its lift)
    return untrack(() => thing(w, { x, z, h: NEWS_AT + 12, m3: { key: '', id: 'board-news', emit: { kind: 'bang', every: 0, hold: true, size: 0.7, lift: NEWS_AT - 8 } } })());
  });
  $effect(() => {
    const { x, z } = at, m3 = { key: `deco/bbs-bird-${night ? 'night' : 'day'}`, id: 'board-bird', yaw: look };
    return untrack(() => thing(w, { x, z: z + 2, h: 14, lift: BOARD_H + 1.4 * BOARD_S, m3 })());
  });
  $effect(() => {
    const { x, z } = at, half = bw / 2, news = board.unseen;
    return untrack(() => tap3(w, [
      { kind: 'board', id: '', x, z, h: BOARD_H, l: -half, r: half, b: -0.06 * BOARD_H, t: 0.94 * BOARD_H, act: routed },
      ...(news ? [{ kind: 'board', id: '', part: 'news', x, z, h: BOARD_H, l: -12, r: 12, b: NEWS_AT - 12, t: NEWS_AT + 12, act: routed }] : [])
    ])());
  });
  // the e2e's row (things3 probes 'board'): its 「！」 up
  $effect(() => {
    const r = things3(w), row = () => ({ unseen: board.unseen });
    r.probes.set('board', row);
    return () => void (r.probes.get('board') === row && r.probes.delete('board'));
  });

  // ---- walking up to it, then opening it ----
  let open = $state(false);
  let View = $state<typeof import('./BoardView.svelte').default | null>(null);
  let walking: object | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** My villager this near the reading spot (u) reads it at once. */
  const NEAR_U = 34;
  /** The canvas router's tap (no button for sound/taps.ts to read a data-sfx off: its `open` here). */
  function routed() {
    if (enabled() && !open) cue('open');
    tap();
  }
  function tap() {
    if (!enabled() || open) return;
    // a little to its right, in front: the board stays in view (and in reach of a tap) beside my villager
    const b = at, [fx, fz] = inFront(b, READ_AT), d = inFront({ x: 0, z: 0, f: b.f }, 1);
    const spot: [number, number] = [fx - d[1] * 40, fz + d[0] * 40];
    // (its chunk not to be had, offline or a deploy's old build: said, and the tap undone, so another tries again)
    import('./BoardView.svelte').then((m) => (View = m.default), () => {
      walking = null;
      clearTimeout(timer);
      open = false;
      toasts.show(t('panel.sheetOffline'), 6000, { action: { label: t('state.retry'), run: tap } });
    });
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
  // another tap since (a touch-down anywhere: a tap on the board again starts the walk over): no reading it
  onMount(() => {
    const down = () => void (walking = null);
    document.addEventListener('pointerdown', down, true);
    return () => (document.removeEventListener('pointerdown', down, true), clearTimeout(timer));
  });
</script>

{#if open && View && canvas}
  <View {canvas} {face} {night} at={at} three={w.three as BoardProj | null} onclose={() => (open = false)} />
{/if}
