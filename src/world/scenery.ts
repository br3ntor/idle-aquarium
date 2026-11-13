import {
  BlurFilter,
  Container,
  FillGradient,
  FillPattern,
  Graphics,
  Rectangle,
  Sprite,
  type Texture,
} from "pixi.js";

import { palette } from "../content/palette";
import { randomBetween } from "../core/random";
import { createPlantTextures } from "../render/plantTextures";
import type { PlantTextures } from "../render/plantTextures";
import { createGravelTexture, createRockTexture } from "../render/textures";
import { WORLD } from "./world";

interface Swayer {
  container: Container;
  phase: number;
  speed: number;
  amplitude: number;
}

const TAU = Math.PI * 2;

/**
 * Static tank dressing: sand, rocks and layered plant sprites. Textures are
 * baked once; the only per-frame work is swaying whole plant groups.
 */
export class Scenery {
  readonly back = new Container();
  readonly front = new Container();
  readonly far = new Container();

  private readonly swayers: Swayer[] = [];
  private readonly farBlur = new BlurFilter({
    strength: 2.2,
    quality: 3,
    kernelSize: 5,
  });
  private readonly farArea = new Rectangle();
  private readonly rockPattern = new FillPattern({
    texture: createRockTexture(),
    repetition: "repeat",
    textureSpace: "global",
  });

  constructor(random: () => number) {
    this.farBlur.repeatEdgePixels = true;
    this.far.filters = [this.farBlur];
    this.back.addChild(this.far);

    const textures = createPlantTextures();

    this.addFarLayer(random, textures);
    this.back.addChild(this.buildSand(random));
    this.addHardscape(random);
    this.addMidLayer(random, textures);
    this.addHeroHardscape(random);
    this.addFrontLayer(random, textures);
  }

  update(time: number): void {
    for (const swayer of this.swayers) {
      swayer.container.rotation =
        Math.sin(time * swayer.speed + swayer.phase) * swayer.amplitude;
    }
  }

  /** Keep the far-layer filter texture viewport-sized instead of world-sized. */
  setViewArea(x: number, y: number, width: number, height: number): void {
    this.farArea.set(x, y, width, height);
    this.far.filterArea = this.farArea;
  }

  setDepthBlur(strength: number): void {
    this.farBlur.strength = strength;
    this.farBlur.enabled = strength > 0.001;
  }

  private addFarLayer(random: () => number, textures: PlantTextures): void {
    const count = 32;
    for (let i = 0; i < count; i += 1) {
      const x =
        (i + 0.5) * (WORLD.width / count) + randomBetween(random, -120, 120);
      const giant = random() > 0.8;
      const height = giant
        ? randomBetween(random, 1180, 1480)
        : randomBetween(random, 700, 1180);

      this.addPlantSprite(
        this.far,
        random,
        x,
        WORLD.floorY + randomBetween(random, 15, 80),
        height,
        random() > 0.9
          ? this.pick(textures.stemRed, random)
          : this.pick(textures.stemGreen, random),
        0x83aca2,
        randomBetween(random, 0.45, 0.65),
        0.85,
        0.8,
      );
    }

    for (let i = 0; i < 9; i += 1) {
      const x = randomBetween(random, 80, WORLD.width - 80);
      this.addPlantSprite(
        this.far,
        random,
        x,
        WORLD.floorY + randomBetween(random, 20, 70),
        randomBetween(random, 620, 980),
        this.pick(textures.sword, random),
        0x73978d,
        randomBetween(random, 0.4, 0.55),
        0.7,
        0.85,
      );
    }
  }

  private addHardscape(random: () => number): void {
    for (let i = 0; i < 8; i += 1) {
      const x =
        (i + 0.5) * (WORLD.width / 8) + randomBetween(random, -140, 140);
      this.addRock(
        this.back,
        random,
        x,
        WORLD.floorY + randomBetween(random, 4, 45),
        randomBetween(random, 150, 330),
        randomBetween(random, 65, 150),
      );
    }
  }

