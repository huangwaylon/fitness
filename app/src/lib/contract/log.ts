// The log's events (docs/ops/observability.md): one schema for the phones (sync/log.ts) and the relay (relay/src/log.ts,
// the `IslandLog` object), versioned (`LOG_V`). Every event is a name from `LOG_EVENTS` and a payload of only that
// name's fields, each of its kind: a bounded number, a boolean, a value from a closed set, a short token (never a run
// of hex or of letters and digits long enough to be a key), and a JS error's scrubbed message and stack. The relay
// keeps nothing else, whatever a phone sends: no key, no health value, no food name, no free text, no URL. Pure.
import { EVENT_TYPES } from './api.ts';
import { isNum } from './guards.ts';

/** @public (relay/src/log.ts) */
export const LOG_V = 1;

/** 0 debug · 1 info · 2 warn · 3 error. @public (relay/src/log.ts) */
export type LogLevel = 0 | 1 | 2 | 3;

/** The record's API actions (relay/src/store.ts route), and `other`. @public (relay/src/reqMeta.ts) */
export const LOG_ACTIONS = ['health', 'ingest', 'event', 'events', 'snapshot', 'uploads', 'whoami', 'other'] as const;
/** A request's outcome: `ok`, the record's error codes, the phone's own (`offline`, `http`, `json`), `none` (no answer). @public (relay/src/reqMeta.ts) */
export const LOG_STATUS = ['ok', 'unauthorized', 'forbidden', 'bad_request', 'too_large', 'busy', 'unavailable', 'offline', 'http', 'json', 'none'] as const;
/** The app's routes (their first segment). */
const LOG_ROUTES = ['/', '/pair', '/tent', '/shop', '/museum', '/jar', '/editor', '/dev', '/world3d', 'other'] as const;
/** The island's sheets, as `perf.sheet` names them (ui-state/sheetTiming.ts), the `use` counters' `sheet:` and the
 *  error events' `sheet` (the topmost open one). */
const LOG_SHEETS = ['food', 'health', 'travel', 'wedding', 'hiking', 'english', 'panel', 'zukan', 'settings', 'bots', 'farm', 'other'] as const;
export type LogSheet = (typeof LOG_SHEETS)[number];
const EV_TYPES = [...EVENT_TYPES, 'other'] as const;
/** What asked for the island's frames at the full rate (world3d/engine.ts `why`; `vil` `walk` (someone walking in view)
 *  `nodes` (a node moving: camera.svelte.ts moveStart) `mirror` its scene's: Island3D, `world` the two as builds before
 *  2026-11-14 sent them; `crit-fish` a fish's dart, `crit-bug` a bug's move, `crit-rear` the tarantula rearing:
 *  critters.svelte.ts, `crit` the three as builds before 2026-11-13 sent them): perf.rest's top three. @public (world3d/engine.ts) */
/** What a node moving says it is (camera.svelte.ts moveStart's tag, perf.rest's `nd1`; `float` as builds before
 *  2026-11-15 sent it: fishing3d.ts floatWants since). */
const LOG_MOVE_TAGS = ['wash', 'shake', 'zap', 'crit', 'popper', 'present', 'float', 'other'] as const;
export type LogMoveTag = (typeof LOG_MOVE_TAGS)[number];
export const LOG_FULL_WHY = ['focus', 'fling', 'settle', 'things', 'scene', 'vil', 'world', 'walk', 'nodes', 'mirror', 'cards', 'fx', 'crit', 'crit-fish', 'crit-bug', 'crit-rear', 'bite', 'ground', 'lights', 'touch', 'active', 'other'] as const;

/** A field's kind: `n` a number (rounded to 0.1, within ±1e7), `b` a boolean, `t` a token, a closed set (an array),
 *  `msg` / `stack` scrubbed text. */
type Kind = 'n' | 'b' | 't' | 'msg' | 'stack' | readonly string[];
/** `*`: counters (`use`): `sheet:` · `route:` · `act:` · `swallow:` and a token, at most 40 of them, each a number. */
type Fields = Readonly<Record<string, Kind>>;

