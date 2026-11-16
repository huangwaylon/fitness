// English Study's clips and their content versions as JSON on stdout, for the flags' review (relay/scripts/flags.ts:
// a flag's `v` against the content now, lib/english/hash.ts):
//   node scripts/english-hashes.ts   → {"<clip id>": {"video", "title", "v", "q": {"<question id>": "<v>"}, "seg": {"<id>": [from, to]}, "stem": {"<id>": "…"}}}
import { CLIPS } from '../src/lib/english/clips/index.ts';
import { clipHash, questionHash } from '../src/lib/english/hash.ts';

const out = Object.fromEntries(CLIPS.map((c) => [c.id, {
  video: c.video, title: c.title, v: clipHash(c), q: Object.fromEntries(c.questions.map((q) => [q.id, questionHash(q)])),
  seg: Object.fromEntries(c.questions.map((q) => [q.id, q.seg])), stem: Object.fromEntries(c.questions.map((q) => [q.id, q.stem]))
}]));
process.stdout.write(`${JSON.stringify(out)}\n`);
