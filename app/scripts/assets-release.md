Raw sources for rebuilding Island Fund's generated assets. These are not needed to run the app: everything the app serves is in git.

- **`food-images-raw`** (to `~/food-images-raw`): the full-size ごはん picture generations, takes, descriptions and logs. Generated with Z-Image-Turbo. The descriptions are drafted from MEXT/MAFF text (政府標準利用規約 / PDL1.0, credited).
- **`tts-work`** (to `app/.cache/tts/`): ききみみ's clean takes and voice references. The US voices are designed by Qwen3-TTS VoiceDesign (no real person). UK voices: Phonon catalogue voices (Apache-2.0). AU voices: the CSTR VCTK Corpus (CC BY 4.0, University of Edinburgh).
- **`food-data-raw`** (to `food-data/`): the raw downloads `food-data/scripts/fetch.py` makes, under their own terms:
  - MEXT 日本食品標準成分表（八訂）増補2023年 (公共データ利用規約1.0)
  - MAFF「うちの郷土料理」 recipes and photos (PDL1.0 / 政府標準利用規約; any photo credited to a third party keeps that party's rights)
  - 高槻市 / 豊中市 / 久留米市 / 熊谷市 / 東京都 recipes (CC BY 4.0 / CC BY 2.1 JP / CC BY)
  - Open Food Facts (ODbL 1.0 / DbCL 1.0, © Open Food Facts contributors)
  - the files under reliab_github, each under the licence its own repository states

  Credit each source as docs/food-data.md "Licensing obligations" says.

Restore: `gh release download <tag> -p '*'`, then `shasum -a 256 -c SHA256SUMS`, then `cat NAME.tar.zst.part-* | zstd -d | tar -xf - -C <dest>`.
