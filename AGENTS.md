# Repository Guidelines

## Project Structure & Module Organization
This is a TypeScript + Vite browser game. Keep gameplay logic in `src/game/` and UI bootstrap code in `src/main.ts`.

- `src/main.ts`: app startup, DOM wiring, game lifecycle hooks
- `src/game/*.ts`: game loop, state transitions, rendering, input, storage, config, shared types
- `src/styles.css`: global styles
- `tests/*.test.ts`: unit tests for pure logic and helpers
- `dist/`: production build output (generated)

Prefer adding new game mechanics in `src/game/state.ts` (pure transitions) before integrating in `src/game/Game.ts` (runtime orchestration).

## Build, Test, and Development Commands
Use npm scripts from `package.json`:

- `npm run dev`: start local Vite dev server with hot reload
- `npm test`: run unit tests once with Vitest (`vitest run`)
- `npm run build`: run TypeScript checks (`tsc --noEmit`) and produce production assets
- `npm run preview`: serve the built app locally from `dist/`

Typical local flow: `npm run dev` during development, then `npm test && npm run build` before opening a PR.

## Coding Style & Naming Conventions
Follow existing TypeScript style:

- 2-space indentation, semicolons, and double-quoted imports/strings
- `PascalCase` for classes/types (`Game`, `GameState`)
- `camelCase` for functions/variables (`computeDifficulty`, `roundStartMs`)
- Keep modules focused and small; prefer named exports for utilities

TypeScript is configured with `"strict": true` in `tsconfig.json`; new code should pass strict type checks without `any` unless justified.

## Testing Guidelines
Vitest is configured in `vite.config.ts` with `tests/**/*.test.ts`.

- Name test files `*.test.ts`
- Group tests with `describe(...)` by function or module
- Cover deterministic game-state transitions and storage edge cases

For bug fixes, add a failing test first when practical, then implement the fix.

## Commit & Pull Request Guidelines
Recent commits use short imperative subjects (for example: `Add readme`, `Make mole hide instead of disappearing`). Follow that pattern:

- Keep commit titles concise, imperative, and scoped to one change
- In PRs, include: what changed, why, and how it was validated (`npm test`, `npm run build`)
- Link related issues and include UI screenshots/GIFs for visual changes
