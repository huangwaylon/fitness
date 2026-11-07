<script lang="ts">
  // A round of すうじ ラッシュ (docs/curriculum-wave2.md §2.4; games/rush/def.ts), its own chunk, in the round's frame
  // (frame/RoundFrame.svelte: the players' chips, the 8 s bar, the status line, つぎへ / よみおわった). A customer steps up
  // to the counter (Counter.svelte: the sign, the combo meter, the line) and orders; the ticket's chips (frame/ChoiceGrid)
  // wait for the order's end, then one tap. 🔁 as often as wanted (a replay: the combo needs a first listen). Co-op
  // 「ふたつの レジ」: the customers alternate, mine take my tap, the partner's I hear along (this phone passes for me).
  // The reveal: ○ / × (+ the points against my ear), the combo, the right chip (○) and the pick (×), the one said before
  // a correction marked, what the customer said and its Japanese, the trap's note and 解説. A miss never ends the run:
  // the customer says it again.
  import Note from '../frame/Note.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { PASS, type RushCard } from '#lib/kikimimi/games/rush/def.ts';
  import { firstListen } from '#lib/kikimimi/score.ts';
  import { authoredPick, comboNow, hear, myTurn, othersAt, ptsFor, roundFor, servedAt } from './board.ts';
  import { isCoop } from '../listenView.ts';
  import Counter from './Counter.svelte';
  import RoundFrame from '../frame/RoundFrame.svelte';
  import RevealFrame from '../frame/RevealFrame.svelte';
  import ChoiceGrid from '../frame/ChoiceGrid.svelte';
  import Why from '../frame/Why.svelte';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const cards = $derived(game.items as RushCard[]);
  const it = $derived(cards[v.i] as RushCard | undefined);
  const reveal = $derived(v.phase === 'reveal');
  const coop = $derived(isCoop(v));
  const turn = $derived(myTurn(v, game.me, v.i));
  const round = $derived(it ? roundFor(v, it) : null);
  /** My chips: the authored ones my tier shows, their Japanese. */
  const chips = $derived(it && round ? round.map.map((k) => it.choices[k]) : []);
  /** Each chip's Japanese at the reveal, only where it reads otherwise (14ドル50セント under $14.50). */
  const cja = $derived(it?.cja && round ? round.map.map((k) => (it.cja![k] !== it.choices[k] ? it.cja![k] : '')) : undefined);
  const sent = $derived(v.answers[v.i] ?? null);
  const mine = $derived(sent && sent.k !== PASS ? sent.k : null);
  /** The chips take a tap: my customer, the answer window, not answered, not sat out. */
  const open = $derived(turn && v.phase === 'answer' && !sent && !v.out);

  // the partner's customer: this phone passes for me as its answers open
  $effect(() => {
    if (coop && !turn && v.phase === 'answer' && !sent && !v.out) game.answer(PASS);
  });
  // the others' picks as each reveal shows them (the combo and the line read them after)
  $effect(() => hear(v, game.me));

  /** The register's pick at the reveal, on my chips: mine, or the partner's (their chip as authored, if I have it). */
  const partner = $derived(reveal && it && !turn ? (othersAt(v, game.me, v.i) ?? [])[0] : undefined);
  const shownPick = $derived.by(() => {
    if (!round || !it) return null;
    if (turn) return mine;
    const k = partner ? authoredPick(v, it, partner.k, partner.who) : null;
    return k === null ? null : round.map.indexOf(k) >= 0 ? round.map.indexOf(k) : null;
  });
  const right = $derived(turn ? mine !== null && mine === round?.answer : !!partner?.ok);
  const answered = $derived(turn ? mine !== null : !!partner);
  const verdict = $derived(v.out ? 'out' : right ? 'right' : answered ? 'wrong' : 'none');
  const served = $derived(cards.map((_, k) => servedAt(v, cards, game.me, k)));
  const turns = $derived(cards.map((_, k) => myTurn(v, game.me, k)));
  const combo = $derived(comboNow(v, cards, game.me));
  /** The chip said before a correction, on my chips (marked at the reveal). */
  const wasAt = $derived(it?.rush.was !== undefined && round ? round.map.indexOf(it.rush.was) : -1);

  // a miss: the customer says it again (once, at the reveal)
  let repeated = $state('');
  const key = $derived(`${v.g}:${v.i}`);
  $effect(() => {
    if (!reveal || right || v.out || !v.speaks || !it || repeated === key) return;
    repeated = key;
    game.replay(false);
  });

  const canHear = $derived(v.speaks && !v.out && (v.phase === 'answer' || reveal));
  const bar = $derived.by(() => {
    const s = game.sounding;
    if (s && (s.i === v.i || s.i === -1)) return { from: s.from, until: s.until, key: `r${s.from}` };
    if (v.phase === 'play') return { from: v.playAt, until: v.playEnd, key: `p${v.i}:${v.playAt}` };
    return null;
  });
