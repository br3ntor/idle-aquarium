/** The tank is a fixed world; the camera is just a window into it. */
export const WORLD = {
  width: 3200,
  height: 1800,
  floorY: 1570,
} as const;

export interface Bounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

/** Fish keep this far from the glass and the sand. */
export const SWIM_BOUNDS: Bounds = {
  left: 120,
  right: WORLD.width - 120,
  top: 120,
  bottom: WORLD.floorY - 90,
};

export const ZOOM_MIN = 0.6;
export const ZOOM_MAX = 1.5;
