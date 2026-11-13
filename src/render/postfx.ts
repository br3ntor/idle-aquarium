import { AdvancedBloomFilter } from "pixi-filters/advanced-bloom";
import { Rectangle } from "pixi.js";
import type { Application } from "pixi.js";

/**
 * Full-screen photographic post effects. The filter area is pinned to the
 * viewport; without that Pixi measures the whole panning world.
 */
export class PostFX {
  private readonly bloom = new AdvancedBloomFilter({
    threshold: 0.82,
    bloomScale: 0.18,
    brightness: 1,
    blur: 4,
    quality: 3,
    pixelSize: 1,
  });
  private readonly area = new Rectangle();

  constructor(private readonly app: Application) {
    this.bloom.resolution = "inherit";
    this.app.stage.filters = [this.bloom];
    this.resize(app.screen.width, app.screen.height);
  }

  resize(width: number, height: number): void {
    this.area.set(0, 0, width, height);
    this.app.stage.filterArea = this.area;
  }

  setBloom(strength: number): void {
    this.bloom.bloomScale = strength;
    this.bloom.enabled = strength > 0.001;
  }

  destroy(): void {
    this.app.stage.filters = null;
    this.bloom.destroy();
  }
}
