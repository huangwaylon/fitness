// A place's area, read from its short address (docs/places.md "Areas"): the city or ward a row shows (渋谷区 → 渋谷,
// 横浜市中区 → 横浜), and every name a search may call it by (the ward with and without 区, the town before its 丁目 and
// numbers). Japanese addresses by their 都道府県 / 市区町村; any other (Google's romanised or a foreign one) by its
// comma parts. Pure.

export interface Area {
  /** What a row shows ('' none). */
  label: string;
  /** Each name it goes by (the label first), longest-lived first: the city or ward, then the town. */
  names: string[];
}

const PREF = /^(?:東京都|北海道|(?:京都|大阪)府|[^\s都道府県]{2,3}県)/;
/** The city (市, 郡…町/村) and its ward (区), or a Tokyo ward (区) alone. */
const CITY = /^(?:([^\s市区]{1,6}市)([^\s区]{1,4}区)?|([^\s区]{1,5}区)|[^\s郡]{1,5}郡([^\s町村]{1,5}[町村])|([^\s町村]{1,5}[町村]))/;
/** A suffix to drop for the short name when two characters or more stay (渋谷区 → 渋谷, 中区 stays). */
const short = (s: string): string => (s.length >= 3 && /[市区町村]$/.test(s) ? s.slice(0, -1) : s);

export function areaOf(addr: string): Area {
  const a = addr.normalize('NFKC').replace(/〒?\s*\d{3}-?\d{4}/, '').replace(/^\s*日本[、,]?\s*/, '').trim();
  if (!a) return { label: '', names: [] };
  if (/[一-鿿ぁ-ゖァ-ヺ]/.test(a)) return japanese(a);
  return latin(a);
}

function japanese(a: string): Area {
  const rest = a.replace(PREF, '');
  const m = CITY.exec(rest);
  if (!m) {
    const pref = PREF.exec(a)?.[0] ?? '';
    return pref ? { label: short(pref.replace(/[都府県]$/, '')), names: [pref] } : { label: '', names: [] };
  }
  const city = m[1] ?? m[3] ?? m[5] ?? '';
  const ward = m[2] ?? m[4] ?? '';
  // the town: what follows, up to its first number or 丁目
  const town = rest.slice(m[0].length).split(/[\d０-９一二三四五六七八九十]+丁目|[\d０-９]|[\s,、]/)[0].replace(/(?:大字|字)/g, '');
  const label = short(city || ward);
  const names = [...new Set([city, short(city), ward, ward.length >= 3 ? short(ward) : '', town.length >= 2 ? town : ''].filter(Boolean))];
  return { label, names };
}

function latin(a: string): Area {
  const parts = a.split(',').map((s) => s.replace(/\d[\d-]*/g, '').replace(/\b(?:City|Ward|-ku|-shi|Prefecture)\b/gi, '').trim()).filter(Boolean);
  if (!parts.length) return { label: '', names: [] };
  // the city: the part before the last (a state, a country), else the only one
  const city = parts.length >= 2 ? parts[parts.length - 2] : parts[0];
  return { label: city, names: [city] };
}
