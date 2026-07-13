import { PRNG } from '@/engine/math/PRNG';
import { createNoise2D } from 'simplex-noise';

export type NoiseFunction2D = (x: number, y: number) => number;

export function SimplexNoise2D(seed?: number): NoiseFunction2D {
  const prng = PRNG(seed);
  return createNoise2D(prng);
}
