#!/bin/zsh
# Generate the scene plates with Codex CLI image generation (1024x1536, engraved photocopy zine, no text).
# usage: gen_plates.sh <project dir> [parallel=4]
# reads <project>/plates.tsv: name<TAB>subject[<TAB>reference image in gen/, e.g. s04-louis.png]
# A reference keeps a character's face consistent: generate the portrait plate first, then pass it.
# Existing gen/<name>.png files are skipped (delete one to regenerate it). Logs: gen/<name>.log
set -u
P=${1:A}; N=${2:-4}; mkdir -p "$P/gen"
one() {
  local name=$1 subject=$2 ref=${3:-}
  [ -f "$P/gen/$name.png" ] && { echo "skip $name"; return; }
  local STYLE="Style: distressed handmade editorial zine collage plate; vintage engraved illustration with etched hatching, rough ink texture and woodcut-like lines; strong black-and-cream contrast; photocopy grain and risograph texture; printed on aged warm-cream paper with deckled torn edges, creases and scuffs, physically cut and pasted. Palette strictly black, warm cream and muted gray. Portrait composition. No text, no letters, no numbers, no writing or signage of any kind, no logos, no watermarks, no glossy 3D, no neon glow, no smooth gradients, no charts, no currency symbols, no arrows."
  local ask="Use your image generation tool to create ONE image, portrait 1024x1536. Then copy the resulting PNG into the current directory as ${name}.png. Do nothing else.

Image prompt: ${subject}
${STYLE}"
  if [ -n "$ref" ]; then
    # -i takes several values: end it with -- or it swallows the prompt
    codex exec --skip-git-repo-check -s workspace-write -C "$P/gen" -i "$P/gen/$ref" -- "The attached image is the character reference: keep the SAME person (face, hair, features) in the new image. $ask" > "$P/gen/$name.log" 2>&1
  else
    codex exec --skip-git-repo-check -s workspace-write -C "$P/gen" "$ask" > "$P/gen/$name.log" 2>&1
  fi
  [ -f "$P/gen/$name.png" ] && echo "OK $name" || echo "FAIL $name (see gen/$name.log)"
}
while IFS=$'\t' read -r name subject ref; do
  [ -z "$name" ] || [[ "$name" == \#* ]] && continue
  while [ $(jobs -r | wc -l) -ge $N ]; do sleep 2; done
  one "$name" "$subject" "${ref:-}" &
done < "$P/plates.tsv"
wait
