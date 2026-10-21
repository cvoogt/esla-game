# Hyperframes Composition Brief: Esla

## Objective
Create a short launch-style brag video for Esla.

## Output
- Composition directory: `brag-output-2026-10-21-211550/composition/`
- Rendered video: `brag-output-2026-10-21-211550/brag.mp4`
- Format: landscape — 1920x1080, 30fps
- Duration: 21.5 seconds

## Source Material
- Project root: `/home/user/esla-game`
- Primary files read: README.md, PLAN.md, index.html, src/styles.css, src/rules.ts, src/screens/Play.tsx, src/components/ScoreSheet.tsx, src/screens/Results.tsx, src/feedback.ts, public/icon.svg
- Product name: Esla
- Tagline / strongest claim: "Score counter for the Esla game" / spot Teslas, call them out, score points
- Key UI moment to recreate: the Play scoreboard cards, the ScoreSheet (chips, Called/Missed, Tesla/Cybertruck, color grid, Dealership), the toast, the card flash, the Results winner screen. Use the app's own `styles.css` classes and markup.
- Copy that must appear verbatim:
  - Wesla, Resla, Whuck, Puruck and their point values (+2, +1, +3, +2)
  - "Dealership +50", "✓ Called", "✗ Missed", "Tesla", "Cybertruck"
  - cvoogt.github.io/esla-game

## Creative Direction
- Tone preset: default
- Creative direction: deadpan sports scoring for a backseat game
- Interpretation: punchy and clean. The rules are stated flatly so the names carry the humor.
- Angle: the rulebook is the joke. Its real call names and points are presented like an official sport, then the app keeps score live.
- Hook: the four call names slam in on beats, then "Spot a Tesla. Call it out."
- Outro / punchline: "Every phone in the car. Scored live." + the Final screen with Dad's trophy
- Avoid: generic SaaS language, abstract filler visuals, redesigning the app

## Visual Identity
- Background: #0b0d12
- Text: #f1f3f7
- Accent: #e31937
- Display font: Inter (bundled) 800–900, standing in for the app's system SF stack
- Body font: Inter
- Visual references: public/icon.svg (red arc + E), the card and score sheet styles in src/styles.css

## Storyboard
Use the storyboard in `brag-plan.md` as the creative contract.
1. Hook — 4.25s — four call names on beats, then the hook line
2. Reveal — 3.0s — phone in, ESLA + tagline
3. Call it — 4.0s — Whuck +3 flow
4. Miss it — 3.0s — Missed Whuck −3 flow
5. Jackpot — 3.0s — Dealership +50, re-rank
6. Outro — 4.25s — Final screen, icon, line, URL

## Audio
- Audio role: warm upbeat bed + motion-matched UI accents
- Audio arc: impacts on the hook, the groove under the demo, the lift at the +50, a fade under the end
- Music: assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3, data-media-start 0.27
- Music treatment: volume 0.34, fade in 0.2s, fade out 1.0s
- Music cue guidance: preset JSON in the brag skill `assets/music/cues/`. Video beat grid is 0.25 + 0.5k. Strong cue locked at 15.75s (dealership payoff).
- Audio-reactive treatment: subtle. Per-frame low-band RMS from the track (extracted with ffmpeg + numpy, embedded as an array) drives the glow behind the phone.
- Audio-coupled moments: hook words (impactSoft_medium ×4, rotated), phone entrance (card-slide-1), taps (click_002/003/005 rotated), +3 (bong_001), −3 (error_005), +50 (impactBell_heavy_000), push to Final (card-slide-3)
- SFX analysis guidance: brag skill `assets/sfx-guide/sfx-analysis.md`. Prefer low-HF-risk files for repeated taps.
- Audio files: copied into `composition/assets/`

## Hyperframes Instructions
Installed Hyperframes 0.8.185 ships one consolidated `hyperframes` skill and `hyperframes-cli`, not the five separate domain skills, so their guidance is followed directly. GSAP is vendored locally (the CDN is blocked here). Run `hyperframes check` before render.
