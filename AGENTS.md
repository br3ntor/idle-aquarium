# AGENTS.md

Single-package PixiJS v8 game (TypeScript, Vite 8). `README.md` has the feature
tour and file map; this file covers the things that are easy to get wrong.

## Commands

- `pnpm dev` — Vite dev server at http://localhost:8080 (`server.open` is on).
- `pnpm build` — required verification: `oxlint && tsc && vite build`.
- `pnpm lint` / `pnpm format` — oxlint / oxfmt (80 columns, sorted imports).
- No test suite. For rendering or feel changes, verify in a browser; the build
  only checks lint, types and bundling.
- `pnpm preview` serves the gitignored `dist/` build.

Use Node from `.nvmrc` (26.13.1) and pnpm 12.18.0 (`packageManager`).
`pnpm-workspace.yaml` is not a monorepo; it only exempts two exact package
versions from pnpm's `minimumReleaseAge`, so leave those entries in place.

## Architecture rules

- `src/game/Game.ts` is the composition root: ticker, world layers, camera,
  fish lifecycle and input wiring all meet there. Start there when tracing.
- Keep simulation and rendering separate. `fish/Fish.ts` must not import Pixi;
  `fish/FishView.ts` reads fish state and animates transforms only. Preserve
  this split for future multiplayer snapshots.
- The simulation is fixed 60 Hz (`game/loop.ts`). Animate from `Game.time`;
  do not move fish from raw `ticker.deltaMS`.
- Fish/world logic uses world units. Screen↔world conversion lives in `Camera`
  and `GameInput`; do not leak screen coordinates into `Fish`.
- The world is 3200×1800 (`world/world.ts`), larger than the viewport. The
  camera follows with a dead zone and clamps to the tank edges.
- Fish art faces +X. `FishView` flips `scale.x` and uses
  `rotation = PI - heading` when facing left so the belly stays down.
- Geometry is built once and then transformed. Don't `Graphics.clear()` and
  redraw complex shapes per frame.
- Use the seeded PRNG in `core/random.ts` for deterministic tank content
  (scenery, species choice, spawn positions). `Math.random()` is fine for
  ephemeral effects such as food phases and bubble resets.
- Fish species and colors are data-driven: `content/species.ts`,
  `content/palette.ts`.
- Global CSS is `public/style.css`, linked directly from `index.html`; it is
  not imported by `src/main.ts`.
- `window.__aquarium` is an intentional console/debug handle, not dead code.

## PixiJS notes

- This is PixiJS v8, not v7. Use `await app.init(...)`, shape-then-style
  Graphics (`.rect(...).fill(...)`), and `eventMode`/`pointertap`.
- A repo-local PixiJS skill is tracked in `skills-lock.json` and installed
  under gitignored `.agents/`. Load the `pixijs` skill before rendering work.
- Fish are intentionally not depth-sorted; avoid per-frame `zIndex` churn
  (it marks the render group's structure dirty). Sort rarely and profile.
- The tuning panel is plain DOM above the canvas; canvas input uses native
  pointer/wheel listeners in `game/input.ts`.

## Current scope

Single-player only. No server, netcode, persistence, accounts, tests or image
assets yet. `README.md` describes the planned multiplayer next step.
