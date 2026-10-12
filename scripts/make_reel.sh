#!/bin/zsh
# Build both reels from a prepared project: A = voice + SFX, B = voice + SFX + music bed.
# usage: make_reel.sh <project dir> [--no-render]   (--no-render: reuse renders/final.mp4, redo sound only)
# needs in <project>: story.json, voice/voice.wav + voice.json + edl.json (clean_voice.py), gen/<plate>.png
# writes <project>/renders/<name>-A-sfx.mp4, <name>-B-sfx-music.mp4 (+ -preview.mp4 720p under 30 MB), review-output.txt
set -e
P=${1:A}; NORENDER=${2:-}
SK=${0:A:h:h}; AN=~/.claude/skills/animate/tools; PY=~/.venvs/animate/bin/python
LOGO=${ZINE_LOGO:-"$HOME/Documents/LLM-Wiki/90 System/design-systems/assets/quantcorner-brand/quantcorner-wordmark-dark.png"}   # approved wordmark; ZINE_LOGO overrides; none = no logo
NAME=${P:t}
for f in story.json voice/voice.wav voice.json edl.json; do [ -f "$P/$f" ] || { echo "missing $P/$f"; exit 1; }; done
mkdir -p "$P/src" "$P/assets" "$P/styles" "$P/sfx" "$P/renders"
cp "$SK/template/src/"{head.html,zine.js,tail.html} "$P/src/"
rm -rf "$P/styles/vox-paper"; cp -R "$SK/template/styles/vox-paper" "$P/styles/"
cp "$SK/template/assets/bg-charcoal.jpg" "$P/assets/"; if [ -f "$LOGO" ]; then cp "$LOGO" "$P/assets/quantcorner-wordmark-dark.png"; else echo "no logo file ($LOGO): rendering without a logo"; fi
for f in "$P"/gen/*.png; do n=${f:t:r}; [[ $n == ref* || $n == *.v[0-9]* ]] && continue
  [ "$P/assets/$n.jpg" -nt "$f" ] || sips -s format jpeg -s formatOptions 74 "$f" --out "$P/assets/$n.jpg" >/dev/null; done
cp "$SK/assets/sfx/"* "$P/sfx/" 2>/dev/null || true
[ -n "${ZINE_SFX_DIR:-}" ] && cp "$ZINE_SFX_DIR"/* "$P/sfx/" 2>/dev/null || true   # extra effects folder (e.g. your own library)
$PY -I "$SK/scripts/resolve_story.py" "$P"
node "$AN/build.mjs" "$P" | tail -1
if [ "$NORENDER" != "--no-render" ]; then node "$AN/export.mjs" "$P" --workers 6 --no-audio --no-captions 2>&1 | grep -vE '^\s+[0-9]+/' | tail -2; fi
node "$SK/scripts/dump_sfx.mjs" "$P" "$P/sfx/events.json"
$PY -I "$SK/scripts/make_bed.py" "$P/sfx/events.json" "$P/sfx/bed.wav"
$PY -I "$SK/scripts/mix_sfx.py" "$P" --out mix-A.wav
$PY -I "$SK/scripts/mix_sfx.py" "$P" --music "$P/sfx/bed.wav" --out mix-B.wav
D=$(python3 -c "import json;print(json.load(open('$P/edl.json'))['new_duration'])")
cd "$P/renders"
for v in A B; do o=$([ $v = A ] && echo "$NAME-A-sfx" || echo "$NAME-B-sfx-music")
  ffmpeg -y -hide_banner -loglevel error -i final.mp4 -i mix-$v.wav -map 0:v -map 1:a -c:v libx264 -preset medium -crf 21 -pix_fmt yuv420p -c:a aac -b:a 192k -movflags +faststart -t $D "$o.mp4"
  ffmpeg -y -hide_banner -loglevel error -i "$o.mp4" -vf scale=720:1280 -c:v libx264 -preset slow -b:v 1800k -maxrate 2100k -bufsize 3600k -c:a aac -b:a 128k -movflags +faststart "$o-preview.mp4"
  echo "$o.mp4  $(ffmpeg -hide_banner -i mix-$v.wav -af ebur128=peak=true -f null - 2>&1 | grep -E '^\s+I:' | xargs)"; done
cp mix-A.wav audio.wav
cd "$P"; timeout 550 node "$AN/review.mjs" "$P" > review-output.txt 2>&1 || true
grep -E "^text:|WARN|FAIL  (cut off|overlaps)|dead beats:|narration:|loudest" review-output.txt | head -15
