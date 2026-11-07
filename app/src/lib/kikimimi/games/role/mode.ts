// ふたりで ロールプレイ's mode (docs/kikimimi-mic.md §2.6; round/registry.ts's line brings it, catalog.ts addMode): on no
// shelf, only in the みんなで picker (it needs two), with the mic on in せってい on this phone (the invitee's phone asks
// at さんか: joining is consenting). Eager (the sheet's chunk) and tiny: the game itself is its lane's chunk.
import { DEVICE, localKV, readJson } from '../../../sync/storage.ts';
import type { ModeMeta } from '../../catalog.ts';

const micOn = (): boolean => readJson<{ on?: unknown }>(localKV(), DEVICE.mic)?.on === true;

export const ROLE_MODE: ModeMeta = { id: 'role', group: 'together', icon: '🎭', mins: 3, qs: 0, coop: true, game: 'role', requires: 'mic', gate: micOn };
