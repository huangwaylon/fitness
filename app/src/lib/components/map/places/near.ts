// Which saved places a non-places map shows (docs/places.md "Map", docs/hiking.md "Saved places"), pure: those within
// NEAR_M of the map's path (a trail's track; a trip day's stops and legs in order), at most NEAR_MAX, nearest first.
// The path, never the view: the set stays put as the map pans (browsing the view is 保存した場所's own page).
import { nearTrack } from '#lib/places/geo.ts';

export const NEAR_M = 2000;
export const NEAR_MAX = 40;

/** The rows near `path` ([lon, lat] points in order; empty: none), nearest first. */
export const nearRoute = <T extends { lat: number; lng: number }>(rows: readonly T[], path: readonly (readonly number[])[]): T[] =>
  nearTrack(rows, path, NEAR_M, NEAR_MAX).map((x) => x.it);
