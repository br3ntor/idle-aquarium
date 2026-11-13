import {
  Container,
  UPDATE_PRIORITY,
  type Application,
  type Ticker,
} from "pixi.js";

import { NPC_SPECIES, PLAYER_SPECIES } from "../content/species";
import type { FishSpecies } from "../content/species";
import { clamp } from "../core/math";
import { mulberry32, randomBetween, randomPick } from "../core/random";
import { Fish } from "../fish/Fish";
import { FishView } from "../fish/FishView";
import { createDebugPanel, type DebugPanel, type Tuning } from "../ui/debug";
import { Ambience } from "../world/ambience";
import { Backdrop } from "../world/backdrop";
import { FoodField } from "../world/food";
import { Scenery } from "../world/scenery";
import { SWIM_BOUNDS, WORLD, ZOOM_MAX, ZOOM_MIN } from "../world/world";
import { Camera } from "./camera";
import { GameInput } from "./input";
import { FixedLoop } from "./loop";

const STEP_SECONDS = 1 / 60;

export class Game {
  private readonly camera = new Camera();
  private readonly backdrop: Backdrop;
  private readonly scenery: Scenery;
  private readonly ambience: Ambience;
  private readonly foodField = new FoodField();
  private readonly world = new Container();
  private readonly fishLayer = new Container();
  private readonly fishes: Fish[] = [];
  private readonly npcs: Fish[] = [];
  private readonly views = new Map<Fish, FishView>();
  private readonly player: Fish;
  private readonly random: () => number;
  private readonly input: GameInput;
  private readonly debug: DebugPanel;
  private readonly loop: FixedLoop;
  private readonly tuning: Tuning = {
    speedScale: 1,
    turnScale: 1,
    zoom: 1,
    npcCount: 18,
    paused: false,
  };

  private time = 0;
  private fps = 60;
  private statsTimer = 0;
  private nextFishId = 1;

  constructor(private readonly app: Application) {
    this.random = mulberry32(0xa9f10c);
    this.camera.setViewport(app.screen.width, app.screen.height);
    this.backdrop = new Backdrop(app.screen.width, app.screen.height);
    this.scenery = new Scenery(this.random);
    this.ambience = new Ambience(this.random);

    this.world.addChild(
      this.scenery.back,
      this.fishLayer,
      this.foodField.root,
      this.ambience.root,
      this.scenery.front,
    );
    this.app.stage.addChild(
      this.backdrop.water,
      this.world,
      this.backdrop.light,
    );

    this.player = this.createFish(
      PLAYER_SPECIES,
      WORLD.width / 2,
      WORLD.floorY - 270,
      true,
      "You",
    );

    // Small screens need a wider view or the fish fills the tank.
    const initialZoom = clamp(app.screen.width / 1100, 0.65, 1);
    this.tuning.zoom = initialZoom;
    this.camera.zoom = initialZoom;
    this.camera.targetZoom = initialZoom;
    this.camera.snapTo(this.player.x, this.player.y);

    for (let i = 0; i < this.tuning.npcCount; i += 1) {
      this.spawnNpc(i);
    }

    this.input = new GameInput(app, this.camera, {
      feed: (x, y) => this.dropFood(x, y),
      zoomBy: (factor) => this.zoomBy(factor),
    });
    this.debug = createDebugPanel(this.tuning);
    this.loop = new FixedLoop(STEP_SECONDS, (dt) => this.step(dt));

    this.app.renderer.on("resize", this.onResize);
  }

  start(): void {
    this.app.ticker.add(this.onTick, undefined, UPDATE_PRIORITY.HIGH);
  }

  private readonly onTick = (ticker: Ticker): void => {
    const frameDt = Math.min(ticker.deltaMS / 1000, 0.1);
    const instantFps = 1 / Math.max(0.0001, frameDt);
    this.fps += (instantFps - this.fps) * 0.08;

    this.syncNpcCount();
    this.camera.targetZoom = this.tuning.zoom;

    this.loop.advance(ticker.deltaMS);
    this.camera.update(frameDt, this.player);
    this.render(frameDt);
  };

  private readonly onResize = (width: number, height: number): void => {
    this.camera.setViewport(width, height);
    this.backdrop.resize(width, height);
  };

