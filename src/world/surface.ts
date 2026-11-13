import { Container, FillGradient, Graphics, TilingSprite } from "pixi.js";

import { palette } from "../content/palette";
import { mulberry32, randomBetween } from "../core/random";
import { createSurfaceTexture } from "../render/textures";
import { WORLD } from "./world";

interface SurfaceBubble {
  view: Graphics;
  x: number;
  speed: number;
  phase: number;
}

/**
 * World-space waterline. At a wide zoom this gives the tank a real top edge:
 * a bright surface, drifting shimmer and a thin stream of rising bubbles.
 */
export class WaterSurface {
  readonly root = new Container();

  private readonly shimmer: TilingSprite;
  private readonly bubbles: SurfaceBubble[] = [];

  constructor() {
    const random = mulberry32(0x4f19b2);

    this.shimmer = new TilingSprite({
      texture: createSurfaceTexture(0x8f31a4),
      width: WORLD.width,
      height: 110,
    });
    this.shimmer.blendMode = "add";
    this.shimmer.alpha = 0.36;
    this.shimmer.tileScale.set(1.7, 1);

    const glowGradient = new FillGradient({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: "#c9f6ff5a" },
        { offset: 0.4, color: "#9cecff1c" },
        { offset: 1, color: "#9cecff00" },
      ],
    });
    const glow = new Graphics().rect(0, 0, WORLD.width, 42).fill(glowGradient);
    const waterline = new Graphics()
      .rect(0, 0, WORLD.width, 2.5)
      .fill({ color: palette.surfaceGlow, alpha: 0.34 });

    this.root.addChild(glow, this.shimmer, waterline);

    for (let i = 0; i < 58; i += 1) {
      const radius = randomBetween(random, 1.8, 5.8);
      const view = new Graphics()
        .circle(0, 0, radius)
        .fill({ color: palette.bubble, alpha: 0.04 })
        .stroke({ width: 0.9, color: palette.bubble, alpha: 0.3 })
        .circle(-radius * 0.24, -radius * 0.24, radius * 0.2)
        .fill({ color: palette.white, alpha: 0.38 });

      const bubble: SurfaceBubble = {
        view,
        x:
          random() < 0.45
            ? WORLD.width * 0.5 + randomBetween(random, -280, 280)
            : randomBetween(random, 40, WORLD.width - 40),
        speed: randomBetween(random, 22, 58),
        phase: random() * 150,
      };

      this.root.addChild(view);
      this.bubbles.push(bubble);
    }
  }

  update(time: number): void {
    this.shimmer.tilePosition.set(time * 7.5, time * 0.8);
    this.shimmer.alpha = 0.32 + Math.sin(time * 0.21) * 0.05;

    for (const bubble of this.bubbles) {
      const cycle = (time * bubble.speed + bubble.phase) % 150;
      const y = 142 - cycle;
      bubble.view.position.set(
        bubble.x + Math.sin(time * 0.8 + bubble.phase) * 5,
        y,
      );
      bubble.view.alpha = Math.min(1, Math.min(y / 24, (142 - y) / 28));
    }
  }
}
