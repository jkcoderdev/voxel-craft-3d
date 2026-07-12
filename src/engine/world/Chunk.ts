import type { WorldGenerator } from '@/engine/world/WorldGenerator';

const CHUNK_SIZE = 16;
const CHUNK_HEIGHT = 16;

export class Chunk {
  private readonly data: Uint8Array;

  constructor(
    public readonly cx: number,
    public readonly cz: number,
  ) {
    this.data = new Uint8Array(CHUNK_SIZE * CHUNK_SIZE * CHUNK_HEIGHT);
  }

  getBlock(x: number, y: number, z: number): number {
    return this.data[(y << 8) | (z << 4) | x];
  }

  setBlock(x: number, y: number, z: number, value: number): void {
    this.data[(y << 8) | (z << 4) | x] = value;
  }

  generate(generator: WorldGenerator): void {
    const startX = this.cx * CHUNK_SIZE;
    const startZ = this.cz * CHUNK_SIZE;

    for (let z = 0; z < CHUNK_SIZE; z++) {
      for (let x = 0; x < CHUNK_SIZE; x++) {
        const realX = startX + x;
        const realZ = startZ + z;

        for (let y = 0; y < CHUNK_HEIGHT; y++) {
          const block = generator.block(realX, y, realZ);
          this.setBlock(x, y, z, block);
        }
      }
    }
  }
}
