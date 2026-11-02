<script lang="ts">
  // The board open (docs/board.md "The board view"): on the 3D island the camera dollies to the board's face
  // (world.three.focus, ≈600 ms) and back to exactly where it was (unfocus); elsewhere (the 2D island, or before the 3D
  // island has a focus) a sheet over the island shows the same face, its very canvas. Either way the notes are buttons
  // over the face (a tap reads one: its whole text, なおす and はがす when it's mine to), ‹ › and a swipe page through
  // the older ones, 「かきこむ」 opens the field (the board kept in view above the keyboard), 「もどる」 goes back.
  import { onMount, tick, untrack } from 'svelte';
  import { useWorld } from '../island/camera.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { BOARD_CHARS, BOARD_LINES, cleanText, textLength, type Post } from '#lib/contract/board.ts';
  import { board } from './posts.svelte.ts';
  import { FACE_H, FACE_W, PER_PAGE, noteRect } from './face.ts';
  import { postDate } from './date.ts';
  import { BOARD_S, FACE, inFront, type BoardProj } from './spot.ts';

  interface Props {
    canvas: HTMLCanvasElement;
    face: { page: number; selected: string | null; rev: number };
    at: { x: number; z: number; f: number };
    three: BoardProj | null;
    onclose: () => void;
    night?: boolean;
  }
  let { canvas, face, at, three, onclose, night = false }: Props = $props();
  const w = useWorld();
  /** The camera's ease, both ways (the user's ≈600 ms). */
  const EASE_MS = 600;

  const mode = untrack(() => (three?.focus && three.unfocus ? '3d' : 'sheet'));
  const posts = $derived(board.posts);
  const pages = $derived(Math.max(1, Math.ceil(posts.length / PER_PAGE)));
  const page = $derived(Math.min(face.page, pages - 1));
  const shown = $derived(posts.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE));
  const picked = $derived(posts.find((p) => p.id === face.selected) ?? null);
  // seen while it's open: what's on it now (a post arriving while I read is read too)
  $effect(() => {
    void posts;
    untrack(() => board.seen());
  });

  // ---- where the face is on screen (client px): the sheet's canvas, or the 3D board's face projected ----
  let box = $state<{ left: number; top: number; width: number; height: number } | null>(null);
  let slot = $state<HTMLElement>();
  let root = $state<HTMLElement>();
  let ready = $state(mode === 'sheet');
  function measure() {
    if (mode === 'sheet') {
      const r = canvas.getBoundingClientRect();
      box = r.width ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
      return;
    }
    const [fx, fz] = inFront(at, FACE.z * BOARD_S), d = inFront({ x: 0, z: 0, f: at.f }, 1), right = [-d[1], d[0]];
    const hw = (FACE.w * BOARD_S) / 2, y0 = (FACE.y - FACE.h / 2) * BOARD_S, y1 = (FACE.y + FACE.h / 2) * BOARD_S;
    const a = w.clientAt(fx - right[0] * hw, fz - right[1] * hw, y1), b = w.clientAt(fx + right[0] * hw, fz + right[1] * hw, y0);
    box = { left: Math.min(a[0], b[0]), top: Math.min(a[1], b[1]), width: Math.abs(b[0] - a[0]), height: Math.abs(b[1] - a[1]) };
  }

  // ---- the keyboard: the board kept above it ----
  let kb = $state(0);
  let vh = $state(typeof innerHeight === 'number' ? innerHeight : 800);
  let bar = $state<HTMLElement>();
  function viewport() {
    const vv = window.visualViewport;
    vh = vv ? vv.height : innerHeight;
    kb = vv ? Math.max(0, innerHeight - vv.height - vv.offsetTop) : 0;
  }
  /** Frame the face (again): above the controls and the keyboard. */
  async function frame(ms: number) {
    if (mode !== '3d' || !three?.focus) return;
    const [fx, fz] = inFront(at, FACE.z * BOARD_S);
    await three.focus({ x: fx, z: fz, y: FACE.y * BOARD_S, w: FACE.w * BOARD_S, h: FACE.h * BOARD_S, yaw: (at.f * Math.PI) / 2, top: (document.querySelector('.ribbon-wrap')?.getBoundingClientRect().bottom ?? 0) + 10, bottom: kb + (bar?.offsetHeight ?? 0), fill: 0.92 }, ms);
    measure();
  }

  onMount(() => {
    // the view lives over everything (the island's gestures never see its taps)
    if (root) document.body.appendChild(root);
    if (mode === 'sheet' && slot) slot.appendChild(canvas);
    viewport();
    const vv = window.visualViewport;
    const onvv = () => (viewport(), mode === 'sheet' ? requestAnimationFrame(measure) : void frame(0));
    vv?.addEventListener('resize', onvv);
    vv?.addEventListener('scroll', onvv);
    const ro = new ResizeObserver(() => measure());
    if (mode === 'sheet') ro.observe(canvas);
    else void frame(EASE_MS).then(() => (ready = true));
    requestAnimationFrame(measure);
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      if (writing) writing = null;
      else if (face.selected) face.selected = null;
      else void back();
    };
    window.addEventListener('keydown', key);
    return () => {
      vv?.removeEventListener('resize', onvv);
      vv?.removeEventListener('scroll', onvv);
      window.removeEventListener('keydown', key);
      ro.disconnect();
      canvas.remove();
      root?.remove();
    };
  });

  let leaving = false;
  async function back() {
    if (leaving) return;
    leaving = true;
    face.selected = null;
    writing = null;
    board.seen();
    if (mode === '3d') await three?.unfocus?.(EASE_MS);
    onclose();
  }

  // ---- paging: ‹ ›, and a swipe across the face ----
  function turn(by: number) {
    const n = Math.min(pages - 1, Math.max(0, page + by));
    if (n === page) return;
    face.page = n;
    face.selected = null;
  }
  let swipe: { x: number; y: number; id: number } | null = null;
  let swiped = false;
  function down(e: PointerEvent) {
    swipe = { x: e.clientX, y: e.clientY, id: e.pointerId };
    swiped = false;
  }
  function up(e: PointerEvent) {
    if (!swipe || swipe.id !== e.pointerId) return;
    const dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped = true;
      // a swipe to the left brings the older page (NH's: the next one)
      turn(dx < 0 ? 1 : -1);
    }
  }
  function pick(p: Post) {
    if (swiped) return void (swiped = false);
    face.selected = face.selected === p.id ? null : p.id;
    removing = false;
  }

  // ---- writing: a new note, or mine again ----
  let writing = $state<{ id: string | null; text: string } | null>(null);
  let field = $state<HTMLTextAreaElement>();
  let removing = $state(false);
  const left = $derived(writing ? BOARD_CHARS - textLength(writing.text) : BOARD_CHARS);
  const can = $derived(!!writing && !!cleanText(writing.text));
  async function startWriting(p: Post | null) {
    writing = { id: p?.id ?? null, text: p?.t ?? '' };
    face.selected = p?.id ?? null;
    await tick();
    field?.focus();
    void frame(250);
  }
  /** As typed: at most BOARD_LINES lines and BOARD_CHARS characters (the rest is never sent). */
  function typed(e: Event) {
    const el = e.currentTarget as HTMLTextAreaElement;
    let v = el.value;
    const lines = v.split('\n');
    if (lines.length > BOARD_LINES) v = lines.slice(0, BOARD_LINES).join('\n');
    const cps = Array.from(v);
    if (cps.length > BOARD_CHARS) v = cps.slice(0, BOARD_CHARS).join('');
    if (v !== el.value) el.value = v;
    if (writing) writing.text = v;
  }
  function submit(e?: Event) {
    e?.preventDefault();
    if (!writing || !can) return;
    const ok = writing.id ? board.edit(writing.id, writing.text) : board.write(writing.text);
    if (!ok) return;
    if (!writing.id) face.page = 0;
    face.selected = writing.id;
    writing = null;
    field?.blur();
    void frame(250);
  }
  function cancel() {
    writing = null;
    field?.blur();
    void frame(250);
  }
  function remove(p: Post) {
    if (!removing) return void (removing = true);
    removing = false;
    if (board.remove(p.id)) face.selected = null;
  }
  const label = (p: Post) => t('board.note', { name: board.author(p.who).name, text: p.t });
