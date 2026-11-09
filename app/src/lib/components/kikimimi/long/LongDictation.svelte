<script lang="ts">
  // まるごと 聞く's dictation at the results (docs/kikimimi.md "まるごと 聞く"): a line or two of the piece near my misses
  // (games/long/def.ts dictFor), one at a time: ▶︎ plays the line (as often as wanted: the row's `rp`), its English with
  // the words to write blanked; typed and matched as 音の へんしん's are (henshin/match.ts: case, punctuation, contractions
  // and reduced spellings forgiven, never a near spelling), or tapped from tiles (this phone's choice, as the drill's);
  // できた grades it: ○ / ×, the words said, mine, the line's Japanese. Each answer a dictation row's (dictRow): the
  // results write them together once the last is done (QuizGame.keepMore). Nothing on the wire.
  import { dictBoard, dictRow, dictWords, type LongCard } from '#lib/kikimimi/games/long/def.ts';
  import type { LongDict } from '#lib/kikimimi/listen.ts';
  import type { Tier } from '#lib/kikimimi/lesson.ts';
  import { matchTyped } from '#lib/kikimimi/games/henshin/match.ts';
  import { EMPTY } from '#lib/kikimimi/games/listened.ts';
  import { keepTiles, tilesOn } from '../henshin/round.ts';
  import HearButton from '../frame/HearButton.svelte';
  import Mark from '../../ui/Mark.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { piece, dicts, tier, missed, canHear, onhear, ondone }: {
    piece: LongCard;
    dicts: readonly LongDict[];
    tier: Tier | undefined;
    /** Picked near my misses (else near the end: all right). */
    missed: boolean;
    canHear: boolean;
    onhear: (line: number) => void;
    ondone: (rows: [string, 0 | 1, number, number][], ok: boolean[][]) => void;
  } = $props();

  let at = $state(0);
  let tiles = $state(tilesOn());
  let typed = $state('');
  let placed = $state<number[]>([]);
  let replays = $state(0);
  /** Each line's answer once sent: its words right, what I wrote. */
  let done = $state<{ ok: boolean[]; mine: string; rp: number }[]>([]);
  const d = $derived(dicts[at]);
  const words = $derived(d ? dictWords(d) : []);
  const board = $derived(d ? dictBoard(piece.long.of, d, tier) : []);
  const line = $derived(d ? piece.lines![d.line] : null);
  const result = $derived(done[at] ?? null);
  const slots = $derived(placed.length === words.length ? placed : words.map(() => EMPTY));
  const canSend = $derived(!result && (tiles ? slots.every((x) => x !== EMPTY) : typed.trim().length > 0));
  /** The line around its blank. */
  const split = $derived.by(() => {
    if (!line || !d) return null;
    const k = line.en.indexOf(d.words);
    return k < 0 ? null : [line.en.slice(0, k), line.en.slice(k + d.words.length)];
  });

  function hear() {
    if (!d || !canHear) return;
    if (!result) replays++;
    onhear(d.line);
  }
  function place(k: number) {
    if (result || slots.includes(k)) return;
    const j = slots.indexOf(EMPTY);
    if (j >= 0) placed = slots.map((x, i) => (i === j ? k : x));
  }
  const unplace = (j: number) => !result && (placed = slots.map((x, i) => (i === j ? EMPTY : x)));
  function swap() {
    tiles = !tiles;
    keepTiles(tiles);
  }
  function send() {
    if (!canSend) return;
    const ok = tiles ? words.map((w, j) => board[slots[j]] === w) : matchTyped(typed, words);
    const mine = tiles ? slots.map((x) => board[x] ?? '').join(' ') : typed.trim();
    done = [...done, { ok, mine, rp: replays }];
    const rows = done.map((x, j) => dictRow(piece.long.of, dicts[j], x.ok, x.rp));
    if (done.length === dicts.length) ondone(rows, done.map((x) => x.ok));
  }
  function next() {
    at++;
    typed = '';
    placed = [];
    replays = 0;
  }
</script>

