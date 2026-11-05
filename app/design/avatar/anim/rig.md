# Rig mapping: the villager pose system on an NH player

Code: `anim/player-rig.js` (my adapter; the app's `rig.ts` maths plus player-specific additions), `anim/page.js` (a
re-implementation of villager3d `step()`, `grip()`, `aim()`, `wear()` and the sting lump for the GIF harness),
`anim/gifs.ts` (the driver). The player is assembled by the tech artist's `render/player.js` (`loadPlayer`), served
through `render/harness.ts`. Nothing under `src/` was changed.

## Skeleton

`PlayerBody.dae` joints (`python3 -I anim/joints.py …/PlayerBody.dae`):

```
Root ─ Item, Trans_Root ─ Skl_Root (y 4.84) ─ Spine_1 ─ Spine_2 ─ Spine_3 ─ Neck ─ Head ─ Feel
                                            │                    ├ Clavicle_L/R ─ Arm_1 ─ Arm_1_Sub ─ Arm_2 ─ Wrist ─ Hand
                                            │                    │                                          └ Wrist_Sub
                                            ├ Bag ─ z_Bag        
                                            └ Waist ─ Leg_1_L/R ─ Leg_1_Sub ─ Leg_2 ─ Leg_2_Sub ─ Ankle ─ Toe
Mdl_Root ─ EarL, EarR, Nose00-02 (unweighted helpers)
```

Parts add their own joints under these: a long skirt's `Skirt_{1,2,3}_{L,R}{F,C,B}` (six chains under Waist), a top's
hem `Skirt_1_*`, a one-piece's `Skirt_1-3_*` plus `Z_Skirt_*`, a ponytail's `Hair_1 → Hair_2 → Z_Hair`.

### The remap (poses.ts JOINTS → player bones)

| Villager joint | Player bone | Notes |
|---|---|---|
| Spine_1-3, Neck, Head | same | |
| Clavicle_L/R, Arm_1_L/R, Arm_2_L/R | same | The rest pose is NH's T, as the villagers' is: `ARMS` (1.22) lowers the arms correctly unchanged |
| **Hand_L/R** | **Wrist_L/R** | The player's hand mesh is skinned to `Wrist_*`; `Hand_*` carries no weights (it's NH's item socket at the fingertips). Driving Hand_* did nothing visible. Tools still attach to `Hand_R`, Wrist's child, so they follow |
| Leg_1/2_L/R, Ankle_L/R | same | The body skin stops at the knee. Below it the legs are the `mSocks` mesh (Leg_2, Ankle, Toe) or the bottoms and shoes |
| TailRoot, Tail_1, Side_Ear_1_L/R, Mouth, Mouth_U, Crest_L/R | none | Skipped, as rig.ts does for a species without them. The ears are rigid head geometry |

Joints the player has that the pose system never drives:
- The `_Sub` twist helpers (Arm_1_Sub, Wrist_Sub, Leg_1_Sub, Leg_2_Sub). They're children here, so they follow their
  parent rigidly. In NH they presumably split the twist, so elbows and knees deform as plain LBS: fine at these angles.
