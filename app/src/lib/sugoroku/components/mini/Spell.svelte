<script lang="ts">
  // ★2 伝えて当てて (mini/spell.ts), a round each: the 伝える人 sees a picture and its Japanese and spells its English (the
  // 絵 turn's help by their level: やさしい one of three spellings, ふつう the letters with the first given, むずかしい two
  // more mixed in); right, it's played (the word, once whole); not, 「おしい！」 and the tiles back (nothing sent). The
  // 当てる人 see their grid and the word growing (online: the speller's `mini` frames, `sp<round>.<letters>`; whole once
  // it's in) and tap the picture: right first 2, after 「おしい！」 1, a second miss shows it. Online, the round's step
  // moves on by its timer (ROUND_MS from when this phone saw it, the seats one after another: the first in counts).
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import Nudge from '../Nudge.svelte';
  import { seeded } from '#lib/random.ts';
  import { PICTURES, choicesFor, lettersFor, pictureSrc } from '../../pictures.ts';
  import { spellWord, type SpellState } from '../../mini/spell.ts';
  import { stagePlay } from '../../mini/hands.ts';
  import type { Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';

  interface Props {
    s: SpellState; seat: Who | null; live: boolean; mode: 'local' | 'online'; nameOf: (w: Who) => string; play: (p: Play, who?: Who) => void;
    views: Partial<Record<Who, string>>; onview?: (v: string) => void;
    /** My seat's place at the table (online: the step's timer, one after another). */
    seatIdx: number;
    roundMs: number;
  }
  let { s, seat, live, mode, nameOf, play, views, onview, seatIdx, roundMs }: Props = $props();

  const round = $derived(s.rounds[s.r] ?? null);
  /** Pictures that didn't load: a finder's cell shows the thing's Japanese instead (never the English). */
  let broken = $state<number[]>([]);
  const pic = $derived(round ? PICTURES[round.item] : null);
  const role = $derived(!round || !seat ? 'watch' : round.giver === seat ? 'giver' : round.grids[seat] ? 'picker' : 'watch');
  const level = $derived(s.seats.find((x) => x.who === seat)?.level ?? 2);
  const key = $derived(`${s.r}:${s.stage}`);

  // ---- the speller: the 絵 turn's help
  const choices = $derived(pic && role === 'giver' && level === 1 ? choicesFor(pic, seeded(`${key}:c`)) : []);
  const tiles = $derived(pic && role === 'giver' && level > 1 ? lettersFor(pic, level, seeded(`${key}:l`)).map((l, id) => ({ id, l })) : []);
  const given = $derived(level === 2 ? (tiles.find((t) => t.l === pic?.w[0])?.id ?? -1) : -1);
  let placed = $state<number[]>([]);
  let tried = $state<number[]>([]);
  let oops = $state(false);
  let oopsTimer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(oopsTimer));
  // (each round its own: the first letter placed for ふつう)
  $effect(() => {
    void key;
    placed = given >= 0 ? [given] : [];
    tried = [];
    missed = [];
  });
  const spelt = $derived(placed.map((id) => tiles[id]?.l ?? '').join(''));
  const nudge = () => (clearTimeout(oopsTimer), (oops = true), (oopsTimer = setTimeout(() => (oops = false), 900)));
  function put(id: number) {
    if (!live || !pic || placed.includes(id) || s.gave || s.shown) return;
    placed = [...placed, id];
    const w = placed.map((x) => tiles[x].l).join('');
    if (w.length < pic.w.length) return;
    if (w === pic.w) play({ w }, seat ?? undefined);
    else (nudge(), (placed = given >= 0 ? [given] : []));
  }
  function choose(k: number) {
    if (!live || !pic || s.gave || s.shown) return;
    if (choices[k] === pic.w) play({ w: pic.w }, seat ?? undefined);
    else (nudge(), (tried = [...tried, k]));
  }
  // the speller's letters as they go, for the finders (online)
  $effect(() => void (onview && role === 'giver' && onview(`sp${s.r}.${s.gave ? '' : spelt}`)));

  // ---- the finders: the word as it grows, the grid
  const grid = $derived(round && seat ? (round.grids[seat] ?? []) : []);
  const mine = $derived(seat ? s.picks[seat] : undefined);
  let missed = $state<number[]>([]);
  const shownWord = $derived(spellWord(s));
  /** The speller's letters so far (online, from their frame), the rest blanks. */
  const growing = $derived.by(() => {
    if (!pic || !round) return '';
    if (shownWord) return shownWord;
    const f = views[round.giver] ?? '', m = /^sp(\d+)\.([a-z]*)$/.exec(f);
    const typed = m && Number(m[1]) === s.r ? m[2] : '';
    return [...pic.w].map((_, i) => typed[i] ?? '_').join(' ');
  });
  function pickAt(k: number) {
    if (!live || !seat || mine?.got !== undefined || missed.includes(k)) return;
    if (grid[k] !== round?.item) missed = [...missed, k];
    play({ k }, seat);
  }

  // ---- online: the step's timer (the word shown, then the round's end), the seats one after another
  $effect(() => {
    if (mode !== 'online' || !seat || !live || !round) return;
    const stage = s.stage, wait = roundMs + seatIdx * 1500;
    void s.gave;
    const id = setTimeout(() => play(stagePlay(stage)), wait);
    return () => clearTimeout(id);
  });
</script>

