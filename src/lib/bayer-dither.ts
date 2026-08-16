/**
 * Ordered Bayer dither (same 4×4 matrix as /workspace/web dither-engine).
 */

export const BAYER_4X4 = [
  0 / 16,
  8 / 16,
  2 / 16,
  10 / 16,
  12 / 16,
  4 / 16,
  14 / 16,
  6 / 16,
  3 / 16,
  11 / 16,
  1 / 16,
  9 / 16,
  15 / 16,
  7 / 16,
  13 / 16,
  5 / 16,
] as const

export type DitherMode = 'none' | 'bayer'

/**
 * Ordered Bayer texture: nudge normalized luminance before charset mapping.
 * The full charset stays active, so this is a text texture, not a pixel mode.
 */
export function bayerNudgeLuminance(
  x: number,
  y: number,
  luminance01: number,
  strength = 0.35,
): number {
  const threshold = BAYER_4X4[((y & 3) << 2) | (x & 3)] ?? 0.5
  return Math.min(1, Math.max(0, luminance01 + (threshold - 0.5) * strength))
}
