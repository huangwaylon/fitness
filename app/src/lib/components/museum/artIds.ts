// NH's 43 genuine artworks (docs/design.md "The museum"): their ids (NH's English names), models and how each is
// shown. Dependency-free: the museum's gallery (art.ts), the balloon's present (island/catalog.ts: now and then one).

type ArtKind = 'painting' | 'statue' | 'bust' | 'screen';
export interface Artwork { id: string; model: string; kind: ArtKind }

/** NH's genuine artworks, in the game's (alphabetical) order: id (NH's English name), model folder, how it's shown
 *  (`bust`: a tabletop piece, on a tall plinth; `screen`: a half of the wild painting, standing on the floor). */
export const ART: readonly Artwork[] = (
  [
    ['academic-painting', 'FtrArtVitruvianMan', 'painting'], ['amazing-painting', 'FtrArtNightWatch', 'painting'],
    ['ancient-statue', 'FtrSculptureDoguu', 'bust'], ['basic-painting', 'FtrArtBlueBoy', 'painting'],
    ['beautiful-statue', 'FtrSculptureMilo', 'statue'], ['calm-painting', 'FtrArtSundayOn', 'painting'],
    ['common-painting', 'FtrArtGleaners', 'painting'], ['detailed-painting', 'FtrArtAjisaisoukeizu', 'painting'],
    ['dynamic-painting', 'FtrArtKanagawaOki', 'painting'], ['familiar-statue', 'FtrSculptureThinker', 'statue'],
    ['famous-painting', 'FtrArtMonaLisa', 'painting'], ['flowery-painting', 'FtrArtSunflower', 'painting'],
    ['gallant-statue', 'FtrSculptureDavid', 'statue'], ['glowing-painting', 'FtrArtFightingTemeraire', 'painting'],
    ['graceful-painting', 'FtrArtMikaeri', 'painting'], ['great-statue', 'FtrSculptureKamehameha', 'statue'],
    ['informative-statue', 'FtrSculptureRosettaStone', 'statue'], ['jolly-painting', 'FtrArtSummer', 'painting'],
    ['moody-painting', 'FtrArtSlower', 'painting'], ['motherly-statue', 'FtrSculptureCapitolini', 'statue'],
    ['moving-painting', 'FtrArtBirthVenus', 'painting'], ['mysterious-painting', 'FtrArtIsleOfDead', 'painting'],
    ['mystic-statue', 'FtrSculptureNefertiti', 'bust'], ['nice-painting', 'FtrArtFifePlayer', 'painting'],
    ['perfect-painting', 'FtrArtAppleOrange', 'painting'], ['proper-painting', 'FtrArtBarFB', 'painting'],
    ['quaint-painting', 'FtrArtMilkmaid', 'painting'], ['robust-statue', 'FtrSculptureDiskobolos', 'statue'],
    ['rock-head-statue', 'FtrSculptureOlmecaHead', 'statue'], ['scary-painting', 'FtrArtOotaniOniji', 'painting'],
    ['scenic-painting', 'FtrArtHunterSnow', 'painting'], ['serene-painting', 'FtrArtPortraitCecilia', 'painting'],
    ['sinking-painting', 'FtrArtOphelia', 'painting'], ['solemn-painting', 'FtrArtLasMeninas', 'painting'],
    ['tremendous-statue', 'FtrSculptureHoumuwuDing', 'statue'], ['twinkling-painting', 'FtrArtStarryNight', 'painting'],
    ['valiant-statue', 'FtrSculptureSamothrace', 'statue'], ['warm-painting', 'FtrArtClothedMaja', 'painting'],
    ['warrior-statue', 'FtrSculptureHeibayo', 'statue'], ['wild-painting-left-half', 'FtrArtRaijin', 'screen'],
    ['wild-painting-right-half', 'FtrArtFuujin', 'screen'], ['wistful-painting', 'FtrArtPearlEarring', 'painting'],
    ['worthy-painting', 'FtrArtLibertyLeading', 'painting']
  ] as const
).map(([id, model, kind]) => ({ id, model, kind }));
export const ART_IDS: readonly string[] = ART.map((a) => a.id);
const BY_ID = new Map(ART.map((a) => [a.id, a]));
export const artwork = (id: string): Artwork | undefined => BY_ID.get(id);
export const isArt = (id: string): boolean => BY_ID.has(id);
