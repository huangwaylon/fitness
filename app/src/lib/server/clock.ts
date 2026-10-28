// Injectable clock so jobs and API rules are testable.
let fixed: Date | null = null;

export function now(): Date {
  return fixed ? new Date(fixed) : new Date();
}

/** Tests only: freeze time (pass null to unfreeze). */
export function setNow(d: Date | string | null): void {
  fixed = d === null ? null : new Date(d);
}
