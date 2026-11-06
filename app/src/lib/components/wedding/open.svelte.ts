// けっこんしき's always-loaded part (docs/wedding.md): whether the board's sheet is mounted (from its first opening)
// and open. The leaf menu's pill opens it; IslandScene covers the island while it's open. Nothing of the board itself
// is imported here: it comes with the sheet's chunk (WeddingSheet.svelte).

export const weddingSheet = $state<{ mounted: boolean; open: boolean }>({ mounted: false, open: false });

/** Open the board's sheet (the menu pill's pick, after its press beat). */
export function openWedding(): void {
  weddingSheet.mounted = true;
  weddingSheet.open = true;
}
