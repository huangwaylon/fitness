// ごはん's barcode scan (docs/food-data.md "Barcodes"): a code as read or typed, normalised to the keys the products
// carry (products.json's ids: `off:<code>`, a JAN/EAN-13 or an EAN-8 with a valid check digit; a UPC-A zero-padded to
// 13, as food-data's lib.py norm_jan). Pure.

/** The GS1 check digit's test: the digits right to left weighted 3, 1, 3 … (the check digit itself weighted 1). */
export function checkOk(code: string): boolean {
  if (!/^\d{8,14}$/.test(code)) return false;
  let sum = 0;
  for (let i = code.length - 2, w = 3; i >= 0; i--, w = 4 - w) sum += Number(code[i]) * w;
  return (10 - (sum % 10)) % 10 === Number(code[code.length - 1]);
}

/** A UPC-E (8 digits: its number system 0 or 1, six digits, the check digit) as the UPC-A it shortens (12 digits), or
 *  null when it can't be one. */
export function upcEtoA(e: string): string | null {
  if (!/^[01]\d{7}$/.test(e)) return null;
  const [ns, d, ck] = [e[0], e.slice(1, 7), e[7]];
  const last = Number(d[5]);
  const body =
    last <= 2 ? `${d[0]}${d[1]}${d[5]}0000${d[2]}${d[3]}${d[4]}`
    : last === 3 ? `${d[0]}${d[1]}${d[2]}00000${d[3]}${d[4]}`
    : last === 4 ? `${d[0]}${d[1]}${d[2]}${d[3]}00000${d[4]}`
    : `${d.slice(0, 5)}0000${d[5]}`;
  const a = ns + body + ck;
  return checkOk(a) ? a : null;
}

/** What a scan's decoder says a code is (zxing's format names), when it says. */
export type Format = 'EAN-13' | 'EAN-8' | 'UPC-A' | 'UPC-E';

/**
 * A code's product keys (13 or 8 digits, each with a valid check digit), the likeliest first; none for what isn't
 * one. Typed text's spaces, hyphens and full-width digits are fine. 12 digits: a UPC-A (zero-padded); 14: a GTIN-14
 * of the pack itself (its leading 0 dropped); 8: an EAN-8 and, starting 0 or 1, a UPC-E (zxing names which: `format`).
 */
export function barcodeKeys(raw: string, format?: Format): string[] {
  const s = raw.normalize('NFKC').replace(/[\s-]/g, '');
  if (!/^\d+$/.test(s)) return [];
  if (s.length === 14) return s[0] === '0' && checkOk(s) ? [s.slice(1)] : [];
  if (s.length === 13) return checkOk(s) ? [s] : [];
  if (s.length === 12) return checkOk(s) ? [`0${s}`] : [];
  if (s.length !== 8) return [];
  const e = upcEtoA(s);
  const asE = e ? `0${e}` : null;
  const ean8 = checkOk(s) ? s : null;
  const out = format === 'UPC-E' ? [asE, ean8] : [ean8, asE];
  return out.filter((k, i): k is string => !!k && out.indexOf(k) === i);
}
