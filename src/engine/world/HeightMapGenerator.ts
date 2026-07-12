import { HeightMapCache } from '@/engine/world/HeightMapCache';
import { type NoiseFunction2D, SimplexNoise2D } from '@/math/SimplexNoise2D';

export interface HeightMapGeneratorDescriptor {
  seed: number;
  minimumHeight?: number;
  maximumHeight?: number;
  transformFunction?: (x: number) => number;
}

const DEFAULT_MINIMUM_HEIGHT = 3;
const DEFAULT_MAXIMUM_HEIGHT = 3;
const DEFAULT_TRANSFORM_FUNCTION = (x: number) => x;

export class HeightMapGenerator {
  private readonly noise: NoiseFunction2D;
  private readonly cache: HeightMapCache;

  private readonly minimumHeight: number;
  private readonly maximumHeight: number;
  private readonly transformFunction: (x: number) => number;

  constructor(descriptor: HeightMapGeneratorDescriptor) {
    const seed = descriptor.seed;

    this.noise = SimplexNoise2D(seed);
    this.cache = new HeightMapCache(0x8000);

    this.minimumHeight = descriptor.minimumHeight ?? DEFAULT_MINIMUM_HEIGHT;
    this.maximumHeight = descriptor.maximumHeight ?? DEFAULT_MAXIMUM_HEIGHT;
    this.transformFunction = descriptor.transformFunction ?? DEFAULT_TRANSFORM_FUNCTION;
  }

  value(x: number, z: number): number {
    const value = this.cache.getOrCompute(x, z, () => {
      const min = this.minimumHeight;
      const max = this.maximumHeight;

      const noise = this.transformFunction(this.noise(x, z) * 0.5 + 0.5);

      return Math.round(noise * (max - min) + min);
    });

    return value;
  }
}
