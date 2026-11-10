Working files the app's generated assets are built from. Not needed to run the app.

- `food-images-raw`: unpacks to ~/food-images-raw
- `tts-work`: unpacks to app/.cache/tts/
- `food-data-raw`: unpacks to food-data/

Sources and credits: docs/food-data.md and docs/kikimimi-engine.md.

Restore: `gh release download <tag> -p '*'`, `shasum -a 256 -c SHA256SUMS`, then `cat NAME.tar.zst.part-* | zstd -d | tar -xf - -C <dest>`
