import { Container, Graphics } from "pixi.js";

import { palette } from "../content/palette";

export interface FoodPellet {
  id: number;
  x: number;
  y: number;
  baseX: number;
  radius: number;
  age: number;
  phase: number;
  view: Graphics;
}

interface Ripple {
  view: Graphics;
  age: number;
  duration: number;
}

const MAX_FOOD = 12;
const FOOD_LIFETIME = 30;

/**
 * Food is a tiny shared object of interest: any nearby fish may race for it.
 * Clicking also leaves a ripple, which makes the tank feel responsive.
 */
export class FoodField {
  readonly root = new Container();
  readonly foods: FoodPellet[] = [];

  private readonly ripples: Ripple[] = [];
  private nextId = 1;

  spawn(x: number, y: number): void {
    if (this.foods.length >= MAX_FOOD) {
      const oldest = this.foods[0];
      if (oldest) this.remove(oldest);
    }

    const view = new Graphics()
      .circle(0, 0, 10)
      .fill({ color: palette.foodGlow, alpha: 0.16 })
      .circle(0, 0, 4.5)
      .fill(palette.food)
      .circle(-1.3, -1.5, 1.6)
      .fill({ color: palette.white, alpha: 0.75 });

    view.position.set(x, y);
    this.root.addChild(view);

    this.foods.push({
      id: this.nextId,
      x,
      y,
      baseX: x,
      radius: 9,
      age: 0,
      phase: Math.random() * Math.PI * 2,
      view,
    });
    this.nextId += 1;
  }

  ripple(x: number, y: number): void {
    const view = new Graphics()
      .circle(0, 0, 26)
      .stroke({ width: 1.6, color: palette.bubble, alpha: 0.55 });
    view.position.set(x, y);
    view.scale.set(0.3);
    this.root.addChild(view);
    this.ripples.push({ view, age: 0, duration: 1.35 });
  }

  remove(food: FoodPellet): void {
    const index = this.foods.indexOf(food);
    if (index >= 0) this.foods.splice(index, 1);
    food.view.removeFromParent();
    food.view.destroy();
  }

  update(dt: number, time: number, floorY: number): void {
    for (let i = this.foods.length - 1; i >= 0; i -= 1) {
      const food = this.foods[i] as FoodPellet;
      food.age += dt;
      food.y = Math.min(floorY - 8, food.y + 9 * dt);
      food.x = food.baseX + Math.sin(time * 1.7 + food.phase) * 3.5;
      food.view.position.set(
        food.x,
        food.y + Math.sin(time * 2.1 + food.phase) * 1.5,
      );
      food.view.rotation += 0.5 * dt;

      if (food.age > FOOD_LIFETIME) this.remove(food);
    }

    for (let i = this.ripples.length - 1; i >= 0; i -= 1) {
      const ripple = this.ripples[i] as Ripple;
      ripple.age += dt;
      const progress = ripple.age / ripple.duration;
      const scale = 0.3 + progress * 2.8;
      ripple.view.scale.set(scale);
      ripple.view.alpha = Math.max(0, (1 - progress) * 0.55);

      if (progress >= 1) {
        ripple.view.removeFromParent();
        ripple.view.destroy();
        this.ripples.splice(i, 1);
      }
    }
  }
}
