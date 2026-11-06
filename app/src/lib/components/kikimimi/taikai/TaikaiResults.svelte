<script lang="ts">
  // しずえの しゅうまつ たいかい's results (docs/kikimimi-ux.md §7.1; curriculum §7.1), its own chunk over the quiz's
  // (Results: the team's tally or しょうぶ's ranking by points and chips, my feedback, the review list of what was missed):
  // the trophy on top, bronze / silver / gold by the team's rounds against しずえ's target (the same on every phone), her
  // line on it, the wager's outcome, and where the trophy went (きろく's shelf).
  import Results from '../Results.svelte';
  import type { QuizGame } from '../game.svelte.ts';
  import { chipsAfter } from '#lib/kikimimi/games/taikai/def.ts';
  import { taikaiOutcome } from '#lib/kikimimi/games/taikai/source.ts';
  import { MEDAL } from '../look.ts';
  import { t } from '#lib/i18n/index.ts';

  let { game, onagain, onmissed, ondone }: { game: QuizGame; onagain: () => void; onmissed: () => void; ondone: () => void } = $props();
  const v = $derived(game.view);
  const out = $derived(taikaiOutcome(v.seed, v.ids, v.tiers, v.team.right));
  /** My wager: its bet and the chips after (none: no bet given). */
  const wager = $derived.by(() => {
    const a = v.answers[v.n - 1], it = game.items[v.n - 1];
    return a?.bet && it ? { bet: a.bet, after: chipsAfter({ bet: a.bet, ok: a.k === it.answer }) } : null;
  });
</script>

{#snippet trophy()}
  <section class="trophy card obj-cream {out.trophy}" data-kiki-trophy={out.trophy} data-kiki-taikai-score={v.team.right}>
    <span class="medal" aria-hidden="true">{MEDAL[out.trophy]}</span>
    <b>{t(`kiki.trophy.${out.trophy}`)}</b>
    <p class="goal">{t('kiki.taikai.target', { k: out.target.silver })}・{t('kiki.taikai.gold', { k: out.target.gold })}</p>
    {#if wager}<p class="wager" data-kiki-wager-result={wager.after}>🪙 {t('kiki.taikai.wagerLine', { bet: wager.bet, n: wager.after })}</p>{/if}
    <small>{t('kiki.taikai.shelf')}</small>
  </section>
{/snippet}

<Results {game} {onagain} {onmissed} {ondone} hostLine={t(`kiki.taikai.host.${out.trophy}`)} extra={trophy} />

<style>
  .trophy { display: grid; justify-items: center; gap: 4px; padding: 14px; text-align: center; }
  .trophy p { margin: 0; font: 700 var(--fs-body)/1.35 var(--font-ui); }
  .trophy .goal, .trophy small { font: 700 var(--fs-s)/1.35 var(--font-ui); color: var(--text-soft); }
  .trophy b { font: 700 var(--fs-title)/1.2 var(--font-ui); }
  /* the trophy's card: a cream-based tint at any time of day (the tournament is at 20:00: night is its usual case), so
     its text is the day ink (.obj-cream) */
  .trophy.gold { background: color-mix(in srgb, var(--c-yuzu) 45%, var(--c-card)); }
  .trophy.silver { background: color-mix(in srgb, var(--c-mint) 30%, var(--c-card)); }
  .trophy.bronze { background: color-mix(in srgb, var(--c-coral) 16%, var(--c-card)); }
  .medal { font-size: 64px; line-height: 1; animation: award 640ms var(--ease-bounce) both; }
  @keyframes award { from { transform: translateY(-30px) scale(1.6) rotate(-20deg); opacity: 0; } 60% { opacity: 1; } to { transform: none; } }
  @media (prefers-reduced-motion: reduce) { .medal { animation: none; } }
</style>