- `Toe`, `Waist` (the legs' parent), `Feel` (head top), `Item`, `Bag`/`z_Bag`, `Trans_Root`.
- The cloth and hair joints, which NH moves with physics. **These are the real gap.** My adapter adds drivers for them
  (below).

There are **no finger joints**: NH player hands are mitts. Nothing is lost there.

### Measures (`Body`, model units; the player is 15.8-16.1 tall with hair, villagers ~14.9)

| | Player | Villager formula's assumption | Consequence |
|---|---|---|---|
| thigh (Leg_1 → Leg_2) | 2.59 | read from bones | OK |
| shin (Leg_2 → Ankle) | 1.60 | read from bones | OK |
| hip (Leg_1 y) | 4.98 | read from bones | OK |
| ankle height (sole → ankle) | **0.79** | `sitOn` reach = shin + **0.25** | On a low seat the feet sank ~0.5 into the floor. Tuned: the adapter hands `sitOn` shin + ankle − 0.25 (the real length is kept as `shinLen`) |
| back depth (whole model) | 5.2 (A) / 4.5 (B): **the head** | lying lifts by `backDepth × 0.85` | The body floated ~3 u over the bed, resting on the back of its head. Tuned: lift by the torso's depth (1.85 / 2.6) and tuck the chin (Head +0.45, Neck +0.2) so the head rests on the pillow |
| front depth | 3.1 (the face) vs chest 1.75 | prone lifts by `frontDepth × 0.85` | Face-down, the head propped the body up at a slant. Tuned: the head turned onto its cheek (Head y +1.15, chin up −0.45/−0.25) and the lowest point snapped to the ground |
| shoulder → eye | ~4.8 | the sting's hand-to-eye | The arm is 4.1 long: **a player can't touch its own eye.** See sting below |

## Tuning (all in `player-rig.js` and `playerAction()`; each can be switched off with a `tune` flag)

1. **Hands → Wrist** (`ALIAS`).
2. **Skirt and hem driver.** Each skirt chain follows its side's thigh: front 0.95, side 0.55, back 0.12 of its pitch,
   0.6 of its spread. The chain's third joint pitches back by as much, so the cloth hangs past the knee. A top's hem
   (Skirt_1 only) gets 0.55. Without this, B's legs went straight through the long skirt when sitting.
3. **Ponytail** (Hair_1): hangs 0.6 of the way toward gravity as the head and spine pitch, and flops aside when
   lying on the back (else it goes into the pillow).
4. **Low-seat reach** (above) and **knee hands**: with the thighs raised past level, the arms come forward 0.85 × the
   raise, so the hands ride on the knees instead of the knees coming up through the forearms.
5. **Lying** and **prone** (above).
6. **Head clearance**: if a hand's centre is inside the head's ellipsoid (from the head skin, in the Head bone's
   frame; margin 0.9), the upper arm swings out about the forward axis until it clears (up to 0.9 rad), then the
   elbow unbends. This fixed the wave's fist sitting in the cheek and blends that passed through the face.
7. **sting** (`playerAction`): a numeric reach (coordinate descent on Arm_1/Arm_2, cached) brings the left hand to the
   jaw under the left eye, with the wobble kept. **villager3d puts the sting lump over the character's *right* eye
   while the pose raises the *left* hand.** For the player the lump goes on the hand's side (`villagerLump: true`
   shows villager3d's placement). Check this on a villager too.
8. **cast** (`playerAction`): the wind-up swings the arm out to the side (+0.25 y, −0.55 z), so the rod hand passes
   beside the head, not in front of the face.
9. **Net carry** (proposed; villager3d has no net hold): the right hand at the chest, the elbow bent, the pole up over
   the right shoulder. `grip()` turns the tool for that pose (`gripWant [-0.62, 1, -0.5]`). villager3d's own `grip()`
   turns any tool for the *fishing* pose, so a net held in idle points down at the ground like a cane
   (`held-net-villager-grip.gif`).

To port this to the app: `rig.ts` would take an alias map and an optional post-apply hook (skirt, hair, clearance);
`villager3d.ts` would need per-kind numbers for the lying and prone lifts (torso depth, not the whole-model box) and
the seat reach; `poses.ts` sting and cast would take per-kind overrides.

## Face

The player's frames are the same expressions for every `PlayerEyeNN` and `PlayerMouthNN`. I read them off B (Eye22)
and A (Eye02); see `/tmp/avatar-anim/raw-faces-*.png` to regenerate them (`gifs.ts --raw`).

| Player eye frame | | Player mouth frame | |
|---|---|---|---|
| 0 | open | 0 | closed smile |
| 1 | half shut (drowsy) | 1 | open smile |
| 2 | shut, soft (asleep, blink) | 2 | big open grin |
| 3 | cross (brows in) | 3 | frown |
| 4 | worried | 4 | open wavy frown (upset) |
| 5 | happy shut ^ ^ | 5 | open "ah" |
| 6 | shocked, white "0 0" | 6 | small flat line |
| 7 | squeezed shut > < | 7 | small "o" |
| 8 | open, pupils small | 8 | open "o" |
| 9 | flat, half-lidded | | |
| 10 | open, pupils big | | |
| 11 | half-lidded side glance | | |
| 12 | wide, pupils small | | |
| 13 | squint | | |
| 14 | open, glossy | | |
| 15 | half-lidded, tired | | |

Map (`PLAYER_EYE`, `PLAYER_MOUTH` in player-rig.js):

| Face | Villager (eye, mouth) | Player (eye, mouth) |
|---|---|---|
| neutral | 0, 0 | 0, **the outfit's own `mouthFrame`** (A .0, B .1: B's look is an open smile) |
| happy | 9, 8 | 5, 2 |
| joy (dead) | 11, 7 | 7, 1 |
| surprised | 10, 2 | 6, 8 |
| sad | 8, 6 | 4, 4 |
| sleepy | 14, 0 / snore 1 | 2, 0 (a closed smile even for B) / snore 7 |
| cross (dead) | 15, 3 | 3, 3 |
| sting | 3, 3 | 13, 3 |
| blink (BLINK.eye 14) | 14 | **2** |

Blinking works unchanged: `eyeAt`'s schedule, with cell 14 mapped to player frame 2. Unused player frames worth
adopting: 1 (drowsy, between doze nods), 9, 11, 13, 15 (half-lidded looks), 12. The `PlayerEyeBiteNN` set is the same
16 frames (not needed). A proposed talk cycle is mouth 0 → 1 → 5 → 1 → 0 → 8 … every 120 ms (`face-talk.gif`).

## Clothing deformation (checked on frames, side and front)

- **A, sweater + slacks:** clean in every state. The hem follows the thighs when seated. No visible clipping on the
  sleeves at idle or walk.
- **B, polo + long skirt:** with the driver, walking flares the skirt with the stride and the legs stay inside it.
  Seated (bench, chair, low seat) it drapes over the thighs and falls to the floor; the shoes are hidden on low seats
  (the hem reaches the floor). Without the driver, the thighs pierce the skirt. Lying, the skirt stays tubular, as if
  it were standing (no gravity on the cloth). Acceptable from above, wrong from the side.
- **Glasses (A):** they're rigid on the head and follow it. They sit ~0.5 in front of the face (the tech artist's fit),
  so from 3/4 the far lens leaves the face's outline. Lying face down, the lower lens goes into the ground. The sting
  lump sits inside the left lens.
- **Hair:** the bowl (A) is rigid and fine. B's ponytail is driven (above) and doesn't go through the back when
  standing or sitting.

## Issues in the tech artist's files (not edited; written up here)

- `render/player.js` `setFace()` reads the module-wide `FILES` of the *last* `loadPlayer` call. With A and B loaded,
  A's eye frames 1-15 come out magenta (missing texture). I work around it by passing both outfits' files to each
  load. The fix is for `assemble` to close over its own `files`.
- The glasses offset (above) may want a smaller `glassesZ`.