<div class="sp" data-sg-spell={s.r} data-sg-spell-role={role}>
  {#if round && pic}
    <div class="head">
      <span class="tag" data-sg-spell-round>{tr('spRound', { n: s.r + 1, of: s.rounds.length })}</span>
      {#if role !== 'watch'}<span class="tag rolet" class:give={role === 'giver'}>{role === 'giver' ? tr('spGiver') : tr('spPicker')}</span>{/if}
    </div>
    {#if oops}<Nudge text={tr('nudge')} />{/if}
    {#if role === 'giver'}
      <div class="pic" data-sg-spell-item={pic.w}>
        {#if !broken.includes(round.item)}<img src={pictureSrc(pic)} alt="" width="56" height="56" referrerpolicy="no-referrer" onerror={() => (broken = [...broken, round.item])} />{/if}
        <div><h3 class="ja">{pic.ja}</h3>{#if !s.gave && !s.shown}<p class="note"><Phrases text={tr('spSpell')} /></p>{/if}</div>
      </div>
      {#if s.gave || s.shown}
        <p class="big" lang="en" data-sg-answer>{pic.w}</p>
        <p class="note centre"><Phrases text={s.gave ? `${tr('spNice')} ${tr('spPicking')}` : tr('spPicking')} /></p>
      {:else if level === 1}
        <div class="choices" lang="en">
          {#each choices as c, k (c)}<button type="button" class="sg-wt" disabled={tried.includes(k)} data-sfx="tick" data-sg-choice={c} onclick={() => choose(k)}>{c}</button>{/each}
        </div>
      {:else}
        <div class="slots sg-strip" class:miss={oops} lang="en" data-sg-spelt={spelt}>
          {#each placed as id, k (id)}<button type="button" class="sg-tile in" data-sfx="tick" onclick={() => k > (given >= 0 ? 0 : -1) && (placed = placed.slice(0, k))}>{tiles[id].l.toUpperCase()}</button>{/each}
        </div>
        <div class="rack" lang="en">
          {#each tiles.filter((t) => t.id !== given) as t (t.id)}
            <button type="button" class="sg-tile" disabled={placed.includes(t.id) || !live} data-sfx="tick" data-sg-letter={t.l} onclick={() => put(t.id)}>{t.l.toUpperCase()}</button>
          {/each}
        </div>
      {/if}
    {:else}
      <p class="big" lang="en" class:whole={!!shownWord} data-sg-spell-word={shownWord ?? ''}>{growing}</p>
      {#if role === 'picker' && mine?.got === undefined}
        <p class="note centre"><Phrases text={shownWord ? tr('spPick') : tr('spSpelling', { name: nameOf(round.giver) })} /></p>
        <div class="grid" class:six={grid.length > 4}>
          {#each grid as item, k (k)}
            <button type="button" class="cell press" disabled={missed.includes(k) || !live} data-sfx="tick" data-sg-cell={PICTURES[item].w} onclick={() => pickAt(k)}>
              {#if broken.includes(item)}<span class="cja">{PICTURES[item].ja}</span>
              {:else}<img src={pictureSrc(PICTURES[item])} alt="" width="48" height="48" referrerpolicy="no-referrer" onerror={() => (broken = [...broken, item])} />{/if}
            </button>
          {/each}
        </div>
      {:else if role === 'picker' && mine}
        <div class="got" data-sg-spell-got={mine.got}>
          {#if !broken.includes(round.item)}<img src={pictureSrc(pic)} alt="" width="48" height="48" referrerpolicy="no-referrer" />{/if}
          <div><b>{mine.got ? tr('spNice') : tr('answer')}</b><p class="note"><Phrases text={pic.ja} /></p></div>
          {#if mine.got}<span class="pts">+{mine.got}</span>{/if}
        </div>
        <p class="note centre"><Phrases text={tr('miniWait')} /></p>
      {:else}
        <p class="note centre"><Phrases text={tr('spSpelling', { name: nameOf(round.giver) })} /></p>
      {/if}
    {/if}
  {/if}
</div>

<style>
  .sp { display: flex; flex-direction: column; gap: 8px; }
  .sp > :global(*) { flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 6px; }
  .rolet { background: color-mix(in srgb, var(--c-sky) 35%, var(--c-cream)); color: var(--c-ink); }
  .rolet.give { background: color-mix(in srgb, var(--c-rose) 40%, var(--c-cream)); }
  .pic { display: flex; align-items: center; gap: 10px; }
  .pic img, .got img { flex: none; object-fit: contain; filter: drop-shadow(0 2px 0 rgb(0 0 0 / .12)); }
  .ja { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .centre { text-align: center; }
  .big { margin: 0; text-align: center; font: 600 26px/1.2 var(--font-num); letter-spacing: .06em; color: var(--c-ink); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .big.whole { letter-spacing: .04em; }
  .choices, .rack, .slots { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
  .choices { gap: 6px; }
  .choices .sg-wt { padding: 0 16px; font-size: 20px; }
  .slots { padding: 4px 8px; gap: 3px; align-content: center; }
  .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .grid.six { grid-template-columns: repeat(3, 1fr); }
  .cell { display: grid; place-items: center; min-height: 72px; margin: 0 0 3px; padding: 0; appearance: none; border: 0; cursor: pointer; border-radius: var(--r-card);
    background: var(--c-card); box-shadow: var(--sh-ctl); -webkit-tap-highlight-color: transparent; }
  .cell:disabled { opacity: .3; }
  .cja { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink); padding: 0 6px; }
  .got { display: flex; align-items: center; gap: 10px; justify-content: center; }
  .got b { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--c-ink); }
  .pts { font: 600 22px/1 var(--font-num); color: var(--c-ink); }
</style>
