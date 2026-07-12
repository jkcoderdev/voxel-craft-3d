import { HeightMapGenerator } from '@/engine/world/HeightMapGenerator';

const MIN_TERRAIN_HEIGHT = 16;
const MAX_TERRAIN_HEIGHT = 48;

export class WorldGenerator {
  private heightMap: HeightMapGenerator;

  constructor(seed: number) {
    this.heightMap = new HeightMapGenerator({
      seed,
      minimumHeight: MIN_TERRAIN_HEIGHT,
      maximumHeight: MAX_TERRAIN_HEIGHT,
      frequency: 0.008,
      transformFunction: (x) => x ** 2,
    });
  }

  block(x: number, y: number, z: number): number {
    const height = this.heightMap.value(x, z);
    if (y <= height) return 1;

    return 0;
  }
}
