# story.json and edit.json

All story times are anchors resolved against the **cleaned** take (`voice.json`) by `scripts/resolve_story.py`:

| anchor | meaning |
|---|---|
| `12.5` | absolute seconds in the cleaned take |
| `"l05"` / `"l05.end"` | line l05 starts / ends |
| `"l05@14"` | the 14th recognised word (character group, in Thai) of l05 starts — read the word list in `voice.json` |
| `"start"` | this scene's start (inside a scene) |
| `"end0"`, `"button"`, `"button.end"` | end-card start; the reused closing line's start / end |
| `"…+0.3"`, `"…-0.1"` | any anchor plus an offset in seconds |

## Fields

- `title` — the persistent Thai headline strip; `tagline` — the small typed line above it.
- `payoff` — the reveal line (the loudest hit, the silence before it, the "gift" act in review).
- `quiet_from` — `"scene:N"` or an anchor: music drums drop from here to the closing button.
- `accents` — `[[anchor, "boom"]]`: a BOOM SWOOSH landing on a big moment (a number, a twist).
- `captions` — `{"lNN": "corrected Thai"}` for lines the recogniser misspelled; other lines use the transcript.
- `logo` — `true` puts the approved wordmark large on the end card; `logo_top` (default `true`) keeps it small at the top for the whole reel.
- `scenes[]` — one per plate, in order:
  - `plate`: a name in `gen/` (`gen/<plate>.png`); a plate may be reused (the end card often reuses the opening plate).
  - `start`: anchor (the first scene starts at `0`); usually just before the line that opens the beat, e.g. `"l07-0.06"`.
  - `chapter`: the small black label: topic words only, e.g. `"THE MARKET"`, `"PARIS · 1900"`. No numbering (rejected by the resolver).
  - `cam`: `[[anchor, x, y, zoom], …]` in plate pixels (1024×1536); the first key is `"start"`. Zoom 1 shows the full width; 1.6–2.0 is a push-in on a face or object. Each move eases over 0.8 s.
  - `marks`: `["circle", anchor, x, y, rx, ry, "teal"|"lav"]` or `["walk", anchor, x, y, width, amplitude, "teal"|"lav", seconds?]` (a hand-drawn random walk), in plate pixels.
  - `strips`: `[text, anchor, cx, cy, size, rotation, "teal"|"lav"|null]` in screen pixels (1080×1920; the plate spans x 50–1030, y 300–1525). Typical sizes 100–190; y 520 (upper) and 1040–1230 (lower) avoid most faces; the renderer keeps strips inside x 60–940.
- `end_card` — optional, after the speech: `plate`, `after_speech` (s), `chapter`, `cam`, `marks`, `strips` (anchors may use `start` and `button`), `caption` (Thai caption for the silent beat), `button_caption`.

## edit.json (Bachelier run)

```json
{
 "cuts": [
  [
   63.34,
   63.9,
   "false start before Edward"
  ],
  [
   96.35,
   96.93,
   "self-correction ตั้งราคา"
  ],
  [
   44.4,
   51.06,
   "drop l16-l19: unsourced claim + part-2 cliffhanger"
  ],
  [
   59.55,
   62.95,
   "drop l25: unsourced claim"
  ],
  [
   67.8,
   69.035,
   "drop l29: redundant"
  ]
 ],
 "drop_lines": [
  "l16",
  "l17",
  "l18",
  "l19",
  "l25",
  "l29"
 ],
 "reveal_line": "l11",
 "button": [
  33.0,
  34.42
 ]
}
```

## story.json example (Bachelier run, shortened)

