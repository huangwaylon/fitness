<script lang="ts">
  // An イベント turn (docs/sugoroku.md "Rules"): the card (its villager's head, the English with its key word marked,
  // the Japanese: むずかしい's on a tap), its effect's chip and OK. RULES '5', a card that only gave stars asks about its
  // key word (quiz.ts): やさしい / ふつう its Japanese from 3 / 4, むずかしい the gap's English from 4; a miss 「おしい！」
  // (that choice dimmed), a second 答えはこれ; then the English, the Japanese, its stars and 次へ. Never red, never ×.
  // The Japanese of a quiz card shows once it's answered. Online, the panel as it is goes to the others (view.ts).
  import { untrack } from 'svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Nudge from './Nudge.svelte';
  import TurnResult from './TurnResult.svelte';
  import { CARDS, type Card } from '../cards.ts';
  import { QUIZ_STARS, keyOf, quizLines, quizOf } from '../quiz.ts';
  import { stageOf, tries } from '../tries.svelte.ts';
  import type { Level } from '../game.ts';
  import type { EventView } from '../view.ts';
  import { s } from '../i18n.ts';

  interface Props {
    card: number;
    level: Level;
    /** The game's seed and step (the quiz's choices, the same on every phone). */
    seed: string;
    /** The game's rules ask a quiz on this card. */
    quiz: boolean;
    misses0?: number;
    ontry: (misses: number) => void;
    ondone: (misses: number) => void;
    onview?: (v: EventView) => void;
    mirror?: EventView | null;
  }
  let { card, level, seed, quiz, misses0 = 0, ontry, ondone, onview, mirror = null }: Props = $props();

  const c = $derived<Card>(CARDS[card]);
  const q = $derived(quiz ? quizOf(card, level, seed) : null);
  let v = $state<EventView>(untrack(() => ({ ja: false, ...(quiz ? { quiz: { tried: [], stage: stageOf(misses0), misses: misses0 } } : {}) })));
  const two = tries(() => v.quiz!);
  $effect(() => two.stop);
  const stage = $derived(v.quiz?.stage ?? 'try');
  const answered = $derived(stage === 'right' || stage === 'answer');

  function pick(k: number) {
    if (!q || !v.quiz || stage !== 'try' || v.quiz.tried.includes(k)) return;
    if (k === q.answer) v.quiz.stage = 'right';
    else (v.quiz.tried.push(k), two.miss(ontry, () => {}));
  }
  /** A card's effect as its chip says it. */
  function effectOf(x: Card): string {
    if (x.stars) return s('effStars', { n: x.stars });
    if (x.gift) return s('effGift', { n: x.gift });
    if (x.move) return s('effMove', { n: x.move });
    if (x.again) return s('effAgain');
    return '';
  }
  const parts = (en: string) => en.split(/(\*[^*]+\*|___)/g).filter(Boolean).map((t) => ({ t: t.replace(/\*/g, ''), key: t.startsWith('*'), gap: t === '___' }));
  const lines = $derived(q ? quizLines(c) : { en: c.en, ja: c.ja });
  const shownEn = $derived(q && !answered ? q.en : lines.en);
  // online: the card as it is, sent (my turn), or the player's shown (another's)
  $effect(() => void onview?.($state.snapshot(v)));
  $effect.pre(() => {
    const m = mirror;
    if (m) untrack(() => (v = { ja: m.ja, ...(quiz && m.quiz ? { quiz: { ...m.quiz, tried: m.quiz.tried.filter((k) => k >= 0 && k < (q?.choices.length ?? 0)) } } : quiz ? { quiz: v.quiz } : {}) }));
  });
</script>

<div class="event" data-sg-event={card} data-sg-quiz={q?.kind} data-sg-stage={q ? stage : undefined}>
  <span class="tagrow">{#if c.who}<Avatar person="G" villager={c.who} size={32} />{/if}<span class="tag">{s('eventTitle')}</span></span>
  <p class="en" lang="en">{#each parts(shownEn) as part, i (i)}{#if part.key}<b>{part.t}</b>{:else if part.gap}<b class="gap" aria-label={s('quizGap')}>＿＿＿</b>{:else}{part.t}{/if}{/each}</p>
  {#if q && !answered}
    {#if v.quiz?.misses && stage === 'miss'}<Nudge text={s('quizMiss')} />{/if}
    <p class="ask">{q.kind === 'meaning' ? s('quizMeaning', { w: keyOf(c) }) : s('quizCloze')}</p>
    <div class="choices" lang={q.kind === 'cloze' ? 'en' : 'ja'}>
      {#each q.choices as ch, k (ch)}
        <button type="button" class="sg-wt" disabled={v.quiz?.tried.includes(k) || stage !== 'try'} data-sfx="tick" data-sg-quiz-choice={ch} data-right={k === q.answer ? '' : undefined} onclick={() => pick(k)}>{ch}</button>
      {/each}
    </div>
  {:else if q}
    <p class="ja">{lines.ja}</p>
    <TurnResult answer={stage === 'answer'} text={`${keyOf(c)} = ${c.kw}`} stars={QUIZ_STARS[Math.min(v.quiz?.misses ?? 0, 2)]} kind="line" onnext={() => ondone(v.quiz?.misses ?? 0)} />
  {:else}
    {#if level < 3 || v.ja}<p class="ja">{c.ja}</p>
    {:else}<button type="button" class="chip big" data-sfx="tick" data-sg-card-ja onclick={() => (v.ja = true)}>{s('peek')}</button>{/if}
    <div class="actrow">
      <span class="chip-eff" data-sg-effect>{effectOf(c)}</span>
      <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => ondone(0)}>{s('ok')}</button>
    </div>
  {/if}
</div>

<style>
  .event { display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; }
  .tagrow { display: flex; align-items: center; gap: 6px; height: 32px; align-self: flex-start; }
  .en { margin: 0; font: 500 20px/1.35 var(--font-body); text-wrap: pretty; }
  .en b { background: color-mix(in srgb, var(--c-yuzu) 60%, transparent); border-radius: 4px; padding: 0 2px; }
  .en .gap { background: color-mix(in srgb, var(--c-edge) 25%, transparent); color: var(--text-soft); }
  .ja { margin: 0; font-size: var(--fs-s); line-height: 18px; color: var(--text-soft); }
  .ask { margin: 0; font: 700 var(--fs-body)/1.4 var(--font-ui); color: var(--c-ink); }
  .choices { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .choices .sg-wt { padding: 0 14px; font-size: 18px; }
  .actrow { display: flex; align-items: center; gap: 8px; width: 100%; margin-top: 2px; }
  .chip-eff { flex: none; padding: 6px 12px; border-radius: var(--r-pill); background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .actrow .btn { flex: 1; min-width: 0; }
</style>
