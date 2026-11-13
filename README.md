# Idle Aquarium

A quiet, living aquarium rendered with PixiJS (WebGL). The first slice is a
single-player "alive tank": a fish you can nudge around, ambient fish, a world
larger than the screen, and a camera that follows your fish.

## Run it

```bash
pnpm install
pnpm dev
```

Open the URL Vite prints. To check the production build:

```bash
pnpm build
pnpm preview
```

## Try it

- **Move the pointer** — your fish gets curious for a couple of seconds, then
  goes back to wandering.
- **Click** — drop food. Nearby fish may race for it.
- **Scroll** — zoom between 0.6x and 1.5x.
- **H** — show/hide the tuning panel.
- **Space** — pause the simulation.

The panel in the top-right is meant to be played with. Speed, turn rate, zoom
and the number of ambient fish all update live.

## What is implemented

- A 3200 × 1800 world viewed through a camera with a dead zone, look-ahead and
  clamping to the tank edges
- Steering-driven fish: wander, arrive, separation, schooling and soft
  boundary avoidance
- Flat-vector fish built from shapes, with speed-linked tail beats and correct
  facing when swimming left
- Procedural sand, rocks, kelp, coral, bubbles, light rays and floating motes
- Food pellets and ripples as a small shared point of interest
- A fixed 60 Hz simulation loop with render-rate animation
- Live tuning panel and a `window.__aquarium` handle for console experiments

## How it fits together

```
src/
  main.ts             Pixi bootstrap
  game/
    Game.ts           owns the tank, fish, camera and frame loop
    loop.ts           fixed-timestep accumulator
    camera.ts         follow, dead zone, zoom, world clamping
    input.ts          pointer/wheel input converted into world space
  fish/
    Fish.ts           simulation state + steering (no Pixi objects)
    FishView.ts       vector fish + swim animation (reads Fish state)
  world/
    world.ts          tank dimensions and swim bounds
    backdrop.ts       screen-space water gradient and light rays
    scenery.ts        sand, rocks, plants and coral
    ambience.ts       bubbles and motes
    food.ts           food pellets and ripples
  content/
    palette.ts        the shared color palette
    species.ts        data-driven fish species
  ui/
    debug.ts          dependency-free tuning panel
```

Two ideas are worth internalizing because the rest of the project builds on
them:

1. **Simulation state is separate from rendering.** `Fish` knows position,
   velocity and steering. `FishView` only reads that state and animates
   transforms. This is what will make multiplayer snapshots and interpolation
   straightforward later.
2. **World space is separate from screen space.** The world is a large tank;
   the camera is just a transform over it. The pointer is converted from
   screen space to world space before the fish ever sees it.

Geometry is drawn once and then moved or rotated. Avoid clearing and redrawing
`Graphics` every frame unless you actually need new geometry.

## What is deliberately not here yet

- Multiplayer
- Persistence or idle progression
- Accounts, a database or server-side simulation
- Sprite sheets or image assets; everything is procedural vector art

## Likely next step

Multiplayer presence, not economy. Each client owns its own fish, sends its
state around 10 times per second, and a small WebSocket server relays snapshots.
Other clients render those fish about 100–150 ms in the past and interpolate
between snapshots. Fish do not collide or fight, so prediction and rollback are
not needed. Ambient fish can stay local until they affect something shared.
