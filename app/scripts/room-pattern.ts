// NH's pattern part (docs/design.md "The tent"): a piece whose remake has patterns draws them on its `mReFabric`
// meshes, and where its first pattern is NH's "None" (the spreadsheet's variation with no `pattern` while others have
// one: a table's runner or cloth, a chair's cushion, a bear's ribbon), the part isn't there in that look; its model's
// own texture for it is a flat gray placeholder. scripts/room-models.ts converts the first variation (Remake_0_0), so
// such a piece's pattern part is left out (room-models-page.js `hide`), not drawn as a gray slab on top. Pure.

/** NH's material for a remake's pattern. */
export const PATTERN_PART = 'mReFabric';

/** Whether the first variation (the converted look) has no pattern while the piece has patterns: its part hidden. */
export function patternless(variations: readonly { pattern?: unknown }[] | undefined): boolean {
  const v = variations ?? [];
  return v.length > 1 && v[0].pattern == null && v.some((x) => x.pattern != null);
}
