# Brag Plan: Esla

## What is this app?
A phone score counter for the road-trip game of spotting Teslas and calling them out by color, with a rulebook where a white Cybertruck is a "Whuck" worth 3 points.

## The angle
The rulebook is the joke, and the video plays it completely straight. The names (Wesla, Resla, Whuck, Puruck) and the point values come word for word from `src/rules.ts`. The video treats them like the official scoring of a real sport, then shows the app keeping score live.

## Hook (first 2-3 seconds)
WESLA, RESLA, WHUCK and PURUCK slam onto a black screen on the beat, each with its color swatch and point value from the app. Then "Spot a Tesla. Call it out." Anyone who has played gets it at once. Anyone who hasn't wants to know what a Whuck is.

## Key moments (the middle)
- **Call it:** tap Maya's card, the score sheet slides up, tap Cybertruck, tap "Whuck +3". The toast reads "Maya: Whuck +3", her card flashes green and the score ticks from 24 to 27.
- **Miss it:** tap Leo, switch to "✗ Missed" (the sheet's top edge turns red and the points go negative), tap Whuck −3. His card flashes red.
- **Jackpot:** tap Dad, tap the gold "🏢 Dealership +50". His score jumps from 21 to 71 and his card climbs over Maya's into first place.

## Outro / punchline
The phone swipes to the Final screen with 🏆 Dad. The left side shows the Esla icon, "Every phone in the car. Scored live." and cvoogt.github.io/esla-game.

## User flow worth showing
Scoreboard → tap a player → score sheet (Tesla/Cybertruck, color grid, Called/Missed, Dealership) → toast, card flash and re-rank → End Game → Final standings with a trophy.

## Tone
- Preset: default
- Creative direction: deadpan sports scoring for a backseat game
- Interpretation: punchy and clean. The copy states the rules flatly and lets the names be funny. Each scene gets one claim, soft transitions, and taps that feel real.

## Format: landscape — 1920x1080
## Duration: 21.5s

## Visual identity (from the project)
- Background: #0b0d12 (`--bg`)
- Accent: #e31937 (`--accent`), plus good #22c55e, bad #ef4444, gold #fbbf24
- Text: #f1f3f7 (`--text`), muted #8a93a6
- Display font: the app uses the system SF stack. The video uses Inter (bundled) at 800–900 weight.
- Body font: Inter
- Strongest visual element: the score sheet's color grid of call names with swatches (round for cars, skewed squares for trucks)

## Share copy (draft)
Our road-trip Tesla-spotting game now has an official scoreboard app. A white Cybertruck is a Whuck (+3), a missed call costs you, and a dealership is +50.

## Audio direction
- Role: warm, upbeat bed with motion-matched UI accents
- Music: bundled `happy-beats-business-moves-vol-1` (120 BPM), entering at 0.27s into the track
- Music treatment: 0.34 volume, short fade in, fade out under the last ~1s
- Music cue guidance: preset `cues/happy-beats-business-moves-vol-1-by-ende-dot-app.music-cues.json`. The offset puts the beat grid at 0.25 + 0.5k s in the video. Strong cue (track 16.02s, where the track lifts) → video 15.75s, locked to the +50 dealership payoff. Hook words go on 4 consecutive beats: 0.25, 0.75, 1.25, 1.75 (accent texture that stays on screen, so the lines hold together after the last one lands).
- Audio-reactive treatment: subtle. The music's low-band RMS makes the red glow behind the phone breathe. No visualizer graphics.
- SFX posture: moderate, motion-matched. Soft impacts on the hook words, a click on every on-screen tap, a slide on the phone entrance and the screen push, a small pop for +3, a comic buzz for the miss, and one bell for +50.
- Audio-coupled moments: hook word slams, the simulated taps, score toasts, the +50 payoff
- Restraint rule: no stacked hits, nothing bright repeated, and only one bell in the whole video

## Storyboard

### Scene 1 — Hook — 4.25s (0–4.25)
WESLA (+2), RESLA (+1), WHUCK (+3) and PURUCK (+2) slam in on beats with their swatches, in a 2×2 grid. At 2.15 "Spot a Tesla. **Call it out.**" rises under them and holds until 4.0 (about 1.5s settled).
Sequential/interaction: yes. The 4 words arrive one per beat and all stay on screen.
Audio intent: punchy, confident opening
Audio-coupled idea: a soft impact on each word
Transition mood: soft. The hook lifts away and the phone slides in → Scene 2

### Scene 2 — Reveal — 3.0s (4.25–7.25)
The phone slides in from the right showing the live scoreboard (Maya 24, Dad 21, Leo 19). On the left: big red "ESLA" and "The score counter for spotting Teslas."
Sequential/interaction: the caption lines stagger in
Audio intent: the groove settles in
Audio-coupled idea: a slide sound on the phone entrance
Transition mood: soft → Scene 3

### Scene 3 — Call it — 4.0s (7.25–11.25)
Caption: "CALL IT / White Cybertruck? / That's a Whuck. / +3". Phone: tap Maya → sheet → Cybertruck → Whuck → toast, green flash, 24→27.
Sequential/interaction: yes, three simulated taps
Audio-coupled idea: a click per tap, a pop when the points land
Transition mood: soft → Scene 4

### Scene 4 — Miss it — 3.0s (11.25–14.25)
Caption: "MISS IT / Missed the call? / It costs you. / −3". Phone: tap Leo → ✗ Missed → Cybertruck → Whuck −3 → red flash, 19→16.
Sequential/interaction: yes, four taps
Audio-coupled idea: clicks and a comic error buzz
Transition mood: soft → Scene 5

### Scene 5 — Jackpot — 3.0s (14.25–17.25)
Caption: "JACKPOT / Passed a / dealership? / +50". Phone: tap Dad → Dealership +50 (lands on the 15.75 strong cue) → 21→71, re-ranks to 1st.
Audio-coupled idea: one bell on the payoff
Transition mood: push → Scene 6

### Scene 6 — Outro — 4.25s (17.25–21.5)
The phone pushes to the Final screen (🏆 Dad, medals 71 / 27 / 16). Caption: the Esla icon, "Every phone / in the car. / Scored live." and cvoogt.github.io/esla-game.
Audio intent: the groove carries to the end, then fades under the last second

**Music mood for this video:** upbeat
**Audio summary:** Beat-locked impacts open the video, the bed settles as the app appears, UI clicks follow every tap, and the track's lift lands exactly on the +50 bell.

## Privacy note
Player names (Maya, Dad, Leo), scores and the game date are fictional stand-ins. No real user data appears.
