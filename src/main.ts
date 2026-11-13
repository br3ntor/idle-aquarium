import { Application } from "pixi.js";

const app = new Application();

await app.init({
  background: "#082f49",
  resizeTo: window,
  antialias: true,
});

const container = document.getElementById("pixi-container");

if (!container) {
  throw new Error("Expected #pixi-container element");
}

container.appendChild(app.canvas);
