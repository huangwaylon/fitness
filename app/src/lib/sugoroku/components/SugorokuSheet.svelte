<script lang="ts">
  // 英語すごろく's sheet (docs/sugoroku.md "Rules"), its own chunk: a full sheet on the unified kit, its levels
  // menu (続きから / 新しいゲーム / あそびかた) → だれが遊ぶ？ (2–4 seats: the members, the guest, villager friends, in the
  // order picked, each its English level) → the game (the board over the turn's panel: whose turn and the dice, the
  // fork's choice, then the space's ことば, ぶん, 絵, イベント or あがり; the board drawn small during a turn's English;
  // tickets held spent at the roll or on a hinted word; souvenirs in each seat's tray) → 結果 (the ranking, ふりかえり:
  // a no-fail matching of the game's words, and 今日のことば). One phone passed round: no relay, no ベル. The game
  // is saved after every step (save.ts), so ‹ or ✕ mid-game leaves it to 続きから. The island is paused under it.
  import Sheet from '#lib/components/ui/Sheet.svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Board from './Board.svelte';
  import WordTurn from './WordTurn.svelte';
  import SentenceTurn from './SentenceTurn.svelte';
  import PictureTurn from './PictureTurn.svelte';
  import Review from './Review.svelte';
  import { artUrl } from '#lib/art.ts';
  import { PICTURES, SET_BONUS } from '../pictures.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { now } from '#lib/time/clock.ts';
  import { GUEST, PEOPLE } from '#lib/config/rules.ts';
  import { i18n } from '#lib/i18n/index.ts';
  import { resolveLook } from '#lib/villagers/look.ts';
  import { CARDS } from '../cards.ts';
  import { choose, eventDone, pictureDone, tried, MAX_TICKETS, finish, homeDone, lastRound as isLast, LEVEL, MAX_PLAYERS, MIN_PLAYERS, newGame, playWord, ranking, sentenceAsWord,
    sentenceDone, spin, swap, twice, wordScore, HOME_BONUS, type Game, type Level as SeatLevel, type Seat } from '../game.ts';
  import { pathOf } from '../board.ts';
  import { loadWords, type Words } from '../words.ts';
  import { loadSentences, pickSentence, type Line, type Sentence } from '../sentences.ts';
  import { clearGame, loadGame, saveGame } from '../save.ts';
  import { s } from '../i18n.ts';
  import type { Who } from '#lib/types.ts';

  let { open = $bindable() }: { open: boolean } = $props();
  type Level = 'menu' | 'how' | 'setup' | 'play' | 'results';
  let level = $state<Level>('menu');
  let game = $state<Game | null>(null);
  let saved = $state<Game | null>(null);
  $effect(() => {
    if (open) (saved = loadGame()), (level = 'menu');
  });
  const close = () => (open = false);
  /** To the menu: the save as it is now (a game played since the opening). */
  const toMenu = () => ((saved = loadGame()), (level = 'menu'));

  // the words and lines (their own chunks), asked for as the sheet opens
  let words = $state<Words | null>(null);
  let lines = $state<readonly Line[] | null>(null);
  let failed = $state(false);
  function load() {
    failed = false;
    loadWords().then((w) => (words = w), () => (failed = true));
    loadSentences().then((l) => (lines = l), () => (failed = true));
  }
  $effect(() => {
    if (open && (!words || !lines)) load();
  });

  // ---- seats
  const me = $derived<Who>(week.model?.me ?? 'A');
  const nameOf = (w: Who) => (w === 'G' ? (week.view?.guest?.villagerName ?? GUEST.villager) : (week.view?.people[w].villagerName ?? PEOPLE[w].villager));
  /** The guest's villager (its head): not offered again as a friend. */
  const guestVillager = $derived(resolveLook({ villager: week.view?.guest?.villager, person: 'G' }).id);
  const FRIENDS = [['isabelle', 'しずえ'], ['tom-nook', 'たぬきち'], ['kk-slider', 'とたけけ'], ['blathers', 'フータ'], ['raymond', 'ジャック'],
    ['judy', 'みすず'], ['marshal', 'ジュン'], ['dom', 'ちゃちゃまる']] as const;
  type Cand = Omit<Seat, 'level'>;
  const candidates = $derived<Cand[]>([
    ...(me === 'B' ? (['B', 'A', 'G'] as const) : me === 'G' ? (['G', 'A', 'B'] as const) : (['A', 'B', 'G'] as const)).map((w) => ({ who: w, villager: null, name: nameOf(w) })),
    ...FRIENDS.filter(([id]) => id !== guestVillager).map(([id, ja]) => ({ who: null, villager: id, name: i18n.locale === 'en' ? id.replace(/-/g, ' ') : ja }))
  ]);
  const keyOf = (x: Cand) => x.villager ?? x.who ?? '';
  let picked = $state<string[]>([]);
  /** Each seat's level (ふつう till changed). */
  let levels = $state<Record<string, SeatLevel>>({});
  const LEVELS = [1, 2, 3] as const;
  function toggle(x: Cand) {
    const k = keyOf(x);
    picked = picked.includes(k) ? picked.filter((p) => p !== k) : picked.length < MAX_PLAYERS ? [...picked, k] : picked;
  }
  function start() {
    const seats = picked.map((k) => ({ ...candidates.find((c) => keyOf(c) === k)!, level: levels[k] ?? 2 }));
    const g0 = newGame(seats, `${now()}:${picked.join(',')}`);
    shown = g0.players.map((p) => p.pos);
    set(g0);
    level = 'play';
  }
  function setup() {
    picked = candidates.slice(0, 2).map(keyOf);
    level = 'setup';
  }

  // ---- the game: every step saved; the heads walk the route a stone at a time to where the game has them
  let shown = $state<number[]>([]);
  let rolling = $state<number | null>(null);
  /** The dice's number shown while its walk is on (not a card's move). */
  let rolled = $state(0);
  let confirmEnd = $state(false);
  function set(g: Game) {
    game = g;
    confirmEnd = false;
    if (shown.length !== g.players.length) shown = g.players.map((p) => p.pos);
    if (g.phase.k === 'end') {
      clearGame();
      saved = null;
      level = 'results';
    } else saveGame(g);
  }
  const walking = $derived(!!game && game.players.some((p, i) => shown[i] !== p.pos));
  $effect(() => {
    if (!walking || !game) return;
    const ps = game.players;
    const id = setInterval(() => {
      shown = shown.map((v, i) => (v === ps[i].pos ? v : pathOf(v, ps[i].pos, ps[i].branch)[0]));
      // (the dice's number kept while the walk waits at the fork)
      if (shown.every((v, i) => v === ps[i].pos)) (clearInterval(id), game?.phase.k !== 'fork' && (rolled = 0));
    }, 170);
    return () => clearInterval(id);
  });
  function resume() {
    if (!saved) return;
    shown = saved.players.map((p) => p.pos);
    set(saved);
    level = 'play';
  }
  function doSpin(dice = false) {
    if (!game || rolling !== null) return;
    const next = spin(game, dice);
    const ph = next.phase;
    const n = 'spun' in ph ? ph.spun : 1;
    let k = 0;
    rolling = 1;
    const id = setInterval(() => {
      rolling = (k++ % 6) + 1;
      if (k < 8) return;
      clearInterval(id);
      rolling = null;
      rolled = n;
      set(next);
    }, 70);
  }

  const g = $derived(game);
  const cur = $derived(g ? g.players[g.turn] : null);
  const ph = $derived(g?.phase ?? null);
  const lastRound = $derived(!!g && isLast(g));
  /** The board small: a turn's English (the controls stay on screen). */
  const compact = $derived(!!ph && (ph.k === 'word' || ph.k === 'sentence' || ph.k === 'picture' || ph.k === 'event') && !walking);
  /** むずかしい's event cards: the Japanese on a tap. */
  let cardJa = $state(false);
  $effect(() => void (ph?.k === 'event' && (cardJa = false)));

  /** The line for this ぶん space: the seat's level's, none used twice (its pick kept in the phase). */
  const line = $derived.by((): Sentence | null => {
    if (!g || !cur || ph?.k !== 'sentence' || !lines) return null;
    const used = new Set(g.made.filter((m) => m.kind === 'sentence').map((m) => m.text));
    return pickSentence(lines, cur.level, ph.r, used);
  });

  const card = $derived(ph?.k === 'event' ? CARDS[ph.card] : null);
  /** A card's effect as its chip says it. */
  function effectOf(c: (typeof CARDS)[number], held: number): string {
    if (c.stars) return s('effStars', { n: c.stars });
    if (c.gift) return s('effGift', { n: c.gift });
    if (c.move) return s('effMove', { n: c.move });
    if (c.again) return s('effAgain');
    if (c.ticket) return s('effTicket', { t: s(`ticket.${c.ticket}`) }) + (held >= MAX_TICKETS ? s('effFull', { n: MAX_TICKETS }) : '');
    return '';
  }
  /** ふりかえり's pairs: the game's things with Japanese, newest first, one a text, up to five. */
  const pairs = $derived.by(() => {
    if (!g) return [];
    const seen = new Set<string>(), out: { en: string; ja: string }[] = [];
    for (const m of [...g.made].reverse()) if (m.ja && !seen.has(m.text) && out.length < 5) (seen.add(m.text), out.push({ en: m.text, ja: m.ja }));
    return out;
  });
  const cardParts = (en: string) => en.split(/\*([^*]+)\*/g).map((t, i) => ({ t, key: i % 2 === 1 }));

  const rank = $derived(g ? ranking(g) : []);
  const headOf = (x: { who: Who | null; villager: string | null }) => ({ person: x.who ?? ('G' as const), villager: x.villager, worn: !x.villager });
