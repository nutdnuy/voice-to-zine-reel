---
name: voice-to-zine-reel
description: Turn Nuth's own recorded voice-over (an audio file, Thai or English) into two finished 9:16 Reels in the distressed editorial-zine look — A = voice + sound effects, B = voice + sound effects + a story-shaped music bed. Cleans the take (stutters, false starts, self-corrections, dead air), builds a story of engraved photocopy plates generated with Codex CLI, camera push-ins, torn cream text strips, hand-drawn teal/lavender marks, Thai karaoke captions and the approved QuantCorner wordmark. Use when Nuth drops a voice/audio file and asks for a clip, Reel, Vox/zine/magazine-style video from it ("โยนเสียงแล้วได้คลิป", "ทำคลิปจากเสียงนี้", "ตัดเสียงผมเป็นรีล"). For a Reel that starts from a topic idea rather than a recording, use quantcorner-reel-production.
---

# Voice to Zine Reel

Nuth records the narration; this skill turns it into two Reels. Proven on the Bachelier story (2026-10-11): a 111 s take became an 83 s reel in two sound versions.

Look: charcoal distressed paper, one photocopied engraved plate per story beat (torn deckled edge that boils at 12 fps), warm-cream torn strips with tall bold condensed black type, a few teal and lavender marker strokes, Thai captions on cream strips with a lavender karaoke sweep, the approved QuantCorner wordmark at the end. Everything lettered is set in code. The plates carry no text, so spelling (Thai included) is exact.

## Requirements (check first; stop and report what is missing)

- `~/.venvs/animate/bin/python` with faster-whisper, numpy and scipy. If it is missing: `uv venv --python 3.12 ~/.venvs/animate && VIRTUAL_ENV=~/.venvs/animate uv pip install faster-whisper numpy scipy pillow`.
- ffmpeg; Node with Playwright and Chromium (`npm i -g playwright && npx playwright install chromium`).
- The `animate` skill: its build, export and review tools are used from `~/.claude/skills/animate/tools`.
- Codex CLI logged in with image generation (`codex features list | grep image_generation`).
- The approved wordmark at `90 System/design-systems/assets/quantcorner-brand/quantcorner-wordmark-dark.png`. It is imported unchanged; never redraw it.

