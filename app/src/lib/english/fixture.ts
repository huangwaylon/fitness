// A made-up clip for the lesson and flag tests, so the real content (clips/) can change without breaking them.
import type { Clip } from './types.ts';

const notes = { said: 's', mean: 'm', trap: 't', use: 'u（u）' };
export const fixture: Clip = {
  id: 'fixture',
  video: 'abcdefghijk',
  title: 'A Test Clip',
  dur: 60,
  wpm: 120,
  band: 'mid',
  tags: ['職場'],
  credit: 'Test',
  questions: [
    { id: 'g1', skill: 'gist', level: 'B1', point: 'ask', seg: [0, 20], stem: 'What does she ask for?', choices: ['A day off', 'Part of her pay early', 'A raise'], a: 1, cue: 'お金の頼み方に注目。', line: 'a *hundred dollar advance*?', ...notes },
    { id: 'n1', skill: 'number', level: 'B1', point: 'amount', seg: [3, 10], stem: 'How much?', choices: ['$10', '$100', '$1,000'], a: 1, cue: '数字は dollar の直前。', line: 'a *hundred dollar* advance', ...notes },
    { id: 'x1', skill: 'dict', level: 'B2', point: 'better', seg: [40, 45], stem: 'Type what she says: “I think ___.” (3 words)', answer: "i'm doing better", cue: 'I think のあと。', line: 'I think *I’m doing better*.', ...notes }
  ]
};