const API = { action: LOG_ACTIONS, err: LOG_STATUS, http: 'n', ms: 'n', tries: 'n' } as const;
/** Where a failure happened: the topmost open sheet (sync/log.ts adds it). */
const AT = { sheet: LOG_SHEETS } as const;
/**
 * The registry: each event's fields. `c` a phone's, `r` the relay's own (a phone can't send those).
 * Units: a duration in ms is unsuffixed in perf.* (mount, first, onSet) and suffixed elsewhere (fieldsMs); any other
 * unit is suffixed (coldS, qAgeS, useMb, kB). A live field is never renamed (the relay's history reads it): a new one
 * follows the rule.
 */
// (the dotted names in double quotes: they are not i18n keys, which usage.test reads in single quotes)
export const LOG_EVENTS = {
  // ---- the phones
  // coldS: a fresh load's seconds since this phone last hid the app (none: it was shown last, or a reload
  // of ours): a cold open soon after a hide is iOS's background kill (or, as the user does, a swipe closed); vis: the
  // page hidden or shown as it loaded; hr, hrS: the load is the app's own reload at a hide (a deploy taken out of sight,
  // ui-state/update.ts), that long ago (vis hidden: it ran out of sight; shown, hrS long: only at the next show)
  "app.open": { src: 'c', f: { nav: ['navigate', 'reload', 'back_forward', 'prerender', 'other'], route: LOG_ROUTES, pwa: 'b', w: 'n', h: 'n', dpr: 'n', lt: 'b', q: 'n', qAgeS: 'n', coldS: 'n', vis: ['visible', 'hidden'], hr: 'b', hrS: 'n' } },
  // hid: the page was hidden before it got there (ms then counts time away: left out of the report's cold load)
  "app.ready": { src: 'c', f: { ms: 'n', route: LOG_ROUTES, hid: 'b' } },
  "app.show": { src: 'c', f: { awayS: 'n', route: LOG_ROUTES } },
  "app.reload": { src: 'c', f: { why: ['update', 'launch', 'chunk', 'stale', 'mic', 'other'] } },
  "perf.frames": { src: 'c', f: { p50: 'n', p95: 'n', fps: 'n', long: 'n', drawFps: 'n', hz: 'n', mode: ['3d', 'none'], when: ['ready', 'show'] } },
  // a sheet's opening (ui-state/sheetTiming.ts), ms from the tap: its chunk in and the dialog shown (`chunk`), its content
  // ready (`content`: the last change inside it before 300 ms of none once the opening is done), its open animation's end
  // (`anim`, -1: none); a change after that quiet, the last within 3 s (`late`, -1: none), and the node it changed (`what`:
  // its tag and class); the longest frame till the content was ready (`long`) and those over 33 ms (`slow`); its first
  // opening this load, or a kept one shown again (`kept`). Every first, a share of the rest
  "perf.sheet": { src: 'c', f: { sheet: LOG_SHEETS, first: 'b', kept: 'b', chunk: 'n', content: 'n', anim: 'n', late: 'n', what: 't', long: 'n', slow: 'n' } },
  // the island's launch, once a load (world3d/boot.ts BootReport: ms since the navigation's start, frame lengths in ms;
  // the steps from loaded to shown by what held each back: programs linking, models loading, cards
  // loading; how many, and their wall ms from that step to the next; the steps' own frame ms all told; the models in
  // after loaded, and the last of them by name; `shell` where the page came from (the network within the worker's
  // race, or its cache: confirmed by the race, not raced, or the network late or offline) and `raceMs` the race's ms
  // from the navigation's fetch event; `garden` and `farm` what the first placing had (`ask`, `held`: the launch's
  // version ask and its hold, older builds); `pre` the ms from the worker's fetch event to the page's clock start (on
  // WebKit that clock starts once the worker answers: the race's wait is before every mark), `swCold` the worker just
  // started for it; the worker's own network fetches meanwhile (the page's transfer sizes read 0 for every answer it
  // gives), its room files of them and their KB (`swNet`, `swRoom`, `swKB`: Content-Length, else the cache index's size, else 0); the KTX2s transcoded (`tx`), and the WebP fallbacks: KTX2s not had, textures drawn from their WebP, the transcoder given up
  // (`txFail`, `txWebp`, `txOff`: world3d/ktx2.ts ktx2Stats); the last late
  // model's fetch end and its arrival in the scene (`lateF`, `lateA`); the worker's steps before the page (ms: its
  // start to the fetch event `swUp`, the event to its shell's lookup `swOwn`, to FRESH_KEY's `swFresh`, to the answer
  // `swAns`); the last card the island waited on (`lastC`: its art's key) and its art's fetch end and arrival (`cardF`,
  // `cardA`); `hid` the page hidden before the island's mount (a reload under the player for an update: not a launch)
  "perf.boot": { src: 'c', f: { mount: 'n', first: 'n', loaded: 'n', shown: 'n', long: 'n', draw: 'n', appear: 'n', steps: 'n', progs: 'n', fieldsMs: 'n', fields: ['cache', 'worker', 'main'], sw: ['ctl', 'none', 'no'], warm: 'b', net: 'n', sLink: 'n', msLink: 'n', sModels: 'n', msModels: 'n', sCards: 'n', msCards: 'n', stepMs: 'n', late: 'n', lastM: 't', data: 'n', garden: ['first', 'late', 'none'], farm: ['first', 'late'], ask: 'n', held: 'n', shell: ['net', 'same', 'skip', 'cache'], raceMs: 'n', pre: 'n', swCold: 'b', swNet: 'n', swRoom: 'n', swKB: 'n', tx: 'n', txFail: 'n', txWebp: 'n', txOff: 'b', lateF: 'n', lateA: 'n', swUp: 'n', swOwn: 'n', swFresh: 'n', swAns: 'n', lastC: 't', cardF: 'n', cardA: 'n', hid: 'b' } },
  // the island's first return to it a load (back from a room: perf.boot's marks, ms from the mount), and
  // the island at rest (untouched 2 s+), counted all the time, at each hide with 3 s+ of it (r3 L4; was 15 s untouched,
  // then 10 s, once a load: it never fired): its seconds, drawn frames, shadow passes, the pacers' wake-ups a
  // second, and the scene's draw calls and triangles a frame, the pixel ratio and the camera's z; the share (%) of frames at the full rate and its top three reasons, each's share of the frames drawn;
  // of `fx`'s, the flourish's kind that asked most (`fx1`, effects.ts FxKind) and its share (`fw1`); of `nodes`', the
  // moving node's tag that did (`nd1`, camera.svelte.ts moveStart) and its share (`nw1`): world3d/rest.ts)
  // ごはん's barcode scanner, once a session (lib/scan/timing.ts): ms from the camera's open to its first frame and to
  // the read, the decode's p50 and max and the band grab's p50 (ms a frame read), the frames read, how it ended (a
  // read, a typed number, the idle stop, none); never the code or the food
  "perf.scan": { src: 'c', f: { frame: 'n', read: 'n', dec50: 'n', decMax: 'n', grab: 'n', n: 'n', end: ['read', 'typed', 'idle', 'none'] } },
  // ごはん's catalog loading (lib/food/load.ts, dbHold.svelte.ts): ms to searchable of the core datasets (`core`, from
  // index.json), a lazy one (`off` products.json, `kalori` the chain menus, from being asked for) or a barcode shard's
  // fetch (`jan`); each once a load, never what was searched or scanned
  "perf.food": { src: 'c', f: { set: ['core', 'off', 'kalori', 'jan', 'other'], ms: 'n' } },
  // a room entered (the tent, a home, the shop, the museum: rooms/roomTiming.ts), once a visit: ms from the navigation's
  // start (the page's, opened on it) to the room's mount (`nav`: the route's chunk, the door's close), from the mount to
  // its first frame (`first`) and to its models all in (`models`, -1: not within 10 s), its longest display frame till a
  // second after the first (`long`), its visit this load (`n`)
  "perf.room": { src: 'c', f: { room: ['tent', 'home', 'shop', 'museum'], nav: 'n', first: 'n', models: 'n', long: 'n', n: 'n' } },
  "perf.back": { src: 'c', f: { first: 'n', loaded: 'n', shown: 'n', long: 'n', appear: 'n', steps: 'n', progs: 'n' } },
  // the 3D pick tried on a phone (`?pick3d=1`, world3d/pick3dWatch.ts), at each hide: the island's taps, the pick's ms
  // (median, p95, max), how many disagreed with the DOM's answer and the first three as `dom/3d` kinds; no point, no id
  "perf.pick": { src: 'c', f: { n: 'n', med: 'n', p95: 'n', max: 'n', dis: 'n', d1: 't', d2: 't', d3: 't' } },
  "perf.rest": { src: 'c', f: { s: 'n', fps: 'n', shadows: 'n', wakes: 'n', calls: 'n', tris: 'n', dpr: 'n', camZ: 'n', full: 'n', why1: LOG_FULL_WHY, w1: 'n', why2: LOG_FULL_WHY, w2: 'n', why3: LOG_FULL_WHY, w3: 'n', fx1: 't', fw1: 'n', nd1: LOG_MOVE_TAGS, nw1: 'n' } },
  // src: the file and line (a listener's), or the tag of the code that caught it (quiet.ts caught: `live`, `world`, …)
  "js.error": { src: 'c', f: { kind: ['error', 'rejection'], msg: 'msg', stack: 'stack', src: 't', n: 'n', leaving: 'b', route: LOG_ROUTES, ...AT } },
  "api.fail": { src: 'c', f: { ...API, ...AT } },
  "api.ok": { src: 'c', f: API },
  // a members-only call (keyed.ts: ジム's settings) that failed: which, why, its status; n: the
  // same one's repeats folded while unsent (once an incident)
  "keyed.fail": { src: 'c', f: { ep: ['gym', 'other'], why: ['refused', 'failed', 'unreached', 'timeout'], http: 'n', n: 'n', ...AT } },
  "auth.lost": { src: 'c', f: { from: ['refresh', 'flush', 'ws'], code: 'n' } },
  "sync.fail": { src: 'c', f: { err: LOG_STATUS, cached: 'b', ...AT } },
  "queue.retry": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n', n: 'n' } },
  // why: the record's rule when it named one (`owned`, `reward_paid`, `wallet_short`…: relay/src/store.ts)
  "queue.drop": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n', why: 't' } },
  // an event set aside (the record failed it 30 times, or too large alone) / a batch refused whole, halved
  "queue.poison": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n' } },
  "queue.split": { src: 'c', f: { n: 'n', err: LOG_STATUS } },
  // a welcome after failed tries only (the rest say it on their ws.close)
  "ws.open": { src: 'c', f: { ms: 'n', retries: 'n' } },
  // why: sync/live.ts CloseWhy; quiet: s since the socket last heard anything; rtt: its shortest ping round trip (ms);
  // v: the protocol its hello spoke (which phones speak what: the one source since the relay's ws.hello went,
  // 2026-11-13); openMs, retries: its welcome's ms from the making and the failed tries before it
  "ws.close": { src: 'c', f: { code: 'n', secs: 'n', welcomed: 'b', why: ['hidden', 'offline', 'stale', 'late', 'stuck', 'rekey', 'stop', 'closed'], quiet: 'n', rtt: 'n', v: 'n', openMs: 'n', retries: 'n' } },
  "ws.park": { src: 'c', f: { code: 'n' } },
  "ws.unacked": { src: 'c', f: { kind: 't', tries: 'n' } },
  "gl.lost": { src: 'c', f: { where: ['island', 'tent', 'shop', 'museum', 'sugoroku', 'map', 'other'], restored: 'b', ...AT } },
  // file: the chunk's base name (vite:preloadError's); n: its failures folded while unsent
  "chunk.fail": { src: 'c', f: { file: 't', n: 'n', ...AT } },
  // English Study (lib/english): a clip's bank that didn't load (data.ts: its HTTP status, none for no answer; `bad` a
  // file not its clip), YouTube's embed in error (`code` its onError's: 100 gone, 101/150 not embeddable, 153 no
  // referrer…; `hello` no answer to the handshake in 12 s), a play asked that didn't start (`stuck`, once a lesson);
  // the clip's id, whether the phone said it was online
  "english.fail": { src: 'c', f: { what: ['bank', 'deck', 'embed', 'hello', 'stuck'], clip: 't', n: 'n', http: 'n', code: 'n', bad: 'b', on: 'b', ...AT } },
  // the installed app's storage kept from eviction (sync/persist.ts: asked once): granted, already so, and the quota's MB
  "storage.persist": { src: 'c', f: { ok: 'b', was: 'b', useMb: 'n', quotaMb: 'n' } },
  // the site's storage once a Tokyo day (sync/persist.ts storageDaily: navigator.storage.estimate, MB),
  // whether it's kept from eviction, and (r3 L7) each service worker cache's MB (sync/cacheSizes.ts)
  // the speech test (routes/speech, docs/speech-test.md): times and the match only, never the audio or what was heard
  // and why the mic failed: getUserMedia's error (`gum` its name, `msg`), the mic's permission, the home-screen app,
  // the island's audio context and audio session as the page opened and as the mic was asked for; a take's recording
  // (its KB and type, whether it decoded, the loudest sample ×1000, a muted track); sentS: the seconds sent, the take's
  // silence at either end cut (speech/match.ts trimSilence). `denied`: builds before 2026-11-19
  "speech.test": { src: 'c', f: { audS: 'n', sentS: 'n', kb: 'n', encMs: 'n', netMs: 'n', aiMs: 'n', totMs: 'n', match: 'n', lvl: 'n', ok: 'b', err: ['denied', 'refused', 'nomic', 'busy', 'session', 'insecure', 'empty', 'silent', 'off', 'capped', 'network', 'ai', 'other'], gum: 't', msg: 'msg', perm: ['granted', 'denied', 'prompt', 'none'], pwa: 'b', md: 'b', ctx: 't', sess: 't', sessNow: 't', recKB: 'n', type: 't', decoded: 'b', peak: 'n', muted: 'b' } },
  // an /stt upload that didn't reach the relay, sent once more (speech/stt.ts transcribe): the first try's time to its
  // error and its message (WebKit's mostly "Load failed"), the phone online, the page shown, a service worker in
  // control; and how the second went (ok, or why not: keyed.ts)
  "stt.retry": { src: 'c', f: { ms: 'n', msg: 'msg', on: 'b', vis: ['visible', 'hidden'], sw: 'b', ok: 'b', why: ['unreached', 'timeout', 'refused', 'failed', 'aborted', 'unpaired'] } },
  // 英語すごろく's spoken sentence (lib/sugoroku): what decided the feedback (the phone's task check, the wasei list, the
  // relay's AI, none), its verdict, the time to it, the takes, edited before grading, re-said after a tip, why not.
  // Never the sentence
  "sg.grade": { src: 'c', f: { layer: ['task', 'wasei', 'ai', 'none'], verdict: ['great', 'ok', 'tip', 'none'], ms: 'n', takes: 'n', edited: 'b', resaid: 'b', err: ['denied', 'off', 'capped', 'network', 'ai', 'timeout', 'other'] } },
  // 英語すごろく online (lib/sugoroku/online.svelte.ts), once per game and reason: a move heard past a missing one (gap:
  // `held` waiting), a move of mine not sent for it (wait), the relay's move taking the place of mine (clash: an end
  // before it, a resend's race), the relay refusing mine (refused), a start on another build's rules (version)
  "sg.sync": { src: 'c', f: { why: ['gap', 'wait', 'clash', 'refused', 'version', 'drop'], i: 'n', held: 'n' } },
  // 英語すごろく's みんなで！ (lib/sugoroku/components/mini), on each phone that plays one: its open and close, the game, the
  // seats dealt in, local or online; at the close, how long it ran here (ms). Never a play, a word or a name
  "sg.mini": { src: 'c', f: { act: ['open', 'close'], game: ['market', 'spell', 'together', 'sort', 'other'], seats: 'n', mode: ['local', 'online'], ms: 'n' } },
  // 英語すごろく's 3D board (lib/sugoroku/board3d), once a game shown, at its leave: ms from the engine's start to its first
  // drawn frame and to the last player's model in (-1: none came); while it moved (hops, the die, the camera), the
  // frames drawn a second, the 95th-percentile frame gap and those over 50 ms; its draw calls, pixel ratio, seconds shown
  "perf.sg": { src: 'c', f: { first: 'n', models: 'n', fps: 'n', p95: 'n', long: 'n', calls: 'n', dpr: 'n', s: 'n' } },
  "storage.use": { src: 'c', f: { useMb: 'n', quotaMb: 'n', persisted: 'b', shell: 'n', room: 'n', art: 'n', photos: 'n', tiles: 'n', foodImg: 'n', food: 'n', fonts: 'n', audio: 'n', other: 'n' } },
  "storage.fail": { src: 'c', f: { store: ['ls', 'idb', 'log'], kind: ['full', 'unavailable', 'blocked', 'other'] } },
  use: { src: 'c', f: { '*': 'n' } },
  "log.drop": { src: 'c', f: { n: 'n', why: ['cap', 'full', 'day', 'pending'] } },
  // ボット's 保養所 (lib/its/client.ts): a call to the its-bot Worker that failed: which, its HTTP status (none:
  // no answer), the Worker's error code or the phone's (offline, timeout, json, no_key), ms
  "its.fail": { src: 'c', f: { op: ['status', 'settings', 'run', 'push_subscribe', 'push_unsubscribe', 'push_test'], err: 't', rid: 't', http: 'n', ms: 'n' } },
  // ボット's ジム: a read of the gym bot's public /status that failed (lib/gym/status.ts), or a POST /gym/act
  // (lib/gym/config.ts): its HTTP status (none: no answer), the Worker's code (stale, cooldown, day_passed, …) or the
  // phone's (offline, timeout, http, json), the act's request id, ms. (/gym/config, members only, is keyed.fail's `gym`.)
  "gym.fail": { src: 'c', f: { op: ['status', 'act'], err: 't', rid: 't', http: 'n', ms: 'n' } },
  // ボット's メニュー: a read of the Kalori scraper's status.json (raw.githubusercontent.com) that failed
  // (lib/kalori/status.ts): its HTTP status (none: no answer), the phone's code (offline, http, json), ms
  "kalori.fail": { src: 'c', f: { op: ['status'], err: 't', http: 'n', ms: 'n' } },
  // 保養所's 通知 (lib/its/push.ts): the browser's part that failed (the permission's prompt, the service worker's
  // registration, subscribe, unsubscribe) and the error's name; never the endpoint or a key
  "its.push": { src: 'c', f: { step: ['permission', 'ready', 'subscribe', 'unsubscribe'], err: 't' } },
  // ---- the relay
  // rw, rr: the rows the record wrote and read for it (SQLite cursors: the Free plan's 100k rows written a day); kh, on
  // `unauthorized`: the first 4 hex of the SHA-256 of the key it presented (never the key: a stale device, an e2e's
  // fake and a stranger told apart)
  req: { src: 'r', f: { action: LOG_ACTIONS, st: LOG_STATUS, ms: 'n', inB: 'n', outB: 'n', n: 'n', rej: 'n', why: 't', m: 'n', sk: 'n', w: 'n', dup: 'n', exc: 't', pg: 'n', rw: 'n', rr: 'n', kh: 't' } },
  // rw: the rows the room wrote (its storage puts) since it last said (the Free plan's rows written a day)
  "room.close": { src: 'r', f: { code: 'n', secs: 'n', socks: 'n', rw: 'n' } },
  "room.full": { src: 'r', f: { socks: 'n' } },
  // a weather fetch that failed (warn), and once a Tokyo day (00:15) its health (info): fails since the last good one
  "cron.wx": { src: 'r', f: { ok: 'b', fetched: 'b', fail: 't', hours: 'n', age: 'n', ms: 'n', fails: 'n' } },
  "cron.compact": { src: 'r', f: { dates: 'n', deleted: 'n', more: 'b', metrics: 'n', ms: 'n' } },
  // the record's daily backup (relay/src/archive.ts): st ok / no_token / empty / github (step, http) / an error's class;
  // its size, rows, the dumps kept and deleted, wall ms (the whole, the dump, the encryption, GitHub's), the record's
  // rows written (0) and read
  "cron.backup": { src: 'r', f: { ok: 'b', st: 't', step: 't', http: 'n', kB: 'n', rawkB: 'n', metrics: 'n', events: 'n', kept: 'n', del: 'n', ms: 'n', upMs: 'n', rw: 'n', rr: 'n', fails: 'n', force: 'b', imgDel: 'n', imgLive: 'n', imgDangling: 'n' } },
  "do.error": { src: 'r', f: { where: 't', name: 't', msg: 'msg' } },
  "store.corrupt": { src: 'r', f: { where: ['spend', 'board', 'food', 'tally', 'shop', 'decor', 'pack'] } },
  // the かいがら wallet (relay/src/store.ts): one seeded from the fold of the rows (absent, or kept by a relay that
  // can't be read), and the daily check's (walletcheck) stored value that isn't the fold's; never fixed by itself
  "wallet.seed": { src: 'r', f: { who: ['A', 'B', 'G'], h: 'n' } },
  "wallet.drift": { src: 'r', f: { who: ['A', 'B', 'G'], stored: 'n', fold: 'n', floor: 'n' } },
  admin: { src: 'r', f: { op: 't', st: 't' } },
  "log.cap": { src: 'r', f: { bucket: 't' } },
  // `POST /stt` (relay/src/sttRoute.ts): sizes and times, never the audio or its text
  stt: { src: 'r', f: { ms: 'n', inB: 'n', model: ['turbo'], ok: 'b', err: ['off', 'too_large', 'bad_request', 'capped', 'ai'] } },
  // `POST /img` (relay/src/img.ts): a マイ食品 picture's upload, its size, time and outcome (dup: held already), never its id
  img: { src: 'r', f: { ms: 'n', inB: 'n', ok: 'b', dup: 'b', err: ['unauthorized', 'bad_request', 'too_large', 'bad_type', 'bad_dims', 'exif', 'bad_id', 'cap', 'unavailable'] } },
  // `POST /grade` (relay/src/gradeRoute.ts): the sentence's length (inC), the time, the outcome, the verdict and who
  // gave it (the wasei list or the AI), never the sentence or the answer; hedged: a second identical call started
  // (no answer in 2.5 s), won: which call answered first
  grade: { src: 'r', f: { ms: 'n', inC: 'n', ok: 'b', err: ['off', 'too_large', 'bad_request', 'capped', 'ai'], verdict: ['great', 'ok', 'tip'], src: ['ai', 'wasei'], hedged: 'b', won: 'n' } }
} as const satisfies Record<string, { src: 'c' | 'r'; f: Fields }>;

