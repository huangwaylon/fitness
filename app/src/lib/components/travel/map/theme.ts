// The trip map's NookPhone palette (docs/travel.md "Maps"): NH's map app, soft and flat, its sea blue, cream sand,
// gentle greens, pale warm roads with a soft edge; the app's tokens (styles/tokens.css) where they fit. Hex only (the
// GL style can't read CSS custom properties).

export interface Theme {
  sea: string; land: string; park: string; wood: string; scrub: string; farm: string; sand: string; beach: string; urban: string;
  buildings: string; pier: string;
  road: string; roadCasing: string; major: string; majorCasing: string; highway: string; highwayCasing: string; rail: string; boundary: string;
  label: string; labelSoft: string; roadLabel: string; parkLabel: string; waterLabel: string; halo: string; waterHalo: string;
}

export const NOOK: Theme = {
  // NH's map sea (lighter than the island's --sea-flat, which is the open sea under its tint)
  sea: '#86CDEB',
  // the land a soft yellow-green; parks, scrub, woods a step greener each
  land: '#DCEFB4',
  park: '#BCE29A',
  scrub: '#CDE8A6',
  farm: '#D6EDAE',
  wood: '#A6D88A',
  // sand and beaches cream (--c-cream / --c-paper's family)
  sand: '#F7EAC3',
  beach: '#FBEFC6',
  // towns paler, nearly cream; buildings a soft tan block
  urban: '#E8F0C8',
  buildings: '#EADFC0',
  pier: '#F2E6C8',
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
