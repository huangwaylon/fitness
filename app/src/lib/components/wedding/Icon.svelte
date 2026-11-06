<script lang="ts">
  // けっこんしき's line icons, one drawing each, stroked in currentColor: ✓, ✎, 🗑, ＋, a link (`size` px square).
  const PATHS = {
    tick: 'M5 12.5 10 17.5 19 7',
    pen: 'M4 20h4L19 9l-4-4L4 16v4zM14 6l4 4',
    bin: 'M5 7h14M10 4h4M7 7l1 13h8l1-13M10 11v6M14 11v6',
    plus: 'M12 5v14M5 12h14',
    link: 'M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'
  };
  let { name, size = 22 }: { name: keyof typeof PATHS; size?: number } = $props();
</script>

<svg class="ic {name}" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d={PATHS[name]} /></svg>

<style>
  .ic { flex: none; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
  .tick, .plus { stroke-width: 3; }
</style>
