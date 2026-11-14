"""The Run step's wrapper (its-runner.yml): `main.py --remote` restarted in the job when it crashes before the deadline.

    python3 restart.py <deadline> xvfb-run … python main.py --remote --deadline <deadline>

A crash (an uncaught exception, Chrome or the interpreter dying, an OOM kill: any exit but 0 and 2) of a process that
got going (its first report answered: main.REPORTED_FILE, or it ran MIN_RUN_SEC) is restarted with the same command, so
the same deadline (it must carry `--deadline <deadline>`: checked) and the same run id (main.py `run_identity`;
remote.py's claim goes on from the record's seq: no event dropped, no entry id reused). A process restarts in seconds
instead of the watchdog's new run in minutes. Never restarted:

- a startup crash (no answered report, under MIN_RUN_SEC): it would only crash again, a solve each time;
- an exit 0 (an orderly end: time up, a stop, a ban, the lease someone else's) or 2 (a config error a restart can't
  fix), nor after the step is cancelled or times out: SIGTERM/SIGINT reach this process (the step `exec`s it), which
  passes them to the child's whole process group (its own session: xvfb-run, a shell, passes nothing on), so main.py
  drains as for a stop (no new hold or 申込する, run_end, the lease released, ≤ 6 s), waits for the group to end
  (GROUP_WAIT_SEC) and restarts nothing;
- after RESTARTS (each restart is a fresh Turnstile solve, and the site bans on request rate), each after its BACKOFF
  (the first ≥ the site's 15-s floor between requests);
- when the Worker says not to run: `remote.preflight` (paused, MODE off, no dates, no answer, or the Tokyo day's
  restarts spent: `restart_cap`, the Worker's count of `run_start restart` events) before the backoff and every
  PREFLIGHT_EVERY_SEC of it, so a 停止 ends it there, and the Worker hears from the job meanwhile (each preflight
  stamps `lastPreflight`: its watchdog's "on its way");
- when the backoff would end within MIN_LEFT_SEC of the deadline: not worth a solve.

The public log gets codes and counts only (logs.public). Exits with the last process's code (0 when it ended in order).
"""
import os
import signal
import subprocess
import sys
import time

import logs
import remote

BACKOFF_SEC = (15, 30, 60, 120, 300)
SCAN_FLOOR_SEC = 15          # book_hotels.MIN_RETRY_DELAY: a restart's first request no sooner than a scan's next
assert min(BACKOFF_SEC) >= SCAN_FLOOR_SEC
RESTARTS = len(BACKOFF_SEC)
PREFLIGHT_EVERY_SEC = 60
MIN_LEFT_SEC = 5 * 60
MIN_RUN_SEC = 5 * 60         # a process that ran this long got going, answered report or not
NO_RESTART = (0, 2)
GROUP_WAIT_SEC = 8           # after a signal: main.py's stop (≤ 6 s) before GitHub's kill (~10 s)


def _signal_group(child, signum):
    """`signum` to the child's process group (its session's: start_new_session); a child without a pid (the tests'
    fakes) gets it alone. False: nothing left to signal."""
    pid = getattr(child, 'pid', None)
    try:
        if isinstance(pid, int):
            os.killpg(pid, signum)
        else:
            child.send_signal(signum)
        return True
    except (OSError, ValueError):
        return False


def _deadline_of(cmd):
    """The command's `--deadline` value (None: absent)."""
    for i, a in enumerate(cmd[:-1]):
        if a == '--deadline':
            return cmd[i + 1]
    return None


def _reported_file():
    """main.REPORTED_FILE, without importing main (config's STATE_DIR rule)."""
    import config
    return os.path.join(config.STATE_DIR, 'reported')


