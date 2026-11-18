<script lang="ts">
  // 英語すごろく's 絵 turn (docs/sugoroku.md "Rules"): an everyday thing's picture (Noto Emoji), its Japanese beside it, its English name to
  // spell by the seat's level: やさしい taps one of three spellings; ふつう puts its letters in order, the first given;
  // むずかしい its letters with two more mixed in, none given. Right → its stars; not → 「おしい！」 and one
  // more go; a second miss → 「答えはこれ」. Never red, never ×. With the speaking step on (`speak`: game.ts speakOn, a
  // person's key), the answer is followed by 「この絵で一文言ってみよう」 (SpeakStep, its own chunk, asked for as the turn
  // opens); its 次へ adds the sentence's stars. Online, its state (the step's too) goes to the others at the table
  // (`onview`), and a phone watching shows it as the player's (`mirror`: view.ts, read-only; the step's chunk asked for
  // once the player's step shows).
  import { untrack } from 'svelte';
  import Nudge from './Nudge.svelte';
  import TurnResult from './TurnResult.svelte';
  import { seeded } from '#lib/random.ts';
  import { choicesFor, lettersFor, pictureSrc, type Picture } from '../pictures.ts';
  import { pictureStars } from '../game.ts';
  import { s } from '../i18n.ts';
  import { stageOf, tries } from '../tries.svelte.ts';
  import type { PictureView, SpeakView } from '../view.ts';

  interface Props {
    pic: Picture;
    level: number;
    seed: string;
    /** The turn so far (a sheet reopened mid-turn). */
    misses0?: number;
    /** A miss, to keep. */
    ontry: (t: { misses: number }) => void;
    /** `said`: the spoken sentence's stars (the speaking step). */
    ondone: (misses: number, said?: number) => void;
    /** The speaking step: on (the switch, and a person's key here), and the tip's key (the game and seat). */
    speak?: { tipKey: string } | null;
    /** Online, my turn: the turn as it is now, for the others to watch. */
    onview?: (v: PictureView) => void;
    /** Online, another's turn: theirs as their sheet shows it. */
    mirror?: PictureView | null;
  }
  let { pic, level, seed, misses0 = 0, ontry, ondone, speak = null, onview, mirror = null }: Props = $props();
  // (only with the switch on, or the player's step shown here: the step's chunk, asked for now so it's in by the answer;
  // till then, or failing, 次へ alone)
  let Step = $state.raw<typeof import('./SpeakStep.svelte').default | null>(null);
  let stepAsked = false;
  const askStep = () => !stepAsked && ((stepAsked = true), import('./SpeakStep.svelte').then((m) => (Step = m.default), () => {}));
  if (untrack(() => speak)) askStep();
  $effect(() => void (mirror?.speak && askStep()));
  /** The step's state as it is (my turn, online), for the view. */
  let stepView = $state.raw<SpeakView | null>(null);
  /** The step started: the answer folds to one line (a watching phone: the player's step past its ask). */
  let engaged = $state(false);
  const speaking = $derived(mirror ? !!mirror.speak && mirror.speak.phase !== 'ask' : engaged);
  /** The picture didn't load (offline, blocked): its Japanese alone, no broken frame. */
  let broken = $state(false);

  const choices = $derived(level === 1 ? choicesFor(pic, seeded(`${seed}:c:${pic.w}`)) : []);
  const tiles = $derived(level > 1 ? lettersFor(pic, level, seeded(`${seed}:l:${pic.w}`)).map((l, id) => ({ id, l })) : []);
  /** ふつう: the first letter's tile, placed from the start. */
  const given = $derived(level === 2 ? tiles.find((t) => t.l === pic.w[0])!.id : -1);
  const start = () => (given >= 0 ? [given] : []);
  /** The turn as it shows (and as the others watch it): the letters placed or the spellings tried (by index), the
   *  stage, the misses. */
  let v = $state<Omit<PictureView, 'speak'>>(untrack(() => ({ placed: start(), tried: [], stage: stageOf(misses0), misses: misses0 })));
  const two = tries(() => v);
  $effect(() => two.stop);
  const spelt = $derived(v.placed.map((id) => tiles[id].l).join(''));
  const miss = () => two.miss((misses) => ontry({ misses }), () => (v.placed = start()));

  function pick(k: number) {
    if (v.stage !== 'try') return;
    if (choices[k] === pic.w) v.stage = 'right';
    else v.tried.push(k), miss();
  }
  function put(id: number) {
    if (v.stage !== 'try' || v.placed.includes(id)) return;
    v.placed.push(id);
    if (v.placed.length < pic.w.length) return;
    if (spelt === pic.w) v.stage = 'right';
    else miss();
  }
  const takeBack = (k: number) => v.stage === 'try' && k > (given >= 0 ? 0 : -1) && (v.placed = v.placed.slice(0, k));
  // online: the turn as it is, sent (my turn), or the player's shown (another's)
  $effect(() => void onview?.({ ...$state.snapshot(v), speak: stepView }));
  $effect.pre(() => {
    const m = mirror;
    if (m) untrack(() => (v = { placed: [...new Set(m.placed)].filter((id) => id < tiles.length), tried: m.tried.filter((k) => k >= 0 && k < choices.length), stage: m.stage, misses: m.misses }));
  });