</script>

{#if it && round}
{#snippet stage()}
  <div class="stage">
    <Counter {it} i={v.i} {served} mine={turns} {combo} {bar} now={game.now} pop={v.phase === 'lead'} {reveal} {right} out={v.out} />
    {#if it.ctx && !reveal}<p class="ctx" data-kiki-ctx>{it.ctx}</p>{/if}
    {#if (v.speaks || game.listenOnly) && !v.out}
      <div class="hear">
        <button type="button" class="btn small paper" data-kiki-replay aria-disabled={!canHear} data-sfx="tick" onclick={() => canHear && game.replay(false)}>🔁 {t('kiki.replay')}</button>
        {#if game.listenOnly}<small class="hint" data-kiki-host-plays>{t('kiki.replayHost')}</small>{/if}
      </div>
    {/if}
  </div>
{/snippet}

{#snippet comboLine()}
  {#if combo >= 2}<span class="combo-now" data-kiki-rush-combo-now={combo}>{t('kiki.rush.combo', { n: combo })}</span>{/if}
  {#if !right && !v.out}<span class="again kana" data-kiki-rush-again>{t('kiki.rush.again')}</span>{/if}
{/snippet}

{#snippet input()}
  {#if reveal}
    <RevealFrame out={v.out} {right} picked={answered} pts={turn ? ptsFor(v, it) : 0} badge={turn && firstListen(right, !!sent?.rp, v.same)} coop={false} rightNow={0} extra={v.out ? undefined : comboLine} />
  {/if}
  {#if coop && !v.out}
    <p class="register" class:theirs={!turn} data-kiki-rush-register={turn ? 'mine' : 'theirs'}>{turn ? t('kiki.rush.mine') : t('kiki.rush.theirs')}</p>
  {/if}

  {#if !v.out}
    <section class="ticket obj-cream" aria-labelledby="kk-rush-ask" data-kiki-rush-ticket>
      <h3 id="kk-rush-ask" class="ask"><span class="tag">🧾 {t('kiki.rush.ticket')}</span>{it.rush.ask}</h3>
      {#if !reveal}
        <p class="hint-line">{!turn ? t('kiki.rush.watch') : v.phase === 'answer' ? t('kiki.rush.pick') : t('kiki.rush.listen')}</p>
      {/if}
      <ChoiceGrid choices={chips} right={round.answer} english={false} ja={cja} {open} {reveal} dim={!open && !reveal} picked={shownPick} onpick={(k) => game.answer(k)} />
      {#if reveal && wasAt >= 0 && wasAt !== shownPick}<p class="was" data-kiki-rush-was>{t('kiki.rush.was')}: {chips[wasAt]}</p>{/if}
      {#if reveal && !turn && partner}<p class="was" data-kiki-rush-partner>{t('kiki.rush.partner', { a: shownPick !== null ? chips[shownPick] : '—' })}</p>{/if}
    </section>
  {/if}

  {#if reveal && !v.out}
    {#if it.note}<Note text={it.note} />{/if}
    {#if it.why}<Why text={it.why} />{/if}
  {/if}
{/snippet}

<RoundFrame {v} now={game.now} me={game.me} type="rush" answered={turn && !!sent} {verdict} {stage} {input} onnext={() => game.next()} onready={() => game.ready()} />
{/if}

<style>
  .stage { display: grid; gap: 8px; }
  .ctx { margin: 0; text-align: center; font: 700 var(--fs-s)/1.45 var(--font-ui); color: var(--text-soft); }
  .hear { display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px; }
  .hint { font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .register { justify-self: center; margin: 0; padding: 4px 14px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-leaf) 35%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.3 var(--font-ui); }
  .register.theirs { background: transparent; box-shadow: inset 0 0 0 2px var(--edge); color: var(--text-soft); }
  /* the ticket: a cream slip with its question on top, the chips under it */
  .ticket { display: grid; gap: 8px; padding: 10px 12px 12px; border-radius: 18px; background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .ask { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 10px; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .tag { font: 700 var(--fs-s)/1.2 var(--font-ui); color: var(--c-ink-soft); }
  .hint-line { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); }
  .was { margin: 0; font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--c-ink-soft); }
  .combo-now { padding: 4px 12px; border-radius: var(--r-pill); background: color-mix(in srgb, var(--c-yuzu) 45%, var(--card)); color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .again { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
</style>
