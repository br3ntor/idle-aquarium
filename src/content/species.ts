/**
 * Fish are data-driven: adding a species should mean adding an entry here,
 * not writing new rendering or movement code.
 */
export type FishShape =
  | "classic"
  | "goldfish"
  | "angel"
  | "betta"
  | "tetra"
  | "guppy"
  | "loach";

export type FishPattern = "none" | "neon" | "bars" | "spots";

export type FishTailStyle = "classic" | "fan" | "veil" | "round" | "forked";

export type DepthBand = "top" | "mid" | "bottom" | "any";

export interface FishSpecies {
  id: string;
  /** Main body color. */
  body: number;
  /** Smaller, lighter belly patch. */
  belly: number;
  /** Tail and side-fin color. */
  fin: number;
  /** Detail lines, patterns and other accents. */
  accent: number;
  /** Nose-to-tail length in world units. */
  length: number;
  /** Vertical body thickness multiplier. */
  girth: number;
  /** Tail length multiplier. */
  tail: number;
  /** Cruise speed in world units per second. */
  speed: number;
  /** Maximum turn rate in radians per second. */
  turnRate: number;
  /** Typical distance to roam from the current spot. */
  wander: number;
  /** How strongly this species groups with its own kind (0-1). */
  schooling: number;
  /** Silhouette family used by the renderer. */
  shape?: FishShape;
  /** Optional body pattern. */
  pattern?: FishPattern;
  /** Tail silhouette. */
  tailStyle?: FishTailStyle;
  /** Preferred vertical zone in the tank. */
  depthBand?: DepthBand;
  /** Relative chance of being chosen for an ambient spawn. */
  spawnWeight?: number;
  /** Soft cap for ambient fish of this species. */
  maxPopulation?: number;
}

export const PLAYER_SPECIES: FishSpecies = {
  id: "player",
  body: 0xf4845f,
  belly: 0xffd0a8,
  fin: 0xffa878,
  accent: 0xffe0c4,
  length: 170,
  girth: 1.32,
  tail: 1.2,
  speed: 46,
  turnRate: 2.4,
  wander: 430,
  schooling: 0,
  shape: "goldfish",
  pattern: "none",
  tailStyle: "veil",
  depthBand: "mid",
};

export const NPC_SPECIES: readonly FishSpecies[] = [
  {
    id: "goldfish",
    body: 0xf07a1a,
    belly: 0xffd08a,
    fin: 0xff9e2e,
    accent: 0xfff0c0,
    length: 200,
    girth: 1.35,
    tail: 1.25,
    speed: 30,
    turnRate: 1.7,
    wander: 520,
    schooling: 0,
    shape: "goldfish",
    pattern: "none",
    tailStyle: "veil",
    depthBand: "top",
    spawnWeight: 1,
    maxPopulation: 2,
  },
  {
    id: "angel",
    body: 0xc9d6d2,
    belly: 0xf2f4e8,
    fin: 0xa9b8b1,
    accent: 0x2a2a26,
    length: 150,
    girth: 1.55,
    tail: 0.7,
    speed: 27,
    turnRate: 1.6,
    wander: 430,
    schooling: 0.08,
    shape: "angel",
    pattern: "bars",
    tailStyle: "round",
    depthBand: "mid",
    spawnWeight: 1,
    maxPopulation: 1,
  },
  {
    id: "betta",
    body: 0x1e4fc4,
    belly: 0x4b7bea,
    fin: 0xe8323e,
    accent: 0xff8a76,
    length: 130,
    girth: 1.1,
    tail: 1,
    speed: 24,
    turnRate: 2.1,
    wander: 300,
    schooling: 0,
    shape: "betta",
    pattern: "none",
    tailStyle: "veil",
    depthBand: "mid",
    spawnWeight: 1,
    maxPopulation: 1,
  },
  {
    id: "neon",
    body: 0xbfe8f2,
    belly: 0xf4ffff,
    fin: 0x39c6ff,
    accent: 0xff3b30,
    length: 72,
    girth: 0.78,
    tail: 0.9,
    speed: 56,
    turnRate: 3.5,
    wander: 250,
    schooling: 0.9,
    shape: "tetra",
    pattern: "neon",
    tailStyle: "forked",
    depthBand: "mid",
    spawnWeight: 4,
    maxPopulation: 12,
  },
  {
    id: "guppy",
    body: 0xff8a2a,
    belly: 0xffd39a,
    fin: 0xff5a3c,
    accent: 0x2a1a16,
    length: 80,
    girth: 0.9,
    tail: 1.2,
    speed: 48,
    turnRate: 3,
    wander: 280,
    schooling: 0.35,
    shape: "guppy",
    pattern: "spots",
    tailStyle: "fan",
    depthBand: "top",
    spawnWeight: 2,
    maxPopulation: 4,
  },
  {
    id: "loach",
    body: 0xe8d9b0,
    belly: 0xf7efd5,
    fin: 0xc9b988,
    accent: 0x2a2722,
    length: 95,
    girth: 0.75,
    tail: 0.85,
    speed: 38,
    turnRate: 2.6,
    wander: 320,
    schooling: 0.25,
    shape: "loach",
    pattern: "bars",
    tailStyle: "forked",
    depthBand: "bottom",
    spawnWeight: 2,
    maxPopulation: 4,
  },
  {
    id: "platy",
    body: 0xffb52e,
    belly: 0xffe2a0,
    fin: 0xffcf5a,
    accent: 0xfff4cf,
    length: 78,
    girth: 1.05,
    tail: 0.9,
    speed: 43,
    turnRate: 2.8,
    wander: 300,
    schooling: 0.2,
    shape: "classic",
    pattern: "none",
    tailStyle: "round",
    depthBand: "mid",
    spawnWeight: 2,
    maxPopulation: 4,
  },
];
