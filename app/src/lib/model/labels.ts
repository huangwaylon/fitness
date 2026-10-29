// UI label for a canonical (English) workout type. Dependency-free copy of server/ingest/workout-names.ts
// `workoutLabel` (the differential test checks they agree).

const JA: Record<string, string> = {
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

export const WORKOUT_TYPES = Object.keys(JA);

export function workoutLabel(type: string, locale: 'ja' | 'en'): string {
  return locale === 'ja' ? (JA[type] ?? type) : type;
}
