# Photorealism plan

Goal: move the tank from a flat-vector look toward a photoreal planted
community aquarium like the reference frame, while keeping the simulation and
rendering split intact.

The reference is a full-tank composition: waterline, deep blue water column,
dense layered planting, dark hardscape, warm gravel, and a mixed fish cast.
Our current tank is a sparse mid-water slice with one fish body plan.

## Decisions

- **Direction:** photorealism-adjacent first, true photorealism only where the
  cost is justified. Generated textures are preferred over hand-drawn vector
  fill; image assets are allowed later if procedural detail plateaus.
- **Camera:** keep the current follow camera for now. Manual zoom-out already
  gives a full-tank view; a dedicated showcase camera is a later option.
- **Rendering:** keep the fixed 60 Hz simulation and stable Pixi geometry.
  Textures and post effects live on the render side; `Fish` stays Pixi-free.
- **Scope:** one milestone per session where possible. Each milestone should
  leave the build green and the tank visibly better.

## Visual targets

1. Deep navy/near-black water, bright surface, warm light, strong vignette.
2. Dense but composed planting: red stems, green stems, broad leaves, carpet,
   moss, dark driftwood; open swimming lane in the middle.
3. Textured substrate and hardscape, not flat sand and polygons.
4. Community fish cast: goldfish, angelfish, betta, tetras, guppies, loaches;
   different silhouettes, patterns, sizes and schools.
5. Photographic light: caustics, surface shimmer, bubble column, specular
   highlights, soft background, bloom and depth of field.

## Milestones

### M0 — Rendering foundation

- [x] Add procedural canvas texture utilities (gravel, caustics, surface, noise).
- [x] Overhaul palette to deep water, warm substrate, saturated greens and reds.
- [x] Rework backdrop: depth gradient, vignette, surface shimmer, caustics,
      subtler light rays.
- [x] Texture the substrate with generated gravel.
- [x] Add post-processing: bloom on the stage and depth blur on the far plants.
- [x] Add live tuning controls for bloom and depth blur.
- [x] Verify with `pnpm build` and a browser at 1280×720 and 1920×1080.

### M1 — Water, light and air

- [x] Surface waterline with animated ripples and bubble column.
- [ ] Caustic light patches on the substrate and hardscape.
- [x] More suspended motes, a few bokeh highlights, subtle grain overlay.
- [x] Tune ray positions and bloom so highlights don't wash out the tank.
- [ ] Add glass-edge hints and a slightly warmer key light.

### M2 — Hardscape and substrate

- [x] Hero hardscape: dark driftwood/boulder mass with moss.
- [x] Replace flat rock polygons with layered, textured rock clusters.
- [x] Pebble bed with larger river stones and dark soil pockets.
- [x] Composition zones: red plants left, swords right, open center.
- [ ] Reuse generated textures for rock and wood where it helps. (rocks done,
      driftwood still a simple stroke)

### M3 — Planted tank

- [x] Plant archetypes: stem (green/red), sword/rosette, carpet, moss,
      arching/floating leaves. (moss currently only on rock surfaces)
- [ ] Split `world/scenery.ts` into plant and hardscape builders; keep
      `Scenery` as the composition root.
- [x] Layer far/mid/near with different contrast and blur.
- [x] Increase density 2–3×, clustered rather than uniform.
- [x] Replace the coral clusters with red stem plants.

### M4 — Fish cast and materials

- [x] Extend species data with shape, pattern, fin style, depth band and spawn
      group.
- [x] Add fancy goldfish, angelfish, betta, neon tetra school, guppy, zebra
      loach and platy.
- [x] Add schools plus a few hero fish instead of uniform random spawns.
- [ ] Fish materials: rim light, specular highlight, softer fins, subtle
      shadow, pattern masks where affordable. (scales and rim light are in;
      fish are still vector, not photographic)
- [x] Keep the player identifiable (ring or species color).

### M5 — Camera, depth and grade

- [ ] Optional showcase/idle camera that fits the full tank.
- [ ] Real depth-of-field or tilt-shift pass if the layer blur isn't enough.
- [ ] Color grade: contrast, saturation, vignette and bloom tune.
- [ ] Performance pass: draw calls, filter areas, culling, mobile.