class Supervisor:
    """One job's restarts. Every outside effect is injected for the tests: `spawn(cmd, env)` → a Popen-like (wait(),
    send_signal()), `preflight()` → (status, reason, run), `reported_file` (main.py touches it after its first
    answered report; removed before each start), `clock`, `sleep`, `public`."""

    def __init__(self, cmd, deadline, spawn=None, preflight=None, clock=time.time, sleep=time.sleep, public=logs.public,
                 env=None, reported_file=None):
        self.cmd, self.deadline = cmd, deadline
        self.spawn = spawn or (lambda c, e: subprocess.Popen(c, env=e, start_new_session=True))
        self.preflight = preflight or self._preflight
        self.clock, self.sleep, self.public = clock, sleep, public
        self.env = dict(os.environ if env is None else env)
        self.reported_file = reported_file or _reported_file()
        self.child = None
        self.stopped = None   # the signal that ended the step

    @staticmethod
    def _preflight():
        e = os.environ
        return remote.preflight(remote.Client(e.get('ITS_WORKER_URL') or remote.DEFAULT_URL, e.get('ITS_RUNNER_TOKEN', '')))

    def on_signal(self, signum, _frame=None):
        """The step cancelled or timed out: passed on to main.py (it drains as for a stop), never restarted. A child
        started while this ran gets it from run() (it checks `stopped` after the start)."""
        self.stopped = signum
        child = self.child
        if child is not None:
            _signal_group(child, signum)

    def _reap(self, child, signum=None):
        """After the child ended: the rest of its group. A signal's stop: waited for (GROUP_WAIT_SEC; main.py is
        draining). A crash: SIGKILLed before any restart (no Chrome or process of the same run id left over)."""
        pid = getattr(child, 'pid', None)
        if not isinstance(pid, int):
            return
        if signum is not None:
            until = time.monotonic() + GROUP_WAIT_SEC
            while time.monotonic() < until and _signal_group(child, 0):
                time.sleep(0.1)
        _signal_group(child, signal.SIGKILL)

    def _go_on(self, n, code):
        """Asks the Worker; False (logged) when it says not to run."""
        status, reason, run = self.preflight()
        if not run:
            self.public('restart', ok=0, n=n, exit=code, why=reason, status=status)
        return run

    def _got_going(self, started):
        return os.path.exists(self.reported_file) or self.clock() - started >= MIN_RUN_SEC

    def _start(self, n):
        try:
            os.remove(self.reported_file)
        except OSError:
            pass
        env = dict(self.env, ITS_RESTART=str(n)) if n else self.env
        child = self.spawn(self.cmd, env)
        self.child = child
        if self.stopped is not None:   # a signal between the check and the start: passed on now (main.py: idempotent)
            self.on_signal(self.stopped)
        return child

    def run(self):
        n, code = 0, 0
        while True:
            if self.stopped is not None:
                self.public('restart', ok=0, n=n, exit=code, why='signal')
                return code
            started = self.clock()
            child = self._start(n)
            code = child.wait()
            self.child = None
            self._reap(child, self.stopped)
            if code in NO_RESTART or self.stopped is not None:
                if n or code not in NO_RESTART:
                    why = 'signal' if self.stopped is not None else 'clean' if code == 0 else 'config'
                    self.public('restart', ok=0, n=n, exit=code, why=why)
                return code
            if not self._got_going(started):
                self.public('restart', ok=0, n=n, exit=code, why='startup')
                return code
            if n >= RESTARTS:
                self.public('restart', ok=0, n=n, exit=code, why='cap')
                return code
            wait = BACKOFF_SEC[n]
            if self.clock() + wait > self.deadline - MIN_LEFT_SEC:
                self.public('restart', ok=0, n=n, exit=code, why='deadline')
                return code
            n += 1
            self.public('restart', n=n, exit=code, secs=wait)
            if not self._go_on(n, code):
                return code
            until = self.clock() + wait
            while self.stopped is None and self.clock() < until:
                self.sleep(min(PREFLIGHT_EVERY_SEC, until - self.clock()))
                if self.stopped is None and not self._go_on(n, code):
                    return code


def main(argv):
    if len(argv) < 2 or not argv[0].isdigit() or _deadline_of(argv[1:]) != argv[0]:
        print('usage: python3 restart.py <deadline> <command … --deadline <deadline> …>', file=sys.stderr)
        return 2
    sup = Supervisor(argv[1:], int(argv[0]))
    for s in (signal.SIGTERM, signal.SIGINT):
        signal.signal(s, sup.on_signal)
    return sup.run()


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
