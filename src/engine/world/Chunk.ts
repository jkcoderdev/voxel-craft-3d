const MIN_TERRAIN_HEIGHT = 16;
const MAX_TERRAIN_HEIGHT = 32;

export class Chunk {
  private readonly data: Uint8Array;

  constructor(
    public readonly cx: number,
    public readonly cz: number,
  ) {
    this.data = new Uint8Array(16 * 16 * 256);
  }

  getBlock(x: number, y: number, z: number): number {
    return this.data[(y << 8) | (z << 4) | x];
  }

  setBlock(x: number, y: number, z: number, value: number): void {
    this.data[(y << 8) | (z << 4) | x] = value;
  }

  generate(): void {
    this.data.fill(0);

    const startX = this.cx * 16;
    const startZ = this.cz * 16;

    for (let z = 0; z < 16; z++) {
      for (let x = 0; x < 16; x++) {
        const realX = startX + x;
        const realZ = startZ + z;

        const noise = Math.sin((realX / 8) * Math.PI) * Math.sin((realZ / 8) * Math.PI) * 0.5 + 0.5;
        const height = Math.round(noise * (MAX_TERRAIN_HEIGHT - MIN_TERRAIN_HEIGHT)) + MIN_TERRAIN_HEIGHT;

        for (let y = 0; y < height; y++) {
          this.setBlock(x, y, z, 1);
        }
      }
    }
  }
}
