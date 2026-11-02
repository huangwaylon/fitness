<script lang="ts">
  // しまの エディター (docs/island-layout.md "The editor"): the island's layout on a big screen, the members' only
  // (the A or B key: the guest never edits the outdoors, and the record refuses it anyway). Unlinked, noindex.
  // `?view=phone&cam=<z>` shows the 3D preview alone, as a phone's camera sees it.
  import { onMount } from 'svelte';
  import { resolve } from '$app/paths';
  import Editor from '#lib/components/editor/Editor.svelte';
  import Preview3D from '#lib/components/editor/Preview3D.svelte';
  import { layout } from '#lib/store/layout.svelte.ts';
  import { week } from '#lib/store/week.svelte.ts';
  import { sendDecor } from '#lib/store/actions.ts';
  import { LIVE_URL, liveRelay, type Live } from '#lib/sync/live.ts';
  import { createLocalLive } from '#lib/sync/live-local.ts';

  const q = new URLSearchParams(location.search);
  const phone = q.get('view') === 'phone';
  let camZ = $state(Number(q.get('cam') ?? 300));
  const view = $derived(week.view);
  const me = $derived(view?.viewer === 'A' || view?.viewer === 'B' ? view.viewer : null);

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
        layout.sink = (op) => sendDecor(op);
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
  <title>しまの エディター</title>
</svelte:head>

{#if phone}
  <div class="full"><Preview3D layout={layout.current} mode="phone" bind:camZ /></div>
{:else if !view}
  <p class="msg">…</p>
{:else if !me}
  <div class="msg" data-members-only>
    <h1>しまの エディター</h1>
    <p>ウェイと うめだけが つかえます。{view.viewer === 'G' ? 'おきゃくさんは そとの へんこうが できません。' : ''}</p>
    <a href={resolve('/pair')}>この ブラウザを ペアリングする</a>
  </div>
{:else}
  <Editor {me} {relay} />
{/if}

<style>
  .full { position: fixed; inset: 0; }
  .msg {
    position: fixed; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 24px;
    background: var(--c-paper); text-align: center; font-family: 'Zen Maru Gothic', system-ui, sans-serif; color: var(--c-ink);
  }
  .msg p { max-width: 420px; }
  .msg a { color: var(--c-leaf-text); font-weight: 700; }
</style>
