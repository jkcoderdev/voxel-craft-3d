import { HeightMapCache } from '@/engine/world/HeightMapCache';
import { type NoiseFunction2D, SimplexNoise2D } from '@/math/SimplexNoise2D';

export interface HeightMapGeneratorDescriptor {
  seed: number;
  minimumHeight?: number;
  maximumHeight?: number;
  frequency?: number;
  transformFunction?: (x: number) => number;
}

const DEFAULT_FREQUENCY = 0.01;
const DEFAULT_MINIMUM_HEIGHT = 3;
const DEFAULT_MAXIMUM_HEIGHT = 3;
const DEFAULT_TRANSFORM_FUNCTION = (x: number) => x;

function clamp(value: number, min: number, max: number) {
  if (value > max) return max;
  if (value < min) return min;

  return value;
}

export class HeightMapGenerator {
  private readonly noise: NoiseFunction2D;
  private readonly cache: HeightMapCache;

  private readonly minimumHeight: number;
  private readonly maximumHeight: number;
  private readonly frequency: number;
  private readonly transformFunction: (x: number) => number;

  constructor(descriptor: HeightMapGeneratorDescriptor) {
    const seed = descriptor.seed;

    this.noise = SimplexNoise2D(seed);
    this.cache = new HeightMapCache(0x8000);

    this.minimumHeight = descriptor.minimumHeight ?? DEFAULT_MINIMUM_HEIGHT;
    this.maximumHeight = descriptor.maximumHeight ?? DEFAULT_MAXIMUM_HEIGHT;
    this.frequency = descriptor.frequency ?? DEFAULT_FREQUENCY;
    this.transformFunction = descriptor.transformFunction ?? DEFAULT_TRANSFORM_FUNCTION;
  }

  value(x: number, z: number): number {
    const value = this.cache.getOrCompute(x, z, () => {
      const min = this.minimumHeight;
      const max = this.maximumHeight;

      const noise = clamp(this.transformFunction(this.noise(x * this.frequency, z * this.frequency) * 0.5 + 0.5), 0, 1);

      return Math.round(noise * (max - min) + min);
    });

    return value;
  }
}
