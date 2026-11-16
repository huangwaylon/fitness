# ききみみ: speaking with the mic (retired)

The speaking modes (まねっこ, くりかえし, こたえて！, はつおん, ロールプレイ), the mic opt-in and probe, lib/mic and the
pinned whisper download under `/stt/` were removed on 2026-11-16 (the English Study overhaul: no speaking content). The
site's Permissions-Policy now says `microphone=()`, and the service worker deletes the old `island-stt-v1` cache on its
next activate. What is left, and why:

## The probe

contract/log.ts keeps the `mic.*` log events: builds from before the removal may still send them until they reload.
They go with the relay cleanup (Phase 6), after the old builds are gone.

## In the registry

Old `listen` rows of the mic games (`gm` `mane`, `kuri`, `pair`, `role`) carry minutes only (`r: []`).
contract/listen.ts (`MIC_GMS`, `minutesOnly`) keeps parsing them, because summaries and restores re-read stored rows.

## The relay endpoint

`POST /stt` (relay/src/sttRoute.ts, its `[ai]` binding and `STT_*` vars) stays until the old builds are gone: an old
phone with the mic on may still call it. The audio and its text are never stored or logged.

## The privacy rule

The rule that held while the mic shipped: recordings were never stored or synced, mic rows carried minutes only, and
heard text never went into a log event.
