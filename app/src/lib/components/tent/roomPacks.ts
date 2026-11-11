// The rooms' packs (scripts/room-packs.ts: static/room/pack/), one store for the page: the rooms' pieces, pictures and
// icons (tent/items.ts) and the island's outdoor catalogue (world3d/outdoorModels.ts: the same pieces outdoors) cut
// their files from the same packs, each fetched whole and once (Pages ignores a Range), held a while here (let go
// ROOM_IDLE_MS after the last ask: a room's load is a burst, its models then the engine's cache's; and as the page is
// hidden) and for good by the service worker (its room cache: every /room/ file on first use) and the HTTP cache.
import { staticUrl } from '#lib/staticUrl.ts';
import { PackStore } from '#lib/packStore.ts';

const ROOM_IDLE_MS = 10_000;
export const roomPacks = new PackStore({ url: (stem) => staticUrl(`room/pack/${stem}.pak`), cap: 6_000_000, tag: 'room', dropOnHide: true, idleMs: ROOM_IDLE_MS });
