/**
 * One small palette keeps the look coherent. Everything in the tank draws
 * from these colors (plus per-species fish colors).
 */
export const palette = {
  waterTop: 0x0f5b7d,
  waterMid: 0x062f4a,
  waterDeep: 0x010d17,
  surfaceGlow: 0xbdefff,

  sandTop: 0xf1e2bc,
  sand: 0xd4ba8c,
  sandShade: 0x9a7b55,
  sandShadow: 0x4f3a28,

  rockDeep: 0x071616,
  rock: 0x1e2b27,
  rockLight: 0x455648,

  weedDeep: 0x052b24,
  weed: 0x0e5b3d,
  weedLight: 0x2f9659,
  weedBright: 0x6acb6b,
  weedRed: 0x9e3434,
  weedRedLight: 0xd85a45,

  coral: 0xc94f3d,
  coralLight: 0xf07a5a,

  moss: 0x3f7a3a,
  driftwood: 0x3a2a1e,

  cream: 0xfff2d8,
  eye: 0x06141a,
  bubble: 0xc9f5ff,
  ray: 0xbdefff,
  caustic: 0xd6fbff,

  food: 0xffc76a,
  foodGlow: 0xffe9a8,

  tagBg: 0x021018,
  tagText: 0xe9f9ff,
  ring: 0xc9f4ff,
  white: 0xffffff,
} as const;
