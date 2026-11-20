// トレイル's slugs alone (docs/hiking.md "Entry"): what a trip's hike card needs to open a trail (travel/DayCard.svelte),
// without the trails' write-ups (trails.ts), which a 共有リンク page (/s) would otherwise load. trails.test pins them
// equal to TRAILS'.

/** The trails' slugs, in trails.ts' order. */
export const TRAIL_SLUGS = ['lake-22', 'snow-lake', 'lake-valhalla', 'talapus-lake', 'mount-pilchuck', 'bridal-veil', 'skyline-loop', 'enchantments', 'fuji-yoshida', 'kinpu-odarumi', 'utsukushigahara', 'akagi-kurobi', 'akigawa-shiroyama'] as const;

/** A trail's slug from the hiking app's link (`https://huangwaylon.github.io/hiking-trails/#/trail/lake-22`, the
 *  Seattle guide's `hike.gpx`), if it is one of ours; else null (travel/DayCard.svelte: openTrail). */
export function hikeSlugOf(url: string | undefined | null): string | null {
  const slug = /#\/trail\/([a-z0-9-]+)/.exec(url ?? '')?.[1];
  return slug && (TRAIL_SLUGS as readonly string[]).includes(slug) ? slug : null;
}
