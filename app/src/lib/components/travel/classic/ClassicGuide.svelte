<script lang="ts">
  // A trip drawn like its original guide (`trip.classic`: Okinawa, Seattle; docs/design.md §Trips), under the trips
  // sheet's own header (‹ 沖縄 ✕) and in its scroller. A placeholder: the classic guides replace it.
  import type { Trip } from '#lib/travel/types.ts';

  let { trip }: { trip: Trip } = $props();
</script>

<div class="classic" data-classic={trip.id}></div>
