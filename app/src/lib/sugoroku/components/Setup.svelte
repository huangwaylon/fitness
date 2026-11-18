<script lang="ts">
  // 英語すごろく's だれが遊ぶ？ (docs/sugoroku.md "Rules"): how the table plays (one phone passed round, or each on their
  // own), who plays (2–3 of us, turns in the order picked), each one's English level, the game's length; スタート.
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import { MAX_PLAYERS, MIN_PLAYERS, type Length, type Level } from '../game.ts';
  import type { Who } from '#lib/types.ts';
  import { s } from '../i18n.ts';

  interface Props {
    /** Who can play, me first. */
    people: readonly Who[];
    me: Who;
    nameOf: (w: Who) => string;
    picked: Who[];
    levels: Partial<Record<Who, Level>>;
    length: Length;
    playMode: 'local' | 'online';
    onstart: () => void;
    onspeech: () => void;
    onback: () => void;
    onclose: () => void;
  }
  let { people, me, nameOf, picked = $bindable(), levels = $bindable(), length = $bindable(), playMode = $bindable(), onstart, onspeech, onback, onclose }: Props = $props();
  const LEVELS = [1, 2, 3] as const;
  const LENGTHS = ['short', 'normal', 'long'] as const;
  const MODES = ['local', 'online'] as const;
  const toggle = (w: Who) => (picked = picked.includes(w) ? picked.filter((p) => p !== w) : picked.length < MAX_PLAYERS ? [...picked, w] : picked);
  const canStart = $derived(picked.length >= MIN_PLAYERS && (playMode === 'local' || picked.includes(me)));
</script>

<div class="top"><NavBar pad title={s('setupTitle')} {onback} {onclose} /></div>
<div class="body sheet-scroll">
  <span class="seg wide2" role="radiogroup" aria-label={s('mode')}>
    {#each MODES as md (md)}
      <button type="button" role="radio" class="sg-chip" aria-checked={playMode === md} data-sfx="none" data-sg-mode={md}
        onclick={() => (playMode = md)}>{s(`mode.${md}`)}</button>
    {/each}
  </span>
  <p class="note">{playMode === 'online' ? s('onlineNote') : s('setupNote')}</p>
  <div class="seats" data-sg-seats>
    {#each people as w (w)}
      {@const n = picked.indexOf(w)}
      <button type="button" class="seat" class:on={n >= 0} aria-pressed={n >= 0} data-sfx="tick" data-sg-seat={w} onclick={() => toggle(w)}>
        <Avatar person={w} worn size={52} />
        <span class="nm">{nameOf(w)}</span>
        {#if n >= 0}<span class="ord">{n + 1}</span>{/if}
      </button>
    {/each}
  </div>
  {#if picked.length}
    <h3 class="sec-label">{s('levelNote')}</h3>
    <div class="card dense levels" role="list">
      {#each picked as k (k)}
        <div class="row lrow" role="listitem" data-sg-level-row={k}>
          <Avatar person={k} worn size={32} /><span class="nm">{nameOf(k)}</span>
          <span class="seg" role="radiogroup" aria-label={s('levelOf', { name: nameOf(k) })}>
            {#each LEVELS as lv (lv)}
              <button type="button" role="radio" class="sg-chip" aria-checked={(levels[k] ?? 2) === lv} data-sfx="none" data-sg-level={lv}
                onclick={() => (levels = { ...levels, [k]: lv })}>{s(`level.${lv}`)}</button>
            {/each}
          </span>
        </div>
      {/each}
    </div>
  {/if}
  {#if playMode === 'online' && !picked.includes(me)}<p class="note">{s('meNeeded')}</p>{/if}
  <h3 class="sec-label">{s('length')}</h3>
  <span class="seg wide2" role="radiogroup" aria-label={s('length')}>
    {#each LENGTHS as L (L)}
      <button type="button" role="radio" class="sg-chip" aria-checked={length === L} data-sfx="none" data-sg-length={L} onclick={() => (length = L)}>{s(`length.${L}`)}</button>
    {/each}
  </span>
  <button type="button" class="btn" data-sfx="confirm" data-sg-start disabled={!canStart} onclick={onstart}>{s('start')}</button>
  <!-- the relay's Whisper on trial (docs/speech-test.md) -->
  <button type="button" class="speech" data-sfx="tick" data-sg-speech onclick={onspeech}>{s('speechTest')}</button>
</div>

<style>
  .top { flex: none; background-color: var(--surface); }
  .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px;
    padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .body > * { flex-shrink: 0; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .seats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .seat {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; margin: 0;
    appearance: none; border: 0; border-radius: var(--r-card); background: var(--c-card); box-shadow: 0 3px 0 var(--c-edge);
    color: var(--c-ink); font: 700 var(--fs-s)/1.2 var(--font-ui); cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .seat.on { background: color-mix(in srgb, var(--c-yuzu) 55%, var(--c-card)); box-shadow: 0 3px 0 var(--c-yuzu-lip); }
  .ord { position: absolute; top: 6px; right: 8px; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%;
    background: var(--c-ink); color: var(--c-cream); font: 600 13px/1 var(--font-num); }
  .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .wide2 { align-self: center; }
  .lrow { display: flex !important; flex-wrap: wrap; align-items: center; gap: 8px; }
  .lrow .nm { flex: 1 0 auto; min-width: 4.5em; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  .lrow .seg { margin-left: auto; }
  .seg { display: inline-flex; gap: 4px; }
  .sg-chip { min-height: 36px; padding: 0 10px; margin: 0; appearance: none; border: 0; border-radius: var(--r-pill); cursor: pointer;
    background: var(--c-card); box-shadow: 0 2px 0 var(--c-edge); color: var(--c-ink); font: 700 var(--fs-s)/1 var(--font-ui); }
  .sg-chip[aria-checked='true'] { background: var(--c-yuzu); box-shadow: 0 2px 0 var(--c-yuzu-lip); }
  .speech { align-self: center; margin-top: 4px; min-height: 44px; padding: 0 12px; border: 0; background: none; color: var(--text-soft); font: 600 var(--fs-s)/1 var(--font-ui); }
</style>
