# Whack-a-Mole (TypeScript)

A browser-based whack-a-mole game built with TypeScript, Vite, and Canvas.

## Features
- 60-second round timer
- Progressive difficulty over time
- Multiple simultaneous moles (up to 3)
- Smooth mole hide animation (moles sink down instead of disappearing instantly)
- Hittable moles during hide state (each mole can award at most one point)
- Best score persisted in `localStorage`
- Unit tests for core game state and storage logic

## Tech Stack
- TypeScript
- Vite
- HTML Canvas
- Vitest

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open the local Vite URL shown in the terminal.

## Scripts
- `npm run dev` - Start local development server
- `npm run build` - Type-check and build production assets
- `npm run preview` - Preview the production build locally
- `npm test` - Run unit tests

## Gameplay Rules
- Click or tap visible moles to score points.
- You get `+1` per mole hit.
- Misses do not reduce score.
- Moles can be hit while hiding, but a single mole can only score once.
- Round length is 60 seconds.

## Difficulty Behavior
- Concurrent mole cap ramps by elapsed time:
  - `0s-19.999s`: up to 1 mole
  - `20s-39.999s`: up to 2 moles
  - `40s-60s`: up to 3 moles
- Spawn cadence and visible duration speed up as the round progresses (clamped to minimum values).

## Project Structure
```text
src/
  main.ts              App bootstrap and UI wiring
  styles.css           App styling
  game/
    Game.ts            Main game loop and orchestration
    config.ts          Gameplay tuning constants
    state.ts           Pure state/lifecycle transitions
    renderer.ts        Canvas rendering
    input.ts           Pointer/touch hit detection
    moleMotion.ts      Mole hide progress and position math
    random.ts          Random helpers
    storage.ts         Best score persistence
    types.ts           Shared game types
tests/
  state.test.ts        State/lifecycle tests
  storage.test.ts      Storage tests
```

## Tuning
Edit `src/game/config.ts` to adjust gameplay values such as:
- round duration
- hide durations
- spawn delay ranges
- difficulty step timing

