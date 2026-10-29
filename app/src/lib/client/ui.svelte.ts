// Tiny shared UI state (not data): whether a full-screen overlay (the Sunday harvest) is open, so
// pages hold their own toasts until it closes (U6); a pending きろく entry for the しまフォン; and the open sheets,
// newest last (the banner renders inside the topmost one, round 7 F1).
export const ui = $state<{ overlay: boolean; phoneEntry: { tab: 'body' | 'money'; week?: string } | null; sheets: number[] }>({
  overlay: false, phoneEntry: null, sheets: []
});

/** Open the しまフォン straight into きろく (score ribbon → this week, jar total → お金). */
export function openKiroku(entry: { tab: 'body' | 'money'; week?: string }): void {
  ui.phoneEntry = entry;
}
