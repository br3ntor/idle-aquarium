import { Container, Graphics, Text } from "pixi.js";

import { palette } from "../content/palette";
import type { Fish } from "./Fish";

const CANONICAL_LENGTH = 118;

/**
 * The visual half of a fish. It reads simulation state from `Fish` and only
 * animates transforms, so no geometry is rebuilt during the frame loop.
 */
export class FishView extends Container {
  private readonly fish: Fish;
  private readonly visual = new Container();
  private readonly tail = new Container();
  private readonly pectoral = new Graphics();
  private readonly ring: Graphics | null;
  private readonly tag: Container | null;
  private readonly scaleFactor: number;

  constructor(fish: Fish, label?: string) {
    super();
    this.fish = fish;
    this.scaleFactor = fish.species.length / CANONICAL_LENGTH;
    this.visual.scale.set(this.scaleFactor);
    this.addChild(this.visual);

    const species = fish.species;
    const girth = species.girth;

    this.ring = fish.isPlayer
      ? new Graphics()
          .ellipse(0, 0, 55, 32)
          .stroke({ width: 1.6, color: palette.ring, alpha: 0.28 })
      : null;
    if (this.ring) this.visual.addChild(this.ring);

    const backFin = new Graphics()
      .poly([-20, -16 * girth, -5, -35 * girth, 15, -14 * girth])
      .fill({ color: species.fin, alpha: 0.95 })
      .poly([-16, 14 * girth, -4, 30 * girth, 10, 13 * girth])
      .fill({ color: species.fin, alpha: 0.75 });
    this.visual.addChild(backFin);

    this.tail.position.set(-34, 0);
    this.tail.scale.set(species.tail, 1);
    const tailShape = new Graphics()
      .moveTo(0, 0)
      .quadraticCurveTo(-16, -18, -42, -26)
      .quadraticCurveTo(-30, -8, -26, 0)
      .quadraticCurveTo(-30, 8, -42, 26)
      .quadraticCurveTo(-16, 18, 0, 0)
      .closePath()
      .fill(species.fin);
    this.tail.addChild(tailShape);
    this.visual.addChild(this.tail);

    const body = new Graphics()
      .ellipse(0, 0, 42, 21 * girth)
      .fill(species.body)
      .ellipse(2, 5 * girth, 31, 10 * girth)
      .fill({ color: species.belly, alpha: 0.58 })
      .ellipse(-7, -8 * girth, 22, 5.5 * girth)
      .fill({ color: palette.white, alpha: 0.07 });
    this.visual.addChild(body);

    this.pectoral.ellipse(0, 0, 14, 6).fill({ color: species.fin, alpha: 0.9 });
    this.pectoral.position.set(7, 9 * girth);
    this.pectoral.rotation = 0.32;
    this.visual.addChild(this.pectoral);

    const detail = new Graphics()
      .moveTo(24, -12 * girth)
      .quadraticCurveTo(18, 0, 24, 12 * girth)
      .stroke({ width: 1.2, color: species.accent, alpha: 0.35 });
    this.visual.addChild(detail);

    const eye = new Graphics()
      .circle(29, -7 * girth, 4.3)
      .fill(palette.cream)
      .circle(30.2, -7 * girth, 2.2)
      .fill(palette.eye)
      .circle(29.3, -8 * girth, 0.9)
      .fill({ color: palette.white, alpha: 0.85 });
    this.visual.addChild(eye);

    this.tag = label ? this.createTag(label) : null;
    if (this.tag) this.addChild(this.tag);

    this.update(0);
  }

  update(time: number): void {
    const fish = this.fish;
    this.position.set(
      fish.x,
      fish.y + Math.sin(time * 1.15 + fish.phase) * 1.6,
    );

    // Mirroring the art reverses x, so left-facing fish rotate by heading + PI
    // to keep the nose on the target and the belly down.
    const facing = Math.cos(fish.heading) >= 0 ? 1 : -1;
    this.visual.scale.set(this.scaleFactor * facing, this.scaleFactor);
    this.visual.rotation =
      facing === 1 ? fish.heading : fish.heading + Math.PI;

    const speedRatio = Math.min(1.8, fish.speed / fish.species.speed);
    const beatSpeed = 4.2 + speedRatio * 4.8;
    const beat = Math.sin(time * beatSpeed + fish.phase);
    this.tail.rotation = beat * (0.18 + speedRatio * 0.16);
    this.pectoral.rotation =
      0.32 + Math.sin(time * beatSpeed * 0.8 + fish.phase + 1.2) * 0.14;

    if (this.ring) {
      this.ring.alpha = 0.24 + Math.sin(time * 1.25 + fish.phase) * 0.06;
    }
  }

  private createTag(label: string): Container {
    const tag = new Container();
    const text = new Text({
      text: label,
      style: {
        fontFamily:
          "system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        fontSize: 11,
        fontWeight: "600",
        fill: palette.tagText,
        letterSpacing: 0.35,
      },
    });
    text.anchor.set(0.5);

    const width = text.width + 16;
    const background = new Graphics()
      .roundRect(-width / 2, -9, width, 18, 9)
      .fill({ color: palette.tagBg, alpha: 0.5 })
      .stroke({ width: 1, color: palette.ring, alpha: 0.12 });

    tag.addChild(background, text);
    tag.y = -(this.fish.species.length * 0.45 + 16);
    tag.alpha = 0.9;
    return tag;
  }
}
