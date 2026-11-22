<script lang="ts">
  // A room's phrases (world/say.ts; TentRoom, MuseumRoom): the say button at the bottom right opens the island's phrase
  // picker; a pick hops my villager and shows the phrase over it for a few seconds, here and on the phones whose
  // villager is in this room too (the relay's `say` with this room's `sc`: one place at a time). My villager's eyes
  // (EyeToggle) are the button's mirror at the bottom left, the screenshot pair over them (ShotTools). The room hands on the relay's phrases (say), the camera's
  // moves (hold, track) and its pointerdowns (closedBy).
  //   <RoomSay bind:this={roomSay} {scene} sc="m" shown={…} {me} {partner} {nameOf} room={() => ({ eng, fpv, canvas, bottom })} … />
  import { untrack } from 'svelte';
  import Says from '../island/Says.svelte';
  import SayPicker from '../island/SayPicker.svelte';
  import SayButton from '../island/SayButton.svelte';
  import EyeToggle from './EyeToggle.svelte';
  import ShotTools from './ShotTools.svelte';
  import { roomSpeaker } from './speaker.ts';
  import type { RoomEngine } from './roomCore.ts';
  import { SAY_TAG, rememberSay, sayGate } from '#lib/world/say.ts';
  import type { SayScope } from '#lib/contract/live-protocol.ts';
  import type { Live } from '#lib/sync/live.ts';
  import type { Who } from '#lib/types.ts';

  // `sc`: where a phrase said in here is (the tent `t`, うめ's `u`, the guest's `v`, the museum `m`); `shown`: the button
  // and the eyes (gone, the picker goes with them); `room`: the room now (roomSpeaker's); `seated(w)`: no hop then;
  // `lift`: the docks over the room's foot (CSS length)
  let { scene, sc, shown, me, partner, nameOf, room, seated, relay, lift = '0px' }: {
    scene?: HTMLElement; sc: SayScope; shown: boolean; me: Who; partner: Who; nameOf: (w: Who) => string; seated: (w: Who) => boolean; relay: Live | null; lift?: string;
    room: () => { eng: RoomEngine | null; fpv: boolean; canvas: HTMLCanvasElement | undefined; bottom: number };
  } = $props();

  let says = $state<ReturnType<typeof Says>>();
  /** The say button while its picker is open. */
  let sayAt = $state<HTMLElement | null>(null);
  let sayBtn = $state<HTMLButtonElement>();
  /** The pointerdown that closed the picker. */
  let closedByEv: Event | null = null;

  /** `text` over a villager in here (mine: picked here; another's: from the relay) and a hop. */
  export function say(w: Who, text: string) {
    const { eng } = room();
    if (!eng?.at(w)) return;
    says?.say(w === me ? 'mine' : w === partner ? 'partner' : 'third', text, roomSpeaker(w, me, room), { name: nameOf(w), colour: SAY_TAG[w] });
    if (!eng.walking(w) && !seated(w)) eng.hop(w);
  }
  export const hold = (on: boolean) => says?.hold(on);
  export const hush = () => says?.hush();
  /** (a balloon carried with its villager while the camera moves: Says.track) */
  export const track = () => says?.track();
  /** Whether this pointerdown closed the picker: on the room it only closes (nobody walks, the camera stays). */
  export function closedBy(e: Event): boolean {
    if (e !== closedByEv) return false;
    closedByEv = null;
    return true;
  }

  function close(by?: Event) {
    if (!sayAt) return;
    sayAt = null;
    if (by) closedByEv = by;
  }
  function pick(text: string) {
    close();
    rememberSay(text); // (a quick pick again: first)
    say(me, text);
    sayOut.say(text);
  }
  const sayOut = sayGate((text) => void relay?.send({ kind: 'say', text, sc }));
  $effect(() => () => sayOut.stop());
  $effect(() => {
    if (sayAt && !shown) untrack(() => close());
  });
</script>

<Says bind:this={says} {scene} />
{#if sayAt && scene}
  <SayPicker {scene} anchor={sayAt} onpick={pick} onclose={(e) => {
    close(e);
    if (!e) sayBtn?.focus({ preventScroll: true }); // ✕ or Esc: the focus back on its button
  }} />
{/if}
{#if shown}
  <div class="dock say" style:--lift={lift}><SayButton bind:el={sayBtn} open={!!sayAt} onopen={(el) => (sayAt = el)} /></div>
  <div class="dock eye" style:--lift={lift}><ShotTools /><EyeToggle /></div>
{/if}

<style>
  .dock { position: absolute; z-index: 3; bottom: calc(var(--safe-bottom, 0px) + 14px + var(--lift)); }
  .say { right: calc(var(--safe-right, 0px) + 8px); }
  .eye { left: calc(var(--safe-left, 0px) + 8px); display: flex; flex-direction: column; align-items: center; }
</style>
