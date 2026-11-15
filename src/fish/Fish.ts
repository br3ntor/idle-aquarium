import type { FishSpecies } from "../content/species";
import { clamp, moveToward, turnToward, wrapAngle } from "../core/math";
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
  /** Smoothed signed turn rate (rad/s). Rendering uses it for fin animation. */
  turnVelocity = 0;

  private readonly random: () => number;
  private readonly cruiseScale: number;
  private readonly speedPhase: number;
  private readonly speedRate: number;
  private readonly speedRateAlt: number;
  private burst = 1;
  private burstTarget = 1;
  private burstTimer = 0;
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
    this.cruiseScale = 0.85 + this.random() * 0.3;
    this.phase = this.random() * Math.PI * 2;
    this.speedPhase = this.random() * Math.PI * 2;
    this.speedRate = 0.35 + this.random() * 0.5;
    this.speedRateAlt = 0.9 + this.random() * 1.1;
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

    this.burstTimer -= dt;
    if (this.burstTimer <= 0) {
      this.burstTarget = this.pickBurst();
      this.burstTimer = 1.2 + this.random() * 3.2;
    }
    this.burst = moveToward(this.burst, this.burstTarget, dt * 0.9);
    const burst = this.isPlayer ? 1 + (this.burst - 1) * 0.5 : this.burst;

    let targetX = this.wanderX;
    let targetY = this.wanderY;
    let stopDistance = 70;
    let hasTarget = false;
    let desiredSpeed =
      this.species.speed *
      this.cruiseScale *
      speedScale *
      this.speedEnvelope(context.time) *
      burst;

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
    const previousHeading = this.heading;
    if (steeringMagnitude > 0.5) {
      const desiredHeading = Math.atan2(desiredVy, desiredVx);
      const maxTurn = this.species.turnRate * turnScale * dt;
      this.heading = turnToward(this.heading, desiredHeading, maxTurn);
    }

    const instantTurn =
      dt > 0 ? wrapAngle(this.heading - previousHeading) / dt : 0;
    this.turnVelocity +=
      (instantTurn - this.turnVelocity) * Math.min(1, dt * 10);

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

  /** Slow, two-frequency drift so fish never cruise at a single fixed speed. */
  private speedEnvelope(time: number): number {
    return (
      1 +
      Math.sin(time * this.speedRate + this.speedPhase) * 0.1 +
      Math.sin(time * this.speedRateAlt + this.speedPhase * 1.7) * 0.07
    );
  }

  /** Occasionally glide or dart instead of cruising, then ease between them. */
  private pickBurst(): number {
    const roll = this.random();
    if (roll < 0.35) return 0.75 + this.random() * 0.1;
    if (roll < 0.85) return 0.95 + this.random() * 0.15;
    return 1.15 + this.random() * 0.15;
  }

  private pickWanderTarget(bounds: Bounds): void {
    const band = this.species.depthBand ?? "any";
    const span = bounds.bottom - bounds.top;
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

    // Prefer long horizontal runs: far along X, only a slight depth change.
    // Continue the current direction and flip early near a wall so fish sweep
    // across the tank instead of grinding into the glass.
    const reach = this.species.wander * (0.8 + this.random() * 1.1);
    const verticalReach = reach * (0.16 + this.random() * 0.22);
    const headingSign = Math.cos(this.heading) >= 0 ? 1 : -1;
    const nearWall =
      headingSign > 0
        ? this.x > bounds.right - 260
        : this.x < bounds.left + 260;
    const sign = nearWall ? -headingSign : headingSign;
    const angle =
      this.random() < 0.8
        ? (sign > 0 ? 0 : Math.PI) + (this.random() * 2 - 1) * 0.6
        : this.random() * Math.PI * 2;

    this.wanderX = clamp(
      this.x + Math.cos(angle) * reach,
      bounds.left + 90,
      bounds.right - 90,
    );
    this.wanderY = clamp(
      this.y + Math.sin(angle) * verticalReach,
      bounds.top + span * minFraction,
      bounds.top + span * maxFraction,
    );
    this.wanderTimer = 4 + this.random() * 5;
  }
}

function distance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}
