<script lang="ts">
  // 7 おつかい (mini/shopping.ts), two lists. The お客さん holds the Japanese list (「りんご2つ、バナナ3本」) and builds its
  // English from chips, one line at a time (やさしい the thing only, the rest filled; ふつう the number, the thing and
  // -s; むずかしい a container too: "two loaves of bread"), the request read back as it grows; お願いする sends it and the
  // fold judges it: not yet, 「おしい！」 says which line and which part, kindly (the line lit, its chips kept); a second
  // miss sends the right one. The shop (everyone else: online on their phones, passed round the next seat behind the
  // cover) reads the request and fills one basket from the shelf of 9 pictures (a tap one in, − one out), then わたす:
  // all there, ナイス！; not, 「おしい！」 with what's off (missing, extra, how many) and one more go. The round's timers
  // (online any phone's `next`, the seats one after another; passed round MiniTurn's step) send the list as written,
  // then end the round with the basket as it is.
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Nudge from '../Nudge.svelte';
  import { flashNote } from './note.svelte.ts';
  import { PICTURES, pictureSrc } from '../../pictures.ts';
  import { BOXES, FRAMES, basketRight, lineJa, requestCheck, requestCode, rightSlots, shopRequest, slotText, type ShoppingState, type Slot } from '../../mini/shopping.ts';
  import { stagePlay } from '../../mini/hands.ts';
  import type { Play } from '../../mini/types.ts';
  import type { Who } from '#lib/types.ts';
  import { s as tr } from '../../i18n.ts';

  interface Props {
    s: ShoppingState; seat: Who | null; live: boolean; mode: 'local' | 'online'; nameOf: (w: Who) => string; play: (p: Play, who?: Who) => void;
    seatIdx: number;
    /** The round's steps (the list's, then the basket's): online, this phone's timers. */
    askMs: number;
    fillMs: number;
  }
  let { s, seat, live, mode, nameOf, play, seatIdx, askMs, fillMs }: Props = $props();

  const round = $derived(s.rounds[s.r] ?? null);
  const stage = $derived(s.stage);
  const sent = $derived(s.frame !== null || s.shown);
  const alone = $derived(s.seats.length === 1);
  const role = $derived(!round || !seat ? 'watch' : !sent ? (seat === round.asker ? 'ask' : 'wait') : alone || seat !== round.asker ? 'shop' : 'watch');
  const level = $derived(round ? (s.seats.find((x) => x.who === round.asker)?.level ?? 2) : 2);
  const right = $derived(round ? rightSlots(round) : []);

  // ---- the お客さん's request: a slot a line (its word chip, number, -s, container), the frame
  let frame = $state(0);
  let slots = $state<Slot[]>([]);
  let at = $state(0);
  /** The line that wasn't right yet (the fold's tries moved on), and what in it. */
  let off = $state<{ slot: number; part: string } | null>(null);
  let lastCode = '';
  $effect(() => {
    void stage;
    frame = 0;
    at = 0;
    off = null;
    slots = right.map((w) => (level === 1 ? { ...w, word: -1 } : { word: -1, n: 0, many: false, box: w.box >= 0 && level < 3 ? w.box : -1 }));
  });
  /** A slot as it is sent: やさしい's number, -s and container the list's. */
  const asSent = (sl: Slot, i: number): Slot => (level === 1 ? { ...right[i], word: sl.word } : level === 2 ? { ...sl, box: right[i].box } : sl);
  const ready = $derived(slots.length > 0 && slots.every((sl) => sl.word >= 0 && sl.n > 0));
  const NUM = ['a', 'two', 'three', 'four', 'five', 'six'];
  /** FRAMES' chips, short. */
  const FRAME_CHIPS = ['Can I have…?', 'I’d like…', 'Could I get…?', '…, please'];
  function set(patch: Partial<Slot>) {
    if (!live) return;
    slots = slots.map((sl, i) => (i === at ? { ...sl, ...patch } : sl));
    if (off?.slot === at) off = null;
    const sl = slots[at];
    // (a line done: on to the next one not done)
    if (patch.word !== undefined && sl.word >= 0 && sl.n > 0) {
      const next = slots.findIndex((x, i) => i > at && (x.word < 0 || x.n === 0));
      if (next >= 0) at = next;
    }
  }
  const preview = $derived(round ? slots.map((sl, i) => (sl.word >= 0 && sl.n > 0 ? slotText(asSent(sl, i), round) : '…')) : []);
  const previewText = $derived.by(() => {
    const list = preview.length > 1 ? `${preview.slice(0, -1).join(', ')} and ${preview.at(-1)}` : (preview[0] ?? '');
    const t = (FRAMES[frame] ?? FRAMES[0]).replace('…', list);
    return t[0].toUpperCase() + t.slice(1);
  });
  function ask() {
    if (!round || !ready || !live || !seat) return;
    lastCode = requestCode(frame, slots.map(asSent));
    play({ op: lastCode }, seat);
  }
  // a try that wasn't right yet: which line and part
  let triesSeen = 0;
  $effect(() => {
    const n = s.tries;
    if (n > triesSeen && round && lastCode && !sent) {
      const c = requestCheck(round, lastCode);
      if (c) {
        off = { slot: c.slot, part: c.part === 'many' && !right[c.slot]?.many ? 'one' : c.part };
        at = Math.min(c.slot, slots.length - 1);
        say(tr(`shOff.${off.part as 'word'}`, { n: c.slot + 1 }), 2400);
      }
    }
    triesSeen = n;
  });

  // ---- the shop: the basket, わたす
  const inBasket = $derived(round ? round.shelf.map((p, k) => ({ p, k, n: s.basket[k] })).filter((x) => x.n > 0) : []);
  /** Pictures that didn't load: the thing's Japanese instead (never its English). */
  let broken = $state<number[]>([]);
  function payNote(): string {
    if (!round) return '';
    const want = new Map(round.lines.map((l) => [round.shelf.indexOf(PICTURES.findIndex((p) => p.w === l.w)), l.n]));
    if (s.basket.some((n, k) => n > 0 && !want.has(k))) return tr('shExtra');
    if ([...want.keys()].some((k) => s.basket[k] === 0)) return tr('shMissing');
    return tr('shCount');
  }
  function pay() {
    if (!live || !seat || !round) return;
    const all = basketRight(s) === round.lines.length && inBasket.length === round.lines.length;
    if (!all) say(payNote(), 2000);
    play({ op: 'pay' }, seat);
  }

  // ---- notes: a round over (how it went)
  const note = flashNote(), say = note.say;
  let resultsSeen = -1;
  $effect(() => {
    const n = s.results.length;
    const last = s.results.at(-1);
    if (resultsSeen >= 0 && n > resultsSeen && last) say(last.right === last.of ? tr('shDone') : tr('shPart', { n: last.right, of: last.of }), 2000);
    resultsSeen = n;
  });

  // ---- online: the step's timer (the list sent as written, then the round's end), the seats one after another
  $effect(() => {
    if (mode !== 'online' || !seat || !live || !round) return;
    const st = stage, wait = (sent ? fillMs : askMs) + seatIdx * 1500;
    const id = setTimeout(() => play(stagePlay(st)), wait);
    return () => clearTimeout(id);
  });
  const request = $derived(shopRequest(s));
