// The animator's GIF references (design exploration, not part of the app's build): A and B (render/outfits/a.json,
// b.json: the tech artist's) assembled by render/player.js, animated by the app's villager3d poses.ts and faces.ts
// through anim/player-rig.js (anim/page.js), each clip's frames → ffmpeg (a palettegen/paletteuse two-pass) → a looping
// GIF in anim/gifs/, a mid-frame of each into one contact sheet (anim/gifs/contact-sheet.png).
//
// Usage (from app/):
//   NH_MODELS=~/Downloads/Model node design/avatar/anim/gifs.ts            every clip
//   ... gifs.ts walk sit-bench                                            only those (by name; prefix match)
//   ... gifs.ts --raw                                                     every eye and mouth frame of A and B, still
//   ... gifs.ts --sheet                                                   the contact sheet from the last mid-frames
// The model dump is untrusted: harness.ts copies only safe-named .dae/.png into /tmp/avatar-ta/scratch; frames go to
// /tmp/avatar-anim/frames; nothing from the dump is committed.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';
import { openHarness, APP } from '../render/harness.ts';

const HERE = import.meta.dirname;
const OUT = join(HERE, 'gifs');
const TMP = '/tmp/avatar-anim/frames';
const MID = '/tmp/avatar-anim/mid';
const FFMPEG = '/opt/homebrew/bin/ffmpeg';
const OUTFITS = join(HERE, '..', 'render', 'outfits');
const args = process.argv.slice(2);
const flag = (k: string) => args.includes(`--${k}`);
const only = args.filter((a) => !a.startsWith('--'));

