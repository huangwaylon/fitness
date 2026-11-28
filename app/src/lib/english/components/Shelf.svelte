<script lang="ts">
  // 聞けたセリフ (docs/english.md "聞けたセリフ"), a level from home's row: the count of lines I now hear as is (a return
  // caught first try at full speed with no tile given: it only ever grows), then every line caught in 聞き取りチャレンジ,
  // the latest met first: the line, its Japanese, how it was caught then → how now (or when it's back), and ▶ for its
  // segment. One player for the page, mounted at the first ▶ (pinned under the bar), the next clip cued into it. Never a
  // miss shown: a line not heard this time just says when it's back.
  import { tick, untrack } from 'svelte';
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import Player from './Player.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { backOn, cardsOf, heardCount, shelfOf, type Key, type Met } from '../shelf.ts';
  import { count } from '#lib/sync/log.ts';
  import { s } from '../i18n.ts';
  import type { YtPlayer } from '../player.svelte.ts';
  import type { Who } from '#lib/types.ts';

  let { onback, onclose }: { onback: () => void; onclose: () => void } = $props();

  const me = untrack(() => (week.model?.me ?? 'A') as Who);
  const shelf = shelfOf(me);
  const cards = cardsOf(shelf);
  const heard = heardCount(shelf);

  /** 11/20 */
  const md = (d: string) => `${+d.slice(5, 7)}/${+d.slice(8, 10)}`;
  const metText = (m: Met) => `${md(m.d)} ${!m.slow && !m.h ? s('shelfClean') : [m.slow && s('shelfSlow'), m.h && s('shelfHints', { n: m.h })].filter(Boolean).join('・')}`;

  let player = $state<YtPlayer>();
  /** The card whose segment plays (its clip in the player: another clip is cued into it first). */
  let on = $state<Key | null>(null);
  async function hear(k: Key): Promise<void> {
    const same = !!on && shelf.lines[on].video === shelf.lines[k].video;
    on = k;
    count('act:english.shelf.play');
    if (!same) await tick();
    if (!player || player.state === 'loading') pending = true;
    else play();
  }
  const cur = $derived(on ? shelf.lines[on] : undefined);
  const play = () => cur && player?.play(cur.line.seg[0], cur.line.seg[1]);
  /** A ▶ before the frame answered: played once it has. */
  let pending = false;
  $effect(() => {
    const st = player?.state;
    if (pending && st && st !== 'loading' && st !== 'error') untrack(() => ((pending = false), play()));
  });
</script>

<section class="screen" data-en-shelf>
  <div class="top"><NavBar pad title={s('shelfTitle')} {onback} {onclose} /></div>
  {#if cur}<div class="video"><Player video={cur.video} title={cur.title} bind:player /></div>{/if}
  <div class="body sheet-scroll">
    <article class="card pad hero">
      <p class="big" data-en-shelf-heard={heard}><span class="num">{heard}</span><span class="unit">{s('shelfUnit')}</span></p>
      <p class="lbl">{s('shelfHeard')}</p>
      <p class="note"><Phrases text={s('shelfNote')} /></p>
    </article>
    {#if !cards.length}
      <p class="empty" data-en-shelf-empty><Phrases text={s('shelfEmpty')} /></p>
    {/if}
    {#each cards as [k, e] (k)}
      {@const back = backOn(e)}
      <article class="card pad line" class:playing={on === k} data-en-shelf-card={k}>
        <div class="row">
          <p class="en" lang="en">{e.line.tiles.join(' ')}</p>
          {#if e.heard}<span class="tag" data-en-shelf-tag>{s('shelfHeardTag')}</span>{/if}
        </div>
        <p class="ja">{e.line.ja}</p>
        <p class="arc" data-en-shelf-arc>
          <span>{metText(e.first)}</span><Icon name="chevron-right" size={14} stroke={2.6} />
          <span class:now={!!e.last}>{e.last ? metText(e.last) : back ? s('shelfNext', { d: md(back) }) : s('shelfDone')}</span>
        </p>
        <button type="button" class="btn small sky" data-sfx="tick" data-en-shelf-play onclick={() => hear(k)}><Icon name="play" size={18} />{s('shelfPlay')}</button>
      </article>
    {/each}
  </div>
</section>

<style>
  .screen { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--surface); }
  .top { flex: none; background-color: var(--surface); }
  .video { flex: none; }
  .body { display: flex; flex-direction: column; gap: 10px; padding: 8px calc(12px + var(--safe-right)) 24px calc(12px + var(--safe-left)); scrollbar-width: none; }
  p { margin: 0; }
  .card { flex: none; display: grid; gap: 6px; }
  .hero { justify-items: start; gap: 2px; }
  .big { display: flex; align-items: baseline; gap: 4px; color: var(--c-ink); }
  .num { font: 700 var(--fs-hero)/1 var(--font-num); font-variant-numeric: tabular-nums; }
  .unit { font: 700 var(--fs-talk)/1 var(--font-ui); }
  .lbl { font-weight: 700; }
  .note { margin-top: 6px; font-size: var(--fs-s); color: var(--text-soft); }
  .empty { padding: 8px 4px; color: var(--text-soft); }
  .row { display: flex; align-items: start; gap: 8px; }
  .en { flex: 1; font: 700 var(--fs-talk)/1.35 var(--font-ui); }
  .ja { font-size: var(--fs-body); }
  .tag { flex: none; padding: 2px 8px; border-radius: var(--r-pill); background: var(--c-yuzu); color: var(--c-ink); font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .arc { display: flex; flex-wrap: wrap; align-items: center; gap: 2px 6px; font-size: var(--fs-s); color: var(--text-soft); font-variant-numeric: tabular-nums; }
  .arc .now { color: var(--leaf-text); font-weight: 700; }
  .line.playing { box-shadow: inset 0 0 0 2px var(--c-sky); }
  .btn { margin: 0; }
  .btn.small { justify-self: start; display: inline-flex; gap: 6px; align-items: center; }
</style>
