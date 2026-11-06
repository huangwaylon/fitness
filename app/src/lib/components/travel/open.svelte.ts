// りょこう's always-loaded part (docs/travel.md "The sheet"): whether its sheet is mounted (from its first opening:
// the chunk with the guides, their strings and the sheet) and open (the island paused under it).
export const trips = $state<{ mounted: boolean; open: boolean }>({ mounted: false, open: false });

/** The menu's りょこう pill (after its press beat). */
export function openTrips(): void {
  trips.mounted = true;
  trips.open = true;
}
