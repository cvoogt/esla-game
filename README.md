# Esla Game

Score counter for the Esla game. See [PLAN.md](PLAN.md) for the rules and roadmap.
Live at https://cvoogt.github.io/esla-game/ (deploys on every push to `main`).

```sh
npm install
npm test               # scoring tests
npm run emulators      # local Firebase (needs Java), in one terminal
npm run dev:emulator   # app against the local emulators, in another
npm run dev            # app against the real Firebase project
npm run deploy:rules   # publish firestore.rules (needs `npx firebase login`)
```
