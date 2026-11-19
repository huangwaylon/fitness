<script lang="ts">
  // 英語すごろく's turn, the play screen's bottom sheet's body (docs/sugoroku.md "Rules"): by the phase, whose turn it is
  // and the dice (with a pocket letter to send), the fork's two ways, the space's ことば, ぶん, 絵, イベント or あがり;
  // another phone's turn online: whose it is and the last move, or, once its player's view comes (`watch`: view.ts),
  // their panel as their sheet shows it, read-only (inert) under 「Xが考え中…」. Every action one move (`onact`): the
  // same move folds the game on this phone (passed round) and on every phone (online). Online, my turn: the panel's
  // state as it changes (`onview`), for the others to watch.
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import WordTurn from './WordTurn.svelte';
  import SentenceTurn from './SentenceTurn.svelte';
  import PictureTurn from './PictureTurn.svelte';
  import EventTurn from './EventTurn.svelte';
  import { isQuiz } from '../quiz.ts';
  import { PICTURES } from '../pictures.ts';
  import { HOME_BONUS, LEVEL, rollMode, wordScore, type Game } from '../game.ts';
  import { toGoal, waysAt, type Board } from '../board.ts';
  import { pickSentence, type Line, type Sentence } from '../sentences.ts';
  import type { Words } from '../words.ts';
  import type { Move } from '../online.ts';
  import type { View } from '../view.ts';
  import { s } from '../i18n.ts';
  import { t } from '#lib/i18n/index.ts';

  type Act = Omit<Move, 'g' | 'i' | 'who'>;
  interface Props {
    g: Game;
    board: Board;
    /** It's this phone's to play (passed round always; online, whose turn it is). */
    myTurn: boolean;
    mode: 'local' | 'online';
    /** Online: the relay in. */
    connected: boolean;
    words: Words | null;
    lines: readonly Line[] | null;
    /** The words or lines didn't load. */
    failed: boolean;
    /** The speaking step after a 絵 (game.ts speakOn). */
    speakable: boolean;
    /** A letter just picked up on the way (this turn's walk). */
    pickNote: string;
    onact: (m: Act) => void;
    onspin: () => void;
    onretry: () => void;
    /** Online, my turn: the panel as it is now, for the others to watch. */
    onview?: (v: View) => void;
    /** Online, another's turn: their panel as their sheet shows it (shown read-only). */
    watch?: View | null;
  }
  let { g, board, myTurn, mode, connected, words, lines, failed, speakable, pickNote, onact: act, onspin, onretry, onview, watch = null }: Props = $props();
  /** (watching: nothing is this phone's to do) */
  const onact = (m: Act) => void (!watch && act(m));

  const cur = $derived(g.players[g.turn]);
  const ph = $derived(g.phase);

  /** A fork's two ways as its sign reads: the area's 近道 / 遠回り, its steps and what's on it (the rare kinds). */
  const ways = $derived(board.forks.includes(cur.pos) ? waysAt(board, cur.pos).map((w, i, all) => {
    const other = all[1 - i].steps, kind = w.steps < other ? 'short' : w.steps > other ? 'long' : 'even';
    const extra = (['double', 'picture', 'event', 'sentence'] as const).filter((k) => w.kinds[k]).sort((a, b) => (w.kinds[b] ?? 0) - (w.kinds[a] ?? 0)).slice(0, 2);
    return { title: s(`way.${kind}`, { a: s(`area.${w.area}`) }), note: [s('way.steps', { n: w.steps }), ...extra.map((k) => `${s(`kind.${k}`)}${w.kinds[k]}`)].join('・') };
  }) : null);
  /** The roll's one note, the most important: a letter sent, one picked up, then the dice's rule. */
  const spinNote = $derived.by(() => {
    if (cur.forced) return s('hasForced', { l: cur.forced.toUpperCase() });
    if (pickNote) return pickNote;
    const m = rollMode(g);
    return m === 'fast' ? s('twice') : m === 'slow' ? s('slowRoll') : '';
  });
  // the panels with no state of their own: the fork's, あがり
  $effect(() => void (onview && (ph.k === 'fork' || ph.k === 'home') && onview({ p: ph.k, v: null })));
  const mirrorOf = <P extends View['p']>(p: P) => (watch?.p === p ? (watch.v as Extract<View, { p: P }>['v']) : null);

  /** The line for this ぶん space: the seat's level's, none used twice (its pick kept in the phase; online.ts lineFor). */
  const line = $derived.by((): Sentence | null => {
    if (ph.k !== 'sentence' || !lines) return null;
    const used = new Set(g.made.filter((m) => m.kind === 'sentence').map((m) => m.text));
    return pickSentence(lines, cur.level, ph.r, used);
  });
  /** おくりもの: the pocket letter being sent, and who may get one (on the way, none waiting; whoever's furthest back first). */
  let giving = $state<string | null>(null);
  const takers = $derived(g.players.filter((p, i) => i !== g.turn && p.home === null && !p.forced)
    .sort((a, b) => toGoal(board, b.pos, b.ways) - toGoal(board, a.pos, a.ways)));
  $effect(() => void (g.turn, (giving = null)));
