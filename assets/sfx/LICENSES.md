# Sound effects

Included here (redistributable):

| file | source | licence |
|---|---|---|
| paper-slip.wav | original procedural SFX (Video OS project), segments from Anidoodle 0.5.3 | own / Apache-2.0 |
| soft-thock.wav | same | own / Apache-2.0 |
| tick.wav | same | own / Apache-2.0 |

The renderer also schedules these optional effects. They are **not** in this repository; put files with
these exact names in `assets/sfx/` (or point `ZINE_SFX_DIR` at a folder that has them) using sounds you have
the rights to. Missing ones are skipped with a note. Free commercial-use sources: Mixkit (Free license),
Pixabay sound effects, Freesound (CC0 only).

| expected file | role |
|---|---|
| `SWOOSH #3.mp3` | whoosh leading each plate change (J-cut) |
| `SWOOSH #5.mp3` | small whoosh on camera moves |
| `QUIKTEAR.WAV` | paper tear as a plate slaps down |
| `THUDHIT.WAV` | thud under a text strip |
| `DRAMATIC IMPACT (FROM BLACK OPS 3 TRAILER).mp3` | the payoff hit (rename your own impact to this, or edit `template/src/zine.js`) |
| `impact-bass-1.mp3` | bass layer on the payoff and the closing line |
| `BOOM SWOOSH.mp3` | accent into a big moment |
| `Clock Ticking Sound Effect.mp3` | under the silent end card |
| `SHRTBASS.mp3` | closing line hit |
| `QUIETPOP.WAV` | logo in |

Music is generated per reel by `scripts/make_bed.py` (original synthesis, no samples).
