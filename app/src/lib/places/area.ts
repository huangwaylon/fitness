// A place's area, read from its short address (docs/places.md "Areas"): the city or ward a row shows (渋谷区 → 渋谷,
// 横浜市中区 → 横浜), and every name a search may call it by (the ward with and without 区, the town before its 丁目 and
// numbers, the prefecture last). Japanese addresses by their 都道府県 / 市区町村; any other (Google's romanised or a foreign one) by its
// comma parts: the country dropped (the list's, often in Japanese: 「…, WA 98101 アメリカ合衆国」), then the city before a
// state's or prefecture's postcode (Seattle, WA 98101; Shibuya City, Tokyo 150-0041), else the last part's name
// (75001 Paris; Bangkok 10110; Hà Nội). Pure.

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
  const n = addr.normalize('NFKC');
  const a = n.replace(/〒?\s*\d{3}-?\d{4}/, '').replace(/^\s*日本[、,]?\s*/, '').trim();
  if (!a) return { label: '', names: [] };
  if (PREF.test(a) || CITY.test(a)) return japanese(a);
  const parts = a.split(/\s*,\s*/);
  // the country: a last part in Japanese (or ending in it), or an English name
  const last = parts.at(-1)!.replace(/\s*[一-鿿ぁ-ゖァ-ヺー]+$/, '');
  const country = parts.length > 1 && (!LATIN.test(last) || COUNTRY.test(last)) ? parts.pop()! : '';
  if (!country) parts[parts.length - 1] = last;
  // a romanised Japanese one ends on its prefecture (its postcode, or the country Japan)
  if (parts.some((x) => LATIN.test(x))) return latin(parts, /\d{3}-\d{4}/.test(n) || /^(?:Japan|日本)$/i.test(country));
  return /[一-鿿ぁ-ゖァ-ヺ]/.test(a) ? japanese(a) : { label: '', names: [] };
}

const LATIN = /[A-Za-zÀ-ɏḀ-ỿ]/;

const COUNTRY = /^(?:Japan|United States|USA|U\.S\.A\.|South Korea|Korea|Vietnam|Viet Nam|Thailand|Taiwan|France|Italy|Spain|Germany|Philippines|Indonesia|Malaysia|Mexico|Turkey|Türkiye|Laos|New Zealand|Australia|Canada|United Kingdom|UK|Netherlands|Finland|Hong Kong|Singapore|China|Guam)$/i;

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
  const pref = PREF.exec(a)?.[0] ?? '';
  const names = [...new Set([city, short(city), ward, ward.length >= 3 ? short(ward) : '', town.length >= 2 ? town : '', pref].filter(Boolean))];
  return { label, names };
}

function latin(raw: readonly string[], jp: boolean): Area {
  const clean = (s: string) => s.replace(/\b[0-9A-Z]{4,8}\+[0-9A-Z]{2,3}\b/g, '').replace(/\d[\d\-−]*/g, '').replace(/\b(?:City|Ward|District|Chome|-ku|-shi|-gun|Prefecture)\b/gi, '')
    .replace(/[\-−]{2,}|^[\-−]+|[\-−]+$/g, ' ').replace(/\s+[A-Z]{2}$/, '').replace(/\s+/g, ' ').trim();
  // (a plus code, a building or a floor is no city: 「8Q7X+2V」, 「NTビル 2F」)
  const parts = raw.filter((x) => clean(x) && !/ビル|bldg\b|building|floor|\b\d*F\b|階|suite|\bunit\b|\broom\b/i.test(x));
  if (!parts.length) return { label: '', names: [] };
  const last = parts.at(-1)!;
  // a state or a prefecture (WA 98101, CA, Tokyo 150-0041, Gto.): the city is the part before it
  const region = parts.length >= 2 && (jp || /^[A-Z]{2,3}(?:\s+\d|$)/.test(last) || /^[A-Z][a-z]{1,3}\.$/.test(last));
  // (a district, 郡, is passed over for its town: Hakone, Ashigarashimo District → Hakone)
  const at = region ? parts.length - 2 : parts.length - 1;
  const city = clean(at > 0 && /(?:District|-gun)$/i.test(parts[at]) ? parts[at - 1] : parts[at]);
  return city ? { label: city, names: [city] } : { label: '', names: [] };
}
