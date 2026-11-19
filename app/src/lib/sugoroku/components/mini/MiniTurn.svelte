<script lang="ts">
  // 英語すごろく's みんなで！ in the turn's sheet (docs/sugoroku.md "みんなで！"): the lander's pick of the two options (each
  // its name, one line and its time), then the game picked (each its own screen) on its clock (mini/clock.ts: the 3-2-1,
  // one bar drained by a CSS animation, 「あと5秒！」), till its close. Online, every seat dealt in plays on its own phone
  // at once (a seat back after the open watches); the close (`mc`) goes from the lander's phone 1 s after the end, from
  // the others a moment later if it hasn't come. Passed round: a game with private info goes seat by seat behind a cover
  // (「スマホをBに渡してね」 [見る]): the races (ことばの市場, なかま分け, 数字キャッチ) a turn's bar each (`turnMs`), the
  // stepped ones a step each (伝えて当てて the speller's, then each finder's; おつかい the お客さん's list, then the shop's
  // basket); the shared ones (みんなで一文, しりとり, 返事はどれ？) on the one phone, every hand in its seat's colour.
  // `?sgMiniMs=` (dev/test only) is every one of these lengths.
  import { onDestroy, untrack } from 'svelte';
  import { testHooks } from '#lib/ui-state/testMode.ts';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Market from './Market.svelte';
  import Spell from './Spell.svelte';
  import Together from './Together.svelte';
  import Sort from './Sort.svelte';
  import Chain from './Chain.svelte';
  import Numbers from './Numbers.svelte';
  import Shopping from './Shopping.svelte';
  import Reply from './Reply.svelte';
  import { MINIS, type MiniId } from '../../mini/registry.ts';
  import type { MiniTimes } from '../../mini/clock.ts';
  import { stagePlay } from '../../mini/hands.ts';
  import { CHAIN_TURN_MS } from '../../mini/chain.ts';
  import { SHOP_ASK_MS, SHOP_FILL_MS } from '../../mini/shopping.ts';
  import { REPLY_TURN_MS } from '../../mini/reply.ts';
  import type { MiniData } from '../../mini/data.ts';
  import type { Ctx, Play } from '../../mini/types.ts';
  import type { Game, MiniOn } from '../../game.ts';
  import type { Words } from '../../words.ts';
  import type { Line } from '../../sentences.ts';
  import type { Move } from '../../online.ts';
  import type { Who } from '#lib/types.ts';
  import { s } from '../../i18n.ts';
  import { lenOf, ROUND_MS, timesOf } from './len.ts';

  type Act = Omit<Move, 'g' | 'i' | 'who'>;
  interface Props {
    g: Game;
    mode: 'local' | 'online';
    /** This phone's person (online: its seat). */
    me: Who;
    words: Words | null;
    lines: readonly Line[] | null;
    mini: MiniData | null;
    /** Online: the pick's room stamp (wire.ts miniOpenedAt). */
    opened?: number;
    /** The clock the times are on (online the relay's, passed round the phone's). */
    now: () => number;
    /** Online: who else is here (the pick deals them in). */
    here: readonly Who[];
    /** Online: each seat's live frame (a game's `mini` view: its typing, its count). */
    views: Partial<Record<Who, string>>;
    /** A move; passed round, whose it is (`who`: the seat playing). */
    onact: (m: Act, who?: Who) => void;
    /** Online: my live frame, for the others. */
    onview?: (v: string) => void;
  }
  let { g, mode, me, words, lines, mini, opened, now, here, views, onact, onview }: Props = $props();

  const ph = $derived(g.phase.k === 'mini' ? g.phase : null);
  const on = $derived<MiniOn | null>(ph?.on ?? null);
  const lander = $derived(g.players[g.turn]);
  const nameOf = (w: Who) => g.players.find((p) => p.who === w)?.name ?? w;
  const ctx = $derived<Ctx | null>(words && lines && mini ? { words, lines, mini } : null);
  const local = $derived(mode === 'local');

  // ---- the pick
  const canPick = $derived((local || lander.who === me) && !!ctx);
  /** The seats this phone sees here (the lander's and those present): only they are dealt in. */
  const present = $derived(g.players.map((p) => p.who).filter((w) => w === me || here.includes(w)).join(''));
  const timeOf = (id: MiniId) => {
    const m = MINIS[id];
    return local && m.local === 'hotseat' && m.turnMs ? s('miniEach', { n: m.turnMs / 1000 }) : s('miniSec', { n: m.ms / 1000 });
  };
  function pick(b: 0 | 1) {
    if (!canPick || on) return;
    onact(local ? { a: 'mg', b } : { a: 'mg', b, s: present });
  }

  // ---- the clock: a tick at each boundary (the countdown's seconds, あと5秒, the end, the close), never a running timer
  let tnow = $state(untrack(() => now()));
  /** Passed round, a hot-seat game's step: whose (in turn from the lander; 伝えて当てて: `id` the step's), covered till
   *  見る (none when the same seat goes on), its start. */
  let step = $state<{ k: number; who: Who; at: number | null; id?: string } | null>(null);
  const hotseat = $derived(!!on && local && MINIS[on.id].local === 'hotseat');
  /** The seats in turn, the lander first. */
  const order = $derived.by((): Who[] => {
    if (!on) return [];
    const k = Math.max(0, on.here.indexOf(lander.who));
    return [...on.here.slice(k), ...on.here.slice(0, k)];
  });
  /** A game played in steps passed round (伝えて当てて, おつかい), or a race (なかま分け, 数字キャッチ: a count a seat). */
  const stepped = $derived(on?.id === 'spell' || on?.id === 'shopping');
  const race = $derived(on?.id === 'sort' || on?.id === 'numbers');
  /** A stepped game passed round: whose step it is at (伝えて当てて the speller till the word's in, then each finder;
   *  おつかい the お客さん till the list's in, then the next seat as the shop), and the step's key. */
  const actor = $derived.by((): { who: Who; id: string } | null => {
    if (!on) return null;
    if (on.id === 'spell') {
      const sp = on.s, round = sp.rounds[sp.r];
      if (!round) return null;
      const gave = sp.gave || sp.shown;
      const who = !gave ? round.giver : (Object.keys(round.grids) as Who[]).find((w) => sp.picks[w]?.got === undefined);
      return who ? { who, id: `${who}:${sp.r}:${gave ? 1 : 0}` } : null;
    }
    if (on.id === 'shopping') {
      const sh = on.s, round = sh.rounds[sh.r];
      if (!round) return null;
      const sent = sh.frame !== null || sh.shown, k = sh.seats.findIndex((x) => x.who === round.asker);
      const who = sent ? sh.seats[(k + 1) % sh.seats.length].who : round.asker;
      return { who, id: `${who}:${sh.r}:${sent ? 1 : 0}` };
    }
    return null;
  });
  // the hot seat's next step: a sort count in (or a spell step taken) moves it on
  $effect(() => {
    if (!hotseat || !on) return void (step = null);
    const was = untrack(() => step);
    if (stepped) {
      const a = actor;
      if (a && was?.id !== a.id) step = { k: (was?.k ?? -1) + 1, who: a.who, id: a.id, at: was?.who === a.who && was.at !== null ? now() : null };
      return;
    }
    if (!was) {
      // (a game resumed: the seats with a count in have played)
      const k = Math.max(0, order.findIndex((w) => !(on.id === 'sort' || on.id === 'numbers') || on.s.counts[w] === undefined));
      step = { k, who: order[k], at: null };
    }
  });
  const len = (base: number) => lenOf(base);
  // (the e2e's `__sgMini.end()`, test mode only: the clock's step or game over now, its close's grace kept, as if its
  // time ran out; a step after it on its own clock)
  let cut = $state(-Infinity);
  if (testHooks()) {
    (window as { __sgMini?: unknown }).__sgMini = { end: () => (tnow = cut = now()) };
    onDestroy(() => delete (window as { __sgMini?: unknown }).__sgMini);
  }
  const times = $derived.by((): MiniTimes | null => {
    const t = clockOf();
    return t && cut >= t.start && cut < t.end ? { start: t.start, end: cut, close: cut + (t.close - t.end) } : t;
  });
  function clockOf(): MiniTimes | null {
    if (!on) return null;
    if (hotseat) {
      if (!step || step.at === null) return null;
      const ms = len(on.id === 'spell' ? ROUND_MS : on.id === 'shopping' ? (step.id?.endsWith(':1') ? SHOP_FILL_MS : SHOP_ASK_MS) : (MINIS[on.id].turnMs ?? MINIS[on.id].ms));
      // (a step plays at once: no 3-2-1 between a speller and a finder, an お客さん and the shop)
      return stepped ? { start: step.at, end: step.at + ms, close: step.at + ms } : timesOf(step.at, ms);
    }
    const at = local ? on.at : opened;
    return at === undefined ? null : timesOf(at, len(MINIS[on.id].ms));
  }
  const seatIdx = $derived(Math.max(0, g.players.findIndex((p) => p.who === me)));
  /** When this phone sends the close: the lander's at once, the others a moment after (only if none came). */
  const closeAt = $derived(times ? times.close + (local ? 0 : ((g.players.findIndex((p) => p.who === me) - g.turn + g.players.length) % g.players.length) * 1500) : Infinity);
  $effect(() => {
    if (!times) return;
    const t = tnow;
    const marks = [times.start - 2000, times.start - 1000, times.start, times.end - 5000, times.end, closeAt].filter((x) => x > t);
    if (!marks.length) return;
    const id = setTimeout(() => (tnow = now()), Math.min(...marks) - t + 15);
    return () => clearTimeout(id);
  });
  $effect(() => {
    const again = () => document.visibilityState === 'visible' && (tnow = now());
    document.addEventListener('visibilitychange', again);
    return () => document.removeEventListener('visibilitychange', again);
  });
  const stage = $derived(!times ? 'wait' : tnow < times.start ? 'ready' : tnow < times.end ? 'play' : 'over');
  const count = $derived(times && stage === 'ready' ? Math.max(1, Math.ceil((times.start - tnow) / 1000)) : 0);
  const late = $derived(!!times && stage === 'play' && times.end - tnow <= 5000);

  /** A play: online sent (anyone's), passed round as the seat playing (the hot seat's, or a shared tile's owner). */
  function play(p: Play, who?: Who) {
    if (!on) return;
    onact({ a: 'mp', ...p }, local ? (who ?? step?.who ?? lander.who) : undefined);
  }
  // the end of a step or of the game
  let closed = '';
  $effect(() => {
    if (!on || !times || stage !== 'over') return;
    const key = `${g.n}:${step?.k ?? -1}`;
    if (hotseat && step) {
      if (closed === key) return;
      closed = key;
      if (on.id === 'spell' || on.id === 'shopping') return play(stagePlay(on.s.stage), step.who);
      // (a race sends its count as its `over` comes; the next seat, or the game's close)
      const next = step.k + 1;
      if (next < order.length) queueMicrotask(() => (step = { k: next, who: order[next], at: null }));
      else if (!race) onact({ a: 'mc' });
      return;
    }
    if (tnow < closeAt || closed === key) return;
    closed = key;
    onact({ a: 'mc' });
  });
  /** This phone's seat in the game: the hot seat's, mine online (dealt in), none (watching; みんなで一文 passed round:
   *  every seat's). */
  const seat = $derived<Who | null>(!on ? null : hotseat ? (step?.who ?? null) : local ? null : on.here.includes(me) ? me : null);
  const watching = $derived(!!on && !local && !on.here.includes(me));
  const lenRound = $derived(len(ROUND_MS));
