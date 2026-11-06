<script lang="ts">
  // けっこんしき's sheet over the invented board (fixtures/board.ts), editable here as the store would be: `?as=A|B|G`
  // (G: the guest's read-only board), `?empty` (no board yet), `?conflict` (the note's two versions), `?date=` (the
  // board's today: the clock's preview day). The sheet opens at once; ✕ closes it and 「ひらく」 opens it again.
  import { page } from '$app/state';
  import WeddingSheet from '#lib/components/wedding/WeddingSheet.svelte';
  import { apply, boardOf, demoBoard, type Demo, type Op } from '#lib/components/wedding/fixtures/board.ts';
  import type { WeddingActions, Who3 } from '#lib/components/wedding/view.ts';
  import { dayKey } from '#lib/time/clock.ts';

  const q = page.url.searchParams;
  const as: Who3 = q.get('as') === 'G' ? 'G' : q.get('as') === 'B' ? 'B' : 'A';
  const today = dayKey();
  const start = demoBoard(today);
  if (q.has('conflict')) start.note = { ...start.note, conflict: { mine: start.note.md, theirs: '# かいじょう\n- **もりの チャペル** に へんこう？\n\nもう いちど はなそう。' } };
  let demo = $state<Demo>(start);
  const board = $derived(q.has('empty') ? null : boardOf(demo, today));
  let open = $state(true);
  let seq = 0;
  let at = 2;
  const go = (o: Op) => (demo = apply(demo, o));
  const actions: WeddingActions = {
    onadd: (t) => go({ op: 'add', t, id: `new-${++seq}`, by: as }),
    onedit: (id, patch) => go({ op: 'edit', id, patch }),
    ontick: (id, done) => go({ op: 'tick', id, done, by: as }),
    onremove: (id) => go({ op: 'remove', id, at: Date.now() }),
    onrestore: (id) => go({ op: 'restore', id }),
    onpurge: () => go({ op: 'purge' }),
    onconfig: (k, v) => go({ op: 'config', k, v }),
    onnote: (md) => go({ op: 'note', md, at: ++at })
  };
  const names: Record<Who3, string> = { A: 'ハル', B: 'ミオ', G: 'ソラ' };
</script>

<main class="dev" data-dev-wedding={as}>
  <button type="button" class="btn" data-dev-open onclick={() => (open = true)}>ひらく</button>
</main>
<WeddingSheet bind:open {board} canEdit={as !== 'G'} {names} actions={as === 'G' ? undefined : actions} />

<style>
  .dev { min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
</style>
