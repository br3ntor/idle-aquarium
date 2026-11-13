import { Application } from "pixi.js";

import { Game } from "./game/Game";

async function start(): Promise<void> {
  const app = new Application();
  const resolution = Math.min(
    window.devicePixelRatio || 1,
    window.innerWidth < 700 ? 1.5 : 2,
  );

  await app.init({
    background: "#04293a",
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution,
  });

  const container = document.getElementById("pixi-container");
  if (!container) {
    throw new Error("Expected #pixi-container element");
  }

  container.appendChild(app.canvas);

  const game = new Game(app);
  game.start();

  // A handle for poking at the tank from the browser console.
  (window as Window & { __aquarium?: unknown }).__aquarium = { app, game };
}

void start().catch((error: unknown) => {
  console.error("Failed to start the aquarium", error);
});
