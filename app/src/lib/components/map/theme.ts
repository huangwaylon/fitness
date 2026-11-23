// The basemap's NookPhone palette (docs/travel.md "Maps"; the trip and places maps): NH's map app, soft and flat, its sea
// blue, cream sand, gentle greens, pale warm roads with a soft edge; the app's tokens (styles/tokens.css) where they
// fit. Hex only (the GL style and a canvas can't read CSS custom properties).

export const NOOK = {
  // NH's map sea (lighter than the island's --sea-flat, which is the open sea under its tint)
  sea: '#86CDEB',
  // the land a soft yellow-green; parks, scrub, woods a step greener each
  land: '#DCEFB4',
  park: '#BCE29A',
  scrub: '#CDE8A6',
  farm: '#D6EDAE',
  wood: '#A6D88A',
  // sand cream (--c-cream / --c-paper's family)
  sand: '#F7EAC3',
  // towns paler, nearly cream; buildings a soft tan block
  urban: '#E8F0C8',
  buildings: '#EADFC0',
  // roads: --c-card cream, the minor ones edged in --c-lip; main roads yuzu-pale, the expressways a warmer yuzu
  road: '#FFFCF2',
  roadCasing: '#E3CF9F',
  major: '#FFF4CF',
  majorCasing: '#E0C48A',
  highway: '#FFE48A',
  highwayCasing: '#E6B22E',
  rail: '#C9B79A',
  boundary: '#B9A98C',
  // labels in --c-ink on a cream halo (--c-cream); water names a deep sea blue on the sea
  label: '#4A3A2C',
  labelSoft: '#6B5544',
  roadLabel: '#7A6450',
  parkLabel: '#256E33',
  waterLabel: '#2D6F96',
  halo: '#FFF9E3',
  waterHalo: '#C6EBF7'
};

export type Theme = typeof NOOK;

/** The markers' tokens (literal copies of styles/tokens.css): the clusters' cream and edge, the ink, the ring's yuzu,
 *  the location's sky. */
export const C = { cream: '#FFF9E3', edge: '#937047', ink: '#4A3A2C', yuzu: '#FFD84D', sky: '#4F9BE0' } as const;