  private addHeroHardscape(random: () => number): void {
    const baseY = WORLD.floorY + 32;

    this.addRock(
      this.back,
      random,
      2090,
      baseY,
      640,
      250,
      0x3b473d,
      0x6c7b65,
      1,
    );
    this.addRock(
      this.back,
      random,
      2370,
      baseY + 12,
      560,
      220,
      0x4a574b,
      0x7d8d75,
      1,
    );
    this.addRock(
      this.back,
      random,
      2220,
      baseY - 18,
      430,
      310,
      0x333f36,
      0x5d6d58,
      1,
    );

    const wood = new Graphics();
    const rootX = 2410;
    const rootY = baseY - 30;
    wood
      .moveTo(rootX, rootY)
      .quadraticCurveTo(rootX + 70, rootY - 170, rootX + 210, rootY - 245)
      .stroke({ width: 28, color: palette.driftwood, cap: "round" })
      .moveTo(rootX + 40, rootY - 50)
      .quadraticCurveTo(rootX - 60, rootY - 175, rootX - 170, rootY - 215)
      .stroke({ width: 18, color: palette.driftwood, cap: "round" })
      .moveTo(rootX + 120, rootY - 150)
      .quadraticCurveTo(rootX + 200, rootY - 280, rootX + 320, rootY - 300)
      .stroke({ width: 13, color: palette.driftwood, cap: "round" });

    for (let i = 0; i < 15; i += 1) {
      const mossX = rootX + randomBetween(random, -150, 260);
      const mossY = rootY + randomBetween(random, -260, -20);
      const radius = randomBetween(random, 10, 26);
      wood.ellipse(mossX, mossY, radius, radius * 0.5).fill({
        color: palette.moss,
        alpha: randomBetween(random, 0.18, 0.48),
      });
    }

    this.back.addChild(wood);
  }

  private addMidLayer(random: () => number, textures: PlantTextures): void {
    for (let i = 0; i < 28; i += 1) {
      const x = this.plantX(random);
      this.addPlantSprite(
        this.back,
        random,
        x,
        WORLD.floorY + randomBetween(random, 18, 62),
        randomBetween(random, 320, 760),
        this.pick(textures.stemGreen, random),
        0xd6e7c8,
        randomBetween(random, 0.86, 1),
        1,
        0.9,
      );
    }

    // Red accents are deliberately grouped on the left and far right.
    for (const x of [190, 330, 470, 620, 760, 900, 2520, 2680, 2860, 3020]) {
      this.addPlantSprite(
        this.back,
        random,
        x + randomBetween(random, -55, 55),
        WORLD.floorY + randomBetween(random, 20, 65),
        randomBetween(random, 300, 720),
        this.pick(textures.stemRed, random),
        0xffe4da,
        randomBetween(random, 0.82, 1),
        1,
        0.9,
      );
    }

    for (let i = 0; i < 10; i += 1) {
      this.addPlantSprite(
        this.back,
        random,
        this.plantX(random),
        WORLD.floorY + randomBetween(random, 20, 70),
        randomBetween(random, 300, 560),
        this.pick(textures.sword, random),
        0xb9cfa9,
        randomBetween(random, 0.82, 1),
        0.72,
        0.95,
      );
    }

    // Low carpet in front of the stems, but still behind the fish.
    for (let i = 0; i < 34; i += 1) {
      this.addPlantSprite(
        this.back,
        random,
        randomBetween(random, 40, WORLD.width - 40),
        WORLD.floorY + randomBetween(random, 26, 80),
        randomBetween(random, 45, 115),
        this.pick(textures.grass, random),
        0xd2ecc6,
        randomBetween(random, 0.72, 0.95),
        1.1,
        1.1,
      );
    }
  }

