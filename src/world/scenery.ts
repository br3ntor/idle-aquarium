import { Container, FillGradient, Graphics } from "pixi.js";

import { palette } from "../content/palette";
import { randomBetween } from "../core/random";
import { WORLD } from "./world";

interface Swayer {
  container: Container;
  phase: number;
  speed: number;
  amplitude: number;
}

/**
 * Static tank dressing: sand, rocks, kelp and coral. Shapes are drawn once;
 * the only per-frame work is swaying whole plant groups a few degrees.
 */
export class Scenery {
  readonly back = new Container();
  readonly front = new Container();

  private readonly swayers: Swayer[] = [];

  constructor(random: () => number) {
    const far = new Container();
    this.back.addChild(far);

    for (let i = 0; i < 13; i += 1) {
      const x = (i / 12) * WORLD.width + randomBetween(random, -80, 80);
      this.addPlant(
        far,
        random,
        x,
        WORLD.floorY + randomBetween(random, 10, 70),
        randomBetween(random, 230, 480),
        palette.weedDeep,
        Math.round(randomBetween(random, 3, 6)),
        randomBetween(random, 1.7, 2.6),
        0.42,
      );
    }

    this.back.addChild(this.buildSand(random));

    for (let i = 0; i < 7; i += 1) {
      const x =
        (i + 0.5) * (WORLD.width / 7) + randomBetween(random, -120, 120);
      this.addRock(
        this.back,
        random,
        x,
        WORLD.floorY + randomBetween(random, 4, 45),
        randomBetween(random, 130, 300),
        randomBetween(random, 55, 135),
      );
    }

    for (let i = 0; i < 17; i += 1) {
      const x = randomBetween(random, 80, WORLD.width - 80);
      const tall = random() > 0.56;
      this.addPlant(
        this.back,
        random,
        x,
        WORLD.floorY + randomBetween(random, 18, 55),
        tall ? randomBetween(random, 170, 350) : randomBetween(random, 55, 150),
        random() > 0.45 ? palette.weed : palette.weedLight,
        Math.round(randomBetween(random, tall ? 3 : 5, tall ? 6 : 9)),
        tall ? randomBetween(random, 1.3, 2.1) : randomBetween(random, 0.6, 1),
      );
    }

    this.addCoralCluster(random, 590, palette.coral);
    this.addCoralCluster(random, 1490, palette.coralLight);
    this.addCoralCluster(random, 2570, palette.coral);

    // A few dark silhouettes in front of the fish give the tank real depth.
    for (let i = 0; i < 7; i += 1) {
      const x =
        (i + 0.35) * (WORLD.width / 7) + randomBetween(random, -100, 100);
      this.addPlant(
        this.front,
        random,
        x,
        WORLD.height + 10,
        randomBetween(random, 230, 440),
        palette.weedDeep,
        Math.round(randomBetween(random, 3, 5)),
        randomBetween(random, 1.8, 2.7),
        0.9,
      );
    }
    this.addRock(
      this.front,
      random,
      40,
      WORLD.height + 8,
      430,
      180,
      palette.rockDeep,
      palette.rock,
      0.95,
    );
    this.addRock(
      this.front,
      random,
      WORLD.width - 20,
      WORLD.height + 10,
      480,
      210,
      palette.rockDeep,
      palette.rock,
      0.9,
    );
  }

  update(time: number): void {
    for (const swayer of this.swayers) {
      swayer.container.rotation =
        Math.sin(time * swayer.speed + swayer.phase) * swayer.amplitude;
    }
  }

