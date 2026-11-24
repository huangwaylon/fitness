# English captions

YouTube's auto captions (json3) for English Study, one file a video: `<video id>.en.json3`, the layout
`app/scripts/english-wpm.ts` reads, so any checkout can measure speech rate and re-cut the bands:

```
cd app && npm run english:wpm -- ../english-captions           # report
cd app && npm run english:wpm -- ../english-captions --write   # write wpm/band into the clip files
```

The library's clips (`app/src/lib/english/clips/`) plus the candidate pool. Source of truth stays on mbp2:
`~/friends/out/<id>/cap.json3` (`whisper.json` beside it, not kept here).

Dev input only: the shows' dialogue as auto-transcribed, copyrighted, never shipped by the app (our own transcripts
ship: docs/english.md "Transcripts"). Lessons quote one short line at most.
