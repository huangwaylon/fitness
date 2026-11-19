<script lang="ts">
  // 英語すごろく's だれが遊ぶ？ (docs/sugoroku.md "Rules"): how the table plays (one phone passed round, or each on their
  // own), who plays (2–3 of us, turns in the order picked), each one's English level, the game's length; スタート.
  import NavBar from '#lib/components/ui/NavBar.svelte';
  import Avatar from '#lib/components/characters/Avatar.svelte';
  import Segmented from '#lib/components/ui/Segmented.svelte';
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
    onback: () => void;
    onclose: () => void;
  }
  let { people, me, nameOf, picked = $bindable(), levels = $bindable(), length = $bindable(), playMode = $bindable(), onstart, onback, onclose }: Props = $props();
  // (the kit's Segmented: 36 drawn in a 44 hit, docs/design.md "Sizes")
  const LEVELS = ([1, 2, 3] as const).map((lv) => ({ id: String(lv) as '1' | '2' | '3', label: s(`level.${lv}`) }));
  const LENGTHS = (['short', 'normal', 'long'] as const).map((id) => ({ id, label: s(`length.${id}`) }));
  const MODES = (['local', 'online'] as const).map((id) => ({ id, label: s(`mode.${id}`) }));
  const toggle = (w: Who) => (picked = picked.includes(w) ? picked.filter((p) => p !== w) : picked.length < MAX_PLAYERS ? [...picked, w] : picked);
  const canStart = $derived(picked.length >= MIN_PLAYERS && (playMode === 'local' || picked.includes(me)));
</script>

<div class="top"><NavBar pad title={s('setupTitle')} {onback} {onclose} /></div>
<div class="body sheet-scroll">
  <Segmented items={MODES} value={playMode} label={s('mode')} attr="sg-mode" onpick={(id) => (playMode = id)} />
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
          <span class="lseg"><Segmented items={LEVELS} value={String(levels[k] ?? 2) as '1' | '2' | '3'} label={s('levelOf', { name: nameOf(k) })} attr="sg-level"
            onpick={(id) => (levels = { ...levels, [k]: Number(id) as Level })} /></span>
        </div>
      {/each}
    </div>
  {/if}
  {#if playMode === 'online' && !picked.includes(me)}<p class="note">{s('meNeeded')}</p>{/if}
  <h3 class="sec-label">{s('length')}</h3>
  <Segmented items={LENGTHS} value={length} label={s('length')} attr="sg-length" onpick={(id) => (length = id)} />
  <button type="button" class="btn" data-sfx="confirm" data-sg-start disabled={!canStart} onclick={onstart}>{s('start')}</button>
</div>

<style>
  .top { flex: none; background-color: var(--surface); }
  .body { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: 10px;
    padding: 4px calc(12px + var(--safe-right)) calc(var(--safe-bottom) + 24px) calc(12px + var(--safe-left)); scrollbar-width: none; }
  .body > * { flex-shrink: 0; }
  .note { margin: 0; font-size: var(--fs-s); color: var(--text-soft); text-wrap: pretty; }
  .seats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  /* a seat: the kit's themed control (its edge and the press; navy by night), picked yuzu as a chosen chip */
  .seat {
    position: relative; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 4px; margin: 0;
    appearance: none; border: 0; border-radius: var(--r-card); background: var(--ctl); box-shadow: var(--sh-ctl);
    color: var(--text); font: 700 var(--fs-s)/1.2 var(--font-ui); cursor: pointer; -webkit-tap-highlight-color: transparent;
  }
  .seat:active { transform: translateY(2px); box-shadow: var(--sh-ctl-press); }
  .seat.on { background: var(--ctl-sel); color: var(--c-ink); }
  .ord { position: absolute; top: 6px; right: 8px; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 50%;
    background: var(--c-ink); color: var(--c-cream); font: 600 var(--fs-s)/1 var(--font-num); }
  .nm { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
  .lrow { display: flex !important; flex-wrap: wrap; align-items: center; gap: 8px; }
  .lrow .nm { flex: 1 0 auto; min-width: 4.5em; font: 700 var(--fs-body)/1.2 var(--font-ui); }
  /* (a row's level switch: its own line on a narrow phone) */
  .lseg { flex: 1 1 13.5em; min-width: 0; margin-left: auto; padding: 4px 0; }
</style>
