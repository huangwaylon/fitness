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
  import Icon from '#lib/components/ui/Icon.svelte';
  import { seeded } from '#lib/random.ts';
  import { choicesFor, lettersFor, pictureSrc, type Picture } from '../pictures.ts';
  import { pictureStars } from '../game.ts';
  import { s } from '../i18n.ts';
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
  /** The step started: the answer folds to one line. */
  let speaking = $state(false);
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));
  /** The picture didn't load (offline, blocked): its Japanese alone, no broken frame. */
  let broken = $state(false);

  const choices = $derived(level === 1 ? choicesFor(pic, seeded(`${seed}:c:${pic.w}`)) : []);
  const tiles = $derived(level > 1 ? lettersFor(pic, level, seeded(`${seed}:l:${pic.w}`)).map((l, id) => ({ id, l })) : []);
  /** ふつう: the first letter's tile, placed from the start. */
  const given = $derived(level === 2 ? tiles.find((t) => t.l === pic.w[0])!.id : -1);
  let placed = $state<number[]>([]);
  $effect.pre(() => void (placed = given >= 0 ? [given] : []));
  let tried = $state<string[]>([]);
  let misses = $state(untrack(() => misses0));
  let stage = $state<'try' | 'miss' | 'right' | 'answer'>(untrack(() => (misses0 >= 2 ? 'answer' : 'try')));
  const spelt = $derived(placed.map((id) => tiles[id].l).join(''));

  function miss() {
    if (misses >= 1) return void ((misses = 2), (stage = 'answer'), ontry({ misses }));
    misses = 1;
    ontry({ misses });
    stage = 'miss';
    timer = setTimeout(() => ((placed = given >= 0 ? [given] : []), (stage = 'try')), 900);
  }
  function pick(c: string) {
    if (stage !== 'try') return;
    if (c === pic.w) stage = 'right';
    else (tried = [...tried, c]), miss();
  }
  function put(id: number) {
    if (stage !== 'try' || placed.includes(id)) return;
    placed = [...placed, id];
    if (placed.length < pic.w.length) return;
    if (spelt === pic.w) stage = 'right';
    else miss();
  }
  const takeBack = (k: number) => stage === 'try' && k > (given >= 0 ? 0 : -1) && (placed = placed.slice(0, k));
  // online: the turn as it is, sent (my turn), or the player's shown (another's)
  $effect(() => void onview?.({ placed, tried: tried.map((c) => choices.indexOf(c)), stage, misses, speak: stepView }));
  $effect.pre(() => {
    const m = mirror;
    if (!m) return;
    untrack(() => {
      placed = [...new Set(m.placed)].filter((id) => id < tiles.length);
      tried = m.tried.map((k) => choices[k]).filter(Boolean);
      (stage = m.stage), (misses = m.misses), (speaking = !!m.speak && m.speak.phase !== 'ask');
    });
  });
</script>

<section class="turn" data-sg-picture={pic.w} data-sg-stage={stage}>
  <div class="head">
    {#if !broken}<img src={pictureSrc(pic)} alt="" width="48" height="48" referrerpolicy="no-referrer" onerror={() => (broken = true)} />{/if}
    <h3 class="ja">{pic.ja}</h3>
    {#if level === 1 && (stage === 'try' || stage === 'miss')}<span class="soft">{s('pictureAskPick')}</span>{/if}
  </div>
  {#if stage === 'try' || stage === 'miss'}
    {#if misses && (stage === 'miss' || placed.length <= (given >= 0 ? 1 : 0))}<p class="toast" aria-live="polite">{s('nudge')}</p>{/if}
    {#if level === 1}
      <div class="choices" lang="en">
        {#each choices as c (c)}
          <button type="button" class="wt" disabled={tried.includes(c)} data-sfx="tick" data-sg-choice={c} onclick={() => pick(c)}>{c}</button>
        {/each}
      </div>
    {:else}
      <div class="slots" class:miss={stage === 'miss'} lang="en" data-sg-spelt={spelt}>
        {#each placed as id, k (id)}<button type="button" class="tile in" data-sfx="tick" onclick={() => takeBack(k)}>{tiles[id].l.toUpperCase()}</button>{/each}
      </div>
      <div class="rack" lang="en">
        {#each tiles.filter((t) => t.id !== given) as t (t.id)}
          <button type="button" class="tile" disabled={placed.includes(t.id)} data-sfx="tick" data-sg-letter={t.l} onclick={() => put(t.id)}>{t.l.toUpperCase()}</button>
        {/each}
      </div>
    {/if}
  {:else}
    <div class="res" class:line={speaking}>
      {#if stage === 'answer' && !speaking}<p class="soft">{s('answer')}</p>{/if}
      <p class="en" lang="en" data-sg-answer>{pic.w}</p>
      <p class="pts"><Icon name="star" size={20} soft /><b>{pictureStars(misses)}</b></p>
    </div>
    {#if Step && mirror?.speak}
      <Step target={pic.w} level={level as 1 | 2 | 3} tipKey="" mirror={mirror.speak} onengage={() => {}} onnext={() => {}} />
    {:else if Step && speak && !mirror}
      <Step target={pic.w} level={level as 1 | 2 | 3} tipKey={speak.tipKey} onengage={() => (speaking = true)} onnext={(said) => ondone(misses, said)}
        onview={onview ? (v) => (stepView = v) : undefined} />
    {:else}
      <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => ondone(misses)}>{s('next')}</button>
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
  .slots { min-height: 52px; padding: 4px 8px; gap: 3px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); align-content: center; }
  .slots.miss { background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
  .wt {
    min-height: 44px; padding: 0 16px; margin: 0; appearance: none; border: 0; border-radius: var(--r-chip); cursor: pointer;
    background: var(--sg-tile); color: var(--c-ink); box-shadow: 0 3px 0 var(--sg-tile-lip); font: 600 20px/1 var(--font-body);
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .wt:disabled { opacity: .3; }
  /* the word turn's tiles: 42 × 48, 8 to a row at 393 (a 46 × 52 hit each) */
  .tile {
    position: relative; width: 42px; height: 48px; display: grid; place-items: center; padding: 0; margin: 0; flex: none; appearance: none; border: 0;
    border-radius: var(--r-chip); cursor: pointer; background: var(--sg-tile); color: var(--c-ink); box-shadow: 0 3px 0 var(--sg-tile-lip); font: 600 20px/1 var(--font-num);
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .tile::before { content: ''; position: absolute; inset: -2px; }
  .tile:disabled { opacity: .25; }
  .tile.in { width: 28px; height: 42px; font-size: 18px; background: color-mix(in srgb, var(--c-mint) 50%, var(--c-cream)); }
  /* 「おしい！」: a pill 8 px over the sheet (the sheet is its containing block), never a line of its own */
  .toast { position: absolute; left: 50%; bottom: calc(100% + 8px); translate: -50% 0; width: max-content; max-width: calc(100% - 24px); margin: 0;
    padding: 8px 14px; border-radius: var(--r-pill); background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge);
    font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--c-ink); pointer-events: none; }
  .res { display: flex; flex-direction: column; align-items: center; gap: 4px; }
  .res .soft { margin: 0; }
  .res.line { flex-direction: row; justify-content: center; gap: 12px; }
  .res.line .en { font-size: 22px; }
  .en { margin: 0; font: 600 28px/1.2 var(--font-num); letter-spacing: .04em; }
  .pts { display: flex; align-items: center; gap: 4px; margin: 0; color: var(--c-gold); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
  .btn { margin: 0; min-height: 48px; }
</style>