{#if d && line}
<div class="dict" data-kiki-long-dict={at}>
  <div class="dh">
    <span class="of">{t('kiki.long.dictOf', { k: at + 1, n: dicts.length })}</span>
    {#if canHear}<HearButton label={t('kiki.long.hearLine')} data-kiki-long-dict-hear onclick={hear} />{/if}
  </div>
  {#if at === 0}<p class="hint">{t(missed ? 'kiki.long.dictMissed' : 'kiki.long.dictAll')}</p>{/if}
  <p class="line" lang="en" data-kiki-long-dict-line={d.line}>
    {#if result}{line.en}{:else if split}{split[0]}<span class="blank"><span aria-hidden="true">{'＿'.repeat(Math.min(8, words.length * 2))}</span><span class="sr-only">{t('kiki.blank')}</span></span>{split[1]}{/if}
  </p>
  {#if !result}
    <p class="ask">{t('kiki.long.askType', { n: words.length })}</p>
    {#if tiles}
      <div class="slots" data-kiki-long-slots>
        {#each slots as x, j (j)}
          <button type="button" class="slot tile-btn" data-slot={j} data-sfx="tick" onclick={() => unplace(j)}>{x === EMPTY ? '　' : board[x]}</button>
        {/each}
      </div>
      <div class="board" data-kiki-long-board>
        {#each board as w, k (k)}
          <button type="button" class="tile tile-btn" lang="en" data-tile={k} aria-disabled={slots.includes(k)} data-sfx="tick" onclick={() => place(k)}>{w}</button>
        {/each}
      </div>
    {:else}
      <input class="typed" type="text" data-sfx="none" lang="en" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder={t('kiki.long.placeholder')} data-kiki-long-typed bind:value={typed}
        onkeydown={(e) => e.key === 'Enter' && send()} />
    {/if}
    <div class="foot">
      <button type="button" class="btn small paper" data-kiki-long-swap data-sfx="tick" onclick={swap}>{t(tiles ? 'kiki.long.keys' : 'kiki.long.tiles')}</button>
      <button type="button" class="btn green" data-kiki-long-send aria-disabled={!canSend} data-sfx="tick" onclick={send}>{t('kiki.long.send')}</button>
    </div>
  {:else}
    {@const right = result.ok.every(Boolean)}
    <p class="verdict" data-kiki-long-dict-verdict={right ? 'right' : 'wrong'}><span class="mk" aria-hidden="true"><Mark id={right ? 'sparkle' : 'sweat'} /></span> {t(right ? 'kiki.long.right' : 'kiki.long.wrong')}</p>
    <p class="said">{t('kiki.long.said', { w: d.words })}</p>
    {#if !right}<p class="mine">{t('kiki.long.mine', { a: result.mine })}</p>{/if}
    <p class="ja">{line.ja}</p>
    {#if at < dicts.length - 1}<button type="button" class="btn green" data-kiki-long-dict-next data-sfx="tick" onclick={next}>{t('kiki.next')}</button>
    {:else}<p class="done" data-kiki-long-dict-done>{t('kiki.long.dictDone')}</p>{/if}
  {/if}
</div>
{/if}

<style>
  .dict { display: grid; gap: 8px; }
  .dh { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
  .of { font: 700 var(--fs-s)/1.4 var(--font-num); color: var(--text-soft); }
  .hint, .ask, .said, .mine, .done { margin: 0; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .mine { color: var(--coral-text); }
  .line { margin: 0; font: 600 var(--fs-body)/1.6 var(--font-ui); }
  .blank { border-bottom: 2px solid var(--text); padding: 0 2px; }
  .slots, .board { display: flex; flex-wrap: wrap; gap: 6px; }
  .slot { min-width: 56px; min-height: var(--hit); padding: 4px 10px; border-radius: 12px; border: 2px dashed var(--text-soft); font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .tile { min-height: var(--hit); padding: 4px 12px; border-radius: 12px; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .tile[aria-disabled='true'] { opacity: .35; }
  .typed { width: 100%; min-height: var(--hit); padding: 8px 12px; border-radius: 12px; border: 2px solid var(--c-edge); background: var(--c-card); color: var(--c-ink); font: 600 16px/1.4 var(--font-ui); }
  .foot { display: flex; justify-content: space-between; gap: 8px; }
  .verdict { margin: 0; display: flex; align-items: center; gap: 6px; font: 800 var(--fs-body)/1.4 var(--font-ui); }
  .mk { flex: none; display: inline-grid; width: 22px; height: 22px; }
  .mk :global(svg) { width: 100%; height: 100%; }
  .ja { margin: 0; font: 500 var(--fs-s)/1.5 var(--font-ui); color: var(--text-soft); word-break: normal; line-break: strict; }
</style>