</script>

<section class="turn" data-sg-picture={pic.w} data-sg-stage={v.stage}>
  <div class="head">
    {#if !broken}<img src={pictureSrc(pic)} alt="" width="48" height="48" referrerpolicy="no-referrer" onerror={() => (broken = true)} />{/if}
    <h3 class="ja">{pic.ja}</h3>
    {#if level === 1 && (v.stage === 'try' || v.stage === 'miss')}<span class="soft">{s('pictureAskPick')}</span>{/if}
  </div>
  {#if v.stage === 'try' || v.stage === 'miss'}
    {#if v.misses && (v.stage === 'miss' || v.placed.length <= (given >= 0 ? 1 : 0))}<Nudge text={s('nudge')} />{/if}
    {#if level === 1}
      <div class="choices" lang="en">
        {#each choices as c, k (c)}
          <button type="button" class="sg-wt" disabled={v.tried.includes(k)} data-sfx="tick" data-sg-choice={c} onclick={() => pick(k)}>{c}</button>
        {/each}
      </div>
    {:else}
      <div class="slots sg-strip" class:miss={v.stage === 'miss'} lang="en" data-sg-spelt={spelt}>
        {#each v.placed as id, k (id)}<button type="button" class="sg-tile in" data-sfx="tick" onclick={() => takeBack(k)}>{tiles[id].l.toUpperCase()}</button>{/each}
      </div>
      <div class="rack" lang="en">
        {#each tiles.filter((t) => t.id !== given) as t (t.id)}
          <button type="button" class="sg-tile" disabled={v.placed.includes(t.id)} data-sfx="tick" data-sg-letter={t.l} onclick={() => put(t.id)}>{t.l.toUpperCase()}</button>
        {/each}
      </div>
    {/if}
  {:else}
    <TurnResult answer={v.stage === 'answer'} text={pic.w} stars={pictureStars(v.misses)} kind="word" line={speaking}
      onnext={(Step && (mirror?.speak || (speak && !mirror))) ? undefined : () => ondone(v.misses)} />
    {#if Step && mirror?.speak}
      <Step target={pic.w} level={level as 1 | 2 | 3} tipKey="" mirror={mirror.speak} onengage={() => {}} onnext={() => {}} />
    {:else if Step && speak && !mirror}
      <Step target={pic.w} level={level as 1 | 2 | 3} tipKey={speak.tipKey} onengage={() => (engaged = true)} onnext={(said) => ondone(v.misses, said)}
        onview={onview ? (sv) => (stepView = sv) : undefined} />
    {/if}
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; gap: 8px; }
  /* the header: the picture (48) and its Japanese */
  .head { display: flex; align-items: center; gap: 10px; min-height: 48px; }
  .head img { flex: none; width: 48px; height: 48px; object-fit: contain; filter: drop-shadow(0 2px 0 rgb(0 0 0 / .12)); }
  .ja { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .soft { margin: 0 0 0 auto; font: 500 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .choices, .rack, .slots { display: flex; flex-wrap: wrap; justify-content: center; gap: 4px; }
  .choices { gap: 6px; }
  .choices .sg-wt { padding: 0 16px; font-size: 20px; }
  .slots { padding: 4px 8px; gap: 3px; align-content: center; }
</style>
