<script lang="ts">
  // A round of しずえの しゅうまつ たいかい (docs/kikimimi-ux.md §7.1; curriculum §7.1), its own chunk over Play (the round
  // itself: the speaker, the clip, the choices): しずえ's show bar on top (the round, 「かけの もんだい」 last), co-op's team
  // against her target (a pip a round, filled as the team gets them; her line and gold's marked) or しょうぶ's chips; the
  // wager round's bet first (10-100 of the round's own 100 chips, never kept: no かいがら), its choices waiting for it;
  // its reveal the bet's outcome, a confident miss (a bet ≥ 70 missed) the big moment: the answer and my pick large,
  // しずえ's 「おしい！ これは わすれませんね」, and the clip once more.
  import { untrack } from 'svelte';
  import Play from '../Play.svelte';
  import Host from '../../characters/Host.svelte';
  import { isWager, type QuizGame } from '../game.svelte.ts';
  import { BETS, CHIPS, chipsAfter, wagerReveal } from '#lib/kikimimi/games/taikai/def.ts';
  import { taikaiOutcome } from '#lib/kikimimi/games/taikai/source.ts';
  import { PIC_JA, type Item } from '#lib/kikimimi/bank.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game }: { game: QuizGame } = $props();
  const v = $derived(game.view);
  const wager = $derived(isWager(v));
  const reveal = $derived(v.phase === 'reveal');
  const solo = $derived(v.players.length <= 1);
  /** しずえ's target for everyone's tiers (the same on every phone). */
  const target = $derived(taikaiOutcome(v.seed, v.ids, v.tiers, 0).target);
  const it = $derived<Item | undefined>(game.items[v.i]);
  const mine = $derived(v.answers[v.i] ?? null);
  const ok = $derived(!!mine && !!it && mine.k === it.answer);
  /** The wager's reveal: how it plays (def.ts wagerReveal), null outside it or with no bet. */
  const shown = $derived(wager && reveal && mine?.bet ? wagerReveal(mine.bet, ok) : null);
  /** My chips: the round's 100 till the wager's reveal, then won or lost. */
  const chips = $derived(wager && reveal ? chipsAfter(mine?.bet ? { bet: mine.bet, ok } : null) : CHIPS);
  const choice = (k: number) => (it ? (it.type === 'pic' ? (PIC_JA[it.choices[k]] ?? '') : it.choices[k]) : '');
  // a confident miss: the clip once more, a beat after the reveal's cue
  $effect(() => {
    if (shown !== 'confident-miss') return;
    const id = setTimeout(() => untrack(() => game.replay()), 900);
    return () => clearTimeout(id);
  });
</script>

