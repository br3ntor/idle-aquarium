import {
  Container,
  FillGradient,
  Graphics,
  Sprite,
  TilingSprite,
} from "pixi.js";

import { palette } from "../content/palette";
import {
  createCausticTexture,
  createGrainTexture,
  createSurfaceTexture,
  createVignetteTexture,
} from "../render/textures";

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
  private readonly surfaceShimmer: TilingSprite;
  private readonly caustics: TilingSprite;
  private readonly grain: TilingSprite;
  private readonly vignette = new Sprite(createVignetteTexture());
  private readonly rayLayer = new Container();
  private readonly rays: Ray[] = [];
  private waterGradient: FillGradient | null = null;
  private surfaceGradient: FillGradient | null = null;
  private width = 1;
  private height = 1;

  constructor(width: number, height: number) {
    this.surfaceShimmer = new TilingSprite({
      texture: createSurfaceTexture(),
      width,
      height: 1,
    });
    this.surfaceShimmer.blendMode = "add";
    this.surfaceShimmer.alpha = 0.24;

    this.caustics = new TilingSprite({
      texture: createCausticTexture(),
      width,
      height,
    });
    this.caustics.blendMode = "add";
    this.caustics.alpha = 0.11;
    this.caustics.tileScale.set(1.35);

    this.grain = new TilingSprite({
      texture: createGrainTexture(),
      width,
      height,
    });
    this.grain.alpha = 0.035;

    this.water.addChild(
      this.waterGraphic,
      this.surfaceGraphic,
      this.surfaceShimmer,
    );
    this.light.addChild(
      this.caustics,
      this.rayLayer,
      this.vignette,
      this.grain,
    );

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
        { offset: 0.42, color: palette.waterMid },
        { offset: 0.8, color: palette.waterDeep },
        { offset: 1, color: 0x00060a },
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
        { offset: 0, color: "#c9f6ff42" },
        { offset: 0.35, color: "#9cecff18" },
        { offset: 1, color: "#9cecff00" },
      ],
    });
    this.surfaceGraphic
      .rect(0, 0, this.width, Math.min(250, this.height * 0.38))
      .fill(this.surfaceGradient);

    this.surfaceShimmer.width = this.width;
    this.surfaceShimmer.height = Math.min(140, this.height * 0.22);
    this.surfaceShimmer.tileScale.set(1.35, 1);

    this.caustics.width = this.width;
    this.caustics.height = this.height;

    this.grain.width = this.width;
    this.grain.height = this.height;

    this.vignette.width = this.width;
    this.vignette.height = this.height;

    this.buildRays();
  }

  update(time: number): void {
    for (const ray of this.rays) {
      ray.view.x = Math.sin(time * 0.075 + ray.phase) * ray.swing;
      ray.view.alpha = 0.42 + Math.sin(time * 0.11 + ray.phase * 1.7) * 0.22;
    }

    this.surfaceShimmer.tilePosition.set(time * 6.5, time * 1.4);
    this.surfaceShimmer.alpha = 0.21 + Math.sin(time * 0.19) * 0.04;
    this.caustics.tilePosition.set(-time * 8.5, time * 3.2);
    this.caustics.alpha = 0.09 + Math.sin(time * 0.14 + 1.4) * 0.02;
    this.grain.tilePosition.set(time * 1.5, -time * 1.1);
  }

  private buildRays(): void {
    for (const ray of this.rays) {
      ray.view.removeFromParent();
      ray.view.destroy();
    }
    this.rays.length = 0;

    const count = 5;
    for (let i = 0; i < count; i += 1) {
      const fraction = (i + 0.5) / count;
      const baseX = this.width * fraction + Math.sin(i * 4.1) * 100;
      const topWidth = 55 + (i % 3) * 32;
      const bottomWidth = topWidth * 2.5;
      const slant = this.height * (0.1 + (i % 2) * 0.04);
      const opacity = 0.014 + (i % 3) * 0.005;

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
      this.rayLayer.addChild(view);

      this.rays.push({
        view,
        phase: i * 1.37,
        swing: 16 + (i % 3) * 11,
      });
    }
  }
}