</script>

<section class="mini" data-sg-mini={on?.id ?? 'pick'} data-sg-mini-stage={on ? (hotseat && step?.at === null ? 'cover' : stage) : 'pick'}>
  <div class="head">
    <span class="tag mtag"><i class="heads" aria-hidden="true"></i>{s('miniTitle')}</span>
    {#if on}<b class="name">{s(`mini.${on.id}`)}</b>{/if}
    {#if on && stage === 'play' && late}<span class="late" data-sg-mini-late>{s('miniLate')}</span>{/if}
  </div>
  {#if !ph}
    <!-- (the phase moved on) -->
  {:else if !on}
    {#if !canPick}
      <div class="who"><Avatar person={lander.who} worn size={28} /><p class="note">{s('miniPicking', { name: lander.name })}</p></div>
    {:else}<p class="ask">{s('miniPick')}</p>{/if}
    {#if !local}
      <!-- (online: the seats here now, the ones dealt in) -->
      <div class="here" data-sg-mini-here={present}><span class="note">{s('miniHere')}</span>{#each [...present] as w (w)}<Avatar person={w as Who} worn size={24} />{/each}</div>
    {/if}
    <div class="opts" inert={!canPick}>
      {#each ph.opts as id, b (id)}
        <button type="button" class="opt" data-sfx="confirm" data-sg-mini-opt={id} onclick={() => pick(b as 0 | 1)}>
          <b>{s(`mini.${id}`)}</b><small>{s(`miniHow.${id}`)}</small><span class="time">{timeOf(id)}</span>
        </button>
      {/each}
    </div>
  {:else if hotseat && step && step.at === null}
    <!-- passed round: the next seat's turn behind a cover -->
    <div class="cover" data-sg-mini-cover={step.who}>
      {#if step.k > 0 && !stepped}<p class="soft">{s('miniStop')}</p>{/if}
      <Avatar person={step.who} worn size={56} />
      <p class="pass">{s('passTo', { name: nameOf(step.who) })}</p>
      {#if on.id === 'spell'}<span class="tag">{on.s.rounds[on.s.r]?.giver === step.who ? s('spGiver') : s('spPicker')}</span>{/if}
      {#if on.id === 'shopping'}<span class="tag">{step.id?.endsWith(':0') ? s('shAsker') : s('shShop')}</span>{/if}
      <button type="button" class="btn" data-sfx="confirm" data-sg-mini-look onclick={() => step && (step = { ...step, at: now() })}>{s('miniLook')}</button>
    </div>
  {:else}
    {#if watching}<p class="note" data-sg-mini-watch>{s('miniLater')}</p>{/if}
    {#if times && stage !== 'wait'}
      {#key times.start}
        <div class="mbar" class:hurry={late} aria-hidden="true">
          {#if stage === 'play'}<i style:animation-duration="{times.end - times.start}ms" style:animation-delay="-{Math.max(0, tnow - times.start)}ms"></i>{:else if stage === 'ready'}<i class="full"></i>{/if}
        </div>
      {/key}
    {/if}
    {#if stage === 'ready'}
      <div class="ready" data-sg-mini-count={count}><b>{count}</b><span>{s('miniReady')}</span></div>
    {:else if ctx}
      {@const live = stage === 'play'}
      {@const over = stage === 'over'}
      {#if on.id === 'market'}<Market s={on.s} {ctx} {seat} {live} {nameOf} {play} />
      {:else if on.id === 'spell'}<Spell s={on.s} {seat} {live} {mode} {nameOf} {play} {views} {onview} {seatIdx} roundMs={lenRound} />
      {:else if on.id === 'together'}<Together s={on.s} {seat} {live} {mode} {nameOf} {play} {here} {me} />
      {:else if on.id === 'sort'}<Sort s={on.s} {seat} {live} {over} {nameOf} {play} {views} {onview} />
      {:else if on.id === 'chain'}<Chain s={on.s} {ctx} {seat} {live} {mode} {nameOf} {play} {seatIdx} turnMs={len(CHAIN_TURN_MS)} />
      {:else if on.id === 'numbers'}<Numbers s={on.s} {seat} {live} {over} {play} {views} {onview} />
      {:else if on.id === 'shopping'}<Shopping s={on.s} {seat} {live} {mode} {nameOf} {play} {seatIdx} askMs={len(SHOP_ASK_MS)} fillMs={len(SHOP_FILL_MS)} />
      {:else if on.id === 'reply'}<Reply s={on.s} {seat} {live} {mode} {nameOf} {play} {seatIdx} turnMs={len(REPLY_TURN_MS)} />{/if}
    {:else}<p class="note">{s('loading')}</p>{/if}
  {/if}
</section>

<style>
  .mini { position: relative; display: flex; flex-direction: column; gap: 8px; }
  .mini > :global(*) { flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 8px; min-height: 32px; }
  .mtag { display: inline-flex; align-items: center; gap: 4px; background: color-mix(in srgb, var(--c-rose) 45%, var(--c-cream)); color: var(--c-ink); }
  /* the みんなで！ mark: two heads (the stone's) */
  .heads { width: 16px; height: 12px; background: radial-gradient(circle at 4px 4px, var(--c-ink) 2.6px, transparent 3px), radial-gradient(circle at 12px 4px, var(--c-ink) 2.6px, transparent 3px),
    radial-gradient(ellipse 4px 3px at 4px 12px, var(--c-ink) 98%, transparent), radial-gradient(ellipse 4px 3px at 12px 12px, var(--c-ink) 98%, transparent); }
  .name { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--c-ink); }
  .late { margin-left: auto; padding: 4px 10px; border-radius: var(--r-pill); background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--c-ink); }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .soft { margin: 0; font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--text-soft); }
  .who { display: flex; align-items: center; gap: 8px; }
  .here { display: flex; align-items: center; justify-content: center; gap: 4px; min-height: 28px; }
  .ask { margin: 0; text-align: center; font: 700 var(--fs-body)/1.5 var(--font-ui); }
  .opts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .opt { display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center; min-height: 128px; padding: 10px 8px; margin: 0 0 3px; appearance: none; border: 0; cursor: pointer;
    border-radius: var(--r-card); background: var(--c-card); box-shadow: var(--sh-ctl); color: var(--c-ink); text-align: center; -webkit-tap-highlight-color: transparent; }
  .opt:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .opt:first-child { background: color-mix(in srgb, var(--c-rose) 30%, var(--c-card)); }
  .opt:last-child { background: color-mix(in srgb, var(--c-sky) 25%, var(--c-card)); }
  .opt b { font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .opt small { font: 500 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); text-wrap: pretty; }
  .opt .time { font: 600 var(--fs-s)/1 var(--font-num); color: var(--c-ink); padding: 3px 8px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-edge) 18%, transparent); }
  .cover { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 8px 0 4px; text-align: center; }
  .pass { margin: 0; font: 700 var(--fs-talk)/1.3 var(--font-ui); color: var(--c-ink); }
  .cover .btn { align-self: stretch; }
  /* the one bar: drained by an animation set once (no tick) */
  .mbar { height: 8px; border-radius: 4px; overflow: hidden; background: color-mix(in srgb, var(--c-edge) 25%, transparent); }
  .mbar i { display: block; height: 100%; border-radius: 4px; background: var(--c-leaf); transform-origin: left; animation: drain linear forwards; }
  .mbar i.full { animation: none; }
  .mbar.hurry i { background: var(--c-yuzu); }
  @keyframes drain { from { transform: scaleX(1); } to { transform: scaleX(0); } }
  .ready { display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 16px 0; }
  .ready b { font: 600 56px/1 var(--font-num); color: var(--c-ink); }
  .ready span { font: 700 var(--fs-body)/1.2 var(--font-ui); color: var(--text-soft); }
</style>