</script>

{#if watch}
  <!-- another's turn, as their sheet shows it: whose under 「Xが考え中…」, the panel below read-only -->
  <div class="who watching" data-sg-waiting>
    <Avatar person={cur.who} worn size={28} />
    <p class="note one">{connected ? s('thinkingOf', { name: cur.name }) : s('offlineNote')}</p>
  </div>
{/if}
{#if !myTurn && ph.k !== 'end' && !watch}
  <div class="who" data-sg-waiting>
    <Avatar person={cur.who} worn size={40} />
    <div class="txt">
      <p class="turnof">{s('turnOf', { name: cur.name })}</p>
      <p class="note one">{#if !connected}{s('offlineNote')}{:else if g.made.length}{@const m = g.made[g.made.length - 1]}{s('lastMove', { name: g.players[m.p].name, text: m.text, n: m.stars })}{:else}{s('thinking')}{/if}</p>
    </div>
  </div>
{:else}<div class="panel" inert={!!watch} data-sg-watch={watch?.p}>{#if ph.k === 'spin'}
  <div class="who">
    <Avatar person={cur.who} worn size={48} />
    <div class="txt">
      <p class="turnof">{s('turnOf', { name: cur.name })}</p>
      {#if mode === 'local'}<p class="note">{s('passTo', { name: cur.name })}</p>{/if}
    </div>
  </div>
  {#if spinNote}<p class="note one" data-sg-picked={spinNote === pickNote ? '' : undefined}>{spinNote}</p>{/if}
  {#if cur.pocket.length && takers.length}
    <!-- おくりもの: a pocket letter to someone (their next word uses it: +3 for the team) -->
    <div class="gift" data-sg-gift>
      {#if giving}
        <span class="note">{s('sendTo', { l: giving.toUpperCase() })}</span>
        {#each takers as tk (tk.who)}
          <button type="button" class="chip big" data-sfx="confirm" data-sg-give={tk.who}
            onclick={() => { const l = giving!; giving = null; onact({ a: 'gift', ch: l, to: tk.who }); }}>
            <Avatar person={tk.who} worn size={20} /> {tk.name}</button>
        {/each}
        <button type="button" class="chip big" data-sfx="back" onclick={() => (giving = null)}>{t('common.cancel')}</button>
      {:else}
        <span class="note">{s('sendLetter')}</span>
        {#each cur.pocket as l, j (j)}<button type="button" class="chip big" data-sfx="tick" data-sg-pocket={l} onclick={() => (giving = l)} lang="en">{l.toUpperCase()}</button>{/each}
      {/if}
    </div>
  {/if}
  <button type="button" class="btn" data-sfx="confirm" data-sg-spin onclick={onspin}>{s('spin')}</button>
{:else if ph.k === 'fork'}
  <div class="fork" data-sg-fork>
    <p class="ask">{s('forkAsk', { n: ph.left })}</p>
    <div class="ways">
      {#each [0, 1] as const as b (b)}
        <button type="button" class="way" data-sfx="confirm" data-sg-branch={b} onclick={() => onact({ a: 'fork', b })}>
          <b>{ways?.[b].title}</b><small>{ways?.[b].note}</small>
        </button>
      {/each}
    </div>
  </div>
{:else if ph.k === 'word'}
  {#if ph.rested}<p class="note one" data-sg-rested>{s('restedNote')}</p>{/if}
  {#if words}
    {#key `${g.n}`}
      <WordTurn rack={cur.rack} pocket={cur.pocket} forced={cur.forced} lucky={g.lucky} mult={ph.mult} minLen={LEVEL[cur.level].minLen} hintHalf={LEVEL[cur.level].hintHalf}
        hinted0={ph.hinted} onhint={() => onact({ a: 'try', h: 1 })} {words}
        score={(w, c, h) => wordScore(g, w, c, h)}
        onplay={(w, h) => onact({ a: 'word', w, ...(h ? { h: 1 } : {}) })}
        onswap={() => onact({ a: 'swap' })} mirror={mirrorOf('word')} onview={onview ? (v) => onview({ p: 'word', v }) : undefined} />
    {/key}
  {:else if failed}
    <p class="note">{s('offline')}</p><button type="button" class="btn" data-sfx="tick" onclick={onretry}>{s('retry')}</button>
  {:else}<p class="note">{s('loading')}</p>{/if}
{:else if ph.k === 'sentence'}
  {#if line}
    {#key line.en}<SentenceTurn {line} seed={g.seed} hideJa={cur.level === 3} misses0={ph.misses} peeked0={ph.peeked} ontry={(tr) => onact({ a: 'try', m: tr.misses, ...(tr.peeked ? { p: 1 } : {}) })} ondone={(o) => onact({ a: 'sent', m: o.misses, ...(o.unseen ? { u: 1 } : {}) })}
      mirror={mirrorOf('sentence')} onview={onview ? (v) => onview({ p: 'sentence', v }) : undefined} />{/key}
  {:else if failed || lines}
    <p class="note">{lines ? s('noLine') : s('offline')}</p>
    <button type="button" class="btn" data-sfx="tick" onclick={() => onact({ a: 'noline' })}>{s('next')}</button>
  {:else}<p class="note">{s('loading')}</p>{/if}
{:else if ph.k === 'picture'}
  {#key ph.item}<PictureTurn pic={PICTURES[ph.item]} level={cur.level} seed={g.seed} misses0={ph.misses} ontry={(tr) => onact({ a: 'try', m: tr.misses })} speak={speakable ? { tipKey: `${g.seed}:${g.turn}` } : null}
    ondone={(m, y = 0) => onact({ a: 'pic', m, ...(y ? { y: Math.min(y, 3) as 1 | 2 | 3 } : {}) })}
    mirror={mirrorOf('picture')} onview={onview ? (v) => onview({ p: 'picture', v }) : undefined} />{/key}
{:else if ph.k === 'event'}
  {#key `${g.n}`}<EventTurn card={ph.card} level={cur.level} seed={`${g.seed}:${g.n}`} quiz={isQuiz(g.rules, ph.card)} misses0={ph.misses}
    ontry={(m) => onact({ a: 'try', m })} ondone={(m) => onact({ a: 'ev', ...(m ? { m } : {}) })}
    mirror={mirrorOf('event')} onview={onview ? (v) => onview({ p: 'event', v }) : undefined} />{/key}
{:else if ph.k === 'home'}
  <div class="event" data-sg-home>
    <span class="tagrow"><Avatar person={cur.who} worn size={32} /><span class="tag">{s('homeTitle')}</span></span>
    <p class="ja big">{s('homeTeam', { b: HOME_BONUS })}</p>
    <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => onact({ a: 'home' })}>{s('next')}</button>
  </div>
{/if}</div>{/if}

<style>
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .one { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .who { display: flex; align-items: center; gap: 12px; }
  .watching { gap: 8px; }
  /* (the panel's rows stay the sheet's own: the wrapper lays out nothing) */
  .panel { display: contents; }
  .panel > :global(*) { flex-shrink: 0; }
  .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .turnof { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .gift { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
  .gift .chip { gap: 6px; }
  .fork { display: flex; flex-direction: column; gap: 8px; }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .ways { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .way { display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center; min-height: 72px; padding: 8px 6px; margin: 0 0 3px; appearance: none; border: 0; cursor: pointer;
    border-radius: var(--r-card); background: var(--c-card); box-shadow: var(--sh-ctl); color: var(--c-ink); font: 700 var(--fs-body)/1.2 var(--font-ui); -webkit-tap-highlight-color: transparent; }
  .way:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .way:first-child { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-card)); }
  .way:last-child { background: color-mix(in srgb, var(--c-lilac) 45%, var(--c-card)); }
  .way small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .event { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .tagrow { display: flex; align-items: center; gap: 6px; height: 32px; align-self: flex-start; }
  .event .ja.big { font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--c-ink); }
</style>
