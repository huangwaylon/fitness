<script lang="ts">
  // しまの エディター (docs/island-layout.md "The editor"): the island's layout on a big screen, for anyone paired (A, B
  // or the guest: 2026-11-06, the island is everyone's alike). Unlinked, noindex.
  // `?view=phone&cam=<z>` shows the 3D preview alone, as a phone's camera sees it; `&edit` with the island's もようがえ
  // over it (layoutEdit/IslandEdit: the phone's); `&preview=0` the plan in its place (no WebGL: the e2e).
  import { onMount } from 'svelte';
  import Editor from '#lib/components/editor/Editor.svelte';
  import Preview3D from '#lib/components/editor/Preview3D.svelte';
  import IslandEdit, { type EditStage } from '#lib/components/layoutEdit/IslandEdit.svelte';
  import PlanStage from '#lib/components/layoutEdit/PlanStage.svelte';
  import { layout } from '#lib/store/layout.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { sendDecors } from '#lib/store/actions.ts';
  import { LIVE_URL, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';

  const q = new URLSearchParams(location.search);
  const phone = q.get('view') === 'phone';
  // `?view=orbit` (with `&at=x,y,z&eye=x,y,z`): the 3D preview alone, turned freely
  const orbit = q.get('view') === 'orbit';
  const flat = q.get('preview') === '0';
  let editing = $state(q.has('edit'));
  let stage = $state<EditStage>();
  let camZ = $state(Number(q.get('cam') ?? 300));
  const view = $derived(week.view);
  const me = $derived(view?.viewer ?? null);

  let relay = $state<Live | null>(null);
  onMount(() => {
    let own: Live | null = null;
    const stop = $effect.root(() => {
      $effect(() => {
        const who = me;
        if (!who || relay) return;
        own = week.demo ? createLocalLive(who) : null;
        relay = own ?? (LIVE_URL ? liveRelay() : null);
        layout.attach(relay, who, !!week.demo);
        own?.start();
        layout.sink = (ops) => sendDecors(ops);
      });
      // the record's layout rows (the model's, queued ones included)
      $effect(() => {
        const m = week.model;
        if (m) layout.rows(m.state.layout);
      });
    });
    return () => {
      stop();
      layout.sink = null;
      own?.stop();
    };
  });
</script>

<svelte:head>
  <meta name="robots" content="noindex,nofollow" />
  <title>島のエディター</title>
</svelte:head>

{#if orbit}
  <div class="full"><Preview3D layout={layout.current} mode="orbit" /></div>
{:else if phone}
  <div class="full">
    {#if flat}<PlanStage layout={layout.current} bind:camZ bind:stage />{:else}<Preview3D layout={layout.current} mode="phone" bind:camZ bind:stage />{/if}
    {#if editing && stage && me}<IslandEdit {stage} {relay} {me} ondone={() => (editing = false)} />{/if}
  </div>
{:else if !view}
  <p class="msg">…</p>
{:else if me}
  <Editor {me} {relay} />
{/if}

<style>
  .full { position: fixed; inset: 0; }
  .msg {
    position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px;
    background: var(--c-paper); text-align: center; font-family: 'Zen Maru Gothic', system-ui, sans-serif; color: var(--c-ink);
  }
</style>
