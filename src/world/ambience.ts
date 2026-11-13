import { Container, Graphics } from "pixi.js";

import { palette } from "../content/palette";
import { randomBetween } from "../core/random";
import { WORLD } from "./world";

interface Bubble {
  view: Graphics;
  baseX: number;
  y: number;
  speed: number;
  sway: number;
  phase: number;
}

interface Mote {
  view: Graphics;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

/**
 * Bubbles and floating motes. Cheap, constant motion that keeps the water
 * from feeling like a static wallpaper.
 */
export class Ambience {
  readonly root = new Container();

  private readonly bubbles: Bubble[] = [];
  private readonly motes: Mote[] = [];

  constructor(random: () => number) {
    for (let i = 0; i < 32; i += 1) {
      const radius = randomBetween(random, 2, 7.5);
      const view = new Graphics()
        .circle(0, 0, radius)
        .fill({ color: palette.bubble, alpha: 0.05 })
        .stroke({ width: 1, color: palette.bubble, alpha: 0.28 })
        .circle(-radius * 0.25, -radius * 0.25, Math.max(0.8, radius * 0.2))
        .fill({ color: palette.white, alpha: 0.4 });

      const baseX = randomBetween(random, 80, WORLD.width - 80);
      const bubble: Bubble = {
        view,
        baseX,
        y: randomBetween(random, 150, WORLD.floorY - 60),
        speed: randomBetween(random, 14, 38),
        sway: randomBetween(random, 3, 15),
        phase: random() * Math.PI * 2,
      };
      view.position.set(baseX, bubble.y);
      this.root.addChild(view);
      this.bubbles.push(bubble);
    }

    for (let i = 0; i < 48; i += 1) {
      const radius = randomBetween(random, 0.8, 2.1);
      const view = new Graphics().circle(0, 0, radius).fill({
        color: random() > 0.4 ? palette.cream : palette.bubble,
        alpha: randomBetween(random, 0.08, 0.24),
      });
      const mote: Mote = {
        view,
        x: randomBetween(random, 40, WORLD.width - 40),
        y: randomBetween(random, 60, WORLD.floorY - 20),
        vx: randomBetween(random, -6, 10),
        vy: randomBetween(random, -5, 4),
      };
      view.position.set(mote.x, mote.y);
      this.root.addChild(view);
      this.motes.push(mote);
    }
  }

  update(dt: number, time: number): void {
    for (const bubble of this.bubbles) {
      bubble.y -= bubble.speed * dt;
      if (bubble.y < -20) {
        bubble.y = WORLD.floorY + 30;
        bubble.baseX = 80 + Math.random() * (WORLD.width - 160);
      }
      bubble.view.position.set(
        bubble.baseX + Math.sin(time * 0.65 + bubble.phase) * bubble.sway,
        bubble.y,
      );
    }

    for (const mote of this.motes) {
      mote.x += mote.vx * dt;
      mote.y += mote.vy * dt;

      if (mote.x < 20) mote.x = WORLD.width - 20;
      else if (mote.x > WORLD.width - 20) mote.x = 20;
      if (mote.y < 30) mote.y = WORLD.floorY - 30;
      else if (mote.y > WORLD.floorY - 20) mote.y = 30;

      mote.view.position.set(mote.x, mote.y);
    }
  }
}
