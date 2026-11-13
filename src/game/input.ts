import type { Application } from "pixi.js";

import { clamp } from "../core/math";
import type { Camera } from "./camera";

interface InputCallbacks {
  feed(worldX: number, worldY: number): void;
  zoomBy(factor: number): void;
}

/**
 * Raw browser input, converted into world space through the camera. Keeping
 * this outside Pixi's event system is fine for now: the canvas is the only
 * interactive surface and the debug panel is normal HTML.
 */
export class GameInput {
  pointerX = 0;
  pointerY = 0;

  private activeUntil = 0;
  private lastScreenX = 0;
  private lastScreenY = 0;
  private hasPointer = false;

  constructor(
    private readonly app: Application,
    private readonly camera: Camera,
    private readonly callbacks: InputCallbacks,
  ) {
    this.app.canvas.addEventListener("pointermove", this.onPointerMove);
    this.app.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.app.canvas.addEventListener("wheel", this.onWheel, { passive: false });
  }

  isNudgeActive(now: number): boolean {
    return now < this.activeUntil;
  }

  destroy(): void {
    this.app.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.app.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.app.canvas.removeEventListener("wheel", this.onWheel);
  }

  private readonly onPointerMove = (event: PointerEvent): void => {
    const screen = this.toScreen(event);
    const now = performance.now() / 1000;
    const moved =
      !this.hasPointer ||
      Math.hypot(screen.x - this.lastScreenX, screen.y - this.lastScreenY) >
        2.5;

    this.lastScreenX = screen.x;
    this.lastScreenY = screen.y;
    this.hasPointer = true;

    const world = this.camera.screenToWorld(screen.x, screen.y);
    this.pointerX = world.x;
    this.pointerY = world.y;

    if (moved) this.activeUntil = now + 2.2;
  };

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    const screen = this.toScreen(event);
    const now = performance.now() / 1000;
    const world = this.camera.screenToWorld(screen.x, screen.y);

    this.lastScreenX = screen.x;
    this.lastScreenY = screen.y;
    this.hasPointer = true;
    this.pointerX = world.x;
    this.pointerY = world.y;
    this.activeUntil = now + 2.6;
    this.callbacks.feed(world.x, world.y);
  };

  private readonly onWheel = (event: WheelEvent): void => {
    event.preventDefault();
    const factor = Math.exp(-event.deltaY * 0.0012);
    this.callbacks.zoomBy(clamp(factor, 0.5, 2));
  };

  private toScreen(event: PointerEvent): { x: number; y: number } {
    const rect = this.app.canvas.getBoundingClientRect();
    const scaleX = this.app.screen.width / Math.max(1, rect.width);
    const scaleY = this.app.screen.height / Math.max(1, rect.height);
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }
}
