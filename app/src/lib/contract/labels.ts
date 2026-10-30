// UI label for a canonical (English) workout type. Dependency-free: the parser (and so the Apps Script bundle)
// inverts the same table for Japanese Health names.

export const WORKOUT_LABELS_JA: Record<string, string> = {
  'Traditional Strength Training': '筋力トレーニング',
  'Functional Strength Training': '機能的な筋力トレーニング',
  'Core Training': 'コアトレーニング',
  Pilates: 'ピラティス',
  Yoga: 'ヨガ',
  'High Intensity Interval Training': '高強度インターバルトレーニング',
  'Mixed Cardio': 'ミックスカーディオ',
  'Cross Training': 'クロストレーニング',
  Walking: 'ウォーキング',
  'Outdoor Walk': '屋外ウォーキング',
  'Indoor Walk': '室内ウォーキング',
  Hiking: 'ハイキング',
  Running: 'ランニング',
  'Outdoor Run': '屋外ランニング',
  'Indoor Run': '室内ランニング',
  Cycling: 'サイクリング',
  Swimming: '水泳',
  Dance: 'ダンス',
  Elliptical: 'エリプティカル',
  Rowing: 'ローイング'
};

export const WORKOUT_TYPES = Object.keys(WORKOUT_LABELS_JA);

export function workoutLabel(type: string, locale: 'ja' | 'en'): string {
  return locale === 'ja' ? (WORKOUT_LABELS_JA[type] ?? type) : type;
}
