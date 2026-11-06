// The units' wave 1 and the もり re-tag dry run (docs/curriculum-units.md §11, §12; scripts/kikimimi-units-dry-run.ts):
// wave 1's can-dos, read from the plan's §12, follow the template; the dry run (on the items' own tags, without the
// audit: the same run anywhere) gives each level-4 item one place, a unit's or level-only, and writes no manifest.
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { run, wave1 } from '../../../scripts/kikimimi-units-dry-run.ts';
import { BANK } from './source.ts';
import { DOMAINS, STAGES, candoProblems, candoText } from './units.ts';

describe('wave 1 (plan §9, §10, §12)', () => {
  const units = wave1();
  it('7 units, 4 at かわ and 3 at もり, as the plan names them', () => {
    expect(units.map((u) => [u.name, u.stage])).toEqual([
      ['ききかえす', 'kawa'], ['よていを かえる', 'kawa'], ['おいわいする', 'kawa'], ['でんわを おえる', 'kawa'],
      ['ともだちを あんない', 'mori'], ['ホテルで こまった', 'mori'], ['しごとの ざつだん', 'mori']
    ]);
  });
  it('each can-do follows the template; ids, names, stages and domains as the schema has them', () => {
    for (const u of units) {
      expect(candoProblems(u.cando), u.unit).toEqual([]);
      expect(candoText(u.cando)).toMatch(/が .+のを .+ きいて、.+が わかる$/);
      expect(u.unit).toMatch(/^[a-z]{2}-[a-z0-9-]{1,9}$/);
      expect([...u.name].length).toBeLessThanOrEqual(12);
      expect(u.stage in STAGES).toBe(true);
      expect(u.domain === 'glue' || (DOMAINS as readonly string[]).includes(u.domain)).toBe(true);
    }
    expect(new Set(units.map((u) => u.unit)).size).toBe(7);
  });
  it('a plan without §12’s block is an error, not an empty wave', () => {
    expect(() => wave1('# plan\n## 12. nothing\n')).toThrow(/no YAML block/);
  });
});

describe('the もり re-tag dry run', () => {
  const out = mkdtempSync(join(tmpdir(), 'units-draft-'));
  const report = run(out, join(out, 'no-audit'));
  it('14 units, each level-4 item in one place: a unit’s, or level-only', () => {
    expect(report).toContain("the items' own tags");
    expect(report.match(/^\| [a-z]{2}-[a-z0-9-]+ \| /gm)!.length).toBe(14 * 2); // the summary and the checker's table
    for (const it of BANK.filter((x) => x.lv === 4)) expect(report.split(`\`${it.id}\``).length - 1, it.id).toBe(1);
  });
  it('drafts the manifests only where asked (never app/content/units), wave 1’s with their can-dos', () => {
    expect(readdirSync(out).filter((f) => f.endsWith('.yaml'))).toHaveLength(14);
    expect(existsSync(new URL('../../../content/units/tr-hotel.yaml', import.meta.url))).toBe(false);
    rmSync(out, { recursive: true });
  });
});
