<script lang="ts">
  // A player in ききみみ クイズ: their head as worn (Avatar), their villager's name, and a badge under it: ✓ answered (never
  // what), ✨ / 💦 at the reveal, 📖 once they've tapped よみおわった, their score; in the lobby joined (here: as is, no
  // badge) or まだ (dimmed).
  import type { Who } from '#lib/types.ts';
  import Avatar from '../characters/Avatar.svelte';
  import Mark from '../ui/Mark.svelte';
  import { week } from '#lib/store/week.svelte.ts';
  import { villagerNameOf } from '#lib/ui-state/viewer.ts';
  import { t } from '#lib/i18n/index.ts';

  interface Props {
    who: Who;
    /** ✓: answered; right / wrong: the reveal's reaction; here: joined the lobby (as is, no badge: ✓ is an answer's);
     *  away: dimmed (a locked phone, not joined yet). */
    state?: 'answered' | 'right' | 'wrong' | 'here' | 'away' | null;
    /** The line under the name (a score, まだ). */
    note?: string | null;
    /** A reveal's よみおわった tapped: 📖 at the face's other corner. */
    ready?: boolean;
    size?: number;
  }
  let { who, state = null, note = null, ready = false, size = 40 }: Props = $props();
  const name = $derived(week.view ? villagerNameOf(week.view, who) : '');
</script>

<div class="pc" class:away={state === 'away'} data-player={who} data-state={state ?? undefined} data-ready={ready || undefined}>
  <span class="face">
    <Avatar worn person={who} {size} />
    {#if state === 'answered'}<span class="badge ok" aria-hidden="true">✓</span>
    {:else if state === 'right'}<span class="badge mk" aria-hidden="true"><Mark id="sparkle" /></span>
    {:else if state === 'wrong'}<span class="badge mk" aria-hidden="true"><Mark id="sweat" /></span>{/if}
    {#if ready}<span class="read" aria-label={t('kiki.readyTap')}>📖</span>{/if}
  </span>
  <span class="nm">{name}</span>
  {#if note}<span class="note">{note}</span>{/if}
</div>

<style>
  .pc { display: grid; justify-items: center; gap: 2px; min-width: 64px; max-width: 96px; text-align: center; }
  .pc.away { opacity: .45; }
  .face { position: relative; line-height: 0; }
  .badge { position: absolute; right: -6px; top: -4px; display: grid; place-items: center; }
  .ok {
    width: 22px; height: 22px; border-radius: 50%; background: var(--c-leaf); color: var(--c-ink);
    box-shadow: inset 0 0 0 2px var(--c-leaf-edge); font: 700 13px/1 var(--font-ui); animation: pop 260ms var(--ease-bounce) both;
  }
  .read {
    position: absolute; left: -6px; bottom: -4px; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center;
    background: var(--c-card); box-shadow: inset 0 0 0 2px var(--c-edge); font: 12px/1 var(--font-ui); animation: pop 260ms var(--ease-bounce) both;
  }
  .mk { width: 26px; height: 26px; animation: pop 320ms var(--ease-bounce) both; }
  .mk :global(svg) { width: 100%; height: 100%; }
  .nm { font: 700 var(--fs-s)/1.2 var(--font-ui); max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .note { font: 700 var(--fs-xs)/1.2 var(--font-num, var(--font-ui)); color: var(--text-soft); }
  @keyframes pop { from { transform: scale(.2); opacity: 0; } to { transform: none; opacity: 1; } }
  @media (prefers-reduced-motion: reduce) { .ok, .mk, .read { animation: none; } }
</style>
