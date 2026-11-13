import {
  Container,
  UPDATE_PRIORITY,
  type Application,
  type Ticker,
} from "pixi.js";

import { NPC_SPECIES, PLAYER_SPECIES } from "../content/species";
import type { FishSpecies } from "../content/species";
import { clamp } from "../core/math";
import { mulberry32, randomBetween } from "../core/random";
import { Fish } from "../fish/Fish";
import { FishView } from "../fish/FishView";
import { PostFX } from "../render/postfx";
import { createDebugPanel, type DebugPanel, type Tuning } from "../ui/debug";
import { Ambience } from "../world/ambience";
import { Backdrop } from "../world/backdrop";
import { FoodField } from "../world/food";
import { Scenery } from "../world/scenery";
import { WaterSurface } from "../world/surface";
import { SWIM_BOUNDS, WORLD, ZOOM_MAX, ZOOM_MIN } from "../world/world";
import { Camera } from "./camera";
import { GameInput } from "./input";
import { FixedLoop } from "./loop";

const STEP_SECONDS = 1 / 60;

export class Game {
  private readonly camera = new Camera();
  private readonly backdrop: Backdrop;
  private readonly scenery: Scenery;
  private readonly surface: WaterSurface;
  private readonly ambience: Ambience;
  private readonly foodField = new FoodField();
  private readonly postFx: PostFX;
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
    npcCount: 28,
    bloom: 0.18,
    depthBlur: 2.2,
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
    this.surface = new WaterSurface();
    this.ambience = new Ambience(this.random);

    this.world.addChild(
      this.scenery.back,
      this.surface.root,
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
    this.postFx = new PostFX(app);

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

    const initialView = this.camera.getViewBounds(180);
    this.scenery.setViewArea(
      initialView.x,
      initialView.y,
      initialView.width,
      initialView.height,
    );

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
    this.postFx.resize(width, height);
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
    const view = this.camera.getViewBounds(180);
    this.scenery.setViewArea(view.x, view.y, view.width, view.height);
    this.scenery.setDepthBlur(this.tuning.depthBlur);
    this.postFx.setBloom(this.tuning.bloom);

    this.camera.apply(this.world);

    for (const fish of this.fishes) {
      this.views.get(fish)?.update(this.time);
    }
    this.scenery.update(this.time);
    this.surface.update(this.time);
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
    const species = this.pickNpcSpecies();
    const mate =
      species.schooling > 0.5
        ? this.fishes.find(
            (fish) => !fish.isPlayer && fish.species.id === species.id,
          )
        : undefined;

    let x: number;
    let y: number;

    if (mate && this.random() < 0.82) {
      x = mate.x + randomBetween(this.random, -120, 120);
      y = mate.y + randomBetween(this.random, -80, 80);
    } else {
      const nearPlayer = index < 9;
      const angle = this.random() * Math.PI * 2;
      const radius = nearPlayer
        ? randomBetween(this.random, 220, 760)
        : randomBetween(this.random, 300, 1400);

      x = nearPlayer
        ? this.player.x + Math.cos(angle) * radius
        : randomBetween(
            this.random,
            SWIM_BOUNDS.left + 80,
            SWIM_BOUNDS.right - 80,
          );
      y = nearPlayer
        ? this.player.y + Math.sin(angle) * radius * 0.6
        : this.spawnY(species);
    }

    const fish = this.createFish(
      species,
      clamp(x, SWIM_BOUNDS.left + 40, SWIM_BOUNDS.right - 40),
      clamp(y, SWIM_BOUNDS.top + 40, SWIM_BOUNDS.bottom - 30),
    );
    this.npcs.push(fish);
  }

  private pickNpcSpecies(): FishSpecies {
    const available = NPC_SPECIES.filter(
      (species) =>
        this.countSpecies(species.id) < (species.maxPopulation ?? Infinity),
    );
    const pool = available.length > 0 ? available : NPC_SPECIES;

    let total = 0;
    for (const species of pool) {
      total += species.spawnWeight ?? 1;
    }

    let roll = this.random() * total;
    for (const species of pool) {
      roll -= species.spawnWeight ?? 1;
      if (roll <= 0) return species;
    }

    return pool[0] as FishSpecies;
  }

  private countSpecies(id: string): number {
    let count = 0;
    for (const fish of this.fishes) {
      if (!fish.isPlayer && fish.species.id === id) count += 1;
    }
    return count;
  }

  private spawnY(species: FishSpecies): number {
    const span = SWIM_BOUNDS.bottom - SWIM_BOUNDS.top;
    const band = species.depthBand ?? "any";
    const minFraction =
      band === "top"
        ? 0.1
        : band === "bottom"
          ? 0.55
          : band === "mid"
            ? 0.2
            : 0.05;
    const maxFraction =
      band === "top"
        ? 0.45
        : band === "bottom"
          ? 0.92
          : band === "mid"
            ? 0.8
            : 0.95;

    return randomBetween(
      this.random,
      SWIM_BOUNDS.top + span * minFraction,
      SWIM_BOUNDS.top + span * maxFraction,
    );
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
