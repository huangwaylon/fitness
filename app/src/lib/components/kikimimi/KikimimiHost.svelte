<script lang="ts">
  // ききみみ クイズ's always-loaded host (docs/kikimimi.md "UI"), in the island scene beside its shared Live: the invite
  // banner (「ウェイが ききとりクイズに さそっています」 [さんか], through the one toast host) and the game's sheet, its
  // own chunk, mounted from its first opening (せってい's あそぶ, the banner's さんか: invite.svelte.ts openQuiz).
  import type { Live } from '#lib/sync/live.ts';
  import type { Who } from '#lib/types.ts';
  import { lazy } from '#lib/ui-state/reload.ts';
  import { toasts } from '#lib/ui-state/toast.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { t } from '#lib/i18n/index.ts';
  import { listenQuiz, openQuiz, quiz } from './invite.svelte.ts';

  let { live }: { live: Live | null } = $props();
  const loadSheet = lazy(() => import('./KikimimiSheet.svelte'));

  /** The banner shown for this game (dropped when its host cancels it). */
  let shownFor: { g: string; id: number } | null = null;
  const INVITE_MS = 15_000;

  $effect(() => {
    const l = live;
    return listenQuiz(
      l,
      (host, g) => {
        const v = week.view;
        if (!v) return;
        const name = host === 'G' ? v.guest.villagerName : v.people[host].villagerName;
        toasts.show(t('kiki.invite', { name }), INVITE_MS, { person: host as Who, low: true, action: { label: t('kiki.join'), run: () => openQuiz(g) } });
        shownFor = { g, id: toasts.current?.id ?? 0 };
      },
      (g) => {
        if (shownFor?.g === g && toasts.current?.id === shownFor.id) toasts.dismiss();
        shownFor = null;
      }
    );
  });
</script>

{#if quiz.mounted}
  {#await loadSheet() then { default: KikimimiSheet }}<KikimimiSheet bind:open={quiz.open} join={quiz.join} />{/await}
{/if}
