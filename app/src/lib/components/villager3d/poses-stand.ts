// The uses stood at (poses.ts GymUse, dispatched by base(); docs/design.md "The gym"): a piece one stands in front of
// and works at, looped on the wall clock while one's on it. Each a UseDef (poses-kit.ts). Pure: unit-tested.
import type { UseDef } from './poses-kit.ts';

export const STAND_USES = {} as const satisfies Record<string, UseDef>;
