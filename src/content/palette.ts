/**
 * One small palette keeps the flat-vector look coherent. Everything in the
 * tank draws from these colors (plus per-species fish colors).
 */
export const palette = {
  waterTop: 0x1a7182,
  waterMid: 0x0a4b5f,
  waterDeep: 0x04293a,
  surfaceGlow: 0x9cecff,

  sandTop: 0xe7d19b,
  sand: 0xd2b078,
  sandShade: 0xa37c4d,
  sandShadow: 0x87653f,

  rockDeep: 0x0e3842,
  rock: 0x1b525d,
  rockLight: 0x2d7077,

  weedDeep: 0x0b3f45,
  weed: 0x146058,
  weedLight: 0x2b806a,

  coral: 0xe87d62,
  coralLight: 0xffab8c,

  cream: 0xfff1d2,
  eye: 0x071e28,
  bubble: 0xc9f5ff,
  ray: 0x9cecff,

  food: 0xffd37a,
  foodGlow: 0xffedb0,

  tagBg: 0x031b24,
  tagText: 0xe9f9ff,
  ring: 0xc9f4ff,
  white: 0xffffff,
} as const;
