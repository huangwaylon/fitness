<script lang="ts">
  // A round of 音の へんしん (docs/kikimimi.md "音の へんしん"; games/henshin/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte). The speaker pops in and the natural take plays (the situation, `ctx`, under the bubble);
  // then the line with its changed words blanked, and either 「なんて 言った？」's three full forms (one final tap), or
  // 「書きとり」: the missing words typed (matched forgivingly: match.ts) or tiles (this phone's choice, kept) tapped or
  // dragged as ことば タイル's (tile/drag.svelte.ts, tile/drop.ts), 「できた」 (the foot's: RoundFrame `action`) sends it;
  // time up sends what's typed or placed. 🔁 as often as wanted (a replay: "hard" for review, never points). The reveal: ○ / ×, the line as said with
  // its sound mark over the changed words, the full form beside the spelling as said (「didja」＝ did you), the Japanese,
  // the trap's note, my words, and 聞きくらべ: the phrase はっきり (the careful take), ふつう and 速く.
  import Note from '../frame/Note.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { splitFocus } from '#lib/kikimimi/bank.ts';
  import { EMPTY } from '#lib/kikimimi/games/listened.ts';
  import { henshinOk, slotOk, typedAnswer, type HenshinCard } from '#lib/kikimimi/games/henshin/def.ts';
  import { matchTyped } from '#lib/kikimimi/games/henshin/match.ts';
  import { rawOf } from '#lib/kikimimi/games/listened.ts';
  import { RIGHT, firstListen } from '#lib/kikimimi/score.ts';
  import { TAKES, keepTiles, roundFor, takeOf, tilesOn } from './round.ts';
  import { isCoop } from '../listenView.ts';
  import { dropOn } from '../tile/drop.ts';
  import { TileDrag } from '../tile/drag.svelte.ts';
  import Lift from '../tile/Lift.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import ChoiceGrid from '../frame/ChoiceGrid.svelte';
  import ClipBar from '../scene/ClipBar.svelte';
  import SoundLine from '../scene/SoundLine.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import Mark from '../../ui/Mark.svelte';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const it = $derived(game.items[v.i] as HenshinCard | undefined);
  const r = $derived(it ? roundFor(v, it) : null);
  const reveal = $derived(v.phase === 'reveal');
  const sent = $derived(v.answers[v.i] ?? null);
  const answer = $derived(rawOf(sent));
  const open = $derived(v.phase === 'answer' && !sent && !v.out);
  const shown = $derived(v.phase === 'answer' || reveal);
  const parts = $derived(it ? splitFocus(it) : null);
  const key = $derived(`${v.g}:${v.i}`);

  // ---- 書きとり: typed, or tiles ----
  let tiles = $state(tilesOn());
  const words = $derived(r?.kind === 'henshin.type' ? r.words : []);
  const board = $derived(r?.kind === 'henshin.type' ? r.board : []);
  /** What I've typed and placed this round (kept by the round), and what I typed once sent (the reveal's). */
  let text = $state<{ key: string; s: string }>({ key: '', s: '' });
  let work = $state<{ key: string; a: number[] } | null>(null);
  const typed = $derived(text.key === key ? text.s : '');
  const placed = $derived<readonly number[]>(Array.isArray(answer) ? answer : work?.key === key ? work.a : words.map(() => EMPTY));
  const full = $derived(placed.length > 0 && placed.every((x) => x !== EMPTY));
  const canSend = $derived(open && (tiles ? full : typed.trim().length > 0));
  function edit(f: (a: number[]) => void) {
    const a = [...placed];
    f(a);
    work = { key, a };
  }
  function place(k: number) {
    const j = placed.indexOf(EMPTY);
    if (open && !placed.includes(k) && j >= 0) edit((a) => (a[j] = k));
  }
  const unplace = (j: number) => open && placed[j] !== EMPTY && edit((a) => (a[j] = EMPTY));
  const clear = () => open && edit((a) => a.fill(EMPTY));
  function send() {
    if (!canSend || r?.kind !== 'henshin.type') return;
    game.answer(tiles ? [...placed] : typedAnswer(r, matchTyped(typed, r.words)));
  }
  function swap() {
    tiles = !tiles;
    keepTiles(tiles);
  }

  let sentenceEl = $state<HTMLElement | null>(null);
  const mine = $derived(words.map((_, j) => j));
  const drag = new TileDrag({
    sentence: () => sentenceEl,
    mine: () => mine,
    drop: (from, to) => {
      const a = open ? dropOn(placed, mine, from, to) : null;
      if (a) work = { key, a };
      return !!a;
    }
  });
  $effect(() => {
    if (!open || !tiles) drag.cancel();
  });
  const shownA = $derived(drag.shown(placed));
  /** The slot a tap fills next (its dashed outline). */
  const nextSlot = $derived(open && !drag.lift ? shownA.indexOf(EMPTY) : -1);
  // Time up: what's typed or placed is sent just before the window ends (graded as any answer), so the reveal shows it.
  const EARLY_MS = 300;
  $effect(() => {
    const rt = r;
    if (!open || !Number.isFinite(v.limit) || rt?.kind !== 'henshin.type') return;
    const k = key;
    const h = setTimeout(() => {
      if (key !== k || !open || (tiles ? !placed.some((x) => x !== EMPTY) : !typed.trim())) return;
      drag.cancel();
      game.answer(tiles ? [...placed] : typedAnswer(rt, matchTyped(typed, rt.words)));
    }, Math.max(0, v.limit - game.clock() - EARLY_MS));
    return () => clearTimeout(h);
  });

  const right = $derived(!!r && answer !== null && henshinOk(r, answer));
  const verdict = $derived(v.out ? 'out' : right ? 'right' : sent ? 'wrong' : 'none');
  /** A pick's Japanese, aligned to the round's choices (the deal's order). */
  const cja = $derived(r?.kind === 'henshin.pick' && it?.cja ? r.choices.map((c) => it.cja![it.choices.indexOf(c)] ?? '') : undefined);

  const canHear = $derived(v.speaks && !v.out && (v.phase === 'answer' || reveal));
  const bar = $derived.by(() => {
    const s = game.sounding;
    if (s && s.i === v.i) return { from: s.from, until: s.until, key: `r${s.from}` };
    if (s && s.i === -1 && reveal) return { from: s.from, until: s.until, key: `t${s.from}` };
    if (v.phase === 'play') return { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` };
    return null;
  });
  const playFrom = $derived(game.sounding && game.sounding.at === it?.id ? game.sounding.from : null);
  const clock = () => game.clock();
</script>

{#if it && r}
{#snippet stage()}
  <div class="stage">
    <span class="speaker" class:pop={v.phase === 'lead'} class:talk={!!bar}>
      <OfficialArt key={villagerArt(it.speaker, true)} alt={name(it.speaker)} size={reveal ? 56 : 68} eager />
      {#if reveal && !v.out}<span class="react" aria-hidden="true"><Mark id={right ? 'sparkle' : 'sweat'} /></span>{/if}
    </span>
    <div class="bubble obj-cream" class:open={reveal} aria-live="polite">
      {#if reveal}
        <p class="en" data-kiki-en><SoundLine en={it.en} marks={it.marks} clip={it.id} from={playFrom} {clock} /></p>
        {#if it.hs}<p class="form" data-kiki-henshin-form><span lang="en">{t('kiki.henshin.form', { red: it.hs.red, full: it.hs.full ?? it.focus ?? '' })}</span></p>{/if}
        <p class="ja">{it.ja}</p>
        {#if it.note}<Note text={it.note} />{/if}
      {:else}
        <p class="notes"><span aria-hidden="true">♪…</span><span class="sr-only">{t('kiki.listen')}</span></p>
        <ClipBar {bar} now={game.now} height={8} />
      {/if}
    </div>
    {#if it.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
    {#if (v.speaks || game.listenOnly) && !v.out}
      <div class="hear">
        {#if reveal && v.speaks}
          <span class="compare" data-kiki-henshin-compare>{t('kiki.henshin.compare')}</span>
          {#each TAKES as [take, suffix] (take)}
            <button type="button" class="btn small paper" data-kiki-take={take} data-sfx="tick" onclick={() => game.hear(takeOf(it, suffix))}>{t(`kiki.henshin.${take}`)}</button>
          {/each}
        {:else}
          <button type="button" class="btn small paper" data-kiki-replay aria-disabled={!canHear} data-sfx="tick" onclick={() => canHear && game.replay(false)}>🔁 {t('kiki.replay')}</button>
        {/if}
        {#if game.listenOnly}<small class="hint" data-kiki-host-plays>{t('kiki.replayHost')}</small>{/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} {right} picked={!!sent} pts={RIGHT} badge={firstListen(right, !!sent?.rp, v.same)} coop={isCoop(v)} rightNow={v.rightNow} />
  {:else if !shown}
    <p class="ask" data-kiki-henshin-wait>{t('kiki.henshin.wait')}</p>
  {:else if !v.out}
    <p class="ask">{r.kind === 'henshin.pick' ? t('kiki.henshin.askPick') : t('kiki.henshin.askType', { n: words.length })}</p>
  {/if}

  {#if shown && !v.out && parts && !reveal}
    <p class="line" lang="en" data-kiki-henshin-line>{parts[0]}<span class="blank"><span aria-hidden="true">{'＿'.repeat(r.kind === 'henshin.type' ? Math.min(6, words.length * 2) : 3)}</span><span class="sr-only">{t('kiki.blank')}</span></span>{parts[2]}</p>
  {/if}

  {#if r.kind === 'henshin.pick'}
    {#if shown && !v.out}
      <ChoiceGrid choices={r.choices} right={r.answer} ja={cja} {open} {reveal} dim={false} picked={typeof answer === 'number' ? answer : null} onpick={(k) => game.answer(k)} />
    {/if}
  {:else if shown && !v.out}
    {#if reveal}
      <!-- each missing word: ○, or × with what I put there; what I typed -->
      <ol class="sentence" data-kiki-henshin-words>
        {#each words as w, j (j)}
          {@const ok = Array.isArray(answer) && slotOk(r, answer, j)}
          <li class="slot obj-cream" data-slot={j} data-mark={ok ? 'right' : 'wrong'}><span lang="en">{w}</span></li>
        {/each}
      </ol>
      {#if typed}<p class="typed" data-kiki-henshin-typed>{t('kiki.henshin.typed', { w: typed })}</p>{/if}
    {:else if tiles}
      <ol class="sentence" class:live={open} aria-label={t('kiki.henshin.input')} data-kiki-henshin-slots bind:this={sentenceEl}>
        {#each words as _, j (j)}
          {@const k = shownA[j]}
          {@const over = !!drag.to && drag.to !== 'back' && drag.to.slot === j}
          <li>
            <button type="button" class="slot tile-btn mine" style:width={drag.width(j)} data-slot={j} data-filled={k !== EMPTY || undefined} data-next={j === nextSlot || undefined} data-over={over || undefined}
              data-shift={!!drag.lift && k !== EMPTY && k !== placed[j] && !over || undefined} aria-disabled={!open || k === EMPTY}
              aria-label={k === EMPTY ? t('kiki.henshin.slot', { n: j + 1 }) : t('kiki.henshin.remove', { w: board[k] })} data-sfx={open && k !== EMPTY ? 'tick' : 'none'}
              onclick={() => unplace(j)} onpointerdown={(e) => k !== EMPTY && drag.press(open, e, { slot: j }, board[k])}>
              {#if k === EMPTY}<span class="num" aria-hidden="true">{j + 1}</span>{:else}{#key k}<span lang="en" style:font-size={drag.fit(j, k)}>{board[k]}</span>{/key}{/if}
            </button>
          </li>
        {/each}
      </ol>
      {#if !sent}
        <div class="pool" class:live={open} role="group" aria-label={t('kiki.henshin.pool')} data-kiki-henshin-pool>
          {#each board as w, k (k)}
            {@const used = shownA.includes(k) || (!!drag.from && 'tile' in drag.from && drag.from.tile === k)}
            <button type="button" class="tile tile-btn" data-tile={k} data-word={w} data-used={used || undefined} aria-disabled={!open || used}
              data-sfx={open && !used && !full ? 'choice-pick' : 'none'} onclick={() => place(k)} onpointerdown={(e) => !used && drag.press(open, e, { tile: k }, w)}><span lang="en">{w}</span></button>
          {/each}
        </div>
      {/if}
    {:else}
      <label class="type">
        <span class="sr-only">{t('kiki.henshin.input')}</span>
        <input type="text" lang="en" inputmode="text" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" data-kiki-henshin-input data-sfx="none"
          placeholder={t('kiki.henshin.placeholder')} value={typed} disabled={!open} oninput={(e) => (text = { key, s: e.currentTarget.value })}
          onkeydown={(e) => e.key === 'Enter' && send()} />
      </label>
    {/if}
    {#if !sent && !reveal}
      <div class="acts">
        <button type="button" class="btn small paper" data-kiki-henshin-swap data-sfx="tick" onclick={swap}>{tiles ? t('kiki.henshin.useKeys') : t('kiki.henshin.useTiles')}</button>
        {#if tiles}<button type="button" class="btn small paper" data-kiki-henshin-clear aria-disabled={!placed.some((x) => x !== EMPTY)} data-sfx="back" onclick={clear}>{t('kiki.henshin.clear')}</button>{/if}
      </div>
    {/if}
  {/if}
{/snippet}

{#snippet action()}
  {#if r.kind !== 'henshin.pick' && shown && !v.out && !sent && !reveal}
    <button type="button" class="btn" data-kiki-henshin-done aria-disabled={!canSend} data-sfx={canSend ? 'confirm' : 'none'} onclick={send}>{t('kiki.henshin.done')}</button>
  {/if}
{/snippet}

<RoundFrame {game} {v} now={game.now} me={game.me} type={r.kind === 'henshin.pick' ? 'word' : 'tile'} answered={!!sent} {verdict} {stage} {input} {action} onnext={() => game.next()} onready={() => game.ready()} />
{#if drag.lift}<Lift l={drag.lift} />{/if}
{/if}

<style>
  .stage { display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 12px; padding: 4px 2px; }
  .speaker { position: relative; line-height: 0; transform-origin: 50% 100%; }
  .speaker.pop { animation: if-pop-in 420ms var(--ease-bounce) both; }
  .speaker.talk { animation: if-speak 520ms ease-in-out infinite alternate; }
  .react { position: absolute; right: -10px; top: -12px; width: 34px; height: 34px; animation: if-pop-in 320ms var(--ease-bounce) both; }
  .react :global(svg) { width: 100%; height: 100%; }
  .bubble {
    position: relative; min-height: 68px; display: grid; align-content: center; gap: 6px; padding: 12px 16px;
    border-radius: 28px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream);
  }
  .bubble::before { content: ''; position: absolute; left: -9px; top: 50%; width: 20px; height: 20px; margin-top: -10px; rotate: 45deg; background: var(--c-card); border-radius: 4px; }
  .notes { margin: 0; font: 700 var(--fs-title)/1 var(--font-ui); color: var(--c-ink-soft); letter-spacing: .1em; }
  .en { margin: 0; font: 700 max(17px, var(--fs-talk))/1.4 var(--font-ui); position: relative; }
  .form { margin: 0; justify-self: start; padding: 3px 10px; border-radius: var(--r-pill); background: var(--c-mint); color: var(--c-ink); font: 700 max(15px, var(--fs-body))/1.3 var(--font-ui); position: relative; }
  .ja { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--c-ink-soft); position: relative; word-break: normal; line-break: strict; }
  .ctx { grid-column: 1 / -1; margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hear { grid-column: 1 / -1; display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; }
  .compare { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .hint { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .line { margin: 0; text-align: center; font: 700 max(17px, var(--fs-body))/1.6 var(--font-ui); }
  .blank { display: inline-block; margin: 0 4px; color: var(--text-soft); letter-spacing: .05em; }

  .sentence { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .sentence li:not(.slot) { display: contents; }
  .slot {
    box-sizing: border-box; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    min-width: 52px; min-height: var(--hit); padding: 4px 10px; border-radius: 12px; display: inline-grid; place-items: center;
    font: 700 max(17px, var(--fs-body))/1.2 var(--font-ui);
  }
  .slot:not([data-filled]):not([data-mark]) { background: transparent; box-shadow: inset 0 0 0 2px var(--edge); }
  .slot[data-filled] { background: var(--ctl-sel); color: var(--c-ink); }
  .slot[data-mark='right'] { background: color-mix(in srgb, var(--c-leaf) 50%, var(--c-card)); color: var(--c-ink); }
  .slot[data-mark='wrong'] { background: color-mix(in srgb, var(--c-coral) 28%, var(--c-card)); color: var(--c-ink); }
  /* the next tap's slot: a dashed yuzu outline; a drag's target: the solid yuzu ring; a tile that would shift slides in
     (ことば タイル's) */
  .slot[data-next] { box-shadow: none; outline: 2px dashed var(--c-yuzu); outline-offset: -2px; }
  .slot[data-over] { box-shadow: 0 0 0 3px var(--c-yuzu); }
  .slot[data-shift] > span { animation: shift 150ms var(--ease-soft) both; }
  /* an empty slot's place: a small circled number, never read as a word */
  .num { display: inline-grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 1.5px currentColor; font: 700 13px/1 var(--font-num); color: var(--text-soft); }
  .typed { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }

  .pool { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px; padding-top: 4px; }
  .tile { min-height: 48px; min-width: 48px; padding: 6px 14px; border-radius: 14px; font: 700 max(17px, var(--fs-body))/1.2 var(--font-ui); }
  .tile[data-used] { opacity: .3; }
  /* while the answer window is open, a press on a tile or my slot is the drag's, not the sheet's scroll */
  .tile, .slot { -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; touch-action: manipulation; }
  .pool.live .tile, .sentence.live .mine { touch-action: none; }
  .type { display: block; }
  .type input {
    width: 100%; box-sizing: border-box; min-height: 48px; padding: 8px 14px; border: 0; border-radius: 14px; background: var(--card);
    box-shadow: inset 0 0 0 2px var(--edge); color: var(--text); font: 700 max(17px, var(--fs-body))/1.3 var(--font-ui);
  }
  .acts { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; }
  .acts .btn { flex: 0 1 auto; min-width: 6em; }

  @keyframes shift { from { transform: translateX(-10px); opacity: .4; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .speaker.pop, .speaker.talk, .react, .slot[data-shift] > span { animation: none; } }
</style>