</script>

<div class="bv" class:three={mode === '3d'} class:night bind:this={root} data-board-view={mode} data-ready={ready || undefined} style:--kb="{kb}px" style:--vh="{vh}px"
  role="dialog" aria-modal="true" aria-label={t('board.name')}>
  {#if mode === 'sheet'}
    <div class="stage">
      <div class="frame" style:aspect-ratio="{FACE_W} / {FACE_H}">
        <div class="slot" bind:this={slot}></div>
      </div>
    </div>
  {/if}

  <button type="button" class="back" data-sfx="back" data-board-back onclick={back}>‹ {t('common.back')}</button>

  {#if box && ready}
    <!-- the notes: a button over each (its text for a screen reader; what's drawn is the canvas) -->
    <div class="notes" role="group" aria-label={t('board.name')} style:left="{box.left}px" style:top="{box.top}px" style:width="{box.width}px" style:height="{box.height}px"
      onpointerdown={down} onpointerup={up} onpointercancel={() => (swipe = null)}>
      {#each shown as p, i (p.id)}
        {@const r = noteRect(i)}
        <button type="button" class="note" data-sfx="tick" data-note={p.id} data-who={p.who} aria-pressed={face.selected === p.id} aria-label={label(p)}
          style:left="{(r.x / FACE_W) * 100}%" style:top="{(r.y / FACE_H) * 100}%" style:width="{(r.w / FACE_W) * 100}%" style:height="{(r.h / FACE_H) * 100}%"
          onclick={() => pick(p)}></button>
      {/each}
    </div>
  {/if}

  <div class="bar" bind:this={bar}>
    {#if writing}
      <form class="write" onsubmit={submit} data-board-write>
        <textarea bind:this={field} value={writing.text} oninput={typed} rows="4" maxlength={BOARD_CHARS * 2} aria-label={t('board.field')}
          placeholder={t('board.placeholder')} enterkeyhint="enter" data-sfx="none" data-board-field></textarea>
        <div class="row">
          <span class="count" class:low={left <= 10} aria-live="polite">{t('board.left', { n: left })}</span>
          <button type="button" class="btn ghost" data-sfx="back" onclick={cancel}>{t('board.cancel')}</button>
          <button type="submit" class="btn go" data-sfx="confirm" aria-disabled={!can} data-board-post>{writing.id ? t('board.save') : t('board.post')}</button>
        </div>
      </form>
    {:else if picked}
      <div class="read" data-board-read={picked.id}>
        <div class="who"><b>{board.author(picked.who).name}</b><span>{postDate(picked.p)}{picked.at > picked.p ? ` · ${t('board.edited')}` : ''}</span></div>
        <p class="text">{picked.t}</p>
        <div class="row">
          {#if board.mayEdit(picked)}<button type="button" class="btn" data-sfx="open" data-board-edit onclick={() => startWriting(picked)}>{t('board.edit')}</button>{/if}
          {#if board.mayRemove(picked)}
            <button type="button" class="btn warn" data-sfx={removing ? 'confirm' : 'tick'} data-board-remove onclick={() => remove(picked)}>{removing ? t('board.removeSure') : t('board.remove')}</button>
          {/if}
          <button type="button" class="btn ghost" data-sfx="back" onclick={() => ((face.selected = null), (removing = false))}>{t('common.close')}</button>
        </div>
      </div>
    {:else}
      <div class="row pager">
        <button type="button" class="btn arrow" data-sfx="page" aria-label={t('board.newer')} aria-disabled={page === 0} data-board-newer onclick={() => turn(-1)}>‹</button>
        <span class="pg" data-board-page={page + 1}>{page + 1} / {pages}</span>
        <button type="button" class="btn arrow" data-sfx="page" aria-label={t('board.older')} aria-disabled={page >= pages - 1} data-board-older onclick={() => turn(1)}>›</button>
        <button type="button" class="btn go" data-sfx="open" data-board-write-open onclick={() => startWriting(null)}>{t('board.write')}</button>
      </div>
    {/if}
  </div>
</div>

<style>
  .bv {
    /* the island's HUD (its ribbon, きょう…ベル, and the jar) ends at its lip (+page.svelte --hud-bottom: the view lives
       on <body>, so it's worked out here from the same tokens); 「もどる」 sits under it, never over the ribbon */
    --hud-end: calc(var(--hud-top, calc(env(safe-area-inset-top, 0px) + 10px)) + var(--hit, 44px) + var(--lip-h, 4px));
    --back-top: calc(var(--hud-end) + 10px);
    position: fixed; inset: 0; z-index: 1000; display: flex; flex-direction: column; font-family: var(--font-ui); color: #5A4632;
    background: linear-gradient(#8fd3e6ee, #bfe7c8ee); -webkit-user-select: none; user-select: none; touch-action: none;
    animation: bv-in .25s ease-out both;
  }
  /* the 3D island's: the board itself is the view, only the controls over it */
  .bv.three { background: none; animation: none; }
  @keyframes bv-in { from { opacity: 0; } }
  .stage { flex: 1; min-height: 0; display: grid; place-items: center; padding: calc(var(--back-top) + 52px) 12px 8px; height: calc(var(--vh) - 8px); box-sizing: border-box; }
  .frame {
    width: min(100%, 560px, calc((var(--vh) - var(--bar-h, 150px) - var(--back-top) - 76px) * 1.36)); background: #5E6B4C; border-radius: 14px; padding: 12px;
    box-shadow: inset 0 0 0 3px #47523A, 0 8px 0 #3E4733, 0 14px 30px rgba(30, 50, 30, .35); box-sizing: content-box;
  }
  .slot { width: 100%; height: 100%; border-radius: 6px; overflow: hidden; box-shadow: inset 0 2px 6px rgba(0, 0, 0, .35); }
  .slot :global(canvas) { display: block; width: 100%; height: 100%; }
  .back {
    position: absolute; left: 12px; top: var(--back-top); z-index: 2; padding: 8px 16px; border: 0; border-radius: 999px;
    background: #FFF8E4; color: #6B5232; font: 700 16px / 1 var(--font-ui); box-shadow: 0 3px 0 #D9C8A2; min-height: 44px;
  }
  .notes { position: fixed; z-index: 1; }
  .note { position: absolute; padding: 0; border: 0; background: none; border-radius: 10px; -webkit-tap-highlight-color: transparent; }
  .note:focus-visible { outline: 3px solid #F08A3C; }
  .bar {
    position: absolute; left: 0; right: 0; bottom: var(--kb); z-index: 2; padding: 10px 12px calc(10px + env(safe-area-inset-bottom)); box-sizing: border-box;
    display: flex; justify-content: center;
  }
  .bar > * { width: min(100%, 560px); }
  .row { display: flex; align-items: center; gap: 8px; justify-content: flex-end; }
  .pager { justify-content: center; background: #FFF8E4f2; border-radius: 22px; padding: 8px; box-shadow: 0 4px 0 #D9C8A2; }
  .pg { min-width: 56px; text-align: center; font: 700 16px / 1 var(--font-num); }
  .btn {
    min-height: 44px; padding: 0 16px; border: 0; border-radius: 999px; background: #F3E7C9; color: #6B5232; font: 700 16px / 1 var(--font-ui);
    box-shadow: 0 3px 0 #D9C8A2;
  }
  .btn.arrow { width: 48px; padding: 0; font-size: 26px; }
  .bv.night:not(.three) { background: linear-gradient(#1f2f5cee, #2c4a6cee); }
  .btn[aria-disabled='true'] { opacity: .4; }
  .btn.go { background: #F7C948; box-shadow: 0 3px 0 #D6A42A; margin-left: auto; }
  .pager .btn.go { margin-left: 12px; }
  .btn.warn { background: #FFD9CF; box-shadow: 0 3px 0 #E8B2A4; }
  .btn.ghost { background: transparent; box-shadow: none; }
  .read, .write { background: #FFFDF2; border-radius: 18px; padding: 12px 14px; box-shadow: 0 4px 0 #D9C8A2, 0 10px 24px rgba(40, 30, 10, .2); }
  .who { display: flex; justify-content: space-between; gap: 8px; font-size: 15px; }
  .who span { color: #9A8466; }
  .text { margin: 8px 0 10px; font: 500 17px / 1.45 var(--font-ui); white-space: pre-wrap; overflow-wrap: anywhere; -webkit-user-select: text; user-select: text; }
  textarea {
    width: 100%; box-sizing: border-box; resize: none; border: 2px solid #E8DBBB; border-radius: 12px; padding: 10px; font: 500 17px / 1.4 var(--font-ui);
    color: #5A4632; background: #FFFEF8; -webkit-user-select: text; user-select: text;
  }
  textarea:focus { outline: none; border-color: #F2B632; }
  .count { margin-right: auto; color: #9A8466; font: 600 14px / 1 var(--font-num); white-space: nowrap; }
  .count.low { color: #E8603C; }
</style>
