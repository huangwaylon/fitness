// A part's swatch (its texture's own dominant colour: scripts/players3d-models.ts) for the 2D stand-in figure
// (PlayerFigure), from swatches.json alone: the first load's heads draw without the part table (the closet, ~80 KB,
// stays in すがた's chunk). A part the bundled table hasn't: `fallback`.
import type { Hex, PartId } from '#lib/contract/look.ts';
import SWATCHES from './swatches.json' with { type: 'json' };

const SW = SWATCHES.sw as Record<string, Hex>;

export const swatchOf = (id: PartId | null | undefined, fallback: Hex): Hex => (id && SW[id]) || fallback;
