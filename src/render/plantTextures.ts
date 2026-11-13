import type { Texture } from "pixi.js";

import { mulberry32, randomBetween } from "../core/random";
import { bakeTexture } from "./canvas";

interface LeafPalette {
  base: string;
  mid: string;
  tip: string;
  edge: string;
  vein: string;
}

const GREEN: LeafPalette = {
  base: "#063426",
  mid: "#176b45",
  tip: "#5eb468",
  edge: "rgba(3, 26, 20, 0.4)",
  vein: "rgba(210, 255, 210, 0.24)",
};

const RED: LeafPalette = {
  base: "#421317",
  mid: "#8c2e30",
  tip: "#d9644d",
  edge: "rgba(32, 8, 10, 0.4)",
  vein: "rgba(255, 214, 198, 0.24)",
};

const GRASS: LeafPalette = {
  base: "#052a1e",
  mid: "#11603c",
  tip: "#73c46a",
  edge: "rgba(3, 24, 16, 0.35)",
  vein: "rgba(225, 255, 215, 0.18)",
};

const SWORD: LeafPalette = {
  base: "#063323",
  mid: "#176b41",
  tip: "#67b96b",
  edge: "rgba(3, 26, 18, 0.45)",
  vein: "rgba(220, 255, 215, 0.26)",
};

const SIZE = 512;

/**
 * Canvas-painted plant sprites. A few high-resolution textures replace a lot
 * of tiny vector leaves and give the tank soft, photographic foliage.
 */
export interface PlantTextures {
  stemGreen: Texture[];
  stemRed: Texture[];
  sword: Texture[];
  grass: Texture[];
}

export function createPlantTextures(seed = 0x2ac71d): PlantTextures {
  return {
    stemGreen: [
      bakeStem(mulberry32(seed + 11), GREEN),
      bakeStem(mulberry32(seed + 23), GREEN),
    ],
    stemRed: [
      bakeStem(mulberry32(seed + 37), RED),
      bakeStem(mulberry32(seed + 41), RED),
    ],
    sword: [bakeSword(mulberry32(seed + 53)), bakeSword(mulberry32(seed + 67))],
    grass: [bakeGrass(mulberry32(seed + 71)), bakeGrass(mulberry32(seed + 83))],
  };
}

function bakeStem(random: () => number, palette: LeafPalette): Texture {
  return bakeTexture(SIZE, SIZE, (context) => {
    context.lineCap = "round";
    context.lineJoin = "round";
    drawBaseShadow(context, 256, 500, 150);

    // Back stems are darker and softer so the clump reads as one plant.
    for (let stem = 0; stem < 3; stem += 1) {
      drawStem(
        context,
        random,
        palette,
        256 + randomBetween(random, -55, 55),
        randomBetween(random, 330, 430),
        randomBetween(random, -95, 95),
        0.38,
      );
    }

    for (let stem = 0; stem < 4; stem += 1) {
      drawStem(
        context,
        random,
        palette,
        256 + randomBetween(random, -42, 42),
        randomBetween(random, 390, 485),
        randomBetween(random, -105, 105),
        randomBetween(random, 0.78, 1),
      );
    }
  });
}