{#snippet show()}
  <div class="show" data-kiki-taikai-bar data-kiki-wager-round={wager || undefined}>
    <span class="head" aria-hidden="true"><Host head size={34} animate={false} eager /></span>
    <span class="ttl"><small>{t('kiki.mode.taikai')}</small><b>{wager ? t('kiki.taikai.wagerRound') : t('kiki.taikai.round', { i: v.i + 1, n: v.n - 1 })}</b></span>
    {#if v.vs}
      <span class="chips" data-kiki-chips={chips}>🪙 {t('kiki.taikai.chips', { n: chips })}</span>
    {:else}
      <span class="score" data-kiki-team-right={v.team.right}>{t(solo ? 'kiki.taikai.meterSolo' : 'kiki.taikai.meter', { k: v.team.right })}</span>
    {/if}
  </div>
  {#if !v.vs}
    <div class="meter" data-kiki-meter={`${v.team.right}/${target.silver}/${target.gold}`}>
      <span class="pips" aria-hidden="true">
        {#each Array.from({ length: v.n }, (_, k) => k) as k (k)}
          <i class:on={k < v.team.right} class:line={k === target.silver - 1} class:gold={k === target.gold - 1}></i>
        {/each}
      </span>
      <small>{t('kiki.taikai.target', { k: target.silver })}・{t('kiki.taikai.gold', { k: target.gold })}</small>
    </div>
  {/if}
{/snippet}

{#snippet gate()}
  {#if wager && !reveal}
    {#if mine?.bet}
      <p class="bet done" data-kiki-bet-done={mine.bet}>🪙 {t('kiki.taikai.betDone', { n: mine.bet })}</p>
    {:else if !v.out}
      <div class="wager card" data-kiki-wager>
        <p class="q">🪙 {t('kiki.taikai.bet')}</p>
        <div class="bets" role="radiogroup" aria-label={t('kiki.taikai.bet')}>
          {#each BETS as b (b)}
            <button type="button" class="chip" role="radio" aria-checked={game.bet === b} data-kiki-bet={b} data-sfx="tick" onclick={() => game.setBet(b)}>{b}</button>
          {/each}
        </div>
        <small class="hint">{game.bet === null ? t('kiki.taikai.betFirst') : t('kiki.taikai.betPicked', { n: game.bet })}</small>
      </div>
    {/if}
  {:else if wager && reveal && !v.out}
    {#if shown}
      <div class="outcome card {shown}" data-kiki-wager-reveal={shown} aria-live="assertive">
        <p class="say"><span class="who" aria-hidden="true"><Host head size={30} animate={false} eager /></span>{t(`kiki.taikai.reveal.${shown}`)}</p>
        {#if shown === 'confident-miss' && it && mine}
          <p class="big"><small>{t('kiki.taikai.answer')}</small><b lang="en">{choice(it.answer)}</b></p>
          <p class="mine"><small>{t('kiki.taikai.yours')}</small><s lang="en">{choice(mine.k)}</s></p>
        {/if}
        <p class="delta" data-kiki-chips={chips}>🪙 {ok ? '+' : '−'}{mine!.bet} → {t('kiki.taikai.chips', { n: chips })}</p>
      </div>
    {:else}
      <p class="bet done" data-kiki-wager-reveal="none">🪙 {t('kiki.taikai.noBet')}</p>
    {/if}
  {/if}
{/snippet}

<Play {game} {show} {gate} />

<style>
  /* しずえ's show bar: her head, the round, the team's count (or my chips) */
  .show {
    display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: var(--r-pill);
    background: color-mix(in srgb, var(--c-yuzu) 50%, var(--c-card)); color: var(--c-ink); box-shadow: 0 var(--lip-h) 0 var(--c-lip);
  }
  .head { flex: none; line-height: 0; }
  .ttl { flex: 1; min-width: 0; display: grid; }
  .ttl small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--c-ink-soft); }
  .ttl b { font: 700 var(--fs-body)/1.25 var(--font-ui); }
  .score, .chips { flex: none; font: 700 var(--fs-body)/1 var(--font-num); }
  /* the team against しずえ's target: a pip a round, her line and gold's flagged */
  .meter { display: grid; justify-items: center; gap: 4px; padding-top: 12px; }
  .pips { display: flex; gap: 6px; }
  .pips i { position: relative; width: 22px; height: 10px; border-radius: var(--r-pill); background: var(--ctl-off); box-shadow: inset 0 0 0 1.5px var(--edge); }
  .pips i.on { background: var(--c-leaf); box-shadow: inset 0 0 0 1.5px var(--c-leaf-edge); }
  .pips i.line::after, .pips i.gold::after { position: absolute; left: 50%; top: -15px; translate: -50% 0; font-size: 11px; line-height: 1; }
  .pips i.line::after { content: '🥈'; }
  .pips i.gold::after { content: '🥇'; }
  .meter small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  /* the wager: the bet first */
  .wager { display: grid; gap: 8px; padding: 12px; justify-items: center; text-align: center; }
  .wager .q { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  .bets { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 6px; width: 100%; }
  .bets .chip { min-height: var(--hit); justify-content: center; font: 700 var(--fs-body)/1 var(--font-num); }
  .bets .chip[aria-checked='true'] { background: var(--c-yuzu); color: var(--c-ink); box-shadow: inset 0 0 0 2px var(--c-lip); }
  .hint { font: 700 var(--fs-s)/1.4 var(--font-ui); color: var(--text-soft); }
  .bet { margin: 0; text-align: center; font: 700 var(--fs-body)/1.4 var(--font-ui); }
  /* the wager's reveal: a confident miss large (coral), a confident right the cheer (leaf) */
  .outcome { display: grid; justify-items: center; gap: 6px; padding: 14px; text-align: center; animation: drop 480ms var(--ease-bounce) both; }
  .outcome p { margin: 0; }
  .say { display: inline-flex; align-items: center; gap: 8px; font: 700 var(--fs-talk)/1.35 var(--font-ui); }
  .who { flex: none; line-height: 0; }
  .outcome.confident-miss { background: color-mix(in srgb, var(--c-coral) 22%, var(--card)); box-shadow: var(--sh-lip), inset 0 0 0 3px var(--c-coral); }
  .outcome.confident-right { background: color-mix(in srgb, var(--c-leaf) 22%, var(--card)); box-shadow: var(--sh-lip), inset 0 0 0 3px var(--c-leaf); }
  .big { display: grid; gap: 2px; }
  .big b { font: 700 max(22px, var(--fs-title))/1.25 var(--font-ui); color: var(--leaf-text); }
  .mine { display: grid; gap: 2px; }
  .mine s { font: 700 var(--fs-body)/1.3 var(--font-ui); color: var(--coral-text); text-decoration-thickness: 2px; }
  .big small, .mine small { font: 700 var(--fs-xs)/1.2 var(--font-ui); color: var(--text-soft); }
  .delta { font: 700 var(--fs-body)/1.3 var(--font-num); }
  @keyframes drop { from { transform: translateY(-14px) scale(.92); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .outcome { animation: none; } }
</style>
