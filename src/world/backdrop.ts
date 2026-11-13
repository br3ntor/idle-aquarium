import { Container, FillGradient, Graphics } from "pixi.js";

import { palette } from "../content/palette";

interface Ray {
  view: Graphics;
  phase: number;
  swing: number;
}

/**
 * Screen-space water and light. These layers sit behind and in front of the
 * world respectively, so the tank always feels deep no matter where the
 * camera is.
 */
export class Backdrop {
  readonly water = new Container();
  readonly light = new Container();

  private readonly waterGraphic = new Graphics();
  private readonly surfaceGraphic = new Graphics();
  private readonly rays: Ray[] = [];
  private waterGradient: FillGradient | null = null;
  private surfaceGradient: FillGradient | null = null;
  private width = 1;
  private height = 1;

  constructor(width: number, height: number) {
    this.water.addChild(this.waterGraphic, this.surfaceGraphic);
    this.resize(width, height);
  }

  resize(width: number, height: number): void {
    this.width = Math.max(1, width);
    this.height = Math.max(1, height);

    this.waterGraphic.clear();
    this.waterGradient?.destroy();
    this.waterGradient = new FillGradient({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: palette.waterTop },
        { offset: 0.48, color: palette.waterMid },
        { offset: 1, color: palette.waterDeep },
      ],
    });
    this.waterGraphic
      .rect(0, 0, this.width, this.height)
      .fill(this.waterGradient);

    this.surfaceGraphic.clear();
    this.surfaceGradient?.destroy();
    this.surfaceGradient = new FillGradient({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: "#9cecff24" },
        { offset: 0.6, color: "#9cecff08" },
        { offset: 1, color: "#9cecff00" },
      ],
    });
    this.surfaceGraphic
      .rect(0, 0, this.width, Math.min(230, this.height * 0.35))
      .fill(this.surfaceGradient);

    this.buildRays();
  }

  update(time: number): void {
    for (const ray of this.rays) {
      ray.view.x = Math.sin(time * 0.075 + ray.phase) * ray.swing;
      ray.view.alpha = 0.62 + Math.sin(time * 0.11 + ray.phase * 1.7) * 0.38;
    }
  }

  private buildRays(): void {
    for (const ray of this.rays) {
      ray.view.removeFromParent();
      ray.view.destroy();
    }
    this.rays.length = 0;

    const count = 6;
    for (let i = 0; i < count; i += 1) {
      const fraction = (i + 0.5) / count;
      const baseX = this.width * fraction + Math.sin(i * 4.1) * 90;
      const topWidth = 70 + (i % 3) * 38;
      const bottomWidth = topWidth * 2.7;
      const slant = this.height * (0.11 + (i % 2) * 0.035);
      const opacity = 0.028 + (i % 3) * 0.008;

      const view = new Graphics()
        .poly([
          baseX - topWidth / 2,
          -50,
          baseX + topWidth / 2,
          -50,
          baseX + slant + bottomWidth / 2,
          this.height + 50,
          baseX + slant - bottomWidth / 2,
          this.height + 50,
        ])
        .fill({ color: palette.ray, alpha: opacity });
      view.blendMode = "add";
      this.light.addChild(view);

      this.rays.push({
        view,
        phase: i * 1.37,
        swing: 14 + (i % 3) * 9,
      });
    }
  }
}