export type LogEventName = keyof typeof LOG_EVENTS;
export type LogData = Record<string, number | boolean | string>;

/** A token: an enum value, a rule's name, a file's. At most 40 of [A-Za-z0-9_.:/-], and never 16 or more letters
 *  and digits in a row (a key, or a piece of one; an id). */
const TOKEN = /^[A-Za-z0-9_.:/-]{1,40}$/;
const LONGRUN = /[0-9A-Za-z]{16,}/;
export const isToken = (v: unknown): v is string => typeof v === 'string' && TOKEN.test(v) && !LONGRUN.test(v);
/** A counter's name (`use`): its kind and a token. */
const COUNTER = /^(sheet|route|act|swallow):[A-Za-z0-9_.-]{1,32}$/;
/** A session, request or batch id: 6–15 of [0-9a-z] (never long enough to hold a key). */
const ID = /^[0-9a-z]{6,15}$/;
export const isLogId = (v: unknown): v is string => typeof v === 'string' && ID.test(v);
/** @public (relay/src/log.ts) */
export const isLogEvent = (e: unknown): e is LogEventName => typeof e === 'string' && Object.hasOwn(LOG_EVENTS, e);

/** Quoted text kept when it reads as code (`'e.stats().fps'`, Safari's `evaluating '…'`): no blank, a `.` or a `(`. */
const CODE = /^[\w$.()[\]#]{1,60}$/;

/**
 * A JS error's message as its fingerprint, scrubbed in this order (each step sees the last's output): a URL →
 * `<url>`; an e-mail → `<email>`; a query or fragment (`?…`, `#key=…`) cut; 16+ letters and digits (a key, an id) → `<id>`; quoted text →
 * `"…"` unless it reads as code; `{…}` / `[…]` → `{…}`; non-ASCII runs (Japanese, a food's name) → `…`; numbers (a
 * weight, a step count) → `#`; blanks folded; at most 120 characters. The same bug gives the same message.
 */
export function scrubMsg(s: unknown): string {
  return String(s ?? '')
    .replace(/\b[a-z][a-z0-9+.-]*:\/\/\S*/gi, '<url>')
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '<email>')
    // (a fragment is `#` and a word with = / & after it: never the `#` this leaves for a number, so a second pass, the
    // relay's, changes nothing)
    .replace(/\?\S*|#(?=[A-Za-z_][\w-]*[=/&])\S*/g, '')
    .replace(/[0-9A-Za-z+/=_-]{16,}/g, '<id>')
    .replace(/(["'`])([^"'`]{0,400}?)\1/g, (_, q: string, x: string) => (CODE.test(x) && /[.(]/.test(x) ? `${q}${x}${q}` : '"…"'))
    .replace(/\{[^{}]{0,400}\}|\[[^[\]]{0,400}\]/g, '{…}')
    .replace(/[^\x20-\x7e]+/g, '…')
    .replace(/\d+(?:[.,]\d+)?/g, '#')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

/** A file's name from a URL or path (the hashed chunk's): its query and fragment cut first (`/pair#key=…`). */
export const baseName = (u: string): string => (u.split(/[?#]/)[0].split('/').pop() ?? '').replace(/[^\w.-]/g, '').slice(0, 60);

/**
 * A stack as its top `n` frames, `fn@file:line:col` (the file's base name), from Safari's `fn@url:l:c` lines and
 * Chrome's `at fn (url:l:c)`: no message, no URL's query or fragment, nothing else.
 */
export function scrubStack(s: unknown): string {
  const n = 4;
  const out: string[] = [];
  for (const line of String(s ?? '').split('\n')) {
    const m = /^\s*(?:at\s+)?(?:(.*?)\s*[@(]\s*)?([a-z][a-z0-9+.-]*:[^\s)]*?|[\w./-]+\.(?:js|ts|svelte|mjs)):(\d+):(\d+)\)?\s*$/i.exec(line);
    if (!m) continue;
    const fn = /^[\w$.<>]{1,40}$/.test(m[1] ?? '') ? m[1] : '?';
    out.push(`${fn}@${baseName(m[2]) || '?'}:${m[3]}:${m[4]}`);
    if (out.length >= n) break;
  }
  return out.join('\n');
}

/** A word for a thrown thing: its class (`TypeError`), never its message. @public (relay/src/log.ts) */
export const errName = (e: unknown): string => {
  const n = e instanceof Error ? e.name : typeof e;
  return isToken(n) ? n : 'Error';
};

/** A finite number held to ±1e7, to a tenth; else null. */
const tenth = (v: unknown): number | null => (isNum(v) ? Math.round(Math.max(-1e7, Math.min(1e7, v)) * 10) / 10 : null);

/** One field of an event as kept: its kind's value, or undefined (dropped). */
function field(kind: Kind, v: unknown): number | boolean | string | undefined {
  if (Array.isArray(kind)) return typeof v === 'string' && kind.includes(v) ? v : undefined;
  switch (kind) {
    case 'n': return tenth(v) ?? undefined;
    case 'b': return typeof v === 'boolean' ? v : undefined;
    case 't': return isToken(v) ? v : undefined;
    case 'msg': return typeof v === 'string' ? scrubMsg(v) || undefined : undefined;
    case 'stack': return typeof v === 'string' ? scrubStack(v) || undefined : undefined;
  }
  return undefined;
}

/** An event's payload as the log keeps it: only its registry's fields, each of its kind; the rest dropped. */
export function cleanData(e: LogEventName, d: unknown): LogData {
  const out: LogData = {};
  if (!d || typeof d !== 'object' || Array.isArray(d)) return out;
  const f: Fields = LOG_EVENTS[e].f;
  let counters = 0;
  for (const [k, v] of Object.entries(d as Record<string, unknown>)) {
    const own = Object.hasOwn(f, k) && k !== '*';
    const kind = own ? f[k] : f['*'] && COUNTER.test(k) && !LONGRUN.test(k) && counters < 40 ? f['*'] : undefined;
    if (!kind) continue;
    const x = field(kind, v);
    if (x === undefined) continue;
    out[k] = x;
    if (!own) counters++;
  }
  return out;
}

/** A level from anything (else info). @public (relay/src/log.ts) */
export const levelOf = (l: unknown): LogLevel => (l === 0 || l === 1 || l === 2 || l === 3 ? l : 1);

/** The route's first segment, as the log names it (never the query or the fragment: `/pair#key=…`). */
export function logRoute(path: string): (typeof LOG_ROUTES)[number] {
  const r = `/${path.split(/[?#]/)[0].split('/').filter(Boolean)[0] ?? ''}`;
  return (LOG_ROUTES as readonly string[]).includes(r) ? (r as (typeof LOG_ROUTES)[number]) : 'other';
}

/** A phone's event as it sends it (the batch's `es`): its clock, level, name, sequence in the session, request id, payload. */
export interface LogEventIn {
  t: number;
  l: LogLevel;
  e: LogEventName;
  /** The session's sequence number (an order when the clock jumps). */
  q: number;
  /** A request id (`api.*`: the `rid` the request carried). */
  r?: string;
  d?: LogData;
}

/** A phone's batch (`POST /log`): who (the key: the relay keeps only the role), the batch id, the session, the build. */
export interface LogBatch {
  v: typeof LOG_V;
  key: string;
  b: string;
  s: string;
  build: string;
  os: string;
  es: LogEventIn[];
}

/** At most this many events in a batch, and characters in its body (a keepalive fetch takes ≤ 64 KB in flight). @public (relay/src/log.ts) */
export const LOG_BATCH_MAX = 50, LOG_BODY_MAX = 32_000;
