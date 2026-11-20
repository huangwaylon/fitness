<script lang="ts">
  // `/s#<token>`: a 共有リンク's page (components/share/SharePage.svelte; docs/travel.md "Sharing"). Served as its own
  // shell (build-pages/s.html: scripts/headers.ts) without the island's preloads; the root layout runs bare here.
  import SharePage from '#lib/components/share/SharePage.svelte';
</script>

<SharePage />
