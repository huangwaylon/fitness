// トレイル's stroke icons (the hiking app's ICON_PATHS: lucide shapes), drawn by Ic.svelte in currentColor.
export const ICONS = {
  dist: '<path d="m18 8 4 4-4 4"/><path d="m6 8-4 4 4 4"/><path d="M2 12h20"/>',
  gain: '<path d="m8 3 4 8 5-5 5 15H2L8 3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  calendar: '<path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2.5"/><path d="M3 10h18"/>',
  sunrise: '<path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
  sunset: '<path d="M12 10V2"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m16 6-4 4-4-4"/><path d="M16 18a4 4 0 0 0-8 0"/>',
  ext: '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
  chevDown: '<path d="m6 9 6 6 6-6"/>',
  sort: '<path d="M7 4v16"/><path d="m3.5 7.5 3.5-3.5 3.5 3.5"/><path d="M17 20V4"/><path d="m13.5 16.5 3.5 3.5 3.5-3.5"/>',
  locate: '<circle cx="12" cy="12" r="6.5"/><circle cx="12" cy="12" r="2"/><path d="M12 2.5v3"/><path d="M12 18.5v3"/><path d="M2.5 12h3"/><path d="M18.5 12h3"/>',
  plus: '<path d="M12 5v14"/><path d="M5 12h14"/>',
  minus: '<path d="M5 12h14"/>'
} as const;

export type IconName = keyof typeof ICONS;
