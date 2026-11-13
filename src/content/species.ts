/**
 * Fish are data-driven: adding a species should mean adding an entry here,
 * not writing new rendering or movement code.
 */
export interface FishSpecies {
  id: string;
  /** Main body color. */
  body: number;
  /** Smaller, lighter belly patch. */
  belly: number;
  /** Tail and side-fin color. */
  fin: number;
  /** Detail lines, highlights and other accents. */
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
}

export const PLAYER_SPECIES: FishSpecies = {
  id: "player",
  body: 0xf4845f,
  belly: 0xffc7a3,
  fin: 0xff9f78,
  accent: 0xffe0c4,
  length: 112,
  girth: 1.14,
  tail: 1.05,
  speed: 48,
  turnRate: 2.7,
  wander: 430,
  schooling: 0,
};

export const NPC_SPECIES: readonly FishSpecies[] = [
  {
    id: "ember",
    body: 0xef7652,
    belly: 0xffbd98,
    fin: 0xff9670,
    accent: 0xffe0c5,
    length: 94,
    girth: 1.1,
    tail: 1,
    speed: 45,
    turnRate: 2.4,
    wander: 420,
    schooling: 0.12,
  },
  {
    id: "sunrise",
    body: 0xf3bd52,
    belly: 0xffe3a1,
    fin: 0xffd27a,
    accent: 0xfff4cf,
    length: 82,
    girth: 1.05,
    tail: 0.95,
    speed: 42,
    turnRate: 2.6,
    wander: 380,
    schooling: 0.3,
  },
  {
    id: "lagoon",
    body: 0x62cfdf,
    belly: 0xb8f3ff,
    fin: 0x8ee6f2,
    accent: 0xd8fbff,
    length: 72,
    girth: 0.95,
    tail: 0.9,
    speed: 50,
    turnRate: 3,
    wander: 300,
    schooling: 0.7,
  },
  {
    id: "lilac",
    body: 0xb392e6,
    belly: 0xdccbff,
    fin: 0xc7aeff,
    accent: 0xeee3ff,
    length: 88,
    girth: 1.02,
    tail: 1.08,
    speed: 38,
    turnRate: 2.2,
    wander: 460,
    schooling: 0.18,
  },
  {
    id: "mint",
    body: 0x70d8ae,
    belly: 0xb8f6dc,
    fin: 0x96ecc9,
    accent: 0xd8fff0,
    length: 68,
    girth: 0.92,
    tail: 0.92,
    speed: 52,
    turnRate: 3.1,
    wander: 280,
    schooling: 0.6,
  },
  {
    id: "rose",
    body: 0xf49bb4,
    belly: 0xffd0dc,
    fin: 0xffb6c8,
    accent: 0xffe7ee,
    length: 78,
    girth: 0.98,
    tail: 1.02,
    speed: 40,
    turnRate: 2.5,
    wander: 360,
    schooling: 0.35,
  },
  {
    id: "slate",
    body: 0x8bafc0,
    belly: 0xc9dfe8,
    fin: 0xabc8d4,
    accent: 0xe3f1f5,
    length: 102,
    girth: 1.18,
    tail: 1.1,
    speed: 35,
    turnRate: 1.9,
    wander: 500,
    schooling: 0,
  },
];
