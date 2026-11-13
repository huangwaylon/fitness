#!/usr/bin/env python3
"""`.env`'s preflight: the applicant's fields, the mailbox, an IMAP login, the confirmation gate. Prints no secrets.

The ITS site validates every value here at the moment it matters least: mid booking, inside a 30-minute hold, with a
contested slot on the line. Check them at your desk instead. Stdlib only (no pydoll, no Worker).

    python3 check_env.py
    python3 main.py --check     # the same
"""
import re
import sys
import unicodedata
from datetime import date

import book_hotels
import config
from book_hotels import R, G, Y, X

DIM = '\033[2m'

_problems = []


def _pad(text, width):
    """Left-justify by display width, not character count: 記号 occupies four
    columns for two characters, so `str.ljust` leaves the output ragged."""
    cells = sum(2 if unicodedata.east_asian_width(c) in 'WF' else 1 for c in text)
    return text + ' ' * max(0, width - cells)


def _report(label, value, ok, detail=''):
    mark = f'{G}ok{X}' if ok else f'{R}FAIL{X}'
    print(f'  [{mark}] {_pad(label, 24)} {value}'
          + (f'  {DIM}{detail}{X}' if detail else ''))
    if not ok:
        _problems.append(f'{label}: {detail or "not set"}')


# Full-width katakana, plus the long vowel mark and the middle dot used in names.
_KATAKANA = re.compile(r'\A[ァ-ヺー・　 ]+\Z')
_HIRAGANA = re.compile(r'[ぁ-ゖ]')
_KANJI = re.compile(r'[一-鿿]')


def _check_applicant():
    print(f'\n{DIM}申込代表者 (from 保険証等){X}')
    a = config.APPLICANT

    for key, label in (('kigou', '記号 (ITS_KIGOU)'), ('bangou', '番号 (ITS_BANGOU)')):
        v = a[key]
        # Length is safe to show; the value itself is an identity credential.
        _report(label, f'{len(v)} chars' if v else '(empty)', bool(v),
               'required — on the front of the card')

    for key, label in (('kana_sei', 'カナ姓 (ITS_KANA_SEI)'),
                       ('kana_mei', 'カナ名 (ITS_KANA_MEI)')):
        v = a[key]
        if not v:
            _report(label, '(empty)', False, 'required, katakana')
        elif _HIRAGANA.search(v):
            _report(label, f'{len(v)} chars', False, 'looks like hiragana, not katakana')
        elif _KANJI.search(v):
            _report(label, f'{len(v)} chars', False, 'looks like kanji — this field wants カナ')
        elif not _KATAKANA.match(v):
            _report(label, f'{len(v)} chars', False,
                   'not full-width katakana (half-width ﾊﾝｶｸ will not match either)')
        else:
            _report(label, f'{len(v)} chars katakana', True)

    v = a['birth']
    if not re.fullmatch(r'\d{4}-\d{2}-\d{2}', v or ''):
        _report('生年月日 (ITS_BIRTH)', v or '(empty)', False, 'must be YYYY-MM-DD')
    else:
        try:
            born = date.fromisoformat(v)
        except ValueError:
            _report('生年月日 (ITS_BIRTH)', v, False, 'not a real date')
        else:
            age = (date.today() - born).days // 365
            plausible = 0 < age < 120
            _report('生年月日 (ITS_BIRTH)', v, plausible,
                   f'age {age}' if plausible else f'implausible age {age}')

    v = a['sex']
    _report('性別 (ITS_SEX)', v or '(empty)', v in ('男', '女'), "must be 男 or 女")

    v = a['zokugara']
    _report('続柄 (ITS_ZOKUGARA)', v or '(empty)', bool(v),
           '本人 for the insured member')

    v = a['tel']
    digits = re.sub(r'\D', '', v or '')
    _report('電話番号 (ITS_TEL)', v or '(empty)', 10 <= len(digits) <= 11,
           f'{len(digits)} digits — expected 10 or 11')

    optional = [k for k in ('name_sei', 'name_mei', 'zip', 'addr') if a[k]]
    print(f'  {DIM}optional set: {", ".join(optional) or "none"} '
          f'(only used if the form asks){X}')


