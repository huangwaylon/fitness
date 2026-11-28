// The log's events (docs/ops/observability.md): one schema for the phones (sync/log.ts) and the relay (relay/src/log.ts,
// the `IslandLog` object), versioned (`LOG_V`). Every event is a name from `LOG_EVENTS` and a payload of only that
// name's fields, each of its kind: a bounded number, a boolean, a value from a closed set, a short token (never a run
// of hex or of letters and digits long enough to be a key), and a JS error's scrubbed message and stack. The relay
// keeps nothing else, whatever a phone sends: no key, no health value, no food name, no free text, no URL. Pure.
import { EVENT_TYPES } from './api.ts';
import { isNum } from './guards.ts';
import { FARM_REFUSALS } from './farm.ts';

/** @public (relay/src/log.ts) */
export const LOG_V = 1;

/** 0 debug · 1 info · 2 warn · 3 error. @public (relay/src/log.ts) */
export type LogLevel = 0 | 1 | 2 | 3;

/** The record's API actions (relay/src/store.ts route), and `other`. @public (relay/src/reqMeta.ts) */
export const LOG_ACTIONS = ['health', 'ingest', 'event', 'events', 'snapshot', 'uploads', 'whoami', 'share_list', 'share_make', 'share_set', 'share_visits', 'paircode', 'pairredeem', 'finlog', 'other'] as const;
/** A request's outcome: `ok`, the record's error codes, the phone's own (`offline`, `http`, `json`), `none` (no answer). @public (relay/src/reqMeta.ts) */
export const LOG_STATUS = ['ok', 'unauthorized', 'forbidden', 'bad_request', 'too_large', 'busy', 'unavailable', 'offline', 'http', 'json', 'none'] as const;
/** The app's routes (their first segment). */
const LOG_ROUTES = ['/', '/pair', '/tent', '/shop', '/museum', '/jar', '/editor', '/dev', '/world3d', '/sugoroku', '/speech', '/gym', '/s', 'other'] as const;
/** The island's sheets, as `perf.sheet` names them (ui-state/sheetTiming.ts), the `use` counters' `sheet:` and the
 *  error events' `sheet` (the topmost open one; an untimed sheet by its name's first word: logSheetOf). */
const LOG_SHEETS = ['food', 'health', 'travel', 'wedding', 'hiking', 'places', 'english', 'panel', 'zukan', 'settings', 'bots', 'farm', 'todo', 'shop', 'tent', 'sugoroku', 'other'] as const;
export type LogSheet = (typeof LOG_SHEETS)[number];
/** An untimed sheet's place in the error events (Sheet.svelte `name`: the shop counter's is shop, すごろく's sugoroku);
 *  undefined when its first word names none. */
export const logSheetOf = (name: string | undefined): LogSheet | undefined => {
  const w = /^[a-z]+/.exec(name ?? '')?.[0];
  return w && w !== 'other' && (LOG_SHEETS as readonly string[]).includes(w) ? (w as LogSheet) : undefined;
};
const EV_TYPES = [...EVENT_TYPES, 'other'] as const;
/** What asked for the island's frames at the full rate (world3d/engine.ts `why`; `vil` `walk` (someone walking in view)
 *  `nodes` (a node moving: camera.svelte.ts moveStart) `mirror` its scene's: Island3D, `world` the two as builds before
 *  2026-11-14 sent them; `crit-fish` a fish's dart, `crit-bug` a bug's move, `crit-rear` the tarantula rearing:
 *  critters.svelte.ts, `crit` the three as builds before 2026-11-13 sent them): perf.rest's top three. @public (world3d/engine.ts) */
/** What a node moving says it is (camera.svelte.ts moveStart's tag, perf.rest's `nd1`; `float` as builds before
 *  2026-11-15 sent it: fishing3d.ts floatWants since). */
const LOG_MOVE_TAGS = ['wash', 'shake', 'zap', 'crit', 'popper', 'present', 'float', 'other'] as const;
export type LogMoveTag = (typeof LOG_MOVE_TAGS)[number];
/** What last kept the island at the full rate with nothing moving (world3d/engine.ts activity's caller, perf.rest's
 *  `ac1`): a finger's pan, zoom, fling or touch, the camera put (go), its ends (limits), the time of day's light (tod),
 *  an option, a camera move's tail (move), a flourish (fx). @public (world3d/engine.ts) */
