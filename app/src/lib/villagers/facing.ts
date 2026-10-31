// Which way each villager render faces as drawn, and which must never mirror (no runtime imports: roster.ts, look.ts and
// scripts/fetch-assets.ts all read it, the last outside Vite).
import type { RosterId } from './roster.ts';

// Checked by eye against the renders (a contact sheet of static/art/villagers); update when adding villagers. None of
// the 259 added in the full-NH pass faces right (the side-profile species, anteaters, eagles, elephants, look left).
// Special characters: Orville's beak points right; K.K.'s guitar (it would turn left-handed), the DAL text on
// Orville's mug and Wilbur's badge, Kapp'n's shirt logo and Gulliver's sailor uniform never mirror.
export const LOOKS_RIGHT: ReadonlySet<RosterId> = new Set<RosterId>(['goldie', 'bunnie', 'judy', 'molly', 'dom', 'orville']);
export const NO_MIRROR: ReadonlySet<RosterId> = new Set<RosterId>([
  'raymond', 'sasha', 'stitches', 'lucky', 'agent-s', 'kid-cat', 'rocket', 'tad', 'octavian',
  'coach', 'tank', 'chabwick', 'curt', 'axel', 'marcie', 'kk-slider', 'orville', 'wilbur', 'kappn', 'gulliver',
  // the rest of NH (contact sheets of the 259 added renders): numbers, letters and logos on the outfit…
  'astrid', 'bella', 'tabby', 'benedict', 'biff', 'chow', 'spike', 'big-top', 'bill', 'boyd', 'buzz', 'ricky', 'drift', 'jay',
  'peewee', 'victoria', 'walker', 'broccolo', 'mac', 'peck', 'camofrog', 'frank', 'pudge', 'tex', 'mott', 'puck', 'rilla',
  'samson', 'tom',
  // …and one-sided faces: Cece's and Kody's patches, Peaches' mark, Rasher's and Walt's scars, Stinky's two-tone mask
  'cece', 'kody', 'peaches', 'rasher', 'walt', 'stinky'
]);