```json
{
 "title": "สมการที่ไม่มีใครเชื่อ",
 "tagline": "the true story of Louis Bachelier",
 "payoff": "l11",
 "quiet_from": "scene:11",
 "accents": [
  [
   "l33",
   "boom"
  ]
 ],
 "logo": true,
 "captions": {
  "l05": "ชายหนุ่มคนหนึ่งชื่อ หลุยส์ บาเชอลีเย",
  "l27": "เอ็ดเวิร์ด โอ. ทอร์ป",
  "...": "(only lines whose recognised text needs correcting)"
 },
 "scenes": [
  {
   "plate": "s01-hook",
   "start": 0,
   "chapter": "THE MAN",
   "cam": [
    [
     "start",
     512,
     760,
     1.0
    ],
    [
     "l01@8-0.1",
     690,
     470,
     1.7
    ],
    [
     "l01@14-0.1",
     760,
     1150,
     1.6
    ],
    [
     "l02",
     512,
     760,
     1.0
    ]
   ],
   "marks": [
    [
     "walk",
     "l01@8+0.1",
     560,
     380,
     300,
     220,
     "teal"
    ],
    [
     "circle",
     "l01@14+0.15",
     800,
     1270,
     190,
     120,
     "lav"
    ]
   ],
   "strips": [
    [
     "ONE EQUATION.",
     "l01@8",
     540,
     560,
     150,
     -0.03,
     "teal"
    ],
    [
     "A FORTUNE.",
     "l01@14",
     560,
     760,
     130,
     0.025,
     "lav"
    ]
   ]
  },
  {
   "plate": "s02-doubt",
   "start": "l03-0.12",
   "chapter": "DOUBT",
   "cam": [
    [
     "start",
     512,
     760,
     1.0
    ],
    [
     "l03+0.86",
     516,
     430,
     1.7
    ]
   ],
   "marks": [
    [
     "circle",
     "l03+1.46",
     516,
     330,
     150,
     190,
     "teal"
    ]
   ],
   "strips": [
    [
     "NOBODY",
     "l03+0.86",
     470,
     1040,
     170,
     -0.03,
     null
    ],
    [
     "BELIEVED HIM.",
     "l03+1.26",
     560,
     1220,
     150,
     0.03,
     "teal"
    ]
   ]
  },
  {
   "plate": "s03-paris",
   "start": "l04-0.2",
   "chapter": "PARIS",
   "cam": [
    [
     "start",
     220,
     260,
     1.9
    ],
    [
     "l04@17-0.4",
     640,
     560,
     1.4
    ],
    [
     "l04@20+0.4",
     600,
     900,
     1.05
    ]
   ],
   "marks": [
    [
     "circle",
     "l04@20",
     656,
     500,
     120,
     300,
     "lav"
    ]
   ],
   "strips": [
    [
     "PARIS, 1900.",
     "l04@17",
     540,
     1150,
     170,
     -0.025,
     "lav"
    ]
   ]
  },
  "... one scene per plate ..."
 ],
 "end_card": {
  "plate": "s01-hook",
  "after_speech": 0.35,
  "chapter": "1900 → TODAY",
  "cam": [
   [
    "start",
    512,
    760,
    1.15
   ],
   [
    "button",
    690,
    470,
    1.6
   ]
  ],
  "marks": [
   [
    "walk",
    "button+0.15",
    560,
    380,
    300,
    220,
    "teal"
   ]
  ],
  "strips": [
   [
    "1900 — IGNORED.",
    "start+0.15",
    520,
    520,
    128,
    -0.03,
    null
   ],
   [
    "TODAY — EVERYWHERE.",
    "start+1.0",
    560,
    700,
    112,
    0.025,
    "lav"
   ],
   [
    "BROWNIAN MOTION.",
    "button",
    540,
    1080,
    150,
    -0.02,
    "teal"
   ]
  ],
  "caption": "ปี 1900 ไม่มีใครเชื่อ… วันนี้ทุกธนาคารใช้มัน",
  "button_caption": "Brownian Motion"
 }
}
```

The full file of the verified run is reproducible from the skill: same voice, `edit.json` above and 13 scenes gave the published v3 reel frame for frame.
