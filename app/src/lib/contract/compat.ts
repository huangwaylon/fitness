// The pages' compatibility epoch (docs/backend.md "Service worker" › Updates). A deploy is taken at a safe moment: a
// launch, or a return after a while away before the first touch (ui-state/update.ts), never under the player. Bump
// COMPAT only for a change no page of an older build can work with (the relay's or the record's protocol, a stored
// shape it can't read): each build writes it into _app/version.json (`compat`, scripts/version-compat.ts), and a page
// finding a higher one there takes it as the app hides too (nothing in hand), still never in front.
export const COMPAT = 3;