type Spec = Record<string, unknown> & { name: string; dur: number; title: string };
// the app's seats (model units over the floor, the player 15.3 tall): a bench its feet dangle from, a chair its feet
// reach the floor from, a floor cushion (knees up)
const BENCH = { top: 3.0, back: false }, CHAIR = { top: 2.2, back: true }, CUSHION = { top: 0.9, back: false };
const S: Spec[] = [
  // base states
  { name: 'state-idle', title: 'idle (standing, breathing, looking about, a blink)', state: 'idle', dur: 4000, t0: 9000, blinkAt: 2100 },
  { name: 'state-walk', layout: 'stagger', title: 'walk (90 u/s wander)', state: 'walk', speed: 90, dur: 1200, yaw: -0.9 },
  { name: 'state-run', layout: 'stagger', title: 'walk at run speed (300 u/s)', state: 'walk', speed: 300, dur: 1080, yaw: -0.9 },
  { name: 'state-sit-bench', title: 'sit on a bench (feet dangling)', state: 'sit', seat: BENCH, dur: 3000, yaw: -0.5 },
  { name: 'state-sit-chair', title: 'sit on a chair with a back (feet on the floor)', state: 'sit', seat: CHAIR, dur: 3000, yaw: -0.7 },
  { name: 'state-sit-cushion', title: 'sit on a low seat (knees up)', state: 'sit', seat: CUSHION, dur: 3000, yaw: -0.7 },
  { name: 'state-lie', title: 'lie (bed, awake)', state: 'lie', lie: { top: 2.2 }, dur: 3600, yaw: -1.2, pitch: 0.55 },
  { name: 'state-nap', title: 'nap (asleep lying, hammock/bed)', state: 'nap', lie: { top: 2.2 }, dur: 5200, yaw: -1.2, pitch: 0.55 },
  { name: 'state-doze', title: 'doze (asleep standing, the nod)', state: 'doze', dur: 7000, yaw: -0.7 },
  { name: 'state-prone', title: 'prone (face down on the sand: Gulliver)', state: 'prone', dur: 4000, yaw: -0.15, pitch: 0.4, turn: -Math.PI / 2, gap: 19, fill: 0.95 },
  { name: 'state-fish', layout: 'stagger', title: 'fish (rod in hand, watching the float)', state: 'fish', tool: 'tools/rod', fish: true, dur: 3000, yaw: -1.25, pitch: 0.15 },
  // actions (over idle; the rod's over fish; the twitch over prone)
  { name: 'action-hop', title: 'hop (most reactions, taps, says, catches)', state: 'idle', action: 'hop', actAt: 300, dur: 1300 },
  { name: 'action-wave', title: 'wave (nod, bow, proud, wiggle, point)', state: 'idle', action: 'wave', actAt: 300, dur: 2300 },
  { name: 'action-highfive', title: 'highfive (in poses.ts; the app never plays it)', state: 'idle', action: 'highfive', actAt: 300, dur: 1600 },
  { name: 'action-surprise', title: 'surprise (woken, startled)', state: 'idle', action: 'surprise', actAt: 300, dur: 1250 },
  { name: 'action-sting', title: 'sting (wasps: wobble, hand to the swollen eye)', state: 'idle', action: 'sting', actAt: 300, dur: 2000 },
  { name: 'action-cast', layout: 'stagger', title: 'cast (rod out)', state: 'fish', action: 'cast', actAt: 300, tool: 'tools/rod', fish: true, dur: 1300, yaw: -1.25, pitch: 0.15 },
  { name: 'action-tug', layout: 'stagger', title: 'tug (the bite)', state: 'fish', action: 'tug', actAt: 300, tool: 'tools/rod', fish: true, dur: 1100, yaw: -1.25, pitch: 0.15 },
  { name: 'action-reel', layout: 'stagger', title: 'reel (pull it in)', state: 'fish', action: 'reel', actAt: 300, tool: 'tools/rod', fish: true, dur: 1300, yaw: -1.25, pitch: 0.15 },
  { name: 'action-warmup', title: 'warmup (radio exercise 1)', state: 'idle', action: 'warmup', actAt: 200, dur: 2400 },
  { name: 'action-sidebend', title: 'sidebend (radio exercise 2)', state: 'idle', action: 'sidebend', actAt: 200, dur: 2400, yaw: 0 },
  { name: 'action-jump', title: 'jump (radio exercise 3)', state: 'idle', action: 'jump', actAt: 200, dur: 2400 },
  { name: 'action-twitch', title: 'twitch (a sleeper nudged; over prone)', state: 'prone', action: 'twitch', actAt: 300, dur: 1100, yaw: -0.15, pitch: 0.4, turn: -Math.PI / 2, gap: 19, fill: 0.95 },
  // transitions the app crossfades (FADE_MS 150; PRONE_MS 600; SIT_MS 420)
  { name: 'transition-idle-walk-idle', layout: 'stagger', title: 'idle → walk → idle (FADE_MS crossfade)', state: 'walk', prev: 'idle', prevUntil: 400, speed: 90, dur: 1600, yaw: -0.9 },
  // held and worn
  { name: 'held-rod-cast-wait', layout: 'stagger', title: 'rod: cast, wait, bite, reel', state: 'fish', tool: 'tools/rod', fish: true, dur: 3600, yaw: -1.25, pitch: 0.15, seq: [['cast', 200], ['tug', 1800], ['reel', 2500]] },
  { name: 'held-net-idle', title: 'net carried over the shoulder (a proposed hold; the app never holds the net)', state: 'idle', tool: 'tools/net', carry: true, gripPose: 'idle', gripWant: [-0.62, 1, -0.5], dur: 2000, yaw: -0.6, t0: 9000 },
  { name: 'held-net-villager-grip', title: 'net as villager3d grip() would hold it (turned for the fishing pose: points down)', state: 'idle', tool: 'tools/net', dur: 2000, yaw: -0.8 },
  { name: 'held-net-walk', layout: 'stagger', title: 'net over the shoulder, walking (no catch swing exists)', state: 'walk', tool: 'tools/net', carry: true, gripPose: 'idle', gripWant: [-0.62, 1, -0.5], speed: 90, dur: 1200, yaw: -0.9 },
  { name: 'worn-birthday-hat', title: 'birthday hat (villager3d wear, on the head bone)', state: 'idle', hat: 'accessories/birthday-hat-pink', action: 'hop', actAt: 900, dur: 2200, t0: 9000 },
  { name: 'pullup-lift', title: 'pull-up rep (the app only lifts the body: no pose)', state: 'idle', liftRep: true, dur: 2000 },
  // the face sheet: every expression the app uses (and the two it never does), and a blink
  { name: 'face-sheet', title: 'faces', state: 'idle', dur: 9 * 900, faceMs: 900, faces: ['neutral', 'happy', 'joy', 'surprised', 'sad', 'sleepy', 'cross', 'sting', 'blink'], focus: 'face', yaw: -0.15, pitch: 0.05, fps: 20, fill: 0.9, t0: 0 },
  { name: 'face-blink', title: 'blink (neutral, BLINK.ms 110)', state: 'idle', dur: 2400, face: 'neutral', focus: 'face', yaw: -0.15, pitch: 0.05, fill: 0.9, blinkAt: 6900 },
  { name: 'face-talk', title: 'talk (no talk face in the app: a proposed mouth cycle)', state: 'idle', dur: 2400, focus: 'face', yaw: -0.15, pitch: 0.05, fill: 0.9, talk: true }
];

