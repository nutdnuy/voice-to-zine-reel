#!/bin/zsh
# Contact sheet of plates with a grid every 256 plate pixels (red lines), to read coordinates for camera keys and marks.
# usage: plate_grid.sh <project dir> <out.jpg> [name ...]   (default: every gen/*.png). 5 tiles per row, in the order given.
# Each tile is 256x384 = the 1024x1536 plate / 4, so plate x = 4 * tile x; one grid square = 256 plate px.
P=${1:A}; OUT=$2; shift 2
names=("$@"); [ ${#names} -eq 0 ] && names=($(cd "$P/gen" && ls *.png | grep -v '^ref' | sed 's/\.png$//'))
args=(); fc=""; i=0
for n in $names; do args+=(-i "$P/gen/$n.png"); fc+="[${i}]scale=256:384,drawgrid=w=64:h=64:t=1:c=red@0.6[v${i}];"; i=$((i+1)); done
row=5; stacks=""; r=0
for ((s=0; s<i; s+=row)); do
  e=$((s+row)); [ $e -gt $i ] && e=$i; in=""
  for ((k=s; k<e; k++)); do in+="[v${k}]"; done
  for ((k=e-s; k<row; k++)); do fc+="color=black:s=256x384:d=1[pad${r}_${k}];"; in+="[pad${r}_${k}]"; done
  fc+="${in}hstack=inputs=${row}[r${r}];"; stacks+="[r${r}]"; r=$((r+1))
done
if [ $r -gt 1 ]; then fc+="${stacks}vstack=inputs=${r}[o]"; else fc+="[r0]null[o]"; fi
ffmpeg -v error -y "${args[@]}" -filter_complex "$fc" -map "[o]" -frames:v 1 "$OUT" && echo "wrote $OUT — order: ${names[*]}"
