# voice-to-zine-reel

A Claude Code skill: drop in a recorded voice-over, get two finished 9:16 Reels in a distressed editorial-zine look.

- **A** — your voice + sound effects
- **B** — your voice + sound effects + a story-shaped music bed

ทำคลิป Reel แนวนิตยสาร (zine) จากไฟล์เสียงพากย์ของคุณ ได้สองเวอร์ชัน: มีแค่เสียงเอฟเฟกต์ และมีเพลงพื้นหลังด้วย

## What it does

1. **Transcribes** the take locally (faster-whisper large-v3) with word times, and lists dead air and non-word sounds (fillers, false starts).
2. **Cleans the voice**: cuts false starts and self-corrections on natural dips, compresses pauses (0.28 s between lines, 0.16 s inside), keeps a short silence before the payoff, can drop lines, and can replay the payoff phrase after a silent end card so you never re-record an ending. Every join is a 20 ms crossfade.
3. **Generates one plate per story beat** with Codex CLI image generation: engraved, photocopied, torn-paper collage, no text. A portrait plate can be passed as a reference so a character keeps the same face.
4. **Animates** from a `story.json` whose times are anchored to spoken words (`"l05@14+0.2"`): camera push-ins and pans onto the detail being said, hand-drawn teal/lavender circles and random walks, torn cream strips with tall condensed type, Thai/English captions with a karaoke sweep, motion at 12 fps. All lettering is set in code, so spelling (Thai included) is exact.
5. **Sound**: 100+ effects placed from the scene data, a procedural music bed whose drums drop before the payoff and through the close, then mixes for A and B (voice peak −6 dB, effects 3 dB under it, music at −32 dB with a 2.5 kHz pocket and ducking, master −14 LUFS with a limiter; all adjustable: `mix_sfx.py --sfx-db --music-db --lufs`).
6. **Checks**: text cut off or under the phone UI, dead beats, the loudest moment on the payoff.

## Requirements

- [Claude Code](https://claude.com/claude-code) and the [animate](https://github.com/cth9191/animate) skill installed at `~/.claude/skills/animate`
- Node 18+, Playwright with Chromium (`npm i -g playwright && npx playwright install chromium`), ffmpeg
- Python 3.12 venv at `~/.venvs/animate` with `faster-whisper numpy scipy pillow`
- [Codex CLI](https://github.com/openai/codex) logged in, with image generation enabled
- Fonts used if present: DIN Condensed, American Typewriter, Noto Sans Thai (macOS)

## Install

```bash
git clone https://github.com/nutdnuy/voice-to-zine-reel ~/.claude/skills/voice-to-zine-reel
```

Then ask Claude Code: *"make a reel from this recording: path/to/voice.m4a"*. The full procedure is in [SKILL.md](SKILL.md); the story format, with a worked example, is in [references/story-json.md](references/story-json.md).

## Assets you supply

- **Logo (optional):** set `ZINE_LOGO=/path/to/logo.png`. It is shown unaltered as a small badge in the bottom-right corner for the whole reel (`logo_corner`: `bottom-right` | `top` | `null`) and large on the end card (`logo`). Without it, no logo is drawn.
- **Extra sound effects (optional):** only three effects ship here. The others the renderer schedules are listed in [assets/sfx/LICENSES.md](assets/sfx/LICENSES.md). Add files you have the rights to, or set `ZINE_SFX_DIR`. Missing ones are skipped.

## Layout

```
SKILL.md                  the procedure Claude follows
scripts/                  transcribe, clean_voice, gen_plates, plate_grid, resolve_story, make_reel, sound tools
template/                 page head, data-driven renderer (src/zine.js), vox-paper style, background
assets/sfx/               bundled effects + licences
references/story-json.md  schema and example
```

## License

MIT, see [LICENSE](LICENSE). Third-party parts: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
