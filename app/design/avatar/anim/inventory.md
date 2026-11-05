# Animation inventory: what the app plays

NH's files ship no animation clips. The app animates characters procedurally in `src/lib/components/villager3d/`:
`poses.ts` (states and actions), `rig.ts` (applies a pose to the bones), `faces.ts` (expressions and blinking) and
`villager3d.ts` (runtime: crossfades, seats, held tools, worn hats). Five places drive it:

- `world3d/villagers.ts`: the island. It maps director motions and emotes onto actions and faces (`ACT`, `faceOf`).
- `world3d/Island3D.svelte`: builds the per-frame specs (`VSpec`).
- `tent/engine.ts`, `museum/engine.ts`: the rooms.
- `museum/curator.ts`: Blathers. He is posed with `hold()` and uses no states or actions.

Paths below are relative to `src/lib/components/`. "Dead" means it's defined in villager3d but nothing in the app
triggers it.

## Base states (looping; FADE_MS 150 crossfade, PRONE_MS 600, SIT_MS 420 onto or off a seat)

| State | Where | When |
|---|---|---|
| idle | villagers.ts:327, tent/engine.ts:1465, museum/engine.ts:852 | Standing still |
| walk | same three | Tap-walk, wander, a visitor's stroll, walking in a room. The stride follows the distance moved (`strideOf`) |
| sit | villagers.ts:327 (a seat anchor that isn't lying); tent :1465 (`w.pose`); museum :852 | Island benches and stools, seats on the layout, tent furniture, museum benches. Asleep on a bench it stays `sit` with the sleepy face |
| lie | villagers.ts:327 (lying anchor, awake); tent :1465 (`pose.lie`); museum :852 | The hammock on the island, a bed in the tent |
| nap | villagers.ts:327 | Asleep on the hammock, or asleep on a seat that has no 3D anchor. Island only |
| doze | villagers.ts:327 | Asleep standing at night (islandLife.svelte.ts:90), and after the stretch if it was asleep. Island only |
| fish | villagers.ts:327 (rod in hand, standing) | My line is out (Island3D.svelte:295), or a partner's line arrives over the relay (`anglerOf`) |
| prone | villagers.ts:327 (`s.prone`) | Gulliver washed up on the beach. **Visitor only: never a player** |

## Actions (play once over the state)

| Action | ms | Where | When |
|---|---|---|---|
| hop | 720 | ACT: hop, hop2, twirl, dance, samba, laugh, flap, squish; tent :1061; museum :1320 | The most common one: tapping a villager, a speech balloon, a catch (`squish`), firework cheers, the pair dance, both high-fives, visitor arrivals |
| wave | 1700 | ACT: nod, bow, proud, wiggle, point | Chat nods, the wedding bow, ripe fruit (`proud`), idle wiggle, Celeste pointing at a star |
| highfive | 1000 | **Dead** | Both high-fives send motion `hop` (IslandScene.svelte:276-285, avatar.ts:515-520) |
| surprise | 650 | ACT: surprise | Woken by a tap, startled by partner data, Jack's trick, Gulliver woken |
| sting | 1400 | villagers.ts:335 (`stung` plus a `surprise`) | Wasps from a shaken tree. Any surprise while still swollen also plays it |
| cast, tug, reel | 620, 420, 700 | villagers.ts:283-287 (fishing3d `anglerOf` phases) | Critters.svelte:179 (cast, bite) and :783 (reel); a partner's line over the relay |
| warmup, sidebend, jump | 1950 each | ACT: warmup, sidebend, leap | The tape deck's group stretch (TapeDeck.svelte:65 → stretch.svelte.ts:35) |
| twitch | 460 | ACT: twitch | Sleeping Gulliver's signature and nudges. **Visitor only** |

Director motions with no 3D action (ignored by the 3D model): `turn` (wander, idle look-around, visitor strolls),
`stretch` (morning stretch, idle), `shy`, `hum`, `lookup`, `nuzzle`, `headshake` (host only), `shake` (never emitted).

## Faces (`faces.ts` FACES; blinks every 2.4-5.4 s for 110 ms, except closed faces)

| Face | Villager cells (eye, mouth) | Where | When |
|---|---|---|---|
| neutral | 0, 0 | fallback | Default |
| happy | 9, 8 | `faceOf`: heart, sparkle, glee, love, joy, note; villager3d fallback during hop, highfive, wave; curator | Most reactions, two on one bench (`mark-heart`) |
| joy | 11, 7 | **Dead** | |
| surprised | 10, 2 | `faceOf`: bang, surprise; fallback during surprise; curator | Startles, waking |
| sad | 8, 6 | `faceOf`: sweat, sad, worry | Sweat after a sting, sync problems |
| sleepy | 14, 0 (snore: mouth 1) | `faceOf`: zzz; asleep on a seat; fallback in nap, doze, prone; curator | Sleeping |
| cross | 15, 3 | **Dead** (no emote matches cross or anger) | |
| sting | 3, 3, plus a pink lump over one eye | `faceOf` while `stung` | The swollen eye for SWOLLEN_MS |

Emotes that set no face (the fallback applies): dozing, shocked, inspiration, thought, curiosity, pose-viva,
mark-question.

## Held and worn

| Item | Where | Status |
|---|---|---|
| tools/rod | `grip()` from villagers.ts:249/256 while fishing | **The only tool ever held.** `aim()` points it at the float every frame while angling, including during the cast |
| tools/net | effects.ts:95 (`fx3d('swing', {v:'net'})`, Critters.svelte:1185/:1290) | **Never held.** The bug catch is a floating swing effect at the bug, and the villager just hops |
| finds/shovel | effects.ts:335 | An effect, not held |
| birthday hat (pink, blue) | `wear()`: IslandScene.svelte:359 `hatOf` | Birthdays. Island only |
| party glasses | assets.json only | **Dead in 3D** |
| pull-up `lift` | Island3D.svelte:294 `pullLift` | **No pose.** The whole body rises 9 u twice per 4.2 s in `idle` |

## Not there at all

- **Talking:** a speech balloon only triggers a hop. There's no talk face or mouth cycle (`face-talk.gif` shows a
  proposed one).
- **A player character:** "my villager is me" (`island/avatar.ts`). First person (tent and museum) is a camera at my
  villager's eyes with my body hidden. There's no first-person body.
- **Bug catching, digging, shaking, watering, exercise poses:** all effects or hops. Only fishing has poses.
