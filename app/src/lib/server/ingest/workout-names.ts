// Shortcuts returns workout names in the phone's language (Japanese here). Normalise to the English names the
// rules use (rules.ts STRENGTH / PROMISE_RULES).
import { createHash } from 'node:crypto';

/** Japanese (and alternate English) display names → canonical English names. Unknown names pass through. */
const ALIASES: Record<string, string> = {
  // Strength
  '伝統的な筋力トレーニング': 'Traditional Strength Training',
  '筋力トレーニング': 'Traditional Strength Training',
  '機能的な筋力トレーニング': 'Functional Strength Training',
  'コアトレーニング': 'Core Training',
  'ピラティス': 'Pilates',
  'ヨガ': 'Yoga',
  '高強度インターバルトレーニング': 'High Intensity Interval Training',
  'HIIT': 'High Intensity Interval Training',
  'ミックスカーディオ': 'Mixed Cardio',
  'クロストレーニング': 'Cross Training',
  // Walking / hiking
  'ウォーキング': 'Walking',
  '屋外ウォーキング': 'Outdoor Walk',
  '室内ウォーキング': 'Indoor Walk',
  'ハイキング': 'Hiking',
  // Common others (kept for readable labels)
  'ランニング': 'Running',
  '屋外ランニング': 'Outdoor Run',
  '室内ランニング': 'Indoor Run',
  'サイクリング': 'Cycling',
  '水泳': 'Swimming',
  'ダンス': 'Dance',
  'エリプティカル': 'Elliptical',
  'ローイング': 'Rowing'
};

export function canonicalWorkoutType(name: string): string {
  const n = name.trim().replace(/\s+/g, ' ');
  return ALIASES[n] ?? ALIASES[n.replace(/\s*[（(].*[)）]\s*$/, '')] ?? n;
}

/** True if we have no mapping for a non-ASCII name (worth logging so the alias table can grow in Phase 0). */
export function isUnknownLocalisedType(name: string): boolean {
  return /[^\x00-\x7F]/.test(name) && canonicalWorkoutType(name) === name.trim().replace(/\s+/g, ' ');
}

/**
 * Stable workout id: canonical type + start time to the minute (UTC), so re-sends (or a phone switching language)
 * land on the same row.
 */
export function workoutKey(type: string, startIso: string): string {
  const minute = new Date(Math.floor(Date.parse(startIso) / 60000) * 60000).toISOString();
  return `w:${createHash('sha256').update(`${canonicalWorkoutType(type)}|${minute}`).digest('hex').slice(0, 24)}`;
}

/** Preferred Japanese label for a canonical workout name (first alias wins), for UI text. */
const JA_LABEL: Record<string, string> = {};
for (const [ja, en] of Object.entries(ALIASES)) if (!(en in JA_LABEL) && /[^\x00-\x7F]/.test(ja)) JA_LABEL[en] = ja;
JA_LABEL['Traditional Strength Training'] = '筋力トレーニング';

export function workoutLabel(type: string, locale: 'ja' | 'en'): string {
  return locale === 'ja' ? (JA_LABEL[type] ?? type) : type;
}