  private step(dt: number): void {
    if (this.tuning.paused) return;

    this.time += dt;

    const now = performance.now() / 1000;
    const context = {
      time: this.time,
      bounds: SWIM_BOUNDS,
      neighbors: this.fishes,
      foods: this.foodField.foods,
      pointer: {
        x: this.input.pointerX,
        y: this.input.pointerY,
        active: this.input.isNudgeActive(now),
      },
      speedScale: this.tuning.speedScale,
      turnScale: this.tuning.turnScale,
    };

    for (const fish of this.fishes) {
      fish.update(dt, context);
    }

    this.foodField.update(dt, this.time, WORLD.floorY);
    this.ambience.update(dt, this.time);
    this.eatFood();
  }

  private render(frameDt: number): void {
    this.camera.apply(this.world);

    for (const fish of this.fishes) {
      this.views.get(fish)?.update(this.time);
    }
    this.scenery.update(this.time);
    this.backdrop.update(this.time);

    this.statsTimer -= frameDt;
    if (this.statsTimer <= 0) {
      this.statsTimer = 0.25;
      this.debug.setStats({
        fps: this.fps,
        fish: this.fishes.length,
        zoom: this.camera.zoom,
      });
    }
  }

  private dropFood(x: number, y: number): void {
    if (this.tuning.paused) return;

    const foodX = clamp(x, 40, WORLD.width - 40);
    const foodY = clamp(y, 40, WORLD.floorY - 20);
    this.foodField.spawn(foodX, foodY);
    this.foodField.ripple(foodX, foodY);
  }

  private zoomBy(factor: number): void {
    this.tuning.zoom = clamp(this.tuning.zoom * factor, ZOOM_MIN, ZOOM_MAX);
    this.debug.setZoom(this.tuning.zoom);
  }

  private eatFood(): void {
    for (let i = this.foodField.foods.length - 1; i >= 0; i -= 1) {
      const food = this.foodField.foods[i];
      if (!food) continue;

      let closest = Number.POSITIVE_INFINITY;
      let eaten = false;

      for (const fish of this.fishes) {
        const dx = fish.x - food.x;
        const dy = fish.y - food.y;
        const distanceSq = dx * dx + dy * dy;
        const reach = fish.length * 0.34 + 12;
        if (distanceSq < reach * reach && distanceSq < closest) {
          closest = distanceSq;
          eaten = true;
        }
      }

      if (eaten) {
        this.foodField.remove(food);
        this.foodField.ripple(food.x, food.y);
      }
    }
  }

  private createFish(
    species: FishSpecies,
    x: number,
    y: number,
    isPlayer = false,
    label?: string,
  ): Fish {
    const fish = new Fish({
      id: this.nextFishId,
      species,
      x,
      y,
      isPlayer,
      random: this.random,
    });
    this.nextFishId += 1;

    const view = new FishView(fish, label);
    this.views.set(fish, view);
    this.fishes.push(fish);
    this.fishLayer.addChild(view);
    return fish;
  }

  private spawnNpc(index: number): void {
    const nearPlayer = index < 7;
    const angle = this.random() * Math.PI * 2;
    const radius = nearPlayer
      ? randomBetween(this.random, 220, 760)
      : randomBetween(this.random, 300, 1400);

    const x = nearPlayer
      ? this.player.x + Math.cos(angle) * radius
      : randomBetween(
          this.random,
          SWIM_BOUNDS.left + 80,
          SWIM_BOUNDS.right - 80,
        );
    const y = nearPlayer
      ? this.player.y + Math.sin(angle) * radius * 0.6
      : randomBetween(
          this.random,
          SWIM_BOUNDS.top + 100,
          SWIM_BOUNDS.bottom - 40,
        );

    const species = randomPick(this.random, NPC_SPECIES);
    const fish = this.createFish(
      species,
      clamp(x, SWIM_BOUNDS.left + 40, SWIM_BOUNDS.right - 40),
      clamp(y, SWIM_BOUNDS.top + 40, SWIM_BOUNDS.bottom - 30),
    );
    this.npcs.push(fish);
  }

  private syncNpcCount(): void {
    while (this.npcs.length < this.tuning.npcCount) {
      this.spawnNpc(this.npcs.length);
    }

    while (this.npcs.length > this.tuning.npcCount) {
      const fish = this.npcs.pop();
      if (!fish) break;
      this.removeFish(fish);
    }
  }

  private removeFish(fish: Fish): void {
    const index = this.fishes.indexOf(fish);
    if (index >= 0) this.fishes.splice(index, 1);

    const view = this.views.get(fish);
    if (view) {
      this.views.delete(fish);
      view.removeFromParent();
      view.destroy({ children: true, context: true, style: true });
    }
  }
}
