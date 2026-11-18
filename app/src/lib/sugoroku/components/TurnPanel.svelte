<script lang="ts">
  // 英語すごろく's turn, the play screen's bottom sheet's body (docs/sugoroku.md "Rules"): by the phase, whose turn it is
  // and the dice (with a pocket letter to send), the fork's two ways, the space's ことば, ぶん, 絵, イベント or あがり;
  // another phone's turn online: whose it is and the last move. Every action one move (`onact`): the same move folds
  // the game on this phone (passed round) and on every phone (online).
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import WordTurn from './WordTurn.svelte';
  import SentenceTurn from './SentenceTurn.svelte';
  import PictureTurn from './PictureTurn.svelte';
  import { PICTURES } from '../pictures.ts';
  import { CARDS } from '../cards.ts';
  import { HOME_BONUS, LEVEL, rollMode, wordScore, type Game, type Player } from '../game.ts';
  import { toGoal, waysAt, type Board } from '../board.ts';
  import { pickSentence, type Line, type Sentence } from '../sentences.ts';
  import type { Words } from '../words.ts';
  import type { Move } from '../online.ts';
  import { s } from '../i18n.ts';

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
  }
  let { g, board, myTurn, mode, connected, words, lines, failed, speakable, pickNote, onact, onspin, onretry }: Props = $props();

  const cur = $derived(g.players[g.turn]);
  const ph = $derived(g.phase);
  const headOf = (x: { who: Player['who'] }) => ({ person: x.who, worn: true });

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
  /** むずかしい's event cards: the Japanese on a tap. */
  let cardJa = $state(false);
  $effect(() => void (ph.k === 'event' && (cardJa = false)));

  /** The line for this ぶん space: the seat's level's, none used twice (its pick kept in the phase; online.ts lineFor). */
  const line = $derived.by((): Sentence | null => {
    if (ph.k !== 'sentence' || !lines) return null;
    const used = new Set(g.made.filter((m) => m.kind === 'sentence').map((m) => m.text));
    return pickSentence(lines, cur.level, ph.r, used);
  });
  const card = $derived(ph.k === 'event' ? CARDS[ph.card] : null);
  /** おくりもの: the pocket letter being sent, and who may get one (on the way, none waiting; whoever's furthest back first). */
  let giving = $state<string | null>(null);
  const takers = $derived(g.players.filter((p, i) => i !== g.turn && p.home === null && !p.forced)
    .sort((a, b) => toGoal(board, b.pos, b.ways) - toGoal(board, a.pos, a.ways)));
  $effect(() => void (g.turn, (giving = null)));
  /** A card's effect as its chip says it. */
  function effectOf(c: (typeof CARDS)[number]): string {
    if (c.stars) return s('effStars', { n: c.stars });
    if (c.gift) return s('effGift', { n: c.gift });
    if (c.move) return s('effMove', { n: c.move });
    if (c.again) return s('effAgain');
    return '';
  }
  const cardParts = (en: string) => en.split(/\*([^*]+)\*/g).map((t, i) => ({ t, key: i % 2 === 1 }));
</script>

