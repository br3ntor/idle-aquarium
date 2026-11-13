import { CanvasSource, Texture } from "pixi.js";

/** Bake a 2D canvas into a reusable texture. Call once at startup. */
export function bakeTexture(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
): Texture {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Expected a 2D canvas context");

  draw(context);
  return new Texture({ source: new CanvasSource({ resource: canvas }) });
}
