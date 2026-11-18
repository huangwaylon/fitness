// The rooms' and すがた's strings (`tent.*`: the tent, the shop and the museum's chrome, もようがえ, the editor's
// refusals; `look.*`: the dresser): a catalog of their own, merged in with the first of their chunks, out of the
// island's first load. The rooms' NH names are tent.ts's. usage.test, linebreaks.test and fonts.test read them with
// the main catalogs.
import ja from './rooms.ja.json';
import { addStrings } from './index.ts';

addStrings(ja, () => import('./rooms.en.json'));