  private addFrontLayer(random: () => number, textures: PlantTextures): void {
    for (let i = 0; i < 12; i += 1) {
      const x =
        (i + 0.25) * (WORLD.width / 12) + randomBetween(random, -90, 90);
      this.addPlantSprite(
        this.front,
        random,
        x,
        WORLD.height + randomBetween(random, 10, 45),
        randomBetween(random, 430, 760),
        random() > 0.74
          ? this.pick(textures.stemRed, random)
          : this.pick(textures.stemGreen, random),
        0x476b58,
        randomBetween(random, 0.78, 0.95),
        0.9,
        1.15,
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

  private pick(textures: Texture[], random: () => number): Texture {
    return textures[Math.floor(random() * textures.length)] as Texture;
  }

  private addPlantSprite(
    parent: Container,
    random: () => number,
    x: number,
    baseY: number,
    height: number,
    texture: Texture,
    tint: number,
    alpha: number,
    widthScale: number,
    swayScale: number,
  ): void {
    const plant = new Container();
    plant.position.set(x, baseY);
    plant.alpha = alpha;

    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5, 1);
    const scale = height / texture.height;
    const facing = random() > 0.5 ? 1 : -1;
    sprite.scale.set(
      scale * widthScale * randomBetween(random, 0.9, 1.1) * facing,
      scale,
    );
    sprite.tint = tint;
    plant.addChild(sprite);
    parent.addChild(plant);

    this.swayers.push({
      container: plant,
      phase: random() * TAU,
      speed: randomBetween(random, 0.16, 0.34),
      amplitude: randomBetween(random, 0.012, 0.032) * swayScale,
    });
  }

  private plantX(random: () => number): number {
    // Keep a relatively open swimming lane through the middle.
    if (random() > 0.14) {
      return random() > 0.5
        ? randomBetween(random, 80, WORLD.width * 0.38)
        : randomBetween(random, WORLD.width * 0.62, WORLD.width - 80);
    }
    return randomBetween(random, WORLD.width * 0.38, WORLD.width * 0.62);
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

    const gravel = new FillPattern({
      texture: createGravelTexture(),
      repetition: "repeat",
      textureSpace: "global",
    });
    const shadow = new FillGradient({
      start: { x: 0, y: 0 },
      end: { x: 0, y: 1 },
      colorStops: [
        { offset: 0, color: "#0a070400" },
        { offset: 0.45, color: "#0a07041c" },
        { offset: 1, color: "#0a07045c" },
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
      .fill(gravel)
      .stroke({ width: 3, color: palette.sandTop, alpha: 0.32 });

    const depth = new Graphics()
      .rect(0, WORLD.floorY + 10, WORLD.width, WORLD.height - WORLD.floorY - 10)
      .fill(shadow);

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

    container.addChild(sand, depth, details);
    return container;
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
    const shadow = new Graphics()
      .ellipse(x, baseY + 4, width * 0.58, 9)
      .fill({ color: palette.rockDeep, alpha: 0.34 });

    const rock = new Graphics();
    rock.alpha = alpha;
    rock
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
      .fill(this.rockPattern);
    rock.tint = color;

    const details = new Graphics();
    details.alpha = alpha;
    details
      .poly([
        x - width * 0.44,
        baseY,
        x - width * 0.32,
        baseY - height * 0.48,
        x - width * 0.08,
        baseY - height * 0.77,
        x + width * 0.02,
        baseY - height * 0.86,
        x + width * 0.05,
        baseY - height * 0.44,
        x - width * 0.12,
        baseY - height * 0.18,
      ])
      .fill({ color: palette.rockDeep, alpha: 0.24 })
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
      .fill({ color: highlight, alpha: 0.38 });

    for (let i = 0; i < 5; i += 1) {
      const crackX = x + randomBetween(random, -width * 0.35, width * 0.34);
      const crackY = baseY - height * randomBetween(random, 0.12, 0.72);
      const length = randomBetween(random, 10, width * 0.18);
      details
        .moveTo(crackX, crackY)
        .quadraticCurveTo(
          crackX + length * 0.5,
          crackY - randomBetween(random, 3, 10),
          crackX + length,
          crackY + randomBetween(random, -4, 4),
        )
        .stroke({ width: 0.9, color: palette.rockDeep, alpha: 0.35 });
    }

    // Moss catches the light on the top of the stone.
    for (let i = 0; i < 7; i += 1) {
      const mossX = x + randomBetween(random, -width * 0.3, width * 0.28);
      const mossY = baseY - height * randomBetween(random, 0.45, 0.86);
      const radius = randomBetween(random, 5, 16);
      details.ellipse(mossX, mossY, radius, radius * 0.55).fill({
        color: palette.moss,
        alpha: randomBetween(random, 0.25, 0.55),
      });
    }

    parent.addChild(shadow, rock, details);
  }
}
