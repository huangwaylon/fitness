<script lang="ts">
  // One of the old site's icons (icons.ts), as its sprite drew it: `<svg class="ic …">`, the stroke in currentColor.
  //   <CIcon name="tent" />   <CIcon name="calendar" cls="ic-tab" />
  import { iconOf } from './icons.ts';

  let { name, cls = '', size }: { name: string; cls?: string; size?: number } = $props();
  const ic = $derived(iconOf(name));
</script>

<svg class="ic {cls}" viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" stroke-width={ic.sw} stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
  {#each ic.s as s, i (i)}
    {#if 'd' in s}<path d={s.d} />{:else if 'c' in s}<circle cx={s.c[0]} cy={s.c[1]} r={s.c[2]} />{:else}<rect x={s.r[0]} y={s.r[1]} width={s.r[2]} height={s.r[3]} rx={s.r[4]} />{/if}
  {/each}
</svg>
