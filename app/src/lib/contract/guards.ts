// Guards for untrusted JSON (a reply, a stored record, a peer's message), one meaning per name. Pure, imports
// nothing, so the relay and the bots' Workers may use them.

/** A plain object (not null, not an array). */
export const isRec = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
/** A finite number. */
export const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
/** A string with something besides spaces in it, at most `max` long. */
export const isText = (v: unknown, max = Infinity): v is string => typeof v === 'string' && v.trim().length > 0 && v.length <= max;
