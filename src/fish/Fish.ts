import type { FishSpecies } from "../content/species";
import { clamp, moveToward, turnToward } from "../core/math";
import type { FoodPellet } from "../world/food";
import type { Bounds } from "../world/world";

export interface PointerState {
  x: number;
  y: number;
  active: boolean;
}

export interface FishContext {
  time: number;
  bounds: Bounds;
  neighbors: readonly Fish[];
  foods: readonly FoodPellet[];
  pointer: PointerState;
  speedScale: number;
  turnScale: number;
}

export interface FishOptions {
  id: number;
  species: FishSpecies;
  x: number;
  y: number;
  isPlayer?: boolean;
  random: () => number;
}

/**
 * Simulation state only. There are deliberately no Pixi objects in here:
 * rendering reads this state, and one day the network will serialize it.
 */
export class Fish {
  readonly id: number;
  readonly species: FishSpecies;
  readonly isPlayer: boolean;
  readonly phase: number;

  x: number;
  y: number;
  vx = 0;
  vy = 0;
  heading: number;
  speed: number;

  private readonly random: () => number;
  private readonly cruiseScale: number;
  private wanderX: number;
  private wanderY: number;
  private wanderTimer = 0;

  constructor(options: FishOptions) {
    this.id = options.id;
    this.species = options.species;
    this.isPlayer = options.isPlayer ?? false;
    this.x = options.x;
    this.y = options.y;
    this.random = options.random;
    this.heading = this.random() * Math.PI * 2;
    this.speed = this.species.speed * 0.45;
    this.cruiseScale = 0.88 + this.random() * 0.24;
    this.phase = this.random() * Math.PI * 2;
    this.wanderX = options.x;
    this.wanderY = options.y;
  }

  get length(): number {
    return this.species.length;
  }

  update(dt: number, context: FishContext): void {
    const speedScale = Math.max(0.1, context.speedScale);
    const turnScale = Math.max(0.1, context.turnScale);
    this.wanderTimer -= dt;

    let targetX = this.wanderX;
    let targetY = this.wanderY;
    let stopDistance = 70;
    let hasTarget = false;
    let desiredSpeed =
      this.species.speed *
      this.cruiseScale *
      speedScale *
      (0.92 + Math.sin(context.time * 0.55 + this.phase) * 0.08);

    const food = this.nearestFood(context.foods);
    if (food) {
      targetX = food.x;
      targetY = food.y;
      stopDistance = 16;
      desiredSpeed *= 1.75;
      hasTarget = true;
    } else if (
      this.isPlayer &&
      context.pointer.active &&
      distance(this.x, this.y, context.pointer.x, context.pointer.y) > 105
    ) {
      targetX = context.pointer.x;
      targetY = context.pointer.y;
      stopDistance = 105;
      desiredSpeed *= 1.4;
      hasTarget = true;
    }

    if (!hasTarget) {
      if (
        this.wanderTimer <= 0 ||
        distance(this.x, this.y, this.wanderX, this.wanderY) < 70
      ) {
        this.pickWanderTarget(context.bounds);
      }
      targetX = this.wanderX;
      targetY = this.wanderY;
    }

    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const targetDistance = Math.hypot(dx, dy);

    let desiredVx = 0;
    let desiredVy = 0;

    if (targetDistance > 0.001) {
      const arrival = clamp(targetDistance / stopDistance, 0.25, 1);
      const seekSpeed = desiredSpeed * arrival;
      desiredVx = (dx / targetDistance) * seekSpeed;
      desiredVy = (dy / targetDistance) * seekSpeed;
    }

    let schoolX = 0;
    let schoolY = 0;
    let schoolVx = 0;
    let schoolVy = 0;
    let schoolCount = 0;
    const canSchool = this.species.schooling > 0.01;

    for (const other of context.neighbors) {
      if (other === this) continue;

      const awayX = this.x - other.x;
      const awayY = this.y - other.y;
      const separationDistance = (this.length + other.length) * 0.46;
      const distanceSq = awayX * awayX + awayY * awayY;

      if (
        distanceSq > 0.001 &&
        distanceSq < separationDistance * separationDistance
      ) {
        const distance = Math.sqrt(distanceSq);
        const push = (1 - distance / separationDistance) * 105;
        desiredVx += (awayX / distance) * push;
        desiredVy += (awayY / distance) * push;
      }

      if (
        canSchool &&
        other.species.id === this.species.id &&
        distanceSq < 260 * 260
      ) {
        schoolX += other.x;
        schoolY += other.y;
        schoolVx += other.vx;
        schoolVy += other.vy;
        schoolCount += 1;
      }
    }

    if (schoolCount > 0) {
      schoolX /= schoolCount;
      schoolY /= schoolCount;
      schoolVx /= schoolCount;
      schoolVy /= schoolCount;
      const strength = this.species.schooling;
      desiredVx += (schoolX - this.x) * 0.22 * strength;
      desiredVy += (schoolY - this.y) * 0.22 * strength;
      desiredVx += (schoolVx - this.vx) * 0.3 * strength;
      desiredVy += (schoolVy - this.vy) * 0.3 * strength;
    }

    // Soft boundary avoidance: turn before bumping the glass or the sand.
    const margin = 175;
    const { left, right, top, bottom } = context.bounds;
    if (this.x < left + margin) {
      desiredVx += (1 - (this.x - left) / margin) * 140;
    } else if (this.x > right - margin) {
      desiredVx -= (1 - (right - this.x) / margin) * 140;
    }
    if (this.y < top + margin) {
      desiredVy += (1 - (this.y - top) / margin) * 140;
    } else if (this.y > bottom - margin) {
      desiredVy -= (1 - (bottom - this.y) / margin) * 140;
    }

    const steeringMagnitude = Math.hypot(desiredVx, desiredVy);
    if (steeringMagnitude > 0.5) {
      const desiredHeading = Math.atan2(desiredVy, desiredVx);
      const maxTurn = this.species.turnRate * turnScale * dt;
      this.heading = turnToward(this.heading, desiredHeading, maxTurn);
    }

    const maxSpeed = this.species.speed * 2.1 * speedScale;
    const speedTarget = Math.min(steeringMagnitude, maxSpeed);
    const acceleration = speedTarget > this.speed ? 115 : 190;
    this.speed = moveToward(this.speed, speedTarget, acceleration * dt);

    this.vx = Math.cos(this.heading) * this.speed;
    this.vy = Math.sin(this.heading) * this.speed;
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    this.x = clamp(this.x, context.bounds.left, context.bounds.right);
    this.y = clamp(this.y, context.bounds.top, context.bounds.bottom);
  }

  private nearestFood(foods: readonly FoodPellet[]): FoodPellet | null {
    let closest: FoodPellet | null = null;
    let closestDistance = 450 + this.length * 1.5;

    for (const food of foods) {
      const distanceToFood = distance(this.x, this.y, food.x, food.y);
      if (distanceToFood < closestDistance) {
        closest = food;
        closestDistance = distanceToFood;
      }
    }

    return closest;
  }

  private pickWanderTarget(bounds: Bounds): void {
    const angle = this.random() * Math.PI * 2;
    const radius = this.species.wander * (0.45 + this.random() * 1.1);
    this.wanderX = clamp(
      this.x + Math.cos(angle) * radius,
      bounds.left + 90,
      bounds.right - 90,
    );
    this.wanderY = clamp(
      this.y + Math.sin(angle) * radius * 0.55,
      bounds.top + 70,
      bounds.bottom - 70,
    );
    this.wanderTimer = 2.5 + this.random() * 4;
  }
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}