export const LOG_ACTIVE_TAGS = ['pan', 'zoom', 'fling', 'touch', 'go', 'limits', 'tod', 'opts', 'move', 'fx', 'other'] as const;
export const LOG_FULL_WHY = ['focus', 'fling', 'settle', 'things', 'scene', 'vil', 'world', 'walk', 'nodes', 'mirror', 'cards', 'fx', 'crit', 'crit-fish', 'crit-bug', 'crit-rear', 'bite', 'ground', 'lights', 'touch', 'active', 'other'] as const;

/** A field's kind: `n` a number (rounded to 0.1, within ±1e7), `b` a boolean, `t` a token, a closed set (an array),
 *  `msg` / `stack` scrubbed text. */
type Kind = 'n' | 'b' | 't' | 'msg' | 'stack' | readonly string[];
/** `*`: counters (`use`): `sheet:` · `route:` · `act:` · `swallow:` and a token, at most 40 of them, each a number. */
type Fields = Readonly<Record<string, Kind>>;

/** keyed.fail's endpoint classes (keyedEp). */
const LOG_KEYED_EPS = ['gym', 'places', 'todo', 'hike', 'img', 'stt', 'grade', 'other'] as const;
/** A path's word → its class: the relay's routes (`/places`, `/places/pics`, `/hiking`, `/img`, `/stt`, `/grade`, やること's
 *  `/api/push…`) and ジム's `/gym/config`. */
