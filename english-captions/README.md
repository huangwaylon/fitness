# English captions

YouTube's auto captions (json3) for English Study, one file a video: `<video id>.en.json3` — the layout
`app/scripts/english-wpm.ts` reads, so any checkout can measure speech rate and re-cut the bands:

```
cd app && npm run english:wpm -- ../english-captions           # report
cd app && npm run english:wpm -- ../english-captions -- --write  # write wpm/band into the clip files
```

1,762 videos: the 33 clips in `app/src/lib/english/clips/` plus the candidate pool (the ranked list behind
`~/friends/scores.tsv` on mbp2). Source of truth stays mbp2: `~/friends/out/<id>/cap.json3` (with `whisper.json`
beside it for word checks; whisper output is not kept here).

Dev input only. These are the shows' scripts as auto-transcribed — copyrighted, never shipped by the app
(docs/english.md: "no audio or transcript is ours to ship"). Lessons quote one short line at most.
