<script lang="ts">
  // 英語すごろく's 絵 turn (docs/sugoroku.md "Rules"): an NH item's picture, its Japanese under it, its English name to
  // spell by the seat's level: やさしい taps one of three spellings; ふつう puts its letters in order, the first given;
  // むずかしい its letters with two more mixed in, none given. Right → its stars and the souvenir; not → 「おしい！」 and one
  // more go; a second miss → 「答えはこれ」 (the souvenir all the same). Never red, never ×.
  import { untrack } from 'svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import { artUrl } from '#lib/art.ts';
  import { seeded } from '#lib/random.ts';
  import { choicesFor, lettersFor, type Picture } from '../pictures.ts';
  import { pictureStars } from '../game.ts';
  import { s } from '../i18n.ts';

  interface Props {
    pic: Picture;
    level: number;
    seed: string;
    /** The set bonus a souvenir here pays (game.ts pictureBonus). */
    bonus?: number;
    /** The turn so far (a sheet reopened mid-turn). */
    misses0?: number;
    /** A miss, to keep. */
    ontry: (t: { misses: number }) => void;
    ondone: (misses: number) => void;
  }
  let { pic, level, seed, bonus = 0, misses0 = 0, ontry, ondone }: Props = $props();
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));

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
</script>

<section class="turn" data-sg-picture={pic.w}>
  <h3 class="ttl">{s('pictureTitle')}</h3>
  <div class="pic"><img src={artUrl(pic.key) ?? ''} alt="" width="72" height="72" /><span class="ja">{pic.ja}</span></div>
  {#if stage === 'try' || stage === 'miss'}
    <p class="ask" aria-live="polite">{misses ? s('nudge') : level === 1 ? s('pictureAskPick') : s('pictureAsk')}</p>
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
    <p class="ask">{stage === 'answer' ? s('answer') : s('souvenir')}</p>
    <p class="en" lang="en" data-sg-answer>{pic.w}</p>
    <p class="pts"><Icon name="star" size={20} soft /><b>{pictureStars(misses) + bonus}</b></p>
    {#if bonus}<p class="set" data-sg-set-bonus>{s('setDone', { n: bonus })}</p>{/if}
    <button type="button" class="btn" data-sfx="confirm" data-sg-next onclick={() => ondone(misses)}>{s('next')}</button>
  {/if}
</section>

<style>
  .turn { display: flex; flex-direction: column; align-items: center; gap: 8px; }
  .ttl { margin: 0; font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .pic { display: flex; align-items: center; gap: 10px; }
  .pic img { width: 72px; height: 72px; object-fit: contain; filter: drop-shadow(0 2px 0 rgb(0 0 0 / .12)); }
  .pic .ja { font: 700 var(--fs-talk)/1.2 var(--font-ui); }
  .ask { margin: 0; font-size: var(--fs-s); color: var(--text-soft); min-height: 1.2em; text-align: center; }
  .choices, .rack, .slots { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .slots { min-height: 52px; min-width: 200px; padding: 4px 8px; border-radius: 14px; background: color-mix(in srgb, var(--c-edge) 35%, transparent); }
  .slots.miss { background: color-mix(in srgb, var(--c-yuzu) 35%, transparent); }
  .wt {
    min-height: 44px; padding: 0 16px; margin: 0; appearance: none; border: 0; border-radius: 10px; cursor: pointer;
    background: #f6e7c6; color: var(--c-ink); box-shadow: 0 3px 0 #b99364; font: 600 20px/1 var(--font-body);
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .wt:disabled { opacity: .3; }
  .tile {
    width: 44px; height: 44px; display: grid; place-items: center; padding: 0; margin: 0; appearance: none; border: 0; border-radius: 10px;
    cursor: pointer; background: #f6e7c6; color: var(--c-ink); box-shadow: 0 3px 0 #b99364; font: 600 22px/1 var(--font-num);
    touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  }
  .tile:disabled { opacity: .25; }
  .tile.in { background: color-mix(in srgb, var(--c-mint) 50%, var(--c-cream)); }
  .en { margin: 0; font: 600 28px/1.2 var(--font-num); letter-spacing: .04em; }
  .pts { display: flex; align-items: center; gap: 4px; margin: 0; color: var(--c-gold); }
  .set { margin: 0; padding: 3px 12px; border-radius: var(--r-pill); background: var(--c-yuzu); font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .pts b { font: 600 28px/1 var(--font-num); color: var(--c-ink); }
</style>
