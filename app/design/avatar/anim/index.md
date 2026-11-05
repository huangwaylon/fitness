# Animation GIF references: A (left) and B (right)

Each GIF puts A and B side by side, using the app's own villager3d `poses.ts` and `faces.ts` through
`player-rig.js`. They're 560 px wide, 20-25 fps and loop. `contact-sheet.png` shows a mid-frame of each.
`check/` holds the short list picked for review.

To regenerate (from `app/`): `NH_MODELS=~/Downloads/Model node design/avatar/anim/gifs.ts [names…]`. Also:
`--still '<spec>' t1,t2` gives debugging stills and `--raw` gives every eye and mouth frame. The mapping and the
tuning are in `rig.md`; what the app triggers, and where, is in `inventory.md`.

"Tuned" means it needed player-specific tuning (rig.md "Tuning"). In the app column, **dead** means the app never
plays it, and **visitor** means only Gulliver does, never a player.

## Base states

| GIF | App | Status |
|---|---|---|
| `state-idle.gif` | idle | OK: breathing, looking about, a blink each |
| `state-walk.gif` | walk 90 u/s | OK. The feet don't slide against the stripes. B's skirt flares with the stride, the legs stay inside |
| `state-run.gif` | walk 300 u/s | OK |
| `state-sit-bench.gif` | sit, high seat | OK (tuned: skirt driver). Feet dangle and kick |
| `state-sit-chair.gif` | sit, seat with a back | OK (tuned: skirt driver) |
| `state-sit-cushion.gif` | sit, low seat (knees up) | OK after tuning: the villager seat reach sank the feet ~0.5 into the floor, and the knees came through the forearms. Issue: B's skirt hides the shoes (the hem is on the floor) |
| `state-lie.gif` | lie (bed, hammock) | OK after tuning: lifting by the whole model's depth floated the body ~3 u over the bed, resting on its head. Issue: B's long skirt stays tubular lying down (no cloth gravity). A's chin tuck presses the collar |
| `state-nap.gif` | nap | Same as lie; the snore mouth shows |
| `state-doze.gif` | doze | OK. Issue: A's glasses stand off the face, so at the deep nod the far lens leaves the face outline |
| `state-prone.gif` | prone (visitor) | OK after tuning (head on its cheek, lowest point on the ground). Issue: A's lower lens dips into the sand |
| `state-fish.gif` | fish | OK: the rod is aimed at the float, with the line |

## Actions

| GIF | App | Status |
|---|---|---|
| `action-hop.gif` | hop (most reactions) | OK, happy face |
| `action-wave.gif` | wave | OK after tuning: head clearance (the player's longer arm put the fist in the cheek) |
| `action-highfive.gif` | highfive (**dead**) | OK |
| `action-surprise.gif` | surprise | OK, shocked eyes and an "o" mouth |
| `action-sting.gif` | sting | Tuned: the villager hand-to-eye can't reach on a player (shoulder to eye 4.8, arm 4.1). The hand now goes to the jaw under the swollen eye, and the lump moved to the hand's side. **Issues:** villager3d puts the lump on the eye opposite the raised hand. The lump overlaps A's lens. The arm swings straight forward for ~150 ms as it comes up |
| `action-cast.gif` | cast | Tuned: the wind-up hand went in front of the face. **App behaviour:** `aim()` keeps the rod on the float during the whole cast, so the arm swings and the rod doesn't (a villager quirk too) |
| `action-tug.gif` | tug (the bite) | OK |
| `action-reel.gif` | reel | OK (the rod stays aimed, as above) |
| `action-warmup.gif` | warmup (stretch 1) | OK |
| `action-sidebend.gif` | sidebend (stretch 2) | OK |
| `action-jump.gif` | jump (stretch 3) | OK |
| `action-twitch.gif` | twitch (visitor) | OK after the prone tuning. Subtle: a kick of the feet and one arm |
| `transition-idle-walk-idle.gif` | the 150 ms crossfade | OK |

## Held and worn

| GIF | App | Status |
|---|---|---|
| `held-rod-cast-wait.gif` | rod: cast, wait, bite, reel | OK (rod aimed throughout, see cast) |
| `held-net-idle.gif` | net (**never held in the app**) | Proposed hold, OK: full-size net, pole in the right hand, head up over the right shoulder. Not in villager3d; it needs a carry arm pose and a per-tool grip |
| `held-net-walk.gif` | net, walking | Proposed hold, OK. The walk's right-arm swing is replaced by the carry |
| `held-net-villager-grip.gif` | net as villager3d `grip()` would hold it | **Issue (reference only):** grip turns any tool for the fishing pose, so in idle the net points at the ground like a cane |
| `worn-birthday-hat.gif` | birthday hat | OK: it rides the head bone through a hop |
| `pullup-lift.gif` | pull-up rep | **Gap:** the app only raises the whole body. There's no pull-up pose or bar grip |

## Faces

| GIF | Status |
|---|---|
| `face-sheet.gif` | Every FACES entry (joy and cross are dead) and a blink, each labelled with villager cells → player frames. OK. B's resting mouth is her own `.1` |
| `face-blink.gif` | OK: one blink each (villager cell 14 → player eye frame 2) |
| `face-talk.gif` | **Proposed:** the app has no talk face. This is a 120 ms mouth cycle on the player frames |

## Not covered

- No GIF for an expression change during a walk, a hammock sway, or getting onto or off a seat (SIT_MS). The seat
  transition is villager3d's group move, not a pose.
- Rendered with standard materials and soft shadows, not the app's Lambert self-lit look. Judge motion and clipping
  here, not shading.
