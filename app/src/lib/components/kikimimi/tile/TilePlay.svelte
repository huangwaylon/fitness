<script lang="ts">
  // A round of ことば タイル (docs/kikimimi-engine.md "ことば タイル"; games/tile/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte: the players' chips, the timer, the status line, つぎへ / よみおわった). The speaker pops in and
  // the clip plays once with no tiles (the situation, `ctx`, under the bubble); then the sentence's slots and the board's
  // tiles: a tap puts a tile in my next empty slot (its dashed yuzu outline), a tap on a placed one takes it back; or a
  // drag (drag.svelte.ts, drop.ts) puts a tile on a slot (onto a filled one: inserted, the rest shifting), moves a placed
  // one, or takes it back, the sentence showing the result while it's held. 「できた」 sends it once my slots are full (the
  // foot's: RoundFrame `action`). 🔁 as often as wanted (a replay: "hard" for review, never points). Co-op: one sentence, my slots
  // every other one (role 0 the 1st, 3rd…), the partner's shown as theirs; easy: my first slot placed for me.
  // The reveal: ○ / × and my words right, the spoken shape over the written (the bubble's sound marks: should've →
  // shoulda) with the karaoke as it replays, the Japanese, the trap's note, each slot's word (○, or × with what was put
  // there: co-op the team's), then 解説 (`why`).
  import Note from '../frame/Note.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import type { TileCard } from '#lib/kikimimi/games/tile/def.ts';
  import { EMPTY } from '#lib/kikimimi/games/listened.ts';
  import { slotOk, tileOk } from '#lib/kikimimi/games/tile/def.ts';
  import { RIGHT, firstListen } from '#lib/kikimimi/score.ts';
  import { boardFor, mySlots, teamWords } from './board.ts';
  import { dropOn, type From, type To } from './drop.ts';
  import { TileDrag } from './drag.svelte.ts';
  import { blank, easy, isCoop } from '../listenView.ts';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import Why from '../frame/Why.svelte';
  import ClipBar from '../scene/ClipBar.svelte';
  import SoundLine from '../scene/SoundLine.svelte';
  import MarkLegend from '../scene/MarkLegend.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import Mark from '../../ui/Mark.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const it = $derived(game.items[v.i] as TileCard | undefined);
  const reveal = $derived(v.phase === 'reveal');
  const n = $derived(it?.tile.tiles.length ?? 0);
  const board = $derived(it ? boardFor(v, it) : []);
  const coop = $derived(isCoop(v));
  const slots = $derived(mySlots(v, game.me, n));
  /** Easy: my first slot's word placed for me (kept). */
  const given = $derived(it && easy(v) ? slots[0] : -1);
  const sent = $derived(v.answers[v.i] ?? null);
  const sentA = $derived(sent && Array.isArray(sent.a) ? (sent.a as readonly number[]) : null);

  /** What I've placed this round (before 「できた」): kept by the round. */
  let work = $state<{ key: string; a: number[] } | null>(null);
  const key = $derived(`${v.g}:${v.i}`);
  function fresh(): number[] {
    const a = blank(n);
    if (it && given >= 0) a[given] = board.indexOf(it.tile.tiles[given]);
    return a;
  }
  const placed = $derived<readonly number[]>(sentA ?? (work?.key === key ? work.a : fresh()));
  const full = $derived(slots.every((j) => placed[j] !== EMPTY));
  /** The tiles take a tap: the answer window, not answered, not sat out. */
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  const shown = $derived(v.phase === 'answer' || reveal);
  /** My slots a tile moves through (easy's given one stays). */
  const mine = $derived(slots.filter((j) => j !== given));

  let sentenceEl = $state<HTMLElement | null>(null);
  /** Where a point lands: one of my slots (its 44 px target and half the gap round it), another slot or a gap in the
   *  sentence (nowhere), else back to the pool. */
  function hit(x: number, y: number): To {
    const near = (r: DOMRect, m: number) => x >= r.left - m && x <= r.right + m && y >= r.top - m && y <= r.bottom + m;
    for (const el of sentenceEl?.querySelectorAll<HTMLElement>('[data-slot]') ?? []) {
      if (!near(el.getBoundingClientRect(), 4)) continue;
      const j = Number(el.dataset.slot);
      return mine.includes(j) ? { slot: j } : null;
    }
    return sentenceEl && near(sentenceEl.getBoundingClientRect(), 4) ? null : 'back';
  }
  const drag = new TileDrag({
    hit,
    drop: (from, to) => {
      const a = open ? dropOn(placed, mine, from, to) : null;
      if (a) work = { key, a };
      return !!a;
    },
    scroller: () => sentenceEl?.closest('.kk-body') ?? null
  });
  // the window closed or the reveal came mid-drag: the drag cancels before the board locks
  $effect(() => {
    if (!open) drag.cancel();
  });
  const press = (e: PointerEvent, from: From, word: string) => open && drag.down(e, from, word);
  /** What the sentence shows: while a tile is held, what letting go would make (the slot it left empty). */
  const shownA = $derived.by<readonly number[]>(() => {
    const f = drag.from;
    if (!f || !drag.lift) return placed;
    const a = dropOn(placed, mine, f, drag.to);
    if (a) return a;
    return 'slot' in f ? placed.map((x, j) => (j === f.slot ? EMPTY : x)) : placed;
  });
  /** The slot a tap fills next (its dashed outline). */
  const nextSlot = $derived(open && !drag.lift ? slots.find((j) => shownA[j] === EMPTY) : undefined);
  /** A tap on a tile with my slots full: the sentence's outline flashes (no tap tax, no boop). */
  let flash = $state(0);
  let originEl = $state<HTMLElement | null>(null);
  const origin = $derived.by(() => {
    const r = originEl?.getBoundingClientRect();
    return r ? { x: r.left, y: r.top } : { x: 0, y: 0 };
  });
  const ox = $derived(origin.x), oy = $derived(origin.y);

  function edit(f: (a: number[]) => void) {
    const a = [...placed];
    f(a);
    work = { key, a };
  }
  function place(k: number) {
    const j = slots.find((s) => placed[s] === EMPTY);
    if (!open || placed.includes(k)) return;
    if (j === undefined) return void (flash = (flash + 1) % 2 || 2);
    edit((a) => (a[j] = k));
  }
  function unplace(j: number) {
    if (open && j !== given && placed[j] !== EMPTY) edit((a) => (a[j] = EMPTY));
  }
  const clear = () => open && edit((a) => slots.forEach((j) => j !== given && (a[j] = EMPTY)));
  const done = () => open && full && game.answer([...placed]);

  const right = $derived(!!sentA && !!it && tileOk({ tiles: it.tile.tiles, board }, sentA));
  const verdict = $derived(v.out ? 'out' : right ? 'right' : sent ? 'wrong' : 'none');
  /** My words right (of mine). */
  const mineRight = $derived(sentA && it ? slots.filter((j) => slotOk({ tiles: it.tile.tiles, board }, sentA, j)).length : 0);
  /** At the reveal, the sentence as put together: mine, co-op everyone's. */
  const putWords = $derived.by(() => {
    if (!it || !reveal) return [];
    return coop ? teamWords(v, it, game.me, sentA) : Array.from({ length: n }, (_, j) => (sentA && sentA[j] !== EMPTY ? (board[sentA[j]] ?? null) : null));
  });
  const teamShort = $derived(putWords.filter((w, j) => w !== it?.tile.tiles[j]).length);

  const canHear = $derived(v.speaks && !v.out && (v.phase === 'answer' || reveal));
  const bar = $derived.by(() => {
    const s = game.sounding;
    if (s && s.i === v.i) return { from: s.from, until: s.until, key: `r${s.from}` };
    if (v.phase === 'play') return { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` };
    return null;
  });
  const playFrom = $derived(game.sounding && game.sounding.i === v.i ? game.sounding.from : null);
  const clock = () => game.clock();
</script>

{#if it}
{#snippet stage()}
  <div class="stage">
    <span class="speaker" class:pop={v.phase === 'lead'} class:talk={!!bar}>
      <OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={reveal ? 56 : 68} eager />
      {#if reveal && !v.out}<span class="react" aria-hidden="true"><Mark id={right ? 'sparkle' : 'sweat'} /></span>{/if}
    </span>
    <div class="bubble obj-cream" class:open={reveal} aria-live="polite">
      {#if reveal}
        <p class="en" data-kiki-en><SoundLine en={it.en} marks={it.marks} clip={it.id} from={playFrom} {clock} /></p>
        <p class="ja">{it.ja}</p>
        <div class="meta">
          <span class="accent" data-accent={it.voice}>{t(`kiki.accent.${it.voice}`)}</span>
          {#if it.marks}<MarkLegend marks={it.marks} />{/if}
        </div>
        {#if it.note}<Note text={it.note} />{/if}
      {:else}
        <p class="notes"><span aria-hidden="true">♪…</span><span class="sr-only">{t('kiki.listen')}</span></p>
        <ClipBar {bar} now={game.now} height={8} />
      {/if}
    </div>
    {#if it.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
    {#if (v.speaks || game.listenOnly) && !v.out}
      <div class="hear">
        <button type="button" class="btn small paper" data-kiki-replay aria-disabled={!canHear} data-sfx="tick" onclick={() => canHear && game.replay(false)}>🔁 {t('kiki.replay')}</button>
        {#if game.listenOnly}<small class="hint" data-kiki-host-plays>{t('kiki.replayHost')}</small>{/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet madeLine()}
  <span class="words" data-kiki-tile-words={mineRight}>{t('kiki.tile.words', { k: mineRight, n: slots.length })}</span>
  {#if coop}<span class="team-now" data-kiki-tile-team={teamShort}>{teamShort ? t('kiki.tile.short', { k: teamShort }) : t('kiki.tile.made')}</span>{/if}
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} {right} picked={!!sent} pts={RIGHT} badge={firstListen(right, !!sent?.rp, v.same)} coop={false} rightNow={0} extra={v.out ? undefined : madeLine} />
  {:else if !shown}
    <p class="ask" data-kiki-tile-wait>{t('kiki.tile.wait')}</p>
  {:else if !v.out}
    <p class="ask">{coop ? t(slots[0] === 0 ? 'kiki.tile.askOdd' : 'kiki.tile.askEven') : t('kiki.tile.ask')}</p>
  {/if}

  {#if shown && !v.out}
    <!-- the sentence: my slots (a placed tile taps back), the partner's as theirs; at the reveal each slot's word -->
    <ol class="sentence" class:live={open} aria-label={t('kiki.tile.sentence')} data-kiki-tile-sentence data-flash={flash || undefined} bind:this={sentenceEl}>
      {#each it.tile.tiles as word, j (j)}
        {@const own = slots.includes(j)}
        {@const k = shownA[j]}
        {#if reveal}
          {@const put = putWords[j]}
          <li class="slot obj-cream" data-slot={j} data-mark={put === word ? 'right' : 'wrong'}>
            <span lang="en">{word}</span>
            {#if put !== word}<s class="put" lang="en">{put ?? '—'}</s>{/if}
          </li>
        {:else if j === given}
          <!-- easy's given word: fixed (no edge or lip, a pin), never moved or a target -->
          <li class="slot given" data-slot={j} data-filled data-given aria-label={t('kiki.tile.given', { w: board[k] })}><span class="pin" aria-hidden="true">📌</span><span lang="en">{board[k]}</span></li>
        {:else if own}
          {@const over = !!drag.to && drag.to !== 'back' && drag.to.slot === j}
          <li>
            <button type="button" class="slot tile-btn mine" data-slot={j} data-filled={k !== EMPTY || undefined} data-next={j === nextSlot || undefined} data-over={over || undefined}
              data-shift={!!drag.lift && k !== EMPTY && k !== placed[j] && !over || undefined}
              aria-disabled={!open || k === EMPTY} aria-label={k === EMPTY ? t('kiki.tile.slot', { n: j + 1 }) : t('kiki.tile.remove', { w: board[k] })}
              data-sfx={open && k !== EMPTY ? 'tick' : 'none'} onclick={() => unplace(j)} onpointerdown={(e) => k !== EMPTY && press(e, { slot: j }, board[k])}>
              {#if k === EMPTY}<span class="num" aria-hidden="true">{j + 1}</span>{:else}{#key k}<span lang="en">{board[k]}</span>{/key}{/if}
            </button>
          </li>
        {:else}
          <li class="slot theirs" data-slot={j} aria-label={t('kiki.tile.partner', { n: j + 1 })}><span aria-hidden="true">{j + 1}</span></li>
        {/if}
      {/each}
    </ol>
  {/if}

  {#if v.phase === 'answer' && !v.out && !sent}
    <div class="pool" class:live={open} role="group" aria-label={t('kiki.tile.pool')} data-kiki-tile-pool>
      {#each board as w, k (k)}
        {@const used = shownA.includes(k) || (!!drag.from && 'tile' in drag.from && drag.from.tile === k)}
        <button type="button" class="tile tile-btn" data-tile={k} data-word={w} data-used={used || undefined} aria-disabled={!open || used}
          data-sfx={open && !used && !full ? 'choice-pick' : 'none'} onclick={() => place(k)} onpointerdown={(e) => !used && press(e, { tile: k }, w)}><span lang="en">{w}</span></button>
      {/each}
    </div>
    <div class="acts">
      <button type="button" class="btn small paper" data-kiki-tile-clear aria-disabled={!slots.some((j) => j !== given && placed[j] !== EMPTY)} data-sfx="back" onclick={clear}>{t('kiki.tile.clear')}</button>
    </div>
  {/if}

  {#if reveal && it.why}<Why text={it.why} />{/if}
{/snippet}

{#snippet action()}
  {#if v.phase === 'answer' && !v.out}
    <button type="button" class="btn" data-kiki-tile-done aria-disabled={!full || !!sent} data-sfx={full && !sent ? 'confirm' : 'none'} onclick={done}>{t('kiki.tile.done')}</button>
  {/if}
{/snippet}

<RoundFrame {v} now={game.now} me={game.me} type="tile" answered={!!sent} {verdict} {stage} {input} {action} top={shown} onnext={() => game.next()} onready={() => game.ready()} />
{#if drag.lift}
  {@const l = drag.lift}
  <!-- the lifted tile at the finger, raised over it (its containing block's origin read off `origin`) -->
  <span class="lift-origin" bind:this={originEl}></span>
  <span class="tile lift" class:back={l.back} aria-hidden="true" data-kiki-tile-lift
    style:width="{l.w}px" style:height="{l.h}px" style:transform="translate({l.x - l.dx - ox}px, {l.y - l.dy - oy - (l.back ? 0 : 12)}px) scale({l.back ? 1 : 1.08})"><span lang="en">{l.word}</span></span>
{/if}
{/if}

<style>
  .stage { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 4px 2px; }
  .speaker { position: relative; line-height: 0; transform-origin: 50% 100%; }
  .speaker.pop { animation: pop-in 420ms var(--ease-bounce) both; }
  .speaker.talk { animation: bob 520ms ease-in-out infinite alternate; }
  .react { position: absolute; right: -10px; top: -12px; width: 34px; height: 34px; animation: pop-in 320ms var(--ease-bounce) both; }
  .react :global(svg) { width: 100%; height: 100%; }
  .bubble {
    position: relative; min-height: 68px; display: grid; align-content: center; gap: 6px; padding: 12px 16px;
    border-radius: 28px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream);
  }
  .bubble::before { content: ''; position: absolute; left: -9px; top: 50%; width: 20px; height: 20px; margin-top: -10px; rotate: 45deg; background: var(--c-card); border-radius: 4px; }
  .notes { margin: 0; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .1em; }
  .en { margin: 0; font: 700 max(17px, var(--fs-talk))/1.4 var(--font-ui); position: relative; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--c-ink-soft); position: relative; word-break: normal; line-break: strict; }
  .meta { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 10px; position: relative; }
  .accent { padding: 3px 10px; border-radius: var(--r-pill); background: var(--c-mint); color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .ctx { grid-column: 1 / -1; margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hear { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; }
  .hint { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }

  /* the sentence: numbered slots that wrap at 393 px, each a 44 px target */
  .sentence { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .sentence li:not(.slot) { display: contents; }
  .slot {
    min-width: 52px; min-height: var(--hit); padding: 4px 10px; border-radius: 12px; display: inline-grid; place-items: center;
    font: 700 max(17px, var(--fs-body))/1.2 var(--font-ui);
  }
  .slot:not([data-filled]) { background: transparent; box-shadow: inset 0 0 0 2px var(--edge); }
  .slot[data-filled] { background: var(--ctl-sel); color: var(--c-ink); }
  /* the next tap's slot: a dashed yuzu outline; a drag's target: the solid yuzu ring; a tile that would shift slides in */
  .slot[data-next] { box-shadow: none; outline: 2px dashed var(--c-yuzu); outline-offset: -2px; }
  .slot[data-over] { box-shadow: 0 0 0 3px var(--c-yuzu); }
  .slot[data-shift] > span { animation: shift 150ms var(--ease) both; }
  .sentence[data-flash] .mine { animation: flash 500ms var(--ease) both; }
  .sentence[data-flash='2'] .mine { animation-name: flash2; }
  /* easy's given word: a static card (its soft lip only), a pin, not a control */
  .slot.given { background: var(--ctl-sel); color: var(--c-ink); box-shadow: 0 2px 0 var(--lip); position: relative; }
  .pin { position: absolute; top: -9px; right: -5px; font-size: 14px; line-height: 1; }
  .num { font: 700 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  /* the partner's slots: dashed and set back, never a target (mine are solid) */
  .slot.theirs { box-shadow: none; border: 2px dashed var(--edge); opacity: .55; color: var(--text-soft); font: 700 var(--fs-s)/1 var(--font-num); }
  .slot[data-mark] { display: inline-grid; gap: 2px; }
  .slot[data-mark='right'] { background: color-mix(in srgb, var(--c-leaf) 50%, var(--c-card)); color: var(--c-ink); }
  .slot[data-mark='wrong'] { background: color-mix(in srgb, var(--c-coral) 28%, var(--c-card)); color: var(--c-ink); }
  .put { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--coral-text); text-decoration-thickness: 2px; }

  /* the board's tiles: big targets that wrap; a placed one stays where it was, faded */
  .pool { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; padding-top: 4px; }
  .tile { min-height: 48px; min-width: 48px; padding: 6px 14px; border-radius: 14px; font: 700 max(17px, var(--fs-body))/1.2 var(--font-ui); }
  .tile[data-used] { opacity: .3; }
  /* while the answer window is open, a press on a tile or my slot is the drag's, not the sheet's scroll (the gaps still scroll) */
  .tile, .slot { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }
  .pool.live .tile, .sentence.live .mine { touch-action: none; }
  .lift {
    position: fixed; left: 0; top: 0; z-index: 30; pointer-events: none; display: inline-grid; place-items: center; box-sizing: border-box;
    background: var(--ctl); color: var(--text); transform-origin: 50% 50%; will-change: transform;
    box-shadow: inset 0 0 0 2px var(--edge), 0 8px 0 var(--lip), 0 14px 22px rgba(0, 0, 0, .18);
  }
  .lift.back { transition: transform 160ms var(--ease), box-shadow 160ms var(--ease); box-shadow: inset 0 0 0 2px var(--edge), 0 4px 0 var(--lip); }
  .lift-origin { position: fixed; left: 0; top: 0; width: 0; height: 0; pointer-events: none; }
  /* 全部戻す by the pool, at its start: apart from the foot's できた */
  .acts { display: flex; justify-content: flex-start; }

  .words { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--text); }
  .team-now { padding: 4px 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 30%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); }

  @keyframes bob { from { transform: translateY(0); } to { transform: translateY(-5px); } }
  @keyframes pop-in { from { transform: scale(.3); opacity: 0; } to { transform: none; opacity: 1; } }
  @keyframes shift { from { transform: translateX(-10px); opacity: .4; } to { transform: none; opacity: 1; } }
  @keyframes flash { 0%, 100% { box-shadow: inset 0 0 0 2px var(--edge); } 40% { box-shadow: 0 0 0 3px var(--c-yuzu); } }
  @keyframes flash2 { 0%, 100% { box-shadow: inset 0 0 0 2px var(--edge); } 40% { box-shadow: 0 0 0 3px var(--c-yuzu); } }
  @media (prefers-reduced-motion: reduce) { .speaker.pop, .speaker.talk, .react, .slot[data-shift] > span, .sentence[data-flash] .mine { animation: none; } .lift.back { transition: none; } }
</style>
