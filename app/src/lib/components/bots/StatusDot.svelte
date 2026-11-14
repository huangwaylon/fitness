<script lang="ts">
  // A bot's dot (docs/design.md "Bots"), one look for the tabs (12px, the icon's corner), the menu's ボット and the
  // verdict card (14px): colour is health (good leaf, warn yuzu, bad coral, idle a sunk disc, unknown a hollow ring;
  // busy draws as good), shape is 「!」 (a person must look: a bar and a point, ink on yuzu, cream on coral, 14px).
  // Ringed in its plate (`--plate`: the card, a selected tab's cream), so a yuzu dot reads on the yuzu pill; warn's
  // ring darker. `stale` (the last read failed or is old): dimmed. Hidden from VoiceOver: its holder says it.
  import type { BotTone } from '#lib/bots/types.ts';

  let { tone, look = false, stale = false, size = 12 }: { tone: BotTone; look?: boolean; stale?: boolean; size?: number } = $props();
  const drawn = $derived(tone === 'busy' ? 'good' : tone);
</script>

<i class="sdot {drawn}" class:look class:stale style:--d="{look ? Math.max(size, 14) : size}px" data-dot={drawn} data-look={look ? '' : undefined} data-stale={stale ? '' : undefined} aria-hidden="true"></i>

<style>
  .sdot {
    --ring: rgb(74 58 44 / .35);
    position: relative; display: inline-block; flex: none; width: var(--d); height: var(--d); border-radius: 50%; font-style: normal;
    box-shadow: inset 0 0 0 1px var(--ring), 0 0 0 2px var(--plate, var(--card));
  }
  :global(:root[data-tod='night']) .sdot { --ring: var(--n-edge); }
  .good { background: var(--c-leaf); }
  .warn { --ring: rgb(74 58 44 / .55); background: var(--c-yuzu); color: var(--c-ink); }
  .bad { background: var(--c-coral); color: var(--c-cream); }
  .idle { background: var(--ctl-off); box-shadow: inset 0 0 0 1px var(--edge), 0 0 0 2px var(--plate, var(--card)); }
  .unknown { background: transparent; box-shadow: inset 0 0 0 1.5px var(--edge), 0 0 0 2px var(--plate, var(--card)); }
  .stale { opacity: .5; }
  /* 「!」: a 2px bar over a 2px point, centred */
  .look::before, .look::after { content: ''; position: absolute; left: 50%; width: 2px; translate: -50% 0; background: currentColor; border-radius: 1px; }
  .look::before { top: 22%; height: 36%; }
  .look::after { bottom: 20%; height: 2px; }
</style>
