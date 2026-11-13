"""The runner's two log sinks: a private file that gets everything, and a public line format that can't carry much.

The Actions log of this public repo is world-readable, so on Actions (`main.py --remote`) `setup()` points fd 1 and 2
at the private log file: every `print`, traceback, curl and pydoll warning and Chrome's own output (chrome.spawn: the
browser inherits fd 1/2 instead of pydoll's unread pipes) lands there, the
verbose log the bot always wrote (dates, hotels, steps, statuses, URLs). The workflow age-encrypts the state dir that
holds it and uploads only the `.age`.

The only way to the real stdout is `public(event, **fields)`, which writes to a dup of the original fd 1 and admits a
field only if its name is in FIELDS and its value has that field's type: counts, seconds, HTTP statuses, and
phase/step/class codes (lower-case identifiers, so no date, hotel name, URL, token, number or name fits). A field that
fails is dropped and counted (`dropped=n`); its name, never its value, goes to the private log. Event names are codes
too. Tracebacks go private, their class name public (`error step=uncaught cls=KeyError`).

`mask()` sends GitHub's `::add-mask::` for each secret of 4+ characters, so a value that reached the public stream by
some path this module doesn't know would print as `***`.
"""
import math
import os
import re
import sys
import threading
import traceback

_pub = None              # the public stream (a dup of the original stdout) once setup() ran
_private = False         # fd 1/2 are the private log (setup() ran)
_lock = threading.Lock()

_CODE = re.compile(r'[a-z][a-z0-9_]{0,39}\Z')          # phase, step, cls, detail, spot, event names
_CLASS = re.compile(r'[A-Za-z_][A-Za-z0-9_]{0,63}\Z')   # a Python exception class name
_FAIL_FIELD = re.compile(r'fail_[a-z][a-z0-9_]{0,39}\Z')

# name -> kind. 'int': a whole number (a count, a status); 'num': a finite number (seconds, minutes); 'code'; 'class'.
FIELDS = {
    'n': 'int', 'ok': 'int', 'exit': 'int', 'status': 'int', 'dropped': 'int',
    'scans': 'int', 'scan_fail': 'int', 'avail': 'int', 'holds': 'int', 'confirmed': 'int', 'human': 'int',
    'solves_ok': 'int', 'solves_failed': 'int', 'unsynced': 'int', 'pending': 'int', 'events': 'int',
    'dates': 'int', 'months': 'int', 'skip': 'int', 'pri': 'int', 'guests': 'int', 'auto': 'int', 'interval': 'num',
    'restarts': 'int', 'active': 'int', 'worker': 'int', 'gate_closed': 'int', 'reclaim': 'int', 'run': 'int',
    'secs': 'num', 'waited_s': 'num', 'uptime_min': 'num', 'ok_age_s': 'num', 'left_min': 'num', 'outage_s': 'num',
    'phase': 'code', 'name': 'code', 'step': 'code', 'cls': 'code', 'detail': 'code', 'spot': 'code', 'why': 'code',
    'host': 'code', 'origin': 'code', 'thread': 'code', 'reason': 'code',
    'exc': 'class',
}


def _admit(name, value):
    kind = FIELDS.get(name) or ('int' if _FAIL_FIELD.match(name) else None)
    if kind is None:
        return None
    if value is None:
        return '-'
    if kind == 'int':
        if isinstance(value, bool):
            return str(int(value))
        return str(value) if isinstance(value, int) else None
    if kind == 'num':
        if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
            return None
        return str(value) if isinstance(value, int) else f'{value:.1f}'
    if kind == 'code':
        return value if isinstance(value, str) and _CODE.match(value) else None
    if kind == 'class':
        return value if isinstance(value, str) and _CLASS.match(value) else None
    return None


def format_public(event, fields):
    """The public line for an event, or the reasons it was trimmed. Pure, for the tests."""
    if not isinstance(event, str) or not _CODE.match(event):
        event = 'bad_event'
    parts, dropped = [f'its {event}'], []
    for k in sorted(fields):
        v = _admit(k, fields[k]) if isinstance(k, str) else None
        if v is None:
            dropped.append(k if isinstance(k, str) and _CODE.match(k) else '?')
        else:
            parts.append(f'{k}={v}')
    if dropped:
        parts.append(f'dropped={len(dropped)}')
    return ' '.join(parts), dropped


def public(event, **fields):
    """One line on the public stream (stdout before setup(), e.g. a local run)."""
    line, dropped = format_public(event, fields)
    if dropped:
        # The names only: a value that failed the allowlist is exactly what must not be echoed anywhere.
        print(f'logs: public {event!r} dropped field(s) {", ".join(dropped)}', file=sys.stderr, flush=True)
    with _lock:
        out = _pub or sys.__stdout__
        try:
            out.write(line + '\n')
            out.flush()
        except (OSError, ValueError):
            pass


def mask(values):
    """`::add-mask::` each secret (each line of it) of 4+ characters, on Actions only."""
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        return
    with _lock:
        out = _pub or sys.__stdout__
        for v in values:
            for line in str(v or '').splitlines():
                line = line.strip()
                if len(line) >= 4:
                    out.write(f'::add-mask::{line}\n')
        out.flush()


def private_fds():
    """True once setup() pointed fd 1/2 at the private log: a child process inheriting them writes there."""
    return _private


def setup(private_path):
    """fd 1/2 → `private_path` (appended, 0600); the original stdout kept only for `public()`. Idempotent."""
    global _pub, _private
    if _pub is not None:
        return
    os.makedirs(os.path.dirname(os.path.abspath(private_path)), exist_ok=True)
    for f in (sys.stdout, sys.stderr):
        try:
            f.flush()
        except (OSError, ValueError):
            pass
    pub_fd = os.dup(1)
    fd = os.open(private_path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    os.close(fd)
    _pub = os.fdopen(pub_fd, 'w', buffering=1, encoding='utf-8', errors='replace')
    _private = True
    for f in (sys.stdout, sys.stderr):
        try:
            f.reconfigure(line_buffering=True)
        except (AttributeError, ValueError):
            pass
    sys.excepthook = _excepthook
    threading.excepthook = _thread_excepthook


def _thread_kind(thread):
    """`scan`, `confirm`, `url`, …: the thread's name up to its first non-letter. Never the rest (`scan-NOV` names a
    month)."""
    m = re.match(r'[a-z]+', (getattr(thread, 'name', '') or '').lower())
    return m.group(0)[:20] if m else 'thread'


def _excepthook(tp, value, tb):
    traceback.print_exception(tp, value, tb, file=sys.stderr)
    public('error', step='uncaught', exc=tp.__name__)


def _thread_excepthook(args):
    if args.exc_type is SystemExit:
        return
    traceback.print_exception(args.exc_type, args.exc_value, args.exc_traceback, file=sys.stderr)
    public('error', step='thread', thread=_thread_kind(args.thread), exc=args.exc_type.__name__)
