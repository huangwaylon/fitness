<script lang="ts">
  // 聞けたセリフ's returns on home (docs/english.md "聞けたセリフ"; shelf.ts dueOf): the lines back today, above today's
  // clip, one at a time: 聞いてみる mounts the player (iOS: a tap before a play), then 聞き取りチャレンジ's card
  // (CatchLine) with no text at full speed. Caught first try at full speed with no tile given: 聞けた, the count said;
  // else only "back in a few days". とじる hides them till the sheet opens again (nothing recorded). The line is the
  // shelf's own copy: no bank needed.
  import { untrack } from 'svelte';
  import CatchLine from './CatchLine.svelte';
  import Player from './Player.svelte';
  import Icon from '#lib/components/ui/Icon.svelte';
  import Phrases from '#lib/components/ui/Phrases.svelte';
  import { clean, type How } from '../catch.ts';
  import { dueOf, heardCount, returned, saveShelf, shelfOf, type Key } from '../shelf.ts';
  import { count } from '#lib/sync/log.ts';
  import { s } from '../i18n.ts';
  import type { YtPlayer } from '../player.svelte.ts';
  import type { LocalDate, Who } from '#lib/types.ts';

  let { me, today, onshelf }: { me: Who; today: LocalDate; onshelf: () => void } = $props();

  let shelf = $state.raw(untrack(() => shelfOf(me)));
  const keys: Key[] = untrack(() => dueOf(shelf, today));
  let i = $state(0);
  let closed = $state(false);
  let booted = $state(false);
  let player = $state<YtPlayer>();
  let result = $state<How | null>(null);
  const k = $derived(keys[i]);
  const e = $derived(k ? shelf.lines[k] : undefined);

  function got(h: How): void {
    result = h;
    shelf = returned(shelfOf(me), k, today, h);
    saveShelf(me, shelf);
    count(`act:english.shelf.${clean(h) ? 'heard' : 'later'}`);
  }
  const next = () => ((i += 1), (result = null));
</script>

{#if e && !closed}
  <div class="back" data-en-back-line={k}>
    {#if booted}<div class="video"><Player video={e.video} title={e.title} bind:player /></div>{/if}
    {#key k}
      {#if !booted}
        <article class="card pad intro">
          <div class="head">
            <p class="kicker">{s('backTitle')} <span class="n">{s('catchN', { i: i + 1, n: keys.length })}</span></p>
            <button type="button" class="quiet" data-sfx="tick" data-en-back-close onclick={() => (closed = true)}>{s('backClose')}</button>
          </div>
          <p><Phrases text={s('backHow')} /></p>
          <button type="button" class="btn sky" data-sfx="tick" data-en-back-start onclick={() => (booted = true)}><Icon name="play" />{s('catchPlay')}</button>
        </article>
      {:else}
        <CatchLine line={e.line} {player} seed={`${me}:${today}:${k}`} oncaught={got}>
          {#snippet head()}
            <div class="head">
              <p class="kicker">{s('backTitle')} <span class="n">{s('catchN', { i: i + 1, n: keys.length })}</span></p>
              <button type="button" class="quiet" data-sfx="tick" data-en-back-close onclick={() => (closed = true)}>{s('backClose')}</button>
            </div>
          {/snippet}
          {#snippet after()}
            {#if result}
              <p class="said" data-en-back-result={clean(result) ? 'heard' : 'later'}>
                <Phrases text={clean(result) ? s('backHeard', { n: heardCount(shelf) }) : s('backLater')} />
              </p>
              <div class="pair">
                <button type="button" class="btn paper" data-sfx="page" data-en-back-shelf onclick={onshelf}>{s('shelfTitle')}</button>
                {#if i < keys.length - 1}
                  <button type="button" class="btn" data-sfx="page" data-en-back-next onclick={next}>{s('next')}</button>
                {:else}
                  <button type="button" class="btn" data-sfx="tick" data-en-back-done onclick={() => (closed = true)}>{s('backClose')}</button>
                {/if}
              </div>
            {/if}
          {/snippet}
        </CatchLine>
      {/if}
    {/key}
  </div>
{/if}

<style>
  .back { display: grid; gap: 8px; flex: none; animation: if-lvl var(--dur-sheet) var(--ease-out); }
  .video { border-radius: var(--r-row); overflow: hidden; }
  .intro { display: grid; gap: 10px; }
  .intro p { margin: 0; }
  .head { display: flex; align-items: center; justify-content: space-between; margin: -8px -8px -4px 0; }
  .kicker { margin: 0; font: 700 var(--fs-s)/1.3 var(--font-ui); color: var(--text-soft); }
  .n { font-family: var(--font-num); font-variant-numeric: tabular-nums; margin-left: 4px; }
  .btn { margin: 0; }
  .said { margin: 0; font-weight: 700; }
  .pair { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .pair .btn { white-space: nowrap; padding-inline: 8px; }
</style>
