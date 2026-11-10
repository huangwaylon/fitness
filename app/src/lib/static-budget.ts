// What a deploy uploads (docs/ops/runbook.md §1): Cloudflare Pages takes at most 20,000 files a deployment (the Free
// plan), and the build adds Kit's chunks and the 404 copy to static/'s files (≈ 770 measured on 2026-11-09: wrangler
// uploaded 15,470 files with static/ at 14,700). static/'s cap keeps a build allowance and a margin under Pages' cap;
// past it, move something into a pack first (as ききみみ's clips and the food pictures).
/** Pages' cap on a deployment's files (the Free plan; paid plans take 100,000). */
export const PAGES_MAX_FILES = 20_000;
/** The build's own files on top of static/ (Kit's chunks, the 404 copy): ≈ 770 measured, rounded up. */
export const BUILD_FILES = 1_000;
/** Kept free for growth between a check and a deploy. */
export const MARGIN_FILES = 1_000;
/** static/'s share. */
export const STATIC_MAX_FILES = PAGES_MAX_FILES - BUILD_FILES - MARGIN_FILES;
