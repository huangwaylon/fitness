// The pages' compatibility epoch (docs/backend.md "Service worker" › Updates). A deploy is taken at a safe moment: the
// next hide or launch (ui-state/update.ts), never under the player. Bump COMPAT only for a change no page of an older
// build can work with (the relay's or the record's protocol, a stored shape it can't read): each build writes it into
// _app/version.json (`compat`, scripts/version-compat.ts), and a page finding a higher one there reloads as soon as
// nothing is open, in front too.
export const COMPAT = 1;
