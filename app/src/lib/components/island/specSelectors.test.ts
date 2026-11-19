// The specs ask the island by kind and id (window.__world3d: island/probe.ts), never by the hidden DOM island's
// selectors (docs/ops/testing.md "The test API"; the R4 plan: the DOM island goes, its nodes with it). Each family moved
// off the DOM lists its selectors here; only the hook layer (probe.ts, e2e/island.ts, e2e/probe.spec.ts) may name them,
// and a line marked `// r4-dom: <why>` (what only a later step can move: the 3D pick, the canvas router).
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const E2E = join(import.meta.dirname, '../../../../e2e');
const SCRIPTS = join(import.meta.dirname, '../../../../scripts');
/** The hook layer: what reads the DOM island for the specs, for now. */
const HOOKS = new Set(['island.ts', 'probe.spec.ts']);

/** The DOM island's selectors by family (what replaced them: `__world3d`'s hook, e2e/island.ts's helper). */
const FORBIDDEN: Record<string, RegExp[]> = {
  // actor(slot): walking, act, fx, hat, stung, swollen, tricked, inside, seat, gym, who, v3; box('villager', slot);
  // tapOn/tapBox; feetOf, walking, villager, slotOf; watchComings' and watchFor's { actor, is }; controls()
  villagers: [/data-actor(?![\w-])/, /\.vil(?![\w-])/, /\.actor[[:.\s'"]/, /data-(stung|swollen|tricked|hat|inside|gym|seat|v3)(?![\w-])/, /\.body\[data-act/, /\.fxa?\.(confetti|hearts|sparkles)/],
  // pick(x, y)'s kind 'building' and box('building', id) (its door's tap area); the ids from __world.geo().BUILDINGS
  buildings: [/data-building(?![\w-])/, /(?<!dataset)\.door(?![\w-])/]
};

const files = [
  ...readdirSync(E2E).filter((f) => /\.ts$/.test(f) && !HOOKS.has(f)).map((f) => join(E2E, f)),
  join(SCRIPTS, 'leak-probe.ts')
];

describe('the specs never select the hidden DOM island', () => {
  for (const [family, res] of Object.entries(FORBIDDEN))
    it(family, () => {
      const hits = files.flatMap((f) =>
        readFileSync(f, 'utf8').split('\n').flatMap((line, i) => (!line.includes('r4-dom:') && res.some((re) => re.test(line)) ? [`${f.split('/').slice(-2).join('/')}:${i + 1}: ${line.trim().slice(0, 120)}`] : []))
      );
      expect(hits).toEqual([]);
    });
});