def _check_mail_config():
    print(f'\n{DIM}Gmail{X}')
    user = config.IMAP_USER
    _report('ITS_IMAP_USER', user or '(empty)', '@' in user, 'must be the mailbox we read')

    pw = config.IMAP_APP_PASSWORD
    if not pw:
        _report('ITS_IMAP_APP_PASSWORD', '(empty)', False,
               'https://myaccount.google.com/apppasswords')
    else:
        _report('ITS_IMAP_APP_PASSWORD', f'{len(pw)} chars', len(pw) == 16,
               'Google app passwords are 16 characters'
               if len(pw) != 16 else 'spaces stripped automatically')

    same = config.EMAIL == user and bool(user)
    _report('EMAIL submitted to ITS', config.EMAIL, same,
           '' if same else (f'differs from the mailbox we poll '
                            f'({user or "unset"}) — the confirmation link would '
                            f'be delivered out of reach'))
    print(f'  {DIM}expecting mail from {config.MAIL_FROM}{X}')


def _check_imap_login():
    print(f'\n{DIM}IMAP connection{X}')
    if not (config.IMAP_USER and config.IMAP_APP_PASSWORD):
        _report('login', 'skipped', False, 'user or app password missing')
        return
    import imaplib
    try:
        with imaplib.IMAP4_SSL(config.IMAP_HOST, config.IMAP_PORT, timeout=20) as m:
            try:
                m.login(config.IMAP_USER, config.IMAP_APP_PASSWORD)
            except imaplib.IMAP4.error as e:
                msg = str(e)
                hint = 'wrong app password, or 2-Step Verification is off'
                if 'Application-specific password required' in msg:
                    hint = ('this account requires an app password — a normal '
                            'account password will not work')
                elif 'Invalid credentials' in msg:
                    hint = 'invalid credentials — regenerate the app password'
                _report('login', 'rejected', False, hint)
                return
            _report('login', config.IMAP_USER, True)

            # All Mail, not INBOX: a filter or Google's own classifier can put the
            # confirmation somewhere else, and losing the 30-minute hold to a
            # mailbox-selection detail would be an absurd way to lose a room.
            box = '"[Gmail]/All Mail"'
            typ, _ = m.select(box, readonly=True)
            if typ != 'OK':
                box = 'INBOX'
                typ, _ = m.select(box, readonly=True)
            _report('mailbox', box.strip('"'), typ == 'OK',
                   '' if typ == 'OK' else 'could not select a mailbox')

    except OSError as e:
        _report('connection', f'{config.IMAP_HOST}:{config.IMAP_PORT}', False,
               f'{type(e).__name__}: {e} — IMAP disabled, or the network blocks 993')


def _check_gate():
    print(f'\n{DIM}Confirmation gate{X}')
    bh = book_hotels
    print(f'  AUTO_CONFIRM={config.AUTO_CONFIRM}  '
          f'AUTO_CONFIRM_MIN_DAYS={config.AUTO_CONFIRM_MIN_DAYS}')
    if not config.TARGET_DATES:
        print(f'  {Y}TARGET_DATES is empty{X}')
    for d in sorted(config.TARGET_DATES):
        left = bh.days_until(d)
        ok, _why = bh.confirm_allowed(d)
        if left is not None and left < 0:
            verdict = f'{DIM}past{X}'
        elif ok:
            verdict = f'{G}auto-confirm{X}'
        else:
            verdict = f'{Y}hold+email only, human confirms{X}'
        print(f'    {d}  {str(left) + "d":>5}  {verdict}')



def check_env():
    """Validate .env before it matters — the site checks these mid-hold, with a
    contested slot on the line. Prints no secrets. Returns a process exit code."""
    print(f'\nITS booker — environment check  {DIM}(no secrets printed){X}')
    _check_mail_config()
    _check_applicant()
    _check_imap_login()
    _check_gate()

    print()
    if _problems:
        print(f'{R}{len(_problems)} problem(s) to fix:{X}')
        for p in _problems:
            print(f'  - {p}')
        return 1
    print(f'{G}Ready.{X}')
    return 0


if __name__ == '__main__':
    sys.exit(check_env())