const h = await openHarness({ page: join(HERE, 'page.js'), size: 1200 });
// my own modules and the app's tool models, served beside the harness's
const GLB = join(APP, 'static', 'room', 'world3d');
await h.page.route(/http:\/\/avatar\.local\/(anim|glb)\//, (route) => {
  const u = decodeURIComponent(new URL(route.request().url()).pathname);
  const [root, rel] = u.startsWith('/anim/') ? [HERE, u.slice(6)] : [GLB, u.slice(5)];
  const f = resolve(root, rel);
  if (!f.startsWith(root + sep) || !existsSync(f)) return route.fulfill({ status: 404, body: '' });
  return route.fulfill({ body: readFileSync(f), contentType: extname(f) === '.js' ? 'text/javascript' : 'model/gltf-binary' });
});
await h.call('init');
const outfit = (k: string) => JSON.parse(readFileSync(join(OUTFITS, `${k}.json`), 'utf8'));
// (both outfits' files to each: player.js's setFace reads the files of the last loadPlayer, a module-wide FILES)
const allFiles = h.filesFor([outfit('a'), outfit('b')]);
for (const k of ['a', 'b']) console.log(k, JSON.stringify(await h.call('load', k, outfit(k), allFiles)));

if (flag('raw')) {
  for (const k of ['a', 'b']) {
    const items = await h.call<{ png: string; label: string }[]>('rawFaces', k);
    // crop-free: a 6-column grid
    h.save('/tmp/avatar-anim', `raw-faces-${k}.png`, await h.call<string>('grid', items, 5, 400, 300));
  }
  await h.close();
  process.exit(0);
}

// --still '<spec json>' t1,t2,…: stills of an ad-hoc clip (a debugging view) → /tmp/avatar-anim/still-<i>.png
if (flag('still')) {
  const spec = JSON.parse(only[0]);
  await h.call('setup', { name: 'still', title: '', ...spec });
  for (const [i, t] of (only[1] ?? '0').split(',').map(Number).entries()) h.save('/tmp/avatar-anim', `still-${i}.png`, await h.call<string>('frame', t, `t ${t}`));
  await h.close();
  process.exit(0);
}
mkdirSync(OUT, { recursive: true });
mkdirSync(MID, { recursive: true });
if (!flag('sheet')) {
  for (const s of S) {
    if (only.length && !only.some((o) => s.name.startsWith(o))) continue;
    // (functions can't cross into the page: the sequence, the talk and the rep are specs it reads)
    const info = await h.page.evaluate(async (spec) => {
      const sp = spec as Record<string, unknown>;
      if (sp.seq) {
        const seq = sp.seq as [string, number][];
        // several actions in a row: the frame's action is the last one started
        (sp as { hold?: unknown }).hold = undefined;
        sp.actions = seq;
      }
      return (window as unknown as { setup: (s: unknown) => Promise<unknown> }).setup(sp);
    }, s) as { frames: number };
    const fps = (s.fps as number) ?? 25;
    const n = info.frames;
    const dir = join(TMP, s.name);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    for (let i = 0; i < n; i++) {
      const t = (i * 1000) / fps;
      const label = s.name.startsWith('face-sheet') ? 1 : `${s.name.replace(/^(state|action|held|worn|face|transition)-/, '')}`;
      const png = await h.call<string>('frame', t, label);
      writeFileSync(join(dir, `f${String(i).padStart(4, '0')}.png`), Buffer.from(png.split(',')[1], 'base64'));
      if (i === Math.floor(n * (s.midK as number ?? 0.5))) writeFileSync(join(MID, `${s.name}.png`), Buffer.from(png.split(',')[1], 'base64'));
    }
    const gif = join(OUT, `${s.name}.gif`);
    const scale = `fps=${fps},scale=560:-1:flags=lanczos`;
    execFileSync(FFMPEG, ['-v', 'error', '-y', '-framerate', String(fps), '-i', join(dir, 'f%04d.png'), '-vf', `${scale},palettegen=stats_mode=diff`, join(dir, 'pal.png')]);
    execFileSync(FFMPEG, ['-v', 'error', '-y', '-framerate', String(fps), '-i', join(dir, 'f%04d.png'), '-i', join(dir, 'pal.png'), '-lavfi', `${scale}[x];[x][1:v]paletteuse=dither=sierra2_4a:diff_mode=rectangle`, '-loop', '0', gif]);
    console.log('wrote', gif.slice(APP.length + 1), `${n} frames`);
  }
}
// the contact sheet: every clip's mid-frame
const mids = readdirSync(MID).filter((f) => f.endsWith('.png')).sort();
const order = (f: string) => S.findIndex((s) => `${s.name}.png` === f);
mids.sort((a, b) => order(a) - order(b));
const items = mids.filter((f) => order(f) >= 0).map((f) => ({ png: `data:image/png;base64,${readFileSync(join(MID, f)).toString('base64')}`, label: f.replace('.png', '') }));
h.save(OUT, 'contact-sheet.png', await h.call<string>('grid', items, 5, 320, 240));
await h.close();
