<script lang="ts">
  // The partner's catches and finds shown here (partnerNews.ts): a plate in the bottom stack (catchStack.svelte.ts, as
  // mine), its icon popping up from their villager when that's in view, else from the spot. Out of view the icon comes
  // in from the screen's edge on their side. Decorative: the island's state is the shared day's (store/world.svelte.ts).
  //   <PartnerNews {scene} />   (inside .stage)
  import { showCatch } from './catchCard.ts';
  import { setPartnerSink, type PartnerNews } from './partnerNews.ts';
  import { useWorld } from './camera.svelte.ts';
  import { livePos } from '../motion/director.svelte.ts';
  import { actorOf } from '#lib/ui-state/cast.ts';
  import { stageGeo } from './placement.ts';
  import { VILLAGER } from './scene.ts';
  import { onDestroy } from 'svelte';

  let { scene }: { scene?: HTMLElement } = $props();
  const w = useWorld();

  function show(p: PartnerNews, text: string) {
    const id = p.who ? actorOf(p.who) : 'partner', who = id === 'mine' ? 'partner' : id;
    if (w.inView(p.x, p.z, -8)) {
      // over their villager when it's there, else over the spot
      const [vx, vz] = livePos(id), near = Math.hypot(vx - p.x, vz - p.z) < 60;
      const [sx, sy] = near ? w.screenU(vx, vz, VILLAGER.h) : w.screenU(p.x, p.z, p.lift ?? 4);
      showCatch(sx, sy, p.art, text, false, who);
      return;
    }
    // out of view: from the edge they're off (the screen's middle, top or bottom)
    const g = stageGeo(scene);
    showCatch(g ? (g.left + g.right) / 2 : 195, p.z > w.view.camZ ? 0 : (g?.bottom ?? 844), p.art, text, false, who);
  }
  setPartnerSink(show);
  onDestroy(() => setPartnerSink(null));
</script>
