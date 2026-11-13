import type { Container } from "pixi.js";

import { clamp } from "../core/math";
import { WORLD, ZOOM_MAX, ZOOM_MIN } from "../world/world";

export interface CameraTarget {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * A follow camera with a dead zone, a little look-ahead and a smooth zoom.
 * The camera stores the world point at the center of the screen.
 */
export class Camera {
  x = WORLD.width / 2;
  y = WORLD.height / 2;
  zoom = 1;
  targetZoom = 1;

  private viewportWidth = 1;
  private viewportHeight = 1;

  setViewport(width: number, height: number): void {
    this.viewportWidth = Math.max(1, width);
    this.viewportHeight = Math.max(1, height);
    this.clampToWorld();
  }

  snapTo(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.clampToWorld();
  }

  update(dt: number, target: CameraTarget): void {
    const zoomEase = 1 - Math.exp(-7 * dt);
    this.zoom += (this.targetZoom - this.zoom) * zoomEase;
    this.zoom = clamp(this.zoom, ZOOM_MIN, ZOOM_MAX);

    const halfWidth = this.viewportWidth / (2 * this.zoom);
    const halfHeight = this.viewportHeight / (2 * this.zoom);

    // Keep the fish inside a calm central box; only chase once it leaves.
    const zoneX = halfWidth * 0.17;
    const zoneY = halfHeight * 0.14;

    // Looking a little ahead of the fish reveals where it is heading.
    const focusX = target.x + target.vx * 0.55;
    const focusY = target.y + target.vy * 0.4;

    let desiredX = this.x;
    let desiredY = this.y;

    const offsetX = focusX - this.x;
    if (offsetX > zoneX) desiredX = focusX - zoneX;
    else if (offsetX < -zoneX) desiredX = focusX + zoneX;

    const offsetY = focusY - this.y;
    if (offsetY > zoneY) desiredY = focusY - zoneY;
    else if (offsetY < -zoneY) desiredY = focusY + zoneY;

    const followEase = 1 - Math.exp(-3.4 * dt);
    this.x += (desiredX - this.x) * followEase;
    this.y += (desiredY - this.y) * followEase;

    this.clampToWorld();
  }

  apply(world: Container): void {
    world.scale.set(this.zoom);
    world.position.set(
      this.viewportWidth / 2 - this.x * this.zoom,
      this.viewportHeight / 2 - this.y * this.zoom,
    );
  }

  screenToWorld(screenX: number, screenY: number): { x: number; y: number } {
    return {
      x: this.x + (screenX - this.viewportWidth / 2) / this.zoom,
      y: this.y + (screenY - this.viewportHeight / 2) / this.zoom,
    };
  }

  private clampToWorld(): void {
    const halfWidth = this.viewportWidth / (2 * this.zoom);
    const halfHeight = this.viewportHeight / (2 * this.zoom);

    if (halfWidth * 2 >= WORLD.width) {
      this.x = WORLD.width / 2;
    } else {
      this.x = clamp(this.x, halfWidth, WORLD.width - halfWidth);
    }

    if (halfHeight * 2 >= WORLD.height) {
      this.y = WORLD.height / 2;
    } else {
      this.y = clamp(this.y, halfHeight, WORLD.height - halfHeight);
    }
  }
}
