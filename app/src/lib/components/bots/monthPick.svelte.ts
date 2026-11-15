// ボット's calendars' month (docs/bots.md; MonthSwitch binds it): the one picked while it is still among
// `months` (contract/tokyo.ts twoMonths), else the first: a picked 11月 becomes 12月 at midnight on 12/1.
export function monthPick(months: () => readonly string[]) {
  let picked = $state<string | null>(null);
  return {
    get months() {
      return months();
    },
    get value(): string {
      const m = months();
      return picked && m.includes(picked) ? picked : m[0];
    },
    set value(v: string) {
      picked = v;
    }
  };
}
