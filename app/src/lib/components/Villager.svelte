<script lang="ts">
  import type { PersonId } from '#lib/types.ts';

  interface Props {
    person: PersonId;
    /** 'cat' | 'dog'; defaults follow the placeholders (A = Bean the dog, B = Mochi the cat). */
    species?: string | null;
    size?: number | string;
    label?: string;
  }
  let { person, species = null, size = 48, label }: Props = $props();
  const sym = $derived((species ?? (person === 'A' ? 'dog' : 'cat')) === 'dog' ? 'v-bean' : 'v-mochi');
  const dim = $derived(typeof size === 'number' ? `${size}px` : size);
</script>

<svg
  class="villager"
  viewBox="0 0 100 100"
  style:width={dim}
  style:height={dim}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
><use href="#{sym}" /></svg>

<style>
  .villager { display: block; flex: none; overflow: visible; }
</style>
