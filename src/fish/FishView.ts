import { Container, Graphics, Text } from "pixi.js";

import { palette } from "../content/palette";
import type { FishSpecies } from "../content/species";
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

    this.ring = fish.isPlayer
      ? new Graphics()
          .ellipse(0, 0, 55, 32)
          .stroke({ width: 1.6, color: palette.ring, alpha: 0.28 })
      : null;
    if (this.ring) this.visual.addChild(this.ring);

    this.build(fish.species);

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
    this.visual.rotation = facing === 1 ? fish.heading : fish.heading + Math.PI;

    const speedRatio = Math.min(1.8, fish.speed / fish.species.speed);
    const beatSpeed = 4.2 + speedRatio * 4.8;
    const beat = Math.sin(time * beatSpeed + fish.phase);
    const flowing =
      fish.species.tailStyle === "veil" ||
      fish.species.shape === "betta" ||
      fish.species.shape === "goldfish"
        ? 0.24
        : 0.17;
    this.tail.rotation = beat * (flowing + speedRatio * 0.12);
    this.pectoral.rotation =
      0.32 + Math.sin(time * beatSpeed * 0.8 + fish.phase + 1.2) * 0.14;

    if (this.ring) {
      this.ring.alpha = 0.24 + Math.sin(time * 1.25 + fish.phase) * 0.06;
    }
  }

  private build(species: FishSpecies): void {
    switch (species.shape ?? "classic") {
      case "goldfish":
        this.buildGoldfish(species);
        break;
      case "angel":
        this.buildAngel(species);
        break;
      case "betta":
        this.buildBetta(species);
        break;
      case "tetra":
        this.buildTetra(species);
        break;
      case "guppy":
        this.buildGuppy(species);
        break;
      case "loach":
        this.buildLoach(species);
        break;
      case "classic":
      default:
        this.buildClassic(species);
        break;
    }
  }

  private buildClassic(species: FishSpecies): void {
    const girth = species.girth;
    const rx = 36;
    const ry = 20 * girth;

    this.addTail(species.tailStyle ?? "round", -30, species);
    this.addFin(
      [-12, -ry * 0.7, -4, -ry * 1.75, 16, -ry * 0.65],
      species.fin,
      0.9,
    );
    this.addFin(
      [-10, ry * 0.65, -2, ry * 1.55, 14, ry * 0.55],
      species.fin,
      0.75,
    );

    this.addEllipseBody(rx, ry, species);
    this.addPattern(rx, ry, species);
    this.addPectoral(8, ry * 0.5, 12, 5, species);
    this.addEye(rx * 0.68, -ry * 0.34, 4.1);
    this.addMouth(rx * 0.96, 0);
  }

  private buildGoldfish(species: FishSpecies): void {
    const girth = species.girth;
    const rx = 40;
    const ry = 25 * girth;

    this.addTail("veil", -32, species);
    this.addFin(
      [-14, -ry * 0.72, -4, -ry * 1.68, 18, -ry * 0.68],
      species.fin,
      0.9,
    );
    this.addFin(
      [-9, ry * 0.62, 1, ry * 1.55, 19, ry * 0.52],
      species.fin,
      0.78,
    );

    this.addEllipseBody(rx, ry, species);
    this.addScales(rx, ry);
    this.addPattern(rx, ry, species);
    this.addPectoral(9, ry * 0.52, 16, 6.5, species);
    this.addEye(rx * 0.68, -ry * 0.32, 4.4);
    this.addMouth(rx * 0.95, 1);
  }

  private buildAngel(species: FishSpecies): void {
    const height = 34 * species.girth;
    const width = 34;

    this.addTail("fan", -width * 0.8, species);
    this.addFin(
      [
        -width * 0.45,
        -height * 0.45,
        -width * 0.32,
        -height * 1.25,
        width * 0.05,
        -height * 1.35,
        width * 0.2,
        -height * 0.5,
      ],
      species.fin,
      0.82,
    );
    this.addFin(
      [
        -width * 0.45,
        height * 0.45,
        -width * 0.3,
        height * 1.25,
        width * 0.08,
        height * 1.3,
        width * 0.2,
        height * 0.5,
      ],
      species.fin,
      0.72,
    );

    // The long thread-like pelvic fins are the angel's signature.
    this.addFin(
      [
        width * 0.08,
        height * 0.5,
        -width * 0.05,
        height * 1.4,
        width * 0.02,
        height * 1.5,
        width * 0.16,
        height * 0.55,
      ],
      species.fin,
      0.55,
    );

    const body = new Graphics()
      .moveTo(width, 0)
      .bezierCurveTo(
        width * 0.64,
        -height * 0.3,
        width * 0.28,
        -height * 0.9,
        0,
        -height,
      )
      .bezierCurveTo(
        -width * 0.3,
        -height * 0.92,
        -width * 0.6,
        -height * 0.35,
        -width * 0.82,
        0,
      )
      .bezierCurveTo(
        -width * 0.6,
        height * 0.35,
        -width * 0.3,
        height * 0.92,
        0,
        height,
      )
      .bezierCurveTo(
        width * 0.28,
        height * 0.9,
        width * 0.64,
        height * 0.3,
        width,
        0,
      )
      .closePath()
      .fill(species.body)
      .ellipse(0, height * 0.16, width * 0.56, height * 0.32)
      .fill({ color: species.belly, alpha: 0.45 })
      .ellipse(-width * 0.1, -height * 0.42, width * 0.36, height * 0.13)
      .fill({ color: palette.white, alpha: 0.14 })
      .ellipse(0, 0, width * 0.95, height * 0.95)
      .stroke({ width: 1.1, color: palette.ring, alpha: 0.06 });
    this.visual.addChild(body);

    this.addPattern(width, height, species);
    this.addPectoral(width * 0.26, height * 0.24, 12, 5, species);
    this.addEye(width * 0.58, -height * 0.25, 4.2);
    this.addMouth(width * 0.94, 0);
  }

  private buildBetta(species: FishSpecies): void {
    const girth = species.girth;
    const rx = 28;
    const ry = 17 * girth;

    this.addBettaFan(species);

    this.addEllipseBody(rx, ry, species);
    this.addPattern(rx, ry, species);
    this.addPectoral(8, ry * 0.45, 13, 5.5, species);
    this.addEye(19, -ry * 0.34, 3.8);
    this.addMouth(rx * 0.95, 1);
  }

  private buildTetra(species: FishSpecies): void {
    const girth = species.girth;
    const rx = 34;
    const ry = 11 * girth;

    this.addTail("forked", -30, species);
    this.addFin([-8, -ry * 0.8, 0, -ry * 2, 12, -ry * 0.7], species.fin, 0.8);
    this.addEllipseBody(rx, ry, species);
    this.addPattern(rx, ry, species);
    this.addPectoral(7, ry * 0.4, 10, 4, species);
    this.addEye(rx * 0.68, -ry * 0.3, 3);
    this.addMouth(rx * 0.96, 0);
  }

  private buildGuppy(species: FishSpecies): void {
    const girth = species.girth;
    const rx = 27;
    const ry = 12 * girth;

    this.addTail("fan", -25, species);
    this.addFin(
      [-6, -ry * 0.8, 0, -ry * 2.1, 12, -ry * 0.7],
      species.fin,
      0.82,
    );
    this.addEllipseBody(rx, ry, species);
    this.addPattern(rx, ry, species);
    this.addPectoral(7, ry * 0.45, 11, 4.5, species);
    this.addEye(rx * 0.68, -ry * 0.32, 3.2);
    this.addMouth(rx * 0.95, 0);
  }

  private buildLoach(species: FishSpecies): void {
    const girth = species.girth;
    const rx = 38;
    const ry = 11 * girth;

    this.addTail("forked", -32, species);
    this.addFin([-8, -ry * 0.8, 0, -ry * 1.9, 12, -ry * 0.7], species.fin, 0.8);
    this.addEllipseBody(rx, ry, species);
    this.addPattern(rx, ry, species);
    this.addPectoral(9, ry * 0.5, 10, 4, species);
    this.addEye(rx * 0.72, -ry * 0.32, 3);
    this.addMouth(rx * 0.95, 0);

    this.visual.addChild(
      new Graphics()
        .moveTo(rx * 0.95, -1)
        .quadraticCurveTo(rx * 1.2, -3, rx * 1.3, -8)
        .stroke({ width: 1.2, color: species.accent, alpha: 0.6 })
        .moveTo(rx * 0.95, 1)
        .quadraticCurveTo(rx * 1.2, 4, rx * 1.28, 8)
        .stroke({ width: 1.2, color: species.accent, alpha: 0.6 }),
    );
  }

  private addEllipseBody(rx: number, ry: number, species: FishSpecies): void {
    const shadow = shade(species.body, 0.58);
    const body = new Graphics()
      .ellipse(0, 0, rx, ry)
      .fill(species.body)
      .ellipse(0, ry * 0.42, rx * 0.8, ry * 0.3)
      .fill({ color: shadow, alpha: 0.3 })
      .ellipse(2, ry * 0.26, rx * 0.68, ry * 0.42)
      .fill({ color: species.belly, alpha: 0.52 })
      .ellipse(-rx * 0.18, -ry * 0.42, rx * 0.5, ry * 0.2)
      .fill({ color: palette.white, alpha: 0.15 })
      .ellipse(0, 0, rx * 0.98, ry * 0.98)
      .stroke({ width: 1, color: palette.ring, alpha: 0.05 });
    this.visual.addChild(body);
  }

  private addScales(rx: number, ry: number): void {
    const scales = new Graphics();
    for (let row = 0; row < 3; row += 1) {
      for (let column = 0; column < 5; column += 1) {
        const x = -rx * 0.46 + column * rx * 0.23 + (row % 2) * 2;
        const y = -ry * 0.38 + row * ry * 0.23;
        scales
          .moveTo(x - 3, y)
          .quadraticCurveTo(x, y + 2.4, x + 3, y)
          .stroke({ width: 0.8, color: palette.white, alpha: 0.1 });
      }
    }
    this.visual.addChild(scales);
  }

  private addBettaFan(species: FishSpecies): void {
    this.tail.position.set(-22, 0);
    this.tail.scale.set(species.tail);

    const fan = new Graphics()
      .moveTo(0, 0)
      .bezierCurveTo(-20, -16, -48, -50, -66, -40)
      .bezierCurveTo(-76, -14, -76, 14, -66, 40)
      .bezierCurveTo(-48, 50, -20, 16, 0, 0)
      .closePath()
      .fill({ color: species.fin, alpha: 0.86 })
      .ellipse(-36, 0, 19, 29)
      .fill({ color: species.accent, alpha: 0.12 });

    for (let i = 0; i < 9; i += 1) {
      const spread = (i / 8 - 0.5) * 74;
      fan
        .moveTo(-2, 0)
        .quadraticCurveTo(-32, spread * 0.4, -62, spread)
        .stroke({ width: 0.9, color: palette.white, alpha: 0.12 });
    }

    this.tail.addChild(fan);
    this.visual.addChild(this.tail);
  }

  private addTail(
    style: NonNullable<FishSpecies["tailStyle"]>,
    attachX: number,
    species: FishSpecies,
  ): void {
    this.tail.position.set(attachX, 0);
    this.tail.scale.set(species.tail);
    const fin = species.fin;
    const graphics = new Graphics();

    switch (style) {
      case "classic":
        graphics
          .moveTo(0, 0)
          .quadraticCurveTo(-16, -18, -42, -26)
          .quadraticCurveTo(-30, -8, -26, 0)
          .quadraticCurveTo(-30, 8, -42, 26)
          .quadraticCurveTo(-16, 18, 0, 0)
          .closePath()
          .fill(fin);
        break;
      case "forked":
        graphics
          .moveTo(0, 0)
          .lineTo(-38, -24)
          .quadraticCurveTo(-29, -7, -22, 0)
          .quadraticCurveTo(-29, 7, -38, 24)
          .closePath()
          .fill(fin);
        break;
      case "round":
        graphics.ellipse(-22, 0, 24, 19).fill(fin);
        break;
      case "fan":
        graphics
          .moveTo(0, 0)
          .quadraticCurveTo(-22, -34, -47, -29)
          .quadraticCurveTo(-58, 0, -47, 29)
          .quadraticCurveTo(-22, 34, 0, 0)
          .closePath()
          .fill(fin);
        break;
      case "veil":
      default:
        graphics
          .moveTo(0, 0)
          .bezierCurveTo(-20, -20, -52, -38, -70, -26)
          .quadraticCurveTo(-62, -8, -48, 0)
          .quadraticCurveTo(-62, 8, -70, 26)
          .bezierCurveTo(-52, 38, -20, 20, 0, 0)
          .closePath()
          .fill({ color: fin, alpha: 0.92 });
        break;
    }

    // Fin rays and a soft inner highlight add texture to large tails.
    const rayCount = style === "veil" ? 7 : 5;
    for (let i = 0; i < rayCount; i += 1) {
      const spread = (i / Math.max(1, rayCount - 1) - 0.5) * 44;
      graphics
        .moveTo(-1, 0)
        .quadraticCurveTo(-18, spread * 0.35, -44, spread)
        .stroke({
          width: 0.9,
          color: palette.white,
          alpha: 0.11,
        });
    }

    if (style === "fan" || style === "veil") {
      graphics
        .ellipse(-26, 0, 19, 14)
        .fill({ color: palette.white, alpha: 0.07 });
    }

    this.tail.addChild(graphics);
    this.visual.addChild(this.tail);
  }

  private addPattern(rx: number, ry: number, species: FishSpecies): void {
    const pattern = species.pattern ?? "none";
    if (pattern === "none") return;

    const graphics = new Graphics();

    if (pattern === "neon") {
      graphics
        .roundRect(-rx * 0.82, -ry * 0.28, rx * 1.55, ry * 0.3, 1.4)
        .fill({ color: species.fin, alpha: 0.95 })
        .roundRect(-rx * 0.68, ry * 0.06, rx * 1.3, ry * 0.28, 1.2)
        .fill({ color: species.accent, alpha: 0.9 });
    } else if (pattern === "bars") {
      const count = species.id === "loach" ? 6 : species.id === "angel" ? 3 : 4;
      const barWidth =
        rx *
        (species.id === "loach" ? 0.12 : species.id === "angel" ? 0.18 : 0.14);
      for (let i = 0; i < count; i += 1) {
        const t = (i + 0.5) / count;
        const x = -rx * 0.72 + t * rx * 1.35;
        const bodyHeight =
          ry *
          Math.sqrt(Math.max(0.08, 1 - (x / rx) * (x / rx))) *
          (species.id === "angel" ? 1.12 : 0.92);
        graphics
          .roundRect(
            x - barWidth / 2,
            -bodyHeight,
            barWidth,
            bodyHeight * 2,
            barWidth * 0.4,
          )
          .fill({ color: species.accent, alpha: 0.55 });
      }

      if (species.id === "angel") {
        graphics
          .roundRect(rx * 0.22, -ry * 0.2, barWidth * 0.35, ry * 0.4, 1.5)
          .fill({ color: species.accent, alpha: 0.45 });
      }
    } else if (pattern === "spots") {
      for (let i = 0; i < 6; i += 1) {
        const x = -rx * 0.55 + (i / 5) * rx * 1.05;
        const y = (i % 2 === 0 ? -1 : 1) * ry * 0.18;
        const radius = Math.max(1.2, ry * 0.18);
        graphics
          .circle(x, y, radius)
          .fill({ color: species.accent, alpha: 0.6 });
      }
    }

    this.visual.addChild(graphics);
  }

  private addFin(points: number[], color: number, alpha: number): void {
    this.visual.addChild(new Graphics().poly(points).fill({ color, alpha }));
  }

  private addPectoral(
    x: number,
    y: number,
    rx: number,
    ry: number,
    species: FishSpecies,
  ): void {
    this.pectoral
      .ellipse(0, 0, rx, ry)
      .fill({ color: species.fin, alpha: 0.85 })
      .moveTo(-rx, 0)
      .quadraticCurveTo(-rx * 0.3, -ry * 0.5, rx, 0)
      .stroke({ width: 0.7, color: palette.white, alpha: 0.16 });
    this.pectoral.position.set(x, y);
    this.pectoral.rotation = 0.32;
    this.visual.addChild(this.pectoral);
  }

  private addEye(x: number, y: number, radius: number): void {
    this.visual.addChild(
      new Graphics()
        .circle(x, y, radius)
        .fill(palette.cream)
        .circle(x + radius * 0.24, y, radius * 0.54)
        .fill(palette.eye)
        .circle(x + radius * 0.12, y - radius * 0.2, radius * 0.18)
        .fill({ color: palette.white, alpha: 0.9 }),
    );
  }

  private addMouth(x: number, y: number): void {
    this.visual.addChild(
      new Graphics()
        .moveTo(x, y)
        .quadraticCurveTo(x + 3, y + 2, x + 6, y - 1)
        .stroke({ width: 1, color: palette.eye, alpha: 0.45 }),
    );
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

function shade(color: number, factor: number): number {
  const red = Math.min(255, Math.round(((color >> 16) & 0xff) * factor));
  const green = Math.min(255, Math.round(((color >> 8) & 0xff) * factor));
  const blue = Math.min(255, Math.round((color & 0xff) * factor));
  return (red << 16) | (green << 8) | blue;
}
