import type { Texture } from "pixi.js";

import { mulberry32, randomBetween } from "../core/random";
import { bakeTexture } from "./canvas";

const TAU = Math.PI * 2;

/**
 * Procedural, canvas-baked textures. They are generated once at startup and
 * reused everywhere; nothing here redraws per frame.
 */
const bake = bakeTexture;

/** Warm, mixed-size river gravel for the tank floor. */
export function createGravelTexture(seed = 0x51a7c0): Texture {
  const size = 512;

  return bake(size, size, (context) => {
    const random = mulberry32(seed);

    context.fillStyle = "#897252";
    context.fillRect(0, 0, size, size);

    // Soft mottling under the pebbles so the tile doesn't read as flat.
    for (let i = 0; i < 170; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = randomBetween(random, 8, 34);
      context.fillStyle =
        random() > 0.5 ? "rgba(32, 24, 17, 0.18)" : "rgba(238, 218, 180, 0.1)";
      context.beginPath();
      context.ellipse(x, y, radius, radius * 0.62, random() * Math.PI, 0, TAU);
      context.fill();
    }

    const colors = [
      "#eadcb9",
      "#d9c59b",
      "#c3aa7c",
      "#ac9268",
      "#8e7857",
      "#6d5e48",
      "#4b463d",
      "#f3e8cc",
    ];

    for (let i = 0; i < 620; i += 1) {
      const radiusX = randomBetween(random, 2, 10);
      const radiusY = radiusX * randomBetween(random, 0.48, 0.9);
      const x = random() * size;
      const y = random() * size;
      const angle = random() * Math.PI;
      const color = colors[Math.floor(random() * colors.length)] as string;
      const alpha = randomBetween(random, 0.55, 0.96);

      // Draw wrapped copies so the texture tiles cleanly.
      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const px = x + dx * size;
          const py = y + dy * size;
          if (
            px < -radiusX * 2 ||
            px > size + radiusX * 2 ||
            py < -radiusY * 2 ||
            py > size + radiusY * 2
          ) {
            continue;
          }

          context.save();
          context.globalAlpha = alpha;
          context.translate(px, py);
          context.rotate(angle);

          context.fillStyle = color;
          context.beginPath();
          context.ellipse(0, 0, radiusX, radiusY, 0, 0, TAU);
          context.fill();

          context.strokeStyle = "rgba(20, 14, 10, 0.28)";
          context.lineWidth = 0.8;
          context.stroke();

          context.fillStyle = "rgba(255, 250, 230, 0.16)";
          context.beginPath();
          context.ellipse(
            -radiusX * 0.3,
            -radiusY * 0.34,
            radiusX * 0.38,
            radiusY * 0.26,
            -0.4,
            0,
            TAU,
          );
          context.fill();

          context.restore();
        }
      }
    }

    // A few larger stones break up the scale.
    for (let i = 0; i < 16; i += 1) {
      const radiusX = randomBetween(random, 13, 30);
      const radiusY = radiusX * randomBetween(random, 0.55, 0.85);
      const x = random() * size;
      const y = random() * size;
      const angle = random() * Math.PI;

      context.save();
      context.translate(x, y);
      context.rotate(angle);
      context.fillStyle = "rgba(48, 44, 37, 0.55)";
      context.beginPath();
      context.ellipse(0, 0, radiusX, radiusY, 0, 0, TAU);
      context.fill();
      context.fillStyle = "rgba(190, 180, 156, 0.22)";
      context.beginPath();
      context.ellipse(
        -radiusX * 0.2,
        -radiusY * 0.3,
        radiusX * 0.55,
        radiusY * 0.34,
        -0.3,
        0,
        TAU,
      );
      context.fill();
      context.restore();
    }
  });
}

/**
 * Soft caustic light network. Rendered with additive blending at a low alpha
 * and scrolled slowly, so it reads as moving water light rather than lines.
 */
export function createCausticTexture(seed = 0x7a11d5): Texture {
  const size = 512;

  return bake(size, size, (context) => {
    const random = mulberry32(seed);
    context.clearRect(0, 0, size, size);
    context.globalCompositeOperation = "lighter";
    context.filter = "blur(3px)";

    for (let i = 0; i < 46; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const length = randomBetween(random, 60, 190);
      const amplitude = randomBetween(random, 8, 32);
      const start = random() * Math.PI * 2;
      const alpha = randomBetween(random, 0.04, 0.14);
      const width = randomBetween(random, 1, 4.5);

      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const offsetX = dx * size;
          const offsetY = dy * size;
          context.beginPath();
          context.moveTo(offsetX + x, offsetY + y);
          for (let step = 1; step <= 6; step += 1) {
            const t = step / 6;
            context.lineTo(
              offsetX + x + Math.cos(start) * length * t,
              offsetY +
                y +
                Math.sin(start) * length * t +
                Math.sin(start + t * 4.5) * amplitude,
            );
          }
          context.strokeStyle = `rgba(190, 245, 255, ${alpha})`;
          context.lineWidth = width;
          context.stroke();
        }
      }
    }

    // A few soft light pools add depth between the fine lines.
    for (let i = 0; i < 18; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = randomBetween(random, 18, 75);

      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          const px = x + dx * size;
          const py = y + dy * size;
          const gradient = context.createRadialGradient(
            px,
            py,
            0,
            px,
            py,
            radius,
          );
          gradient.addColorStop(0, "rgba(210, 250, 255, 0.08)");
          gradient.addColorStop(1, "rgba(210, 250, 255, 0)");
          context.fillStyle = gradient;
          context.beginPath();
          context.arc(px, py, radius, 0, TAU);
          context.fill();
        }
      }
    }
  });
}

