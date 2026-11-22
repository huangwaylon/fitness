// The uses ridden or sat in (poses.ts GymUse, dispatched by base(); docs/design.md "The gym"), looped on the wall clock
// while one's on the piece. Each a UseDef (poses-kit.ts). Pure: unit-tested.
import type { UseDef } from './poses-kit.ts';

export const RIDE_USES = {} as const satisfies Record<string, UseDef>;
