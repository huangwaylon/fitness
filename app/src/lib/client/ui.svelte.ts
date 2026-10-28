// Tiny shared UI state (not data): whether a full-screen overlay (the Sunday harvest) is open, so
// pages hold their own toasts until it closes (U6).
export const ui = $state({ overlay: false });
