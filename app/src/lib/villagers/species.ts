// Shared character types: the five expressions (docs/design.md#motion), and the NH species + personalities the
// roster is tagged with (the picker's search matches species names in both languages).

export type Expression = 'happy' | 'cheer' | 'sleepy' | 'surprised' | 'proud';

/** The 35 New Horizons villager species → [ja, en] (the in-game names). */
export const SPECIES = {
  alligator: ['ワニ', 'Alligator'],
  anteater: ['アリクイ', 'Anteater'],
  bear: ['クマ', 'Bear'],
  cub: ['こぐま', 'Bear cub'],
  bird: ['トリ', 'Bird'],
  bull: ['オスウシ', 'Bull'],
  cat: ['ネコ', 'Cat'],
  chicken: ['ニワトリ', 'Chicken'],
  cow: ['メスウシ', 'Cow'],
  deer: ['シカ', 'Deer'],
  dog: ['イヌ', 'Dog'],
  duck: ['アヒル', 'Duck'],
  eagle: ['ワシ', 'Eagle'],
  elephant: ['ゾウ', 'Elephant'],
  frog: ['カエル', 'Frog'],
  goat: ['ヤギ', 'Goat'],
  gorilla: ['ゴリラ', 'Gorilla'],
  hamster: ['ハムスター', 'Hamster'],
  hippo: ['カバ', 'Hippo'],
  horse: ['ウマ', 'Horse'],
  kangaroo: ['カンガルー', 'Kangaroo'],
  koala: ['コアラ', 'Koala'],
  lion: ['ライオン', 'Lion'],
  monkey: ['サル', 'Monkey'],
  mouse: ['ネズミ', 'Mouse'],
  octopus: ['タコ', 'Octopus'],
  ostrich: ['ダチョウ', 'Ostrich'],
  penguin: ['ペンギン', 'Penguin'],
  pig: ['ブタ', 'Pig'],
  rabbit: ['ウサギ', 'Rabbit'],
  rhino: ['サイ', 'Rhino'],
  sheep: ['ヒツジ', 'Sheep'],
  squirrel: ['リス', 'Squirrel'],
  tiger: ['トラ', 'Tiger'],
  wolf: ['オオカミ', 'Wolf']
} as const satisfies Record<string, readonly [string, string]>;
export type Species = keyof typeof SPECIES;

/** The special characters' group (たぬきち, しずえ…: no species or personality) → [ja, en]: the picker's first group,
 *  their kind line, and a search word. */
export const SPECIAL = ['とくべつ', 'Special'] as const;

/** The eight NH personalities (ja = the in-game seikaku). */
export const PERSONALITIES = {
  lazy: ['ぼんやり', 'Lazy'],
  jock: ['ハキハキ', 'Jock'],
  cranky: ['こわい', 'Cranky'],
  smug: ['キザ', 'Smug'],
  normal: ['ふつう', 'Normal'],
  peppy: ['元気', 'Peppy'],
  snooty: ['オトナ', 'Snooty'],
  sisterly: ['アネキ', 'Sisterly']
} as const satisfies Record<string, readonly [string, string]>;
export type Personality = keyof typeof PERSONALITIES;
