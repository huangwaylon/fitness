<script lang="ts">
  // A toast's face for a person's event (ui/Toast.svelte): their avatar (a player look) or their villager's head. Its
  // own component, bound by the app's shell (routes/AppShell.svelte: toastPersonFace), so the toasts of a bare page
  // (ジム, 共有リンク: none of a person) load neither the looks nor the villagers.
  import type { Who } from '#lib/types.ts';
  import Villager from './Villager.svelte';
  import Avatar from './Avatar.svelte';
  import { lookOf } from '#lib/store/look.ts';

  let { person, size }: { person: Who; size: number } = $props();
</script>

{#if lookOf(person).kind === 'player'}<Avatar worn {person} {size} />
{:else}<Villager {person} {size} head animate={false} eager />{/if}