const KEYED_WORDS: Record<string, (typeof LOG_KEYED_EPS)[number]> = { gym: 'gym', places: 'places', push: 'todo', hiking: 'hike', img: 'img', stt: 'stt', grade: 'grade' };
/** A members-only call's class by its URL's path (never the URL itself): its first word that names one, else other. */
export function keyedEp(url: string): (typeof LOG_KEYED_EPS)[number] {
  const path = url.split(/[?#]/)[0].replace(/^[a-z][a-z0-9+.-]*:\/\/[^/]*/i, '');
  for (const w of path.split('/')) if (Object.hasOwn(KEYED_WORDS, w)) return KEYED_WORDS[w];
  return 'other';
}

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
  // app.show's `f1`: the show to its first frame (`ms` to the second)
  "app.show": { src: 'c', f: { awayS: 'n', route: LOG_ROUTES, ms: 'n', f1: 'n' } },
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
  // `cardA`); `hid` the page hidden before the island's mount (a reload under the player for an update: not a launch); `ents` the origin's cache entries as storage.use last counted them; a field at its usual value left out (BOOT_DEFAULTS)
  // `progPre` the programs linked ahead from the last launch's set, `progHit` those the models took, `prog` ms from
  // `loaded` to the last program linked (world3d/progCache.ts)
  // `swi` a deploy's new worker beside the launch (installing or waiting at its start, or found during it at `swiMs`),
  // `chunkEnd` / `chunkN` the last of the app's files begun before the mount, its arrival, and their count
  // (ui-state/launchSw.ts); `swBig` / `swBigKB` the worker's biggest fetch meanwhile when 64 KB or more (its path's last
  // two parts: service-worker/caches.ts netLog)
  "perf.boot": { src: 'c', f: { mount: 'n', first: 'n', loaded: 'n', shown: 'n', long: 'n', draw: 'n', appear: 'n', steps: 'n', progs: 'n', fieldsMs: 'n', fields: ['cache', 'worker', 'main'], sw: ['ctl', 'none', 'no'], warm: 'b', net: 'n', sLink: 'n', msLink: 'n', sModels: 'n', msModels: 'n', sCards: 'n', msCards: 'n', stepMs: 'n', late: 'n', lastM: 't', data: 'n', garden: ['first', 'late', 'none'], farm: ['first', 'late'], ask: 'n', held: 'n', shell: ['new', 'net', 'same', 'skip', 'cache'], raceMs: 'n', pre: 'n', swCold: 'b', swNet: 'n', swRoom: 'n', swKB: 'n', tx: 'n', txFail: 'n', txWebp: 'n', txOff: 'b', lateF: 'n', lateA: 'n', swUp: 'n', swOwn: 'n', swFresh: 'n', swAns: 'n', lastC: 't', cardF: 'n', cardA: 'n', hid: 'b', ents: 'n',
    progPre: 'n', progHit: 'n', prog: 'n',
    swi: ['inst', 'wait', 'found'], swiMs: 'n', chunkEnd: 'n', chunkN: 'n', swBig: 't', swBigKB: 'n' } },
  // the island's first return to it a load (back from a room: perf.boot's marks, ms from the mount), and
  // the island at rest (untouched 2 s+), counted all the time, at each hide with 3 s+ of it (r3 L4; was 15 s untouched,
  // then 10 s, once a load: it never fired): its seconds, drawn frames, shadow passes, the pacers' wake-ups a
  // second, and the scene's draw calls and triangles a frame, the pixel ratio and the camera's z; the share (%) of frames at the full rate and its top three reasons, each's share of the frames drawn;
  // of `fx`'s, the flourish's kind that asked most (`fx1`, effects.ts FxKind) and its share (`fw1`); of `nodes`', the
  // moving node's tag that did (`nd1`, camera.svelte.ts moveStart) and its share (`nw1`); of `active`'s, its caller (`ac1`, engine.ts activity) and its share (`aw1`): world3d/rest.ts)
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
  // a page loaded out of sight (a deploy taken at a hide), once in front: ms from it coming to the front to the island
  // whole (`shown`: it stood whole before), the page's age then (world3d/boot.ts watchBoot)
  "perf.resume": { src: 'c', f: { ms: 'n', shown: 'b', ageS: 'n' } },
  // a map area saved for offline (lib/offline/areas.svelte.ts), once a save at its end: the tiles' source, whole or not,
  // the plan's tiles, those stored, the host had none of and still missing, its kB and ms, why it stopped short (the
  // player's 中止, the TileJSON not had, storage full, the network, else other); never the area, its id or a place
  "offline.save": { src: 'c', f: { src: ['ofm', 'usgs', 'gsi'], ok: 'b', tiles: 'n', stored: 'n', empty: 'n', failed: 'n', kB: 'n', ms: 'n', why: ['abort', 'tilejson', 'quota', 'net', 'other'] } },
  // a deploy's worker gone redundant as it installed (ui-state/reload.ts newWorker): the page stays on its build
  "sw.installFail": { src: 'c', f: { ms: 'n' } },
  "perf.rest": { src: 'c', f: { s: 'n', fps: 'n', shadows: 'n', wakes: 'n', calls: 'n', tris: 'n', dpr: 'n', camZ: 'n', full: 'n', why1: LOG_FULL_WHY, w1: 'n', why2: LOG_FULL_WHY, w2: 'n', why3: LOG_FULL_WHY, w3: 'n', fx1: 't', fw1: 'n', nd1: LOG_MOVE_TAGS, nw1: 'n', ac1: LOG_ACTIVE_TAGS, aw1: 'n' } },
  // src: the file and line (a listener's), or the tag of the code that caught it (quiet.ts caught: `live`, `world`, …)
  "js.error": { src: 'c', f: { kind: ['error', 'rejection'], msg: 'msg', stack: 'stack', src: 't', n: 'n', leaving: 'b', route: LOG_ROUTES, ...AT } },
  "api.fail": { src: 'c', f: { ...API, ...AT } },
  "api.ok": { src: 'c', f: API },
  // a members-only call (keyed.ts) that failed: its endpoint's class (keyedEp: the relay's path's first segment, ジム's
  // settings), why, its status; n: the same one's repeats folded while unsent (once an incident)
  "keyed.fail": { src: 'c', f: { ep: LOG_KEYED_EPS, why: ['refused', 'failed', 'unreached', 'timeout'], http: 'n', n: 'n', ...AT } },
  "auth.lost": { src: 'c', f: { from: ['refresh', 'flush', 'ws'], code: 'n' } },
  "sync.fail": { src: 'c', f: { err: LOG_STATUS, cached: 'b', ...AT } },
  "queue.retry": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n', n: 'n' } },
  // why: the record's rule when it named one (`owned`, `reward_paid`, `wallet_short`…: relay/src/store.ts)
  "queue.drop": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n', why: 't' } },
  // an event set aside (the record failed it 30 times, or too large alone) / a batch refused whole, halved
  "queue.poison": { src: 'c', f: { type: EV_TYPES, err: LOG_STATUS, tries: 'n', b: 'n' } },
  "queue.split": { src: 'c', f: { n: 'n', err: LOG_STATUS } },
  // a welcome after failed tries only (the rest say it on their ws.close)
  "ws.open": { src: 'c', f: { ms: 'n', retries: 'n' } },
  // why: sync/live.ts CloseWhy; quiet: s since the socket last heard anything; rtt: its shortest ping round trip (ms);
  // v: the protocol its hello spoke (which phones speak what: the one source since the relay's ws.hello went,
  // 2026-11-13); openMs, retries: its welcome's ms from the making and the failed tries before it
  // (2026-11-22) since the last ws.close (sync/live.ts SockCounts): messages sent, heard, kept intents sent again, `busy`
  // heard, messages this build couldn't read (bad); tent / walk / drag sent (sT sW sD) and heard (rT rW rD); sends that
  // went nowhere, no socket (lost) or nobody here (alone); at the close: kept intents waiting (pending) and held back by
  // the socket's buffer (held), the relay's clock offset (off, ms) and the round trip it was measured on (offRtt)
  "ws.close": { src: 'c', f: { code: 'n', secs: 'n', welcomed: 'b', why: ['hidden', 'offline', 'stale', 'late', 'stuck', 'rekey', 'stop', 'closed'], quiet: 'n', rtt: 'n', v: 'n', openMs: 'n', retries: 'n', visS: 'n', sent: 'n', recv: 'n', resent: 'n', busy: 'n', bad: 'n', sT: 'n', sW: 'n', sD: 'n', rT: 'n', rW: 'n', rD: 'n', lost: 'n', alone: 'n', pending: 'n', held: 'n', off: 'n', offRtt: 'n', dv: 't' } },
  // the app hidden with no socket open (sync/live.ts, before the hide's batch; a socket's ws.close says the hide, its visS:
  // seconds shown, since 2026-11-24): seconds it was shown, whether a socket was welcomed meanwhile
  "app.hide": { src: 'c', f: { visS: 'n', welcomed: 'b' } },
  // where this phone has someone now (store/where.svelte.ts): whose villager, the island or inside (a home by its owner,
  // M the museum, S the shop, X a place this build doesn't know), from their `tent` or gone quiet inside. Never a position
  "where.change": { src: 'c', f: { who: ['A', 'B', 'G'], place: ['island', 'A', 'B', 'G', 'M', 'S', 'X'], src: ['tent', 'gone'] } },
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
  // (c1 r3 W1) and each one's entries (`<field>N`: a cold worker's first cache read grows with the origin's entries),
  // `shells` the shell caches kept, `ents` all the entries
  "storage.use": { src: 'c', f: { useMb: 'n', quotaMb: 'n', persisted: 'b', shell: 'n', room: 'n', art: 'n', photos: 'n', tiles: 'n', foodImg: 'n', food: 'n', fonts: 'n', audio: 'n', other: 'n', shellN: 'n', roomN: 'n', artN: 'n', photosN: 'n', tilesN: 'n', foodImgN: 'n', foodN: 'n', fontsN: 'n', audioN: 'n', otherN: 'n', shells: 'n', ents: 'n' } },
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
  // やること's reminders on this phone (lib/push/phone.ts for components/todo/push.ts): the same, its own line
  "todo.phone": { src: 'c', f: { step: ['permission', 'ready', 'subscribe', 'unsubscribe'], err: 't' } },
  // a hike's notification (components/hiking/map/notify.ts, local: no push): shown, the permission asked (yes) or
  // refused, where it can't be (an iPhone's Safari tab, no API), closed at 終了, tapped, a failure's error name; never
  // the trail or a place
  "hike.notify": { src: 'c', f: { act: ['shown', 'asked', 'denied', 'install', 'unsupported', 'closed', 'tapped', 'failed'], err: 't' } },
  // ---- the relay
  // rw, rr: the rows the record wrote and read for it (SQLite cursors: the Free plan's 100k rows written a day); kh, on
  // `unauthorized`: the first 4 hex of the SHA-256 of the key it presented (never the key: a stale device, an e2e's
  // fake and a stranger told apart)
  req: { src: 'r', f: { action: LOG_ACTIONS, st: LOG_STATUS, ms: 'n', inB: 'n', outB: 'n', n: 'n', rej: 'n', why: 't', m: 'n', sk: 'n', w: 'n', dup: 'n', exc: 't', pg: 'n', rw: 'n', rr: 'n', kh: 't' } },
  // rw: the rows the room wrote (its storage puts) since it last said (the Free plan's rows written a day)
  // dv (2026-11-24): the socket's hello `dev` (this device and tab), as the phone's ws.close says it: one socket joined
  // across the two (with the time)
  "room.close": { src: 'r', f: { code: 'n', secs: 'n', socks: 'n', rw: 'n', dv: 't' } },
  "room.full": { src: 'r', f: { socks: 'n' } },
  // (2026-11-22) a socket the room closed itself (room.ts shut: these never reach webSocketClose's room.close): its code
  // (4001 unauthorized, 4002 replaced, 4003 no hello or silent, 4004 version), its seconds open, why
  "room.shut": { src: 'r', f: { code: 'n', secs: 'n', why: ['unauthorized', 'replaced', 'nohello', 'silent', 'version', 'other'], dv: 't' } },
  // a message the room dropped (room.ts drop): its kind (as far as it has one), why (unreadable, over the rate limit, a
  // scope or a fruit not the sender's), the drops on that socket folded in since (n); once a socket a minute at most
  "room.drop": { src: 'r', f: { kind: 't', why: ['parse', 'rate', 'scope', 'pick'], n: 'n', dv: 't' } },
  // (2026-11-24) refusals the Worker answers itself, counted per isolate and said at most once a minute each (the
  // first at once): a socket's (no allowed origin, not a WebSocket, no good admission ticket) and a signed /admin's
  // (a signature of the wrong shape or time, too large, not the keys'); n: since the last line
  "room.refused": { src: 'r', f: { why: ['origin', 'upgrade', 'ticket'], n: 'n' } },
  "admin.refused": { src: 'r', f: { why: ['shape', 'size', 'sig'], n: 'n' } },
  // a hello welcomed: the page's build, protocol revision and seat tables (b pr sv), whether its person already had a
  // socket in (re: presence re), the room's sockets, the builds of the others here (bA bB bG)
  "ws.hello": { src: 'r', f: { b: 't', pr: 'n', sv: 't', re: 'b', socks: 'n', bA: 't', bB: 't', bG: 't', dv: 't' } },
  // a weather fetch that failed (warn), and once a Tokyo day (00:15) its health (info): fails since the last good one
  "cron.wx": { src: 'r', f: { ok: 'b', fetched: 'b', fail: 't', hours: 'n', age: 'n', ms: 'n', fails: 'n' } },
  // ボット → Jobs' Cloudflare free tier (relay/src/cfUsage.ts): its GraphQL read failing (warn: timeout, http_<n>, gql,
  // shape, fetch) or well again (info), once per change of state in an isolate
  "cf.usage": { src: 'r', f: { ok: 'b', why: 't', ms: 'n' } },
  // 行きたい場所's tick (relay/src/places.ts placesLog): a change or a whole read (info), a pulled answer refused (error:
  // the last good list kept); the cron's only on a change of state (cronLog): its categoriser failing or the list
  // stale (warn), well again (info); counts only, never a place
  "cron.places": { src: 'r', f: { ok: 'b', full: 'b', why: ['blocked', 'http', 'parse', 'count', 'coords', 'timeout', 'too_large', 'mass_delete', 'fetch', 'no_list', 'stale'], n: 'n', added: 'n', changed: 'n', gone: 'n', ruled: 'n', ai: 'n', aiFail: 'n', ms: 'n' } },
  // the record's nightly jobs (relay/src/nightly.ts), once a day when the last finishes: the day's ledger drifts, the
  // money check's (fin: 1 drifted), links
  // swept, rows pruned (island days, shop rows + tallies, removals), late: finished by a tick's catch-up
  "cron.nightly": { src: 'r', f: { drift: 'n', fin: 'n', swept: 'n', island: 'n', ledger: 'n', tomb: 'n', late: 'b', ms: 'n' } },
  // the record's daily backup (relay/src/archive.ts): st ok / no_token / empty / github (step, http) / an error's class;
  // its size, rows, the dumps kept and deleted, wall ms (the whole, the dump, the encryption, GitHub's), the record's
  // rows written (0) and read, whose token (by: the GitHub App's, the PAT); then the bots' state (archive.ts runBots): its, gym each ok / none / no_token / http_<n> /
  // bad / github_<step>_<n> / an error's class, their files' kB, its-bot's bookings, the gym state's version, wall ms;
  // appErr, appHttp: why the App's mint failed (its/worker/src/ghApp.ts GhAppError); (2026-11-24) the bots' counts of
  // the Tokyo day before (their X-Bot-Day header): its-bot's runner reports, those with a scan error, dispatches and
  // those refused, watchdog incidents and alerts, pushes sent and failed; gym-bot's checks, those failed (gymDown: every
  // program), LINE pushes sent and failed, the app's changes
  "cron.backup": { src: 'r', f: { ok: 'b', st: 't', step: 't', http: 'n', kB: 'n', rawkB: 'n', metrics: 'n', events: 'n', kept: 'n', del: 'n', ms: 'n', upMs: 'n', rw: 'n', rr: 'n', fails: 'n', force: 'b', imgDel: 'n', imgLive: 'n', imgDangling: 'n', its: 't', gym: 't', itsKB: 'n', gymKB: 'n', itsN: 'n', gymV: 'n', botsMs: 'n', by: ['app', 'pat'], appErr: ['mint_failed', 'install_missing', 'key_bad'], appHttp: 'n', itsRep: 'n', itsRunErr: 'n', itsDisp: 'n', itsDispFail: 'n', itsInc: 'n', itsAlert: 'n', itsPush: 'n', itsPushFail: 'n', gymChecks: 'n', gymFail: 'n', gymDown: 'n', gymPush: 'n', gymPushFail: 'n', gymActs: 'n' } },
  // where: the code that caught it (a cron call's, a nightly job's, the room's, the record's background work: imggc,
  // remind, notify, restored, restoring, alarm, wx); its class and its scrubbed message; warn when it recovers by itself
  "do.error": { src: 'r', f: { where: 't', name: 't', msg: 'msg' } },
  // (2026-11-24) the record's alarm found lost (missing, or this many s past due) and set again by the cron's armCheck
  "do.alarm": { src: 'r', f: { why: ['missing', 'late'], lateS: 'n' } },
  "store.corrupt": { src: 'r', f: { where: ['spend', 'board', 'food', 'tally', 'shop', 'decor', 'pack', 'fin'] } },
  // the かいがら wallet (relay/src/store.ts): one seeded from the fold of the rows (absent, or kept by a relay that
  // can't be read), and the daily check's (walletcheck) stored value that isn't the fold's; never fixed by itself
  "wallet.seed": { src: 'r', f: { who: ['A', 'B', 'G'], h: 'n' } },
  "wallet.drift": { src: 'r', f: { who: ['A', 'B', 'G'], stored: 'n', fold: 'n', floor: 'n' } },
  // the stored ledger (relay/src/ledger.ts): one seeded from the running one (its かいがら, pocket keys, pieces, ずかん
  // keys), and the daily check's part that differs from the running one and the rows (`keys` how many), or a log that
  // doesn't chain, or a kept shop row it refused (`refused`); never fixed by itself
  "ledger.seed": { src: 'r', f: { who: ['A', 'B', 'G'], h: 'n', p: 'n', w: 'n', z: 'n' } },
  // a farm batch's ops the record dropped (relay storeShop.ts farmKept): the first one's reason, how many, how many kept
  "farm.refused": { src: 'r', f: { who: ['A', 'B', 'G'], why: FARM_REFUSALS, n: 'n', kept: 'n' } },
  "ledger.drift": { src: 'r', f: { who: ['A', 'B', 'G'], part: ['h', 'p', 'w', 'g', 'z', 'field', 'chain', 'refused'], stored: 'n', fold: 'n', keys: 'n' } },
  // a signed op's audit (storeObject.ts adminSigned): the reads only when they fail; rw, rr the record's rows written and
  // read by it, ms its time, rej a load's rows refused, via the tool that sent it (scripts/admin.ts: its script and command)
  admin: { src: 'r', f: { op: 't', st: 't', by: ['places'], rw: 'n', rr: 'n', ms: 'n', rej: 'n', via: 't' } },
  "log.cap": { src: 'r', f: { bucket: 't' } },
  // `POST /stt` (relay/src/sttRoute.ts): sizes and times, never the audio or its text
  stt: { src: 'r', f: { ms: 'n', inB: 'n', model: ['turbo'], ok: 'b', err: ['off', 'too_large', 'bad_request', 'capped', 'ai'] } },
  // `POST /img` (relay/src/img.ts): a マイ食品 picture's upload, its size, time and outcome (dup: held already), never its id
  img: { src: 'r', f: { ms: 'n', inB: 'n', ok: 'b', dup: 'b', err: ['unauthorized', 'bad_request', 'too_large', 'bad_type', 'bad_dims', 'exif', 'bad_id', 'cap', 'unavailable'] } },
  // 共有リンク (relay/src/share.ts): a link made or changed (`/api`), a visitor's read (`POST /share`: counted, or why not:
  // gone off / expired, a bot, our own phone, a repeat within 30 min, busy, a malformed body), the 03:00 sweep's ended
  // links deleted (n); never the token, the id, an IP or a hash
  share: { src: 'r', f: { op: ['make', 'set', 'read', 'sweep'], kind: ['trip', 'trips', 'other'], ok: 'b', why: ['off', 'expired', 'bot', 'self', 'repeat', 'busy', 'bad', 'cap', 'counted'], ms: 'n', n: 'n' } },
  // `POST /grade` (relay/src/gradeRoute.ts): the sentence's length (inC), the time, the outcome, the verdict and who
  // gave it (the wasei list or the AI), never the sentence or the answer; hedged: a second identical call started
  // (no answer in 2.5 s), won: which call answered first
  grade: { src: 'r', f: { ms: 'n', inC: 'n', ok: 'b', err: ['off', 'too_large', 'bad_request', 'capped', 'ai'], verdict: ['great', 'ok', 'tip'], src: ['ai', 'wasei'], hedged: 'b', won: 'n' } },
  // `POST /hiking` (relay/src/hikeRoute.ts): a YAMAP link read, its outcome, the raw and kept points and the time; never
  // the link, its id or anything of the answer
  "hike.import": { src: 'r', f: { ms: 'n', ok: 'b', err: ['unauthorized', 'bad_request', 'bad_link', 'not_found', 'too_large', 'capped', 'timeout', 'upstream'], pts: 'n', kept: 'n' } },
  // やること's move from lists to one list (relay/src/store.ts todoMigrate, the admin's todo_migrate): counts only
  "todo.migrate": { src: 'r', f: { dry: 'b', lists: 'n', items: 'n', done: 'n', orphans: 'n', cut: 'n', due: 'n', rem: 'n' } },
  // the shared money (relay/src/finance.ts; docs/finance.md), counts only, never an amount, a description or a
  // category: the nightly check (n live entries, drift: the slots' balance or live count not the log's replay; error
  // when it drifts), the admin's import (rows added, duplicates, refused; dry: counted only), a pairing code minted or
  // redeemed (why: the refusal's)
  "fin.check": { src: 'r', f: { n: 'n', drift: 'b', logN: 'n', ms: 'n' } },
  "fin.import": { src: 'r', f: { dry: 'b', added: 'n', dup: 'n', bad: 'n', ms: 'n' } },
  "fin.pair": { src: 'r', f: { op: ['mint', 'redeem'], ok: 'b', why: ['code', 'busy', 'many'] } },
  // やること's reminders and the phones' subscriptions (relay/src/pusher.ts): a push's outcome, a subscription kept,
  // forgotten or dropped (its push service's 404/410), a reminder missed by more than 10 min; `ep` 6 hex of the
  // endpoint's SHA-256, never the endpoint or the item's text
  "todo.push": { src: 'r', f: { op: ['send', 'retry', 'drop', 'skip', 'subscribe', 'unsubscribe', 'test', 'tick'], code: ['ok', 'gone', 'config', 'bug', 'retry', 'expired', 'late'], who: ['A', 'B', 'G'], ep: 't', rem: ['at', 'b10', 'b60', 'eve', 'am'], lang: ['ja', 'en'], status: 'n', reason: 't', lateS: 'n', tries: 'n', ms: 'n', n: 'n', moved: 'b', replaced: 'n', err: 't' } }
} as const satisfies Record<string, { src: 'c' | 'r'; f: Fields }>;

export type LogEventName = keyof typeof LOG_EVENTS;
export type LogData = Record<string, number | boolean | string>;

/** perf.boot's fields left out at their usual value (since 2026-11-24: 97–100 % of launches had each, ~120 B a
 *  launch): a reader takes a missing one as this. @public (relay/scripts/logs.ts) */
export const BOOT_DEFAULTS = { sw: 'ctl', net: 0, garden: 'first', farm: 'first', fields: 'cache', tx: 0, txFail: 0, txWebp: 0, txOff: false, swRoom: 0, swCold: true } as const;
/** A launch's report as perf.boot sends it: its fields at BOOT_DEFAULTS' value left out. */
export function bootFields(r: object): Record<string, unknown> {
  const d: Record<string, unknown> = BOOT_DEFAULTS;
  return Object.fromEntries(Object.entries(r).filter(([k, v]) => !(Object.hasOwn(d, k) && d[k] === v)));
}

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
