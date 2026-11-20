// Private values in free text (docs/travel.md "Sharing"): what looks like a booking reference, a ticket, passport,
// card or phone number, an e-mail address, a personal URL or a passport name. `idLikeRuns` is the guides' check
// (travel/trips.test: a private value typed into a guide without `{p:}`); `redactPrivate` is the 共有リンク's server-side
// redaction of the record's text (a trip note's free values, a packing item's name and note) before a stranger sees it:
// each such run becomes 🔒. It errs towards hiding (a lone 6-capital word, a long code); the text is normalised first
// (NFKC: full-width letters and digits; zero-width and soft-hyphen characters out) so neither hides a run. Pure.

/** What the page draws as a 🔒 chip in place of a hidden run. */
export const LOCK = '🔒';

/** A guide's ID-like runs, outside `{p:}` tokens and links: letters and digits mixed (6+), 7+ digits, a lone 6-capital
 *  code (a PNR's shape), an e-mail address. */
export function idLikeRuns(s: string): string[] {
  const body = s.replace(/\{p:\w+\}/g, ' ').replace(/https?:\/\/[^"\s)]+/g, ' ');
  return body.match(/(?<![A-Za-z0-9])(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z0-9]{6,}(?![A-Za-z0-9])|\d{7,}|(?<![A-Za-z])[A-Z]{6}(?![A-Za-z])|[\w.+-]+@[\w-]+\.[a-z]{2,}/g) ?? [];
}

/** Text as matched: NFKC (Ａ１ → A1, ＠ → @), format characters (zero-width, soft hyphen, joiners) out. */
const normal = (s: string): string => s.normalize('NFKC').replace(/\p{Cf}/gu, '');

/** A measure's unit after digits ("1000ml", "20000mAh"): a quantity, not a code. */
const UNIT = /^\d+(?:\.\d+)?(?:ml|l|g|kg|mg|mm|cm|m|km|mah|wh|w|v|gb|tb|mb|hz|px|in|oz|lb|ft|mi|°c|°f|h|min|s|p|pcs|x)$/i;
/** A date ("2027-02-11", "2027/2/11"): kept. */
const DATE = /^\d{4}[-/.]\d{1,2}[-/.]\d{1,2}$/;

/** The runs hidden, in order (each replaced by 🔒; a later pattern sees the earlier ones' locks). */
const RUNS: [RegExp, ((m: string) => boolean)?][] = [
  // any link (a booking's manage page, a check-in URL, a ref in its path or query): none is ours to show
  [/\b(?:https?:\/\/|www\.)\S+/gi],
  // an e-mail address, "a [at] b.com" too
  [/[\w.+-]+\s*(?:@|\[at\]|\(at\)|＠)\s*[\w-]+(?:\s*(?:\.|\[dot\]|\(dot\))\s*[\w-]+)+/gi],
  // a label then its value: 予約番号：XYZ, booking no. 12, PNR abc, passport ...
  [/(?<=(?:予約番号|確認番号|予約コード|予約|確認コード|会員番号|旅券番号|パスポート|搭乗券|チケット番号|番号|booking|confirmation|conf\.?|reference|ref\.?|pnr|itinerary|e-?ticket|ticket|passport|member(?:ship)?|loyalty|no\.|#)\s*[:：#]?\s*)[A-Za-z0-9][A-Za-z0-9-]*\d[A-Za-z0-9-]*|(?<=(?:予約番号|確認番号|予約コード|確認コード|搭乗券|パスポート|booking|confirmation|reference|pnr|passport)\s*[:：#]?\s*)[A-Za-z]{5,}/gi],
  // 7+ digits, single spaces, dashes or dots between (a ticket, phone, card or postal code); a date kept
  [/\+?\d(?:[ .-]?\d){6,}/g, (m) => !DATE.test(m)],
  // kanji numerals, 7+ (〇一二…)
  [/[〇零一二三四五六七八九]{7,}/g],
  // a long token (base64, hex, percent-escaped)
  [/[A-Za-z0-9+/_%=-]{16,}/g, (m) => /\d/.test(m) && /[A-Za-z]/.test(m)],
  // letters and digits mixed, 6+ (a booking ref, a passport number), any case; a measure kept
  [/(?<![\p{L}\p{N}])(?=[A-Za-z0-9]*\d)(?=[A-Za-z0-9]*[A-Za-z])[A-Za-z0-9]{6,}(?![\p{L}\p{N}])/gu, (m) => !UNIT.test(m)],
  // a spaced code: capitals and digits in short groups, 6+ in all, both kinds ("AB C1 23")
  [/(?<![A-Za-z0-9])[A-Z0-9]{1,4}(?:[ -][A-Z0-9]{1,4}){1,4}(?![A-Za-z0-9])/g, (m) => {
    const c = m.replace(/[ -]/g, '');
    return c.length >= 6 && /\d/.test(c) && /[A-Z]/.test(c);
  }],
  // a lone 6-capital code (a PNR's shape)
  [/(?<![A-Za-z])[A-Z]{6}(?![A-Za-z])/g],
  // a passport name: capital words together (HUANG/WAYLON, WAYLON HUANG)
  [/(?<![A-Za-z])[A-Z]{2,}(?:\s*[/,]\s*|\s+)[A-Z]{2,}(?:(?:\s*[/,]\s*|\s+)[A-Z]{2,})*(?![A-Za-z])/g],
  // a name by its honorific: Mr Huang, Ms. A B, 黄様
  [/\b(?:Mr|Mrs|Ms|Miss|Mx|Dr)\.?\s+[\p{L}'-]+(?:\s+[\p{L}'-]+)?/giu],
  [/[\p{L}\p{N}]+\s*(?=様|さま|殿)/gu, (m) => !/^(?:皆|みな|お客|神)$/.test(m.trim())]
];

/** `s` with each private-looking run as 🔒 (adjacent locks as one). Normalised first; nothing is cut before it. */
export function redactPrivate(s: string): string {
  let out = normal(s);
  for (const [re, keep] of RUNS) out = out.replace(re, (m) => (keep && !keep(m) ? m : LOCK));
  return out.replace(/🔒(?:[\s/:：#.,-]*🔒)+/gu, LOCK);
}
