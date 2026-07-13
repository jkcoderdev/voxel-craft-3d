import { PRNG } from '@/engine/math/PRNG';
import { createNoise3D } from 'simplex-noise';

export type NoiseFunction3D = (x: number, y: number, z: number) => number;

export function SimplexNoise3D(seed?: number): NoiseFunction3D {
  const prng = PRNG(seed);
  return createNoise3D(prng);
}