</script>

<Sheet bind:open tunes label={s('title')} variant="full">
  <div class="sg" data-sugoroku data-level={level}>
    {#if level === 'menu'}
      <div class="top"><NavBar pad title={s('title')} onclose={close} /></div>
      <div class="body sheet-scroll">
        <div class="hero card pad">
          <p class="lead">{s('how2')}</p>
          {#if saved}
            <button type="button" class="btn" data-sfx="open" data-sg-resume onclick={resume}>{s('resume')}</button>
          {/if}
          <button type="button" class="btn" class:paper={!!saved} data-sfx="open" data-sg-new onclick={setup}>{s('newGame')}</button>
          <button type="button" class="btn small paper" data-sfx="page" data-sg-how onclick={() => (level = 'how')}>{s('howTo')}</button>
        </div>
      </div>
    {:else if level === 'how'}
      <div class="top"><NavBar pad title={s('howTo')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll">
        <ol class="card pad how">
          <li>{s('how1')}</li><li>{s('how2')}</li><li>{s('how3')}</li><li>{s('how4')}</li><li>{s('how5')}</li>
        </ol>
      </div>
    {:else if level === 'setup'}
      <div class="top"><NavBar pad title={s('setupTitle')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll">
        <p class="note">{s('setupNote')}</p>
        <div class="seats" data-sg-seats>
          {#each candidates as c, i (keyOf(c))}
            {#if i === 3}<h3 class="sec-label wide">{s('friends')}</h3>{/if}
            {@const n = picked.indexOf(keyOf(c))}
            <button type="button" class="seat" class:on={n >= 0} aria-pressed={n >= 0} data-sfx="tick" data-sg-seat={keyOf(c)} onclick={() => toggle(c)}>
              <Avatar {...headOf(c)} size={52} />
              <span class="nm">{c.name}</span>
              {#if n >= 0}<span class="ord">{n + 1}</span>{/if}
            </button>
          {/each}
        </div>
        {#if picked.length}
          <h3 class="sec-label">{s('levelNote')}</h3>
          <div class="card dense levels" role="list">
            {#each picked as k (k)}
              {@const c = candidates.find((x) => keyOf(x) === k)}
              {#if c}
                <div class="row lrow" role="listitem" data-sg-level-row={k}>
                  <Avatar {...headOf(c)} size={32} /><span class="nm">{c.name}</span>
                  <span class="seg" role="radiogroup" aria-label={s('levelOf', { name: c.name })}>
                    {#each LEVELS as lv (lv)}
                      <button type="button" role="radio" class="sg-chip" aria-checked={(levels[k] ?? 2) === lv} data-sfx="none" data-sg-level={lv}
                        onclick={() => (levels = { ...levels, [k]: lv })}>{s(`level.${lv}`)}</button>
                    {/each}
                  </span>
                </div>
              {/if}
            {/each}
          </div>
        {/if}
        <button type="button" class="btn" data-sfx="confirm" data-sg-start disabled={picked.length < MIN_PLAYERS} onclick={start}>{s('start')}</button>
      </div>
    {:else if level === 'play' && g && cur && ph}
      <div class="top"><NavBar pad title={s('title')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll play" data-sg-turn={g.turn} data-sg-phase={ph.k}>
        <div class="scores">
          {#each g.players as p, i (i)}
            <span class="score" class:now={i === g.turn} data-sg-score={i}>
              <Avatar {...headOf(p)} size={28} /><b>{p.stars}</b><small class="lv">{s(`level.${p.level}`)}</small>
              {#if p.items.length}<small class="lv ic" data-sg-items={p.items.length}><Icon name="gift" size={12} />{p.items.length}</small>{/if}
              {#if p.tickets.length}<small class="lv ic" data-sg-tickets={p.tickets.length}><Icon name="tag" size={12} />{p.tickets.length}</small>{/if}
            </span>
          {/each}
          <span class="round">{lastRound ? s('lastRound') : s('round', { n: g.round })}</span>
        </div>
        <Board players={g.players} {shown} turn={g.turn} {compact} />
        <div class="panel card pad">
          {#if walking || rolling !== null}
            <div class="spinning">{#if rolling !== null || rolled}<span class="die" data-sg-die>{rolling ?? rolled}</span><p>{rolling === null ? s('spun', { n: rolled }) : ''}</p>
              {:else}<p data-sg-moving>{s('walking')}</p>{/if}</div>
          {:else if ph.k === 'spin'}
            <div class="who">
              <Avatar {...headOf(cur)} size={64} />
              <div>
                <p class="turnof">{s('turnOf', { name: cur.name })}</p>
                <p class="note">{s('passTo', { name: cur.name })}</p>
              </div>
            </div>
            <button type="button" class="btn" data-sfx="confirm" data-sg-spin onclick={() => doSpin()}>{s('spin')}</button>
            {#if twice(g)}<p class="note">{s('twice')}</p>
            {:else if cur.tickets.includes('dice')}<button type="button" class="btn small yuzu" data-sfx="confirm" data-sg-spin-dice onclick={() => doSpin(true)}>{s('useDice')}</button>{/if}
          {:else if ph.k === 'fork'}
            <div class="event" data-sg-fork>
              <h3 class="ttl">{s('forkTitle')}</h3>
              <p class="note">{s('forkAsk', { n: ph.left })}</p>
              <div class="ways">
                {#each [0, 1] as const as b (b)}
                  <button type="button" class="way" data-sfx="confirm" data-sg-branch={b} onclick={() => set(choose(g, b))}>
                    <b>{s(`branch.${b}`)}</b><small>{s(`branch.${b}.note`)}</small>
                  </button>
                {/each}
              </div>
            </div>
          {:else if ph.k === 'word'}
            {#if words}
              {#key `${g.n}`}
                <WordTurn rack={cur.rack} lucky={g.lucky} mult={ph.mult} minLen={LEVEL[cur.level].minLen} hintHalf={LEVEL[cur.level].hintHalf}
                  ticket={cur.tickets.includes('hint')} hinted0={ph.hinted} onhint={() => set(tried(g, { hinted: true }))} {words}
                  score={(w, c, h) => wordScore(g, w, c, h)}
                  onplay={(w, h, t) => set(playWord(g, w, { everyday: !!words!.ja(w), ja: words!.ja(w), hinted: h, ticket: t }))}
                  onswap={() => set(swap(g))} />
              {/key}
            {:else if failed}
              <p class="note">{s('offline')}</p><button type="button" class="btn small" data-sfx="tick" onclick={load}>{s('retry')}</button>
            {:else}<p class="note">{s('loading')}</p>{/if}
          {:else if ph.k === 'sentence'}
            {#if line}
              {#key line.en}<SentenceTurn {line} seed={g.seed} hideJa={cur.level === 3} misses0={ph.misses} peeked0={ph.peeked} ontry={(t) => set(tried(g, t))} ondone={(o) => set(sentenceDone(g, { ...o, text: line.en, ja: line.ja }))} />{/key}
            {:else if failed || lines}
              <p class="note">{lines ? s('noLine') : s('offline')}</p>
              <button type="button" class="btn small" data-sfx="tick" onclick={() => set(sentenceAsWord(g))}>{s('next')}</button>
            {:else}<p class="note">{s('loading')}</p>{/if}
          {:else if ph.k === 'picture'}
            {#key ph.item}<PictureTurn pic={PICTURES[ph.item]} level={cur.level} seed={g.seed} misses0={ph.misses} ontry={(t) => set(tried(g, t))} ondone={(m) => set(pictureDone(g, m))} />{/key}
          {:else if ph.k === 'event' && card}
            <div class="event" data-sg-event={ph.card}>
              {#if card.who}<Avatar person="G" villager={card.who} size={48} />{/if}
              <h3 class="ttl">{s('eventTitle')}</h3>
              <p class="en" lang="en">{#each cardParts(card.en) as part, i (i)}{#if part.key}<b>{part.t}</b>{:else}{part.t}{/if}{/each}</p>
              {#if cur.level < 3 || cardJa}<p class="ja">{card.ja}</p>
              {:else}<button type="button" class="btn small paper" data-sfx="tick" data-sg-card-ja onclick={() => (cardJa = true)}>{s('peek')}</button>{/if}
              <span class="chip-eff" data-sg-effect>{effectOf(card, cur.tickets.length)}</span>
              <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => set(eventDone(g))}>{s('ok')}</button>
            </div>
          {:else if ph.k === 'home'}
            <div class="event" data-sg-home>
              <Avatar {...headOf(cur)} size={64} />
              <h3 class="ttl">{s('homeTitle')}</h3>
              <p class="ja">{s('homePlace', { n: ph.place + 1, b: HOME_BONUS[ph.place] ?? 0 })}</p>
              <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => set(homeDone(g))}>{s('next')}</button>
            </div>
          {/if}
        </div>
        <div class="end">
          {#if confirmEnd}
            <span class="note">{s('endAsk')}</span>
            <button type="button" class="btn small" data-sfx="confirm" data-sg-end-yes onclick={() => ((confirmEnd = false), set(finish(g)))}>{s('end')}</button>
          {:else}
            <button type="button" class="link" data-sfx="tick" data-sg-end onclick={() => (confirmEnd = true)}>{s('end')}</button>
          {/if}
        </div>
      </div>
    {:else if level === 'results' && g}
      <div class="top"><NavBar pad title={s('results')} onback={toMenu} onclose={close} /></div>
      <div class="body sheet-scroll" data-sg-results>
        <div class="card pad podium">
          <p class="win">{s('winner', { name: g.players[rank[0]].name })}</p>
          {#each rank as i, k (i)}
            {@const p = g.players[i]}
            <div class="rrow" data-sg-rank={k}>
              <span class="place">{s('place', { n: k + 1 })}</span>
              <Avatar {...headOf(p)} size={40} />
              <span class="nm">{p.name}</span>
              <span class="st"><Icon name="star" size={18} soft /><b>{p.stars}</b></span>
            </div>
            {#if p.items.length}
              <div class="tray" aria-label={s('souvenirs')}>
                {#each p.items as it (it)}<img src={artUrl(PICTURES[it].key) ?? ''} alt={PICTURES[it].ja} title={PICTURES[it].w} width="28" height="28" />{/each}
              </div>
            {/if}
          {/each}
          <p class="note setnote">{s('setNote', { n: SET_BONUS })}</p>
        </div>
        {#if pairs.length >= 2}<Review {pairs} seed={g.seed} />{/if}
        {#if g.made.length}
          <h3 class="sec-label">{s('recap')}</h3>
          <div class="card dense" role="list">
            {#each g.made as m, i (i)}
              <div class="row recap" role="listitem">
                <Avatar {...headOf(g.players[m.p])} size={24} />
                <span class="txt"><span lang="en" class="en2">{m.text}</span>{#if m.ja}<span class="ja2">{m.ja}</span>{/if}</span>
                <span class="st"><Icon name="star" size={14} soft />{m.stars}</span>
              </div>
            {/each}
          </div>
        {/if}
        <button type="button" class="btn" data-sfx="open" data-sg-again onclick={() => { picked = g.players.map(keyOf); levels = Object.fromEntries(g.players.map((p) => [keyOf(p), p.level])); level = 'setup'; }}>{s('again')}</button>
      </div>
    {/if}
  </div>
</Sheet>

<style>
  .sg { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }
  .top { flex: none; background-color: var(--surface); }
  .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px;
    padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .hero { display: flex; flex-direction: column; gap: 10px; }
  .lead { margin: 0 0 4px; font: 700 var(--fs-body)/1.5 var(--font-ui); text-wrap: pretty; }
  .how { margin: 0; padding-left: 28px !important; display: grid; gap: 8px; font-size: var(--fs-body); line-height: 1.5; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .seats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .wide { grid-column: 1 / -1; margin: 6px 0 0; }
  .seat {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; margin: 0;
    appearance: none; border: 0; border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 3px 0 var(--c-edge);
    color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .seat.on { background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .ord { position: absolute; top: 6px; right: 8px; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%;
    background: var(--c-ink); color: var(--c-cream); font: 600 13px/1 var(--font-num); }
  .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .play { gap: 8px; }
  .scores { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .score { display: inline-flex; align-items: center; gap: 4px; padding: 2px 10px 2px 2px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); }
  .score.now { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .score b { font: 600 16px/1 var(--font-num); }
  .lv { font: 700 10px/1 var(--font-ui); color: var(--text-soft); }
  .lv.ic { display: inline-flex; align-items: center; gap: 1px; }
  .tray { display: flex; flex-wrap: wrap; gap: 2px; padding-left: 46px; }
  .tray img { width: 28px; height: 28px; object-fit: contain; }
  .setnote { text-align: center; }
  .chip-eff { padding: 4px 12px; border-radius: var(--r-pill); background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .lrow { display: flex !important; align-items: center; gap: 8px; }
  .lrow .nm { flex: 1; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .seg { display: inline-flex; gap: 4px; }
  .sg-chip { min-height: 36px; padding: 0 10px; margin: 0; appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); }
  .sg-chip[aria-checked='true'] { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .ways { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
  .way { display: flex; flex-direction: column; gap: 4px; align-items: center; padding: 12px 6px; margin: 0; appearance: none; border: 0; cursor: pointer;
    border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 3px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .way:first-child { background: color-mix(in srgb, var(--c-sky) 45%, var(--c-card)); }
  .way:last-child { background: color-mix(in srgb, var(--c-lilac) 45%, var(--c-card)); }
  .way small { font-weight: 500; font-size: var(--fs-s); color: var(--text-soft); }
  .round { margin-left: auto; font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .panel { display: flex; flex-direction: column; align-items: center; gap: 10px; min-height: 150px; justify-content: center; }
  .who { display: flex; align-items: center; gap: 12px; }
  .turnof { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .spinning { display: flex; flex-direction: column; align-items: center; gap: 6px; }
  .spinning p { margin: 0; font: 700 var(--fs-body)/1.2 var(--font-ui); min-height: 1.2em; }
  .die { width: 64px; height: 64px; display: grid; place-items: center; border-radius: 16px; background: var(--c-cream);
    box-shadow: 0 4px 0 var(--c-edge); font: 600 36px/1 var(--font-num); }
  .event { display: flex; flex-direction: column; align-items: center; gap: 8px; text-align: center; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .event .en { margin: 0; font: 500 20px/1.4 var(--font-body); text-wrap: pretty; }
  .event .en b { background: color-mix(in srgb, var(--c-yuzu) 60%, transparent); border-radius: 4px; padding: 0 2px; }
  .event .ja { margin: 0; font-size: var(--fs-s); color: var(--text-soft); }
  .end { display: flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; }
  .link { appearance: none; border: 0; background: none; padding: 10px; min-height: 44px; color: var(--text-soft); font: 500 var(--fs-s)/1.2 var(--font-ui); text-decoration: underline; cursor: pointer; }
  .podium { display: flex; flex-direction: column; gap: 8px; }
  .win { margin: 0 0 4px; text-align: center; font: 700 22px/1.3 var(--font-ui); }
  .rrow { display: flex; align-items: center; gap: 10px; }
  .place { width: 36px; font: 700 var(--fs-body)/1 var(--font-ui); }
  .rrow .nm { flex: 1; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .st { display: inline-flex; align-items: center; gap: 3px; color: var(--c-gold); }
  .st b { font: 600 18px/1 var(--font-num); color: var(--c-ink); }
  .recap { display: flex !important; align-items: center; gap: 8px; }
  .txt { flex: 1; display: flex; flex-direction: column; min-width: 0; }
  .en2 { font: 600 var(--fs-body)/1.3 var(--font-body); }
  .ja2 { font-size: var(--fs-s); color: var(--text-soft); }
  .recap .st { font: 600 14px/1 var(--font-num); color: var(--c-ink); }
</style>