</script>

<div class="sh" data-sg-shop={s.r} data-sg-shop-role={role}>
  {#if note.text}<Nudge text={note.text} />{/if}
  {#if round}
    <div class="head">
      <span class="tag" data-sg-shop-round>{tr('shRound', { n: s.r + 1, of: s.rounds.length })}</span>
      {#if role === 'ask'}<span class="tag rolet give">{tr('shAsker')}</span><b class="title">{round.title}</b>{:else if role === 'shop'}<span class="tag rolet">{tr('shShop')}</span>{/if}
    </div>
    {#if role === 'ask'}
      <ol class="list" style:--cols={round.lines.length}>
        {#each round.lines as l, i (i)}
          <li><button type="button" class="line" class:on={i === at} class:off={off?.slot === i} aria-pressed={i === at} data-sfx="tick" data-sg-shop-slot={i} onclick={() => (at = i)}>
            <span class="ja">{lineJa(round, l)}</span>
          </button></li>
        {/each}
      </ol>
      <p class="say" lang="en" data-sg-shop-preview={previewText}>{previewText}</p>
      {#if level > 1}
        <div class="row tight" role="radiogroup" aria-label={tr('shFrame')}>
          {#each FRAME_CHIPS as f, k (k)}<button type="button" class="chip" role="radio" aria-checked={frame === k} data-sfx="tick" data-sg-shop-frame={k} onclick={() => (frame = k)} lang="en">{f}</button>{/each}
        </div>
        <div class="row tight" role="radiogroup" aria-label={tr('shNumber')}>
          {#each NUM as w, k (k)}<button type="button" class="chip" role="radio" aria-checked={slots[at]?.n === k + 1} disabled={!live} data-sfx="tick" data-sg-shop-n={k + 1} onclick={() => set({ n: k + 1 })} lang="en">{w}</button>{/each}
          <button type="button" class="chip" aria-pressed={slots[at]?.many ?? false} aria-label={tr('shMany')} disabled={!live} data-sfx="tick" data-sg-shop-many onclick={() => set({ many: !slots[at]?.many })}>＋s</button>
        </div>
        {#if level >= 3}
          <div class="row" role="radiogroup" aria-label={tr('shBox')}>
            <button type="button" class="chip" role="radio" aria-checked={slots[at]?.box === -1} disabled={!live} data-sfx="tick" data-sg-shop-box="-1" onclick={() => set({ box: -1 })}>{tr('shNoBox')}</button>
            {#each BOXES as b, k (b)}<button type="button" class="chip" role="radio" aria-checked={slots[at]?.box === k} disabled={!live} data-sfx="tick" data-sg-shop-box={b} onclick={() => set({ box: k })} lang="en">{b}</button>{/each}
          </div>
        {/if}
      {/if}
      <div class="row words" role="radiogroup" aria-label={tr('shThing')}>
        {#each round.words as w, k (w)}<button type="button" class="chip big" role="radio" aria-checked={slots[at]?.word === k} disabled={!live} data-sfx="tick" data-sg-shop-word={w} onclick={() => set({ word: k })} lang="en">{w}</button>{/each}
      </div>
      <button type="button" class="btn" disabled={!live || !ready} data-sfx="confirm" data-sg-shop-ask onclick={ask}>{tr('shAsk')}</button>
    {:else if role === 'wait'}
      <div class="who"><Avatar person={round.asker} worn size={32} /><p class="note">{tr('shWriting', { name: nameOf(round.asker) })}</p></div>
    {:else}
      <div class="req">
        <Avatar person={round.asker} worn size={32} />
        <div>
          {#if s.shown && s.frame === null}<span class="tag">{s.tries >= 2 ? tr('answer') : tr('shArrived')}</span>{/if}
          <p lang="en" data-sg-shop-request={request}>{request}</p>
        </div>
      </div>
      {#if role === 'shop'}<p class="note centre">{tr('shPick')}</p>{:else}<p class="note centre">{tr('shFilling')}</p>{/if}
      <div class="shelf" inert={role !== 'shop'}>
        {#each round.shelf as p, k (k)}
          <button type="button" class="cell" disabled={!live} data-sfx="tick" data-sg-shelf={PICTURES[p].w} onclick={() => seat && play({ k }, seat)}>
            {#if broken.includes(p)}<span class="cja">{PICTURES[p].ja}</span>
            {:else}<img src={pictureSrc(PICTURES[p])} alt="" width="40" height="40" referrerpolicy="no-referrer" onerror={() => (broken = [...broken, p])} />{/if}
            {#if s.basket[k]}<span class="n">{s.basket[k]}</span>{/if}
          </button>
        {/each}
      </div>
      <div class="basket" data-sg-basket={inBasket.map((x) => `${PICTURES[x.p].w}:${x.n}`).join(' ')}>
        <span class="bl">{tr('shBasket')}</span>
        {#if !inBasket.length}<span class="note">{tr('shEmpty')}</span>{/if}
        {#each inBasket as x (x.k)}
          <span class="got">
            {#if broken.includes(x.p)}<span class="cja">{PICTURES[x.p].ja}</span>{:else}<img src={pictureSrc(PICTURES[x.p])} alt="" width="24" height="24" referrerpolicy="no-referrer" />{/if}
            <b>×{x.n}</b>
            {#if role === 'shop'}<button type="button" class="out" aria-label={tr('shOut')} disabled={!live} data-sfx="back" data-sg-shop-out={PICTURES[x.p].w} onclick={() => seat && play({ k: x.k, op: 'out' }, seat)}>−</button>{/if}
          </span>
        {/each}
      </div>
      {#if role === 'shop'}<button type="button" class="btn" disabled={!live || !inBasket.length} data-sfx="confirm" data-sg-shop-pay onclick={pay}>{tr('shPay')}</button>{/if}
    {/if}
  {/if}
</div>

<style>
  .sh { display: flex; flex-direction: column; gap: 8px; }
  .sh > :global(*) { flex-shrink: 0; }
  .head { display: flex; align-items: center; gap: 6px; }
  .rolet { background: color-mix(in srgb, var(--c-sky) 35%, var(--c-cream)); color: var(--c-ink); }
  .rolet.give { background: color-mix(in srgb, var(--c-rose) 40%, var(--c-cream)); }
  .title { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--text-soft); }
  /* the list: a line each, side by side (the line being built sky, one to look at again yuzu) */
  .list { display: grid; grid-template-columns: repeat(var(--cols), 1fr); gap: 6px; margin: 0; padding: 0; list-style: none; }
  .line { display: grid; place-items: center; width: 100%; min-height: 48px; margin: 0 0 3px; padding: 4px; appearance: none; border: 0; border-radius: 14px; cursor: pointer;
    background: var(--c-card); box-shadow: var(--sh-ctl); color: var(--c-ink); text-align: center; -webkit-tap-highlight-color: transparent; }
  .line.on { background: color-mix(in srgb, var(--c-sky) 40%, var(--c-card)); }
  .line.off { background: color-mix(in srgb, var(--c-yuzu) 60%, var(--c-card)); }
  .line .ja { font: 700 15px/1.25 var(--font-ui); text-wrap: balance; }
  .say { margin: 0; font: 600 16px/1.35 var(--font-body); color: var(--c-ink); text-align: center; text-wrap: pretty; }
  .row { display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 6px; }
  .row .chip { padding: 0 10px; }
  .row.tight { gap: 8px 4px; }
  .row.tight .chip { padding: 0 8px; font-size: 13px; }
  .row.words .chip { padding: 0 12px; font: 600 16px/1 var(--font-body); }
  .btn { margin: 0; min-height: 48px; }
  .who { display: flex; align-items: center; gap: 8px; justify-content: center; padding: 8px 0; }
  .note { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); text-wrap: pretty; }
  .centre { text-align: center; }
  .req { display: flex; align-items: flex-end; gap: 6px; }
  .req p { margin: 2px 0 0; padding: 8px 12px; border-radius: 16px; border-bottom-left-radius: 4px; background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge);
    font: 600 17px/1.35 var(--font-body); color: var(--c-ink); text-wrap: pretty; }
  .shelf { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .cell { position: relative; display: grid; place-items: center; min-height: 56px; margin: 0 0 3px; padding: 0; appearance: none; border: 0; cursor: pointer; border-radius: 16px;
    background: var(--c-card); box-shadow: var(--sh-ctl); touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
  .cell:active:not(:disabled) { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .cell img { object-fit: contain; }
  .cell .n { position: absolute; top: 4px; right: 6px; min-width: 22px; height: 22px; display: grid; place-items: center; border-radius: 11px;
    background: var(--c-leaf); color: var(--c-cream); font: 700 13px/1 var(--font-num); }
  .cja { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink); padding: 0 6px; }
  .basket { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; min-height: 48px; padding: 2px 8px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 22%, transparent); }
  .bl { font: 700 var(--fs-s)/1 var(--font-ui); color: var(--text-soft); }
  .got { display: inline-flex; align-items: center; gap: 4px; padding-left: 8px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); min-height: 44px; }
  .got b { font: 600 15px/1 var(--font-num); color: var(--c-ink); padding-right: 4px; }
  .got img { object-fit: contain; }
  .out { width: 44px; height: 44px; margin: 0; padding: 0; appearance: none; border: 0; border-radius: 50%; cursor: pointer; background: none; color: var(--c-ink); font: 700 22px/1 var(--font-num); }
</style>
