# Esla Game — Plan

A score counter for the Esla game: spot Teslas while driving, call them out, score points.
Installed as a web app on the iPhone home screen. Multiple players score from their own phones,
with accounts and lifetime stats.

## Scoring rules

### Cars
| Color  | Call    | Points |
|--------|---------|--------|
| White  | Wesla   | 2 |
| Grey   | Gresla  | 1 |
| Black  | Blesla  | 1 |
| Blue   | Blusla  | 1 |
| Silver | Sesla   | 1 |
| Red    | Resla   | 1 |
| Pink   | Pesla   | 1 |
| Purple | Puresla | 1 |

### Cybertrucks
| Color              | Call   | Points |
|--------------------|--------|--------|
| White              | Whuck  | 3 |
| Grey               | Gruck  | 2 |
| Black              | Bluck  | 2 |
| Blue               | Blueck | 2 |
| Pink               | Puck   | 2 |
| Purple             | Puruck | 2 |
| Bare stainless     | Suck   | 2 |
| Red                | Ruck   | 2 |

### Specials and modifiers
- **Gas station ×2:** doubles any sighting, including custom ones. Doesn't apply to dealerships.
- **Dealership:** +50.
- **Custom:** a name and a point value you enter. Saved as a reusable button for later games.
- **Missed call:** the player who missed it loses that sighting's value (e.g. a missed Whuck is −3).
  ×2 applies to misses too. A custom amount is also allowed. Missed whites don't affect the
  tiebreaker counts.
- **Manual adjust:** any + or − amount.
- **Simultaneous calls:** both players get the points.
- The same car can't be called twice. Parked cars count.

### Tiebreakers
1. White cars + white Cybertrucks combined
2. White cars
3. White Cybertrucks

### Game end
A player ends the game when they choose (usually when you reach your destination).

## Features
1. **Accounts:** sign in once on each phone.
2. **New game:** add players, then share a join code or QR so others can join from their phones.
   Guests without accounts can also be added. Anyone in the game can score for anyone.
3. **Scoreboard:** large player cards sorted by rank, showing the score and white car/truck counts.
   Updates live on every phone.
4. **Score sheet:** tap a player, then Car / Cybertruck, then a color. Also: ×2 toggle, Dealership,
   Custom, Missed, and Adjust buttons.
5. **Log + Undo:** a timestamped feed of every entry that can be undone.
6. **End game:** final standings with tiebreakers applied. Saved to history, and can still be edited.
7. **Lifetime stats (friends leaderboard):** games played, wins, total points, white counts, best game, and favorite call.
8. **Feedback:** a sound when points are scored (see the iPhone notes for vibration).
9. **Car-friendly UI:** big tap targets, dark mode, screen stays awake, and it keeps working
   without signal.

## Tech
- **Frontend:** React + TypeScript (Vite), set up as a PWA (installable, works offline).
- **Backend:** Firebase on the free plan.
  - Auth for accounts.
  - Firestore database: real-time sync across phones and **built-in offline queueing**. Scores
    entered in a dead zone sync once signal returns.
  - Chosen over Supabase because Supabase's free tier pauses projects after about 7 days of
    inactivity, which would bite between road trips.
- **Hosting:** GitHub Pages, deployed automatically on every push to `main` (free, HTTPS, which
  iPhone home-screen apps need).

### Data model (draft)
- `users/{uid}`: display name, saved custom sightings
- `games/{gameId}`: status, players, member uids, created/ended times, final results summary
- `games/{gameId}/events/{eventId}`: player, type, color, multiplier, points, created by, time
  (scores are always computed from events, so Undo just deletes an event)

## iPhone notes
- **Vibration:** iPhone Safari doesn't support the web vibration API. There's a workaround that
  produces a light tap on iOS 18+, but it's unreliable. Plan: sound plus a screen flash, with the
  tap as a bonus where it works.
- **Sound** is muted when the phone's silent switch is on.
- **Sign-in:** email + password. (Email magic links open in Safari, not the home-screen app, so
  they're avoided.)
- **Keep screen awake** works on iOS 16.4+.

## Build order
1. Local-only game: setup, scoring, log/undo, end game (playable on one phone)
2. PWA install + offline
3. Firebase accounts + shared live games + join code
4. History + lifetime stats
5. Sound/feedback polish

## Status
- [x] Step 1: local game on one phone (setup, scoring, ×2, missed, dealership, custom, adjust,
  log/undo, end game, tiebreakers, history, local leaderboard, sound + haptic tap)
- [x] Step 2: PWA install + offline
- [x] Step 3: Firebase accounts + shared live games (players with accounts are added from a
  friends list instead of a join code, so their phones open the game automatically)
- [x] Step 4: lifetime stats in the cloud (friends leaderboard of everyone with an account)
- [ ] Live on GitHub Pages: https://cvoogt.github.io/esla-game/
