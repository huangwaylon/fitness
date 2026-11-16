// ききみみ's always-loaded part (docs/kikimimi.md "UI details"): whether the game's sheet is mounted and open. Solo only:
// nothing is sent or heard on the island's Live (old builds' `quiz` / `play` invites go unanswered). Nothing of the game
// itself (the bank, the deck, the session) is imported here: they come with the sheet's chunk.
import { voiceSession } from '#lib/sound/sound.svelte.ts';

/** The sheet: mounted from its first opening, and open. */
export const quiz = $state<{ mounted: boolean; open: boolean }>({ mounted: false, open: false });

/** The menu pill's tap: the voice session must begin inside the tap itself (iOS). */
export const wakeQuizVoice = (): void => void voiceSession(true);

/** Open the sheet (**inside a tap**, or after wakeQuizVoice in one: the voice session starts here, so the clips can
 *  play with the silent switch on). */
export function openQuiz(): void {
  voiceSession(true);
  quiz.mounted = true;
  quiz.open = true;
}
