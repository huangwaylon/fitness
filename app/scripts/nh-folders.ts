// The NH export's model folders by their exact names (`<Model>.Nin_NX_NVN`): the converters look a folder up here, not
// with existsSync, which on macOS's case-insensitive disk also finds `FtrPressbench` for the export's `FtrPressBench`
// and then fails on a case-sensitive one (Linux, a case-sensitive APFS volume). A name that only matches another's
// case is collected and `assertExact` fails the run with them, so a spelling slip shows on every disk. Only the
// folder list is read; nothing in the export is run.
import { readdirSync } from 'node:fs';

const SUFFIX = '.Nin_NX_NVN';

interface NhFolders {
  /** Whether the export has this folder, spelled exactly so. */
  has(folder: string): boolean;
  /** The same, never collected (a guess among spellings: one of them is the export's). */
  peek(folder: string): boolean;
  /** Names asked for that exist only in another case: [asked, the export's]. */
  caseOnly: [string, string][];
  /** Throws if any name asked for so far matched only in another case. */
  assertExact(what: string): void;
}

export function nhFolders(root: string): NhFolders {
  const names = new Set(readdirSync(root).filter((n) => n.endsWith(SUFFIX)).map((n) => n.slice(0, -SUFFIX.length)));
  const lower = new Map([...names].map((n) => [n.toLowerCase(), n]));
  const caseOnly = new Map<string, string>();
  return {
    has(folder) {
      if (names.has(folder)) return true;
      const other = lower.get(folder.toLowerCase());
      if (other) caseOnly.set(folder, other);
      return false;
    },
    peek: (folder) => names.has(folder),
    get caseOnly() {
      return [...caseOnly];
    },
    assertExact(what) {
      if (!caseOnly.size) return;
      throw new Error(`${what}: these names match the export's folders only in another case (a case-sensitive disk has none of them; spell them as the export does):\n  ${[...caseOnly].map(([a, b]) => `${a} → ${b}`).join('\n  ')}`);
    }
  };
}