  private buildSand(random: () => number): Container {
    const container = new Container();
    const points: { x: number; y: number }[] = [];
    for (let x = 0; x < WORLD.width; x += 150) {
      points.push({
        x,
        y:
          WORLD.floorY +
          Math.sin(x * 0.0031) * 20 +
          Math.sin(x * 0.0083) * 8 +
          randomBetween(random, -5, 5),
      });
    }
    points.push({ x: WORLD.width, y: WORLD.floorY });

    const gradient = new FillGradient({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: palette.sandTop },
        { offset: 0.35, color: palette.sand },
        { offset: 1, color: palette.sandShadow },
      ],
    });

    const sand = new Graphics();
    const first = points[0];
    if (!first) return container;

    sand.moveTo(0, WORLD.height).lineTo(0, first.y);
    for (let i = 1; i < points.length; i += 1) {
      const previous = points[i - 1];
      const current = points[i];
      if (!previous || !current) continue;
      sand.quadraticCurveTo(
        previous.x,
        previous.y,
        (previous.x + current.x) / 2,
        (previous.y + current.y) / 2,
      );
    }
    const last = points[points.length - 1];
    if (last) sand.lineTo(last.x, last.y);
    sand
      .lineTo(WORLD.width, WORLD.height)
      .closePath()
      .fill(gradient)
      .stroke({ width: 4, color: palette.sandTop, alpha: 0.5 });

    const details = new Graphics();
    for (let i = 0; i < 34; i += 1) {
      const x = randomBetween(random, 30, WORLD.width - 30);
      const y = randomBetween(random, WORLD.floorY + 14, WORLD.height - 20);
      const radius = randomBetween(random, 2, 7);
      details.ellipse(x, y, radius, radius * 0.6).fill({
        color: random() > 0.5 ? palette.sandShade : palette.rock,
        alpha: 0.35,
      });
    }

    for (let i = 0; i < 9; i += 1) {
      const x = randomBetween(random, 100, WORLD.width - 100);
      const y = randomBetween(random, WORLD.floorY + 45, WORLD.height - 30);
      const length = randomBetween(random, 70, 200);
      details
        .moveTo(x, y)
        .quadraticCurveTo(x + length * 0.5, y - 7, x + length, y)
        .stroke({ width: 2, color: palette.sandTop, alpha: 0.18 });
    }

    container.addChild(sand, details);
    return container;
  }

  private addPlant(
    parent: Container,
    random: () => number,
    x: number,
    baseY: number,
    height: number,
    color: number,
    blades: number,
    widthScale: number,
    alpha = 1,
  ): void {
    const plant = new Container();
    plant.position.set(x, baseY);
    plant.alpha = alpha;

    const graphics = new Graphics();
    for (let i = 0; i < blades; i += 1) {
      const bladeHeight = height * randomBetween(random, 0.62, 1.15);
      const bladeWidth = randomBetween(random, 5, 10) * widthScale;
      const tip = randomBetween(random, -0.26, 0.26) * height;
      const control = tip * 0.35;

      graphics
        .moveTo(-bladeWidth / 2, 0)
        .quadraticCurveTo(
          -bladeWidth / 2 + control,
          -bladeHeight * 0.55,
          tip,
          -bladeHeight,
        )
        .quadraticCurveTo(
          bladeWidth / 2 + control,
          -bladeHeight * 0.55,
          bladeWidth / 2,
          0,
        )
        .closePath()
        .fill({ color, alpha: randomBetween(random, 0.72, 1) });
    }

    plant.addChild(graphics);
    parent.addChild(plant);
    this.swayers.push({
      container: plant,
      phase: random() * Math.PI * 2,
      speed: randomBetween(random, 0.22, 0.42),
      amplitude: randomBetween(random, 0.018, 0.045),
    });
  }

  private addRock(
    parent: Container,
    random: () => number,
    x: number,
    baseY: number,
    width: number,
    height: number,
    color: number = palette.rock,
    highlight: number = palette.rockLight,
    alpha = 1,
  ): void {
    const rock = new Graphics();
    rock.alpha = alpha;
    rock
      .ellipse(x, baseY + 3, width * 0.55, 8)
      .fill({ color: palette.rockDeep, alpha: 0.25 })
      .poly([
        x - width / 2,
        baseY,
        x - width * 0.43,
        baseY - height * randomBetween(random, 0.38, 0.55),
        x - width * 0.17,
        baseY - height * randomBetween(random, 0.75, 0.9),
        x + width * 0.04,
        baseY - height,
        x + width * 0.34,
        baseY - height * randomBetween(random, 0.55, 0.72),
        x + width / 2,
        baseY,
      ])
      .fill(color)
      .poly([
        x - width * 0.29,
        baseY - height * 0.52,
        x - width * 0.13,
        baseY - height * 0.78,
        x + width * 0.01,
        baseY - height * 0.88,
        x + width * 0.05,
        baseY - height * 0.44,
      ])
      .fill({ color: highlight, alpha: 0.45 });
    parent.addChild(rock);
  }

  private addCoralCluster(
    random: () => number,
    x: number,
    color: number,
  ): void {
    const coral = new Container();
    coral.position.set(x, WORLD.floorY + randomBetween(random, 20, 40));
    const graphics = new Graphics();

    for (let i = 0; i < 5; i += 1) {
      const height = randomBetween(random, 45, 110);
      const spread = randomBetween(random, -34, 34);
      graphics
        .moveTo(spread * 0.2, 0)
        .quadraticCurveTo(spread * 0.5, -height * 0.55, spread, -height)
        .stroke({
          width: randomBetween(random, 5, 9),
          color,
          alpha: randomBetween(random, 0.65, 0.95),
          cap: "round",
        });
    }

    coral.addChild(graphics);
    this.back.addChild(coral);
    this.swayers.push({
      container: coral,
      phase: random() * Math.PI * 2,
      speed: randomBetween(random, 0.18, 0.3),
      amplitude: randomBetween(random, 0.01, 0.025),
    });
  }
}
