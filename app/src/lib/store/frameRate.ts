// The 3D engines' full frame rate (docs/design.md "Frame rate"): the island, the rooms and the museum draw at most 30
// a second (half the GPU and CPU work of 60), paced by world3d/pace.ts. The ambience stays at ≤ 30 and a still scene
// draws nothing.

export const FPS = 30;
