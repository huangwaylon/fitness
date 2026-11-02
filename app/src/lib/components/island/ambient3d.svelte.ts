// The season's falling leaves, petals or snow on the 3D island (world3d/effects.ts `fall`): Particles says what and how
// many (its own rules), the 3D island keeps that many falling in world space round the camera.
export const ambient3 = $state<{ kind: string | null; count: number }>({ kind: null, count: 0 });
