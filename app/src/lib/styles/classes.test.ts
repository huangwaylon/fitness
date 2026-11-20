// A data id is never a global class: Visitor once rendered `class="visitor {id}"`, so Chip's day gave the beaver's node
// theme.css's `.chip` (a 32 px cream pill by him all day) and Toast's `:root:has(.island .chip)` (the banner as low as
// for the sync chip). Visitor and guest ids go in data-visitor (Chip's is one of the global classes). (No bug id is a
// class any more: the critters and a shaken tree's bug are the 3D island's.)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../..');

it('visitor and guest ids stay out of class= (chip is a global class)', () => {
  const s = readFileSync(join(SRC, 'lib/components/island/Visitor.svelte'), 'utf8');
  expect(s).toMatch(/class="visitor"/);
  expect(s).not.toMatch(/class="[^"]*\{(shown|id)\}/);
});