### M6 — Image assets if needed

- [ ] Decide whether generated textures are enough.
- [ ] If not, add painted/AI-generated background plates, plant sprites,
      rock atlases or normal maps.
- [ ] Keep layers parallax-friendly so the camera can still move.
- [ ] Document asset licensing and regeneration steps.

## Technical notes

- Generate textures on a canvas once, wrap them in `Texture`, and reuse them.
  Do not regenerate textures per frame.
- Prefer `TilingSprite` for animated caustics and surface shimmer; animate
  `tilePosition`, not geometry.
- Keep the far-plant blur filter area limited to the camera viewport in world
  coordinates. A world-sized filter texture is too expensive.
- Do not apply full-screen filters at device resolution without measuring.
  Bloom and DOF are tuning targets, not defaults to maximize.
- Keep blend-mode groups together (`normal` then `add`) to reduce batch breaks.
- Use the seeded PRNG for tank content. `Math.random()` is for ephemeral
  effects only.
- Stable geometry: no per-frame `Graphics.clear()`, no per-frame `zIndex`
  churn. No Pixi imports in `Fish.ts`.
- Browser verification is required for feel/rendering changes. `pnpm build`
  checks lint, types and bundling, not the picture.

## Current state

- World: 3200×1800, 16:9, floor at 1570.
- Camera: follow with dead zone; zoom 0.6–1.5. At 1920×1080 and zoom 0.6 the
  whole world fits on screen, which is the current full-tank view.
- Scenery: generated stem, sword and grass sprites in three depth layers;
  ~120 plant sprites, 11 rocks, a hero rock/driftwood cluster, generated gravel
  and rock textures.
- Fish: 7 species/archetypes (goldfish, angelfish, betta, neon tetra, guppy,
  loach, platy), 28 ambient fish plus the player.
- Atmosphere: world-space waterline and bubble column, screen-space caustics,
  grain, vignette, bloom and far-layer depth blur.
- Render: `PostFX` owns the bloom filter; `Scenery` owns the far-layer
  `BlurFilter` and keeps its filter area viewport-sized.

## Known gaps

- Fish are still procedural vector art. They read as a stylized community tank,
  not a photograph. This is the biggest remaining realism gap.
- Angelfish and betta silhouettes are improved but still graphic.
- Driftwood is a simple stroked branch; rocks are textured but still faceted.
- Surface shimmer is subtle; the waterline is only visible at wide zoom.
- Performance has only been checked in headless Chromium, where frame pacing
  is unreliable. Measure in a real browser before locking the effect budget.

## Session log

### 2026-11-13 — M0 complete, M1–M4 first pass

- Installed `pixi-filters@6.1.5` for bloom.
- Added generated canvas textures: gravel, caustics, surface, rock, grain and
  vignette (`src/render/textures.ts`, `src/render/canvas.ts`).
- Added generated plant sprites: two stem green variants, two red variants,
  two sword variants and two grass variants (`src/render/plantTextures.ts`).
- Rebuilt the tank dressing around textured plant sprites, three depth layers,
  red plant accents, a hero hardscape and a gravel bed
  (`src/world/scenery.ts`).
- Added `src/world/surface.ts`: world-space waterline, shimmer and bubble
  stream.
- Added `src/render/postfx.ts`: full-screen bloom and far-layer depth blur with
  viewport-limited filter areas.
- Extended `FishSpecies` with shape, pattern, tail style, depth band, spawn
  weight and population cap; replaced the old palette with a community cast
  (`src/content/species.ts`).
- Reworked `FishView` for goldfish, angelfish, betta, tetra, guppy and loach
  silhouettes, patterns, scales, larger fins and animated tails
  (`src/fish/FishView.ts`).
- Added population caps and school clustering to ambient spawning
  (`src/game/Game.ts`).
- Added Bloom and Depth blur controls to the tuning panel.
- Next: decide whether fish get generated raster sprites/AI assets or stay
  vector. Then improve driftwood, caustic patches, glass edges and a real
  performance pass.
