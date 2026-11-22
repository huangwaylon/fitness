// The uses ridden or sat in (villager3d/poses-ride.ts), where each is used: by the rooms' item code (`room`) and the
// island's kind (`island`), spread into scripts/seat-anchors.ts's ROOM_USE and USE.
import type { UseShape } from '../src/lib/components/villager3d/seats3d.ts';

export const RIDE_ROOM: Record<string, UseShape> = {};
export const RIDE_ISLAND: Record<string, UseShape> = {};