function drawStem(
  context: CanvasRenderingContext2D,
  random: () => number,
  palette: LeafPalette,
  baseX: number,
  height: number,
  lean: number,
  alpha: number,
): void {
  const baseY = 500;
  const topX = baseX + lean;
  const topY = baseY - height;
  const controlX = baseX + lean * 0.25;
  const controlY = baseY - height * 0.55;

  context.globalAlpha = alpha;
  context.strokeStyle = "rgba(8, 42, 28, 0.8)";
  context.lineWidth = 2.4;
  context.beginPath();
  context.moveTo(baseX, baseY);
  context.quadraticCurveTo(controlX, controlY, topX, topY);
  context.stroke();

  const nodes = Math.round(randomBetween(random, 8, 12));
  for (let node = 0; node < nodes; node += 1) {
    const t = 0.08 + (node / nodes) * 0.86;
    const point = quadraticPoint(
      baseX,
      baseY,
      controlX,
      controlY,
      topX,
      topY,
      t,
    );
    const tangent = quadraticTangent(
      baseX,
      baseY,
      controlX,
      controlY,
      topX,
      topY,
      t,
    );
    const leafLength =
      randomBetween(random, 27, 44) * (1 - t * 0.36) * (1 + (1 - alpha) * 0.3);
    const leafWidth = leafLength * randomBetween(random, 0.16, 0.25);
    const spread = 0.55 + (1 - t) * 0.4;

    for (const side of [-1, 1]) {
      context.globalAlpha =
        alpha * randomBetween(random, 0.7, 1) * (0.72 + (1 - t) * 0.3);
      drawLeaf(
        context,
        point.x,
        point.y,
        tangent + side * spread + randomBetween(random, -0.16, 0.16),
        leafLength * randomBetween(random, 0.82, 1.12),
        leafWidth,
        palette,
        randomBetween(random, -5, 5),
      );
    }
  }

  // A small tip bud hides the hard end of the stem.
  context.globalAlpha = alpha;
  context.fillStyle = palette.tip;
  context.beginPath();
  context.ellipse(topX, topY, 3, 8, lean * 0.006, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 1;
}

function bakeSword(random: () => number): Texture {
  return bakeTexture(SIZE, SIZE, (context) => {
    context.lineCap = "round";
    context.lineJoin = "round";
    drawBaseShadow(context, 256, 500, 190);

    const leaves = 11;
    for (let i = 0; i < leaves; i += 1) {
      const back = i < 4;
      const angle =
        -Math.PI / 2 + randomBetween(random, -0.95, 0.95) + (i - 5) * 0.02;
      const length = randomBetween(random, 270, 470) * (back ? 1.05 : 0.9);
      const width = randomBetween(random, 27, 54);
      const bend = randomBetween(random, -38, 38);
      context.globalAlpha = back
        ? randomBetween(random, 0.45, 0.65)
        : randomBetween(random, 0.78, 1);
      drawLeaf(
        context,
        256 + randomBetween(random, -18, 18),
        498,
        angle,
        length,
        width,
        SWORD,
        bend,
      );
    }

    // Short inner leaves brighten the center of the rosette.
    for (let i = 0; i < 4; i += 1) {
      context.globalAlpha = randomBetween(random, 0.7, 0.95);
      drawLeaf(
        context,
        256,
        500,
        -Math.PI / 2 + randomBetween(random, -0.5, 0.5),
        randomBetween(random, 150, 260),
        randomBetween(random, 20, 34),
        SWORD,
        randomBetween(random, -20, 20),
      );
    }
    context.globalAlpha = 1;
  });
}

function bakeGrass(random: () => number): Texture {
  return bakeTexture(SIZE, 160, (context) => {
    context.lineCap = "round";
    context.lineJoin = "round";

    for (let i = 0; i < 76; i += 1) {
      const baseX = 256 + randomBetween(random, -235, 235);
      const angle = -Math.PI / 2 + randomBetween(random, -0.65, 0.65);
      const length = randomBetween(random, 55, 150);
      const width = randomBetween(random, 2.5, 6);
      context.globalAlpha = randomBetween(random, 0.65, 1);
      drawLeaf(
        context,
        baseX,
        158,
        angle,
        length,
        width,
        GRASS,
        randomBetween(random, -8, 8),
      );
    }
    context.globalAlpha = 1;
  });
}

function drawLeaf(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  length: number,
  width: number,
  palette: LeafPalette,
  curl: number,
): void {
  context.save();
  context.translate(x, y);
  context.rotate(angle);

  const gradient = context.createLinearGradient(0, 0, length, 0);
  gradient.addColorStop(0, palette.base);
  gradient.addColorStop(0.55, palette.mid);
  gradient.addColorStop(1, palette.tip);

  context.fillStyle = gradient;
  context.beginPath();
  context.moveTo(0, 0);
  context.bezierCurveTo(
    length * 0.2,
    -width,
    length * 0.65,
    -width * 0.82,
    length,
    curl,
  );
  context.bezierCurveTo(length * 0.65, width * 0.82, length * 0.2, width, 0, 0);
  context.closePath();
  context.fill();

  context.strokeStyle = palette.edge;
  context.lineWidth = 0.8;
  context.stroke();

  context.strokeStyle = palette.vein;
  context.lineWidth = Math.max(0.7, width * 0.055);
  context.beginPath();
  context.moveTo(length * 0.04, 0);
  context.quadraticCurveTo(
    length * 0.55,
    width * 0.04,
    length * 0.96,
    curl * 0.9,
  );
  context.stroke();

  context.strokeStyle = "rgba(255, 255, 255, 0.08)";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(length * 0.14, -width * 0.22);
  context.quadraticCurveTo(
    length * 0.55,
    -width * 0.52,
    length * 0.82,
    curl * 0.55,
  );
  context.stroke();

  context.restore();
}

function drawBaseShadow(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, "rgba(1, 12, 8, 0.38)");
  gradient.addColorStop(0.55, "rgba(1, 12, 8, 0.14)");
  gradient.addColorStop(1, "rgba(1, 12, 8, 0)");
  context.fillStyle = gradient;
  context.beginPath();
  context.ellipse(x, y, radius, radius * 0.28, 0, 0, Math.PI * 2);
  context.fill();
}

function quadraticPoint(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number,
): { x: number; y: number } {
  const inverse = 1 - t;
  return {
    x: inverse * inverse * x0 + 2 * inverse * t * x1 + t * t * x2,
    y: inverse * inverse * y0 + 2 * inverse * t * y1 + t * t * y2,
  };
}

function quadraticTangent(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  t: number,
): number {
  return Math.atan2(
    2 * (1 - t) * (y1 - y0) + 2 * t * (y2 - y1),
    2 * (1 - t) * (x1 - x0) + 2 * t * (x2 - x1),
  );
}
