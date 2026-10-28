<script lang="ts">
  interface Props {
    name: string;
    size?: number;
    viewBox?: string;
    class?: string;
  }
  let { name, size = 24, viewBox, class: cls = '' }: Props = $props();
</script>

<svg class="icon {cls}" width={size} height={size} viewBox={viewBox} aria-hidden="true" focusable="false"
  ><use href="#{name}" /></svg>

<style>
  .icon { display: block; flex: none; }
</style>
