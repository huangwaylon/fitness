// ふたりで ロールプレイ's strings (`kiki.role.*` but the mode's name, docs/kikimimi-mic.md "ふたりで ロールプレイ"): a catalog of their own,
// merged in when the game's pages load (components/kikimimi/role/board.ts) or the mic's consent at さんか
// (role/MicJoin.svelte). usage.test, linebreaks.test and fonts.test read them.
import ja from './kiki-role.ja.json';
import en from './kiki-role.en.json';
import { addCatalog } from './index.ts';

addCatalog({ ja, en });