Paths: `SK = ~/.claude/skills/voice-to-zine-reel`, `PY = ~/.venvs/animate/bin/python`. Make one project folder per reel (for example next to the audio, or under the current project's `pieces/<name>/`) and never write into this skill folder.

## Workflow

1. **Transcribe.** Run `$PY -I $SK/scripts/transcribe.py <audio> <project>`. It writes `voice-orig.json` (lines `l01…` with word times), prints every line, silences ≥ 0.3 s, and voiced stretches with no recognised word.
   - Whisper's line splitting changes between runs. Write everything below against **this** `voice-orig.json` and never re-transcribe afterwards.
   - Thai "words" are character groups. Use their times, not their spelling.
2. **Decide the edit.** Write `<project>/edit.json` (schema in `scripts/clean_voice.py`).
   - **Flubs:** for each unworded voiced stretch, run `transcribe_spots.py <audio> a:b` to hear what it contains (a false start, "เอ่อ"). Run `envelope.py <audio> a:b` and put both cut ends on dips (≤ −50 dB, or the closure before a stop consonant). Cut false starts and self-corrections; keep the corrected word.
   - **Dead air:** handled by the defaults (between lines 0.28 s, inside a line 0.16 s, lead-in 0.25 s). Keep 0.45 s before the payoff line (`reveal_line`).
   - **Lines to drop:** cut a line when it states a claim you cannot source, when it is a part-2 cliffhanger ("เรามาดูตอนต่อไป") that has no place in a single Reel, or when it is redundant. List the line in `drop_lines` and give an explicit cut from the silence before it to the silence after it.
   - **Ending without re-recording:** set `button` to the original-take span of the payoff phrase. The cleaner replays it after a silent end card.
3. **Clean.** Run `$PY -I $SK/scripts/clean_voice.py <audio> <project>/voice-orig.json <project>/edit.json <project>`. Then prove it: transcribe `<project>/voice/voice.wav` into a scratch folder and confirm every kept line is intact.
4. **Fact-check.** Web-check every factual claim that will appear **on screen**: names, years, grades, figures. Put sourced facts on strips. Leave unsupported narration off screen, or cut it (step 2), and tell Nuth.
5. **Plates.** Write `<project>/plates.tsv`: `name<TAB>subject[<TAB>reference.png]`, one plate per story beat (usually 10–14).
   - **Subjects:** concrete scenes for the engraved-zine style (period people, places, objects). Use no text and no real logos. The style block is added by the script.
   - **Faces:** generate the main character's portrait plate first, then pass it as the reference for every other plate showing that person (same face).
   - **Run:** `$SK/scripts/gen_plates.sh <project>`. About 80 s per plate, 4 at a time; existing PNGs are skipped. Look at every plate and regenerate failures by deleting the PNG and running again.
6. **Story.** Write `<project>/story.json` following `references/story-json.md`.
   - **Anchors:** every time is anchored to the cleaned take (`"l05@14+0.2"`).
   - **Camera and marks:** for coordinates, build `$SK/scripts/plate_grid.sh <project> grid.jpg` and read it. A grid square is 256 plate px; plate x = 4 × tile x.
   - **Rules of thumb:** something new every 2–3 s (a camera key, a mark or a strip); 1–2 strips per scene of ≤ 4 words, bold English or Thai; push in on the detail the line names; one circle or random walk where it helps. Correct recogniser spellings in `captions`. Set `payoff` (the reveal line) and `accents` (`boom` on a big number).
7. **Build both reels.** Run `$SK/scripts/make_reel.sh <project>`, about 6 minutes. It resolves the story, renders, places 100+ sound events from the scene data, generates the music bed (drums drop before the payoff and through the close), mixes A and B, and writes `renders/<name>-A-sfx.mp4`, `renders/<name>-B-sfx-music.mp4` and 720p `-preview.mp4` copies (< 30 MB), plus `review-output.txt`. For a sound-only change, use `make_reel.sh <project> --no-render`.
8. **Check.** Look at stills of every scene: `node ~/.claude/skills/animate/tools/still.mjs <project> t1,t2,… out.png --scale 0.3`. Fix anything that is covered (a face under a strip, a mark off its object). Read the review:
   - `text: PASS` with 0 in the safe zone;
   - `dead beats: PASS`;
   - the loudest 100 ms window inside the payoff act.
   Fix and rerun; re-rendering is cheap.
9. **Deliver.** Send both previews (SendUserFile, under 30 MB) and link the full files. Report:
   - what was cut from the voice and why;
   - claims left off screen and why;
   - review numbers and loudness;
   - that you cannot listen to the mix.
   Append a dated entry to `<project>/LOG.md`.

## Sound and music rules

- **Sources:** SFX come only from `assets/sfx/` (see its `LICENSES.md`): Nuth's library (owner-approved 2026-10-11), the Video OS paper set, and Pixabay files. Add new files only with a licence row. Never pull audio from websites or from unlicensed folders.
- **Levels (Nuth's Vox standard):** voice peak −6 dB; music peak −20 dB with a 2.5 kHz pocket, ducked 6 dB under the voice; SFX −13 to −24 dB by role. Master to about −15 LUFS, −1.5 dBTP. The payoff hit is the loudest moment, preceded by its silence.
- **Music:** `scripts/make_bed.py` is a story-arranged variant of Nuth's own `Video OS/resources/music/generators/make_bgm.py`. Prefer it; use another track only if Nuth supplies one with its licence.

## Brand

- **Logo:** QuantCorner editorial uses the approved wordmark, imported unchanged and drawn after the print pass (no texture, rotation or recolour). Follow Visual Design Routing, Route 2 (generated components + authentic logo).
- **No other brands:** no other brand marks, and no generated logos.
- **Palette:** charcoal, cream and gray, plus teal and lavender as small strokes only.

## Files

| path | what |
|---|---|
| `scripts/transcribe.py`, `transcribe_spots.py`, `envelope.py` | transcript + edit candidates; what a gap contains; where to cut |
| `scripts/clean_voice.py` | the edit: cuts, pause compression, reused closing line → `voice/voice.wav`, `voice.json`, `edl.json` |
| `scripts/gen_plates.sh`, `plate_grid.sh` | Codex CLI plates (optional face reference); coordinate grid |
| `scripts/resolve_story.py` | `story.json` anchors → `src/config.js` + `piece.json` |
| `scripts/make_reel.sh` | build, render, SFX events, music bed, mixes A/B, MP4s, previews, review |
| `scripts/dump_sfx.mjs`, `make_bed.py`, `mix_sfx.py` | the sound steps (called by `make_reel.sh`) |
| `template/` | page head, data-driven renderer (`src/zine.js`), `styles/vox-paper/`, charcoal background |
| `assets/sfx/` | bundled sound effects + `LICENSES.md` |
| `references/story-json.md` | the story schema, anchors, a full worked example |

## Lessons (from the first run)

- `codex exec -i <img>` takes several values: end it with `--` before the prompt, or the prompt is read as a second image.
- Pass audio samples (numpy) to faster-whisper, not a path: some PyAV builds break its decoder.
- The animate review tool reads `shotAtFrame`; the template defines it. Keep strips inside x 60–940 (the right-hand phone buttons) — the renderer clamps them.
- A strip over a face or a caption over the subject reads as a mistake: place strips on sky, floor or clothing, and check the stills.
