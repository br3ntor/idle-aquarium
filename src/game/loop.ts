/**
 * Fixed-timestep accumulator. Simulation advances in equal steps no matter
 * the monitor refresh rate; rendering happens once per display frame.
 */
export class FixedLoop {
  private accumulator = 0;

  constructor(
    readonly stepSeconds: number,
    private readonly onStep: (dt: number) => void,
  ) {}

  /** Returns the interpolation alpha (0-1) between the last two steps. */
  advance(deltaMS: number): number {
    const frameSeconds = Math.min(deltaMS / 1000, 0.1);
    this.accumulator += frameSeconds;

    let steps = 0;
    while (this.accumulator >= this.stepSeconds && steps < 8) {
      this.onStep(this.stepSeconds);
      this.accumulator -= this.stepSeconds;
      steps += 1;
    }

    // If the tab was asleep, drop the backlog instead of spiralling.
    if (steps === 8) this.accumulator = 0;

    return this.accumulator / this.stepSeconds;
  }
}