{#if !myTurn && ph.k !== 'end'}
  <div class="who" data-sg-waiting>
    <Avatar {...headOf(cur)} size={40} />
    <div class="txt">
      <p class="turnof">{s('turnOf', { name: cur.name })}</p>
      <p class="note one">{#if !connected}{s('offlineNote')}{:else if g.made.length}{@const m = g.made[g.made.length - 1]}{s('lastMove', { name: g.players[m.p].name, text: m.text, n: m.stars })}{:else}{s('thinking')}{/if}</p>
    </div>
  </div>
{:else if ph.k === 'spin'}
  <div class="who">
    <Avatar {...headOf(cur)} size={48} />
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
          <button type="button" class="sg-chip" data-sfx="confirm" data-sg-give={tk.who}
            onclick={() => { const l = giving!; giving = null; onact({ a: 'gift', ch: l, to: tk.who }); }}>
            <Avatar person={tk.who} worn size={20} /> {tk.name}</button>
        {/each}
        <button type="button" class="sg-chip" data-sfx="back" onclick={() => (giving = null)}>{s('cancel')}</button>
      {:else}
        <span class="note">{s('sendLetter')}</span>
        {#each cur.pocket as l, j (j)}<button type="button" class="sg-chip" data-sfx="tick" data-sg-pocket={l} onclick={() => (giving = l)} lang="en">{l.toUpperCase()}</button>{/each}
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
        onswap={() => onact({ a: 'swap' })} />
    {/key}
  {:else if failed}
    <p class="note">{s('offline')}</p><button type="button" class="btn" data-sfx="tick" onclick={onretry}>{s('retry')}</button>
  {:else}<p class="note">{s('loading')}</p>{/if}
{:else if ph.k === 'sentence'}
  {#if line}
    {#key line.en}<SentenceTurn {line} seed={g.seed} hideJa={cur.level === 3} misses0={ph.misses} peeked0={ph.peeked} ontry={(tr) => onact({ a: 'try', m: tr.misses, ...(tr.peeked ? { p: 1 } : {}) })} ondone={(o) => onact({ a: 'sent', m: o.misses, ...(o.unseen ? { u: 1 } : {}) })} />{/key}
  {:else if failed || lines}
    <p class="note">{lines ? s('noLine') : s('offline')}</p>
    <button type="button" class="btn" data-sfx="tick" onclick={() => onact({ a: 'noline' })}>{s('next')}</button>
  {:else}<p class="note">{s('loading')}</p>{/if}
{:else if ph.k === 'picture'}
  {#key ph.item}<PictureTurn pic={PICTURES[ph.item]} level={cur.level} seed={g.seed} misses0={ph.misses} ontry={(tr) => onact({ a: 'try', m: tr.misses })} speak={speakable ? { tipKey: `${g.seed}:${g.turn}` } : null}
    ondone={(m, y = 0) => onact({ a: 'pic', m, ...(y ? { y: Math.min(y, 3) as 1 | 2 | 3 } : {}) })} />{/key}
{:else if ph.k === 'event' && card}
  <div class="event" data-sg-event={ph.card}>
    <span class="tagrow">{#if card.who}<Avatar person="G" villager={card.who} size={32} />{/if}<span class="tag">{s('eventTitle')}</span></span>
    <p class="en" lang="en">{#each cardParts(card.en) as part, i (i)}{#if part.key}<b>{part.t}</b>{:else}{part.t}{/if}{/each}</p>
    {#if cur.level < 3 || cardJa}<p class="ja">{card.ja}</p>
    {:else}<button type="button" class="sg-chip peek" data-sfx="tick" data-sg-card-ja onclick={() => (cardJa = true)}>{s('peek')}</button>{/if}
    <div class="actrow">
      <span class="chip-eff" data-sg-effect>{effectOf(card)}</span>
      <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => onact({ a: 'ev' })}>{s('ok')}</button>
    </div>
  </div>
{:else if ph.k === 'home'}
  <div class="event" data-sg-home>
    <span class="tagrow"><Avatar {...headOf(cur)} size={32} /><span class="tag">{s('homeTitle')}</span></span>
    <p class="ja big">{s('homeTeam', { b: HOME_BONUS })}</p>
    <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => onact({ a: 'home' })}>{s('next')}</button>
  </div>
{/if}

<style>
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .one { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .who { display: flex; align-items: center; gap: 12px; }
  .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .turnof { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .sg-chip { min-height: 36px; padding: 0 10px; margin: 0; appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); }
  .gift { display: flex; align-items: center; justify-content: center; gap: 6px; flex-wrap: wrap; }
  .gift .sg-chip { min-height: 44px; }
  .fork { display: flex; flex-direction: column; gap: 8px; }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .ways { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .way { display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center; min-height: 72px; padding: 8px 6px; margin: 0 0 3px; appearance: none; border: 0; cursor: pointer;
    border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 3px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .way:first-child { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-card)); }
  .way:last-child { background: color-mix(in srgb, var(--c-lilac) 45%, var(--c-card)); }
  .way small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .event { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .tagrow { display: flex; align-items: center; gap: 6px; height: 32px; align-self: flex-start; }
  .tag { padding: 3px 10px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-lilac) 55%, var(--c-cream)); font: 700 12px/1.3 var(--font-ui); }
  .event .en { margin: 0; font: 500 20px/1.35 var(--font-body); text-wrap: pretty; }
  .event .en b { background: color-mix(in srgb, var(--c-yuzu) 60%, transparent); border-radius: 4px; padding: 0 2px; }
  .event .ja { margin: 0; font-size: var(--fs-s); line-height: 18px; color: var(--text-soft); }
  .event .ja.big { font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--c-ink); }
  .peek { min-height: 44px; }
  .actrow { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 2px; }
  .chip-eff { flex: none; padding: 6px 12px; border-radius: var(--r-pill); background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .actrow .btn { flex: 1; min-width: 0; }
</style>