/** Horizontal shimmer for the waterline band. */
export function createSurfaceTexture(seed = 0x3e9f21): Texture {
  const width = 512;
  const height = 256;

  return bake(width, height, (context) => {
    const random = mulberry32(seed);
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";
    context.filter = "blur(5px)";

    for (let i = 0; i < 24; i += 1) {
      const x = random() * width;
      const y = random() * height;
      const length = randomBetween(random, 70, 210);
      const amplitude = randomBetween(random, 2, 12);
      const angle = randomBetween(random, -0.35, 0.35);
      const alpha = randomBetween(random, 0.04, 0.13);
      const lineWidth = randomBetween(random, 1.2, 4);

      for (let dx = -1; dx <= 1; dx += 1) {
        for (let dy = -1; dy <= 1; dy += 1) {
          context.beginPath();
          context.moveTo(x + dx * width, y + dy * height);
          for (let step = 1; step <= 6; step += 1) {
            const t = step / 6;
            context.lineTo(
              x + dx * width + Math.cos(angle) * length * t,
              y +
                dy * height +
                Math.sin(angle) * length * t +
                Math.sin(t * 7 + i) * amplitude,
            );
          }
          context.strokeStyle = `rgba(225, 252, 255, ${alpha})`;
          context.lineWidth = lineWidth;
          context.stroke();
        }
      }
    }
  });
}

/** Mottled stone surface, tinted per rock to keep hardscape varied. */
export function createRockTexture(seed = 0x6b2d91): Texture {
  const size = 256;

  return bake(size, size, (context) => {
    const random = mulberry32(seed);
    context.fillStyle = "#9c9c8e";
    context.fillRect(0, 0, size, size);

    for (let i = 0; i < 220; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = randomBetween(random, 3, 24);
      context.fillStyle =
        random() > 0.48
          ? `rgba(33, 34, 29, ${randomBetween(random, 0.06, 0.22)})`
          : `rgba(224, 222, 198, ${randomBetween(random, 0.04, 0.14)})`;
      context.beginPath();
      context.ellipse(x, y, radius, radius * 0.55, random() * Math.PI, 0, TAU);
      context.fill();
    }

    for (let i = 0; i < 12; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const length = randomBetween(random, 20, 90);
      const angle = random() * Math.PI;
      context.strokeStyle = `rgba(20, 21, 17, ${randomBetween(random, 0.1, 0.3)})`;
      context.lineWidth = randomBetween(random, 0.6, 1.6);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(
        x + Math.cos(angle) * length,
        y + Math.sin(angle) * length,
      );
      context.stroke();
    }

    for (let i = 0; i < 360; i += 1) {
      const x = random() * size;
      const y = random() * size;
      const radius = randomBetween(random, 0.5, 1.7);
      context.fillStyle =
        random() > 0.5 ? "rgba(20, 21, 17, 0.16)" : "rgba(240, 238, 214, 0.12)";
      context.beginPath();
      context.arc(x, y, radius, 0, TAU);
      context.fill();
    }
  });
}

/** Soft photographic vignette, stretched to the viewport. */
export function createVignetteTexture(): Texture {
  const size = 512;

  return bake(size, size, (context) => {
    const centerX = size * 0.5;
    const centerY = size * 0.44;
    const gradient = context.createRadialGradient(
      centerX,
      centerY,
      size * 0.23,
      centerX,
      centerY,
      size * 0.78,
    );
    gradient.addColorStop(0, "rgba(1, 13, 23, 0)");
    gradient.addColorStop(0.56, "rgba(1, 13, 23, 0.025)");
    gradient.addColorStop(0.82, "rgba(1, 13, 23, 0.3)");
    gradient.addColorStop(1, "rgba(1, 13, 23, 0.76)");

    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
  });
}

/** Monochrome grain used as a very light photographic overlay. */
export function createGrainTexture(seed = 0x2f7bca): Texture {
  const size = 128;

  return bake(size, size, (context) => {
    const random = mulberry32(seed);
    const image = context.createImageData(size, size);

    for (let i = 0; i < image.data.length; i += 4) {
      const value = Math.floor(randomBetween(random, 90, 210));
      image.data[i] = value;
      image.data[i + 1] = value;
      image.data[i + 2] = value;
      image.data[i + 3] = Math.floor(randomBetween(random, 8, 28));
    }

    context.putImageData(image, 0, 0);
  });
}
