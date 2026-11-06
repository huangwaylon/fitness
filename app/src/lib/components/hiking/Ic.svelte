<script module lang="ts">
  // トレイル's old icon names over the app's one set (ui/Icon.svelte, docs/design.md "Unified kit"), 18px unless the
  // parent sizes `.ic`; goes once トレイル draws ui/Icon itself.
  import type { IconName as Name } from '../ui/Icon.svelte';
  const NAMES = {
    dist: 'distance', gain: 'mountain', clock: 'clock', pin: 'pin', users: 'users', calendar: 'calendar', sunrise: 'sunrise',
    sunset: 'sunset', ext: 'arrow-up-right', chevDown: 'chevron-down', sort: 'sort', locate: 'locate', plus: 'plus', minus: 'minus'
  } as const satisfies Record<string, Name>;
  export type IconName = keyof typeof NAMES;
</script>

<script lang="ts">
  import Icon from '../ui/Icon.svelte';

  let { name, w = 1.75 }: { name: IconName; w?: number } = $props();
</script>

<Icon name={NAMES[name]} size={18} stroke={w} />
