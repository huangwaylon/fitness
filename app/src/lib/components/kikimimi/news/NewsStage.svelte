<script lang="ts">
  // しずえ at her news desk (docs/kikimimi-engine.md "しずえの ニュース"; the PA frame's kin): the 放送中 lamp lit while the bulletin
  // plays, しずえ behind the desk with her microphone, the bulletin's bar, and its stories in order (島 or 季節, 東京, 天気),
  // the one being read lifted. After the first play the desk shrinks and each story is a chip that plays it again.
  import type { NewsSeg } from '#lib/kikimimi/games/news/def.ts';
  import OfficialArt from '../../characters/OfficialArt.svelte';
  import ClipBar from '../scene/ClipBar.svelte';
  import { rosterName as name } from '../scene/stage.ts';
  import { villagerArt } from '#lib/art.ts';
  import { t } from '#lib/i18n/index.ts';

  let { segs, bar, now, reading, hearing, canHear, onhear }: {
    segs: readonly NewsSeg[];
    /** The bulletin's bar while it plays (null: off air). */
    bar: { from: number; until: number; key: string } | null;
    now: number;
    /** The story being read (-1: none) and the one replaying. */
    reading: number;
    hearing: number;
    /** The stories take a tap (after the first play). */
    canHear: boolean;
    onhear: (k: number) => void;
  } = $props();
  const live = $derived(!!bar || reading >= 0 || hearing >= 0);
  const small = $derived(canHear);
</script>

<div class="desk obj-cream" class:small data-kiki-frame="news" data-live={live || undefined}>
  {#if live}<p class="lamp"><span class="dot"></span>{t('kiki.news.onAir')}</p>{/if}
  <div class="anchor">
    <span class="head"><OfficialArt key={villagerArt('isabelle', true)} alt={name('isabelle')} size={small ? 52 : 84} eager /></span>
    <svg class="mic" viewBox="0 0 24 48" aria-hidden="true">
      <rect x="6" y="2" width="12" height="18" rx="6" fill="#5c4a3a" />
      <path d="M12 20v20M6 44h12" stroke="#5c4a3a" stroke-width="3" stroke-linecap="round" />
    </svg>
    <span class="table" aria-hidden="true"></span>
  </div>
  {#if bar}<ClipBar {bar} {now} height={8} />{/if}
  <ol class="segs" aria-label={t('kiki.news.segs')} data-kiki-news-segs>
    {#each segs as s, k (k)}
      <li>
        <button type="button" class="seg tile-btn" data-seg={k} data-topic={s.topic} data-on={reading === k || hearing === k || undefined} aria-disabled={!canHear}
          data-sfx={canHear ? 'tick' : 'none'} onclick={() => canHear && onhear(k)}>
          <span class="n" aria-hidden="true">{k + 1}</span>{t(`kiki.news.seg.${s.topic}`)}{#if canHear}<span class="play" aria-hidden="true">▶︎</span>{/if}
        </button>
      </li>
    {/each}
  </ol>
</div>

<style>
  .desk { display: grid; gap: 8px; justify-items: center; padding: 10px 12px 12px; border-radius: var(--r-game); background: var(--c-card); color: var(--c-ink); box-shadow: var(--sh-lip-cream); }
  .lamp { justify-self: start; margin: 0; display: inline-flex; align-items: center; gap: 6px; padding: 2px 10px; border-radius: var(--r-pill); background: var(--ctl-off); color: var(--text-soft); font: 700 var(--fs-s)/1.4 var(--font-ui); }
  .lamp { background: color-mix(in srgb, var(--c-coral) 25%, var(--c-card)); color: var(--text); }
  .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--c-coral); animation: blink 1.2s ease-in-out infinite alternate; }
  .small .head { width: 60px; height: 60px; }
  .small .mic { display: none; }
  .seg[aria-disabled='true']:not([data-on]) { opacity: .75; }
  .anchor { position: relative; display: grid; justify-items: center; width: 100%; line-height: 0; }
  .head { width: 96px; height: 96px; border-radius: 50%; background: var(--c-mint); display: grid; place-items: center; overflow: hidden; }
  .mic { position: absolute; bottom: 10px; left: calc(50% + 34px); width: 18px; height: 36px; }
  .table { width: min(260px, 90%); height: 16px; margin-top: -6px; border-radius: 8px 8px 4px 4px; background: #c9a77c; box-shadow: 0 4px 0 #a5845b; }
  .segs { list-style: none; margin: 0; padding: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; }
  .seg { min-height: var(--hit); padding: 4px 12px; border-radius: var(--r-pill); display: inline-flex; align-items: center; gap: 6px; font: 700 var(--fs-s)/1.2 var(--font-ui); }
  .seg[aria-disabled='true'] { cursor: default; }
  .seg[data-on] { box-shadow: var(--sh-sel); background: color-mix(in srgb, var(--c-leaf) 25%, var(--c-card)); }
  .n { font: 700 var(--fs-s)/1 var(--font-num); color: var(--text-soft); }
  .play { font-size: .8em; color: var(--text-soft); }
  @keyframes blink { from { opacity: 1; } to { opacity: .35; } }
</style>
