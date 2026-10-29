// Tiny shared UI state (not data): whether a full-screen overlay (the Sunday harvest) is open, so
// pages hold their own toasts until it closes (U6); and a pending きろく entry for the しまフォン.
export const ui = $state<{ overlay: boolean; phoneEntry: { tab: 'body' | 'money'; week?: string } | null }>({ overlay: false, phoneEntry: null });

/** Open the しまフォン straight into きろく (score ribbon → this week, jar total → お金). */
export function openKiroku(entry: { tab: 'body' | 'money'; week?: string }): void {
  ui.phoneEntry = entry;
}
