<script lang="ts">
  // The rooms' one teaching of the two-finger pan (docs/design.md "The tent"): a cream kana chip under the top row (clear
  // of the floor's door, where my villager comes in), 「2ほんゆびで うごかせるよ」, the first time this phone shows the room
  // (`on`: the room drawn, at its own view, nothing over it), gone after SHOW_MS or at the first pan. The shop's
  // (`untilPan`: its counter starts off a phone's edge) comes each visit till the first pan there, and goes for the
  // visit after UNTIL_PAN_MS or once something covers it (its list open). A hint, never a camera move (the rooms'
  // no-recentring rule); a finger goes through.
  import { onMount, untrack } from 'svelte';
  import { fade } from 'svelte/transition';
  import { t } from '#lib/i18n/index.ts';
  import { DEVICE, localKV, readJson, writeJson } from '#lib/sync/storage.ts';
  import { onPan } from './gesture.ts';

  type Room = 'tent' | 'shop' | 'museum';
  let { room, on, untilPan = false }: { room: Room; on: boolean; untilPan?: boolean } = $props();
  const SHOW_MS = 4000, UNTIL_PAN_MS = 60_000;
  const seen = () => readJson<Partial<Record<Room, 1>>>(localKV(), DEVICE.panHint) ?? {};
  const mark = () => void writeJson(localKV(), DEVICE.panHint, { ...seen(), [room]: 1 });
  let stage = $state<'wait' | 'shown' | 'gone'>(untrack(() => (seen()[room] ? 'gone' : 'wait')));
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => {
    if (stage !== 'wait' || !on) return;
    stage = 'shown';
    const visit = untrack(() => untilPan);
    if (!visit) mark();
    timer = setTimeout(() => (stage = 'gone'), visit ? UNTIL_PAN_MS : SHOW_MS);
  });
  // (the shop's, covered once: gone for the visit)
  $effect(() => {
    if (stage === 'shown' && !on && untrack(() => untilPan)) stage = 'gone';
  });
  onMount(() => {
    const off = onPan(() => {
      if (stage === 'gone') return;
      mark();
      stage = 'gone';
    });
    return () => (off(), clearTimeout(timer));
  });
</script>

{#if stage === 'shown' && on}
  <p class="hint" role="status" data-pan-hint={room} out:fade={{ duration: 300 }}>{t('room.panHint')}</p>
{/if}

<style>
  /* centred under the rooms' top row (the back pill's, and the museum chip's あたらしい tag under it), the HUD's cream pill */
  .hint {
    position: absolute; z-index: 2; left: 50%; top: calc(var(--ui-top) + 92px); transform: translateX(-50%);
    margin: 0; padding: 9px 16px; border-radius: var(--r-pill); background: var(--c-cream); color: var(--c-ink);
    box-shadow: 0 var(--lip-h) 0 var(--c-lip); font: 700 var(--fs-body)/1.2 var(--font-ui); white-space: nowrap; pointer-events: none;
    animation: in 260ms ease-out both;
  }
  @keyframes in { from { opacity: 0; transform: translate(-50%, -6px); } }
  @media (prefers-reduced-motion: reduce) { .hint { animation: none; } }
</style>
